/**
 * 刷题模式 — Host Agent 运行时（agent-runtime.js）。
 *
 * 题目解析与右侧对话改用**真实 DSH Agent/Session**（`ctx.agents` / `ctx.sessions`），
 * 而不是插件直接调 `ctx.llm`：DSH Agent 自带工具循环（`read_file` / `read_image` 等），
 * 多模态页面转写更准确（英文单词间空格不丢）。
 *
 * 本模块只依赖 Host 注入的 getter，便于单测：
 *   createAgentRuntime({ getAgents, getSessions, getTools, getDefaultModel, dataRoot, logger })
 *   -> { available(), runTurn(...), resetSession(key), dispose() }
 *
 * 关键实现约定（依据 DSH Host 类型声明 / dsh-agent-loop README）：
 *   - **Session 由 `agents.create()` 的创建事务构造**：调用方只 mint 一个唯一 `session-<uuid>`
 *     并作为 `sessionId` 传入（DSH ACP/SDK 生产代码同样如此）；不要先 `sessions.create()` 再传同一 id，
 *     否则会与工厂的创建事务产生重复 Session 冲突。`handle.dispose()` 会移除该 Agent 及其 Session；
 *   - `agents.create({ sessionId, meta:{cwd}, agentOptions?, setup })` -> AgentHandle `{ agent, dispose() }`；
 *   - `setup(agentCtx, agent)` 中 `agentCtx.get('tools')` 是 Agent 作用域工具注册表：
 *       `tools.schemas()` 读可见工具名；`tools.restrict({ allow })` 只作用于该 Agent 作用域；
 *       未知工具名、空 allow 会让 restrict 抛错，因此先做交集、交集为空则跳过限制（保持默认工具集）；
 *   - 事件 `agent/assistant-stream` 载荷 `{ agent, frame }`，`frame.type === 'chunk'`
 *     且 `frame.chunk.type === 'text-delta'` 时累计 `frame.chunk.text`（忽略 reasoning/tool-call 分片）；
 *   - 驱动：`agent.followup(userMessage)` → `await agent.whenIdle()`；取消用 `agent.cancel({ kind:'user' })`。
 *     消息按完整 UserMessage 构造（id/role/content/source；DSH 内部同样用 `createUserMessage` 生成）。
 *
 * 持久会话失败清理：keepSession 轮次一旦超时 / 外部 abort / Agent 运行失败，该持久会话不再复用——
 * 立即从 Map 移除并 dispose（cancelRequested 复位），下一轮重新创建，避免复用已取消的 Agent。
 *
 * 降级策略：`available()` 为 false 时调用方（tasks.js）走旧 LLM 路径，本模块不抛错。
 */

import { randomUUID } from 'node:crypto';
import { isAbsolute } from 'node:path';

/** 单轮默认超时：3 分钟。 */
const DEFAULT_TIMEOUT_MS = 180000;
/** 允许工具限制的最小/边界处理：空 allow 不调用 restrict（restrict 拒绝空过滤器）。 */
const EMPTY_ALLOW_LIST = Object.freeze([]);

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

/** 中止错误（与 tasks/客户端约定的 isAbortError 兼容：name='AbortError'）。 */
function createAbortError(message = 'Agent 调用已取消') {
	const error = new Error(message);
	error.name = 'AbortError';
	error.code = 'ABORTED';
	return error;
}

/** 超时错误（中文可读）。 */
function createTimeoutError() {
	const error = new Error('Agent 响应超时');
	error.name = 'TimeoutError';
	error.code = 'AGENT_TIMEOUT';
	return error;
}

/** 包装底层异常为中文可读错误，保留原始 message 便于排查。 */
function wrapError(prefix, cause) {
	const detail = cause instanceof Error ? asString(cause.message) : asString(cause);
	const error = new Error(detail === '' ? prefix : `${prefix}：${detail}`);
	error.name = 'AgentRuntimeError';
	if (cause instanceof Error) error.cause = cause;
	return error;
}

/** 组合出可复用的构造用户消息（完整 UserMessage：id/role/content/source）。 */
function buildUserMessage(text) {
	const random = Math.random().toString(36).slice(2, 10);
	return {
		id: `pm-${Date.now().toString(36)}-${random}`,
		role: 'user',
		content: [{ type: 'text', text }],
		source: { kind: 'user' }
	};
}

/** 从消息 content 中提取正文（忽略 reasoning / tool-call 等块）。 */
function textFromContent(content) {
	if (!Array.isArray(content)) return '';
	const parts = [];
	for (const block of content) {
		if (isPlainObject(block) && block.type === 'text' && typeof block.text === 'string') parts.push(block.text);
	}
	return parts.join('');
}

/**
 * 读取会话日志里最后一条有正文的 assistant 消息。
 * 这是最终结果的权威来源：流式监听可能漏掉最后的 assistant/message（例如工具调用后立刻 idle）。
 *
 * @param {object|undefined} sessions ctx.sessions
 * @param {string} sessionId
 * @param {number} [fromSeq] 只读取该序号之后的事件（避免拿到上一轮旧正文）
 * @returns {string}
 */
function sessionAssistantText(sessions, sessionId, fromSeq) {
	if (!sessions || typeof sessions.get !== 'function') return '';
	let session;
	try {
		session = sessions.get(sessionId);
	} catch {
		return '';
	}
	if (!session || typeof session !== 'object') return '';
	// 优先只看本轮新增事件；没有序号能力时退回整段会话消息。
	if (Number.isFinite(fromSeq) && typeof session.snapshotEvents === 'function') {
		try {
			const events = session.snapshotEvents(fromSeq);
			if (Array.isArray(events)) {
				for (let index = events.length - 1; index >= 0; index -= 1) {
					const event = events[index];
					if (!isPlainObject(event) || event.type !== 'assistant/message') continue;
					const text = textFromContent(event.data?.message?.content).trim();
					if (text !== '') return text;
				}
				return '';
			}
		} catch {
			/* 序号读取失败时退回 deriveMessages */
		}
	}
	let messages;
	try {
		messages = typeof session.deriveMessages === 'function' ? session.deriveMessages() : [];
	} catch {
		return '';
	}
	if (!Array.isArray(messages)) return '';
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (!isPlainObject(message) || message.role !== 'assistant') continue;
		const text = textFromContent(message.content).trim();
		if (text !== '') return text;
	}
	return '';
}

/** 校验并归一化「结构化提交工具」定义（name/description/parameters 必填）。 */
function normalizeSubmitTool(value) {
	if (!isPlainObject(value)) return null;
	const name = asString(value.name);
	if (name === '') return null;
	const parameters = isPlainObject(value.parameters) ? value.parameters : { type: 'object', properties: {} };
	const description = asString(value.description) || '提交本次任务的结果。';
	const outputSchema = isPlainObject(value.outputSchema)
		? value.outputSchema
		: { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'] };
	return { name, description, parameters, outputSchema };
}

/**
 * 创建可复用的 Host Agent 运行时。
 *
 * @param {object} deps
 * @param {() => (object|undefined)} deps.getAgents 返回 ctx.agents
 * @param {() => (object|undefined)} deps.getSessions 返回 ctx.sessions
 * @param {() => (object|undefined)} [deps.getTools] 返回全局 ctx.tools（仅用于读取可见工具名兜底）
 * @param {() => ({provider?: string, model?: string, reasoningEffort?: string}|undefined)} [deps.getDefaultModel]
 * @param {string} [deps.dataRoot] 默认工作目录（绝对路径）
 * @param {{warn?: Function, info?: Function, error?: Function, debug?: Function}} [deps.logger]
 * @returns {{available: () => boolean, runTurn: Function, resetSession: Function, dispose: Function}}
 */
export function createAgentRuntime({ getAgents, getSessions, getTools, getAgentPresets, getDefaultModel, dataRoot, logger } = {}) {
	/** @type {Map<string, object>} sessionKey -> 持久会话 */
	const conversations = new Map();
	/** @type {Map<string, Promise<void>>} sessionKey -> 串行队列 */
	const queues = new Map();
	/** @type {Set<AbortController>} 进行中的驱动控制器（dispose 时统一中止） */
	const activeTurns = new Set();
	let disposed = false;

	/** 安全调用 getter：服务未就绪 / 抛错时返回 undefined。 */
	function safeGet(getter) {
		try {
			return typeof getter === 'function' ? getter() : undefined;
		} catch {
			return undefined;
		}
	}

	function warn(message, error) {
		try {
			logger?.warn?.(
				error === undefined ? message : `${message}：${error instanceof Error ? error.message : String(error)}`
			);
		} catch {
			/* 日志失败不影响主流程 */
		}
	}

	/**
	 * 生成一次性 Session 身份。DSH 的 `agents.create()` 创建事务会自行构造并登记 Session
	 * （README：「Creation is one rollback-covered transaction: construct a private session…」；
	 *  ACP/SDK 生产代码也是先 `session-${randomUUID()}` 再 `agents.create({sessionId})`），
	 *  因此这里不能先调用 `sessions.create()`——否则同一 id 会与工厂的创建事务冲突。
	 */
	function mintSessionId() {
		return `session-${randomUUID()}`;
	}

	/** 默认工作目录：必须是绝对路径，否则回退 dataRoot / process.cwd()。 */
	function normalizeCwd(value) {
		const requested = asString(value);
		if (requested !== '' && isAbsolute(requested)) return requested;
		const root = asString(dataRoot);
		if (root !== '' && isAbsolute(root)) return root;
		return process.cwd();
	}

	/** 读取默认模型选择（provider/model/reasoningEffort），缺失返回 undefined。 */
	function defaultAgentOptions() {
		const model = safeGet(getDefaultModel);
		if (!isPlainObject(model)) return undefined;
		const selection = {};
		const provider = asString(model.provider);
		const name = asString(model.model);
		const effort = asString(model.reasoningEffort);
		if (provider !== '') selection.provider = provider;
		if (name !== '') selection.model = name;
		if (effort !== '') selection.reasoningEffort = effort;
		return Object.keys(selection).length > 0 ? selection : undefined;
	}

	/** 归一化 allowTools：只保留非空字符串。 */
	function normalizeAllowTools(value) {
		if (!Array.isArray(value)) return EMPTY_ALLOW_LIST;
		const names = [];
		const seen = new Set();
		for (const item of value) {
			const name = asString(item);
			if (name === '' || seen.has(name)) continue;
			seen.add(name);
			names.push(name);
		}
		return names;
	}

	/** 读取工具注册表当前可见的工具名（失败返回空数组）。 */
	function visibleToolNames(tools) {
		if (!tools || typeof tools.schemas !== 'function') return [];
		try {
			const schemas = tools.schemas();
			if (!Array.isArray(schemas)) return [];
			return schemas.map((schema) => asString(schema && schema.name)).filter((name) => name !== '');
		} catch (error) {
			warn('读取 Agent 可见工具失败', error);
			return [];
		}
	}

	/**
	 * 把 allowTools 中在本 Agent 作用域不可见、但全局可见的工具定义复制到 Agent 作用域。
	 * 用于补齐 preset 未携带的工具（如 read_image 来自 dsh-tool-fs）。
	 */
	function ensureScopedTools(agentCtx, allowTools, label) {
		const requested = normalizeAllowTools(allowTools);
		if (requested.length === 0) return;
		if (agentCtx === null || agentCtx === undefined || typeof agentCtx.get !== 'function') return;
		let scopedTools;
		try {
			scopedTools = agentCtx.get('tools');
		} catch (error) {
			warn(`${label}：读取 Agent 工具注册表失败`, error);
			return;
		}
		if (scopedTools === null || scopedTools === undefined || typeof scopedTools.get !== 'function' || typeof scopedTools.register !== 'function') return;
		const globalTools = safeGet(getTools);
		for (const name of requested) {
			let visibleDefinition;
			try {
				visibleDefinition = scopedTools.get(name);
			} catch (error) {
				visibleDefinition = undefined;
			}
			if (visibleDefinition !== undefined && visibleDefinition !== null) continue;
			let definition;
			try {
				definition = globalTools !== undefined && globalTools !== null && typeof globalTools.get === 'function'
					? globalTools.get(name)
					: undefined;
			} catch (error) {
				definition = undefined;
			}
			if (definition === undefined || definition === null) {
				warn(`${label}：工具 ${name} 在全局与 Agent 作用域都不可见，跳过补齐`);
				continue;
			}
			try {
				scopedTools.register(definition);
			} catch (error) {
				warn(`${label}：向 Agent 作用域注册工具 ${name} 失败`, error);
			}
		}
	}

	/**
	 * 在 Agent 作用域应用工具限制（只收窄、不注册）。返回实际生效的 allow 列表。
	 * 规则：allowTools 为空 → 不限制；与可见工具取交集；交集为空 → 不限制并 warn（restrict 拒绝空/未知过滤器）。
	 */
	function applyToolRestriction(agentCtx, allowTools, label) {
		const requested = normalizeAllowTools(allowTools);
		if (requested.length === 0) return [];
		let tools = null;
		try {
			tools = agentCtx !== undefined && agentCtx !== null && typeof agentCtx.get === 'function'
				? agentCtx.get('tools')
				: undefined;
		} catch (error) {
			warn(`${label}：读取 Agent 工具注册表失败`, error);
		}
		const schemaSource = tools !== null && tools !== undefined ? tools : safeGet(getTools);
		const visible = visibleToolNames(schemaSource);
		let allow;
		if (visible.length === 0) {
			allow = requested;
		} else {
			const visibleSet = new Set(visible);
			allow = requested.filter((name) => visibleSet.has(name));
		}
		if (allow.length === 0) {
			warn(`${label}：allowTools 与当前可见工具无交集，跳过工具限制（保持默认工具集）`);
			return [];
		}
		if (tools === null || tools === undefined || typeof tools.restrict !== 'function') {
			warn(`${label}：当前 Agent 作用域没有可用的 tools.restrict，跳过工具限制`);
			return [];
		}
		try {
			tools.restrict({ allow });
			return allow;
		} catch (error) {
			warn(`${label}：工具限制失败（继续使用默认工具集）`, error);
			return [];
		}
	}

	/** sessionKey 串行队列（前一个结束才跑下一个，无论成功失败）。 */
	function serialize(key, task) {
		const previous = queues.get(key) ?? Promise.resolve();
		const result = previous.then(task, task);
		const settled = result.then(
			() => undefined,
			() => undefined
		);
		queues.set(key, settled);
		const cleanup = () => {
			if (queues.get(key) === settled) queues.delete(key);
		};
		settled.then(cleanup, cleanup);
		return result;
	}

	/** 幂等取消 Agent（同一会话只 cancel 一次，避免超时路径与 dispose 重复触发）。 */
	function cancelConversationAgent(conversation) {
		if (!isPlainObject(conversation) || conversation.cancelRequested === true) return;
		const handle = conversation.handle;
		const agent = handle !== null && handle !== undefined ? handle.agent : undefined;
		if (agent === undefined || agent === null || typeof agent.cancel !== 'function') return;
		conversation.cancelRequested = true;
		try {
			agent.cancel({ kind: 'user' });
		} catch (error) {
			warn('取消 Agent 时出错（忽略）', error);
		}
	}

	/** 释放一个会话句柄（幂等）：先注销提交工具、cancel 再 dispose，失败仅 log。 */
	async function disposeConversation(conversation) {
		if (!isPlainObject(conversation) || conversation.disposed === true) return;
		conversation.disposed = true;
		cancelConversationAgent(conversation);
		if (typeof conversation.unregisterSubmit === 'function') {
			try {
				conversation.unregisterSubmit();
			} catch (error) {
				warn('注销提交工具失败（忽略）', error);
			}
			conversation.unregisterSubmit = null;
		}
		if (typeof conversation.unregisterGuard === 'function') {
			try {
				conversation.unregisterGuard();
			} catch (error) {
				warn('注销工具守卫失败（忽略）', error);
			}
			conversation.unregisterGuard = null;
		}
		const handle = conversation.handle;
		if (handle !== null && handle !== undefined && typeof handle.dispose === 'function') {
			try {
				await handle.dispose();
			} catch (error) {
				warn('释放 Agent 句柄失败（忽略）', error);
			}
		}
		conversation.collector = null;
		conversation.turnController = null;
		conversation.cancelRequested = false;
		conversation.submissions = [];
	}

	/**
	 * 创建一轮用的 Session + Agent（setup 里做工具限制、结构化提交工具与文本流监听）。
	 * @param {{sessionKey: string, cwd: string, allowTools: string[], label: string, agentPreset: string, submitTool: object|null}} options
	 * @returns {Promise<object>} conversation
	 */
	async function createConversation({ sessionKey, cwd, allowTools, label, agentPreset, submitTool }) {
		const agents = safeGet(getAgents);
		if (!agents || typeof agents.create !== 'function') throw new Error('当前环境不支持 DSH Agent 运行时（agents 服务不可用）');

		// agents.create 的创建事务负责构造 Session；调用方只提供唯一身份。
		const sessionId = mintSessionId();

		const conversation = {
			key: sessionKey,
			sessionId,
			handle: null,
			agentCtx: null,
			collector: null,
			turnController: null,
			lastAllowKey: '',
			unregisterGuard: null,
			cancelRequested: false,
			disposed: false,
			submissions: [],
			unregisterSubmit: null
		};

		const setup = async (agentCtx) => {
			if (agentCtx === null || agentCtx === undefined) throw new Error('创建 DSH Agent 失败：setup 未收到 Agent 上下文');
			conversation.agentCtx = agentCtx;
			/* 先挂载 Agent preset（standard 等），DSH 的工具/提示词/行为都由 preset 提供；
			 * 不挂载时 agent-session 里只有少量全局工具，read_image/read 等不可用。 */
			const presetService = safeGet(getAgentPresets);
			if (presetService !== null && presetService !== undefined && typeof presetService.mount === 'function') {
				try {
					await presetService.mount(agentCtx, preset);
				} catch (error) {
					throw wrapError(`加载 Agent preset（${preset}）失败`, error);
				}
			}
			let allowedSet = null;
			try {
				ensureScopedTools(agentCtx, allowTools, label);
				const requested = normalizeAllowTools(allowTools);
				if (requested.length > 0) {
					const scopedTools = typeof agentCtx.get === 'function' ? agentCtx.get('tools') : undefined;
					const visible = visibleToolNames(scopedTools);
					const allowed = visible.length > 0
						? requested.filter((name) => visible.includes(name))
						: requested.slice();
					// 过滤后为空说明请求的工具都不可见；仍然按请求名兜底，避免直接放开全部工具。
					allowedSet = new Set(allowed.length > 0 ? allowed : requested);
					if (submitTool !== null) allowedSet.add(submitTool.name);
					/* restrict 只收窄全局工具；preset 注册到 Agent 作用域的工具（bash/write 等）仍在。
					 * 因此再用 Agent 作用域 guard 拒绝不在白名单内的工具调用。 */
					if (scopedTools !== null && scopedTools !== undefined && typeof scopedTools.guard === 'function') {
						conversation.unregisterGuard = scopedTools.guard((execution) => {
							const name = asString(execution?.name);
							if (name === '' || allowedSet.has(name)) return undefined;
							return `工具 ${name} 在本次任务中不可用；请只使用：${[...allowedSet].join('、')}。`;
						});
					} else {
						warn(`${label}：当前 Agent 作用域没有 tools.guard，无法拦截作用域内的额外工具`);
					}
					const allow = applyToolRestriction(agentCtx, allowTools, label);
					conversation.lastAllowKey = allow.join(',');
				}
			} catch (error) {
				warn(`${label}：初始化工具限制时出错（忽略）`, error);
			}
			/* 结构化提交工具：Agent 调用后参数直接被 Host 收到，避免从回答文本里再抽 JSON。 */
			if (submitTool !== null) {
				try {
					const scopedTools = typeof agentCtx.get === 'function' ? agentCtx.get('tools') : undefined;
					if (scopedTools && typeof scopedTools.register === 'function') {
						conversation.unregisterSubmit = scopedTools.register({
							name: submitTool.name,
							description: submitTool.description,
							parameters: submitTool.parameters,
							output: {
								schema: submitTool.outputSchema,
								render: () => [{ type: 'text', text: '已提交。' }]
							},
							execute: async (args) => {
								if (conversation.submissions.length < 20) conversation.submissions.push(args);
								return { ok: true };
							}
						});
					} else {
						warn(`${label}：当前 Agent 作用域不支持注册工具，提交工具 ${submitTool.name} 不可用`);
					}
				} catch (error) {
					warn(`${label}：注册提交工具 ${submitTool.name} 失败（继续用回答文本）`, error);
				}
			}
			try {
				if (agentCtx === null || agentCtx === undefined || typeof agentCtx.on !== 'function') return;
				agentCtx.on('agent/assistant-stream', (payload) => {
					const collector = conversation.collector;
					if (collector === null) return; // 只在驱动期间收集
					const frame = isPlainObject(payload) ? payload.frame : undefined;
					if (!isPlainObject(frame) || frame.type !== 'chunk') return;
					const chunk = frame.chunk;
					if (!isPlainObject(chunk) || chunk.type !== 'text-delta') return;
					const text = typeof chunk.text === 'string' ? chunk.text : '';
					if (text === '') return;
					collector.chunks.push(text);
					if (typeof collector.onDelta === 'function') {
						try {
							collector.onDelta(text);
						} catch {
							/* 忽略流回调异常，不能中断 Agent */
						}
					}
				});
			} catch (error) {
				warn(`${label}：监听 Agent 文本流失败（忽略）`, error);
			}
		};

		const createOptions = {
			sessionId,
			meta: { cwd },
			setup
		};
		const agentOptions = defaultAgentOptions();
		if (agentOptions !== undefined) createOptions.agentOptions = agentOptions;

		const preset = asString(agentPreset) || 'standard';
		if (preset !== '') createOptions.meta = { ...createOptions.meta, agentPreset: preset };
		let handle;
		try {
			handle = await agents.create(createOptions);
		} catch (error) {
			if (preset !== '') {
				/* 某些组合没有 preset 注册：去掉 preset 再试一次，保持可用。 */
				warn(`${label}：以 agentPreset=${preset} 创建 Agent 失败，回退默认 preset`, error);
				const fallbackOptions = { ...createOptions, meta: { cwd } };
				try {
					handle = await agents.create(fallbackOptions);
				} catch (secondError) {
					throw wrapError('创建 DSH Agent 失败', secondError);
				}
			} else {
				throw wrapError('创建 DSH Agent 失败', error);
			}
		}
		if (!isPlainObject(handle) && (handle === null || typeof handle !== 'object')) {
			throw new Error('创建 DSH Agent 失败：返回的句柄无效');
		}
		if (handle.agent === undefined || handle.agent === null) {
			throw new Error('创建 DSH Agent 失败：句柄缺少 agent');
		}
		conversation.handle = handle;
		return conversation;
	}

	/** 服务是否可用（调用方据此决定是否回退旧 LLM 路径）。 */
	function available() {
		const agents = safeGet(getAgents);
		const sessions = safeGet(getSessions);
		return Boolean(
			agents !== undefined
			&& agents !== null
			&& typeof agents.create === 'function'
			&& sessions !== undefined
			&& sessions !== null
			&& typeof sessions.create === 'function'
		);
	}

	/** 校验并归一化运行参数。 */
	function normalizeRunOptions(options) {
		if (!isPlainObject(options)) throw new Error('runTurn 需要参数对象');
		const promptText = typeof options.promptText === 'string' ? options.promptText : '';
		if (promptText.trim() === '') throw new Error('Agent 提示词不能为空');
		const sessionKey = asString(options.sessionKey);
		const keepSession = options.keepSession === true && sessionKey !== '';
		const rawTimeout = Number(options.timeoutMs);
		const timeoutMs = Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : DEFAULT_TIMEOUT_MS;
		const agentPreset = asString(options.agentPreset) || 'standard';
		const submitTool = normalizeSubmitTool(options.submitTool);
		/* 提交工具注册在 Agent 作用域，restrict 只收窄全局工具，不能把作用域工具写进 allow。 */
		const allowTools = normalizeAllowTools(options.allowTools).slice();
		return {
			agentPreset,
			promptText,
			sessionKey,
			keepSession,
			cwd: normalizeCwd(options.cwd),
			allowTools,
			submitTool,
			requireSubmit: options.requireSubmit === true,
			submitNudge: asString(options.submitNudge)
				|| (submitTool === null ? '' : `请调用 ${submitTool.name} 提交结果。`),
			onDelta: typeof options.onDelta === 'function' ? options.onDelta : undefined,
			signal: options.signal !== undefined && options.signal !== null ? options.signal : undefined,
			timeoutMs,
			label: sessionKey !== '' ? `practice-agent:${sessionKey}` : 'practice-agent'
		};
	}

	/**
	 * 执行一轮 Agent 对话：创建/复用 Session+Agent，followup 后等待空闲，收集 assistant 文本。
	 * @param {object} rawOptions
	 * @param {string} rawOptions.promptText 必填
	 * @param {string} [rawOptions.sessionKey] 持久会话键（keepSession 时用于复用与串行）
	 * @param {boolean} [rawOptions.keepSession] true 且 sessionKey 非空时复用 Agent
	 * @param {string} [rawOptions.cwd] 工作目录（绝对路径，缺省 dataRoot）
	 * @param {string[]} [rawOptions.allowTools] 允许的工具名（空数组=不限制）
	 * @param {(text: string) => void} [rawOptions.onDelta] 流式文本回调
	 * @param {AbortSignal} [rawOptions.signal] 外部取消信号
	 * @param {number} [rawOptions.timeoutMs] 超时（默认 180000）
	 * @returns {Promise<{text: string, sessionId: string}>}
	 */
	async function runTurn(rawOptions) {
		if (disposed) throw new Error('Agent 运行时已释放，无法继续调用');
		const options = normalizeRunOptions(rawOptions);
		if (!available()) throw new Error('当前环境不支持 DSH Agent 运行时（agents/sessions 服务不可用）');
		if (options.keepSession) {
			return serialize(options.sessionKey, () => runTurnInner(options));
		}
		return runTurnInner(options);
	}

	/** 执行一轮（已归一化参数）。 */
	async function runTurnInner(options) {
		const {
			promptText,
			sessionKey,
			keepSession,
			cwd,
			allowTools,
			onDelta,
			signal,
			timeoutMs,
			label,
			agentPreset,
			submitTool,
			requireSubmit,
			submitNudge
		} = options;
		if (signal !== undefined && signal.aborted === true) throw createAbortError();

		let conversation = keepSession ? conversations.get(sessionKey) : undefined;
		let created = false;
		if (conversation === undefined) {
			conversation = await createConversation({ sessionKey, cwd, allowTools, label, agentPreset, submitTool });
			created = true;
			if (keepSession) conversations.set(sessionKey, conversation);
		} else if (conversation.disposed === true) {
			conversations.delete(sessionKey);
			conversation = await createConversation({ sessionKey, cwd, allowTools, label, agentPreset, submitTool });
			created = true;
			conversations.set(sessionKey, conversation);
		}
		if (created === false && normalizeAllowTools(allowTools).length > 0) {
			// 持久会话：仅当本轮限制与创建时不同才追加（限制只收窄，无法放宽）。
			const requestedKey = normalizeAllowTools(allowTools).join(',');
			if (requestedKey !== conversation.lastAllowKey) {
				const applied = applyToolRestriction(conversation.agentCtx, allowTools, label);
				conversation.lastAllowKey = applied.join(',');
			}
		}

		const collector = { chunks: [], onDelta };
		conversation.collector = collector;
		conversation.submissions = [];
		const controller = new AbortController();
		conversation.turnController = controller;
		activeTurns.add(controller);
		let timedOut = false;
		const timer = setTimeout(() => {
			timedOut = true;
			controller.abort();
		}, timeoutMs);
		if (typeof timer.unref === 'function') timer.unref();
		const forwardAbort = () => controller.abort();
		if (signal !== undefined && typeof signal.addEventListener === 'function') {
			signal.addEventListener('abort', forwardAbort, { once: true });
		}
		const abortOutcome = new Promise((resolveAbort) => {
			if (controller.signal.aborted) {
				resolveAbort({ kind: 'aborted' });
				return;
			}
			controller.signal.addEventListener('abort', () => resolveAbort({ kind: 'aborted' }), { once: true });
		});

		/** 本轮开始前的会话序号：只读取本轮新增的 assistant 消息，避免拿到上一轮旧正文。 */
		let turnStartSeq;
		try {
			const session = safeGet(getSessions)?.get?.(conversation.sessionId);
			const seq = session !== undefined && session !== null ? Number(session.seq) : NaN;
			if (Number.isFinite(seq)) turnStartSeq = seq;
		} catch {
			turnStartSeq = undefined;
		}

		/** 收集本轮结果：会话日志的最终正文为准，流式文本兜底，提交工具的参数优先作为结构化结果。 */
		function collectOutcome() {
			const text = sessionAssistantText(safeGet(getSessions), conversation.sessionId, turnStartSeq)
				|| collector.chunks.join('').trim();
			const submissions = Array.isArray(conversation.submissions) ? conversation.submissions : [];
			const result = submissions.length > 0 ? submissions[submissions.length - 1] : null;
			return { text: text.trim(), result };
		}

		/** 失败时把已经拿到的正文/结构化结果挂在错误上，调用方可以选择保留（例如超时前已完成解析）。 */
		function attachPartial(error) {
			if (!error || typeof error !== 'object') return error;
			try {
				const partial = collectOutcome();
				if (partial.text !== '' || partial.result !== null) error.partial = partial;
			} catch {
				/* 读取部分结果失败不影响原始错误 */
			}
			return error;
		}

		/** 等待一次 Agent 空闲（同一轮里可能有 followup 后的第二次等待）。 */
		async function waitIdle(agent) {
			let idlePromise;
			try {
				idlePromise = Promise.resolve(agent.whenIdle());
			} catch (error) {
				throw wrapError('等待 Agent 空闲失败', error);
			}
			const idleOutcome = idlePromise.then(
				() => ({ kind: 'idle' }),
				(error) => ({ kind: 'error', error })
			);
			const outcome = await Promise.race([idleOutcome, abortOutcome]);
			if (outcome.kind === 'aborted') {
				cancelConversationAgent(conversation);
				throw timedOut ? createTimeoutError() : createAbortError();
			}
			if (outcome.kind === 'error') {
				cancelConversationAgent(conversation);
				throw wrapError('Agent 运行失败', outcome.error);
			}
		}

		let failed = false;
		try {
			const agent = conversation.handle.agent;
			try {
				agent.followup(buildUserMessage(promptText));
			} catch (error) {
				throw wrapError('发送 Agent 消息失败', error);
			}
			if (conversation.agentCtx === null && created === false) {
				/* 旧会话没有 setup 上下文：理论上不会发生，保持防御。 */
				warn(`${label}：持久会话缺少 agentCtx，跳过后续工具限制`);
			}
			await waitIdle(agent);
			/* Agent 没有调用提交工具时补一句极短提醒，再等一轮；仍没有就用最终正文解析。 */
			if (requireSubmit === true && submitTool !== null && collectOutcome().result === null) {
				try {
					agent.followup(buildUserMessage(submitNudge));
				} catch (error) {
					throw wrapError('发送提交提醒失败', error);
				}
				await waitIdle(agent);
			}
			const outcome = collectOutcome();
			return { text: outcome.text, sessionId: conversation.sessionId, result: outcome.result };
		} catch (error) {
			failed = true;
			throw attachPartial(error);
		} finally {
			clearTimeout(timer);
			if (signal !== undefined && typeof signal.removeEventListener === 'function') {
				signal.removeEventListener('abort', forwardAbort);
			}
			activeTurns.delete(controller);
			if (conversation.turnController === controller) conversation.turnController = null;
			if (conversation.collector === collector) conversation.collector = null;
			if (!keepSession) {
				await disposeConversation(conversation);
			} else if (failed === true) {
				// 超时/外部 abort/Agent 运行失败后不再复用该持久会话：
				// Agent 可能已处于 cancelled/异常状态，且 cancelRequested 已置位，继续复用会导致后续轮次无法取消。
				// 从 Map 移除并 dispose，下一轮重新创建；cancelRequested 在 disposeConversation 中复位。
				conversations.delete(sessionKey);
				await disposeConversation(conversation);
			} else {
				// 持久会话成功轮：句柄已不在 agents 注册表（被外部释放）时从 Map 移除并清理。
				const agents = safeGet(getAgents);
				const stillLive = agents === undefined || typeof agents.get !== 'function' || agents.get(conversation.sessionId) !== undefined;
				if (!stillLive || conversation.disposed === true) {
					conversations.delete(sessionKey);
					await disposeConversation(conversation);
				}
			}
		}
	}

	/**
	 * 释放某个持久会话（下一轮重新创建）；不存在时幂等返回。
	 * @param {string} sessionKey
	 */
	async function resetSession(sessionKey) {
		const key = asString(sessionKey);
		if (key === '') return;
		const conversation = conversations.get(key);
		conversations.delete(key);
		queues.delete(key);
		if (conversation === undefined) return;
		try {
			conversation.turnController?.abort();
		} catch {
			/* ignore */
		}
		await disposeConversation(conversation);
	}

	/** 释放运行时：中止进行中的轮次并 dispose 所有持久 Agent/Session。 */
	async function dispose() {
		if (disposed) return;
		disposed = true;
		for (const controller of activeTurns) {
			try {
				controller.abort();
			} catch {
				/* ignore */
			}
		}
		activeTurns.clear();
		const pending = [...conversations.values()];
		conversations.clear();
		queues.clear();
		await Promise.all(pending.map((conversation) => disposeConversation(conversation)));
	}

	return { available, runTurn, resetSession, dispose };
}
