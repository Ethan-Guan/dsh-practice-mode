/**
 * DOCX（OOXML）文本抽取。
 *
 * 读取 word/document.xml，按文档流顺序输出段落与表格单元格文本，
 * 并把图片以 `[[图:media/xxx.png]]` 占位符插入到出现位置；同时通过
 * word/_rels/document.xml.rels 找到图片二进制，按扩展名推断 mediaType
 * 放进 images 返回。仅依赖 Node 内置模块。
 */

import { readZip } from './zip.js';
import { childElements, childrenNamed, findFirst, parseXml, textContent, walkElements } from './xml.js';
import { guessMediaType, imagePlaceholder } from './media.js';
import { messageOf, readRelationships, uniqueWarnings } from './util.js';

/** 把一次图片引用变成占位符；图片二进制只收集一次。 */
function emitImage(relId, out, ctx) {
	const rel = ctx.rels.get(relId);
	if (!rel) {
		out.push(imagePlaceholder('未知图片'));
		ctx.warnings.push('文档中存在无法解析的图片引用');
		return;
	}
	if (rel.external || !rel.entry) {
		out.push(imagePlaceholder(rel.display || rel.target || '外部图片'));
		return;
	}
	out.push(imagePlaceholder(rel.display));
	if (ctx.imageKeys.has(rel.entry)) return;
	ctx.imageKeys.add(rel.entry);

	const mediaType = guessMediaType(rel.entry);
	if (!mediaType) {
		ctx.warnings.push(`已跳过不支持的图片格式：${rel.display}`);
		return;
	}
	let data = null;
	try {
		data = ctx.zip.read(rel.entry);
	} catch (error) {
		ctx.warnings.push(`读取图片失败：${rel.display}（${messageOf(error)}）`);
		return;
	}
	if (!data) {
		ctx.warnings.push(`图片数据缺失：${rel.display}`);
		return;
	}
	ctx.images.push({ name: rel.display, data, mediaType });
}

/** 在一个 w:drawing / w:pict / w:object 子树里找出图片引用并输出占位符。 */
function collectDrawingImages(node, out, ctx) {
	const relIds = [];
	walkElements(node, (element) => {
		if (element.name === 'a:blip') {
			const id = element.attrs['r:embed'] || element.attrs['r:link'];
			if (id) relIds.push(id);
		} else if (element.name === 'v:imagedata') {
			const id = element.attrs['r:id'] || element.attrs['o:relid'];
			if (id) relIds.push(id);
		} else if (element.name === 'a14:imgLayer' || element.name === 'asvg:svgBlip') {
			const id = element.attrs['r:embed'];
			if (id) relIds.push(id);
		}
		return false;
	});
	const seen = new Set();
	for (const relId of relIds) {
		if (seen.has(relId)) continue;
		seen.add(relId);
		emitImage(relId, out, ctx);
	}
}

/** 段落内联内容（文本 run、换行、制表符、图片）按顺序收集。 */
function collectInline(node, out, ctx) {
	for (const child of node.children) {
		if (typeof child === 'string') continue;
		const name = child.name;
		if (name === 'w:t') {
			out.push(textContent(child));
			continue;
		}
		if (name === 'w:tab') {
			out.push('\t');
			continue;
		}
		if (name === 'w:br' || name === 'w:cr') {
			out.push('\n');
			continue;
		}
		if (name === 'w:noBreakHyphen') {
			out.push('-');
			continue;
		}
		if (name === 'w:softHyphen' || name === 'w:delText' || name === 'w:instrText') continue;
		if (name === 'w:drawing' || name === 'w:pict' || name === 'w:object') {
			collectDrawingImages(child, out, ctx);
			continue;
		}
		collectInline(child, out, ctx);
	}
}

/** 抽取一个段落的纯文本。 */
function extractParagraph(node, ctx) {
	const parts = [];
	collectInline(node, parts, ctx);
	let text = parts.join('');
	text = text.replace(/[ \t]+\n/g, '\n');
	// AlternateContent 的 Choice/Fallback 可能重复引用同一张图，做一次去重。
	text = text.replace(/(\[\[图:[^\]]+\]\])(?:\s*\1)+/g, '$1');
	text = text.replace(/\n{3,}/g, '\n\n');
	return text.trim();
}

/** 表格单元格文本（可能包含多段/嵌套表格）。 */
function extractCell(cell, ctx) {
	const paragraphs = [];
	const visit = (node) => {
		for (const child of childElements(node)) {
			if (child.name === 'w:p') {
				const text = extractParagraph(child, ctx);
				if (text) paragraphs.push(text);
			} else if (child.name === 'w:tbl') {
				paragraphs.push(...extractTable(child, ctx));
			} else if (child.name === 'w:tcPr' || child.name === 'w:trPr') {
				continue;
			} else {
				visit(child);
			}
		}
	};
	visit(cell);
	return paragraphs.join(' ');
}

/** 表格 -> 每行一条文本（单元格用 " | " 连接）。 */
function extractTable(table, ctx) {
	const lines = [];
	for (const row of childrenNamed(table, 'w:tr')) {
		const cells = childrenNamed(row, 'w:tc').map((cell) => extractCell(cell, ctx));
		const line = cells.filter((cell) => cell !== '').join(' | ');
		if (line) lines.push(line);
	}
	return lines;
}

/** 按文档流顺序收集块级文本（w:p / w:tbl）。 */
function collectBlocks(node, output, ctx) {
	for (const child of childElements(node)) {
		if (child.name === 'w:p') {
			const text = extractParagraph(child, ctx);
			if (text) output.push(text);
		} else if (child.name === 'w:tbl') {
			output.push(...extractTable(child, ctx));
		} else {
			collectBlocks(child, output, ctx);
		}
	}
}

/**
 * 抽取 docx。
 * @param {string} absPath
 * @returns {Promise<{ text: string, warnings: string[], images: Array<{name:string,data:Buffer,mediaType:string}> }>}
 */
export async function extractDocx(absPath) {
	const warnings = [];
	const images = [];
	let zip;
	try {
		zip = await readZip(absPath);
	} catch (error) {
		return { text: '', warnings: [`无法读取 docx 文件：${messageOf(error)}`], images: [] };
	}

	const documentXml = zip.readText('word/document.xml');
	if (!documentXml) {
		return { text: '', warnings: ['docx 中未找到 word/document.xml（可能是旧版 .doc 或已损坏）'], images: [] };
	}
	const root = parseXml(documentXml);
	if (!root) {
		return { text: '', warnings: ['docx 的 word/document.xml 解析失败'], images: [] };
	}

	const ctx = {
		zip,
		warnings,
		images,
		rels: readRelationships(zip, 'word/_rels/document.xml.rels', {
			baseDir: 'word',
			displayBase: 'word',
			warnings,
		}),
		imageKeys: new Set(),
	};

	const body = findFirst(root, 'w:body') ?? root;
	const blocks = [];
	collectBlocks(body, blocks, ctx);
	const text = blocks.join('\n').replace(/\n{3,}/g, '\n\n').trim();

	return { text, warnings: uniqueWarnings(warnings), images };
}
