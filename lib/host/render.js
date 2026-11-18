/**
 * 刷题模式 — LibreOffice Kit 渲染封装（render.js）。
 *
 * 通过 paths.js 解析出的 Node 运行时 + LibreOffice Kit CLI 执行：
 *   - officeToPdf：把 docx/pptx/doc/ppt 等 Office 文档转成 PDF（`convert` 子命令）；
 *   - renderPages：把 PDF 逐页渲染成 PNG（`render` 子命令，`--dpi 120 --pages all`）；
 *   - available：探测 CLI 与运行时是否可用。
 *
 * CLI 把一次调用的结果以 JSON 输出到 stdout（失败时为 stderr 上的 JSON），
 * 成功/失败都必须转成中文 Error，超时 180s。
 */

import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { resolveNodeBinary, resolveOfficeCli } from './paths.js';

const DEFAULT_TIMEOUT_MS = 180_000;
const PROBE_TIMEOUT_MS = 60_000;
const MAX_BUFFER = 16 * 1024 * 1024;
const MIN_DPI = 24;
const MAX_DPI = 600;

/** @returns {boolean} */
function isPlainObject(value) {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 任意值 → 去空白字符串。 */
function asString(value) {
	if (typeof value === 'string') return value.trim();
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	return '';
}

/** 从 CLI 输出文本里提取 JSON（容忍前后杂质）。 */
function parseCliJson(text, label) {
	const raw = typeof text === 'string' ? text.trim() : '';
	if (raw === '') throw new Error(`${label}没有返回结果，请重试。`);
	const start = raw.search(/[{[]/);
	const candidate = start >= 0 ? raw.slice(start) : raw;
	try {
		return JSON.parse(candidate);
	} catch {
		// 截取到最后一个 } / ] 再试一次。
		const lastObject = candidate.lastIndexOf('}');
		const lastArray = candidate.lastIndexOf(']');
		const end = Math.max(lastObject, lastArray);
		if (end > 0) {
			try {
				return JSON.parse(candidate.slice(0, end + 1));
			} catch {
				/* 继续抛错 */
			}
		}
		throw new Error(`${label}返回了无法解析的结果，请重试。`);
	}
}

/** 从 CLI 的失败输出里提取可读原因。 */
function extractFailureReason(stderr, stdout) {
	for (const text of [stderr, stdout]) {
		const raw = typeof text === 'string' ? text.trim() : '';
		if (raw === '') continue;
		try {
			const parsed = parseCliJson(raw, 'LibreOffice');
			const reason = isPlainObject(parsed) ? asString(parsed.error ?? parsed.message) : '';
			if (reason !== '') return reason;
		} catch {
			/* 不是 JSON，继续 */
		}
		if (raw.length <= 400) return raw;
	}
	return '';
}

/** 把底层错误翻成中文 Error。 */
function translateExecError(error, stderr, stdout, signal, label) {
	const isAbort = error?.name === 'AbortError' || error?.code === 'ABORT_ERR' || signal?.aborted === true;
	if (isAbort) {
		const aborted = new Error(`${label}已取消。`);
		aborted.code = 'ABORTED';
		return aborted;
	}
	const timeoutLike = error?.killed === true || error?.signal === 'SIGTERM' || error?.code === 'ETIMEDOUT';
	if (timeoutLike) {
		const timeout = new Error(`${label}超时（超过 ${Math.round(DEFAULT_TIMEOUT_MS / 1000)} 秒），请尝试更小的文件或稍后重试。`);
		timeout.code = 'TIMEOUT';
		return timeout;
	}
	const reason = extractFailureReason(stderr, stdout);
	let detail = reason;
	if (detail === '') {
		detail = asString(error?.message);
		// 去掉 Node 附加的命令行信息，只保留可读部分。
		const firstLine = detail.split('\n')[0];
		detail = firstLine.length > 300 ? `${firstLine.slice(0, 300)}…` : firstLine;
	}
	if (/ENOENT/.test(reason)) return new Error(`${label}失败：文件不存在或已被移动（${reason}）。`);
	if (/EEXIST/.test(reason)) return new Error(`${label}失败：输出位置已存在同名文件/目录（${reason}）。`);
	const message = detail === '' ? `${label}失败，请重试。` : `${label}失败：${detail}`;
	const failure = new Error(message);
	failure.code = 'RENDER_FAILED';
	return failure;
}

/** 把 dpi 收敛到 CLI 允许范围。 */
function normalizeDpi(dpi) {
	const value = Number(dpi);
	if (!Number.isFinite(value) || value < MIN_DPI || value > MAX_DPI) return 120;
	return Math.round(value);
}

/**
 * 创建渲染封装。
 * @param {{logger?: {warn?: Function, info?: Function, error?: Function, debug?: Function}}} [deps]
 */
export function createRender({ logger } = {}) {
	let availablePromise = null;

	function log(level, message, error) {
		try {
			const text = error === undefined ? message : `${message}：${error instanceof Error ? error.message : String(error)}`;
			(logger?.[level] ?? logger?.warn)?.call?.(logger, text);
		} catch {
			/* 忽略日志失败 */
		}
	}

	/** 执行一次 LibreOffice Kit CLI，返回 {stdout, stderr}。 */
	function runCli(args, { timeoutMs = DEFAULT_TIMEOUT_MS, signal, label = 'LibreOffice 处理' } = {}) {
		const cli = resolveOfficeCli();
		if (typeof cli !== 'string' || cli === '' || !existsSync(cli)) {
			return Promise.reject(new Error('未找到 LibreOffice Kit，当前环境无法渲染文档。'));
		}
		const node = resolveNodeBinary();
		return new Promise((resolvePromise, rejectPromise) => {
			execFile(
				node,
				[cli, ...args],
				{
					timeout: timeoutMs,
					maxBuffer: MAX_BUFFER,
					windowsHide: true,
					encoding: 'utf8',
					...(signal === undefined || signal === null ? {} : { signal })
				},
				(error, stdout, stderr) => {
					if (error !== null && error !== undefined) {
						rejectPromise(translateExecError(error, stderr, stdout, signal, label));
						return;
					}
					resolvePromise({ stdout: typeof stdout === 'string' ? stdout : '', stderr: typeof stderr === 'string' ? stderr : '' });
				}
			);
		});
	}

	/** 探测 CLI 是否真的能运行（capabilities 子命令）。 */
	async function probe() {
		const cli = resolveOfficeCli();
		if (typeof cli !== 'string' || cli === '' || !existsSync(cli)) {
			log('info', '未找到 LibreOffice Kit CLI，题目渲染不可用');
			return false;
		}
		if (!existsSync(resolveNodeBinary())) {
			log('info', '未找到 LibreOffice Kit 所需的 Node 运行时，题目渲染不可用');
			return false;
		}
		try {
			const { stdout } = await runCli(['capabilities', '--json'], { timeoutMs: PROBE_TIMEOUT_MS, label: 'LibreOffice 能力探测' });
			const info = parseCliJson(stdout, 'LibreOffice 能力探测');
			return isPlainObject(info);
		} catch (error) {
			log('warn', 'LibreOffice Kit 能力探测失败，题目渲染不可用', error);
			return false;
		}
	}

	/** 渲染是否可用（结果缓存；探测异常时下次重试）。 */
	function available() {
		if (availablePromise === null) {
			availablePromise = probe().catch((error) => {
				log('warn', 'LibreOffice Kit 探测异常，将在下次重试', error);
				availablePromise = null;
				return false;
			});
		}
		return availablePromise;
	}

	/**
	 * Office 文档 → PDF。
	 * @param {string} inputAbs 输入绝对路径
	 * @param {string} outputAbs 输出 PDF 绝对路径（必须不存在）
	 * @param {{signal?: AbortSignal}} [options]
	 * @returns {Promise<void>}
	 */
	async function officeToPdf(inputAbs, outputAbs, { signal } = {}) {
		const input = resolve(String(inputAbs ?? ''));
		const output = resolve(String(outputAbs ?? ''));
		if (!existsSync(input)) throw new Error(`转换失败：输入文件不存在（${input}）。`);
		if (existsSync(output)) throw new Error(`转换失败：输出文件已存在（${output}）。`);
		await mkdir(dirname(output), { recursive: true });
		const { stdout } = await runCli(
			['convert', '--input', input, '--output', output],
			{ timeoutMs: DEFAULT_TIMEOUT_MS, signal, label: '文档转换' }
		);
		// 成功时 CLI 也会输出 JSON（含 outputPath / missingFonts），这里只做结果校验。
		try {
			const info = parseCliJson(stdout, '文档转换');
			if (isPlainObject(info) && asString(info.error) !== '') throw new Error(asString(info.error));
		} catch (error) {
			if (error instanceof Error && !/无法解析/.test(error.message)) throw new Error(`文档转换失败：${error.message}`);
		}
		if (!existsSync(output)) throw new Error('文档转换失败：没有生成 PDF 文件，请确认文件格式是否受支持。');
	}

	/**
	 * PDF → 页面 PNG。
	 * @param {string} inputAbs 输入 PDF 绝对路径
	 * @param {string} outputDirAbs 输出目录绝对路径（必须不存在，由 CLI 创建）
	 * @param {{dpi?: number, signal?: AbortSignal}} [options]
	 * @returns {Promise<{pages: Array<{page: number, path: string, width: number, height: number}>, missingFonts: string[]}>}
	 */
	async function renderPages(inputAbs, outputDirAbs, { dpi = 120, signal } = {}) {
		const input = resolve(String(inputAbs ?? ''));
		const outputDir = resolve(String(outputDirAbs ?? ''));
		if (!existsSync(input)) throw new Error(`渲染失败：输入文件不存在（${input}）。`);
		if (existsSync(outputDir)) throw new Error('渲染失败：页面输出目录必须是一个不存在的全新目录。');
		const resolvedDpi = normalizeDpi(dpi);
		const { stdout } = await runCli(
			['render', '--input', input, '--output-dir', outputDir, '--dpi', String(resolvedDpi), '--pages', 'all'],
			{ timeoutMs: DEFAULT_TIMEOUT_MS, signal, label: '页面渲染' }
		);
		const parsed = parseCliJson(stdout, '页面渲染');
		let rawImages = null;
		let missingFonts = [];
		if (Array.isArray(parsed)) rawImages = parsed;
		else if (isPlainObject(parsed)) {
			if (Array.isArray(parsed.images)) rawImages = parsed.images;
			if (Array.isArray(parsed.missingFonts)) missingFonts = parsed.missingFonts.map(asString).filter((name) => name !== '');
		}
		if (!Array.isArray(rawImages) || rawImages.length === 0) {
			throw new Error('页面渲染失败：没有生成任何页面图片，请确认文件是否有可渲染的内容。');
		}
		const pages = [];
		for (const [index, image] of rawImages.entries()) {
			if (!isPlainObject(image)) continue;
			const path = resolve(asString(image.path));
			if (path === '' || !existsSync(path)) throw new Error(`页面渲染失败：第 ${index + 1} 页图片没有正确生成。`);
			const pageNumber = Number(image.page ?? image.index);
			pages.push({
				page: Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : index + 1,
				path,
				width: Number(image.width) || 0,
				height: Number(image.height) || 0
			});
		}
		if (pages.length === 0) throw new Error('页面渲染失败：没有生成任何页面图片。');
		pages.sort((left, right) => left.page - right.page);
		return { pages, missingFonts };
	}

	return {
		available,
		officeToPdf,
		renderPages
	};
}
