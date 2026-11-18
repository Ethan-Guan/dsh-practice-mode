/**
 * 刷题模式 — Host 入口。
 *
 * 负责把持久化（store）、后台任务（jobs）、DSH Agent 运行时（tasks/agent-runtime）、
 * LibreOffice 渲染（render）与 HTTP API（api）接到当前 Host 组合里。
 * Browser 半通过 dsh.client 声明由 Client 模块系统单独加载。
 */

import { resolveDataRoot } from './lib/host/paths.js';
import { createStore } from './lib/host/store.js';
import { createJobs } from './lib/host/jobs.js';
import { createLlm } from './lib/host/llm.js';
import { createRender } from './lib/host/render.js';
import { createTasks } from './lib/host/tasks.js';
import { createAgentRuntime } from './lib/host/agent-runtime.js';
import { cropImageRegion } from './lib/host/image-crop.js';
import { createApiRoutes } from './lib/host/api.js';

export const name = 'practice-mode';

/** 本插件需要 Host 的 Agent/Session（所有 AI 能力）、模型服务（状态快照）与浏览器连接（HTTP 路由）。 */
export const inject = ['agents', 'sessions', 'llm', 'connection'];

/**
 * Mount the practice-mode Host half.
 * @param {import('cordis').Context} ctx - Host plugin context.
 */
export function apply(ctx) {
	const logger = ctx.logger ?? console;
	let disposed = false;
	const disposers = [];

	ctx.effect(
		() => {
			(async () => {
				try {
					const rootDir = resolveDataRoot();
					const store = await createStore({ rootDir: rootDir, logger: logger });
					if (disposed) return;
					await store.ready();
					if (disposed) return;

					const jobs = createJobs({ logger: logger });
					const llm = createLlm({
						getLlm: () => ctx.get('llm'),
						getAttachments: () => ctx.get('attachments'),
						getDefaultModel: () => {
							try {
								const service = ctx.get('agentDefaultModel');
								return service && typeof service.currentSelection === 'function' ? service.currentSelection() : undefined;
							} catch (error) {
								return undefined;
							}
						},
						logger: logger
					});
					const render = createRender({ logger: logger });
					const runtime = createAgentRuntime({
						getAgents: () => ctx.get('agents'),
						getSessions: () => ctx.get('sessions'),
						getTools: () => ctx.get('tools'),
						getAgentPresets: () => ctx.get('agentPresets'),
						getDefaultModel: () => {
							try {
								const service = ctx.get('agentDefaultModel');
								return service && typeof service.currentSelection === 'function' ? service.currentSelection() : undefined;
							} catch (error) {
								return undefined;
							}
						},
						dataRoot: rootDir,
						logger: logger
					});
					const tasks = createTasks({ store: store, runtime: runtime, logger: logger });

					/* 开发诊断：若数据根存在 .agent-smoke-request.json，则在启动时真实跑一次
					 * Agent turn（用于验证 agents.create / assistant-stream / read_image / 工具限制）。
					 * 结果写到 .agent-smoke-result.json 并删除请求文件。仅显式触发时执行。 */
					try {
						const smokeRequestPath = '.agent-smoke-request.json';
						if (await store.exists(smokeRequestPath)) {
							let smokeResult;
							let request = {};
							try {
								request = JSON.parse(await store.readText(smokeRequestPath));
							} catch (error) {
								request = {};
							}
							try {
								if (request.mode === 'crop') {
									const cropped = await cropImageRegion({
										inputPath: String(request.inputPath || ''),
										outputPath: String(request.outputPath || ''),
										x: Number(request.x) || 0,
										y: Number(request.y) || 0,
										width: Number(request.width) || 1,
										height: Number(request.height) || 1
									});
									smokeResult = { ok: true, crop: cropped };
								} else {
									const turn = await runtime.runTurn({
										promptText: typeof request.prompt === 'string' ? request.prompt : '请只回复：AGENT_OK',
										allowTools: Array.isArray(request.allowTools) ? request.allowTools : ['read_image'],
										cwd: rootDir,
										timeoutMs: 240000
									});
									smokeResult = { ok: true, text: turn.text, sessionId: turn.sessionId };
								}
							} catch (error) {
								smokeResult = { ok: false, error: error instanceof Error ? error.message : String(error) };
							}
							let presetIds = null;
							let globalToolNames = null;
							try {
								const presetService = ctx.get('agentPresets');
								if (presetService && typeof presetService.list === 'function') {
									const list = await presetService.list();
									presetIds = Array.isArray(list) ? list.map((item) => item?.id || item?.name).filter(Boolean) : [];
								}
							} catch (error) {
								presetIds = null;
							}
							try {
								const toolsService = ctx.get('tools');
								if (toolsService && typeof toolsService.schemas === 'function') {
									globalToolNames = toolsService.schemas().map((schema) => schema?.name).filter(Boolean);
								}
							} catch (error) {
								globalToolNames = null;
							}
							await store.writeFile('.agent-smoke-result.json', JSON.stringify({
								...smokeResult,
								agentAvailable: runtime.available(),
								presetIds,
								globalToolNames,
								at: Date.now()
							}, null, 2));
							await store.remove(smokeRequestPath);
						}
					} catch (error) {
						logger.warn?.('[practice-mode] agent smoke 执行失败（忽略）', error);
					}
					const api = createApiRoutes({
						store: store,
						jobs: jobs,
						tasks: tasks,
						llm: llm,
						render: render,
						logger: logger
					});

					if (disposed) {
						jobs.dispose();
						return;
					}

					const disposeRoutes = api.register(ctx);
					disposers.push(function () {
						try {
							disposeRoutes();
						} catch (error) {
							/* already disposed */
						}
					});
					disposers.push(function () {
						try {
							jobs.dispose();
						} catch (error) {
							/* ignore */
						}
					});
					disposers.push(function () {
						try {
							Promise.resolve(runtime.dispose()).catch(function () {});
						} catch (error) {
							/* ignore */
						}
					});

					/* 诊断快照：便于安装后确认 Host 半能力（模型 / 图片 / 渲染）。 */
					try {
						const status = {
							version: '1.0.0',
							startedAt: Date.now(),
							dataRoot: rootDir,
							model: llm.selection(),
							images: await llm.supportsImages().catch(() => false),
							render: await render.available().catch(() => false),
							agent: runtime.available()
						};
						await store.writeFile('.status.json', JSON.stringify(status, null, 2));
						logger.info?.('[practice-mode] Host ready: ' + JSON.stringify(status));
					} catch (error) {
						logger.warn?.('[practice-mode] status snapshot failed', error);
					}
				} catch (error) {
					logger.error?.('[practice-mode] Host initialization failed', error);
				}
			})();
			return () => {
				disposed = true;
				for (const dispose of disposers.reverse()) {
					try {
						dispose();
					} catch (error) {
						/* ignore */
					}
				}
				disposers.length = 0;
			};
		},
		'practice-mode: runtime'
	);
}
