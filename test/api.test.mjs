/**
 * api.js 集成测试：用假 ctx（收集 connection.fetch.register 路由）+ 假 tasks/llm/render/extract，
 * 直接调用 route.fetch(Request) 覆盖 bootstrap、课程、上传、解析 job、answers upsert、
 * job 查询、asset 越界、chat SSE、chat/clear、thread、diagnose、svg、doc/set 删除等路由。
 *
 * 运行：node --test test/api.test.mjs
 */

import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { createApiRoutes } from '../lib/host/api.js';
import { createJobs } from '../lib/host/jobs.js';
import { createStore } from '../lib/host/store.js';

const FAKE_DOC_EXTS = ['.txt', '.md', '.markdown', '.csv', '.json', '.html', '.htm', '.docx', '.pptx', '.pdf'];

/** 假文档抽取器：md/txt 返回固定文本，docx 返回空文本，pdf 抛错，用来覆盖 ready/empty/failed 三种状态。 */
function createFakeExtractor() {
	const calls = [];
	return {
		calls,
		DOC_EXTS: FAKE_DOC_EXTS,
		async extractDocument({ absPath, ext, maxChars }) {
			calls.push({ absPath, ext, maxChars });
			if (ext === '.pdf') throw new Error('PDF 文本层解析失败');
			if (ext === '.docx') return { text: '', warnings: ['不支持的文档结构'], images: [] };
			return { text: `抽取文本：${absPath.split('/').pop()}`, warnings: [], images: [] };
		}
	};
}

/** 假 tasks：行为与契约 5.6 对齐（读写 store/set.json、写 analyses、写 thread）。 */
function createFakeTasks({ store, calls }) {
	return {
		async parseSet({ courseId, setId, signal, progress }) {
			calls.parseSet.push({ courseId, setId, hasSignal: Boolean(signal) });
			progress?.('正在渲染题目页面…', 20);
			await new Promise((resolvePromise) => setTimeout(resolvePromise, 5));
			progress?.('正在识别题目…');
			const setData = {
				id: setId,
				courseId,
				title: '期中卷',
				createdAt: Date.now(),
				updatedAt: Date.now(),
				pages: [],
				groups: [],
				questions: [
					{
						id: 'q1',
						number: '1',
						type: 'single',
						groupId: null,
						stem: '1 + 1 等于几？',
						options: [
							{ key: 'A', text: '2' },
							{ key: 'B', text: '3' }
						],
						answer: ['A'],
						answerDisplay: 'A',
						analysis: '基础加法',
						figures: [],
						tags: ['加法'],
						difficulty: 'easy'
					},
					{
						id: 'q2',
						number: '2',
						type: 'judge',
						groupId: null,
						stem: '地球是球体。',
						options: [],
						answer: ['正确'],
						answerDisplay: '正确',
						analysis: '',
						figures: [],
						tags: [],
						difficulty: 'easy'
					}
				],
				warnings: []
			};
			await store.writeFile(`courses/${courseId}/sets/${setId}/set.json`, JSON.stringify(setData, null, 2));
			await store.update((state) => {
				const course = state.courses.find((item) => item.id === courseId);
				const set = course.sets.find((item) => item.id === setId);
				set.status = 'ready';
				set.title = '期中卷';
				set.questionCount = 2;
				set.warnings = [];
				set.updatedAt = Date.now();
			});
			return { questionCount: 2, warnings: [] };
		},

		async diagnose({ courseId, scope, setId, signal, progress }) {
			calls.diagnose.push({ courseId, scope, setId, hasSignal: Boolean(signal) });
			progress?.('正在分析答题记录…', 30);
			const markdown = `# 学情分析\n\n范围：${scope}`;
			await store.update((state) => {
				if (scope === 'global') {
					state.global.analysis = { markdown, generatedAt: Date.now() };
					return;
				}
				const course = state.courses.find((item) => item.id === courseId);
				course.analyses = course.analyses ?? {};
				const key = scope === 'set' ? `set:${setId}` : 'course';
				course.analyses[key] = { markdown, generatedAt: Date.now(), stale: false };
			});
			return { markdown };
		},

		async redrawFigure({ courseId, setId, questionId, figureIndex, instruction, signal, progress }) {
			calls.redrawFigure.push({ courseId, setId, questionId, figureIndex, instruction, hasSignal: Boolean(signal) });
			progress?.('正在重绘图片…', 40);
			const relPath = `courses/${courseId}/assets/f_${setId}_${questionId}_${figureIndex}.svg`;
			await store.writeFile(relPath, '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>');
			const setJsonRel = `courses/${courseId}/sets/${setId}/set.json`;
			const setData = JSON.parse(await store.readText(setJsonRel));
			setData.questions.find((question) => question.id === questionId).figures[figureIndex] = {
				kind: 'svg',
				relPath,
				alt: '图1'
			};
			await store.writeFile(setJsonRel, JSON.stringify(setData, null, 2));
			return { relPath };
		},

		async grade({ courseId, setId, questionId, userAnswer, signal, progress }) {
			calls.grade.push({ courseId, setId, questionId, userAnswer, hasSignal: Boolean(signal) });
			progress?.('正在判题…', 40);
			return {
				verdict: 'partial',
				score: 60,
				summary: '思路基本正确',
				suggestions: ['注意符号'],
				correctedAnswer: '2x + 1',
				standardAnswer: 'x = 1',
				mistakeAnalysis: '忽略了负号',
				explanation: '先移项，再合并同类项',
				refs: ['第一章.md'],
				generatedAt: 1700000000000
			};
		},

		async chat({ courseId, threadId, message, signal, onDelta, onMeta }) {
			calls.chat.push({ courseId, threadId, message, hasSignal: Boolean(signal) });
			const newThreadId = threadId ?? 't_fake0001';
			onMeta(newThreadId);
			onDelta('这是');
			onDelta('回答');
			const now = Date.now();
			const reply = { role: 'assistant', text: '这是回答', at: now, refs: ['第一章.pdf'] };
			const thread = {
				id: newThreadId,
				courseId,
				title: message.text.slice(0, 18),
				createdAt: now,
				updatedAt: now,
				messages: [
					{ role: 'user', text: message.text, at: now, context: { questionId: message.questionId, selectedText: message.selectedText, docNames: message.docNames } },
					reply
				]
			};
			await store.writeFile(`courses/${courseId}/chat/${newThreadId}.json`, JSON.stringify(thread, null, 2));
			await store.update((state) => {
				const course = state.courses.find((item) => item.id === courseId);
				const summary = {
					id: newThreadId,
					title: thread.title,
					createdAt: now,
					updatedAt: now,
					messageCount: 2,
					questionId: message.questionId ?? null
				};
				const existing = course.chatThreads.find((item) => item.id === newThreadId);
				if (existing === undefined) course.chatThreads.push(summary);
				else Object.assign(existing, summary);
			});
			return { threadId: newThreadId, reply };
		}
	};
}

/**
 * 建课 + 上传一道题目文件 + 跑解析 job，返回 { courseId, setId }（set.json 含 q1/q2）。
 */
async function prepareParsedSet(routes, name = '高等数学') {
	const courseId = await createCourse(routes, name);
	const { setId } = await uploadQuestions(routes, courseId, [{ name: '期中卷.md' }]);
	const parseJob = await jsonRequest(routes, 'POST', '/api/practice/parse', { body: { courseId, setId } });
	await waitForJob(routes, parseJob.body.jobId);
	return { courseId, setId };
}

/**
 * 建一套完整的测试环境：临时数据根 + 真 store + 真 jobs + 假 tasks/llm/render/extract + 假 ctx。
 */
async function makeHarness(t) {
	const root = await mkdtemp(join(tmpdir(), 'practice-api-'));
	const store = await createStore({ rootDir: root });
	const jobs = createJobs({ ttlMs: 60_000 });
	const calls = { parseSet: [], diagnose: [], redrawFigure: [], chat: [], grade: [] };
	const extract = createFakeExtractor();
	const tasks = createFakeTasks({ store, calls });
	const llm = {
		supportsImages: async () => true,
		selection: () => ({ provider: 'deepseek-official', model: 'deepseek-flash' })
	};
	const render = { available: async () => false };
	const logger = { warn: () => {}, info: () => {} };
	const api = createApiRoutes({ store, jobs, tasks, llm, render, logger, extract });
	const routes = new Map();
	const fakeCtx = {
		connection: {
			fetch: {
				register(entry) {
					const key = `${entry.methods.join(',')} ${entry.path}`;
					routes.set(key, entry);
					return () => routes.delete(key);
				}
			}
		},
		effect(factory) {
			return factory();
		},
		logger
	};
	api.register(fakeCtx);
	t.after(async () => {
		api.dispose();
		jobs.dispose();
		await rm(root, { recursive: true, force: true });
	});
	return { root, store, jobs, tasks, llm, render, extract, api, routes, calls };
}

/** 找一条已注册路由（顺带断言注册存在）。 */
function routeOf(routes, method, path) {
	const entry = routes.get(`${method} ${path}`);
	assert.ok(entry !== undefined, `路由未注册：${method} ${path}`);
	return entry;
}

/** 发一次请求。body 走 JSON；rawBody 走原文；query 拼到 URL。 */
async function request(routes, method, path, { query, body, rawBody } = {}) {
	const url = new URL(`http://127.0.0.1:1${path}`);
	if (query !== undefined) {
		for (const [key, value] of Object.entries(query)) {
			if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
		}
	}
	const init = { method };
	if (rawBody !== undefined) init.body = rawBody;
	else if (body !== undefined) {
		init.body = JSON.stringify(body);
		init.headers = { 'content-type': 'application/json' };
	}
	return routeOf(routes, method, path).fetch(new Request(url, init));
}

/** 发请求并返回 JSON。 */
async function jsonRequest(routes, method, path, options) {
	const response = await request(routes, method, path, options);
	const body = await response.json();
	return { response, body };
}

/** 轮询 job 直到终态。 */
async function waitForJob(routes, jobId, timeoutMs = 3000) {
	const deadline = Date.now() + timeoutMs;
	for (;;) {
		const { response, body } = await jsonRequest(routes, 'GET', '/api/practice/job', { query: { jobId } });
		assert.equal(response.status, 200, `GET job 失败：${JSON.stringify(body)}`);
		if (body.data.status !== 'running') return body.data;
		if (Date.now() > deadline) throw new Error(`job ${jobId} 未在 ${timeoutMs}ms 内完成`);
		await new Promise((resolvePromise) => setTimeout(resolvePromise, 5));
	}
}

/** 读取 bootstrap 数据。 */
async function bootstrap(routes) {
	const { response, body } = await jsonRequest(routes, 'GET', '/api/practice/bootstrap');
	assert.equal(response.status, 200);
	assert.equal(body.ok, true);
	return body.data;
}

/** 新建课程并返回 courseId。 */
async function createCourse(routes, name = '高等数学') {
	const { response, body } = await jsonRequest(routes, 'POST', '/api/practice/course', {
		body: { action: 'create', name, description: '测试课程' }
	});
	assert.equal(response.status, 200, JSON.stringify(body));
	assert.equal(body.ok, true);
	return body.courseId;
}

/** 上传题目文件（base64）并返回 setId。 */
async function uploadQuestions(routes, courseId, files) {
	const { response, body } = await jsonRequest(routes, 'POST', '/api/practice/upload', {
		body: {
			courseId,
			category: 'question',
			files: files.map((file) => ({
				name: file.name,
				...(file.path === undefined ? {} : { path: file.path }),
				data: Buffer.from(file.text ?? '内容', 'utf8').toString('base64')
			}))
		}
	});
	assert.equal(response.status, 200, JSON.stringify(body));
	assert.equal(body.ok, true);
	return body;
}

/** 解析 SSE 文本为帧数组。 */
function parseSse(text) {
	return text
		.split('\n\n')
		.filter((chunk) => chunk.trim() !== '')
		.map((chunk) => {
			const line = chunk.trim();
			assert.ok(line.startsWith('data: '), `非法 SSE 帧：${JSON.stringify(line)}`);
			return JSON.parse(line.slice('data: '.length));
		});
}

test('注册契约第 4 节全部路由', async (t) => {
	const { routes } = await makeHarness(t);
	const expected = [
		'GET /api/practice/ping',
		'GET /api/practice/bootstrap',
		'GET /api/practice/set',
		'GET /api/practice/job',
		'GET /api/practice/asset',
		'GET /api/practice/thread',
		'POST /api/practice/course',
		'POST /api/practice/doc/delete',
		'POST /api/practice/upload',
		'POST /api/practice/parse',
		'POST /api/practice/answers',
		'POST /api/practice/grade',
		'POST /api/practice/set/mode',
		'POST /api/practice/set/ai-mode',
		'POST /api/practice/set/complete',
		'POST /api/practice/set/delete',
		'POST /api/practice/diagnose',
		'POST /api/practice/svg',
		'POST /api/practice/chat',
		'POST /api/practice/chat/clear'
	];
	for (const key of expected) assert.ok(routes.has(key), `缺少路由 ${key}`);
	assert.equal(routes.size, expected.length);
	for (const entry of routes.values()) {
		assert.equal(entry.requestBody, 'buffered');
		assert.equal(typeof entry.fetch, 'function');
	}
});

test('ping 与 bootstrap 返回版本、数据根与能力', async (t) => {
	const { routes, root } = await makeHarness(t);
	const ping = await jsonRequest(routes, 'GET', '/api/practice/ping');
	assert.equal(ping.response.status, 200);
	assert.equal(ping.body.ok, true);
	assert.equal(ping.body.dataRoot, root);
	assert.match(ping.body.version, /^\d+\.\d+\.\d+/);

	const data = await bootstrap(routes);
	assert.deepEqual(data.courses, []);
	assert.deepEqual(data.global, { analysis: null });
	assert.equal(data.capabilities.images, true);
	assert.equal(data.capabilities.render, false);
	assert.deepEqual(data.capabilities.model, { provider: 'deepseek-official', model: 'deepseek-flash' });
});

test('课程 create/update/delete 全流程', async (t) => {
	const { routes } = await makeHarness(t);
	const courseId = await createCourse(routes, '线性代数');
	assert.match(courseId, /^c_[a-z0-9]{8}$/);

	let data = await bootstrap(routes);
	assert.equal(data.courses.length, 1);
	assert.equal(data.courses[0].name, '线性代数');
	assert.deepEqual(data.courses[0].docs, []);
	assert.deepEqual(data.courses[0].sets, []);

	const updated = await jsonRequest(routes, 'POST', '/api/practice/course', {
		body: { action: 'update', courseId, name: '线性代数（下）', description: '新简介' }
	});
	assert.equal(updated.body.ok, true);
	data = await bootstrap(routes);
	assert.equal(data.courses[0].name, '线性代数（下）');
	assert.equal(data.courses[0].description, '新简介');

	const missing = await jsonRequest(routes, 'POST', '/api/practice/course', {
		body: { action: 'update', courseId: 'c_notexist', name: 'x' }
	});
	assert.equal(missing.response.status, 404);
	assert.equal(missing.body.ok, false);
	assert.match(missing.body.error, /课程不存在/);

	const removed = await jsonRequest(routes, 'POST', '/api/practice/course', {
		body: { action: 'delete', courseId }
	});
	assert.equal(removed.body.ok, true);
	assert.deepEqual((await bootstrap(routes)).courses, []);
	const repeated = await jsonRequest(routes, 'POST', '/api/practice/course', {
		body: { action: 'delete', courseId }
	});
	assert.equal(repeated.response.status, 404);
});

test('doc 上传：base64 解码、ext 白名单、只保存原件（课程文档不抽取文本）', async (t) => {
	const { routes, store, extract } = await makeHarness(t);
	const courseId = await createCourse(routes);
	const mdContent = '# 第一章\n\n课程正文';
	const uploaded = await jsonRequest(routes, 'POST', '/api/practice/upload', {
		body: {
			courseId,
			category: 'doc',
			files: [
				{ name: '第一章.md', data: Buffer.from(mdContent, 'utf8').toString('base64') },
				{ name: '扫描.pdf', data: Buffer.from('%PDF-1.4 fake', 'utf8').toString('base64') },
				{ name: '空文档.docx', data: Buffer.from('fake docx', 'utf8').toString('base64') },
				{ name: '恶意.exe', data: Buffer.from('MZ', 'utf8').toString('base64') }
			]
		}
	});
	assert.equal(uploaded.response.status, 200, JSON.stringify(uploaded.body));
	assert.equal(uploaded.body.ok, true);
	assert.equal(uploaded.body.docs.length, 3);
	assert.equal(uploaded.body.skipped.length, 1);
	assert.equal(uploaded.body.skipped[0].name, '恶意.exe');
	assert.match(uploaded.body.skipped[0].reason, /不支持的文件类型/);

	// data:<mime>;base64, 前缀也要能正确解码。
	const dataUri = await jsonRequest(routes, 'POST', '/api/practice/upload', {
		body: {
			courseId,
			category: 'doc',
			files: [{ name: 'datauri.txt', data: `data:text/plain;base64,${Buffer.from('data uri 正文').toString('base64')}` }]
		}
	});
	assert.equal(dataUri.body.docs.length, 1);
	assert.equal(dataUri.body.docs[0].status, 'ready');
	assert.equal(dataUri.body.docs[0].textRelPath, null);

	const byName = new Map(uploaded.body.docs.map((doc) => [doc.name, doc]));
	assert.equal(byName.get('第一章.md').status, 'ready');
	assert.equal(byName.get('第一章.md').textRelPath, null);
	assert.equal(byName.get('扫描.pdf').status, 'ready');
	assert.equal(byName.get('空文档.docx').status, 'ready');

	// 只保存原件，不生成 text.md（课程文档目录是 Agent 的工作目录）。
	const readyDoc = byName.get('第一章.md');
	assert.ok(await store.exists(readyDoc.relPath));
	assert.equal(await store.readFile(readyDoc.relPath).then((buffer) => buffer.toString('utf8')), mdContent);
	assert.equal(extract.calls.length, 0);

	// bootstrap 里能看到全部文档摘要。
	const data = await bootstrap(routes);
	assert.equal(data.courses[0].docs.length, 4);
	assert.equal(data.courses[0].docs.filter((doc) => doc.status === 'ready').length, 4);

	// 目录上传：磁盘按相对路径保存，且 doc 元数据带 relativePath 供 Client/AI 还原目录结构。
	const folderUpload = await jsonRequest(routes, 'POST', '/api/practice/upload', {
		body: {
			courseId,
			category: 'doc',
			files: [{ name: '1.1 极限.md', path: '第一章/1.1 极限.md', data: Buffer.from('子目录内容').toString('base64') }]
		}
	});
	assert.equal(folderUpload.body.docs.length, 1);
	assert.equal(folderUpload.body.docs[0].name, '1.1 极限.md');
	assert.equal(folderUpload.body.docs[0].relativePath, '第一章/1.1 极限.md');
	assert.match(folderUpload.body.docs[0].relPath, /\/第一章\/1\.1 极限\.md$/);
	assert.ok(await store.exists(folderUpload.body.docs[0].relPath));
	assert.equal(
		await store.readFile(folderUpload.body.docs[0].relPath).then((buffer) => buffer.toString('utf8')),
		'子目录内容'
	);
	// 元数据随 store.json 持久化（bootstrap 可见）。
	const folderDoc = (await bootstrap(routes)).courses[0].docs.find((doc) => doc.id === folderUpload.body.docs[0].id);
	assert.equal(folderDoc.relativePath, '第一章/1.1 极限.md');

	// 越界文件名被清洗，不会写到课程目录之外。
	const tricky = await jsonRequest(routes, 'POST', '/api/practice/upload', {
		body: {
			courseId,
			category: 'doc',
			files: [{ name: '../../escape.md', data: Buffer.from('x').toString('base64') }]
		}
	});
	assert.equal(tricky.body.docs.length, 1);
	assert.ok(tricky.body.docs[0].relPath.startsWith(`courses/${courseId}/docs/`));
	assert.ok(!tricky.body.docs[0].relPath.includes('..'));
});

test('question 上传：每个请求新建 draft 题目集，原件写入 source/', async (t) => {
	const { routes, store } = await makeHarness(t);
	const courseId = await createCourse(routes);
	const uploaded = await uploadQuestions(routes, courseId, [
		{ name: '期中卷.md', text: '# 题目一' },
		{ name: '附加题.txt', text: '题目二' }
	]);
	assert.match(uploaded.setId, /^s_[a-z0-9]{8}$/);
	assert.equal(uploaded.files.length, 2);
	assert.equal(uploaded.skipped.length, 0);

	const data = await bootstrap(routes);
	assert.equal(data.courses[0].sets.length, 1);
	const set = data.courses[0].sets[0];
	assert.equal(set.status, 'draft');
	assert.equal(set.mode, 'immediate');
	assert.equal(set.aiAnswerMode, 'auto');
	assert.equal(set.error, null);
	assert.equal(set.questionCount, 0);
	assert.equal(set.answeredCount, 0);
	assert.equal(set.completedAt, null);
	assert.equal(set.sourceFiles.length, 2);
	assert.match(set.sourceFiles[0].relPath, /\/source\/期中卷\.md$/);
	for (const sourceFile of set.sourceFiles) {
		assert.equal(sourceFile.role, 'questions');
		assert.ok(await store.exists(sourceFile.relPath), `源文件应存在：${sourceFile.relPath}`);
	}
	const second = await uploadQuestions(routes, courseId, [{ name: '第二套.md' }]);
	assert.notEqual(second.setId, uploaded.setId);
	assert.equal((await bootstrap(routes)).courses[0].sets.length, 2);

	// 目录上传的题目文件：sourceFiles 保留 relativePath（磁盘结构不变）。
	const folderSet = await uploadQuestions(routes, courseId, [
		{ name: '1.1 极限.md', path: '第一章/1.1 极限.md', text: '# 极限题目' }
	]);
	const folderSummary = (await bootstrap(routes)).courses[0].sets.find((set) => set.id === folderSet.setId);
	assert.equal(folderSummary.sourceFiles.length, 1);
	assert.equal(folderSummary.sourceFiles[0].name, '1.1 极限.md');
	assert.equal(folderSummary.sourceFiles[0].relativePath, '第一章/1.1 极限.md');
	assert.match(folderSummary.sourceFiles[0].relPath, /\/source\/第一章\/1\.1 极限\.md$/);
	assert.ok(await store.exists(folderSummary.sourceFiles[0].relPath));

	// 未知课程 → 404；空 files → 400。
	const noCourse = await jsonRequest(routes, 'POST', '/api/practice/upload', {
		body: { courseId: 'c_nope0000', category: 'question', files: [{ name: 'a.md', data: 'aGVsbG8=' }] }
	});
	assert.equal(noCourse.response.status, 404);
	const empty = await jsonRequest(routes, 'POST', '/api/practice/upload', {
		body: { courseId, category: 'question', files: [] }
	});
	assert.equal(empty.response.status, 400);
	assert.match(empty.body.error, /请选择要上传的文件/);
});

test('答案文件追加上传（role=answers）与 set/ai-mode 设置', async (t) => {
	const { routes, store } = await makeHarness(t);
	const courseId = await createCourse(routes);
	const { setId } = await uploadQuestions(routes, courseId, [{ name: '期中卷.md', text: '# 试卷' }]);

	// 模拟已解析的题目集：追加答案文件后应回到 draft / error=null，便于重新解析。
	await store.update((state) => {
		const set = state.courses.find((course) => course.id === courseId).sets.find((item) => item.id === setId);
		set.status = 'ready';
		set.error = '旧错误';
		set.questionCount = 10;
		set.updatedAt = 1;
	});

	const answerData = Buffer.from('# 参考答案', 'utf8').toString('base64');
	const append = await jsonRequest(routes, 'POST', '/api/practice/upload', {
		body: {
			courseId,
			category: 'question',
			setId,
			role: 'answers',
			files: [
				{ name: '第一章 答案.md', path: '答案/第一章 答案.md', data: answerData, role: 'answers' },
				{ name: '第二章 答案.md', data: answerData }
			]
		}
	});
	assert.equal(append.response.status, 200, JSON.stringify(append.body));
	assert.equal(append.body.ok, true);
	assert.equal(append.body.setId, setId);
	assert.equal(append.body.files.length, 2);
	assert.equal(append.body.files[0].role, 'answers');
	assert.equal(append.body.files[0].relativePath, '答案/第一章 答案.md');
	assert.match(append.body.files[0].relPath, /\/source\/答案\/第一章 答案\.md$/);
	assert.equal(append.body.files[1].relativePath, '第二章 答案.md');
	for (const file of append.body.files) {
		assert.ok(await store.exists(file.relPath), `答案文件应落盘：${file.relPath}`);
	}

	let data = await bootstrap(routes);
	let set = data.courses[0].sets.find((item) => item.id === setId);
	assert.equal(set.status, 'draft');
	assert.equal(set.error, null);
	assert.ok(set.updatedAt > 1);
	assert.equal(set.sourceFiles.length, 3);
	assert.equal(set.sourceFiles.filter((file) => file.role === 'answers').length, 2);
	assert.equal(set.sourceFiles.find((file) => file.relativePath === '答案/第一章 答案.md').role, 'answers');
	assert.equal(set.sourceFiles.find((file) => file.role === 'questions').name, '期中卷.md');

	// 重复上传同一答案文件：按 relativePath + role 覆盖，不重复追加。
	const repeat = await jsonRequest(routes, 'POST', '/api/practice/upload', {
		body: {
			courseId,
			category: 'question',
			setId,
			role: 'answers',
			files: [{ name: '第一章 答案.md', path: '答案/第一章 答案.md', data: answerData }]
		}
	});
	assert.equal(repeat.body.files.length, 1);
	set = (await bootstrap(routes)).courses[0].sets.find((item) => item.id === setId);
	assert.equal(set.sourceFiles.length, 3);

	// set/ai-mode：三种合法值都能保存，非法值 400。
	for (const mode of ['off', 'regenerate', 'auto']) {
		const updated = await jsonRequest(routes, 'POST', '/api/practice/set/ai-mode', {
			body: { courseId, setId, aiAnswerMode: mode }
		});
		assert.equal(updated.response.status, 200, JSON.stringify(updated.body));
		assert.equal(updated.body.ok, true);
		set = (await bootstrap(routes)).courses[0].sets.find((item) => item.id === setId);
		assert.equal(set.aiAnswerMode, mode);
	}
	const badMode = await jsonRequest(routes, 'POST', '/api/practice/set/ai-mode', {
		body: { courseId, setId, aiAnswerMode: 'always' }
	});
	assert.equal(badMode.response.status, 400);
	assert.equal(badMode.body.ok, false);
	assert.match(badMode.body.error, /AI 答案解析模式/);
	const missingMode = await jsonRequest(routes, 'POST', '/api/practice/set/ai-mode', {
		body: { courseId, setId }
	});
	assert.equal(missingMode.response.status, 400);

	// 追加到不存在的题目集 → 404。
	const missingSet = await jsonRequest(routes, 'POST', '/api/practice/upload', {
		body: {
			courseId,
			category: 'question',
			setId: 's_nope0000',
			role: 'answers',
			files: [{ name: 'a.md', data: answerData }]
		}
	});
	assert.equal(missingSet.response.status, 404);
	assert.match(missingSet.body.error, /题目集不存在/);

	// role=answers 但无 setId → 400；非法 role → 400。
	const answersNoSet = await jsonRequest(routes, 'POST', '/api/practice/upload', {
		body: { courseId, category: 'question', role: 'answers', files: [{ name: 'a.md', data: answerData }] }
	});
	assert.equal(answersNoSet.response.status, 400);
	assert.equal(answersNoSet.body.ok, false);
	assert.match(answersNoSet.body.error, /答案文件需要先指定所属题目集/);
	const badRole = await jsonRequest(routes, 'POST', '/api/practice/upload', {
		body: { courseId, category: 'question', role: 'solutions', files: [{ name: 'a.md', data: answerData }] }
	});
	assert.equal(badRole.response.status, 400);
	assert.match(badRole.body.error, /上传角色/);

	// 追加 questions 文件（role 缺省）也走同一追加逻辑。
	const appendQuestions = await jsonRequest(routes, 'POST', '/api/practice/upload', {
		body: { courseId, category: 'question', setId, files: [{ name: '附加题.md', data: answerData }] }
	});
	assert.equal(appendQuestions.body.ok, true);
	assert.equal(appendQuestions.body.files[0].role, 'questions');
	set = (await bootstrap(routes)).courses[0].sets.find((item) => item.id === setId);
	assert.equal(set.sourceFiles.length, 4);
});

test('parse 后台 job：进度、set 状态、set.json 读取与重复解析拒绝', async (t) => {
	const { routes, calls } = await makeHarness(t);
	const courseId = await createCourse(routes);
	const { setId } = await uploadQuestions(routes, courseId, [{ name: '期中卷.md' }]);

	const started = await jsonRequest(routes, 'POST', '/api/practice/parse', { body: { courseId, setId } });
	assert.equal(started.body.ok, true);
	assert.match(started.body.jobId, /^job_[a-z0-9]+$/);

	// 解析中再次请求 → 400。
	const duplicate = await jsonRequest(routes, 'POST', '/api/practice/parse', { body: { courseId, setId } });
	assert.equal(duplicate.response.status, 400);
	assert.match(duplicate.body.error, /正在解析中/);

	const job = await waitForJob(routes, started.body.jobId);
	assert.equal(job.status, 'done');
	assert.equal(job.progress, 100);
	assert.equal(job.result.questionCount, 2);
	assert.ok(Array.isArray(job.result.warnings));
	assert.equal(calls.parseSet.length, 1);
	assert.equal(calls.parseSet[0].hasSignal, true);

	const setData = await jsonRequest(routes, 'GET', '/api/practice/set', { query: { courseId, setId } });
	assert.equal(setData.response.status, 200);
	assert.equal(setData.body.data.questions.length, 2);
	assert.equal(setData.body.data.questions[0].id, 'q1');

	const data = await bootstrap(routes);
	const set = data.courses[0].sets[0];
	assert.equal(set.status, 'ready');
	assert.equal(set.title, '期中卷');
	assert.equal(set.questionCount, 2);

	// 任务/题目集不存在时的 404。
	const unknownJob = await jsonRequest(routes, 'GET', '/api/practice/job', { query: { jobId: 'job_unknown' } });
	assert.equal(unknownJob.response.status, 404);
	assert.equal(unknownJob.body.ok, false);
	assert.match(unknownJob.body.error, /任务不存在|过期/);
	const unknownSet = await jsonRequest(routes, 'GET', '/api/practice/set', { query: { courseId, setId: 's_nope0000' } });
	assert.equal(unknownSet.response.status, 404);
});

test('answers upsert 维护 answeredCount；complete 汇总 summary 并写 completedAt', async (t) => {
	const { routes } = await makeHarness(t);
	const courseId = await createCourse(routes);
	const { setId } = await uploadQuestions(routes, courseId, [{ name: '期中卷.md' }]);
	const parseJob = await jsonRequest(routes, 'POST', '/api/practice/parse', { body: { courseId, setId } });
	await waitForJob(routes, parseJob.body.jobId);

	const first = await jsonRequest(routes, 'POST', '/api/practice/answers', {
		body: {
			courseId,
			setId,
			records: [
				{ id: 'r_one00001', questionId: 'q1', answer: ['A'], correct: true, revealed: true, durationMs: 5000, at: 1000, mode: 'immediate', selfGraded: false },
				{ id: 'r_two00002', questionId: 'q2', answer: ['错误'], correct: false, revealed: false, durationMs: 7000, at: 2000, mode: 'immediate', selfGraded: false }
			]
		}
	});
	assert.equal(first.response.status, 200, JSON.stringify(first.body));
	assert.equal(first.body.count, 2);

	let data = await bootstrap(routes);
	assert.equal(data.courses[0].records.length, 2);
	assert.equal(data.courses[0].sets[0].answeredCount, 2);

	// 同 id 再次提交为覆盖，不新增记录；同题不同 id 只算一个 questionId。
	const second = await jsonRequest(routes, 'POST', '/api/practice/answers', {
		body: {
			courseId,
			setId,
			records: [
				{ id: 'r_one00001', questionId: 'q1', answer: ['B'], correct: true, revealed: true, durationMs: 3000, at: 3000, mode: 'immediate', selfGraded: true },
				{ id: 'r_three003', questionId: 'q2', answer: ['正确'], correct: false, durationMs: 1000, at: 4000 }
			]
		}
	});
	assert.equal(second.body.count, 2);
	data = await bootstrap(routes);
	assert.equal(data.courses[0].records.length, 3, '按 id upsert，覆盖而非追加');
	const updatedRecord = data.courses[0].records.find((record) => record.id === 'r_one00001');
	assert.deepEqual(updatedRecord.answer, ['B']);
	assert.equal(updatedRecord.correct, true);
	assert.equal(updatedRecord.selfGraded, true);
	assert.equal(data.courses[0].sets[0].answeredCount, 2);

	const completed = await jsonRequest(routes, 'POST', '/api/practice/set/complete', { body: { courseId, setId } });
	assert.equal(completed.response.status, 200, JSON.stringify(completed.body));
	const summary = completed.body.summary;
	assert.equal(summary.questionCount, 2);
	assert.equal(summary.answeredCount, 2);
	// 每题取最新一条：q1 正确、q2 错误 → 已判 2 题，正确率 0.5。
	assert.equal(summary.correctCount, 1);
	assert.equal(summary.accuracy, 0.5);
	assert.equal(summary.durationMs, 3000 + 1000);

	data = await bootstrap(routes);
	assert.ok(Number.isFinite(data.courses[0].sets[0].completedAt));
	assert.equal(data.courses[0].sets[0].answeredCount, 2);

	// 缺 questionId → 400。
	const bad = await jsonRequest(routes, 'POST', '/api/practice/answers', {
		body: { courseId, setId, records: [{ id: 'r_bad', answer: ['A'] }] }
	});
	assert.equal(bad.response.status, 400);
	assert.match(bad.body.error, /questionId/);
});

test('AI 判题：/grade 启动 job、结果安全字段、参数与不存在错误', async (t) => {
	const { routes, calls, tasks } = await makeHarness(t);
	const { courseId, setId } = await prepareParsedSet(routes);

	const started = await jsonRequest(routes, 'POST', '/api/practice/grade', {
		body: { courseId, setId, questionId: 'q1', userAnswer: ['B', 1, null] }
	});
	assert.equal(started.response.status, 200, JSON.stringify(started.body));
	assert.equal(started.body.ok, true);
	assert.match(started.body.jobId, /^job_[a-z0-9]+$/);

	const job = await waitForJob(routes, started.body.jobId);
	assert.equal(job.status, 'done', JSON.stringify(job));
	assert.deepEqual(job.result, {
		verdict: 'partial',
		score: 60,
		summary: '思路基本正确',
		suggestions: ['注意符号'],
		refs: ['第一章.md'],
		generatedAt: 1700000000000,
		correctedAnswer: '2x + 1',
		standardAnswer: 'x = 1',
		mistakeAnalysis: '忽略了负号',
		explanation: '先移项，再合并同类项'
	});

	assert.equal(calls.grade.length, 1);
	assert.equal(calls.grade[0].courseId, courseId);
	assert.equal(calls.grade[0].setId, setId);
	assert.equal(calls.grade[0].questionId, 'q1');
	assert.deepEqual(calls.grade[0].userAnswer, ['B', '1'], 'userAnswer 元素规范化为字符串');
	assert.equal(calls.grade[0].hasSignal, true);

	// 缺参数 / 非法 userAnswer / 不存在资源 → 中文 400/404。
	const missingSet = await jsonRequest(routes, 'POST', '/api/practice/grade', { body: { courseId } });
	assert.equal(missingSet.response.status, 400);
	assert.match(missingSet.body.error, /setId/);

	const badAnswer = await jsonRequest(routes, 'POST', '/api/practice/grade', {
		body: { courseId, setId, questionId: 'q1', userAnswer: 'B' }
	});
	assert.equal(badAnswer.response.status, 400);
	assert.match(badAnswer.body.error, /userAnswer/);

	const noCourse = await jsonRequest(routes, 'POST', '/api/practice/grade', {
		body: { courseId: 'c_missing0', setId, questionId: 'q1', userAnswer: [] }
	});
	assert.equal(noCourse.response.status, 404);
	assert.match(noCourse.body.error, /课程不存在/);

	const noSet = await jsonRequest(routes, 'POST', '/api/practice/grade', {
		body: { courseId, setId: 's_missing0', questionId: 'q1', userAnswer: [] }
	});
	assert.equal(noSet.response.status, 404);
	assert.match(noSet.body.error, /题目集不存在/);

	const noQuestion = await jsonRequest(routes, 'POST', '/api/practice/grade', {
		body: { courseId, setId, questionId: 'q404', userAnswer: [] }
	});
	assert.equal(noQuestion.response.status, 404);
	assert.match(noQuestion.body.error, /题目不存在/);

	// 未解析（没有 set.json）→ 404。
	const draft = await uploadQuestions(routes, courseId, [{ name: '未解析.md' }]);
	const notParsed = await jsonRequest(routes, 'POST', '/api/practice/grade', {
		body: { courseId, setId: draft.setId, questionId: 'q1', userAnswer: [] }
	});
	assert.equal(notParsed.response.status, 404);
	assert.match(notParsed.body.error, /尚未解析完成/);

	// tasks.grade 抛错 → job.error 为中文。
	const originalGrade = tasks.grade;
	tasks.grade = async () => {
		throw new Error('模型判题失败：内容为空');
	};
	const failStart = await jsonRequest(routes, 'POST', '/api/practice/grade', {
		body: { courseId, setId, questionId: 'q2', userAnswer: ['正确'] }
	});
	const failJob = await waitForJob(routes, failStart.body.jobId);
	assert.equal(failJob.status, 'error');
	assert.match(failJob.error, /模型判题失败/);
	tasks.grade = originalGrade;

	// 服务缺失 → 500。
	delete tasks.grade;
	const unavailable = await jsonRequest(routes, 'POST', '/api/practice/grade', {
		body: { courseId, setId, questionId: 'q1', userAnswer: [] }
	});
	assert.equal(unavailable.response.status, 500);
	assert.match(unavailable.body.error, /AI 判题服务不可用/);
});

test('答题记录 aiGrade：安全字段清洗、bootstrap 可见、upsert 合并、旧记录兼容', async (t) => {
	const { routes } = await makeHarness(t);
	const { courseId, setId } = await prepareParsedSet(routes);

	const first = await jsonRequest(routes, 'POST', '/api/practice/answers', {
		body: {
			courseId,
			setId,
			records: [
				{
					id: 'r_ai000001',
					questionId: 'q1',
					answer: ['B'],
					correct: null,
					durationMs: 1500,
					aiGrade: {
						verdict: 'partial',
						score: 88.6,
						summary: '  步骤基本正确  ',
						suggestions: ['注意单位', 42, ''],
						correctedAnswer: '2x + C',
						standardAnswer: '  x = 2  ',
						mistakeAnalysis: 123,
						explanation: 'y'.repeat(9000),
						refs: ['第一章.pdf'],
						generatedAt: 1700000000123,
						secret: '不该持久化'
					}
				},
				{ id: 'r_old00001', questionId: 'q2', answer: ['正确'], correct: true, durationMs: 2000 }
			]
		}
	});
	assert.equal(first.response.status, 200, JSON.stringify(first.body));
	assert.equal(first.body.count, 2);

	let data = await bootstrap(routes);
	let records = data.courses[0].records;
	const aiRecord = records.find((record) => record.id === 'r_ai000001');
	assert.deepEqual(aiRecord.aiGrade, {
		verdict: 'partial',
		score: 88.6,
		summary: '步骤基本正确',
		suggestions: ['注意单位'],
		refs: ['第一章.pdf'],
		generatedAt: 1700000000123,
		correctedAnswer: '2x + C',
		standardAnswer: 'x = 2',
		explanation: 'y'.repeat(8000)
	});
	assert.equal(Object.prototype.hasOwnProperty.call(aiRecord.aiGrade, 'mistakeAnalysis'), false, '非字符串字段被省略');
	assert.equal(aiRecord.aiGrade.explanation.length, 8000, 'explanation 超长截断到 8000');
	assert.equal(Object.prototype.hasOwnProperty.call(aiRecord.aiGrade, 'secret'), false, '只保留安全字段');
	const oldRecord = records.find((record) => record.id === 'r_old00001');
	assert.equal(Object.prototype.hasOwnProperty.call(oldRecord, 'aiGrade'), false, '旧记录没有 aiGrade 正常');

	// upsert 未携带 aiGrade：保留旧判题结果。
	await jsonRequest(routes, 'POST', '/api/practice/answers', {
		body: {
			courseId,
			setId,
			records: [{ id: 'r_ai000001', questionId: 'q1', answer: ['B'], correct: true, durationMs: 900 }]
		}
	});
	data = await bootstrap(routes);
	records = data.courses[0].records;
	assert.equal(records.find((record) => record.id === 'r_ai000001').aiGrade.verdict, 'partial');

	// aiGrade: null：显式清空。
	await jsonRequest(routes, 'POST', '/api/practice/answers', {
		body: { courseId, setId, records: [{ id: 'r_ai000001', questionId: 'q1', answer: ['B'], aiGrade: null }] }
	});
	data = await bootstrap(routes);
	assert.equal(data.courses[0].records.find((record) => record.id === 'r_ai000001').aiGrade, null);

	// 非法 verdict 的对象 → 视为无结果（null）。
	await jsonRequest(routes, 'POST', '/api/practice/answers', {
		body: {
			courseId,
			setId,
			records: [{ id: 'r_ai000001', questionId: 'q1', answer: ['B'], aiGrade: { verdict: 'hacked', score: 999, secret: 1 } }]
		}
	});
	data = await bootstrap(routes);
	assert.equal(data.courses[0].records.find((record) => record.id === 'r_ai000001').aiGrade, null);

	// 旧客户端只带旧字段：不凭空产生新字段，旧字段仍完整保留。
	await jsonRequest(routes, 'POST', '/api/practice/answers', {
		body: {
			courseId,
			setId,
			records: [{ id: 'r_ai000001', questionId: 'q1', answer: ['B'], aiGrade: { verdict: 'correct', score: 100, summary: '全对', suggestions: [], refs: [] } }]
		}
	});
	data = await bootstrap(routes);
	const legacyShape = data.courses[0].records.find((record) => record.id === 'r_ai000001').aiGrade;
	assert.equal(legacyShape.verdict, 'correct');
	assert.equal(legacyShape.score, 100);
	for (const field of ['standardAnswer', 'mistakeAnalysis', 'explanation', 'correctedAnswer']) {
		assert.equal(Object.prototype.hasOwnProperty.call(legacyShape, field), false, `旧客户端不应凭空产生 ${field}`);
	}

	// score 越界会被裁剪到 0-100。
	await jsonRequest(routes, 'POST', '/api/practice/answers', {
		body: {
			courseId,
			setId,
			records: [{ id: 'r_ai000001', questionId: 'q1', answer: ['B'], aiGrade: { verdict: 'incorrect', score: 500, summary: 'x' } }]
		}
	});
	data = await bootstrap(routes);
	const clamped = data.courses[0].records.find((record) => record.id === 'r_ai000001').aiGrade;
	assert.equal(clamped.verdict, 'incorrect');
	assert.equal(clamped.score, 100);
	assert.ok(Number.isFinite(clamped.generatedAt), '缺失 generatedAt 时补当前时间');
});

test('asset：按扩展名回 content-type，越界与课程外路径拒绝', async (t) => {
	const { routes, store } = await makeHarness(t);
	const courseId = await createCourse(routes);
	const otherCourseId = await createCourse(routes, '另一门课');
	const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	await store.writeFile(`courses/${courseId}/assets/pic.png`, pngBytes);
	await store.writeFile(`courses/${courseId}/assets/fig.svg`, '<svg xmlns="http://www.w3.org/2000/svg"/>');
	await store.writeFile(`courses/${courseId}/assets/notes.txt`, 'hello');

	const png = await request(routes, 'GET', '/api/practice/asset', {
		query: { courseId, path: `courses/${courseId}/assets/pic.png` }
	});
	assert.equal(png.status, 200);
	assert.equal(png.headers.get('content-type'), 'image/png');
	assert.deepEqual([...Buffer.from(await png.arrayBuffer())], [...pngBytes]);

	const svg = await request(routes, 'GET', '/api/practice/asset', {
		query: { courseId, path: `courses/${courseId}/assets/fig.svg` }
	});
	assert.equal(svg.headers.get('content-type'), 'image/svg+xml');

	const txt = await request(routes, 'GET', '/api/practice/asset', {
		query: { courseId, path: `courses/${courseId}/assets/notes.txt` }
	});
	assert.match(txt.headers.get('content-type'), /^text\/plain/);

	// 课程外的资源（哪怕物理上存在）拒绝。
	const crossCourse = await jsonRequest(routes, 'GET', '/api/practice/asset', {
		query: { courseId: otherCourseId, path: `courses/${courseId}/assets/pic.png` }
	});
	assert.equal(crossCourse.response.status, 400);
	assert.match(crossCourse.body.error, /只能访问当前课程目录/);

	const traversal = await jsonRequest(routes, 'GET', '/api/practice/asset', {
		query: { courseId, path: '../store.json' }
	});
	assert.equal(traversal.response.status, 400);
	assert.match(traversal.body.error, /路径不合法/);

	const missing = await request(routes, 'GET', '/api/practice/asset', {
		query: { courseId, path: `courses/${courseId}/assets/none.png` }
	});
	assert.equal(missing.status, 404);
});

test('chat SSE：meta/delta/done 帧、message 透传 setId、thread 读取', async (t) => {
	const { routes, calls } = await makeHarness(t);
	const courseId = await createCourse(routes);
	const response = await request(routes, 'POST', '/api/practice/chat', {
		body: {
			courseId,
			message: {
				text: '请讲解第 3 题',
				questionId: 'q3',
				setId: 's_fake0001',
				selectedText: '选中文字',
				docNames: ['第一章.pdf']
			}
		}
	});
	assert.equal(response.status, 200);
	assert.match(response.headers.get('content-type'), /^text\/event-stream/);
	assert.match(response.headers.get('cache-control'), /no-cache/);

	const frames = parseSse(await response.text());
	assert.equal(frames[0].type, 'meta');
	assert.equal(frames[0].threadId, 't_fake0001');
	const deltas = frames.filter((frame) => frame.type === 'delta').map((frame) => frame.text);
	assert.deepEqual(deltas, ['这是', '回答']);
	assert.equal(frames.at(-1).type, 'done');
	assert.equal(frames.at(-1).message.text, '这是回答');
	assert.deepEqual(frames.at(-1).message.refs, ['第一章.pdf']);

	assert.equal(calls.chat.length, 1);
	assert.equal(calls.chat[0].courseId, courseId);
	assert.equal(calls.chat[0].hasSignal, true);
	assert.equal(calls.chat[0].message.text, '请讲解第 3 题');
	assert.equal(calls.chat[0].message.questionId, 'q3');
	assert.equal(calls.chat[0].message.setId, 's_fake0001');
	assert.equal(calls.chat[0].message.selectedText, '选中文字');
	assert.deepEqual(calls.chat[0].message.docNames, ['第一章.pdf']);

	// thread 路由读到 tasks 写下的线程。
	const thread = await jsonRequest(routes, 'GET', '/api/practice/thread', {
		query: { courseId, threadId: 't_fake0001' }
	});
	assert.equal(thread.response.status, 200);
	assert.equal(thread.body.ok, true);
	assert.equal(thread.body.data.id, 't_fake0001');
	assert.equal(thread.body.data.messages.length, 2);

	const missingThread = await jsonRequest(routes, 'GET', '/api/practice/thread', {
		query: { courseId, threadId: 't_missing0' }
	});
	assert.equal(missingThread.response.status, 404);
	assert.equal(missingThread.body.error, '对话不存在');

	// 空消息 → 400（在建立 SSE 之前返回 JSON）。
	const empty = await jsonRequest(routes, 'POST', '/api/practice/chat', {
		body: { courseId, message: { text: '   ' } }
	});
	assert.equal(empty.response.status, 400);
	assert.match(empty.body.error, /消息内容不能为空/);
});

test('chat/clear：指定 threadId 清空消息；缺省新建线程', async (t) => {
	const { routes } = await makeHarness(t);
	const courseId = await createCourse(routes);

	const created = await jsonRequest(routes, 'POST', '/api/practice/chat/clear', { body: { courseId } });
	assert.equal(created.body.ok, true);
	assert.match(created.body.threadId, /^t_[a-z0-9]{8}$/);
	let data = await bootstrap(routes);
	assert.equal(data.courses[0].chatThreads.length, 1);
	let thread = await jsonRequest(routes, 'GET', '/api/practice/thread', {
		query: { courseId, threadId: created.body.threadId }
	});
	assert.deepEqual(thread.body.data.messages, []);

	// 写入一条消息再清空同一线程（chat 返回 SSE，不能按 JSON 解析）。
	const chatResponse = await request(routes, 'POST', '/api/practice/chat', {
		body: { courseId, threadId: created.body.threadId, message: { text: '你好' } }
	});
	await chatResponse.text();
	thread = await jsonRequest(routes, 'GET', '/api/practice/thread', {
		query: { courseId, threadId: created.body.threadId }
	});
	assert.equal(thread.body.data.messages.length, 2);

	const cleared = await jsonRequest(routes, 'POST', '/api/practice/chat/clear', {
		body: { courseId, threadId: created.body.threadId }
	});
	assert.equal(cleared.body.ok, true);
	assert.equal(cleared.body.threadId, created.body.threadId);
	thread = await jsonRequest(routes, 'GET', '/api/practice/thread', {
		query: { courseId, threadId: created.body.threadId }
	});
	assert.deepEqual(thread.body.data.messages, []);
	data = await bootstrap(routes);
	assert.equal(data.courses[0].chatThreads.length, 1);
	assert.equal(data.courses[0].chatThreads[0].messageCount, 0);
});

test('diagnose job：api 只包装任务，store 由 tasks 写入；course/set/global 三种范围', async (t) => {
	const { routes, calls } = await makeHarness(t);
	const courseId = await createCourse(routes);
	const { setId } = await uploadQuestions(routes, courseId, [{ name: '期中卷.md' }]);

	const courseJob = await jsonRequest(routes, 'POST', '/api/practice/diagnose', {
		body: { courseId, scope: 'course' }
	});
	assert.equal(courseJob.body.ok, true);
	const doneCourse = await waitForJob(routes, courseJob.body.jobId);
	assert.equal(doneCourse.status, 'done');
	assert.match(doneCourse.result.markdown, /学情分析/);
	let data = await bootstrap(routes);
	assert.match(data.courses[0].analyses.course.markdown, /学情分析/);

	const setJob = await jsonRequest(routes, 'POST', '/api/practice/diagnose', {
		body: { courseId, scope: 'set', setId }
	});
	const doneSet = await waitForJob(routes, setJob.body.jobId);
	assert.equal(doneSet.status, 'done');
	data = await bootstrap(routes);
	assert.match(data.courses[0].analyses[`set:${setId}`].markdown, /范围：set/);

	const globalJob = await jsonRequest(routes, 'POST', '/api/practice/diagnose', {
		body: { scope: 'global' }
	});
	const doneGlobal = await waitForJob(routes, globalJob.body.jobId);
	assert.equal(doneGlobal.status, 'done');
	data = await bootstrap(routes);
	assert.match(data.global.analysis.markdown, /范围：global/);
	assert.equal(calls.diagnose.length, 3);

	const badScope = await jsonRequest(routes, 'POST', '/api/practice/diagnose', {
		body: { courseId, scope: 'week' }
	});
	assert.equal(badScope.response.status, 400);
	assert.match(badScope.body.error, /分析范围/);
});

test('svg job：完成后 set.json 的 figure 被覆盖为 SVG', async (t) => {
	const { routes, store, calls } = await makeHarness(t);
	const courseId = await createCourse(routes);
	const { setId } = await uploadQuestions(routes, courseId, [{ name: '图题.md' }]);
	await store.writeFile(
		`courses/${courseId}/sets/${setId}/set.json`,
		JSON.stringify(
			{
				id: setId,
				courseId,
				title: '图题',
				pages: [],
				groups: [],
				questions: [
					{
						id: 'q1',
						number: '1',
						type: 'single',
						groupId: null,
						stem: '看图作答',
						options: [],
						answer: ['A'],
						answerDisplay: 'A',
						analysis: '',
						figures: [{ kind: 'png', relPath: `courses/${courseId}/assets/old.png`, alt: '图1' }],
						tags: [],
						difficulty: 'medium'
					}
				],
				warnings: []
			},
			null,
			2
		)
	);

	const started = await jsonRequest(routes, 'POST', '/api/practice/svg', {
		body: { courseId, setId, questionId: 'q1', figureIndex: 0, instruction: '重绘成矢量图' }
	});
	assert.equal(started.body.ok, true);
	const job = await waitForJob(routes, started.body.jobId);
	assert.equal(job.status, 'done');
	assert.match(job.result.relPath, /^courses\/.+\/assets\/f_.+\.svg$/);
	assert.equal(calls.redrawFigure[0].figureIndex, 0);
	assert.equal(calls.redrawFigure[0].instruction, '重绘成矢量图');

	const setData = JSON.parse(await store.readText(`courses/${courseId}/sets/${setId}/set.json`));
	assert.equal(setData.questions[0].figures[0].kind, 'svg');
	assert.equal(setData.questions[0].figures[0].relPath, job.result.relPath);

	const badIndex = await jsonRequest(routes, 'POST', '/api/practice/svg', {
		body: { courseId, setId, questionId: 'q1', figureIndex: -1 }
	});
	assert.equal(badIndex.response.status, 400);
});

test('set mode / doc delete / set delete 与统一错误响应', async (t) => {
	const { routes, store } = await makeHarness(t);
	const courseId = await createCourse(routes);
	const uploaded = await jsonRequest(routes, 'POST', '/api/practice/upload', {
		body: {
			courseId,
			category: 'doc',
			files: [{ name: '讲义.md', data: Buffer.from('# 讲义').toString('base64') }]
		}
	});
	const doc = uploaded.body.docs[0];
	const docDir = `courses/${courseId}/docs/${doc.id}`;
	assert.ok(await store.exists(docDir));

	// doc/delete：删元数据 + 目录，重复删除仍成功。
	const docDeleted = await jsonRequest(routes, 'POST', '/api/practice/doc/delete', {
		body: { courseId, docId: doc.id }
	});
	assert.equal(docDeleted.body.ok, true);
	assert.equal((await bootstrap(routes)).courses[0].docs.length, 0);
	assert.equal(await store.exists(docDir), false);
	const docDeletedAgain = await jsonRequest(routes, 'POST', '/api/practice/doc/delete', {
		body: { courseId, docId: doc.id }
	});
	assert.equal(docDeletedAgain.body.ok, true);

	// set/mode。
	const { setId } = await uploadQuestions(routes, courseId, [{ name: '套题.md' }]);
	const mode = await jsonRequest(routes, 'POST', '/api/practice/set/mode', {
		body: { courseId, setId, mode: 'end' }
	});
	assert.equal(mode.body.ok, true);
	assert.equal((await bootstrap(routes)).courses[0].sets[0].mode, 'end');
	const badMode = await jsonRequest(routes, 'POST', '/api/practice/set/mode', {
		body: { courseId, setId, mode: 'fast' }
	});
	assert.equal(badMode.response.status, 400);

	const setDir = `courses/${courseId}/sets/${setId}`;
	assert.ok(await store.exists(setDir));
	const setDeleted = await jsonRequest(routes, 'POST', '/api/practice/set/delete', { body: { courseId, setId } });
	assert.equal(setDeleted.body.ok, true);
	assert.equal((await bootstrap(routes)).courses[0].sets.length, 0);
	assert.equal(await store.exists(setDir), false);

	// 统一错误响应：非法 JSON → 400；未知 action → 400；不存在的课程 → 404。
	const badJson = await jsonRequest(routes, 'POST', '/api/practice/course', { rawBody: '这不是 JSON' });
	assert.equal(badJson.response.status, 400);
	assert.equal(badJson.body.ok, false);
	assert.match(badJson.body.error, /JSON/);

	const badAction = await jsonRequest(routes, 'POST', '/api/practice/course', {
		body: { action: 'archive' }
	});
	assert.equal(badAction.response.status, 400);
	assert.match(badAction.body.error, /不支持的课程操作/);

	const noCourse = await jsonRequest(routes, 'POST', '/api/practice/answers', {
		body: { courseId: 'c_missing0', setId: 's_missing0', records: [] }
	});
	assert.equal(noCourse.response.status, 404);
	assert.equal(noCourse.body.ok, false);
	assert.match(noCourse.body.error, /课程不存在/);
});

test('dispose 后路由全部注销', async (t) => {
	const { api, routes } = await makeHarness(t);
	assert.ok(routes.size > 0);
	api.dispose();
	assert.equal(routes.size, 0);
	api.dispose(); // 幂等
});

test('jobs：progress/result/error、cancel 与 ttl 清理', async (t) => {
	const jobs = createJobs({ ttlMs: 40 });
	t.after(() => jobs.dispose());

	const doneId = jobs.start('parse', async ({ progress, signal }) => {
		progress('正在渲染…', 30);
		progress('正在识别…');
		await new Promise((resolvePromise) => setTimeout(resolvePromise, 5));
		return { questionCount: 3 };
	});
	assert.match(doneId, /^job_[a-z0-9]+$/);
	const running = jobs.get(doneId);
	assert.equal(running.status, 'running');
	assert.equal(typeof running.progress, 'number');
	await new Promise((resolvePromise) => setTimeout(resolvePromise, 30));
	const done = jobs.get(doneId);
	assert.equal(done.status, 'done');
	assert.equal(done.progress, 100);
	assert.deepEqual(done.result, { questionCount: 3 });
	assert.ok(Number.isFinite(done.endedAt));

	const errorId = jobs.start('diagnose', async () => {
		throw new Error('分析失败：材料为空');
	});
	await new Promise((resolvePromise) => setTimeout(resolvePromise, 20));
	const failed = jobs.get(errorId);
	assert.equal(failed.status, 'error');
	assert.equal(failed.error, '分析失败：材料为空');

	// cancel：把仍在运行的任务标记为已取消。
	const cancelId = jobs.start('svg', ({ signal }) => new Promise((resolvePromise, reject) => {
		signal.addEventListener('abort', () => reject(new Error('已中止')));
	}));
	jobs.cancel(cancelId);
	const cancelled = jobs.get(cancelId);
	assert.equal(cancelled.status, 'error');
	assert.equal(cancelled.error, '任务已取消');

	// ttl 到期后 get 返回 undefined（懒清理）。
	await new Promise((resolvePromise) => setTimeout(resolvePromise, 60));
	assert.equal(jobs.get(doneId), undefined);
	assert.equal(jobs.get(errorId), undefined);

	assert.equal(jobs.get('job_missing'), undefined);
	jobs.dispose();
	assert.throws(() => jobs.start('parse', async () => 1), /已关闭/);
});

test('register 支持无 ctx.connection 时经 ctx.inject 回退注册', async (t) => {
	const root = await mkdtemp(join(tmpdir(), 'practice-api-'));
	const store = await createStore({ rootDir: root });
	const jobs = createJobs({ ttlMs: 1000 });
	const api = createApiRoutes({ store, jobs, logger: { warn: () => {} } });
	t.after(async () => {
		api.dispose();
		jobs.dispose();
		await rm(root, { recursive: true, force: true });
	});

	const registered = new Map();
	const connection = {
		fetch: {
			register(entry) {
				registered.set(`${entry.methods.join(',')} ${entry.path}`, entry);
				return () => registered.delete(`${entry.methods.join(',')} ${entry.path}`);
			}
		}
	};
	let injected = null;
	const rootCtx = {
		inject(deps, callback) {
			injected = deps;
			callback({ get: (name) => (name === 'connection' ? connection : undefined), effect: (factory) => factory() });
		}
	};
	api.register(rootCtx);
	assert.deepEqual(injected, ['connection']);
	assert.equal(registered.size, 20);
	// 无 connection 且无 inject 的上下文直接报中文错误。
	const bareApi = createApiRoutes({ store, jobs, logger: { warn: () => {} } });
	assert.throws(() => bareApi.register({}), /connection\.fetch\.register/);
	bareApi.dispose();
});
