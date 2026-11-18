/**
 * 纯文本类文档抽取：txt / md / markdown / csv / json / html / htm。
 *
 * 编码策略：优先 UTF-8（严格校验），失败时尝试 GBK，最后按 UTF-8 宽松解码
 * 并给出 warning。HTML 去 script/style 后去标签、解实体；JSON 会格式化输出。
 */

import { readFile } from 'node:fs/promises';
import { decodeXmlEntities } from './xml.js';

/** 手动解码 UTF-32BE（TextDecoder 不支持该编码）。 */
function decodeUtf32BE(buffer) {
	let text = '';
	for (let index = 0; index + 3 < buffer.length; index += 4) {
		const code = ((buffer[index] << 24) | (buffer[index + 1] << 16) | (buffer[index + 2] << 8) | buffer[index + 3]) >>> 0;
		if (code <= 0x10ffff) text += String.fromCodePoint(code);
	}
	return text;
}

/** 带 BOM / 编码探测的文本解码。 */
function decodeTextBuffer(buffer) {
	if (buffer.length >= 4 && buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0xfe && buffer[3] === 0xff) {
		// WHATWG TextDecoder 不支持 utf-32，手动解码 UTF-32BE（罕见但需要不抛错）
		return { text: decodeUtf32BE(buffer.subarray(4)), warning: null };
	}
	if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
		return { text: new TextDecoder('utf-16le').decode(buffer), warning: null };
	}
	if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
		return { text: new TextDecoder('utf-16be').decode(buffer), warning: null };
	}

	const withoutBom = buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf
		? buffer.subarray(3)
		: buffer;
	try {
		const text = new TextDecoder('utf-8', { fatal: true }).decode(withoutBom);
		return { text, warning: null };
	} catch {
		// 非 UTF-8：尝试 GBK（Node 携带 full-icu 时可用）
		try {
			const text = new TextDecoder('gbk', { fatal: true }).decode(withoutBom);
			return { text, warning: '文件不是 UTF-8 编码，已按 GBK 解码' };
		} catch {
			return {
				text: new TextDecoder('utf-8').decode(withoutBom),
				warning: '文件编码无法识别，已按 UTF-8 解码（可能出现乱码）',
			};
		}
	}
}

/** 归一化换行符。 */
function normalizeNewlines(text) {
	return text.replace(/\r\n?/g, '\n');
}

/** HTML -> 纯文本：去 script/style/head，块级标签转换行，去剩余标签并解实体。 */
export function htmlToText(html) {
	let output = normalizeNewlines(String(html));
	output = output.replace(/<!--[\s\S]*?-->/g, ' ');
	output = output.replace(
		/<(script|style|head|noscript|template|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
		' ',
	);
	output = output.replace(/<br\s*\/?>/gi, '\n');
	output = output.replace(
		/<\/(p|div|section|article|li|tr|h[1-6]|blockquote|pre|table|ul|ol|dl|dt|dd|header|footer|main|nav|figure|figcaption|address)\s*>/gi,
		'\n',
	);
	output = output.replace(/<[^>]*>/g, '');
	output = decodeXmlEntities(output);
	output = output
		.replace(/[ \t\f\v\u00a0]+/g, ' ')
		.replace(/ *\n */g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
	return output;
}

/** 把 CSV 行保留为文本（仅做换行归一化；分隔符原样保留便于检索）。 */
function csvToText(text) {
	return normalizeNewlines(text).replace(/\u0000/g, '').trim();
}

/** JSON 格式化输出；解析失败时回退原文并 warning。 */
function jsonToText(text) {
	try {
		const value = JSON.parse(text);
		return { text: JSON.stringify(value, null, 2), warning: null };
	} catch {
		return { text: normalizeNewlines(text).trim(), warning: 'JSON 解析失败，已按原文输出' };
	}
}

/**
 * 抽取纯文本类文档。
 * @param {string} absPath
 * @param {string} ext 小写扩展名（含点），如 '.md'
 * @returns {Promise<{ text: string, warnings: string[], images: Array<never> }>}
 */
export async function extractPlainDocument(absPath, ext) {
	const warnings = [];
	let buffer;
	try {
		buffer = await readFile(absPath);
	} catch (error) {
		return {
			text: '',
			warnings: [`无法读取文件：${error instanceof Error ? error.message : String(error)}`],
			images: [],
		};
	}

	const { text: decoded, warning } = decodeTextBuffer(buffer);
	if (warning) warnings.push(warning);
	const lowerExt = String(ext ?? '').toLowerCase();

	let text;
	if (lowerExt === '.html' || lowerExt === '.htm') {
		text = htmlToText(decoded);
	} else if (lowerExt === '.json') {
		const result = jsonToText(normalizeNewlines(decoded));
		text = result.text;
		if (result.warning) warnings.push(result.warning);
	} else if (lowerExt === '.csv') {
		text = csvToText(decoded);
	} else {
		// .txt / .md / .markdown：保留结构，仅统一换行
		text = normalizeNewlines(decoded).trim();
	}

	return { text, warnings, images: [] };
}
