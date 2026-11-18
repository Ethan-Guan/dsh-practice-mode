/**
 * 刷题模式 — 后台任务注册表（jobs.js）。
 *
 * 解析题目 / 生成学情分析 / 重绘 SVG 这类耗时操作通过后台任务执行：
 *   - `start(kind, runner, meta)` 立即返回 jobId，runner 在微任务里异步执行；
 *   - runner 收到 `{progress(message, percent?), signal}`，可上报中文进度文案与百分比；
 *   - 任务快照：running | done | error，含 progress/message/result/error/startedAt/endedAt；
 *   - 终态任务保留 `ttlMs`（默认 30 分钟）后由定时器/懒清理淘汰；
 *   - `cancel(jobId)` 通过 AbortSignal 通知 runner 停止，并把任务标记为已取消。
 */

const TERMINAL_STATUSES = new Set(['done', 'error']);
const DEFAULT_TTL_MS = 30 * 60 * 1000;
const JOB_ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const SWEEP_INTERVAL_MAX_MS = 60 * 1000;

/** @returns {boolean} */
function isPlainObject(value) {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 判断字符串是否包含中日韩统一表意文字（用于区分中文可读错误与英文技术错误）。 */
function hasChinese(text) {
	return /[\u3400-\u9fff]/.test(text);
}

/** 把任意异常收敛为一条用户可读的中文错误文案。 */
function describeError(error) {
	let raw = '';
	if (error instanceof Error) raw = typeof error.message === 'string' ? error.message : '';
	else if (typeof error === 'string') raw = error;
	else if (isPlainObject(error) && typeof error.message === 'string') raw = error.message;
	raw = raw.trim();
	if (raw === '') return '任务执行失败';
	return hasChinese(raw) ? raw : `任务执行失败：${raw}`;
}

/** 用 Math.random 生成 10 位小写字母数字后缀（jobId 只用于进程内查表，无需密码学强度）。 */
function randomJobSuffix() {
	let suffix = '';
	for (let index = 0; index < 10; index += 1) {
		suffix += JOB_ID_ALPHABET[Math.floor(Math.random() * JOB_ID_ALPHABET.length)];
	}
	return suffix;
}

/** 生成任务 id：`job_` + 10 位小写字母数字。 */
function newJobId() {
	return `job_${randomJobSuffix()}`;
}

/**
 * 创建任务注册表。
 * @param {{ttlMs?: number, logger?: {warn?: Function}}} options
 * @returns {object} jobs
 */
export function createJobs({ ttlMs = DEFAULT_TTL_MS, logger } = {}) {
	const ttl = Number.isFinite(ttlMs) && ttlMs > 0 ? ttlMs : DEFAULT_TTL_MS;
	/** @type {Map<string, object>} */
	const records = new Map();
	/** @type {Map<string, AbortController>} */
	const controllers = new Map();
	let sweeper = null;
	let disposed = false;

	function warn(message) {
		try {
			logger?.warn?.(message);
		} catch {
			/* ignore */
		}
	}

	/** 任务的对外快照（只含契约字段，屏蔽内部 promise/controller）。 */
	function snapshot(record) {
		const result = {
			id: record.id,
			kind: record.kind,
			status: record.status,
			progress: record.progress,
			message: record.message,
			startedAt: record.startedAt
		};
		if (record.result !== undefined) result.result = record.result;
		if (record.error !== undefined) result.error = record.error;
		if (record.endedAt !== undefined) result.endedAt = record.endedAt;
		if (isPlainObject(record.meta) && Object.keys(record.meta).length > 0) result.meta = record.meta;
		return result;
	}

	/** 清理过期终态任务；注册表为空时停掉定时器。 */
	function sweep() {
		const now = Date.now();
		for (const [jobId, record] of records) {
			if (TERMINAL_STATUSES.has(record.status) && typeof record.endedAt === 'number' && now - record.endedAt > ttl) {
				records.delete(jobId);
				controllers.delete(jobId);
			}
		}
		if (records.size === 0 && sweeper !== null) {
			clearInterval(sweeper);
			sweeper = null;
		}
	}

	function ensureSweeper() {
		if (sweeper !== null || disposed) return;
		const interval = Math.max(1000, Math.min(ttl, SWEEP_INTERVAL_MAX_MS));
		sweeper = setInterval(sweep, interval);
		if (typeof sweeper.unref === 'function') sweeper.unref();
	}

	/** 懒清理：get 时如果终态任务已超过 ttl，直接视为不存在。 */
	function isExpired(record) {
		return TERMINAL_STATUSES.has(record.status)
			&& typeof record.endedAt === 'number'
			&& Date.now() - record.endedAt > ttl;
	}

	/**
	 * 启动一个后台任务。
	 * @param {string} kind 任务类型（parse / diagnose / svg 等）
	 * @param {(context: {progress: (message: string, percent?: number) => void, signal: AbortSignal}) => Promise<any>} runner
	 * @param {object} [meta] 附加元信息（仅用于调试，快照里会带上）
	 * @returns {string} jobId
	 */
	function start(kind, runner, meta) {
		if (disposed) throw new Error('任务注册表已关闭，无法启动新任务');
		if (typeof kind !== 'string' || kind.trim() === '') throw new Error('任务类型 kind 必须是非空字符串');
		if (typeof runner !== 'function') throw new Error('任务 runner 必须是函数');

		const id = newJobId();
		const controller = new AbortController();
		const record = {
			id,
			kind: kind.trim(),
			status: 'running',
			progress: 0,
			message: '任务已开始',
			result: undefined,
			error: undefined,
			startedAt: Date.now(),
			endedAt: undefined,
			meta: isPlainObject(meta) ? { ...meta } : undefined
		};
		records.set(id, record);
		controllers.set(id, controller);
		ensureSweeper();

		const context = {
			signal: controller.signal,
			progress(message, percent) {
				if (record.status !== 'running') return;
				if (typeof message === 'string' && message.trim() !== '') record.message = message.trim();
				if (typeof percent === 'number' && Number.isFinite(percent)) {
					record.progress = Math.max(0, Math.min(100, Math.round(percent)));
				} else if (record.progress < 90) {
					// runner 只给文案时温和推进进度条，避免 UI 停在 0%。
					record.progress = Math.min(90, record.progress + 10);
				}
			}
		};

		Promise.resolve()
			.then(() => runner(context))
			.then((result) => {
				if (record.status !== 'running') return;
				record.status = 'done';
				record.result = result;
				record.progress = 100;
				record.message = record.message === '任务已开始' ? '任务已完成' : record.message;
				record.endedAt = Date.now();
				controllers.delete(id);
			})
			.catch((error) => {
				if (record.status !== 'running') return;
				record.status = 'error';
				record.error = describeError(error);
				record.message = record.error;
				record.endedAt = Date.now();
				controllers.delete(id);
				warn(`practice-mode: 任务 ${id}（${record.kind}）失败：${record.error}`);
			});

		return id;
	}

	/**
	 * 读取任务快照；未知或已过期返回 undefined。
	 * @param {string} jobId
	 * @returns {object|undefined}
	 */
	function get(jobId) {
		if (typeof jobId !== 'string' || jobId.trim() === '') return undefined;
		const record = records.get(jobId.trim());
		if (record === undefined) return undefined;
		if (isExpired(record)) {
			records.delete(record.id);
			controllers.delete(record.id);
			return undefined;
		}
		return snapshot(record);
	}

	/**
	 * 取消任务：abort 信号并把仍在运行的任务标记为 error（error='任务已取消'）。
	 * @param {string} jobId
	 */
	function cancel(jobId) {
		if (typeof jobId !== 'string') return;
		const record = records.get(jobId);
		if (record === undefined || record.status !== 'running') return;
		const controller = controllers.get(jobId);
		controllers.delete(jobId);
		try {
			controller?.abort();
		} catch {
			/* ignore */
		}
		record.status = 'error';
		record.error = '任务已取消';
		record.message = '任务已取消';
		record.endedAt = Date.now();
	}

	/** 释放注册表：取消全部任务并清空。 */
	function dispose() {
		if (disposed) return;
		disposed = true;
		for (const controller of controllers.values()) {
			try {
				controller.abort();
			} catch {
				/* ignore */
			}
		}
		controllers.clear();
		records.clear();
		if (sweeper !== null) {
			clearInterval(sweeper);
			sweeper = null;
		}
	}

	return { start, get, cancel, dispose };
}
