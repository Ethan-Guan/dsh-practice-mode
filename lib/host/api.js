/**
 * 刷题模式 — Host HTTP API（api.js）。
 *
 * 通过 `ctx.connection.fetch.register` 把契约第 4 节的全部路由注册到 Web 载波：
 *   - 成功统一 `{ ok: true, ... }`，失败统一 `{ ok: false, error: '中文原因' }` + 400/404/500；
 *   - 上传文件经 base64 解码后落盘：doc → 抽取文本写 text.md；question → 新建 draft 题目集，
 *     原件写入 `courses/<cid>/sets/<sid>/source/`；
 *   - parse / diagnose / svg 走 jobs 后台任务，立即返回 jobId；
 *   - chat 返回 SSE（`data: <json>\n\n` 帧），用户消息与线程持久化由 tasks.chat 负责，
 *     本模块只做 SSE 包装与帧格式；
 *   - asset 路由按扩展名回 content-type，且只允许访问 `courses/<courseId>/` 下的文件。
 *
 * 本模块不创建 store / jobs / tasks（由 index.js 接线注入），只使用它们。
 * 为便于测试，额外接受可选的 `extract` 注入（默认动态 import './extract/index.js'，
 * 运行时缺失时回退硬编码扩展名列表 + 纯文本兜底抽取）。
 */

import { readFile as readFileFs } from 'node:fs/promises';

import { resolveDataRoot } from './paths.js';

const API_PREFIX = '/api/practice';
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
const MAX_TEXT_CHARS = 400000;
const MAX_RECORDS_PER_REQUEST = 5000;

/** extract/index.js 运行时缺失时的兜底白名单（与契约 5.8 一致）。 */
const FALLBACK_DOC_EXTS = ['.txt', '.md', '.markdown', '.csv', '.json', '.html', '.htm', '.docx', '.pptx', '.pdf'];
/** 题目文件额外允许的图片扩展名（多模态解析用）。 */
const QUESTION_IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'];
/** 题目文件额外允许的旧版 Office 扩展名（LibreOffice 可转换，Client 也允许选择）。 */
const QUESTION_OFFICE_EXTS = ['.doc', '.ppt'];
/** AI 答案解析模式：auto=未提供答案时让 AI 生成；off=只用原卷答案；regenerate=强制 AI 重新生成。 */
const AI_ANSWER_MODES = ['auto', 'off', 'regenerate'];
/** AI 判题结论允许值。 */
const AI_GRADE_VERDICTS = ['correct', 'partial', 'incorrect'];
/** AI 判题建议条数与单条长度上限（持久化安全字段裁剪）。 */
const AI_GRADE_SUGGESTION_LIMIT = 20;
const AI_GRADE_TEXT_LIMIT = 4000;
/** AI 判题结果中可选的展示文本字段：standardAnswer / mistakeAnalysis / explanation（各自上限）。 */
const AI_GRADE_EXTRA_TEXT_FIELDS = [
	{ key: 'standardAnswer', limit: 6000 },
	{ key: 'mistakeAnalysis', limit: 6000 },
	{ key: 'explanation', limit: 8000 }
];
/** 纯文本兜底抽取支持的扩展名。 */
const PLAIN_TEXT_EXTS = new Set(['.txt', '.md', '.markdown', '.csv', '.json', '.log']);
/** asset 路由的 content-type 映射。 */
const CONTENT_TYPES = new Map([
	['.png', 'image/png'],
	['.jpg', 'image/jpeg'],
	['.jpeg', 'image/jpeg'],
	['.webp', 'image/webp'],
	['.gif', 'image/gif'],
	['.bmp', 'image/bmp'],
	['.svg', 'image/svg+xml'],
	['.xml', 'application/xml'],
	['.pdf', 'application/pdf'],
	['.json', 'application/json'],
	['.txt', 'text/plain; charset=utf-8'],
	['.md', 'text/markdown; charset=utf-8'],
	['.markdown', 'text/markdown; charset=utf-8'],
	['.html', 'text/html; charset=utf-8'],
	['.htm', 'text/html; charset=utf-8'],
	['.csv', 'text/csv; charset=utf-8']
]);
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

/** 带 HTTP 状态码的业务错误。 */
class HttpError extends Error {
	/**
	 * @param {number} status
	 * @param {string} message 用户可读中文原因
	 */
	constructor(status, message) {
		super(message);
		this.name = 'HttpError';
		this.status = status;
	}
}

/** @returns {boolean} */
function isPlainObject(value) {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 判断字符串是否包含中文（用于把技术错误转成中文兜底）。 */
function hasChinese(text) {
	return /[\u3400-\u9fff]/.test(text);
}

/** 把任意异常转成用户可读中文原因。 */
function userMessage(error) {
	if (error instanceof HttpError) return error.message;
	let raw = '';
	if (error instanceof Error) raw = typeof error.message === 'string' ? error.message : '';
	else if (typeof error === 'string') raw = error;
	else if (isPlainObject(error) && typeof error.message === 'string') raw = error.message;
	raw = raw.trim();
	const code = isPlainObject(error) || error instanceof Error ? error.code : undefined;
	if (code === 'ENOENT') return '文件不存在或已被删除';
	if (code === 'EACCES' || code === 'EPERM') return '没有访问权限，请检查数据目录权限';
	if (code === 'ENOSPC') return '磁盘空间不足，无法写入文件';
	if (code === 'EISDIR') return '目标路径是目录，无法写入文件';
	if (raw === '') return '操作失败，请稍后重试';
	return hasChinese(raw) ? raw : `操作失败：${raw}`;
}

/** 成功响应。 */
function ok(payload = {}) {
	return Response.json({ ok: true, ...payload }, { headers: { 'cache-control': 'no-store' } });
}

/** 失败响应。 */
function fail(status, message) {
	return Response.json(
		{ ok: false, error: String(message) },
		{ status, headers: { 'cache-control': 'no-store' } }
	);
}

/** 读取并校验 JSON 请求体。 */
async function readRequestJson(request) {
	let body;
	try {
		body = await request.json();
	} catch {
		throw new HttpError(400, '请求体不是合法的 JSON');
	}
	if (!isPlainObject(body)) throw new HttpError(400, '请求体必须是 JSON 对象');
	return body;
}

/** 读取 query 参数（缺失返回空串）。 */
function readQuery(request, name) {
	try {
		return new URL(request.url).searchParams.get(name) ?? '';
	} catch {
		return '';
	}
}

/** 必填 query 参数。 */
function requireQuery(request, name, label) {
	const value = readQuery(request, name).trim();
	if (value === '') throw new HttpError(400, `缺少参数 ${label ?? name}`);
	return value;
}

/** 校验一个 id 字段（课程/题目集/文档/对话/任务等）。 */
function readId(value, label) {
	const text = typeof value === 'string' ? value.trim() : '';
	if (text === '') throw new HttpError(400, `缺少 ${label}`);
	if (!ID_PATTERN.test(text)) throw new HttpError(400, `${label} 格式不正确`);
	return text;
}

/** 可选 id 字段。 */
function readOptionalId(value, label) {
	if (value === undefined || value === null || value === '') return undefined;
	return readId(value, label);
}

/** 必填短文本（自动 trim、限长）。 */
function readText(value, label, maxLength = 200) {
	const text = typeof value === 'string' ? value.trim() : '';
	if (text === '') throw new HttpError(400, `${label}不能为空`);
	return text.slice(0, maxLength);
}

/** 可选短文本。 */
function readOptionalText(value, maxLength = 20000) {
	if (typeof value !== 'string') return undefined;
	const text = value.trim();
	return text === '' ? undefined : text.slice(0, maxLength);
}

/** 是否为合法的 AI 判题结论。 */
function isAiGradeVerdict(value) {
	return typeof value === 'string' && AI_GRADE_VERDICTS.includes(value);
}

/** 字符串数组清洗：去空、去非字符串、限条数与单条长度（用于判题建议/引用）。 */
function sanitizeStringList(value, { maxItems = AI_GRADE_SUGGESTION_LIMIT, maxLength = 1000 } = {}) {
	if (!Array.isArray(value)) return [];
	const result = [];
	for (const item of value) {
		if (typeof item !== 'string') continue;
		const text = item.trim();
		if (text === '') continue;
		result.push(text.slice(0, maxLength));
		if (result.length >= maxItems) break;
	}
	return result;
}

/**
 * 清洗 AI 判题结果，只保留契约允许的安全字段：
 * {verdict, score, summary, suggestions, correctedAnswer?, refs, generatedAt}。
 * 非对象或 verdict 非法时返回 null（视为没有判题结果）。
 */
function sanitizeAiGrade(value) {
	if (!isPlainObject(value) || !isAiGradeVerdict(value.verdict)) return null;
	const rawScore = Number(value.score);
	const rawGeneratedAt = Number(value.generatedAt);
	const grade = {
		verdict: value.verdict,
		score: Number.isFinite(rawScore) ? Math.max(0, Math.min(100, Math.round(rawScore * 100) / 100)) : 0,
		summary: typeof value.summary === 'string' ? value.summary.trim().slice(0, AI_GRADE_TEXT_LIMIT) : '',
		suggestions: sanitizeStringList(value.suggestions),
		refs: sanitizeStringList(value.refs, { maxItems: 50, maxLength: 300 }),
		generatedAt: Number.isFinite(rawGeneratedAt) && rawGeneratedAt > 0 ? Math.round(rawGeneratedAt) : Date.now()
	};
	// correctedAnswer 契约是 string；数组（例如按空的参考答案）做容错拼接。
	if (typeof value.correctedAnswer === 'string' && value.correctedAnswer.trim() !== '') {
		grade.correctedAnswer = value.correctedAnswer.trim().slice(0, AI_GRADE_TEXT_LIMIT);
	} else if (Array.isArray(value.correctedAnswer)) {
		const joined = sanitizeStringList(value.correctedAnswer, { maxItems: 20, maxLength: 1000 }).join('；');
		if (joined !== '') grade.correctedAnswer = joined.slice(0, AI_GRADE_TEXT_LIMIT);
	}
	// 结构化判题的展示字段：非字符串/空串省略，超长按各自上限截断（旧客户端/旧记录不含这些字段也兼容）。
	for (const field of AI_GRADE_EXTRA_TEXT_FIELDS) {
		const raw = value[field.key];
		if (typeof raw !== 'string') continue;
		const text = raw.trim();
		if (text === '') continue;
		grade[field.key] = text.slice(0, field.limit);
	}
	return grade;
}

/** 规范化 /grade 的 userAnswer（必须为数组，元素转字符串）。 */
function normalizeGradeUserAnswer(value) {
	if (value === undefined || value === null) throw new HttpError(400, '缺少 userAnswer');
	if (!Array.isArray(value)) throw new HttpError(400, 'userAnswer 必须是字符串数组');
	return value
		.filter((item) => item !== undefined && item !== null)
		.map((item) => String(item));
}

/** 规范化扩展名数组（统一小写、带点、去重）。 */
function normalizeExtList(list) {
	const result = [];
	const seen = new Set();
	for (const item of Array.isArray(list) ? list : []) {
		if (typeof item !== 'string') continue;
		let ext = item.trim().toLowerCase();
		if (ext === '') continue;
		if (!ext.startsWith('.')) ext = `.${ext}`;
		if (!seen.has(ext)) {
			seen.add(ext);
			result.push(ext);
		}
	}
	return result;
}

/** 取文件名（兼容 / 与 \\ 分隔）。 */
function baseNameOf(value) {
	const raw = typeof value === 'string' ? value.replace(/\\/g, '/') : '';
	const parts = raw.split('/').filter((part) => part !== '' && part !== '.' && part !== '..');
	return parts.length > 0 ? parts[parts.length - 1] : '';
}

/** 取小写扩展名（含点），无扩展名返回空串。 */
function extOf(value) {
	const base = baseNameOf(value).toLowerCase();
	const index = base.lastIndexOf('.');
	if (index <= 0) return '';
	return base.slice(index);
}

/**
 * 清洗上传路径：保留目录结构（目录上传），去掉 `..`、绝对路径与危险字符。
 * @returns {string} 安全相对路径（可能为空串表示不合法）
 */
function sanitizeUploadPath(rawValue) {
	const raw = typeof rawValue === 'string' ? rawValue.trim() : '';
	if (raw === '') return '';
	const normalized = raw.replace(/\\/g, '/');
	if (normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized)) return '';
	const parts = [];
	for (const segment of normalized.split('/')) {
		if (segment === '' || segment === '.' || segment === '..') continue;
		let cleaned = segment.replace(/[\u0000-\u001f<>:"|?*]/g, '_').trim();
		cleaned = cleaned.replace(/[. ]+$/g, '');
		if (cleaned === '' || cleaned === '.' || cleaned === '..') continue;
		parts.push(cleaned.slice(0, 120));
	}
	return parts.join('/');
}

/** 解码 base64（容忍 data: 前缀与空白）。 */
function decodeBase64Data(data) {
	if (typeof data !== 'string' || data.trim() === '') throw new HttpError(400, '文件内容为空');
	let text = data.trim();
	if (/^data:[^,]*;base64,/i.test(text)) text = text.slice(text.indexOf(',') + 1);
	else if (/^data:[^,]*,/i.test(text)) text = text.slice(text.indexOf(',') + 1);
	text = text.replace(/\s+/g, '');
	if (text === '') throw new HttpError(400, '文件内容为空');
	if (!/^[A-Za-z0-9+/]*={0,2}$/.test(text) || text.length % 4 === 1) {
		throw new HttpError(400, '文件内容不是合法的 base64 数据');
	}
	const buffer = Buffer.from(text, 'base64');
	if (buffer.length === 0) throw new HttpError(400, '文件内容为空');
	return buffer;
}

/** 极简 HTML 去标签（仅在 extract 模块不可用时兜底）。 */
function stripHtml(raw) {
	return raw
		.replace(/<script[\s\S]*?<\/script>/gi, ' ')
		.replace(/<style[\s\S]*?<\/style>/gi, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/gi, ' ')
		.replace(/&amp;/gi, '&')
		.replace(/&lt;/gi, '<')
		.replace(/&gt;/gi, '>')
		.replace(/&quot;/gi, '"')
		.replace(/[ \t]+/g, ' ')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

/** extract/index.js 缺失时的兜底抽取：只处理纯文本类文件，二进制格式报中文错误。 */
async function fallbackExtractDocument({ absPath, ext }) {
	const normalizedExt = typeof ext === 'string' ? ext.toLowerCase() : '';
	if (normalizedExt === '.html' || normalizedExt === '.htm') {
		return { text: stripHtml(await readFileFs(absPath, 'utf8')), warnings: [], images: [] };
	}
	if (PLAIN_TEXT_EXTS.has(normalizedExt)) {
		return { text: await readFileFs(absPath, 'utf8'), warnings: [], images: [] };
	}
	throw new Error(`当前环境缺少文档抽取模块，暂不能解析 ${normalizedExt || '该'} 格式`);
}

/**
 * 创建刷题模式 HTTP 路由。
 * @param {object} options
 * @param {object} options.store createStore 产物
 * @param {object} options.jobs createJobs 产物
 * @param {object} [options.tasks] createTasks 产物（parseSet/diagnose/redrawFigure/chat）
 * @param {object} [options.llm] createLlm 产物（supportsImages/selection）
 * @param {object} [options.render] createRender 产物（available）
 * @param {{warn?: Function, info?: Function}} [options.logger]
 * @param {object|Function} [options.extract] 测试注入：{DOC_EXTS, extractDocument} 或 extractDocument 函数
 * @returns {{register: (ctx: object) => Function, dispose: () => void}}
 */
export function createApiRoutes(options = {}) {
	const { store, jobs, tasks, llm, render, logger } = options ?? {};
	const extractOverride = options?.extract;

	if (store === undefined || store === null || typeof store.update !== 'function' || typeof store.ready !== 'function') {
		throw new Error('createApiRoutes 需要有效的 store');
	}
	if (jobs === undefined || jobs === null || typeof jobs.start !== 'function') {
		throw new Error('createApiRoutes 需要有效的 jobs');
	}

	/** @type {{docExts: string[], extractDocument: Function}} */
	let resolvedExtractor = null;
	let extractorPromise = null;
	let packageVersion = null;
	const NEW_THREAD_TITLE = '新对话';

	/** 解析文档抽取模块（动态 import + 兜底），只执行一次。 */
	function resolveExtractor() {
		if (resolvedExtractor !== null) return Promise.resolve(resolvedExtractor);
		if (extractorPromise !== null) return extractorPromise;
		const build = (moduleValue) => {
			const source = isPlainObject(moduleValue) ? moduleValue : {};
			const docExts = normalizeExtList(
				Array.isArray(source.DOC_EXTS) && source.DOC_EXTS.length > 0 ? source.DOC_EXTS : FALLBACK_DOC_EXTS
			);
			const extractDocument = typeof source.extractDocument === 'function' ? source.extractDocument : fallbackExtractDocument;
			resolvedExtractor = { docExts, extractDocument };
			return resolvedExtractor;
		};
		if (extractOverride !== undefined && extractOverride !== null) {
			if (typeof extractOverride === 'function') {
				extractorPromise = Promise.resolve(build({ extractDocument: extractOverride }));
			} else {
				extractorPromise = Promise.resolve(build(extractOverride));
			}
			return extractorPromise;
		}
		extractorPromise = import('./extract/index.js')
			.then((moduleValue) => build(moduleValue))
			.catch((error) => {
				logger?.warn?.(`practice-mode: 文档抽取模块不可用，回退纯文本抽取（${error?.message ?? error}）`);
				extractorPromise = Promise.resolve(build(undefined));
				return extractorPromise;
			});
		return extractorPromise;
	}

	/** 读插件版本（ping 用），失败回退 1.0.0。 */
	async function readPackageVersion() {
		if (packageVersion !== null) return packageVersion;
		try {
			const raw = await readFileFs(new URL('../../package.json', import.meta.url), 'utf8');
			const parsed = JSON.parse(raw);
			packageVersion = typeof parsed.version === 'string' && parsed.version !== '' ? parsed.version : '1.0.0';
		} catch {
			packageVersion = '1.0.0';
		}
		return packageVersion;
	}

	// ---------------------------------------------------------------------
	// store 状态查询工具
	// ---------------------------------------------------------------------

	function findCourse(state, courseId) {
		if (!Array.isArray(state?.courses)) return undefined;
		return state.courses.find((course) => isPlainObject(course) && course.id === courseId);
	}

	function requireCourse(state, courseId) {
		const course = findCourse(state, courseId);
		if (course === undefined) throw new HttpError(404, '课程不存在');
		return course;
	}

	function findSet(course, setId) {
		if (!Array.isArray(course?.sets)) return undefined;
		return course.sets.find((set) => isPlainObject(set) && set.id === setId);
	}

	function requireSet(course, setId) {
		const set = findSet(course, setId);
		if (set === undefined) throw new HttpError(404, '题目集不存在');
		return set;
	}

	// 数据根相对路径（统一用 '/'，store.abs 会校验越界）。
	const courseRel = (courseId) => `courses/${courseId}`;
	const docDirRel = (courseId, docId) => `courses/${courseId}/docs/${docId}`;
	const setDirRel = (courseId, setId) => `courses/${courseId}/sets/${setId}`;
	const setJsonRel = (courseId, setId) => `${setDirRel(courseId, setId)}/set.json`;
	const chatRel = (courseId, threadId) => `courses/${courseId}/chat/${threadId}.json`;

	// ---------------------------------------------------------------------
	// 路由处理函数
	// ---------------------------------------------------------------------

	async function handlePing() {
		return ok({
			version: await readPackageVersion(),
			dataRoot: typeof store.rootDir === 'string' ? store.rootDir : resolveDataRoot()
		});
	}

	async function handleBootstrap() {
		const state = store.get();
		const capabilities = {
			images: false,
			render: false,
			model: { provider: 'deepseek-official', model: 'deepseek-flash' }
		};
		if (llm !== undefined && llm !== null) {
			try {
				capabilities.images = Boolean(await llm.supportsImages?.());
			} catch (error) {
				logger?.warn?.(`practice-mode: 检测图片能力失败：${error?.message ?? error}`);
			}
			try {
				const selection = llm.selection?.();
				if (isPlainObject(selection)) {
					capabilities.model = {
						provider: typeof selection.provider === 'string' ? selection.provider : capabilities.model.provider,
						model: typeof selection.model === 'string' ? selection.model : capabilities.model.model
					};
				}
			} catch (error) {
				logger?.warn?.(`practice-mode: 读取默认模型失败：${error?.message ?? error}`);
			}
		}
		if (render !== undefined && render !== null) {
			try {
				capabilities.render = Boolean(await render.available?.());
			} catch (error) {
				logger?.warn?.(`practice-mode: 检测渲染能力失败：${error?.message ?? error}`);
			}
		}
		return ok({
			data: {
				courses: Array.isArray(state.courses) ? state.courses : [],
				global: isPlainObject(state.global) ? state.global : { analysis: null },
				capabilities
			}
		});
	}

	async function handleSet(request) {
		const courseId = readId(requireQuery(request, 'courseId'), 'courseId');
		const setId = readId(requireQuery(request, 'setId'), 'setId');
		const course = requireCourse(store.get(), courseId);
		requireSet(course, setId);
		const relPath = setJsonRel(courseId, setId);
		if (!(await store.exists(relPath))) throw new HttpError(404, '题目集尚未解析完成');
		const raw = await store.readText(relPath);
		let parsed;
		try {
			parsed = JSON.parse(raw);
		} catch {
			throw new HttpError(500, '题目集数据损坏，请重新解析');
		}
		return ok({ data: parsed });
	}

	async function handleJob(request) {
		const jobId = requireQuery(request, 'jobId');
		const snapshot = jobs.get(jobId);
		if (snapshot === undefined) throw new HttpError(404, '任务不存在或已过期');
		return ok({ data: snapshot });
	}

	async function handleAsset(request) {
		const courseId = readId(requireQuery(request, 'courseId'), 'courseId');
		const rawPath = requireQuery(request, 'path', 'path');
		const safePath = sanitizeUploadPath(rawPath);
		if (safePath === '') throw new HttpError(400, '资源路径不合法');
		if (safePath !== rawPath.replace(/\\/g, '/').trim()) {
			// 原路径里出现了 `..`、绝对路径或危险字符，一律拒绝而不是静默修正。
			throw new HttpError(400, '资源路径不合法');
		}
		if (!safePath.startsWith(`courses/${courseId}/`)) {
			throw new HttpError(400, '只能访问当前课程目录下的资源');
		}
		const relPath = safePath;
		if (!(await store.exists(relPath))) throw new HttpError(404, '资源不存在');
		const buffer = await store.readFile(relPath);
		const contentType = CONTENT_TYPES.get(extOf(relPath)) ?? 'application/octet-stream';
		return new Response(buffer, {
			status: 200,
			headers: {
				'content-type': contentType,
				'content-length': String(buffer.length),
				'cache-control': 'private, max-age=60',
				'x-content-type-options': 'nosniff'
			}
		});
	}

	async function handleCourse(request) {
		const body = await readRequestJson(request);
		const action = readText(body.action, '课程操作');
		if (action === 'create') {
			const name = readText(body.name, '课程名称', 120);
			const description = typeof body.description === 'string' ? body.description.trim().slice(0, 2000) : '';
			const courseId = store.newId('c');
			const now = Date.now();
			await store.update((state) => {
				if (!Array.isArray(state.courses)) state.courses = [];
				state.courses.push({
					id: courseId,
					name,
					description,
					createdAt: now,
					updatedAt: now,
					docs: [],
					sets: [],
					records: [],
					analyses: {},
					chatThreads: []
				});
			});
			return ok({ courseId });
		}
		if (action === 'update') {
			const courseId = readId(body.courseId, 'courseId');
			const updates = {};
			if (body.name !== undefined) updates.name = readText(body.name, '课程名称', 120);
			if (body.description !== undefined) {
				updates.description = typeof body.description === 'string'
					? body.description.trim().slice(0, 2000)
					: '';
			}
			await store.update((state) => {
				const course = requireCourse(state, courseId);
				if (updates.name !== undefined) course.name = updates.name;
				if (updates.description !== undefined) course.description = updates.description;
				course.updatedAt = Date.now();
			});
			return ok({ courseId });
		}
		if (action === 'delete') {
			const courseId = readId(body.courseId, 'courseId');
			await store.update((state) => {
				if (!Array.isArray(state.courses)) state.courses = [];
				const index = state.courses.findIndex((course) => isPlainObject(course) && course.id === courseId);
				if (index < 0) throw new HttpError(404, '课程不存在');
				state.courses.splice(index, 1);
			});
			try {
				await store.remove(courseRel(courseId));
			} catch (error) {
				logger?.warn?.(`practice-mode: 删除课程目录失败：${error?.message ?? error}`);
			}
			return ok();
		}
		throw new HttpError(400, '不支持的课程操作');
	}

	async function handleDocDelete(request) {
		const body = await readRequestJson(request);
		const courseId = readId(body.courseId, 'courseId');
		const docId = readId(body.docId, 'docId');
		await store.update((state) => {
			const course = requireCourse(state, courseId);
			if (Array.isArray(course.docs)) {
				course.docs = course.docs.filter((doc) => !(isPlainObject(doc) && doc.id === docId));
			}
			course.updatedAt = Date.now();
		});
		// 目录已不存在时 remove 是幂等的，满足「已使用时重复删除仍成功」。
		try {
			await store.remove(docDirRel(courseId, docId));
		} catch (error) {
			logger?.warn?.(`practice-mode: 删除文档目录失败：${error?.message ?? error}`);
		}
		return ok();
	}

	async function handleUpload(request) {
		const body = await readRequestJson(request);
		const courseId = readId(body.courseId, 'courseId');
		const category = readText(body.category, '上传类别', 20);
		if (category !== 'doc' && category !== 'question') throw new HttpError(400, '上传类别只能是 doc 或 question');
		const rawFiles = body.files;
		if (!Array.isArray(rawFiles) || rawFiles.length === 0) throw new HttpError(400, '请选择要上传的文件');
		const role = body.role === undefined || body.role === null || body.role === ''
			? 'questions'
			: readText(body.role, '上传角色', 20);
		if (role !== 'questions' && role !== 'answers') {
			throw new HttpError(400, '上传角色只能是 questions 或 answers');
		}
		const requestedSetId = readOptionalId(body.setId, 'setId');
		if (role === 'answers' && requestedSetId === undefined) {
			throw new HttpError(400, '上传答案文件需要先指定所属题目集（setId）');
		}
		if (category === 'doc' && requestedSetId !== undefined) {
			throw new HttpError(400, '课程文档不支持上传到题目集');
		}
		// 先确认课程存在，避免解码大文件后才报 404。
		requireCourse(store.get(), courseId);
		// 追加到已有题目集：提前校验，避免解码大文件后才报 404。
		if (requestedSetId !== undefined) {
			requireSet(requireCourse(store.get(), courseId), requestedSetId);
			if (activeParseJobs.has(requestedSetId)) {
				throw new HttpError(400, '该题目集正在解析中，请等待解析完成后再上传');
			}
		}

		const extractor = category === 'doc' ? await resolveExtractor() : null;
		const allowedExts = category === 'doc'
			? extractor.docExts
			: [...(await resolveExtractor()).docExts, ...QUESTION_OFFICE_EXTS, ...QUESTION_IMAGE_EXTS];
		const allowed = new Set(allowedExts);

		const skipped = [];
		const decoded = [];
		let totalBytes = 0;
		for (const rawFile of rawFiles) {
			if (!isPlainObject(rawFile)) continue;
			const rawPath = typeof rawFile.path === 'string' && rawFile.path.trim() !== ''
				? rawFile.path
				: typeof rawFile.name === 'string' ? rawFile.name : '';
			const displayName = baseNameOf(rawPath);
			const safeRel = sanitizeUploadPath(rawPath);
			if (safeRel === '' || displayName === '') {
				skipped.push({ name: displayName || '未命名文件', reason: '文件名不合法' });
				continue;
			}
			const ext = extOf(displayName);
			if (!allowed.has(ext)) {
				skipped.push({ name: displayName, reason: `不支持的文件类型${ext || '（无扩展名）'}` });
				continue;
			}
			let buffer;
			try {
				buffer = decodeBase64Data(rawFile.data);
			} catch (error) {
				skipped.push({ name: displayName, reason: userMessage(error) });
				continue;
			}
			if (buffer.length > MAX_FILE_BYTES) {
				skipped.push({ name: displayName, reason: '单个文件不能超过 25MB' });
				continue;
			}
			totalBytes += buffer.length;
			if (totalBytes > MAX_TOTAL_BYTES) throw new HttpError(400, '单次上传总大小不能超过 100MB');
			decoded.push({ name: displayName, safeRel, ext, buffer });
		}

		if (category === 'doc') {
			const docs = [];
			const addedAt = Date.now();
			for (const file of decoded) {
				const docId = store.newId('d');
				const relPath = `${docDirRel(courseId, docId)}/${file.safeRel}`;
				const absPath = store.abs(relPath);
				await store.writeFile(relPath, file.buffer);
				const doc = {
					id: docId,
					name: file.name,
					// 目录上传时保留相对路径（含子目录）。课程文档只作为 Agent 的工作目录，不抽取文本。
					relativePath: file.safeRel,
					relPath,
					textRelPath: null,
					ext: file.ext,
					size: file.buffer.length,
					status: 'ready',
					error: null,
					chars: 0,
					addedAt
				};
				docs.push(doc);
			}
			if (docs.length > 0) {
				await store.update((state) => {
					const course = requireCourse(state, courseId);
					if (!Array.isArray(course.docs)) course.docs = [];
					course.docs.push(...docs);
					course.updatedAt = addedAt;
				});
			}
			return ok({ docs, skipped });
		}

		// category === 'question'：带 setId 时追加到已有题目集（试卷 + 答案分文件上传），否则新建题目集。
		if (requestedSetId !== undefined) {
			if (decoded.length === 0) return ok({ setId: requestedSetId, files: [], skipped });
			const appendedAt = Date.now();
			const addedFiles = [];
			for (const file of decoded) {
				const relPath = `${setDirRel(courseId, requestedSetId)}/source/${file.safeRel}`;
				await store.writeFile(relPath, file.buffer);
				addedFiles.push({
					name: file.name,
					relativePath: file.safeRel,
					relPath,
					ext: file.ext,
					size: file.buffer.length,
					role
				});
			}
			await store.update((state) => {
				const course = requireCourse(state, courseId);
				const set = requireSet(course, requestedSetId);
				if (!Array.isArray(set.sourceFiles)) set.sourceFiles = [];
				for (const file of addedFiles) {
					// 同一相对路径 + 角色视为覆盖（重复上传同名答案文件时替换元数据，避免解析重复材料）。
					const existingIndex = set.sourceFiles.findIndex((item) => {
						if (!isPlainObject(item) || item.role !== file.role) return false;
						if (typeof item.relativePath === 'string') return item.relativePath === file.relativePath;
						return item.name === file.name;
					});
					if (existingIndex >= 0) set.sourceFiles[existingIndex] = { ...set.sourceFiles[existingIndex], ...file };
					else set.sourceFiles.push(file);
				}
				// 追加文件后回到 draft，用户可以重新解析（原卷答案错误时借助 aiAnswerMode 重新生成）。
				set.status = 'draft';
				set.error = null;
				set.updatedAt = appendedAt;
				course.updatedAt = appendedAt;
			});
			return ok({ setId: requestedSetId, files: addedFiles, skipped });
		}

		// 无 setId：一次上传的多个文件同属一个新题目集。
		if (decoded.length === 0) return ok({ files: [], skipped });
		const setId = store.newId('s');
		const createdAt = Date.now();
		const sourceFiles = [];
		for (const file of decoded) {
			const relPath = `${setDirRel(courseId, setId)}/source/${file.safeRel}`;
			await store.writeFile(relPath, file.buffer);
			// 同样保留目录上传的相对路径，解析 prompt 仍可继续只用 name。
			sourceFiles.push({
				name: file.name,
				relativePath: file.safeRel,
				relPath,
				ext: file.ext,
				size: file.buffer.length,
				role: 'questions'
			});
		}
		const firstStem = baseNameOf(decoded[0].name).replace(/\.[^.]+$/, '').trim();
		const title = (firstStem === '' ? '新题目集' : firstStem).slice(0, 60);
		await store.update((state) => {
			const course = requireCourse(state, courseId);
			if (!Array.isArray(course.sets)) course.sets = [];
			course.sets.push({
				id: setId,
				title,
				status: 'draft',
				error: null,
				createdAt,
				updatedAt: createdAt,
				sourceFiles,
				questionCount: 0,
				answeredCount: 0,
				mode: 'immediate',
				aiAnswerMode: 'auto',
				startedAt: null,
				completedAt: null,
				warnings: []
			});
			course.updatedAt = createdAt;
		});
		return ok({ setId, files: sourceFiles, skipped });
	}

	// 正在解析中的 setId → jobId（防止重复起解析任务）。
	const activeParseJobs = new Map();
	// 题目已就绪后在后台解析参考答案的 jobId（重新解析时取消旧的）。
	const activeAnswerJobs = new Map();

	async function handleParse(request) {
		const body = await readRequestJson(request);
		const courseId = readId(body.courseId, 'courseId');
		const setId = readId(body.setId, 'setId');
		const course = requireCourse(store.get(), courseId);
		const set = requireSet(course, setId);
		if (typeof tasks?.parseSet !== 'function') throw new HttpError(500, '题目解析服务不可用');
		if (activeParseJobs.has(setId) || set.status === 'parsing') {
			throw new HttpError(400, '该题目集正在解析中，请稍候');
		}
		const previousAnswersJob = activeAnswerJobs.get(setId);
		if (previousAnswersJob !== undefined) {
			try {
				jobs.cancel(previousAnswersJob);
			} catch (error) {
				/* 旧答案任务已结束 */
			}
			activeAnswerJobs.delete(setId);
		}
		await store.update((state) => {
			const target = requireSet(requireCourse(state, courseId), setId);
			target.status = 'parsing';
			target.error = null;
			target.updatedAt = Date.now();
		});
		const jobId = jobs.start('parse', async ({ progress, signal }) => {
			try {
				const result = await tasks.parseSet({ courseId, setId, signal, progress });
				/* 题目已可作答；参考答案另起后台任务，不阻塞用户开始答题。 */
				let answersJobId = null;
				if (typeof tasks?.enrichAnswers === 'function') {
					answersJobId = jobs.start('answers', async ({ progress: answerProgress, signal: answerSignal }) => {
						try {
							return await tasks.enrichAnswers({ courseId, setId, signal: answerSignal, progress: answerProgress });
						} finally {
							if (activeAnswerJobs.get(setId) === answersJobId) activeAnswerJobs.delete(setId);
						}
					}, { courseId, setId });
					activeAnswerJobs.set(setId, answersJobId);
				}
				return {
					questionCount: Number.isFinite(result?.questionCount) ? result.questionCount : 0,
					warnings: Array.isArray(result?.warnings) ? result.warnings.map(String) : [],
					answersJobId
				};
			} catch (error) {
				const message = userMessage(error);
				try {
					await store.update((state) => {
						const target = findSet(findCourse(state, courseId), setId);
						if (target !== undefined) {
							target.status = 'failed';
							target.error = message;
							target.updatedAt = Date.now();
						}
					});
				} catch (updateError) {
					logger?.warn?.(`practice-mode: 写解析失败状态出错：${updateError?.message ?? updateError}`);
				}
				throw error;
			} finally {
				activeParseJobs.delete(setId);
			}
		}, { courseId, setId });
		activeParseJobs.set(setId, jobId);
		return ok({ jobId });
	}

	function normalizeAnswer(value) {
		if (Array.isArray(value)) {
			return value
				.filter((item) => item !== undefined && item !== null)
				.map((item) => String(item));
		}
		if (typeof value === 'string') {
			const text = value.trim();
			return text === '' ? [] : [text];
		}
		if (typeof value === 'number' || typeof value === 'boolean') return [String(value)];
		return [];
	}

	function normalizeRecord(rawRecord, setId) {
		if (!isPlainObject(rawRecord)) throw new HttpError(400, '答题记录格式不正确');
		const questionId = typeof rawRecord.questionId === 'string' ? rawRecord.questionId.trim() : '';
		if (questionId === '') throw new HttpError(400, '答题记录缺少 questionId');
		const id = typeof rawRecord.id === 'string' && rawRecord.id.trim() !== ''
			? rawRecord.id.trim()
			: store.newId('r');
		const record = {
			id,
			setId,
			questionId,
			at: Number.isFinite(rawRecord.at) ? rawRecord.at : Date.now(),
			answer: normalizeAnswer(rawRecord.answer),
			correct: rawRecord.correct === true ? true : rawRecord.correct === false ? false : null,
			revealed: rawRecord.revealed === true,
			durationMs: Number.isFinite(rawRecord.durationMs) && rawRecord.durationMs > 0
				? Math.round(rawRecord.durationMs)
				: 0,
			mode: rawRecord.mode === 'end' ? 'end' : 'immediate',
			selfGraded: rawRecord.selfGraded === true
		};
		// 可选 AI 判题结果：只在请求显式携带该字段时写入（null 表示显式清空），
		// 仅保留安全字段；upsert 时未携带则保留已有值，兼容旧记录。
		if (Object.prototype.hasOwnProperty.call(rawRecord, 'aiGrade') && rawRecord.aiGrade !== undefined) {
			record.aiGrade = rawRecord.aiGrade === null ? null : sanitizeAiGrade(rawRecord.aiGrade);
		}
		return record;
	}

	async function handleAnswers(request) {
		const body = await readRequestJson(request);
		const courseId = readId(body.courseId, 'courseId');
		const setId = readId(body.setId, 'setId');
		const rawRecords = body.records;
		if (!Array.isArray(rawRecords)) throw new HttpError(400, 'records 必须是数组');
		if (rawRecords.length > MAX_RECORDS_PER_REQUEST) {
			throw new HttpError(400, `单次最多提交 ${MAX_RECORDS_PER_REQUEST} 条答题记录`);
		}
		const course = requireCourse(store.get(), courseId);
		requireSet(course, setId);
		const records = rawRecords.map((rawRecord) => normalizeRecord(rawRecord, setId));
		if (records.length === 0) return ok({ count: 0 });
		await store.update((state) => {
			const targetCourse = requireCourse(state, courseId);
			const targetSet = requireSet(targetCourse, setId);
			if (!Array.isArray(targetCourse.records)) targetCourse.records = [];
			for (const record of records) {
				const index = targetCourse.records.findIndex(
					(item) => isPlainObject(item) && item.id === record.id
				);
				if (index >= 0) targetCourse.records[index] = { ...targetCourse.records[index], ...record };
				else targetCourse.records.push(record);
			}
			const answeredQuestions = new Set(
				targetCourse.records
					.filter((item) => isPlainObject(item) && item.setId === setId)
					.map((item) => item.questionId)
			);
			targetSet.answeredCount = answeredQuestions.size;
			targetSet.updatedAt = Date.now();
			targetCourse.updatedAt = Date.now();
		});
		return ok({ count: records.length });
	}

	/** 读取 set.json 并返回题目集结构；未解析/损坏时给中文错误。 */
	async function loadSetJsonOrThrow(courseId, setId) {
		const relPath = setJsonRel(courseId, setId);
		if (!(await store.exists(relPath))) throw new HttpError(404, '题目集尚未解析完成');
		let parsed;
		try {
			parsed = JSON.parse(await store.readText(relPath));
		} catch {
			throw new HttpError(500, '题目集数据损坏，请重新解析');
		}
		if (!isPlainObject(parsed) || !Array.isArray(parsed.questions)) {
			throw new HttpError(500, '题目集数据格式不正确，请重新解析');
		}
		return parsed;
	}

	async function handleGrade(request) {
		const body = await readRequestJson(request);
		const courseId = readId(body.courseId, 'courseId');
		const setId = readId(body.setId, 'setId');
		const questionId = readText(body.questionId, '题目ID', 200);
		const userAnswer = normalizeGradeUserAnswer(body.userAnswer);
		const course = requireCourse(store.get(), courseId);
		requireSet(course, setId);
		if (typeof tasks?.grade !== 'function') throw new HttpError(500, 'AI 判题服务不可用');
		const setData = await loadSetJsonOrThrow(courseId, setId);
		const question = setData.questions.find(
			(item) => isPlainObject(item) && typeof item.id === 'string' && item.id === questionId
		);
		if (question === undefined) throw new HttpError(404, '题目不存在');
		const jobId = jobs.start('grade', async ({ progress, signal }) => {
			const result = await tasks.grade({ courseId, setId, questionId, userAnswer, signal, progress });
			const grade = sanitizeAiGrade(result);
			if (grade === null) throw new Error('AI 判题返回结果格式不正确');
			return grade;
		}, { courseId, setId, questionId });
		return ok({ jobId });
	}

	async function handleSetMode(request) {
		const body = await readRequestJson(request);
		const courseId = readId(body.courseId, 'courseId');
		const setId = readId(body.setId, 'setId');
		const mode = readText(body.mode, '练习模式', 20);
		if (mode !== 'immediate' && mode !== 'end') throw new HttpError(400, '练习模式只能是 immediate 或 end');
		await store.update((state) => {
			const set = requireSet(requireCourse(state, courseId), setId);
			set.mode = mode;
			set.updatedAt = Date.now();
		});
		return ok();
	}

	async function handleSetAiMode(request) {
		const body = await readRequestJson(request);
		const courseId = readId(body.courseId, 'courseId');
		const setId = readId(body.setId, 'setId');
		const aiAnswerMode = readText(body.aiAnswerMode, 'AI 答案解析模式', 20);
		if (!AI_ANSWER_MODES.includes(aiAnswerMode)) {
			throw new HttpError(400, 'AI 答案解析模式只能是 auto、off 或 regenerate');
		}
		await store.update((state) => {
			const set = requireSet(requireCourse(state, courseId), setId);
			set.aiAnswerMode = aiAnswerMode;
			set.updatedAt = Date.now();
		});
		return ok();
	}

	async function handleSetComplete(request) {
		const body = await readRequestJson(request);
		const courseId = readId(body.courseId, 'courseId');
		const setId = readId(body.setId, 'setId');
		const course = requireCourse(store.get(), courseId);
		const set = requireSet(course, setId);
		const records = (Array.isArray(course.records) ? course.records : []).filter(
			(record) => isPlainObject(record) && record.setId === setId
		);
		// 同一题多次作答以最新一条（at 最大）为准，与 Client 的 DSP.latestRecords 语义一致。
		const latestByQuestion = new Map();
		for (const record of records) {
			const key = String(record.questionId);
			const previous = latestByQuestion.get(key);
			if (previous === undefined || (Number(record.at) || 0) >= (Number(previous.at) || 0)) {
				latestByQuestion.set(key, record);
			}
		}
		const latest = [...latestByQuestion.values()];
		const questionCount = Number.isFinite(set.questionCount) ? Math.max(0, set.questionCount) : 0;
		const answeredCount = latest.length;
		const judged = latest.filter((record) => record.correct === true || record.correct === false);
		const correctCount = latest.filter((record) => record.correct === true).length;
		const accuracy = judged.length > 0 ? Math.round((correctCount / judged.length) * 10000) / 10000 : 0;
		const durationMs = latest.reduce(
			(sum, record) => sum + (Number.isFinite(record.durationMs) && record.durationMs > 0 ? record.durationMs : 0),
			0
		);
		const completedAt = Date.now();
		await store.update((state) => {
			const target = requireSet(requireCourse(state, courseId), setId);
			target.completedAt = completedAt;
			target.answeredCount = answeredCount;
			target.updatedAt = completedAt;
		});
		return ok({ summary: { questionCount, answeredCount, correctCount, accuracy, durationMs } });
	}

	async function handleSetDelete(request) {
		const body = await readRequestJson(request);
		const courseId = readId(body.courseId, 'courseId');
		const setId = readId(body.setId, 'setId');
		await store.update((state) => {
			const course = requireCourse(state, courseId);
			if (Array.isArray(course.sets)) course.sets = course.sets.filter((set) => !(isPlainObject(set) && set.id === setId));
			if (Array.isArray(course.records)) {
				course.records = course.records.filter((record) => !(isPlainObject(record) && record.setId === setId));
			}
			course.updatedAt = Date.now();
		});
		try {
			await store.remove(setDirRel(courseId, setId));
		} catch (error) {
			logger?.warn?.(`practice-mode: 删除题目集目录失败：${error?.message ?? error}`);
		}
		return ok();
	}

	async function handleDiagnose(request) {
		const body = await readRequestJson(request);
		const scope = readText(body.scope, '分析范围', 20);
		if (scope !== 'course' && scope !== 'set' && scope !== 'global') {
			throw new HttpError(400, '分析范围只能是 course、set 或 global');
		}
		if (typeof tasks?.diagnose !== 'function') throw new HttpError(500, '学情分析服务不可用');
		let courseId;
		let setId;
		if (scope === 'global') {
			courseId = readOptionalId(body.courseId, 'courseId');
		} else {
			courseId = readId(body.courseId, 'courseId');
			const course = requireCourse(store.get(), courseId);
			if (scope === 'set') {
				setId = readId(body.setId, 'setId');
				requireSet(course, setId);
			}
		}
		const jobId = jobs.start('diagnose', async ({ progress, signal }) => {
			const result = await tasks.diagnose({ courseId, scope, setId, signal, progress });
			return { markdown: typeof result?.markdown === 'string' ? result.markdown : '' };
		}, { courseId, scope, setId });
		return ok({ jobId });
	}

	async function handleSvg(request) {
		const body = await readRequestJson(request);
		const courseId = readId(body.courseId, 'courseId');
		const setId = readId(body.setId, 'setId');
		const questionId = typeof body.questionId === 'string' ? body.questionId.trim() : '';
		if (questionId === '') throw new HttpError(400, '缺少 questionId');
		const figureIndex = Number(body.figureIndex);
		if (!Number.isInteger(figureIndex) || figureIndex < 0) {
			throw new HttpError(400, 'figureIndex 必须是非负整数');
		}
		if (typeof tasks?.redrawFigure !== 'function') throw new HttpError(500, '图片重绘服务不可用');
		const instruction = readOptionalText(body.instruction, 4000);
		requireSet(requireCourse(store.get(), courseId), setId);
		const jobId = jobs.start('svg', async ({ progress, signal }) => {
			const result = await tasks.redrawFigure({
				courseId,
				setId,
				questionId,
				figureIndex,
				instruction,
				signal,
				progress
			});
			return { relPath: typeof result?.relPath === 'string' ? result.relPath : '' };
		}, { courseId, setId, questionId, figureIndex });
		return ok({ jobId });
	}

	/** 规范化 chat 的 message（透传 setId 供 tasks 查题）。 */
	function normalizeChatMessage(rawMessage) {
		const message = isPlainObject(rawMessage) ? rawMessage : {};
		const text = (typeof message.text === 'string' ? message.text : '').trim();
		if (text === '') throw new HttpError(400, '消息内容不能为空');
		const normalized = {
			text: text.slice(0, 20000),
			questionId: typeof message.questionId === 'string' && message.questionId.trim() !== ''
				? message.questionId.trim()
				: null,
			selectedText: typeof message.selectedText === 'string' ? message.selectedText.trim().slice(0, 40000) : '',
			docNames: Array.isArray(message.docNames)
				? message.docNames
					.filter((name) => typeof name === 'string' && name.trim() !== '')
					.map((name) => name.trim())
					.slice(0, 50)
				: []
		};
		if (typeof message.setId === 'string' && message.setId.trim() !== '') {
			normalized.setId = message.setId.trim();
		}
		return normalized;
	}

	async function handleChat(request) {
		const body = await readRequestJson(request);
		const courseId = readId(body.courseId, 'courseId');
		requireCourse(store.get(), courseId);
		const threadId = readOptionalId(body.threadId, 'threadId');
		const message = normalizeChatMessage(body.message);
		if (typeof tasks?.chat !== 'function') throw new HttpError(500, '对话服务不可用');

		const encoder = new TextEncoder();
		let controller = null;
		let closed = false;
		const stream = new ReadableStream({
			start(streamController) {
				controller = streamController;
			},
			cancel() {
				closed = true;
			}
		});
		const send = (payload) => {
			if (closed || controller === null) return false;
			try {
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
				return true;
			} catch {
				closed = true;
				return false;
			}
		};
		const finish = () => {
			if (closed) return;
			closed = true;
			try {
				controller?.close();
			} catch {
				/* 客户端已断开 */
			}
		};

		// 用户消息与线程的持久化由 tasks.chat 负责；本模块只转发 SSE 帧。
		void (async () => {
			let metaSent = false;
			try {
				const result = await tasks.chat({
					courseId,
					threadId,
					message,
					signal: request.signal,
					onDelta: (text) => {
						if (typeof text === 'string' && text !== '') send({ type: 'delta', text });
					},
					onMeta: (id) => {
						if (typeof id === 'string' && id !== '') {
							metaSent = true;
							send({ type: 'meta', threadId: id });
						}
					}
				});
				if (!metaSent && typeof result?.threadId === 'string' && result.threadId !== '') {
					send({ type: 'meta', threadId: result.threadId });
				}
				const reply = isPlainObject(result?.reply)
					? result.reply
					: { role: 'assistant', text: '', at: Date.now(), refs: [] };
				send({ type: 'done', message: reply });
			} catch (error) {
				logger?.warn?.(`practice-mode: 对话失败：${error?.message ?? error}`);
				if (request.signal === undefined || request.signal.aborted !== true) {
					send({ type: 'error', error: userMessage(error) });
				}
			} finally {
				finish();
			}
		})();

		return new Response(stream, {
			status: 200,
			headers: {
				'content-type': 'text/event-stream; charset=utf-8',
				'cache-control': 'no-cache',
				connection: 'keep-alive',
				'x-accel-buffering': 'no'
			}
		});
	}

	async function handleChatClear(request) {
		const body = await readRequestJson(request);
		const courseId = readId(body.courseId, 'courseId');
		requireCourse(store.get(), courseId);
		/* 清空对话时重置该课程的 Agent 会话记忆，避免旧上下文继续影响新对话。 */
		if (typeof tasks?.resetChat === 'function') {
			try {
				await tasks.resetChat({ courseId });
			} catch (error) {
				logger?.warn?.(`practice-mode: 重置对话 Agent 失败（忽略）：${error?.message ?? error}`);
			}
		}
		const requestedThreadId = readOptionalId(body.threadId, 'threadId');
		const now = Date.now();
		if (requestedThreadId !== undefined) {
			const relPath = chatRel(courseId, requestedThreadId);
			const thread = {
				id: requestedThreadId,
				courseId,
				title: '新对话',
				createdAt: now,
				updatedAt: now,
				messages: []
			};
			if (await store.exists(relPath)) {
				try {
					const existing = JSON.parse(await store.readText(relPath));
					if (isPlainObject(existing)) {
						if (typeof existing.title === 'string' && existing.title.trim() !== '') thread.title = existing.title;
						if (Number.isFinite(existing.createdAt)) thread.createdAt = existing.createdAt;
					}
				} catch {
					/* 线程文件损坏：直接覆盖为空线程 */
				}
			}
			await store.writeFile(relPath, `${JSON.stringify(thread, null, 2)}\n`);
			await store.update((state) => {
				const course = requireCourse(state, courseId);
				if (!Array.isArray(course.chatThreads)) course.chatThreads = [];
				const summary = course.chatThreads.find(
					(item) => isPlainObject(item) && item.id === requestedThreadId
				);
				if (summary === undefined) {
					course.chatThreads.push({
						id: requestedThreadId,
						title: thread.title,
						createdAt: thread.createdAt,
						updatedAt: now,
						messageCount: 0,
						questionId: null
					});
				} else {
					summary.title = thread.title;
					summary.updatedAt = now;
					summary.messageCount = 0;
					summary.questionId = null;
				}
				course.updatedAt = now;
			});
			return ok({ threadId: requestedThreadId });
		}

		const threadId = store.newId('t');
		const thread = {
			id: threadId,
			courseId,
			title: NEW_THREAD_TITLE,
			createdAt: now,
			updatedAt: now,
			messages: []
		};
		await store.writeFile(chatRel(courseId, threadId), `${JSON.stringify(thread, null, 2)}\n`);
		await store.update((state) => {
			const course = requireCourse(state, courseId);
			if (!Array.isArray(course.chatThreads)) course.chatThreads = [];
			course.chatThreads.push({
				id: threadId,
				title: thread.title,
				createdAt: now,
				updatedAt: now,
				messageCount: 0,
				questionId: null
			});
			course.updatedAt = now;
		});
		return ok({ threadId });
	}

	async function handleThread(request) {
		const courseId = readId(requireQuery(request, 'courseId'), 'courseId');
		const threadId = readId(requireQuery(request, 'threadId'), 'threadId');
		requireCourse(store.get(), courseId);
		const relPath = chatRel(courseId, threadId);
		if (!(await store.exists(relPath))) throw new HttpError(404, '对话不存在');
		let thread;
		try {
			thread = JSON.parse(await store.readText(relPath));
		} catch {
			throw new HttpError(500, '对话数据损坏，无法读取');
		}
		const data = isPlainObject(thread) ? thread : {};
		return ok({
			data: {
				...data,
				id: typeof data.id === 'string' ? data.id : threadId,
				title: typeof data.title === 'string' ? data.title : '新对话',
				messages: Array.isArray(data.messages) ? data.messages : []
			}
		});
	}

	// ---------------------------------------------------------------------
	// 路由表与注册
	// ---------------------------------------------------------------------

	/** 统一捕获异常并按契约返回中文 JSON。 */
	function wrap(handler) {
		return async (request) => {
			try {
				await store.ready();
				return await handler(request);
			} catch (error) {
				if (error instanceof HttpError) return fail(error.status, error.message);
				logger?.warn?.(`practice-mode: API 请求处理失败：${error?.stack ?? String(error)}`);
				return fail(500, userMessage(error));
			}
		};
	}

	const routeTable = [
		{ path: `${API_PREFIX}/ping`, methods: ['GET'], handler: handlePing },
		{ path: `${API_PREFIX}/bootstrap`, methods: ['GET'], handler: handleBootstrap },
		{ path: `${API_PREFIX}/set/mode`, methods: ['POST'], handler: handleSetMode },
		{ path: `${API_PREFIX}/set/ai-mode`, methods: ['POST'], handler: handleSetAiMode },
		{ path: `${API_PREFIX}/set/complete`, methods: ['POST'], handler: handleSetComplete },
		{ path: `${API_PREFIX}/set/delete`, methods: ['POST'], handler: handleSetDelete },
		{ path: `${API_PREFIX}/set`, methods: ['GET'], handler: handleSet },
		{ path: `${API_PREFIX}/job`, methods: ['GET'], handler: handleJob },
		{ path: `${API_PREFIX}/asset`, methods: ['GET'], handler: handleAsset },
		{ path: `${API_PREFIX}/course`, methods: ['POST'], handler: handleCourse },
		{ path: `${API_PREFIX}/doc/delete`, methods: ['POST'], handler: handleDocDelete },
		{ path: `${API_PREFIX}/upload`, methods: ['POST'], handler: handleUpload },
		{ path: `${API_PREFIX}/parse`, methods: ['POST'], handler: handleParse },
		{ path: `${API_PREFIX}/answers`, methods: ['POST'], handler: handleAnswers },
		{ path: `${API_PREFIX}/grade`, methods: ['POST'], handler: handleGrade },
		{ path: `${API_PREFIX}/diagnose`, methods: ['POST'], handler: handleDiagnose },
		{ path: `${API_PREFIX}/svg`, methods: ['POST'], handler: handleSvg },
		{ path: `${API_PREFIX}/chat/clear`, methods: ['POST'], handler: handleChatClear },
		{ path: `${API_PREFIX}/chat`, methods: ['POST'], handler: handleChat },
		{ path: `${API_PREFIX}/thread`, methods: ['GET'], handler: handleThread }
	].map((route) => ({
		path: route.path,
		methods: route.methods,
		requestBody: 'buffered',
		fetch: wrap(route.handler)
	}));

	/** 从 Cordis 上下文/作用域里取出 connection 服务。 */
	function resolveConnection(scope) {
		if (scope === null || scope === undefined) return undefined;
		try {
			if (scope.connection !== undefined && scope.connection !== null) return scope.connection;
		} catch {
			/* 某些作用域对未就绪服务会抛错，继续尝试 get */
		}
		try {
			if (typeof scope.get === 'function') {
				const connection = scope.get('connection');
				if (connection !== undefined && connection !== null) return connection;
			}
		} catch {
			/* ignore */
		}
		return undefined;
	}

	let registered = false;
	let disposed = false;
	let disposers = [];

	/** 把全部路由注册到 connection.fetch；返回清理函数。 */
	function install(scope, connection, hostCtx) {
		if (registered || disposed) return;
		const localDisposers = [];
		try {
			for (const route of routeTable) {
				const disposer = connection.fetch.register({
					path: route.path,
					methods: route.methods,
					requestBody: 'buffered',
					fetch: route.fetch
				});
				if (typeof disposer === 'function') localDisposers.push(disposer);
			}
		} catch (error) {
			for (const disposer of localDisposers) {
				try {
					disposer();
				} catch {
					/* ignore */
				}
			}
			throw error;
		}
		registered = true;
		disposers = localDisposers;

		// 由 ctx.effect（优先）或 dispose 事件自动清理。
		const effectTarget = scope !== undefined && scope !== null && typeof scope.effect === 'function'
			? scope
			: hostCtx !== undefined && hostCtx !== null && typeof hostCtx.effect === 'function' ? hostCtx : null;
		if (effectTarget !== null) {
			try {
				effectTarget.effect(() => dispose, 'practice-mode: HTTP API 路由');
				return;
			} catch (error) {
				logger?.warn?.(`practice-mode: 注册路由清理钩子失败：${error?.message ?? error}`);
			}
		}
		const onTarget = scope !== undefined && scope !== null && typeof scope.on === 'function'
			? scope
			: hostCtx !== undefined && hostCtx !== null && typeof hostCtx.on === 'function' ? hostCtx : null;
		if (onTarget !== null) {
			try {
				onTarget.on('dispose', dispose);
			} catch {
				/* ignore */
			}
		}
	}

	/** 注销全部路由（幂等）。 */
	function dispose() {
		if (disposed) return;
		disposed = true;
		registered = false;
		const pending = disposers;
		disposers = [];
		for (let index = pending.length - 1; index >= 0; index -= 1) {
			try {
				pending[index]?.();
			} catch (error) {
				logger?.warn?.(`practice-mode: 注销路由失败：${error?.message ?? error}`);
			}
		}
	}

	/**
	 * 注册全部路由。支持两种接法：
	 *   1. 直接 ctx（ctx.connection 就绪），例如 `routes.register(ctx)`；
	 *   2. 根上下文没有 connection 时退回 `ctx.inject(['connection'], …)`。
	 * @param {object} ctx Cordis 上下文（或作用域）
	 * @returns {Function} 注销函数
	 */
	function register(ctx) {
		if (typeof ctx !== 'object' || ctx === null) {
			throw new Error('routes.register(ctx) 需要有效的 Cordis 上下文');
		}
		if (disposed) return dispose;
		if (registered) return dispose;
		const direct = resolveConnection(ctx);
		if (direct !== undefined) {
			install(ctx, direct, ctx);
			return dispose;
		}
		if (typeof ctx.inject === 'function') {
			ctx.inject(['connection'], (scope) => {
				const connection = resolveConnection(scope);
				if (connection === undefined) {
					logger?.warn?.('practice-mode: connection 服务不可用，无法注册刷题模式 HTTP 路由');
					return;
				}
				install(scope ?? ctx, connection, ctx);
			});
			return dispose;
		}
		throw new Error('当前上下文缺少 connection.fetch.register，无法注册刷题模式 HTTP 路由');
	}

	return { register, dispose };
}
