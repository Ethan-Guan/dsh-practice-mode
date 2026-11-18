/**
 * 刷题模式 — Host 数据仓库（store.js）。
 *
 * 负责 `$DSH_HOME/practice/` 数据根目录的初始化与 `store.json` 的读写：
 *   - `store.json` 全量汇总状态（课程、文档摘要、题目集摘要、答题记录、分析、对话摘要）；
 *   - 所有写操作经 `update(mutator)` 串行化，先克隆快照、成功后原子落盘（同目录 `.tmp-*` + rename），
 *     失败不落盘并回滚内存状态；
 *   - 所有相对路径都限制在数据根内，`..`、绝对路径、越界路径一律拒绝；
 *   - 文件工具（读/写/删/建目录）供 tasks.js / api.js 共用。
 *
 * 注意：题目正文 `set.json`、对话线程 `chat/<threadId>.json` 也通过本模块的
 * writeFile/readText 读写，但它们的结构由 tasks.js 负责，不在 store.json 内。
 */

import { randomBytes } from 'node:crypto';
import {
	access,
	mkdir,
	open,
	readFile as readFileFs,
	rename,
	rm,
	writeFile as writeFileFs
} from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

const STORE_FILE = 'store.json';
const STATE_VERSION = 1;
const TMP_DIR = 'tmp';
const COURSES_DIR = 'courses';
const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const ID_LENGTH = 8;

/** @returns {boolean} */
function isPlainObject(value) {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** @returns {number} */
function nowMs() {
	return Date.now();
}

/** 规范化单个课程对象，补齐 Client 依赖的字段，避免旧数据导致 UI 崩溃。 */
function normalizeCourse(value) {
	const course = isPlainObject(value) ? value : {};
	return {
		...course,
		id: typeof course.id === 'string' ? course.id : '',
		name: typeof course.name === 'string' ? course.name : '',
		description: typeof course.description === 'string' ? course.description : '',
		createdAt: Number.isFinite(course.createdAt) ? course.createdAt : nowMs(),
		updatedAt: Number.isFinite(course.updatedAt) ? course.updatedAt : nowMs(),
		docs: Array.isArray(course.docs) ? course.docs.filter(isPlainObject) : [],
		sets: Array.isArray(course.sets) ? course.sets.filter(isPlainObject) : [],
		records: Array.isArray(course.records) ? course.records.filter(isPlainObject) : [],
		analyses: isPlainObject(course.analyses) ? course.analyses : {},
		chatThreads: Array.isArray(course.chatThreads) ? course.chatThreads.filter(isPlainObject) : []
	};
}

/** 规范化整份 store.json。 */
function normalizeState(value) {
	const state = isPlainObject(value) ? value : {};
	const globalRaw = isPlainObject(state.global) ? state.global : {};
	const analysis = isPlainObject(globalRaw.analysis) && typeof globalRaw.analysis.markdown === 'string'
		? globalRaw.analysis
		: null;
	return {
		...state,
		version: STATE_VERSION,
		updatedAt: Number.isFinite(state.updatedAt) ? state.updatedAt : nowMs(),
		courses: Array.isArray(state.courses) ? state.courses.filter(isPlainObject).map(normalizeCourse) : [],
		global: { ...globalRaw, analysis }
	};
}

/** 随机临时文件名后缀。 */
function randomSuffix() {
	return randomBytes(6).toString('hex');
}

/** 尽力 fsync 一个文件（失败忽略：rename 仍是原子的，只是掉电持久性弱一点）。 */
async function fsyncFile(target) {
	let handle = null;
	try {
		handle = await open(target, 'r+');
		await handle.sync();
	} catch {
		/* fsync 失败不影响正确性 */
	} finally {
		if (handle !== null) {
			try {
				await handle.close();
			} catch {
				/* ignore */
			}
		}
	}
}

/**
 * 创建数据仓库。
 * @param {{rootDir: string, logger?: {warn?: Function, info?: Function, error?: Function}}} options
 * @returns {object} store
 */
export function createStore({ rootDir, logger } = {}) {
	if (typeof rootDir !== 'string' || rootDir.trim() === '') {
		throw new Error('createStore 需要 rootDir 参数（数据根目录）');
	}
	const root = resolve(rootDir.trim());
	const stateFile = join(root, STORE_FILE);

	let state = null;
	let readyPromise = null;
	let queue = Promise.resolve();

	function warn(message, error) {
		try {
			if (error === undefined) logger?.warn?.(message);
			else logger?.warn?.(`${message}：${error instanceof Error ? error.message : String(error)}`);
		} catch {
			/* 日志失败不影响主流程 */
		}
	}

	/**
	 * 把数据根下的相对路径解析为绝对路径；越界（`..`、绝对路径、根外）抛错。
	 * @param {string} relPath
	 * @returns {string}
	 */
	function abs(relPath) {
		if (typeof relPath !== 'string') throw new Error('路径必须是字符串');
		const trimmed = relPath.trim();
		if (trimmed === '') throw new Error('路径不能为空');
		if (trimmed.includes('\u0000')) throw new Error('路径包含非法字符');
		if (isAbsolute(trimmed)) throw new Error(`拒绝绝对路径：${trimmed}`);
		const target = resolve(root, trimmed);
		const rel = relative(root, target);
		if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
			throw new Error(`路径越界，拒绝访问数据根之外的位置：${relPath}`);
		}
		return target;
	}

	/** 原子写：同目录临时文件 → fsync → rename。 */
	async function writeAtomic(target, data) {
		const dirPath = dirname(target);
		await mkdir(dirPath, { recursive: true });
		const tmpPath = join(dirPath, `.tmp-${randomSuffix()}`);
		try {
			await writeFileFs(tmpPath, data);
			await fsyncFile(tmpPath);
			await rename(tmpPath, target);
		} catch (error) {
			try {
				await rm(tmpPath, { force: true });
			} catch {
				/* ignore */
			}
			throw error;
		}
	}

	/** 原子写 store.json。 */
	async function persist(nextState) {
		await writeAtomic(stateFile, `${JSON.stringify(nextState, null, 2)}\n`);
	}

	/** 初始化目录并读取 store.json；损坏文件先备份再重建默认状态。 */
	async function init() {
		await mkdir(root, { recursive: true });
		await mkdir(join(root, TMP_DIR), { recursive: true });
		await mkdir(join(root, COURSES_DIR), { recursive: true });

		let parsed;
		let needed = false;
		try {
			const raw = await readFileFs(stateFile, 'utf8');
			parsed = JSON.parse(raw);
			if (!isPlainObject(parsed)) throw new Error('store.json 顶层不是对象');
		} catch (error) {
			if (error?.code === 'ENOENT') {
				needed = true;
			} else {
				needed = true;
				warn('store.json 读取失败，已备份损坏文件并重建默认数据', error);
				try {
					await rename(stateFile, join(root, `${STORE_FILE}.corrupt-${nowMs()}`));
				} catch {
					/* 备份失败则直接覆盖 */
				}
			}
			parsed = undefined;
		}

		state = normalizeState(parsed);
		if (needed) await persist(state);
		return state;
	}

	/**
	 * 初始化数据根目录并读取 store.json（幂等；失败后允许重试）。
	 * @returns {Promise<object>} state
	 */
	function ready() {
		if (readyPromise === null) {
			readyPromise = init().catch((error) => {
				readyPromise = null;
				throw error;
			});
		}
		return readyPromise;
	}

	/**
	 * 同步快照（仅 ready() 之后可用）。
	 * @returns {object} state
	 */
	function get() {
		if (state === null) throw new Error('store 尚未初始化，请先调用 ready()');
		return state;
	}

	/**
	 * 串行执行一次状态变更并原子落盘；mutator 抛错时内存与磁盘都不变。
	 * @param {(state: object) => void | Promise<void>} mutator
	 * @returns {Promise<object>} 变更后的 state
	 */
	function update(mutator) {
		if (typeof mutator !== 'function') return Promise.reject(new Error('store.update 需要 mutator 函数'));
		const execute = async () => {
			await ready();
			const current = state;
			const draft = structuredClone(current);
			await mutator(draft);
			draft.updatedAt = nowMs();
			await persist(draft);
			state = draft;
			return state;
		};
		const result = queue.then(execute, execute);
		queue = result.then(
			() => undefined,
			() => undefined
		);
		return result;
	}

	/**
	 * mkdir -p 数据根下的相对目录并返回绝对路径。
	 * @param {string} relPath
	 * @returns {Promise<string>}
	 */
	async function dir(relPath) {
		const target = abs(relPath);
		await mkdir(target, { recursive: true });
		return target;
	}

	/**
	 * 原子写入文件（字符串或二进制）。
	 * @param {string} relPath
	 * @param {string | Uint8Array | ArrayBuffer} data
	 */
	async function writeFile(relPath, data) {
		const target = abs(relPath);
		let payload = data;
		if (typeof data === 'string') payload = data;
		else if (data instanceof Uint8Array) payload = data;
		else if (data instanceof ArrayBuffer) payload = Buffer.from(data);
		else if (ArrayBuffer.isView(data)) payload = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
		else throw new Error('store.writeFile 只支持字符串或二进制数据');
		await writeAtomic(target, payload);
	}

	/**
	 * 读取文件为 Buffer。
	 * @param {string} relPath
	 * @returns {Promise<Buffer>}
	 */
	async function readFile(relPath) {
		return readFileFs(abs(relPath));
	}

	/**
	 * 读取文本文件（UTF-8）。
	 * @param {string} relPath
	 * @returns {Promise<string>}
	 */
	async function readText(relPath) {
		return readFileFs(abs(relPath), 'utf8');
	}

	/**
	 * 路径是否存在。
	 * @param {string} relPath
	 * @returns {Promise<boolean>}
	 */
	async function exists(relPath) {
		try {
			await access(abs(relPath));
			return true;
		} catch (error) {
			if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') return false;
			throw error;
		}
	}

	/**
	 * 删除文件或目录（幂等）。
	 * @param {string} relPath
	 */
	async function remove(relPath) {
		await rm(abs(relPath), { recursive: true, force: true });
	}

	/**
	 * 生成短 id：`${prefix}_` + 8 位小写字母数字，如 `c_a1b2c3d4`。
	 * @param {string} prefix
	 * @returns {string}
	 */
	function newId(prefix) {
		const head = typeof prefix === 'string' && prefix.trim() !== '' ? prefix.trim() : 'x';
		const bytes = randomBytes(ID_LENGTH);
		let tail = '';
		for (let index = 0; index < ID_LENGTH; index += 1) {
			tail += ID_ALPHABET[bytes[index] % ID_ALPHABET.length];
		}
		return `${head}_${tail}`;
	}

	const store = {
		ready,
		get,
		update,
		abs,
		dir,
		writeFile,
		readFile,
		readText,
		exists,
		remove,
		newId
	};
	// 额外暴露数据根（只读）：api.js 的 ping 路由需要回显 dataRoot。
	Object.defineProperty(store, 'rootDir', { value: root, enumerable: true });
	return store;
}
