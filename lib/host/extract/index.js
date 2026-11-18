/**
 * 文档抽取入口（Host 使用）。
 *
 * 纯 Node 内置模块实现，不依赖任何第三方包；所有失败都收敛为
 * { text: '', warnings: [...] }，不向调用方抛错，便于上传接口容错。
 *
 * 对外接口（对应 docs/CONTRACT.md 5.8）：
 *   DOC_EXTS
 *   isSupportedDocExt(ext)
 *   extractDocument({ absPath, ext, maxChars = 400000 })
 *     -> { text, warnings, images: [{ name, data: Buffer, mediaType }] }
 */

import { stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { extractDocx } from './docx.js';
import { extractPdf } from './pdf.js';
import { extractPptx } from './pptx.js';
import { extractPlainDocument } from './text.js';
import { uniqueWarnings } from './util.js';

/** 支持的课程文档扩展名（小写、含点）。 */
export const DOC_EXTS = Object.freeze([
	'.txt',
	'.md',
	'.markdown',
	'.csv',
	'.json',
	'.html',
	'.htm',
	'.docx',
	'.pptx',
	'.pdf',
]);

const DEFAULT_MAX_CHARS = 400_000;

/** 归一化扩展名：允许 'pdf' 或 '.PDF'，统一成 '.pdf'。 */
function normalizeExt(ext) {
	if (typeof ext !== 'string') return '';
	const trimmed = ext.trim().toLowerCase();
	if (!trimmed) return '';
	return trimmed.startsWith('.') ? trimmed : `.${trimmed}`;
}

/**
 * 是否为支持的课程文档扩展名。
 * @param {string} ext 例如 '.pdf' / 'pdf'
 * @returns {boolean}
 */
export function isSupportedDocExt(ext) {
	return DOC_EXTS.includes(normalizeExt(ext));
}

/** 生成文本超限 warning。 */
function truncationWarning(limit) {
	return `文本超过 ${limit} 字上限，已截断`;
}

/**
 * 抽取文档文本。
 * @param {{ absPath: string, ext?: string, maxChars?: number }} options
 * @returns {Promise<{ text: string, warnings: string[], images: Array<{name:string,data:Buffer,mediaType:string}> }>}
 */
export async function extractDocument(options = {}) {
	if (!options || typeof options !== 'object') {
		return { text: '', warnings: ['缺少文档路径，无法抽取文本'], images: [] };
	}
	const { absPath } = options;
	const warnings = [];
	const fallback = (message) => ({ text: '', warnings: [message], images: [] });

	if (typeof absPath !== 'string' || !absPath.trim()) {
		return fallback('缺少文档路径，无法抽取文本');
	}

	const ext = normalizeExt(options.ext) || normalizeExt(extname(absPath));
	if (!ext) return fallback('无法识别文档类型');
	if (!isSupportedDocExt(ext)) {
		return fallback(`不支持的文档类型：${options.ext || ext}（支持 ${DOC_EXTS.join('、')}）`);
	}

	try {
		const info = await stat(absPath);
		if (!info.isFile()) return fallback(`不是有效的文件：${absPath}`);
	} catch (error) {
		return fallback(`无法读取文件：${error instanceof Error ? error.message : String(error)}`);
	}

	let result;
	try {
		switch (ext) {
			case '.docx':
				result = await extractDocx(absPath);
				break;
			case '.pptx':
				result = await extractPptx(absPath);
				break;
			case '.pdf':
				result = await extractPdf(absPath);
				break;
			case '.txt':
			case '.md':
			case '.markdown':
			case '.csv':
			case '.json':
			case '.html':
			case '.htm':
				result = await extractPlainDocument(absPath, ext);
				break;
			default:
				return fallback(`不支持的文档类型：${ext}`);
		}
	} catch (error) {
		return fallback(`文档解析失败：${error instanceof Error ? error.message : String(error)}`);
	}

	let text = typeof result?.text === 'string' ? result.text : '';
	const resultWarnings = Array.isArray(result?.warnings) ? result.warnings.filter(Boolean) : [];
	warnings.push(...resultWarnings);
	const images = Array.isArray(result?.images) ? result.images : [];

	const requestedMax = Number(options.maxChars);
	const limit =
		Number.isFinite(requestedMax) && requestedMax >= 0 ? Math.floor(requestedMax) : DEFAULT_MAX_CHARS;
	if (text.length > limit) {
		text = text.slice(0, limit);
		warnings.push(truncationWarning(limit));
	}

	return { text, warnings: uniqueWarnings(warnings), images };
}
