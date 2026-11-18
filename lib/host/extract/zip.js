/**
 * 纯 Node 内置模块实现的最小 ZIP 读取器。
 *
 * 只实现文档抽取需要的能力：按中央目录读取条目、stored（method=0）与
 * deflate（method=8）解压、基础 ZIP64 字段处理。不写文件、不依赖第三方库。
 */

import { readFile } from 'node:fs/promises';
import { inflateRawSync } from 'node:zlib';

const SIG_LOCAL = 0x04034b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_EOCD = 0x06054b50;
const SIG_EOCD64 = 0x06064b50;
const SIG_EOCD64_LOCATOR = 0x07064b50;

/** 抛出的错误统一使用中文，便于上层直接转成 warnings。 */
function fail(message) {
	throw new Error(`ZIP 解析失败：${message}`);
}

function normalizeEntryName(name) {
	return String(name).replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '');
}

/** 从文件尾部向前查找 EOCD（End Of Central Directory）记录偏移。 */
function findEocdOffset(buffer) {
	const minOffset = Math.max(0, buffer.length - 22 - 0xffff);
	for (let offset = buffer.length - 22; offset >= minOffset; offset--) {
		if (buffer.readUInt32LE(offset) === SIG_EOCD) return offset;
	}
	return -1;
}

/** 解析 ZIP64 扩展字段（0x0001），只有中央目录里为 0xFFFFFFFF 的字段才需要。 */
function applyZip64Extra(extra, entry) {
	let pos = 0;
	while (pos + 4 <= extra.length) {
		const id = extra.readUInt16LE(pos);
		const size = extra.readUInt16LE(pos + 2);
		pos += 4;
		if (pos + size > extra.length) break;
		if (id === 0x0001) {
			let cursor = pos;
			const readBig = () => {
				if (cursor + 8 > pos + size) return null;
				const value = extra.readBigUInt64LE(cursor);
				cursor += 8;
				return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : null;
			};
			if (entry.uncompressedSize === 0xffffffff) entry.uncompressedSize = readBig() ?? entry.uncompressedSize;
			if (entry.compressedSize === 0xffffffff) entry.compressedSize = readBig() ?? entry.compressedSize;
			if (entry.localOffset === 0xffffffff) entry.localOffset = readBig() ?? entry.localOffset;
		}
		pos += size;
	}
}

/** 解析中央目录，返回 name -> 条目信息的 Map。 */
function parseCentralDirectory(buffer, cdOffset, cdSize) {
	const entries = new Map();
	const end = Math.min(buffer.length, cdOffset + cdSize);
	let pos = cdOffset;
	let safety = 0;
	while (pos + 46 <= end && buffer.readUInt32LE(pos) === SIG_CENTRAL) {
		if (++safety > 1_000_000) fail('中央目录条目过多');
		const flags = buffer.readUInt16LE(pos + 8);
		const method = buffer.readUInt16LE(pos + 10);
		const crc32 = buffer.readUInt32LE(pos + 16);
		const compressedSize = buffer.readUInt32LE(pos + 20);
		const uncompressedSize = buffer.readUInt32LE(pos + 24);
		const nameLength = buffer.readUInt16LE(pos + 28);
		const extraLength = buffer.readUInt16LE(pos + 30);
		const commentLength = buffer.readUInt16LE(pos + 32);
		const localOffset = buffer.readUInt32LE(pos + 42);
		if (pos + 46 + nameLength > end) fail('中央目录记录越界');

		const nameBytes = buffer.subarray(pos + 46, pos + 46 + nameLength);
		// ZIP 规范：bit 11 表示 UTF-8 文件名；否则按 UTF-8 尽力解码即可。
		const name = normalizeEntryName(nameBytes.toString('utf8'));
		const entry = {
			name,
			flags,
			method,
			crc32,
			compressedSize,
			uncompressedSize,
			localOffset,
		};
		const extraStart = pos + 46 + nameLength;
		const extra = buffer.subarray(extraStart, extraStart + extraLength);
		applyZip64Extra(extra, entry);
		if (name) entries.set(name, entry);
		pos = extraStart + extraLength + commentLength;
	}
	return entries;
}

/** 读取 EOCD 里记录的信息；必要时读取 ZIP64 EOCD。 */
function readEndOfCentralDirectory(buffer) {
	const eocd = findEocdOffset(buffer);
	if (eocd < 0) fail('找不到 ZIP 结束记录（文件可能不是 zip 或已损坏）');
	let entryCount = buffer.readUInt16LE(eocd + 10);
	let cdSize = buffer.readUInt32LE(eocd + 12);
	let cdOffset = buffer.readUInt32LE(eocd + 16);

	if (entryCount === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) {
		// ZIP64：eocd 之前 20 字节是 locator。
		const locator = eocd - 20;
		if (locator >= 0 && buffer.readUInt32LE(locator) === SIG_EOCD64_LOCATOR) {
			const eocd64Big = buffer.readBigUInt64LE(locator + 8);
			const eocd64 = eocd64Big <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(eocd64Big) : -1;
			if (eocd64 >= 0 && eocd64 + 56 <= buffer.length && buffer.readUInt32LE(eocd64) === SIG_EOCD64) {
				entryCount = Number(buffer.readBigUInt64LE(eocd64 + 32));
				cdSize = Number(buffer.readBigUInt64LE(eocd64 + 40));
				cdOffset = Number(buffer.readBigUInt64LE(eocd64 + 48));
			}
		}
	}
	if (cdOffset < 0 || cdOffset > buffer.length) fail('中央目录偏移越界');
	return { entryCount, cdSize, cdOffset };
}

/** 读取单个条目的原始数据并解压（惰性，只在 read 时执行）。 */
function readEntryData(buffer, entry) {
	if (entry.localOffset + 30 > buffer.length) fail(`本地文件头越界：${entry.name}`);
	if (buffer.readUInt32LE(entry.localOffset) !== SIG_LOCAL) fail(`本地文件头无效：${entry.name}`);
	const nameLength = buffer.readUInt16LE(entry.localOffset + 26);
	const extraLength = buffer.readUInt16LE(entry.localOffset + 28);
	const dataStart = entry.localOffset + 30 + nameLength + extraLength;
	const dataEnd = dataStart + entry.compressedSize;
	if (dataStart < 0 || dataEnd > buffer.length) fail(`条目数据越界：${entry.name}`);
	const raw = buffer.subarray(dataStart, dataEnd);

	if (entry.method === 0) return Buffer.from(raw);
	if (entry.method === 8) {
		try {
			return inflateRawSync(raw);
		} catch (error) {
			fail(`解压 deflate 数据失败（${entry.name}）：${error instanceof Error ? error.message : String(error)}`);
		}
	}
	fail(`不支持的压缩方式 ${entry.method}（${entry.name}）`);
	return Buffer.alloc(0);
}

/**
 * 解析内存中的 ZIP 数据。
 * @param {Buffer} buffer
 * @returns {{ names: string[], has(name: string): boolean, read(name: string): Buffer | null, readText(name: string): string | null }}
 */
export function parseZip(buffer) {
	if (!Buffer.isBuffer(buffer) || buffer.length < 22) fail('数据太短，不是有效的 zip');
	const { entryCount, cdSize, cdOffset } = readEndOfCentralDirectory(buffer);
	if (entryCount > 0 && cdSize === 0) fail('中央目录大小为 0');
	const entries = parseCentralDirectory(buffer, cdOffset, cdSize);
	if (entries.size === 0) fail('中央目录为空');

	const read = (name) => {
		const key = normalizeEntryName(name);
		const entry = entries.get(key);
		if (!entry) return null;
		try {
			return readEntryData(buffer, entry);
		} catch (error) {
			fail(error instanceof Error ? error.message.replace(/^ZIP 解析失败：/, '') : String(error));
			return null;
		}
	};

	return {
		names: () => [...entries.keys()],
		has: (name) => entries.has(normalizeEntryName(name)),
		read,
		readText(name) {
			const data = read(name);
			return data ? data.toString('utf8') : null;
		},
	};
}

/** 读取并解析磁盘上的 ZIP 文件。 */
export async function readZip(absPath) {
	const buffer = await readFile(absPath);
	return parseZip(buffer);
}
