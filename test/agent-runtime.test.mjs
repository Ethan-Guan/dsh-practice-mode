/**
 * agent-runtime.js 单元测试：用假 agents/sessions/tools 覆盖
 * available、成功 turn 与流式累计、工具限制交集、持久会话复用与串行、
 * 非持久自动 dispose、超时、abort、resetSession/dispose、错误包装。
 *
 * 运行：node --test test/agent-runtime.test.mjs
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createAgentRuntime } from '../lib/host/agent-runtime.js';

/** 本机生成的 sessionId 形状：session-<uuid>。 */
const SESSION_ID_PATTERN = /^session-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** 等待毫秒。 */
function delay(ms) {
	return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

/**
 * 假 Host：sessions 服务（仅形状）、agents.create / Agent 句柄 / Agent 作用域 tools。
 * 返回 { runtime, calls, host }，calls 记录所有关键调用。
 */
function createFakeHost(options = {}) {
	const calls = {
		sessionsCreated: 0,
		created: [],
		followups: [],
		cancelled: [],
		disposed: [],
		restricted: [],
		registered: [],
		guards: [],
		warnings: []
	};
	const defaultSchemas = [
		{ name: 'read_file', description: '读取文件', parameters: {} },
		{ name: 'read_image', description: '读取图片', parameters: {} },
		{ name: 'bash', description: '终端', parameters: {} }
	];
	const schemas = Array.isArray(options.schemas) ? options.schemas : defaultSchemas;
	const liveAgents = new Map();
	const liveSessions = new Map();

	// 运行时不应调用 sessions.create（Session 由 agents.create 的创建事务构造），
	// 这里保留计数用于断言「没有预先创建 Session」。
	const sessions = {
		create() {
			calls.sessionsCreated += 1;
			return { id: 'session-unexpected' };
		},
		get(sessionId) {
			return liveSessions.get(sessionId);
		}
	};

	const agents = {
		async create(createOptions) {
			if (options.createError) throw options.createError;
			calls.created.push(createOptions);
			const sessionId = createOptions.sessionId;
			let turn = 0;
			const handlerMap = new Map();
			liveSessions.set(sessionId, {
				seq: 0,
				snapshotEvents(fromSeq) {
					return typeof options.snapshotEvents === 'function'
						? options.snapshotEvents({ sessionId, fromSeq })
						: [];
				},
				deriveMessages() {
					return typeof options.sessionMessages === 'function' ? options.sessionMessages(sessionId) : [];
				}
			});
			const emit = (chunk) => {
				const handlers = handlerMap.get('agent/assistant-stream') ?? [];
				for (const handler of handlers) {
					handler({ agent, frame: { type: 'chunk', chunk } });
				}
			};
			const context = () => ({
				sessionId,
				turn,
				agent,
				emitText: (text) => emit({ type: 'text-delta', index: 0, text }),
				emitReasoning: (text) => emit({ type: 'reasoning-delta', index: 0, text }),
				emitToolCall: () => emit({ type: 'tool-call-delta', index: 0, id: 'call-1', name: 'bash', argumentsDelta: '{}' }),
				submit: async (args) => {
					const definition = calls.registered.at(-1)?.definition;
					if (definition !== undefined) await definition.execute(args, {});
				}
			});
			const agent = {
				id: sessionId,
				status: 'idle',
				followup(message) {
					if (options.followupError) throw options.followupError;
					turn += 1;
					calls.followups.push({ sessionId, turn, message });
					if (typeof options.onFollowup === 'function') options.onFollowup(context());
				},
				whenIdle() {
					if (typeof options.whenIdle === 'function') return options.whenIdle(context());
					return Promise.resolve();
				},
				cancel(cause) {
					calls.cancelled.push({ sessionId, cause });
				}
			};
			liveAgents.set(sessionId, agent);
			const handle = {
				agent,
				async dispose() {
					if (options.disposeError) throw options.disposeError;
					calls.disposed.push(sessionId);
				}
			};
			if (typeof createOptions.setup === 'function') {
				const tools = {
					schemas() {
						if (options.schemasError) throw options.schemasError;
						const scoped = calls.registered
							.filter((item) => item.sessionId === sessionId)
							.map((item) => ({ name: item.definition.name, description: item.definition.description, parameters: item.definition.parameters }));
						return [...schemas.map((schema) => ({ ...schema })), ...scoped];
					},
					restrict(filter) {
						if (options.restrictError) throw options.restrictError;
						calls.restricted.push({ sessionId, filter });
						return () => {};
					},
					register(definition) {
						calls.registered.push({ sessionId, definition });
						return () => {
							definition.unregistered = true;
						};
					},
					guard(guard) {
						calls.guards.push({ sessionId, guard });
						return () => {
							guard.unregistered = true;
						};
					}
				};
				const agentCtx = {
					get(name) {
						return name === 'tools' ? tools : undefined;
					},
					on(event, handler) {
						const list = handlerMap.get(event) ?? [];
						list.push(handler);
						handlerMap.set(event, list);
						return () => {};
					}
				};
				createOptions.setup(agentCtx, agent);
			}
			return handle;
		},
		get(sessionId) {
			return liveAgents.get(sessionId);
		}
	};

	const runtime = createAgentRuntime({
		getAgents: () => (options.noAgents === true ? undefined : agents),
		getSessions: () => (options.noSessions === true ? undefined : sessions),
		getDefaultModel: options.getDefaultModel,
		dataRoot: options.dataRoot ?? '/tmp/practice-agent-test-root',
		logger: { warn: (...args) => calls.warnings.push(args.join(' ')) }
	});

	return { runtime, calls, host: { sessions, agents } };
}

test('available：agents/sessions 均可用才为 true，服务抛错视为不可用', async () => {
	assert.equal(createFakeHost().runtime.available(), true);
	assert.equal(createFakeHost({ noAgents: true }).runtime.available(), false);
	assert.equal(createFakeHost({ noSessions: true }).runtime.available(), false);

	const broken = createAgentRuntime({
		getAgents: () => {
			throw new Error('服务未就绪');
		},
		getSessions: () => undefined
	});
	assert.equal(broken.available(), false);
	await assert.rejects(broken.runTurn({ promptText: '你好' }), /不支持 DSH Agent 运行时/);

	const empty = createAgentRuntime({});
	assert.equal(empty.available(), false);
	await empty.dispose();
});

test('成功 turn：minted sessionId 交给 agents.create（不预先 sessions.create）、累计 text、onDelta 只收正文、非持久自动 dispose', async () => {
	const host = createFakeHost({
		whenIdle: async (context) => {
			context.emitText('你');
			context.emitReasoning('（思考）');
			context.emitToolCall();
			context.emitText('好');
			context.emitText('！');
		}
	});
	const deltas = [];
	const result = await host.runtime.runTurn({
		promptText: '写一句话',
		onDelta: (text) => deltas.push(text)
	});

	assert.match(result.sessionId, SESSION_ID_PATTERN, 'sessionId 由运行时 mint 成 session-<uuid>');
	assert.equal(result.text, '你好！');
	assert.deepEqual(deltas, ['你', '好', '！']);

	assert.equal(host.calls.sessionsCreated, 0, 'Session 由 agents.create 的创建事务构造，运行时不再预先 sessions.create');
	assert.equal(host.calls.created.length, 1);
	assert.equal(host.calls.created[0].sessionId, result.sessionId);
	assert.deepEqual(host.calls.created[0].meta, { cwd: '/tmp/practice-agent-test-root', agentPreset: 'standard' });
	assert.equal('agentOptions' in host.calls.created[0], false, '无默认模型时不传 agentOptions');

	const message = host.calls.followups[0].message;
	assert.equal(message.role, 'user');
	assert.equal(typeof message.id, 'string');
	assert.ok(message.id.length > 0);
	assert.deepEqual(message.content, [{ type: 'text', text: '写一句话' }]);
	assert.deepEqual(message.source, { kind: 'user' });

	assert.deepEqual(host.calls.disposed, [result.sessionId], '非持久会话每轮结束后 dispose（会移除 session）');
	await host.runtime.dispose();
});

test('默认模型与 cwd：agentOptions 透传；相对 cwd 回退 dataRoot', async () => {
	const host = createFakeHost({
		getDefaultModel: () => ({ provider: 'deepseek-official', model: 'deepseek-flash', reasoningEffort: 'high' })
	});
	await host.runtime.runTurn({ promptText: 'x', cwd: '/tmp/自定义工作区' });
	assert.deepEqual(host.calls.created[0].agentOptions, {
		provider: 'deepseek-official',
		model: 'deepseek-flash',
		reasoningEffort: 'high'
	});
	assert.deepEqual(host.calls.created[0].meta, { cwd: '/tmp/自定义工作区', agentPreset: 'standard' });

	const fallback = createFakeHost({ dataRoot: '/data/root' });
	await fallback.runtime.runTurn({ promptText: 'x', cwd: 'relative/path' });
	assert.deepEqual(fallback.calls.created[0].meta, { cwd: '/data/root', agentPreset: 'standard' });

	await host.runtime.dispose();
	await fallback.runtime.dispose();
});

test('工具限制：与可见工具取交集；空数组不限制；未知工具不抛错', async () => {
	const host = createFakeHost();
	await host.runtime.runTurn({
		promptText: 'x',
		allowTools: ['read_image', 'read_file', 'unknown_tool']
	});
	assert.equal(host.calls.restricted.length, 1);
	assert.deepEqual(host.calls.restricted[0].filter, { allow: ['read_image', 'read_file'] });

	// 空数组 = 不限制。
	await host.runtime.runTurn({ promptText: 'x', allowTools: [] });
	assert.equal(host.calls.restricted.length, 1);

	// 全部未知 = 无交集，不调用 restrict，只 warn。
	await host.runtime.runTurn({ promptText: 'x', allowTools: ['not_a_tool'] });
	assert.equal(host.calls.restricted.length, 1);
	assert.match(host.calls.warnings.join('\n'), /无交集/);

	// schemas 读取失败时按请求名尝试（不抛错）。
	const strict = createFakeHost({ schemasError: new Error('registry unavailable') });
	await strict.runtime.runTurn({ promptText: 'x', allowTools: ['read_file'] });
	assert.deepEqual(strict.calls.restricted[0].filter, { allow: ['read_file'] });
	assert.match(strict.calls.warnings.join('\n'), /读取 Agent 可见工具失败/);

	await host.runtime.dispose();
	await strict.runtime.dispose();
});

test('工具限制：restrict 抛错只 warn，不影响本轮结果', async () => {
	const host = createFakeHost({ restrictError: new Error('cannot restrict') });
	const result = await host.runtime.runTurn({ promptText: 'x', allowTools: ['read_file'] });
	assert.equal(result.text, '');
	assert.match(host.calls.warnings.join('\n'), /工具限制失败/);
	await host.runtime.dispose();
});

test('keepSession：同 key 复用同一 Agent，turn 串行排队', async () => {
	let active = 0;
	let maxActive = 0;
	const host = createFakeHost({
		whenIdle: async () => {
			active += 1;
			maxActive = Math.max(maxActive, active);
			await delay(20);
			active -= 1;
		}
	});

	const first = host.runtime.runTurn({ sessionKey: 'chat-1', keepSession: true, promptText: '第一轮' });
	const second = host.runtime.runTurn({ sessionKey: 'chat-1', keepSession: true, promptText: '第二轮' });
	const [a, b] = await Promise.all([first, second]);

	assert.equal(host.calls.created.length, 1, '同 key 只创建一个 Agent');
	assert.equal(host.calls.followups.length, 2);
	assert.equal(host.calls.followups[1].turn, 2);
	assert.equal(maxActive, 1, '同 key 必须串行，不能并发驱动');
	assert.equal(a.sessionId, b.sessionId);
	assert.equal(host.calls.disposed.length, 0, '持久会话成功轮后不自动 dispose');

	// 不同 key 各自独立创建。
	await host.runtime.runTurn({ sessionKey: 'chat-2', keepSession: true, promptText: '另一个会话' });
	assert.equal(host.calls.created.length, 2);
	assert.equal(host.calls.disposed.length, 0);

	await host.runtime.dispose();
	assert.equal(host.calls.disposed.length, 2, 'dispose 清理所有持久会话');
});

test('keepSession=false：即使带 sessionKey 也每轮新建并释放', async () => {
	const host = createFakeHost();
	await host.runtime.runTurn({ sessionKey: 'k', promptText: 'a' });
	await host.runtime.runTurn({ sessionKey: 'k', promptText: 'b' });
	assert.equal(host.calls.created.length, 2);
	const firstId = host.calls.created[0].sessionId;
	const secondId = host.calls.created[1].sessionId;
	assert.notEqual(firstId, secondId);
	assert.deepEqual(host.calls.disposed, [firstId, secondId]);
	await host.runtime.dispose();
});

test('timeout：可配置超时，超时取消并释放非持久 Agent，抛中文错误', async () => {
	const host = createFakeHost({ whenIdle: () => new Promise(() => {}) });
	const startedAt = Date.now();
	await assert.rejects(
		host.runtime.runTurn({ promptText: 'x', timeoutMs: 30 }),
		(error) => {
			assert.equal(error.name, 'TimeoutError');
			assert.equal(error.code, 'AGENT_TIMEOUT');
			assert.match(error.message, /Agent 响应超时/);
			return true;
		}
	);
	assert.ok(Date.now() - startedAt >= 20);
	const sessionId = host.calls.created[0].sessionId;
	assert.deepEqual(host.calls.cancelled, [{ sessionId, cause: { kind: 'user' } }]);
	assert.deepEqual(host.calls.disposed, [sessionId]);
	await host.runtime.dispose();
});

test('持久会话超时后不复用：旧 Agent 被取消并释放，下一轮重新创建', async () => {
	let idleCalls = 0;
	const host = createFakeHost({
		whenIdle: () => {
			idleCalls += 1;
			return idleCalls === 1 ? new Promise(() => {}) : Promise.resolve();
		}
	});
	await assert.rejects(
		host.runtime.runTurn({ sessionKey: 'keep', keepSession: true, promptText: '第一轮', timeoutMs: 25 }),
		/Agent 响应超时/
	);
	assert.equal(host.calls.created.length, 1);
	const firstId = host.calls.created[0].sessionId;
	assert.equal(host.calls.cancelled.length, 1);
	assert.deepEqual(host.calls.disposed, [firstId], '超时后持久会话被释放，不再复用');

	const second = await host.runtime.runTurn({ sessionKey: 'keep', keepSession: true, promptText: '第二轮' });
	assert.equal(host.calls.created.length, 2, '下一轮重新创建 Agent');
	assert.notEqual(second.sessionId, firstId);
	assert.match(second.sessionId, SESSION_ID_PATTERN);
	assert.equal(host.calls.followups.at(-1).turn, 1, '新 Agent 的轮次计数重新开始');

	await host.runtime.dispose();
	assert.deepEqual(host.calls.disposed, [firstId, second.sessionId]);
});

test('持久会话在外部 abort / Agent 运行失败后同样释放，下一轮重建', async () => {
	// 1) 外部 abort。
	let abortIdleCalls = 0;
	const abortHost = createFakeHost({
		whenIdle: () => {
			abortIdleCalls += 1;
			return abortIdleCalls === 1 ? new Promise(() => {}) : Promise.resolve();
		}
	});
	const controller = new AbortController();
	const pending = abortHost.runtime.runTurn({
		sessionKey: 'abort-key',
		keepSession: true,
		promptText: 'x',
		signal: controller.signal,
		timeoutMs: 10000
	});
	await delay(20);
	controller.abort();
	await assert.rejects(pending, (error) => error.name === 'AbortError');
	const abortedId = abortHost.calls.created[0].sessionId;
	assert.deepEqual(abortHost.calls.disposed, [abortedId], 'abort 后释放持久会话');
	const afterAbort = await abortHost.runtime.runTurn({ sessionKey: 'abort-key', keepSession: true, promptText: 'y' });
	assert.equal(abortHost.calls.created.length, 2);
	assert.notEqual(afterAbort.sessionId, abortedId);
	await abortHost.runtime.dispose();

	// 2) Agent 运行失败（whenIdle 首次 reject）。
	let turnCount = 0;
	const failHost = createFakeHost({
		whenIdle: () => {
			turnCount += 1;
			return turnCount === 1 ? Promise.reject(new Error('model failed')) : Promise.resolve();
		}
	});
	await assert.rejects(
		failHost.runtime.runTurn({ sessionKey: 'fail-key', keepSession: true, promptText: '第一轮' }),
		/Agent 运行失败/
	);
	const failedId = failHost.calls.created[0].sessionId;
	assert.deepEqual(failHost.calls.disposed, [failedId], '运行失败后释放持久会话');
	const afterFail = await failHost.runtime.runTurn({ sessionKey: 'fail-key', keepSession: true, promptText: '第二轮' });
	assert.equal(failHost.calls.created.length, 2);
	assert.notEqual(afterFail.sessionId, failedId);
	await failHost.runtime.dispose();
});

test('abort：外部 signal 中止本轮、调用 agent.cancel、抛 AbortError 并释放非持久 Agent', async () => {
	const controller = new AbortController();
	const host = createFakeHost({ whenIdle: () => new Promise(() => {}) });
	const pending = host.runtime.runTurn({
		promptText: 'x',
		signal: controller.signal,
		timeoutMs: 10000
	});
	await delay(20);
	controller.abort();
	await assert.rejects(pending, (error) => {
		assert.equal(error.name, 'AbortError');
		assert.equal(error.code, 'ABORTED');
		assert.match(error.message, /取消/);
		return true;
	});
	const sessionId = host.calls.created[0].sessionId;
	assert.deepEqual(host.calls.cancelled, [{ sessionId, cause: { kind: 'user' } }]);
	assert.deepEqual(host.calls.disposed, [sessionId]);
	await host.runtime.dispose();
});

test('abort：已中止的 signal 在创建 Agent 之前直接拒绝', async () => {
	const controller = new AbortController();
	controller.abort();
	const host = createFakeHost();
	await assert.rejects(
		host.runtime.runTurn({ promptText: 'x', signal: controller.signal }),
		/取消/
	);
	assert.equal(host.calls.created.length, 0);
	await host.runtime.dispose();
});

test('resetSession：释放该 key 的 Agent，下一轮重建', async () => {
	const host = createFakeHost();
	const first = await host.runtime.runTurn({ sessionKey: 'chat', keepSession: true, promptText: 'a' });
	assert.equal(host.calls.created.length, 1);
	await host.runtime.resetSession('chat');
	assert.deepEqual(host.calls.disposed, [first.sessionId]);

	const second = await host.runtime.runTurn({ sessionKey: 'chat', keepSession: true, promptText: 'b' });
	assert.equal(host.calls.created.length, 2);
	assert.notEqual(second.sessionId, first.sessionId);

	// 不存在的 key 幂等。
	await host.runtime.resetSession('missing');
	await host.runtime.resetSession('');
	await host.runtime.dispose();
});

test('dispose：清理全部持久会话、中止进行中的轮次、释放后拒绝 runTurn', async () => {
	// 1) 已完成的持久会话在 dispose 时统一释放。
	const host = createFakeHost();
	await host.runtime.runTurn({ sessionKey: 'a', keepSession: true, promptText: 'x' });
	await host.runtime.runTurn({ sessionKey: 'b', keepSession: true, promptText: 'y' });
	assert.equal(host.calls.created.length, 2);
	assert.equal(host.calls.disposed.length, 0);
	const sessionIds = host.calls.created.map((created) => created.sessionId);
	await host.runtime.dispose();
	assert.deepEqual([...host.calls.disposed].sort(), [...sessionIds].sort());
	await assert.rejects(host.runtime.runTurn({ promptText: 'x' }), /已释放/);
	await host.runtime.dispose(); // 幂等

	// 2) 进行中的轮次被 dispose 中止（非持久会话）。
	const running = createFakeHost({ whenIdle: () => new Promise(() => {}) });
	const pending = running.runtime.runTurn({ promptText: 'x', timeoutMs: 10000 });
	await delay(20);
	await running.runtime.dispose();
	await assert.rejects(pending, (error) => {
		assert.equal(error.name, 'AbortError');
		return true;
	});
	const runningId = running.calls.created[0].sessionId;
	assert.deepEqual(running.calls.cancelled, [{ sessionId: runningId, cause: { kind: 'user' } }]);
});

test('错误包装：创建 Agent、followup、whenIdle 失败均抛含原始信息的中文错误', async () => {
	const createErrorHost = createFakeHost({ createError: new Error('agent factory exploded') });
	await assert.rejects(
		createErrorHost.runtime.runTurn({ promptText: 'x' }),
		/创建 DSH Agent 失败：agent factory exploded/
	);
	assert.equal(createErrorHost.calls.disposed.length, 0, '工厂创建失败会自行回滚，没有句柄可释放');

	const followupErrorHost = createFakeHost({ followupError: new Error('inbox closed') });
	await assert.rejects(
		followupErrorHost.runtime.runTurn({ promptText: 'x' }),
		/发送 Agent 消息失败：inbox closed/
	);
	assert.equal(followupErrorHost.calls.disposed.length, 1, '已创建的非持久句柄仍会被释放');

	const idleErrorHost = createFakeHost({ whenIdle: () => Promise.reject(new Error('model failed')) });
	await assert.rejects(
		idleErrorHost.runtime.runTurn({ promptText: 'x' }),
		/Agent 运行失败：model failed/
	);
	assert.equal(idleErrorHost.calls.cancelled.length, 1);

	await Promise.all([
		createErrorHost.runtime.dispose(),
		followupErrorHost.runtime.dispose(),
		idleErrorHost.runtime.dispose()
	]);
});

test('参数校验：空提示词在创建 Agent 之前拒绝；dispose 失败只 warn 不影响返回', async () => {
	const host = createFakeHost();
	await assert.rejects(host.runtime.runTurn({ promptText: '   ' }), /提示词不能为空/);
	assert.equal(host.calls.created.length, 0);

	const disposeErrorHost = createFakeHost({ disposeError: new Error('dispose failed') });
	const result = await disposeErrorHost.runtime.runTurn({ promptText: 'x' });
	assert.equal(result.text, '');
	assert.match(result.sessionId, SESSION_ID_PATTERN);
	assert.match(disposeErrorHost.calls.warnings.join('\n'), /释放 Agent 句柄失败/);

	await host.runtime.dispose();
	await disposeErrorHost.runtime.dispose();
});

test('结构化提交工具：注册到 Agent 作用域、进入 allow、execute 参数作为 result 返回', async () => {
	const submitTool = {
		name: 'submit_x',
		description: '提交结果',
		parameters: { type: 'object', properties: { ok: { type: 'number' } } },
		outputSchema: { type: 'object', properties: { ok: { type: 'boolean' } } }
	};
	const host = createFakeHost({
		onFollowup: (context) => {
			context.emitText('我先说明一下。');
			context.submit({ ok: 1 });
		}
	});
	const result = await host.runtime.runTurn({
		promptText: '解析',
		allowTools: ['read_image'],
		submitTool,
		requireSubmit: true
	});
	assert.deepEqual(result.result, { ok: 1 }, '提交工具的参数直接作为 result');
	assert.equal(result.text, '我先说明一下。');
	assert.equal(host.calls.registered.length, 1);
	assert.equal(host.calls.registered[0].definition.name, 'submit_x');
	assert.equal(host.calls.registered[0].definition.output.schema, submitTool.outputSchema);
	assert.deepEqual(host.calls.restricted[0].filter.allow, ['read_image'], '提交工具是作用域工具，不写进全局 allow');
	assert.equal(host.calls.followups.length, 1, '已提交时不再发提醒');
	await host.runtime.dispose();
});

test('结构化提交工具：未提交时补一句提醒再等一轮；第二轮提交后返回 result', async () => {
	const submitTool = { name: 'submit_y', description: '提交', parameters: { type: 'object' } };
	const host = createFakeHost({
		whenIdle: async () => {},
		onFollowup: (context) => {
			if (context.turn === 2) context.submit({ done: true });
		}
	});
	const result = await host.runtime.runTurn({ promptText: '解析', submitTool, requireSubmit: true });
	assert.deepEqual(result.result, { done: true });
	assert.equal(host.calls.followups.length, 2);
	assert.match(host.calls.followups[1].message.content[0].text, /submit_y/);
	await host.runtime.dispose();
});

test('最终正文：以会话日志最后一条 assistant 消息为准（流式没收到也能拿到结果）', async () => {
	const host = createFakeHost({
		whenIdle: async () => {},
		snapshotEvents: () => [{
			type: 'assistant/message',
			seq: 1,
			data: {
				message: {
					role: 'assistant',
					content: [
						{ type: 'reasoning', text: '思考' },
						{ type: 'text', text: '最终正文' }
					]
				}
			}
		}]
	});
	const result = await host.runtime.runTurn({ promptText: 'x' });
	assert.equal(result.text, '最终正文');
	assert.equal(result.result, null);
	await host.runtime.dispose();
});

test('超时前已提交的结果保留在 error.partial.result，调用方可以使用', async () => {
	const submitTool = { name: 'submit_z', description: '提交', parameters: { type: 'object' } };
	const host = createFakeHost({
		whenIdle: () => new Promise(() => {}),
		onFollowup: (context) => {
			context.submit({ partial: true });
		}
	});
	await assert.rejects(
		host.runtime.runTurn({ promptText: 'x', submitTool, timeoutMs: 30 }),
		(error) => {
			assert.equal(error.name, 'TimeoutError');
			assert.deepEqual(error.partial?.result, { partial: true });
			return true;
		}
	);
	await host.runtime.dispose();
});

test('工具守卫：白名单外的 scoped 工具（bash/write）被拒绝，白名单与提交工具放行', async () => {
	const submitTool = { name: 'submit_w', description: '提交', parameters: { type: 'object' } };
	const host = createFakeHost();
	await host.runtime.runTurn({ promptText: 'x', allowTools: ['read_image'], submitTool });
	assert.equal(host.calls.guards.length, 1);
	const guard = host.calls.guards[0].guard;
	assert.equal(guard({ name: 'bash' })?.includes('bash'), true);
	assert.equal(guard({ name: 'write' })?.includes('bash'), false);
	assert.equal(guard({ name: 'read_image' }), undefined);
	assert.equal(guard({ name: 'submit_w' }), undefined);
	await host.runtime.dispose();
});
