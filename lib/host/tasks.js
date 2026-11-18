/**
 * 刷题模式 — Host 后台任务编排（tasks.js）。
 *
 * 四个编排函数（docs/CONTRACT.md 5.6）：
 *   - parseSet：渲染题目源文件 → Agent 按 ≤8 页识别 → 规范化/合并 → 图形落盘 → 写 set.json；
 *   - diagnose：聚合答题记录统计 → Agent 读取课程文档 → 学情分析 markdown → 写入 store.analyses；
 *   - redrawFigure：Agent 重绘某道题的某个图形 → sanitizeSvg → 写 assets 并更新 set.json；
 *   - chat：读取/创建对话线程、持久 Agent Session 流式回答、持久化消息与线程摘要。
 * 另外导出 readThread（api.js 的 GET /api/practice/thread 使用）。
 *
 * 所有 AI 任务统一走真实 DSH Agent 运行时（runtime.runTurn）；结构化结果由 Agent 作用域的
 * submit_* 工具直接回传，不再从回答文本里抽 JSON，也不再有 ctx.llm 直连回退。
 *
 * 工厂签名：createTasks({ store, render, runtime?, getRuntime?, logger }) -> tasks
 */

import { readFile as readFileFs } from 'node:fs/promises';
import { basename, extname } from 'node:path';

import {
	ANSWER_KEY_RESULT_TOOL,
	ANSWER_RESULT_TOOL,
	GRADE_RESULT_TOOL,
	PARSE_RESULT_TOOL,
	buildAnswerKeyAgentPrompt,
	buildAnswerPrompt,
	buildChatAgentPrompt,
	buildDiagnosePrompt,
	buildGradePrompt,
	buildParseAgentPrompt,
	buildSvgPrompt,
	docRelativePath,
	mergeParsedSets,
	needsFigureRetry,
	normalizeAiAnswerMode,
	normalizeAnswerKey,
	normalizeGeneratedAnswers,
	normalizeGradeResult,
	normalizeParsedSet,
	sanitizeSvg
} from './prompts.js';

/** 原始题目/答案文件解析：单个文件一次 Agent turn 的超时。 */
const AGENT_PARSE_TIMEOUT_MS = 1_200_000;
const AGENT_ANSWER_KEY_TIMEOUT_MS = 1_200_000;
const AGENT_CHAT_TIMEOUT_MS = 240_000;
/** 判卷只比对已准备的标准答案，必须快。 */
const AGENT_GRADE_TIMEOUT_MS = 90_000;
const AGENT_DIAGNOSE_TIMEOUT_MS = 240_000;
const AGENT_REDRAW_TIMEOUT_MS = 180_000;
const AGENT_ANSWERS_TIMEOUT_MS = 600_000;
/** AI 答案解析：最多处理 40 道题，每批 8 题、最多 5 批。 */
const MAX_AI_ANSWER_QUESTIONS = 40;
const AI_ANSWER_BATCH_SIZE = 8;
const AI_ANSWER_MAX_BATCHES = 5;
const MAX_QUESTIONS_FOR_STATS = 2000;

const TYPE_LABELS = {
	single: '单选',
	multiple: '多选',
	judge: '判断',
	fill: '填空',
	short: '简答',
	other: '其他'
};

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

/** 去重字符串数组（保持顺序）。 */
function uniqueStrings(values) {
	const seen = new Set();
	const result = [];
	for (const value of values) {
		const text = asString(value);
		if (text === '' || seen.has(text)) continue;
		seen.add(text);
		result.push(text);
	}
	return result;
}

/** 统一小写扩展名（带点）。 */
function normalizeExt(value) {
	const ext = asString(value).toLowerCase();
	if (ext === '') return '';
	return ext.startsWith('.') ? ext : `.${ext}`;
}

/** 取消错误。 */
function abortError() {
	const error = new Error('任务已取消。');
	error.code = 'ABORTED';
	return error;
}

/** 是否为取消错误。 */
function isAbortError(error) {
	return isPlainObject(error) && error.code === 'ABORTED';
}

/** 安全调用 progress 回调。 */
function makeNotifier(progress) {
	return (message, percent) => {
		if (typeof progress !== 'function') return;
		try {
			progress(message, percent);
		} catch {
			/* 进度回调失败不影响任务 */
		}
	};
}

/** 日期（本地时区）→ YYYY-MM-DD。 */
function dayKey(timestamp) {
	const date = new Date(timestamp);
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${date.getFullYear()}-${month}-${day}`;
}

/** 数据根内相对路径：套题 set.json。 */
function setRelPath(courseId, setId) {
	return `courses/${courseId}/sets/${setId}/set.json`;
}


/** 数据根内相对路径：课程 assets 目录。 */
function assetsDirRelPath(courseId) {
	return `courses/${courseId}/assets`;
}

/** 数据根内相对路径：对话线程。 */
function threadRelPath(courseId, threadId) {
	return `courses/${courseId}/chat/${threadId}.json`;
}

/** 按 id 找课程；找不到抛中文错误。 */
function requireCourse(state, courseId) {
	const id = asString(courseId);
	const course = (state?.courses ?? []).find((item) => asString(item?.id) === id);
	if (!course) throw new Error('找不到课程，请刷新后重试。');
	return course;
}

/** 按 id 找套题摘要；找不到抛中文错误。 */
function requireSetSummary(course, setId) {
	const id = asString(setId);
	const summary = (course?.sets ?? []).find((item) => asString(item?.id) === id);
	if (!summary) throw new Error('找不到这套题目，请刷新后重试。');
	return summary;
}

/** 读取 set.json。 */
async function readSetJson(store, courseId, setId) {
	const relPath = setRelPath(courseId, setId);
	let text;
	try {
		text = await store.readText(relPath);
	} catch (error) {
		if (error?.code === 'ENOENT') throw new Error('题目还没有解析完成，请先解析这套题。');
		throw new Error(`读取题目文件失败：${error instanceof Error ? error.message : String(error)}`);
	}
	let set;
	try {
		set = JSON.parse(text);
	} catch {
		throw new Error('题目文件已损坏，请重新解析这套题。');
	}
	if (!isPlainObject(set) || !Array.isArray(set.questions)) throw new Error('题目文件格式不正确，请重新解析这套题。');
	return set;
}

/** 写回 set.json。 */
async function writeSetJson(store, courseId, setId, set) {
	set.updatedAt = Date.now();
	await store.writeFile(setRelPath(courseId, setId), `${JSON.stringify(set, null, 2)}\n`);
}

/**
 * 读取对话线程文件。
 * @param {{store: object, courseId: string, threadId: string}} options
 * @returns {Promise<object|null>} 不存在或损坏时返回 null（不抛错）
 */
export async function readThread({ store, courseId, threadId } = {}) {
	if (store === undefined || store === null || typeof store.readText !== 'function') {
		throw new Error('readThread 需要可用的 store。');
	}
	const course = asString(courseId);
	const thread = asString(threadId);
	if (course === '' || thread === '') return null;
	let text;
	try {
		text = await store.readText(threadRelPath(course, thread));
	} catch (error) {
		if (error?.code === 'ENOENT') return null;
		throw error;
	}
	try {
		const value = JSON.parse(text);
		return isPlainObject(value) && Array.isArray(value.messages) ? value : null;
	} catch {
		return null;
	}
}

/** 写出对话线程文件（带 schema 兜底）。 */
async function writeThread(store, courseId, thread) {
	const payload = {
		id: thread.id,
		courseId,
		title: thread.title || '新对话',
		createdAt: Number.isFinite(thread.createdAt) ? thread.createdAt : Date.now(),
		updatedAt: Date.now(),
		messages: Array.isArray(thread.messages) ? thread.messages : []
	};
	await store.writeFile(threadRelPath(courseId, thread.id), `${JSON.stringify(payload, null, 2)}\n`);
	return payload;
}

/** 更新 store.json 里的 chatThreads 摘要。 */
async function upsertThreadSummary(store, courseId, thread) {
	const messages = Array.isArray(thread.messages) ? thread.messages : [];
	const lastQuestion = [...messages].reverse().find((message) => message?.role === 'user')?.context ?? null;
	const summary = {
		id: thread.id,
		title: thread.title || '新对话',
		createdAt: Number.isFinite(thread.createdAt) ? thread.createdAt : Date.now(),
		updatedAt: Date.now(),
		messageCount: messages.length,
		questionId: asString(lastQuestion?.questionId) || null
	};
	await store.update((draft) => {
		const course = requireCourse(draft, courseId);
		if (!Array.isArray(course.chatThreads)) course.chatThreads = [];
		const index = course.chatThreads.findIndex((item) => asString(item?.id) === thread.id);
		if (index >= 0) course.chatThreads[index] = { ...course.chatThreads[index], ...summary };
		else course.chatThreads.push(summary);
		course.updatedAt = Date.now();
	});
}

/**
 * 创建任务编排。
 *
 * @param {object} deps
 * @param {object} deps.store createStore 实例
 * @param {object} [deps.runtime] Agent 运行时（或通过 getRuntime 注入）
 * @param {() => object} [deps.getRuntime]
 * @param {{warn?: Function, info?: Function, error?: Function, debug?: Function}} [deps.logger]
 */
export function createTasks({ store, runtime, getRuntime, logger } = {}) {
	if (store === undefined || typeof store.get !== 'function') throw new Error('createTasks 需要可用的 store。');

	/** 已有持久 Agent Session 的课程：只有首次（或清空后）对话才把历史带进 prompt。 */
	const chatSessions = new Set();

	function log(level, message, error) {
		try {
			const text = error === undefined ? message : `${message}：${error instanceof Error ? error.message : String(error)}`;
			(logger?.[level] ?? logger?.warn)?.call?.(logger, text);
		} catch {
			/* 忽略日志失败 */
		}
	}

	/** Agent 运行时的 cwd：优先数据根目录。 */
	function dataRootPath() {
		const root = asString(store.rootDir);
		return root !== '' ? root : process.cwd();
	}

	/** 取可用的 Agent 运行时；不可用返回 null。 */
	function agentRuntime() {
		let candidate = runtime;
		if (typeof getRuntime === 'function') {
			try {
				candidate = getRuntime();
			} catch (error) {
				log('warn', '获取 Agent 运行时失败', error);
				return null;
			}
		}
		if (candidate === undefined || candidate === null || typeof candidate.runTurn !== 'function') return null;
		if (typeof candidate.available === 'function') {
			try {
				if (!candidate.available()) return null;
			} catch {
				return null;
			}
		}
		return candidate;
	}

	/** 所有 AI 任务统一走 DSH Agent；不可用直接抛中文错误。 */
	function requireAgent() {
		const agent = agentRuntime();
		if (agent === null) throw new Error('DSH Agent 运行时不可用，请检查模型与 Agent 配置后重试。');
		return agent;
	}


	// ------------------------------------------------------------------
	// parseSet
	// ------------------------------------------------------------------

	// ------------------------------------------------------------------
	// parseSet
	// ------------------------------------------------------------------

	/** 套题原始文件目录（数据根内相对路径 / 绝对路径）。 */
	function sourceDirRelPath(courseId, setId) {
		return `courses/${courseId}/sets/${setId}/source`;
	}

	function sourceDirAbsPath(courseId, setId) {
		return store.abs(sourceDirRelPath(courseId, setId));
	}

	/** 把 Agent 返回（或超时前已提交）的结果规范化为 set。 */
	function normalizeAgentSet(turn, { courseId, setId, titleFallback }) {
		return normalizeParsedSet(turn?.result ?? turn?.text, { courseId, setId, titleFallback });
	}

	/** 从错误里取出已经提交/已经生成的部分结果。 */
	function partialOf(error) {
		return isPlainObject(error?.partial) ? error.partial : null;
	}

	/**
	 * 解析题目：每个原始文件一次 Agent turn，直接把文件路径交给 Agent（不预先转页面图片）。
	 * 提示词里给出完整 JSON 格式；Agent 也可以用 submit_questions 提交同一份 JSON。
	 */
	async function runParseBatches({ courseId, setId, courseName, files, titleFallback, signal, notify, warnings }) {
		const parts = [];
		const errors = [];
		const runtime = requireAgent();
		const workingDir = sourceDirAbsPath(courseId, setId);
		for (const [index, file] of files.entries()) {
			if (signal?.aborted) throw abortError();
			const name = asString(file?.name) || basename(asString(file?.relPath)) || `文件${index + 1}`;
			const percent = 20 + Math.round(((index + 1) / files.length) * 64);
			notify(`正在解析题目…（${index + 1}/${files.length} ${name}）`, percent);
			const parseOnce = async (retry) => {
				const promptText = buildParseAgentPrompt({
					courseName,
					files: [name],
					workingDir,
					retry: retry === true
				});
				try {
					const turn = await runtime.runTurn({
						promptText,
						cwd: workingDir,
						// 直接给文件：允许读取文本/图片、必要时用 bash 提取文本或裁剪图形。
						allowTools: ['read', 'read_image', 'bash', 'write', 'glob', 'grep'],
						submitTool: PARSE_RESULT_TOOL,
						requireSubmit: true,
						submitNudge: '不要再处理文件或图形。立即把已经解析出的全部题目按上面的 JSON 格式调用 submit_questions 提交；没有答案的题 hasAnswer=false。',
						signal,
						timeoutMs: AGENT_PARSE_TIMEOUT_MS
					});
					return normalizeAgentSet(turn, { courseId, setId, titleFallback });
				} catch (error) {
					if (signal?.aborted) throw abortError();
					const partial = partialOf(error);
					if (partial !== null && partial.result !== null) {
						try {
							return normalizeParsedSet(partial.result, { courseId, setId, titleFallback });
						} catch {
							/* 继续尝试正文 */
						}
					}
					if (partial !== null && asString(partial.text) !== '') {
						try {
							return normalizeParsedSet(partial.text, { courseId, setId, titleFallback });
						} catch {
							/* 交给外层记 warning */
						}
					}
					throw error;
				}
			};

			try {
				let normalized = await parseOnce(false);
				if (needsFigureRetry(normalized, normalized.warnings)) {
					notify(`正在重试图形…（${name}）`, percent);
					try {
						const retried = await parseOnce(true);
						const merged = mergeParsedSets([normalized, retried], { courseId, setId, titleFallback });
						if (needsFigureRetry(merged, [])) {
							warnings.push(`《${name}》图形在重试后仍无效（缺少有效图片 path 或 SVG），该题将只显示文字内容。`);
						}
						normalized = merged;
					} catch (retryError) {
						if (signal?.aborted) throw abortError();
						const message = retryError instanceof Error ? retryError.message : String(retryError);
						warnings.push(`《${name}》图形重试失败：${message}`);
						log('warn', '图形重试失败', retryError);
					}
				}
				parts.push(normalized);
				normalized.warnings.forEach((warning) => warnings.push(warning));
			} catch (error) {
				if (signal?.aborted) throw abortError();
				const message = error instanceof Error ? error.message : String(error);
				errors.push(`《${name}》${message}`);
				warnings.push(`《${name}》解析失败：${message}`);
				log('warn', `文件解析失败：${name}`, error);
			}
		}
		if (parts.length === 0) {
			throw new Error(`题目解析失败：${errors[0] ?? 'Agent 没有返回可用结果，请重试。'}`);
		}
		return parts;
	}

	/**
	 * 持久化 figures：
	 *   - kind:'image'（Agent 自己生成/裁剪的图片绝对路径）→ 校验文件存在后复制到 assets/f_<setId>_<owner>_<i>.<ext>，
	 *     输出 {kind:'image', relPath, alt}；
	 *   - kind:'svg' → 清洗后的内联 SVG 落盘为 .svg；
	 *   - 文件不存在/读取失败时记 warning 并忽略该图（不再附整页截图）。
	 */
	async function persistFigures({ courseId, setId, ownerId, figures, warnings }) {
		const saved = [];
		for (let index = 0; index < figures.length; index += 1) {
			const figure = figures[index];
			if (!isPlainObject(figure)) continue;
			const alt = asString(figure.alt) || `图${index + 1}`;
			if (figure.kind === 'image') {
				const imagePath = asString(figure.path);
				if (imagePath === '') {
					warnings.push(`图片素材无效（${ownerId} 第 ${index + 1} 个图）：缺少 path（Agent 生成图片的绝对路径），已忽略。`);
					continue;
				}
				let buffer;
				try {
					buffer = await readFileFs(imagePath);
				} catch (error) {
					warnings.push(`图片素材无效（${ownerId} 第 ${index + 1} 个图）：无法读取 ${imagePath}（${error instanceof Error ? error.message : String(error)}），已忽略。`);
					continue;
				}
				const ext = normalizeExt(extname(imagePath)) || '.png';
				const relPath = `${assetsDirRelPath(courseId)}/f_${setId}_${ownerId}_${index + 1}${ext}`;
				try {
					await store.writeFile(relPath, buffer);
					saved.push({ kind: 'image', relPath, alt });
				} catch (error) {
					warnings.push(`图形保存失败（${ownerId} 第 ${index + 1} 个图）：${error instanceof Error ? error.message : String(error)}`);
				}
				continue;
			}
			if (figure.kind !== 'svg' || asString(figure.svg) === '') continue;
			const relPath = `${assetsDirRelPath(courseId)}/f_${setId}_${ownerId}_${index + 1}.svg`;
			try {
				await store.writeFile(relPath, figure.svg);
				saved.push({ kind: 'svg', relPath, alt });
			} catch (error) {
				warnings.push(`图形保存失败（${ownerId} 第 ${index + 1} 个图）：${error instanceof Error ? error.message : String(error)}`);
			}
		}
		return saved;
	}

	/** 计算本套题已作答题数。 */
	function countAnswered(records, questions, setId) {
		const questionIds = new Set(questions.map((question) => asString(question.id)));
		const answered = new Set();
		for (const record of records ?? []) {
			if (asString(record.setId) !== setId) continue;
			if (!questionIds.has(asString(record.questionId))) continue;
			answered.add(asString(record.questionId));
		}
		return answered.size;
	}

	/**
	 * 解析答案文件（与试卷分开上传的原卷答案/解析），并把答案匹配回题目。
	 * 支持 PDF / DOCX / PPTX / DOC / PPT / 图片 / txt / md；PDF/Office 先渲染页面，
	 * 每 ≤8 页一次 Agent turn，结构化答案由 submit_answer_key 工具回传；单批失败不阻塞整体解析。
	 *
	 * @returns {Promise<number>} 匹配成功的题目数
	 */
	async function applyAnswerKeyFiles({ courseId, course, set, answerFiles, signal, notify, warnings }) {
		if (!Array.isArray(answerFiles) || answerFiles.length === 0) return 0;
		const runtime = requireAgent();
		const courseName = asString(course.name) || '未命名课程';
		const workingDir = sourceDirAbsPath(courseId, set.id);
		const questionById = new Map();
		for (const question of set.questions ?? []) {
			const key = asString(question?.id);
			if (key !== '') questionById.set(key, question);
		}
		let matched = 0;
		const applyNormalized = (normalized) => {
			if (normalized === undefined || normalized === null) return;
			(normalized.warnings ?? []).forEach((warning) => warnings.push(warning));
			for (const [key, item] of normalized.answers ?? []) {
				const question = questionById.get(key);
				if (question === undefined) continue;
				question.answer = item.answer;
				question.answerDisplay = item.answerDisplay;
				if (Array.isArray(item.answerFigures)) question.answerFigures = item.answerFigures;
				if (item.analysis !== '') question.analysis = item.analysis;
				question.hasAnswer = true;
				question.answerSource = 'source';
				question.answerRefs = [];
				matched += 1;
			}
		};

		for (const [index, file] of answerFiles.entries()) {
			if (signal?.aborted) throw abortError();
			const name = asString(file?.name) || basename(asString(file?.relPath)) || `答案文件${index + 1}`;
			notify(`正在解析答案文件…（${index + 1}/${answerFiles.length} ${name}）`, 86);
			const promptText = buildAnswerKeyAgentPrompt({
				courseName,
				files: [name],
				workingDir
			});
			try {
				const turn = await runtime.runTurn({
					promptText,
					cwd: workingDir,
					allowTools: ['read', 'read_image', 'bash', 'write', 'glob', 'grep'],
					submitTool: ANSWER_KEY_RESULT_TOOL,
					requireSubmit: true,
					submitNudge: '不要再处理文件或图形。立即把已经整理出的答案按 JSON 数组格式调用 submit_answer_key 提交。',
					signal,
					timeoutMs: AGENT_ANSWER_KEY_TIMEOUT_MS
				});
				applyNormalized(normalizeAnswerKey(turn.result ?? turn.text, { questions: set.questions }));
			} catch (error) {
				if (signal?.aborted || isAbortError(error)) throw abortError();
				const partial = partialOf(error);
				let applied = false;
				if (partial !== null && partial.result !== null) {
					try {
						applyNormalized(normalizeAnswerKey(partial.result, { questions: set.questions }));
						applied = true;
					} catch {
						/* 继续尝试正文 */
					}
				}
				if (!applied && partial !== null && asString(partial.text) !== '') {
					try {
						applyNormalized(normalizeAnswerKey(partial.text, { questions: set.questions }));
						applied = true;
					} catch {
						/* 交给 warning */
					}
				}
				if (!applied) {
					const message = error instanceof Error ? error.message : String(error);
					warnings.push(`《${name}》答案文件解析失败：${message}`);
					log('warn', `答案文件解析失败：${name}`, error);
				}
			}
		}
		return matched;
	}
	/**
	 * AI 答案解析：按 aiAnswerMode 决定「为缺答案题生成」或「全部重新生成」。
	 * - auto：仅为仍缺答案（hasAnswer !== true）的题生成参考答案；
	 * - regenerate：为全部题目重新生成（覆盖原卷答案，原答案保存到 sourceAnswer/sourceAnswerDisplay）；
	 * 生成失败不阻塞解析，只记中文 warnings；每批 ≤8 题、最多 5 批（40 题）。
	 *
	 * @returns {Promise<{generated: number, targets: number}>}
	 */
	async function generateAiAnswers({ courseId, course, set, mode, signal, notify, warnings }) {
		const questions = Array.isArray(set?.questions) ? set.questions : [];
		const regenerate = mode === 'regenerate';
		let targets = regenerate
			? questions.slice()
			: questions.filter((question) => question !== null && question.hasAnswer !== true);
		if (targets.length === 0) return { generated: 0, targets: 0 };
		const totalTargets = targets.length;
		if (targets.length > MAX_AI_ANSWER_QUESTIONS) {
			targets = targets.slice(0, MAX_AI_ANSWER_QUESTIONS);
			warnings.push(regenerate
				? `本套题共 ${totalTargets} 道题，超过 ${MAX_AI_ANSWER_QUESTIONS} 道上限，已只重新生成前 ${targets.length} 道题的 AI 答案。`
				: `原卷缺少答案的题目共 ${totalTargets} 道，超过 ${MAX_AI_ANSWER_QUESTIONS} 道上限，已只为前 ${targets.length} 道生成 AI 参考答案。`);
		}
		const batches = [];
		for (let index = 0; index < targets.length; index += AI_ANSWER_BATCH_SIZE) {
			batches.push(targets.slice(index, index + AI_ANSWER_BATCH_SIZE));
		}
		if (batches.length > AI_ANSWER_MAX_BATCHES) batches.length = AI_ANSWER_MAX_BATCHES;

		const progressText = regenerate ? '正在重新生成 AI 答案与解析…' : '正在结合课程文档生成参考答案…';
		notify(progressText, 86);
		const runtime = requireAgent();
		// 课程文档目录就是 Agent 的工作目录；不再注入文档清单。
		const workingDir = await store.dir(`courses/${asString(course.id) || asString(courseId)}/docs`);
		const allowedRefs = [];
		const batchCount = batches.length;
		let generated = 0;
		for (const [batchIndex, batch] of batches.entries()) {
			if (signal?.aborted) throw abortError();
			notify(`${progressText}（第 ${batchIndex + 1}/${batchCount} 批）`, 86 + Math.round(((batchIndex + 1) / batchCount) * 7));
			try {
				const promptText = buildAnswerPrompt({
					courseName: asString(course.name) || '未命名课程',
					questions: batch
				});
				let normalized;
				try {
					const turn = await runtime.runTurn({
						promptText,
						allowTools: ['read', 'read_image', 'grep', 'glob', 'bash'],
						submitTool: ANSWER_RESULT_TOOL,
						requireSubmit: true,
						cwd: workingDir,
						signal,
						timeoutMs: AGENT_ANSWERS_TIMEOUT_MS
					});
					normalized = normalizeGeneratedAnswers(turn.result ?? turn.text, { questions: batch, allowedRefs });
				} catch (error) {
					if (signal?.aborted || isAbortError(error)) throw abortError();
					const partial = isPlainObject(error?.partial) ? error.partial : null;
					if (partial !== null && partial.result !== null) {
						normalized = normalizeGeneratedAnswers(partial.result, { questions: batch, allowedRefs });
					} else if (partial !== null && asString(partial.text) !== '') {
						normalized = normalizeGeneratedAnswers(partial.text, { questions: batch, allowedRefs });
					} else {
						throw error;
					}
				}
				normalized.warnings.forEach((warning) => warnings.push(warning));
				const questionByKey = new Map();
				for (const question of batch) {
					const key = asString(question.id) || asString(question.number);
					if (key !== '') questionByKey.set(key, question);
				}
				for (const [key, item] of normalized.answers) {
					const question = questionByKey.get(key);
					if (question === undefined) continue;
					const aiAnalysis = conciseGradeText(item.analysis, 3, 500);
					if (regenerate) {
						// 重新生成前保留原卷答案，供 UI 核对（没有原卷答案的题不写这两个字段）。
						if (question.hasAnswer === true) {
							if (!Array.isArray(question.sourceAnswer)) {
								question.sourceAnswer = Array.isArray(question.answer) ? [...question.answer] : [];
							}
							if (asString(question.sourceAnswerDisplay) === '') {
								question.sourceAnswerDisplay = asString(question.answerDisplay);
							}
						}
						question.answer = item.answer;
						question.answerDisplay = item.answerDisplay;
						if (aiAnalysis !== '') question.analysis = aiAnalysis;
					} else {
						if (question.hasAnswer === true) continue;
						question.answer = item.answer;
						question.answerDisplay = item.answerDisplay;
						// 原卷解析优先：只有原本没有解析时才采用 AI 解析。
						if (asString(question.analysis) === '' && aiAnalysis !== '') question.analysis = aiAnalysis;
					}
					if (Array.isArray(item.answerFigures)) question.answerFigures = item.answerFigures;
					question.answerRefs = item.refs;
					question.answerSource = item.refs.length > 0 ? 'ai-doc' : 'ai';
					generated += 1;
				}
			} catch (error) {
				if (isAbortError(error)) throw error;
				const message = error instanceof Error ? error.message : String(error);
				warnings.push(`第 ${batchIndex + 1}/${batchCount} 批 AI 答案生成失败：${message}`);
				log('warn', `AI 答案批次 ${batchIndex + 1} 失败`, error);
			}
		}
		if (generated > 0) {
			warnings.push(regenerate
				? `已重新生成 ${generated} 道题的 AI 答案与解析（原卷答案已保留在 sourceAnswer 中供核对）。`
				: `已为 ${generated} 道原卷缺少答案的题目生成 AI 参考答案（优先依据课程文档）。`);
		} else {
			warnings.push(regenerate
				? 'AI 答案重新生成失败，已保留原有答案，可在解析页重试。'
				: '原卷缺少答案的题目未能生成 AI 参考答案，可在解析页重试或核对。');
		}
		return { generated, targets: totalTargets };
	}

	/**
	 * 解析题目（第一阶段）：只把题目结构化并写入 set.json，随后立即把套题标记为 ready，
	 * 让用户可以开始答题。参考答案由 `enrichAnswers` 在后台任务里继续解析。
	 * @returns {Promise<{questionCount: number, warnings: string[]}>}
	 */
	async function parseSet({ courseId, setId, signal, progress } = {}) {
		requireAgent();
		await store.ready();
		const notify = makeNotifier(progress);
		const state = store.get();
		const course = requireCourse(state, courseId);
		const setSummary = requireSetSummary(course, setId);
		const sourceFiles = Array.isArray(setSummary.sourceFiles) ? setSummary.sourceFiles : [];
		if (sourceFiles.length === 0) throw new Error('这套题还没有上传题目文件。');
		const questionFiles = sourceFiles.filter((file) => asString(file?.role) !== 'answers');
		if (questionFiles.length === 0) throw new Error('这套题还没有上传题目文件（只有答案文件时无法出题）。');

		notify('正在准备题目文件…', 3);
		await store.update((draft) => {
			const set = requireSetSummary(requireCourse(draft, courseId), setId);
			set.status = 'parsing';
			set.error = null;
			set.updatedAt = Date.now();
		});

		const warnings = [];
		try {
			notify('正在读取题目文件…', 8);
			const titleFallback = asString(setSummary.title) && asString(setSummary.title) !== '未命名套题'
				? asString(setSummary.title)
				: basename(asString(questionFiles[0].name), extname(asString(questionFiles[0].name))) || '未命名套题';
			const parts = await runParseBatches({
				courseId,
				setId,
				courseName: asString(course.name) || '未命名课程',
				files: questionFiles,
				titleFallback,
				signal,
				notify,
				warnings
			});

			notify('正在整理题目结构…', 86);
			const merged = mergeParsedSets(parts, { courseId, setId, titleFallback });
			merged.warnings.forEach((warning) => warnings.push(warning));
			const set = merged.set;
			set.pages = [];

			for (const group of set.groups) {
				group.figures = await persistFigures({
					courseId,
					setId,
					ownerId: group.id,
					figures: group.figures ?? [],
					warnings
				});
			}
			for (const question of set.questions) {
				question.figures = await persistFigures({
					courseId,
					setId,
					ownerId: question.id,
					figures: question.figures ?? [],
					warnings
				});
				question.answerFigures = await persistFigures({
					courseId,
					setId,
					ownerId: `${question.id}_ans`,
					figures: question.answerFigures ?? [],
					warnings
				});
			}
			const missingFigures = [...set.groups, ...set.questions].filter((head) => head.hasVisual === true && (head.figures ?? []).length === 0).length;
			if (missingFigures > 0) {
				warnings.push(`有 ${missingFigures} 处标注了图形（hasVisual=true）但没有有效的图片 path 或 SVG，已只显示文字内容。`);
			}
			set.warnings = uniqueStrings(warnings).slice(0, 80);
			await writeSetJson(store, courseId, setId, set);

			const finalWarnings = set.warnings;
			await store.update((draft) => {
				const draftCourse = requireCourse(draft, courseId);
				const draftSet = requireSetSummary(draftCourse, setId);
				draftSet.status = 'ready';
				draftSet.title = set.title;
				draftSet.questionCount = set.questions.length;
				draftSet.answeredCount = countAnswered(draftCourse.records, set.questions, setId);
				draftSet.warnings = finalWarnings;
				draftSet.error = null;
				draftSet.updatedAt = Date.now();
			});
			notify('题目已解析，可以开始答题；参考答案将在后台继续解析…', 100);
			return { questionCount: set.questions.length, warnings: finalWarnings };
		} catch (error) {
			const message = isAbortError(error) ? '解析已取消。' : (error instanceof Error ? error.message : String(error));
			try {
				await store.update((draft) => {
					const draftCourse = requireCourse(draft, courseId);
					const draftSet = requireSetSummary(draftCourse, setId);
					draftSet.status = 'failed';
					draftSet.error = message;
					draftSet.warnings = uniqueStrings([...warnings, message]).slice(0, 80);
					draftSet.updatedAt = Date.now();
				});
			} catch (updateError) {
				log('error', '更新题目集失败状态时出错', updateError);
			}
			throw error;
		}
	}

	/**
	 * 解析参考答案（第二阶段，后台任务）：答案文件匹配 + AI 参考答案 + 答案图落盘。
	 * 套题始终保持 ready，不阻塞用户答题。
	 * @returns {Promise<{matched: number, generated: number, warnings: string[]}>}
	 */
	async function enrichAnswers({ courseId, setId, signal, progress } = {}) {
		requireAgent();
		await store.ready();
		const notify = makeNotifier(progress);
		const state = store.get();
		const course = requireCourse(state, courseId);
		const setSummary = requireSetSummary(course, setId);
		const sourceFiles = Array.isArray(setSummary.sourceFiles) ? setSummary.sourceFiles : [];
		const answerFiles = sourceFiles.filter((file) => asString(file?.role) === 'answers');
		const aiAnswerMode = normalizeAiAnswerMode(setSummary.aiAnswerMode);
		const set = await readSetJson(store, courseId, setId);
		const warnings = Array.isArray(set.warnings) ? [...set.warnings] : [];

		notify('正在解析参考答案…', 5);
		let matched = 0;
		if (answerFiles.length > 0) {
			matched = await applyAnswerKeyFiles({ courseId, course, set, answerFiles, signal, notify, warnings });
			const stillMissing = set.questions.filter((question) => question.hasAnswer !== true).length;
			warnings.push(matched > 0
				? `已从答案文件匹配到 ${matched} 道题的答案${stillMissing > 0 ? `，仍有 ${stillMissing} 道题未匹配到答案。` : '。'}`
				: '答案文件没有匹配到任何题目，已忽略。');
		}

		const missingAfterKey = set.questions.filter((question) => question.hasAnswer !== true).length;
		let generated = 0;
		if (aiAnswerMode === 'off') {
			if (missingAfterKey > 0) {
				warnings.push(`已按设置关闭 AI 答案解析（aiAnswerMode=off），${missingAfterKey} 道题暂无参考答案。`);
			}
		} else if (aiAnswerMode === 'regenerate' || missingAfterKey > 0) {
			const result = await generateAiAnswers({ courseId, course, set, mode: aiAnswerMode, signal, notify, warnings });
			generated = Number(result?.generated) || 0;
		}

		// 答案文件/AI 参考答案可能带回图片，统一落盘。
		for (const question of set.questions) {
			question.answerFigures = await persistFigures({
				courseId,
				setId,
				ownerId: `${question.id}_ans`,
				figures: question.answerFigures ?? [],
				warnings
			});
		}
		set.warnings = uniqueStrings(warnings).slice(0, 80);
		await writeSetJson(store, courseId, setId, set);
		await store.update((draft) => {
			const draftCourse = requireCourse(draft, courseId);
			const draftSet = requireSetSummary(draftCourse, setId);
			draftSet.warnings = set.warnings;
			draftSet.updatedAt = Date.now();
		});
		notify('参考答案解析完成', 100);
		return { matched, generated, warnings: set.warnings };
	}
	// ------------------------------------------------------------------
	// diagnose
	// ------------------------------------------------------------------


	/** 加载一组套题的 set.json（失败跳过）。 */
	async function loadSetsForStats(courseList, { onlySetId } = {}) {
		const loaded = [];
		for (const course of courseList) {
			for (const summary of course?.sets ?? []) {
				if (onlySetId !== undefined && asString(summary.id) !== asString(onlySetId)) continue;
				try {
					const set = await readSetJson(store, course.id, summary.id);
					loaded.push({ course, summary, set });
				} catch (error) {
					log('warn', `统计时读取题目集失败：${course?.name} / ${asString(summary?.title)}`, error);
				}
			}
		}
		return loaded;
	}

	/** 计算统计与易错题。 */
	function computeStats({ scope, courseList, loadedSets, setScopeSummary }) {
		const questionIndex = new Map();
		let questionTotal = 0;
		for (const item of loadedSets) {
			const key = `${item.course.id}|${item.set.id}`;
			for (const question of item.set.questions ?? []) {
				questionIndex.set(`${key}|${asString(question.id)}`, { question, course: item.course, summary: item.summary });
				questionTotal += 1;
			}
		}

		// 每个题目只取最后一条记录（作答/正确率按「每题最后一次」统计）。
		const latest = new Map();
		// 错题次数按全部记录累计，用来排序「易错题 top 8」。
		const wrongAttempts = new Map();
		for (const course of courseList) {
			for (const record of course?.records ?? []) {
				if (scope === 'set' && asString(record?.setId) !== asString(setScopeSummary?.id)) continue;
				const key = `${course.id}|${asString(record.setId)}|${asString(record.questionId)}`;
				const previous = latest.get(key);
				if (previous === undefined || (Number(record.at) || 0) >= (Number(previous.at) || 0)) latest.set(key, record);
				if (record.correct === false) {
					const bucket = wrongAttempts.get(key);
					if (bucket === undefined) wrongAttempts.set(key, { count: 1, latestAt: Number(record.at) || 0 });
					else {
						bucket.count += 1;
						bucket.latestAt = Math.max(bucket.latestAt, Number(record.at) || 0);
					}
				}
			}
		}

		let answeredCount = 0;
		let correctCount = 0;
		let wrongCount = 0;
		const typeStats = new Map();
		for (const [key, entry] of questionIndex) {
			const record = latest.get(key);
			const type = asString(entry.question?.type) || 'other';
			if (!typeStats.has(type)) typeStats.set(type, { type, total: 0, answered: 0, correct: 0 });
			const bucket = typeStats.get(type);
			bucket.total += 1;
			if (record === undefined) continue;
			answeredCount += 1;
			bucket.answered += 1;
			if (record.correct === true) {
				bucket.correct += 1;
				correctCount += 1;
			} else if (record.correct === false) {
				wrongCount += 1;
			}
		}
		// 已有记录但题目正文缺失（例如题目集被删/重解析）时也计入已答，避免数据丢失。
		if (answeredCount === 0 && latest.size > 0) answeredCount = latest.size;

		const typeList = [...typeStats.values()]
			.map((bucket) => ({
				type: bucket.type,
				label: TYPE_LABELS[bucket.type] ?? '其他',
				total: bucket.total,
				answered: bucket.answered,
				correct: bucket.correct,
				accuracy: bucket.answered > 0 ? bucket.correct / bucket.answered : null
			}))
			.sort((left, right) => right.total - left.total);

		// 最近 7 天趋势（按每天「每题最后一次」记录统计）。
		const days = [];
		const today = new Date();
		for (let offset = 6; offset >= 0; offset -= 1) {
			const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
			days.push({ key: dayKey(date.getTime()), date: dayKey(date.getTime()), answered: 0, correct: 0 });
		}
		const dayMap = new Map(days.map((day) => [day.key, day]));
		for (const record of latest.values()) {
			const timestamp = Number(record.at) || 0;
			const day = dayMap.get(dayKey(timestamp));
			if (day === undefined) continue;
			day.answered += 1;
			if (record.correct === true) day.correct += 1;
		}
		const recent = days.map((day) => ({
			date: day.date,
			answered: day.answered,
			correct: day.correct,
			accuracy: day.answered > 0 ? day.correct / day.answered : null
		}));

		const wrongSorted = [...wrongAttempts.entries()]
			.map(([key, bucket]) => ({ key, latestAt: bucket.latestAt, count: bucket.count, entry: questionIndex.get(key) }))
			.filter((item) => item.entry !== undefined)
			.sort((left, right) => right.count - left.count || right.latestAt - left.latestAt)
			.slice(0, 8);
		const wrongQuestions = wrongSorted.map(({ key, entry }) => {
			const question = entry.question;
			const record = latest.get(key);
			return {
				setTitle: asString(entry.summary?.title) || '未命名套题',
				number: asString(question.number),
				type: asString(question.type),
				stem: asString(question.stem),
				userAnswer: Array.isArray(record?.answer) ? record.answer.join('、') : asString(record?.answer),
				answerDisplay: asString(question.answerDisplay) || (Array.isArray(question.answer) ? question.answer.join('、') : ''),
				analysis: asString(question.analysis),
				groupId: question.groupId ?? null,
				courseId: entry.course.id,
				setId: entry.summary.id
			};
		});

		const accuracy = correctCount + wrongCount > 0 ? correctCount / (correctCount + wrongCount) : null;
		const scopeLabel = scope === 'global'
			? '全部课程'
			: scope === 'set'
				? `${asString(courseList[0]?.name) || '课程'} · ${asString(setScopeSummary?.title) || '未命名套题'}`
				: (asString(courseList[0]?.name) || '课程');
		return {
			stats: {
				scopeLabel,
				setCount: loadedSets.length,
				questionTotal,
				answeredCount,
				correctCount,
				wrongCount,
				accuracy,
				practiceDays: days.filter((day) => day.answered > 0).length,
				typeStats: typeList,
				recent
			},
			wrongQuestions,
			loadedSets,
			questionIndex
		};
	}

	/**
	 * 生成学情分析。
	 * @returns {Promise<{markdown: string}>}
	 */
	async function diagnose({ courseId, scope = 'course', setId, signal, progress } = {}) {
		const runtime = requireAgent();
		await store.ready();
		const notify = makeNotifier(progress);
		const state = store.get();
		notify('正在汇总刷题数据…', 8);
		const scopeValue = scope === 'global' ? 'global' : scope === 'set' ? 'set' : 'course';
		let courseList;
		let setScopeSummary = null;
		if (scopeValue === 'global') {
			courseList = state.courses ?? [];
		} else {
			const course = requireCourse(state, courseId);
			courseList = [course];
			if (scopeValue === 'set') setScopeSummary = requireSetSummary(course, setId);
		}
		if (courseList.length === 0) throw new Error('还没有任何课程，无法生成学情分析。');

		const loadedSets = await loadSetsForStats(courseList, { onlySetId: scopeValue === 'set' ? setId : undefined });
		if (signal?.aborted) throw abortError();
		const { stats, wrongQuestions } = computeStats({ scope: scopeValue, courseList, loadedSets, setScopeSummary });
		if (stats.questionTotal > MAX_QUESTIONS_FOR_STATS) stats.questionTotal = MAX_QUESTIONS_FOR_STATS;

		// 错题涉及的共用材料摘录。
		const materials = [];
		const materialSeen = new Set();
		for (const wrong of wrongQuestions) {
			if (wrong.groupId === null) continue;
			const loaded = loadedSets.find((item) => asString(item.set.id) === wrong.setId && asString(item.course.id) === wrong.courseId);
			const group = loaded?.set?.groups?.find((item) => asString(item.id) === asString(wrong.groupId));
			const text = asString(group?.material);
			if (text === '' || materialSeen.has(text)) continue;
			materialSeen.add(text);
			materials.push({ title: `${wrong.setTitle} · 共用材料`, material: text.slice(0, 1500) });
		}

		notify('正在生成学情分析…', 55);
		const courseName = scopeValue === 'global'
			? `全部课程（${courseList.length} 门）`
			: scopeValue === 'set'
				? `${asString(courseList[0].name)} · ${asString(setScopeSummary?.title) || '未命名套题'}`
				: asString(courseList[0].name);
		const promptText = buildDiagnosePrompt({
			scope: scopeValue,
			courseName,
			stats,
			wrongQuestions,
			materials
		});
		const workingDir = scopeValue === 'global'
			? dataRootPath()
			: await store.dir(`courses/${asString(courseList[0].id) || asString(courseId)}/docs`);
		const turn = await runtime.runTurn({
			promptText,
			allowTools: ['read', 'grep', 'glob', 'bash'],
			cwd: workingDir,
			signal,
			timeoutMs: AGENT_DIAGNOSE_TIMEOUT_MS
		});
		const markdown = asString(turn.text);
		if (markdown === '') throw new Error('Agent 没有返回分析内容，请重试。');

		notify('正在保存分析结果…', 92);
		const entry = { markdown, generatedAt: Date.now(), stale: false };
		await store.update((draft) => {
			if (scopeValue === 'global') {
				if (!isPlainObject(draft.global)) draft.global = {};
				draft.global.analysis = entry;
				return;
			}
			const draftCourse = requireCourse(draft, courseId);
			if (!isPlainObject(draftCourse.analyses)) draftCourse.analyses = {};
			draftCourse.analyses[scopeValue === 'set' ? `set:${setId}` : 'course'] = entry;
			draftCourse.updatedAt = Date.now();
		});
		notify('分析完成', 100);
		return { markdown };
	}

	// ------------------------------------------------------------------
	// redrawFigure
	// ------------------------------------------------------------------

	/**
	 * 重绘某道题的某个图形。
	 * @returns {Promise<{relPath: string}>}
	 */
	async function redrawFigure({ courseId, setId, questionId, figureIndex, instruction, signal, progress } = {}) {
		const runtime = requireAgent();
		await store.ready();
		const notify = makeNotifier(progress);
		const state = store.get();
		requireCourse(state, courseId);
		notify('正在读取题目图形…', 6);
		const set = await readSetJson(store, courseId, setId);
		const question = (set.questions ?? []).find((item) => asString(item.id) === asString(questionId));
		if (!question) throw new Error('找不到要重绘的题目，请刷新后重试。');
		const index = Number(figureIndex);
		const figures = Array.isArray(question.figures) ? question.figures : [];
		if (!Number.isInteger(index) || index < 0 || index >= figures.length) {
			throw new Error('找不到要重绘的图形，请刷新后重试。');
		}
		const figure = figures[index];
		let explanation = asString(instruction);
		if (asString(figure.relPath) !== '' && asString(figure.kind) === 'svg') {
			try {
				const svgText = await store.readText(figure.relPath);
				explanation = `原 SVG 代码：\n${svgText}\n\n${explanation}`;
			} catch (error) {
				log('warn', '读取原图形 SVG 失败，仅按题目重绘', error);
			}
		} else if (asString(figure.relPath) !== '') {
			explanation = `原图路径（可用 read_image 查看）：${store.abs(figure.relPath)}\n${explanation}`;
		}
		notify('正在重绘图形…', 30);
		const promptText = buildSvgPrompt({ question, figureIndex: index, explanation });
		const turn = await runtime.runTurn({
			promptText,
			allowTools: ['read', 'read_image'],
			cwd: dataRootPath(),
			signal,
			timeoutMs: AGENT_REDRAW_TIMEOUT_MS
		});
		const svg = sanitizeSvg(turn.text);
		if (svg === '') throw new Error('Agent 没有返回有效的 SVG 图形，请重试。');
		notify('正在保存图形…', 86);
		const relPath = `${assetsDirRelPath(courseId)}/f_${setId}_${asString(question.id)}_${index + 1}.svg`;
		await store.writeFile(relPath, svg);
		const nextFigures = figures.map((item, itemIndex) => {
			if (itemIndex !== index) return item;
			return { kind: 'svg', relPath, alt: asString(item.alt) || `图${index + 1}` };
		});
		question.figures = nextFigures;
		await writeSetJson(store, courseId, setId, set);
		notify('图形重绘完成', 100);
		return { relPath };
	}

	// ------------------------------------------------------------------
	// grade（AI 判题）
	// ------------------------------------------------------------------

	/**
	 * AI 判题：结合参考答案与课程文档批改一道题的学生作答，返回判定/分数/建议。
	 *
	 * @param {{courseId: string, setId: string, questionId: string, userAnswer?: string|string[], signal?: AbortSignal, progress?: Function}} options
	 * @returns {Promise<{verdict: 'correct'|'partial'|'incorrect', score: number, standardAnswer: string, mistakeAnalysis: string, explanation: string, suggestions: string[], refs: string[], summary: string, correctedAnswer: string}>}
	 *   新字段用于「标准答案 → 错在哪 → 解析/建议」的卡片；summary/correctedAnswer 保留给旧客户端兼容。
	 */
	/** 判题文案保持简短：最多 N 句 / M 字（避免卡片里长篇大论）。 */
	function conciseGradeText(value, sentences = 3, maxChars = 600) {
		const text = asString(value);
		if (text === '') return '';
		const parts = text.split(/(?<=[。！？!?])/).map((part) => part.trim()).filter(Boolean);
		const joined = parts.slice(0, Math.max(1, sentences)).join('');
		return (joined || text).slice(0, maxChars);
	}

	async function grade({ courseId, setId, questionId, userAnswer, signal, progress } = {}) {
		const runtime = requireAgent();
		await store.ready();
		const notify = makeNotifier(progress);
		const state = store.get();
		const course = requireCourse(state, courseId);
		notify('正在准备批改…', 8);
		const set = await readSetJson(store, courseId, setId);
		const question = (set.questions ?? []).find((item) => asString(item.id) === asString(questionId));
		if (question === undefined) throw new Error('找不到要批改的题目，请刷新后重试。');
		const answerText = Array.isArray(userAnswer)
			? userAnswer.map((item) => asString(item)).filter((item) => item !== '').join('；')
			: asString(userAnswer);
		const group = question.groupId === null || question.groupId === undefined
			? null
			: (set.groups ?? []).find((item) => asString(item.id) === asString(question.groupId));
		const materials = group !== null && group !== undefined && asString(group.material) !== ''
			? [{ title: '共用材料', material: group.material }]
			: [];
		// 标准答案已经准备好：不读文档、不重新解题，只做比对，判卷才快。
		const allowedRefs = [];
		notify('正在批改答案…', 50);
		const promptText = buildGradePrompt({
			courseName: asString(course.name),
			question,
			materials,
			userAnswer: answerText
		});
		let normalized;
		try {
			const turn = await runtime.runTurn({
				promptText,
				// 只允许提交工具；guard 会拒绝 read/bash 等，避免判卷时到处查资料。
				allowTools: ['submit_grade'],
				submitTool: GRADE_RESULT_TOOL,
				requireSubmit: true,
				cwd: dataRootPath(),
				signal,
				timeoutMs: AGENT_GRADE_TIMEOUT_MS
			});
			normalized = normalizeGradeResult(turn.result ?? turn.text, { question, allowedRefs });
		} catch (error) {
			if (signal?.aborted || isAbortError(error)) throw abortError();
			const partial = isPlainObject(error?.partial) ? error.partial : null;
			if (partial !== null && partial.result !== null) {
				normalized = normalizeGradeResult(partial.result, { question, allowedRefs });
			} else if (partial !== null && asString(partial.text) !== '') {
				normalized = normalizeGradeResult(partial.text, { question, allowedRefs });
			} else {
				throw error;
			}
		}
		// 标准答案以 Host 已准备的为准（AI 只负责判断与指出错误），保证格式与准确性。
		const answerKeys = Array.isArray(question.answer) ? question.answer.map(asString).filter(Boolean) : [];
		const optionMap = new Map((Array.isArray(question.options) ? question.options : [])
			.map((option) => [asString(option?.key), asString(option?.text)]));
		const choiceText = answerKeys
			.filter((key) => optionMap.has(key))
			.map((key) => `${key}. ${optionMap.get(key)}`)
			.join('；');
		const preparedAnswer = choiceText
			|| asString(question.answerDisplay)
			|| answerKeys.join('、');
		if (preparedAnswer !== '') {
			normalized.result.standardAnswer = preparedAnswer;
			normalized.result.correctedAnswer = preparedAnswer;
		}
		normalized.result.explanation = conciseGradeText(normalized.result.explanation, 3, 600);
		normalized.result.mistakeAnalysis = conciseGradeText(normalized.result.mistakeAnalysis, 4, 800);
		normalized.result.summary = conciseGradeText(normalized.result.mistakeAnalysis || normalized.result.explanation, 4, 800);
		normalized.result.refs = [];
		notify('批改完成', 100);
		return normalized.result;
	}

	// ------------------------------------------------------------------
	// chat
	// ------------------------------------------------------------------

	/** 在课程内定位当前题目（优先 setId 提示）。 */
	async function resolveChatQuestion(course, { setId, questionId } = {}) {
		const wantedQuestionId = asString(questionId);
		if (wantedQuestionId === '') return { question: null, materials: [], setId: null };
		const candidateSets = [];
		const hintSetId = asString(setId);
		if (hintSetId !== '') {
			const hint = (course.sets ?? []).find((item) => asString(item.id) === hintSetId);
			if (hint) candidateSets.push(hint);
		}
		for (const summary of course.sets ?? []) {
			if (!candidateSets.includes(summary)) candidateSets.push(summary);
		}
		for (const summary of candidateSets) {
			try {
				const set = await readSetJson(store, course.id, summary.id);
				const question = (set.questions ?? []).find((item) => asString(item.id) === wantedQuestionId);
				if (!question) continue;
				const group = question.groupId === null
					? null
					: (set.groups ?? []).find((item) => asString(item.id) === asString(question.groupId));
				const materials = group !== null && group !== undefined && asString(group.material) !== ''
					? [{ title: '共用材料', material: group.material }]
					: [];
				return { question, materials, setId: summary.id, setTitle: asString(summary.title) };
			} catch {
				/* 跳过读不出来的题目集 */
			}
		}
		return { question: null, materials: [], setId: hintSetId || null };
	}

	/**
	 * 对话（流式）。用户消息在开始时就落盘。
	 * @returns {Promise<{threadId: string, reply: {role: 'assistant', text: string, at: number, refs: string[]}}>}
	 */
	async function chat({ courseId, threadId: requestedThreadId, message, signal, onDelta, onMeta } = {}) {
		const runtime = requireAgent();
		await store.ready();
		const state = store.get();
		const course = requireCourse(state, courseId);
		const input = isPlainObject(message) ? message : {};
		const userText = asString(input.text) || asString(input.selectedText) || '请讲解当前题目。';

		// 读取或新建线程。
		let threadId = asString(requestedThreadId);
		let thread = threadId === '' ? null : await readThread({ store, courseId, threadId });
		if (thread === null) {
			threadId = threadId === '' ? store.newId('t') : threadId;
			thread = {
				id: threadId,
				courseId,
				title: '新对话',
				createdAt: Date.now(),
				updatedAt: Date.now(),
				messages: []
			};
		}
		const context = {
			questionId: asString(input.questionId) || null,
			selectedText: asString(input.selectedText),
			docNames: Array.isArray(input.docNames) ? input.docNames.map(asString).filter((name) => name !== '') : [],
			setId: asString(input.setId) || null
		};
		const includeHistory = !chatSessions.has(asString(courseId));
		thread.messages.push({ role: 'user', text: userText, at: Date.now(), context });
		if (!asString(thread.title) || asString(thread.title) === '新对话') thread.title = userText.slice(0, 18);
		thread.updatedAt = Date.now();
		await writeThread(store, courseId, thread);
		await upsertThreadSummary(store, courseId, thread);
		try {
			onMeta?.(threadId);
		} catch {
			/* 忽略回调异常 */
		}

		try {
			// 答疑上下文只有当前题目与我的回答；课程文档目录是 Agent 的工作目录，不注入文档内容。
			const resolved = await resolveChatQuestion(course, { setId: context.setId ?? undefined, questionId: context.questionId ?? undefined });
			const workingDir = await store.dir(`courses/${asString(course.id) || asString(courseId)}/docs`);
			const questionId = asString(resolved.question?.id);
			let latestAnswer = null;
			for (const record of course.records ?? []) {
				if (asString(record?.questionId) !== questionId) continue;
				if (latestAnswer === null || (Number(record.at) || 0) >= (Number(latestAnswer.at) || 0)) latestAnswer = record;
			}
			const userAnswer = latestAnswer === null
				? ''
				: (Array.isArray(latestAnswer.answer) ? latestAnswer.answer.map(asString).filter(Boolean).join('；') : asString(latestAnswer.answer));
			const promptText = buildChatAgentPrompt({
				courseName: asString(course.name),
				question: resolved.question,
				userAnswer,
				selectedText: context.selectedText,
				userText,
				history: includeHistory ? thread.messages.slice(0, -1) : []
			});
			const turn = await runtime.runTurn({
				sessionKey: `chat:${courseId}`,
				keepSession: true,
				cwd: workingDir,
				promptText,
				allowTools: ['read', 'read_image', 'grep', 'glob', 'bash'],
				signal,
				timeoutMs: AGENT_CHAT_TIMEOUT_MS,
				onDelta: (text) => {
					if (asString(text) === '') return;
					try {
						onDelta?.(text);
					} catch {
						/* 忽略回调异常 */
					}
				}
			});
			const replyText = asString(turn?.text);
			if (replyText === '') throw new Error('Agent 没有返回回答，请重试。');
			const reply = {
				role: 'assistant',
				text: replyText,
				at: Date.now(),
				refs: []
			};
			thread.messages.push(reply);
			thread.updatedAt = Date.now();
			await writeThread(store, courseId, thread);
			await upsertThreadSummary(store, courseId, thread);
			chatSessions.add(asString(courseId));
			return { threadId, reply };
		} catch (error) {
			// 用户消息已落盘；把出错状态同步到线程摘要，便于前端展示。
			log('warn', '对话生成失败', error);
			throw isAbortError(error) ? abortError() : (error instanceof Error ? error : new Error(String(error)));
		}
	}

	/** 清空对话时同时重置对应课程的 Agent 会话记忆（下一轮重新创建）。 */
	async function resetChat({ courseId } = {}) {
		chatSessions.delete(asString(courseId));
		const rt = agentRuntime();
		if (rt === null || typeof rt.resetSession !== 'function') return;
		await rt.resetSession(`chat:${asString(courseId)}`);
	}

	return {
		parseSet,
		enrichAnswers,
		diagnose,
		redrawFigure,
		grade,
		chat,
		resetChat,
		readThread: ({ courseId, threadId }) => readThread({ store, courseId, threadId })
	};
}
