/**
 * 刷题模式 — Host LLM 调用封装（llm.js）。
 *
 * 把 DeepSeek Harness 的 `ctx.llm` 流式接口封装成刷题管线需要的简单形态：
 *   - selection()：取 `ctx.agentDefaultModel.currentSelection()`（由 getDefaultModel 注入），
 *     取不到时回退到 deepseek-official / deepseek-flash；
 *   - supportsImages()：通过 `ctx.llm.resolveModelInfo(provider, model)` 的 inputModalities 判断；
 *   - complete / stream：把本地绝对路径的页面图片经 `ctx.attachments.saveImage` 落成持久
 *     attachment（按「绝对路径 + mediaType + 文件指纹」缓存，避免重复保存），再作为 ImageBlock
 *     随 user 消息发送；聚合 text-delta，finish 为 error/aborted 时抛中文 Error。
 *
 * 工厂签名（docs/CONTRACT.md 5.4）：
 *   createLlm({ getLlm, getAttachments, getDefaultModel, logger }) -> llm
 */

import { readFile, stat } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

const FALLBACK_SELECTION = { provider: 'deepseek-official', model: 'deepseek-flash' };
const ALLOWED_MEDIA_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const IMAGE_CACHE_LIMIT = 256;

/** 稳定错误码 → 中文可读原因。 */
const FAILURE_TEXT = {
	NO_ADAPTER: '当前模型路由不可用（提供方未注册或已下线）',
	MISSING_CREDENTIAL: '模型凭据未配置，无法调用模型',
	INVALID_CREDENTIAL: '模型凭据无效，请检查账号配置',
	AUTH: '模型鉴权失败，请检查账号配置',
	RATE_LIMIT: '模型请求过于频繁，请稍后重试',
	QUOTA: '模型额度不足，请检查账号额度',
	ACCOUNT_QUOTA: '模型账号额度不足，请充值后重试',
	CONTEXT_WINDOW_EXCEEDED: '内容超出模型上下文长度，请减少材料后重试',
	UNSUPPORTED_REASONING_EFFORT: '当前模型不支持所选推理强度',
	ABORTED: '生成已取消',
	TIMEOUT: '模型调用超时，请稍后重试',
	EMPTY_RESPONSE: '模型没有返回任何内容'
};

/** @returns {boolean} */
function isPlainObject(value) {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 任意值 → 非空字符串（失败时返回空串）。 */
function asString(value) {
	if (typeof value === 'string') return value.trim();
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	return '';
}

/** 把模型调用失败统一翻成中文 Error。 */
function toChineseError(input) {
	if (input instanceof Error && input.code === 'PRACTICE_LLM_ERROR') return input;
	const failure = isPlainObject(input) && isPlainObject(input.failure) ? input.failure : input;
	const code = isPlainObject(failure) ? asString(failure.code) : '';
	const detail = isPlainObject(failure) ? asString(failure.message) : '';
	const fallbackDetail = input instanceof Error ? asString(input.message) : '';
	const mapped = FAILURE_TEXT[code];
	let message;
	if (mapped !== undefined) message = detail === '' ? mapped : `${mapped}（${detail}）`;
	else if (detail !== '') message = `模型调用失败：${detail}`;
	else if (fallbackDetail !== '') message = `模型调用失败：${fallbackDetail}`;
	else message = '模型调用失败，请稍后重试。';
	const error = new Error(message);
	error.code = 'PRACTICE_LLM_ERROR';
	error.llmCode = code || undefined;
	if (input instanceof Error) error.cause = input;
	return error;
}

/** 判断是否为「不支持推理强度」错误。 */
function isUnsupportedEffort(error) {
	const code = isPlainObject(error) ? asString(error.code) : '';
	return code === 'UNSUPPORTED_REASONING_EFFORT' || /reasoning effort/i.test(asString(error instanceof Error ? error.message : ''));
}

/** finish 分片原因 → 中文错误；成功返回 null。 */
function finishError(reason) {
	const kind = isPlainObject(reason) ? asString(reason.kind) : '';
	if (kind !== 'error' && kind !== 'aborted') return null;
	const failure = isPlainObject(reason) && isPlainObject(reason.failure) ? reason.failure : reason;
	if (kind === 'aborted') {
		const code = isPlainObject(failure) ? asString(failure.code) : '';
		const detail = isPlainObject(failure) ? asString(failure.message) : asString(failure);
		return toChineseError({ code: code === '' ? 'ABORTED' : code, message: detail });
	}
	return toChineseError(failure);
}

/**
 * 创建 llm 封装。
 *
 * @param {object} deps
 * @param {() => (object|undefined)} deps.getLlm 返回 ctx.llm
 * @param {() => (object|undefined)} deps.getAttachments 返回 ctx.attachments
 * @param {() => ({provider?: string, model?: string, reasoningEffort?: string}|undefined)} deps.getDefaultModel
 * @param {{warn?: Function, info?: Function, error?: Function, debug?: Function}} [deps.logger]
 * @returns {object} llm
 */
export function createLlm({ getLlm, getAttachments, getDefaultModel, logger } = {}) {
	/** 页面图片 → ImageBlock 的缓存：key 为「路径 + mediaType + 指纹」。 */
	const imageCache = new Map();

	function log(level, message, error) {
		try {
			const text = error === undefined ? message : `${message}：${error instanceof Error ? error.message : String(error)}`;
			(logger?.[level] ?? logger?.warn)?.call?.(logger, text);
		} catch {
			/* 日志失败不影响主流程 */
		}
	}

	/** 读取底层服务。 */
	function llmService() {
		const llm = typeof getLlm === 'function' ? getLlm() : undefined;
		return llm !== undefined && llm !== null && typeof llm.stream === 'function' ? llm : undefined;
	}

	/** 当前模型选择。 */
	function selection() {
		let raw;
		try {
			raw = typeof getDefaultModel === 'function' ? getDefaultModel() : undefined;
		} catch (error) {
			log('warn', '读取默认模型失败，已回退到默认路由', error);
			raw = undefined;
		}
		const provider = asString(raw?.provider) || FALLBACK_SELECTION.provider;
		const model = asString(raw?.model) || FALLBACK_SELECTION.model;
		const reasoningEffort = asString(raw?.reasoningEffort);
		return reasoningEffort === '' ? { provider, model } : { provider, model, reasoningEffort };
	}

	/** 是否可用。 */
	function available() {
		return llmService() !== undefined;
	}

	/** 当前模型是否支持图片输入。 */
	async function supportsImages() {
		const llm = llmService();
		if (llm === undefined || typeof llm.resolveModelInfo !== 'function') return false;
		const { provider, model } = selection();
		try {
			const info = await llm.resolveModelInfo(provider, model);
			return Array.isArray(info?.inputModalities) && info.inputModalities.includes('image');
		} catch (error) {
			log('warn', '无法解析模型能力（inputModalities），按不支持图片处理', error);
			return false;
		}
	}

	/** 缓存键（含文件大小与修改时间，页面图重渲染后路径不变但内容会变）。 */
	async function cacheKeyFor(path, mediaType) {
		try {
			const info = await stat(path);
			return `${mediaType}\u0000${path}\u0000${info.size}\u0000${Math.trunc(info.mtimeMs)}`;
		} catch {
			return `${mediaType}\u0000${path}`;
		}
	}

	/** 把本地图片保存为 attachment，返回 ImageBlock 数组。 */
	async function resolveImageBlocks(images) {
		const list = Array.isArray(images) ? images.filter((image) => isPlainObject(image) && asString(image.path) !== '') : [];
		if (list.length === 0) return [];
		const attachments = typeof getAttachments === 'function' ? getAttachments() : undefined;
		if (attachments === undefined || attachments === null || typeof attachments.saveImage !== 'function') {
			throw new Error('当前运行环境不支持图片输入，无法解析题目页面。');
		}
		const modelSupportsImages = await supportsImages();
		if (!modelSupportsImages) {
			throw new Error('当前模型不支持图片输入，无法解析题目页面，请在设置中切换到支持视觉的模型。');
		}
		const blocks = [];
		for (const image of list) {
			const path = resolve(asString(image.path));
			const mediaType = asString(image.mediaType) || 'image/png';
			if (!ALLOWED_MEDIA_TYPES.has(mediaType)) {
				throw new Error(`不支持的图片类型：${mediaType}（仅支持 PNG/JPEG/WebP/GIF）。`);
			}
			const key = await cacheKeyFor(path, mediaType);
			let ref = imageCache.get(key);
			if (ref === undefined) {
				let bytes;
				try {
					bytes = await readFile(path);
				} catch (error) {
					throw new Error(`题目页面图片读取失败：${path}（${error instanceof Error ? error.message : String(error)}）`);
				}
				try {
					ref = await attachments.saveImage({
						data: new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength),
						mediaType,
						name: basename(path)
					});
				} catch (error) {
					throw new Error(`题目页面图片无法发送给模型：${error instanceof Error ? error.message : String(error)}`);
				}
				imageCache.set(key, ref);
				// 简单 LRU：超出上限时删掉最早插入的。
				if (imageCache.size > IMAGE_CACHE_LIMIT) {
					const oldest = imageCache.keys().next();
					if (!oldest.done) imageCache.delete(oldest.value);
				}
			}
			blocks.push({ type: 'image', attachment: ref });
		}
		return blocks;
	}

	/** 组装一次流式调用的参数。 */
	async function buildStreamOptions({ system, userText, images, maxTokens, temperature, signal } = {}) {
		const llm = llmService();
		if (llm === undefined) throw new Error('模型服务尚未就绪，无法调用模型。');
		const current = selection();
		const content = [];
		const text = typeof userText === 'string' ? userText : '';
		if (text !== '') content.push({ type: 'text', text });
		const imageBlocks = await resolveImageBlocks(images);
		content.push(...imageBlocks);
		if (content.length === 0) content.push({ type: 'text', text: '（无输入内容）' });
		const options = {
			provider: current.provider,
			model: current.model,
			messages: [{ role: 'user', content }]
		};
		if (current.reasoningEffort !== undefined) options.reasoningEffort = current.reasoningEffort;
		const systemText = typeof system === 'string' ? system : '';
		if (systemText.trim() !== '') options.system = systemText;
		if (Number.isFinite(maxTokens) && maxTokens > 0) options.maxTokens = Math.floor(maxTokens);
		if (Number.isFinite(temperature)) options.temperature = temperature;
		if (signal !== undefined && signal !== null) options.signal = signal;
		return { llm, options };
	}

	/**
	 * 底层流式调用：产出 {type:'delta'|'reasoning'|'done', text?}。
	 * finish.kind 为 error/aborted 时抛中文 Error；模型无输出时抛错。
	 */
	async function* pump({ system, userText, images, maxTokens, temperature, signal } = {}) {
		const { llm, options } = await buildStreamOptions({ system, userText, images, maxTokens, temperature, signal });
		let emitted = 0;
		let sawFinish = false;
		let retriedEffort = false;
		// 不支持推理强度时去掉 reasoningEffort 重试一次（只在还没产生任何输出前）。
		for (;;) {
			try {
				for await (const chunk of llm.stream(options)) {
					if (signal?.aborted === true) throw toChineseError({ code: 'ABORTED', message: '' });
					if (!isPlainObject(chunk)) continue;
					if (chunk.type === 'text-delta') {
						const delta = asString(chunk.text);
						if (delta === '') continue;
						emitted += 1;
						yield { type: 'delta', text: delta };
					} else if (chunk.type === 'reasoning-delta') {
						const delta = asString(chunk.text);
						if (delta !== '') yield { type: 'reasoning', text: delta };
					} else if (chunk.type === 'finish') {
						sawFinish = true;
						const error = finishError(chunk.reason);
						if (error !== null) throw error;
					}
				}
				break;
			} catch (error) {
				if (!retriedEffort && emitted === 0 && options.reasoningEffort !== undefined && isUnsupportedEffort(error)) {
					retriedEffort = true;
					log('warn', '当前模型不支持所选推理强度，已自动回退重试');
					delete options.reasoningEffort;
					continue;
				}
				throw toChineseError(error);
			}
		}
		if (emitted === 0) {
			throw toChineseError({ code: 'EMPTY_RESPONSE', message: sawFinish ? '模型返回了空内容，请重试' : '' });
		}
		yield { type: 'done' };
	}

	/**
	 * 流式调用。
	 * @returns {AsyncIterable<{type:'delta'|'reasoning'|'done', text?: string}>}
	 */
	function stream({ system, userText, images, maxTokens, temperature, signal } = {}) {
		return pump({ system, userText, images, maxTokens, temperature, signal });
	}

	/**
	 * 一次性调用（内部走流式并聚合文本）。
	 * @returns {Promise<{text: string}>}
	 */
	async function complete({ system, userText, images, maxTokens, temperature, signal } = {}) {
		let text = '';
		for await (const event of stream({ system, userText, images, maxTokens, temperature, signal })) {
			if (event.type === 'delta') text += event.text;
		}
		if (text.trim() === '') throw toChineseError({ code: 'EMPTY_RESPONSE', message: '' });
		return { text: text.trim() };
	}

	/** 清空图片附件缓存（测试或切换模型后可用）。 */
	function clearImageCache() {
		imageCache.clear();
	}

	return {
		available,
		selection,
		supportsImages,
		complete,
		stream,
		clearImageCache
	};
}
