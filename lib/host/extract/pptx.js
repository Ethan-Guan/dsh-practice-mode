/**
 * PPTX（OOXML）文本抽取。
 *
 * 按 ppt/slides/slideN.xml 的数字顺序逐页输出文本；页与页之间用
 * "\n\n[第N页]\n" 分隔。文本包含占位符（a:t）、换行（a:br）、
 * 表格（a:tbl）以及图片占位 `[[图:media/xxx.png]]`；图片二进制通过
 * 每页的 ppt/slides/_rels/slideN.xml.rels 定位。仅依赖 Node 内置模块。
 */

import { readZip } from './zip.js';
import { childElements, childrenNamed, parseXml, textContent, walkElements } from './xml.js';
import { guessMediaType, imagePlaceholder } from './media.js';
import { messageOf, readRelationships, uniqueWarnings } from './util.js';

/** 把一次图片引用变成占位符；同一张图片的二进制只收集一次。 */
function emitImage(relId, out, ctx) {
	const rel = ctx.rels.get(relId);
	if (!rel) {
		out.push(imagePlaceholder('未知图片'));
		ctx.warnings.push('幻灯片中存在无法解析的图片引用');
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

/** 收集 p:pic 子树里的图片引用（a:blip r:embed / r:link）。 */
function collectPictureImages(picture, out, ctx) {
	const relIds = [];
	walkElements(picture, (element) => {
		if (element.name === 'a:blip') {
			const id = element.attrs['r:embed'] || element.attrs['r:link'];
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

/** 段落内联文本（a:t / a:br / a:tab / a:blip）。 */
function collectInline(node, out, ctx) {
	for (const child of node.children) {
		if (typeof child === 'string') continue;
		const name = child.name;
		if (name === 'a:t') {
			out.push(textContent(child));
			continue;
		}
		if (name === 'a:br') {
			out.push('\n');
			continue;
		}
		if (name === 'a:tab') {
			out.push('\t');
			continue;
		}
		if (name === 'a:blip') {
			const id = child.attrs['r:embed'] || child.attrs['r:link'];
			if (id) emitImage(id, out, ctx);
			continue;
		}
		collectInline(child, out, ctx);
	}
}

/** 抽取一个段落的纯文本。 */
function extractParagraph(node, ctx) {
	const parts = [];
	collectInline(node, parts, ctx);
	return parts
		.join('')
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

/** 抽取表格单元格文本。 */
function extractCell(cell, ctx) {
	const paragraphs = [];
	const visit = (node) => {
		for (const child of childElements(node)) {
			if (child.name === 'a:p') {
				const text = extractParagraph(child, ctx);
				if (text) paragraphs.push(text);
			} else if (child.name === 'a:tbl') {
				paragraphs.push(...extractTable(child, ctx));
			} else if (
				child.name === 'a:tcPr' ||
				child.name === 'a:trPr' ||
				child.name === 'a:tblPr' ||
				child.name === 'a:tblGrid'
			) {
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
	for (const row of childrenNamed(table, 'a:tr')) {
		const cells = childrenNamed(row, 'a:tc').map((cell) => extractCell(cell, ctx));
		const line = cells.filter((cell) => cell !== '').join(' | ');
		if (line) lines.push(line);
	}
	return lines;
}

/** 按幻灯片形状顺序收集文本块。 */
function collectBlocks(node, output, ctx) {
	for (const child of childElements(node)) {
		if (child.name === 'a:p') {
			const text = extractParagraph(child, ctx);
			if (text) output.push(text);
		} else if (child.name === 'a:tbl') {
			output.push(...extractTable(child, ctx));
		} else if (child.name === 'p:pic') {
			const parts = [];
			collectPictureImages(child, parts, ctx);
			if (parts.length) output.push(parts.join(''));
		} else {
			collectBlocks(child, output, ctx);
		}
	}
}

/** 找出 ppt/slides/slideN.xml 并按 N 排序。 */
function listSlides(zip) {
	const slides = [];
	for (const name of zip.names()) {
		const match = /^ppt\/slides\/slide(\d+)\.xml$/i.exec(name);
		if (match) slides.push({ name, number: Number(match[1]) });
	}
	slides.sort((a, b) => a.number - b.number || a.name.localeCompare(b.name));
	return slides;
}

/**
 * 抽取 pptx。
 * @param {string} absPath
 * @returns {Promise<{ text: string, warnings: string[], images: Array<{name:string,data:Buffer,mediaType:string}> }>}
 */
export async function extractPptx(absPath) {
	const warnings = [];
	const images = [];
	let zip;
	try {
		zip = await readZip(absPath);
	} catch (error) {
		return { text: '', warnings: [`无法读取 pptx 文件：${messageOf(error)}`], images: [] };
	}

	const slides = listSlides(zip);
	if (slides.length === 0) {
		return { text: '', warnings: ['pptx 中未找到幻灯片（ppt/slides/slideN.xml）'], images: [] };
	}

	const baseCtx = { zip, warnings, images, imageKeys: new Set() };
	const slideTexts = [];
	const slidesPrefix = 'ppt/slides/';
	for (const slide of slides) {
		const relsPath = `${slidesPrefix}_rels/${slide.name.slice(slidesPrefix.length)}.rels`;
		const rels = readRelationships(zip, relsPath, {
			baseDir: 'ppt/slides',
			displayBase: 'ppt',
			warnings,
		});
		const xmlText = zip.readText(slide.name);
		if (!xmlText) {
			slideTexts.push('');
			continue;
		}
		const root = parseXml(xmlText);
		if (!root) {
			warnings.push(`幻灯片解析失败：${slide.name}`);
			slideTexts.push('');
			continue;
		}
		const blocks = [];
		collectBlocks(root, blocks, { ...baseCtx, rels });
		slideTexts.push(blocks.join('\n').replace(/\n{3,}/g, '\n\n').trim());
	}

	const text = slideTexts
		.map((slideText, index) => (slideText ? `[第${index + 1}页]\n${slideText}` : `[第${index + 1}页]`))
		.join('\n\n')
		.trim();

	return { text, warnings: uniqueWarnings(warnings), images };
}
