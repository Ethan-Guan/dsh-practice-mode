/**
 * 文档抽取共用小工具：错误信息、warning 去重、OOXML 关系文件解析。
 */

import { posix } from 'node:path';
import { parseXml, walkElements } from './xml.js';

/** 统一取错误信息文本。 */
export function messageOf(error) {
	return error instanceof Error ? error.message : String(error);
}

/** 去重并限制条数（保持首次出现顺序），避免 warning 刷屏。 */
export function uniqueWarnings(warnings, max = 30) {
	const seen = new Set();
	const output = [];
	for (const warning of warnings) {
		const text = String(warning);
		if (seen.has(text)) continue;
		seen.add(text);
		output.push(text);
		if (output.length >= max) break;
	}
	return output;
}

/** 解析相对 rels 基目录的 Target，得到 zip 内条目路径；越界返回 null。 */
export function resolveEntryPath(baseDir, target) {
	const raw = String(target ?? '').replace(/\\/g, '/');
	let decoded = raw;
	try {
		decoded = decodeURIComponent(raw);
	} catch {
		decoded = raw;
	}
	if (decoded.startsWith('/')) return posix.normalize(decoded.replace(/^\/+/, ''));
	const joined = posix.normalize(posix.join(baseDir, decoded));
	if (joined.startsWith('..')) return null;
	return joined;
}

/** 把 zip 条目路径转换成相对 displayBase 的展示路径（如 media/image1.png）。 */
export function displayPathFor(entryPath, displayBase) {
	if (!entryPath) return '';
	const prefix = displayBase.endsWith('/') ? displayBase : `${displayBase}/`;
	return entryPath.startsWith(prefix) ? entryPath.slice(prefix.length) : entryPath;
}

/**
 * 读取 OOXML 的 _rels/*.rels 文件，返回 rId -> { entry, display, target, external }。
 * @param {{ readText(name: string): string | null }} zip
 * @param {string} relsPath zip 内 rels 文件路径
 * @param {{ baseDir: string, displayBase: string, warnings?: string[] }} options
 *   baseDir：Target 相对哪个目录；displayBase：展示路径相对哪个目录
 * @returns {Map<string, { entry: string | null, display: string, target: string, external: boolean }>}
 */
export function readRelationships(zip, relsPath, { baseDir, displayBase, warnings }) {
	const relationships = new Map();
	const xmlText = zip.readText(relsPath);
	if (!xmlText) return relationships;
	const root = parseXml(xmlText);
	if (!root) {
		warnings?.push(`关系文件解析失败：${relsPath}`);
		return relationships;
	}
	walkElements(root, (node) => {
		const local = node.name.includes(':') ? node.name.slice(node.name.lastIndexOf(':') + 1) : node.name;
		if (local !== 'Relationship') return false;
		const id = node.attrs.Id ?? node.attrs.id;
		if (!id) return false;
		const target = node.attrs.Target ?? node.attrs.target ?? '';
		const external = (node.attrs.TargetMode ?? '') === 'External';
		const entry = external ? null : resolveEntryPath(baseDir, target);
		relationships.set(id, {
			entry,
			display: external ? target : displayPathFor(entry, displayBase),
			target,
			external,
		});
		return false;
	});
	return relationships;
}
