/**
 * 最小 PDF 文本抽取（仅依赖 Node 内置模块）。
 *
 * 能力范围（尽力而为）：
 * - classic xref table、xref stream、混合型 /XRefStm、/Prev 链；
 * - 对象流（/Type /ObjStm 内嵌对象）；
 * - FlateDecode（含 PNG predictor）、ASCIIHexDecode、ASCII85Decode（见 pdf-core.js）；
 * - 页面树遍历、/Contents 内容流拼接；
 * - 文本算子 BT/ET、Tf、Tj、TJ、'、"、Td/TD/Tm/T* 与文本矩阵坐标排序；
 * - 字体 /ToUnicode CMap（bfchar/bfrange/codespacerange）解码。
 *
 * 任何解析失败都不抛错：返回 { text: '', warnings: [...] }；单页失败只影响该页。
 */

import { readFile } from 'node:fs/promises';
import { uniqueWarnings } from './util.js';
import {
	PdfDict,
	PdfName,
	PdfRef,
	PdfString,
	applyPredictor,
	ascii85Decode,
	asciiHexDecode,
	bytesToInt,
	decodeStream,
	decodedStreamOf,
	directName,
	hexToBytes,
	isDelimiter,
	isValueStart,
	isWhitespaceCode,
	numberValue,
	parseIndirectObject,
	parseValue,
	resolveDict,
	resolveValue,
	skipWhitespaceAndComments,
} from './pdf-core.js';

// ---------------------------------------------------------------------------
// xref
// ---------------------------------------------------------------------------

function readXrefTable(source, offset) {
	let pos = skipWhitespaceAndComments(source, offset);
	if (!source.startsWith('xref', pos)) return null;
	pos += 4;
	const entries = new Map();
	let trailer = null;
	let guard = 0;
	while (pos < source.length) {
		pos = skipWhitespaceAndComments(source, pos);
		if (source.startsWith('trailer', pos)) {
			const trailerResult = parseValue(source, pos + 7);
			if (trailerResult.value instanceof PdfDict) trailer = trailerResult.value;
			break;
		}
		const section = /^(\d+)\s+(\d+)/.exec(source.slice(pos, pos + 40));
		if (!section) break;
		const startNumber = Number(section[1]);
		const count = Number(section[2]);
		pos += section[0].length;
		for (let index = 0; index < count; index++) {
			pos = skipWhitespaceAndComments(source, pos);
			const line = /^(\d+)\s+(\d+)\s+([nf])/.exec(source.slice(pos, pos + 40));
			if (!line) return { entries, trailer };
			pos += line[0].length;
			if (line[3] === 'n') entries.set(startNumber + index, { type: 1, offset: Number(line[1]) });
		}
		if (++guard > 100_000) break;
	}
	return { entries, trailer };
}

function readXrefStreamSection(source, offset, objects) {
	const object = parseIndirectObject(source, offset);
	if (!object) return null;
	objects.set(object.num, object);
	const dict = object.value;
	if (!(dict instanceof PdfDict)) return null;
	const data = decodeStream(objects, dict, object.stream);
	if (!data) return null;

	const widthsValue = resolveValue(objects, dict.get('W'));
	if (!Array.isArray(widthsValue)) return null;
	const widths = widthsValue.map((item) => {
		const resolved = resolveValue(objects, item);
		return typeof resolved === 'number' ? resolved : 0;
	});
	if (widths.length < 3 || widths.some((width) => width < 0 || width > 8)) return null;
	const entryLength = widths[0] + widths[1] + widths[2];
	if (entryLength <= 0) return null;

	const size = numberValue(objects, dict.get('Size'), 0);
	const indexValue = resolveValue(objects, dict.get('Index'));
	let indexPairs;
	if (Array.isArray(indexValue) && indexValue.length >= 2) {
		const numbers = indexValue.map((item) => {
			const resolved = resolveValue(objects, item);
			return typeof resolved === 'number' ? resolved : 0;
		});
		indexPairs = [];
		for (let index = 0; index + 1 < numbers.length; index += 2) indexPairs.push([numbers[index], numbers[index + 1]]);
	} else {
		indexPairs = [[0, size]];
	}

	const entries = new Map();
	let cursor = 0;
	const readField = (width) => {
		let value = 0;
		for (let index = 0; index < width; index++) value = value * 256 + data[cursor + index];
		cursor += width;
		return value;
	};
	for (const [startNumber, count] of indexPairs) {
		for (let index = 0; index < count; index++) {
			if (cursor + entryLength > data.length) return { entries, trailer: dict };
			const type = widths[0] === 0 ? 1 : readField(widths[0]);
			const field2 = readField(widths[1]);
			const field3 = readField(widths[2]);
			const num = startNumber + index;
			if (type === 1) entries.set(num, { type: 1, offset: field2 });
			else if (type === 2) entries.set(num, { type: 2, objstm: field2, index: field3 });
		}
	}
	return { entries, trailer: dict };
}

function readXrefChain(source, startOffset, objects) {
	const entries = new Map();
	const trailer = new PdfDict();
	let offset = startOffset;
	const visited = new Set();
	while (Number.isFinite(offset) && offset >= 0 && offset < source.length && !visited.has(offset)) {
		if (visited.size >= 64) break;
		visited.add(offset);
		const at = skipWhitespaceAndComments(source, offset);
		const section = source.startsWith('xref', at)
			? readXrefTable(source, at)
			: readXrefStreamSection(source, at, objects);
		if (!section) break;
		for (const [num, entry] of section.entries) {
			if (!entries.has(num)) entries.set(num, entry);
		}
		const sectionTrailer = section.trailer instanceof PdfDict ? section.trailer : null;
		if (!sectionTrailer) break;
		for (const [key, value] of sectionTrailer.entries()) {
			if (!trailer.has(key)) trailer.set(key, value);
		}
		// 混合型 xref：/XRefStm 指向补充的交叉引用流
		const xrefStreamOffset = numberValue(objects, sectionTrailer.get('XRefStm'), undefined);
		if (xrefStreamOffset !== undefined) {
			const extra = readXrefStreamSection(source, xrefStreamOffset, objects);
			if (extra) {
				for (const [num, entry] of extra.entries) if (!entries.has(num)) entries.set(num, entry);
				if (extra.trailer instanceof PdfDict) {
					for (const [key, value] of extra.trailer.entries()) if (!trailer.has(key)) trailer.set(key, value);
				}
			}
		}
		offset = numberValue(objects, sectionTrailer.get('Prev'), undefined);
	}
	return { entries, trailer };
}

// ---------------------------------------------------------------------------
// 对象装载
// ---------------------------------------------------------------------------

function loadObjectStream(objects, dict, stream) {
	const data = decodeStream(objects, dict, stream);
	if (!data) return null;
	const text = data.toString('latin1');
	const count = numberValue(objects, dict.get('N'), 0);
	const first = numberValue(objects, dict.get('First'), 0);
	if (!count || first <= 0 || first > text.length) return null;
	const header = text.slice(0, first);
	const pairs = [];
	const regex = /(\d+)\s+(\d+)/g;
	let match;
	while ((match = regex.exec(header)) !== null && pairs.length < count) {
		pairs.push([Number(match[1]), Number(match[2])]);
	}
	if (pairs.length !== count) return null;
	const result = new Map();
	for (const [num, relativeOffset] of pairs) {
		try {
			const parsed = parseValue(text, first + relativeOffset);
			result.set(num, { num, value: parsed.value });
		} catch {
			// 单个内嵌对象失败不影响其他对象
		}
	}
	return result;
}

function loadObjectsFromEntries(source, entries, objects) {
	for (const [num, entry] of entries) {
		if (entry.type !== 1) continue;
		try {
			const object = parseIndirectObject(source, entry.offset);
			if (object && object.num === num) objects.set(num, object);
		} catch {
			// 忽略单个对象失败
		}
	}
	const objectStreamCache = new Map();
	for (const [num, entry] of entries) {
		if (entry.type !== 2) continue;
		let parsedStream = objectStreamCache.get(entry.objstm);
		if (parsedStream === undefined) {
			const streamObject = objects.get(entry.objstm);
			parsedStream =
				streamObject && streamObject.stream && streamObject.value instanceof PdfDict
					? loadObjectStream(objects, streamObject.value, streamObject.stream)
					: null;
			objectStreamCache.set(entry.objstm, parsedStream);
		}
		if (!parsedStream) continue;
		const object = parsedStream.get(num);
		if (object && !objects.has(num)) objects.set(num, object);
	}
}

/** 完全兜底：扫描所有 "N G obj"，解析 trailer 字典。 */
function scanObjectsFallback(source, objects) {
	const regex = /(\d+)\s+(\d+)\s+obj\b/g;
	let match;
	let guard = 0;
	while ((match = regex.exec(source)) !== null) {
		if (++guard > 200_000) break;
		const num = Number(match[1]);
		try {
			const object = parseIndirectObject(source, match.index);
			if (object && object.num === num && !objects.has(num)) objects.set(num, object);
			const next = object?.endPos ?? match.index + 1;
			if (next > regex.lastIndex) regex.lastIndex = next;
		} catch {
			// 忽略
		}
	}
	let trailer = null;
	let searchFrom = source.length;
	while (searchFrom > 0 && !trailer) {
		const index = source.lastIndexOf('trailer', searchFrom - 1);
		if (index < 0) break;
		const parsed = parseValue(source, index + 7);
		if (parsed.value instanceof PdfDict) trailer = parsed.value;
		searchFrom = index;
	}
	return trailer;
}

function findCatalog(objects) {
	for (const object of [...objects.values()].sort((a, b) => a.num - b.num)) {
		if (object.value instanceof PdfDict && directName(object.value.get('Type')) === 'Catalog') return object.value;
	}
	return null;
}

/** 解析 trailer 的 /Root，失败时在整个对象表里找 Catalog。 */
function findRoot(objects, trailer) {
	if (trailer instanceof PdfDict) {
		const root = resolveValue(objects, trailer.get('Root'));
		if (root instanceof PdfDict) return root;
	}
	return findCatalog(objects);
}

// ---------------------------------------------------------------------------
// 页面树 / 资源
// ---------------------------------------------------------------------------

function collectPages(objects, catalog) {
	const pages = [];
	const visited = new Set();
	const walk = (value, inheritedResources) => {
		if (value instanceof PdfRef) {
			if (visited.has(value.num)) return;
			visited.add(value.num);
		}
		const dict = resolveDict(objects, value);
		if (!dict) return;
		const type = directName(dict.get('Type'));
		const resources = dict.has('Resources') ? dict.get('Resources') : inheritedResources;
		if (type === 'Pages' || (type === null && dict.has('Kids'))) {
			const kids = resolveValue(objects, dict.get('Kids'));
			if (Array.isArray(kids)) {
				for (const kid of kids) walk(kid, resources);
			}
			return;
		}
		if (type === 'Page' || dict.has('Contents')) pages.push({ dict, resources });
	};
	walk(catalog.get('Pages'), undefined);
	if (pages.length === 0) {
		for (const object of [...objects.values()].sort((a, b) => a.num - b.num)) {
			const dict = object.value;
			if (dict instanceof PdfDict && directName(dict.get('Type')) === 'Page') {
				pages.push({ dict, resources: dict.get('Resources') });
			}
		}
	}
	return pages;
}

function pageContent(objects, page) {
	const contentsValue = page.dict.get('Contents');
	if (contentsValue === undefined) return null;
	const resolved = resolveValue(objects, contentsValue);
	const items = Array.isArray(resolved) ? resolved : [contentsValue];
	const chunks = [];
	for (const item of items) {
		const decoded = decodedStreamOf(objects, item);
		if (decoded) chunks.push(decoded);
	}
	if (chunks.length === 0) return null;
	const combined = [];
	for (let index = 0; index < chunks.length; index++) {
		if (index > 0) combined.push(Buffer.from('\n'));
		combined.push(chunks[index]);
	}
	return Buffer.concat(combined);
}

// ---------------------------------------------------------------------------
// 字体 / ToUnicode CMap
// ---------------------------------------------------------------------------

function hexToUtf16Units(hex) {
	const bytes = hexToBytes(hex);
	const units = [];
	for (let index = 0; index + 1 < bytes.length; index += 2) {
		units.push((bytes[index] << 8) | bytes[index + 1]);
	}
	return units;
}

function hexToUnicodeString(hex) {
	const units = hexToUtf16Units(hex);
	return units.length ? String.fromCharCode(...units) : '';
}

function parseCMap(data) {
	const text = data.toString('latin1');
	const map = new Map();
	const sourceLengths = new Set();
	const codespace = [];

	let section = /beginbfchar([\s\S]*?)endbfchar/g;
	let match;
	while ((match = section.exec(text)) !== null) {
		const body = match[1];
		const pairRegex = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g;
		let pair;
		while ((pair = pairRegex.exec(body)) !== null) {
			const sourceBytes = hexToBytes(pair[1]);
			const target = hexToUnicodeString(pair[2]);
			if (!sourceBytes.length || !target) continue;
			map.set(`${sourceBytes.length}:${bytesToInt(sourceBytes)}`, target);
			sourceLengths.add(sourceBytes.length);
		}
	}

	section = /beginbfrange([\s\S]*?)endbfrange/g;
	while ((match = section.exec(text)) !== null) {
		const body = match[1];
		const rangeRegex = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(?:<([0-9a-fA-F]+)>|\[([^\]]*)\])/g;
		let range;
		while ((range = rangeRegex.exec(body)) !== null) {
			const lowBytes = hexToBytes(range[1]);
			const highBytes = hexToBytes(range[2]);
			const length = lowBytes.length;
			if (!length) continue;
			const low = bytesToInt(lowBytes);
			const high = bytesToInt(highBytes);
			if (high < low || high - low > 0xffff) continue;
			if (range[3] !== undefined) {
				const startUnits = hexToUtf16Units(range[3]);
				if (!startUnits.length) continue;
				for (let code = low; code <= high; code++) {
					const units = startUnits.slice();
					const last = units.length - 1;
					units[last] += code - low;
					if (units[last] > 0xffff) continue;
					map.set(`${length}:${code}`, String.fromCharCode(...units));
					sourceLengths.add(length);
				}
			} else if (range[4] !== undefined) {
				const targets = [...range[4].matchAll(/<([0-9a-fA-F]+)>/g)].map((item) => hexToUnicodeString(item[1]));
				for (let index = 0; index < targets.length && low + index <= high; index++) {
					if (!targets[index]) continue;
					map.set(`${length}:${low + index}`, targets[index]);
					sourceLengths.add(length);
				}
			}
		}
	}

	section = /begincodespacerange([\s\S]*?)endcodespacerange/g;
	while ((match = section.exec(text)) !== null) {
		const pairRegex = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g;
		let pair;
		while ((pair = pairRegex.exec(match[1])) !== null) {
			const lowBytes = hexToBytes(pair[1]);
			const highBytes = hexToBytes(pair[2]);
			if (!lowBytes.length) continue;
			codespace.push({ length: lowBytes.length, low: bytesToInt(lowBytes), high: bytesToInt(highBytes) });
			sourceLengths.add(lowBytes.length);
		}
	}

	return { map, sourceLengths, codespace };
}

function decodeWithCMap(cmap, bytes) {
	const lengths = [...cmap.sourceLengths].sort((a, b) => a - b);
	if (lengths.length === 0) return bytes.toString('latin1');
	let output = '';
	let pos = 0;
	while (pos < bytes.length) {
		let matched = false;
		for (const length of lengths) {
			if (pos + length > bytes.length) continue;
			let code = 0;
			for (let index = 0; index < length; index++) code = code * 256 + bytes[pos + index];
			const target = cmap.map.get(`${length}:${code}`);
			if (target !== undefined) {
				output += target;
				pos += length;
				matched = true;
				break;
			}
		}
		if (!matched) {
			pos += lengths[0] ?? 1;
		}
	}
	return output;
}

function utf16beToString(bytes) {
	const units = [];
	for (let index = 0; index + 1 < bytes.length; index += 2) units.push((bytes[index] << 8) | bytes[index + 1]);
	return String.fromCharCode(...units);
}

/** 为一个字体创建字节 -> 文本解码函数。 */
function createFontDecoder(objects, fontDict) {
	const subtype = directName(fontDict.get('Subtype'));
	const encodingValue = resolveValue(objects, fontDict.get('Encoding'));
	let encodingName = directName(encodingValue);
	if (!encodingName && encodingValue instanceof PdfDict) {
		encodingName = directName(encodingValue.get('BaseEncoding'));
	}
	const isType0 = subtype === 'Type0';

	const toUnicodeRef = fontDict.get('ToUnicode');
	if (toUnicodeRef !== undefined) {
		const cmapData = decodedStreamOf(objects, toUnicodeRef);
		if (cmapData) {
			const cmap = parseCMap(cmapData);
			if (cmap.map.size > 0) return (bytes) => decodeWithCMap(cmap, bytes);
		}
	}
	if (isType0 && /UCS2|UTF16/i.test(encodingName ?? '')) {
		return (bytes) => utf16beToString(bytes);
	}
	if (isType0) {
		// 没有 ToUnicode 的 Identity-H 字体无法可靠还原 Unicode，返回空串避免乱码。
		return () => '';
	}
	return (bytes) => bytes.toString('latin1');
}

function buildFontDecoders(objects, resourcesValue) {
	const decoders = new Map();
	const resources = resolveDict(objects, resourcesValue);
	if (!resources) return decoders;
	const fontDict = resolveDict(objects, resources.get('Font'));
	if (!fontDict) return decoders;
	for (const [fontName, fontRef] of fontDict.entries()) {
		try {
			const font = resolveDict(objects, fontRef);
			if (!font) continue;
			decoders.set(fontName, createFontDecoder(objects, font));
		} catch {
			// 单个字体失败不影响整页
		}
	}
	return decoders;
}

// ---------------------------------------------------------------------------
// 内容流文本抽取
// ---------------------------------------------------------------------------

function findInlineImageEnd(source, start) {
	const regex = /\sEI(?=[\s]|$)/g;
	regex.lastIndex = start;
	const match = regex.exec(source);
	return match ? match.index + 3 : source.length;
}

/** 估算一段文本的显示宽度（用于同一行片段的 x 排序与空格补全）。 */
function estimateTextWidth(text, fontSize) {
	let width = 0;
	for (const char of text) {
		const code = char.codePointAt(0) ?? 0;
		if (code >= 0x2e80) width += fontSize; // CJK / 全角字符
		else if (char === ' ') width += fontSize * 0.28;
		else width += fontSize * 0.5;
	}
	return width;
}

/** 把带坐标的文本片段按「从上到下、从左到右」还原成文本行。 */
function assembleFragments(fragments) {
	if (fragments.length === 0) return '';
	const sorted = [...fragments].sort((a, b) => b.y - a.y || a.x - b.x);
	const lines = [];
	for (const fragment of sorted) {
		const tolerance = Math.max(2, (fragment.size || 10) * 0.35);
		const lastLine = lines[lines.length - 1];
		if (lastLine && Math.abs(lastLine.y - fragment.y) <= Math.max(tolerance, lastLine.tolerance)) {
			lastLine.fragments.push(fragment);
			lastLine.tolerance = Math.max(lastLine.tolerance, tolerance);
		} else {
			lines.push({ y: fragment.y, tolerance, fragments: [fragment] });
		}
	}
	const lineTexts = [];
	for (const line of lines) {
		const parts = line.fragments.sort((a, b) => a.x - b.x);
		let text = '';
		let endX = null;
		for (const part of parts) {
			if (endX !== null) {
				const gap = part.x - endX;
				const noSpaceBefore = /^[\s,.;:!?，。；：！？、）】》]/.test(part.text);
				if (gap > Math.max(2, (part.size || 10) * 0.3) && !/\s$/.test(text) && !noSpaceBefore) text += ' ';
			}
			text += part.text;
			endX = part.x + estimateTextWidth(part.text, part.size || 10);
		}
		const lineText = text.trim();
		if (lineText) lineTexts.push(lineText);
	}
	return lineTexts.join('\n');
}

/**
 * 从内容流中抽取文本。
 *
 * PDF 内容流里的绘制顺序不一定等于阅读顺序（同一行的字符可能按字体 run
 * 分段输出），因此这里记录每个文本片段的文本矩阵坐标，最后按坐标排序还原
 * 阅读顺序。返回未清理的原始文本，由调用方统一规范化。
 */
function extractTextFromContent(content, fontDecoders) {
	const source = content.toString('latin1');
	let pos = 0;
	const fragments = [];
	let currentFont = null;
	let currentSize = 10;
	let leading = 0;
	let textX = 0;
	let textY = 0;
	let lineX = 0;
	let lineY = 0;
	const operandStack = [];
	const last = () => operandStack[operandStack.length - 1];
	const numberOf = (index) => {
		const value = operandStack[index];
		return typeof value === 'number' && Number.isFinite(value) ? value : 0;
	};

	const showString = (pdfString) => {
		if (!(pdfString instanceof PdfString)) return;
		let decoded;
		if (currentFont) {
			try {
				decoded = currentFont(pdfString.bytes);
			} catch {
				decoded = pdfString.bytes.toString('latin1');
			}
		} else {
			decoded = pdfString.bytes.toString('latin1');
		}
		if (!decoded) return;
		fragments.push({ x: textX, y: textY, size: currentSize, text: decoded });
		textX += estimateTextWidth(decoded, currentSize);
	};

	while (pos < source.length) {
		pos = skipWhitespaceAndComments(source, pos);
		if (pos >= source.length) break;
		const char = source[pos];

		// 内联图片（BI ... ID ... EI）里是二进制，不参与文本抽取
		if (char === 'B' && source.startsWith('BI', pos)) {
			const boundary = source[pos + 2] ?? ' ';
			if (isWhitespaceCode(boundary.charCodeAt(0)) || isDelimiter(boundary)) {
				const idIndex = source.indexOf('ID', pos + 2);
				if (idIndex < 0) break;
				pos = findInlineImageEnd(source, idIndex + 2);
				operandStack.length = 0;
				continue;
			}
		}

		if (isValueStart(char)) {
			const valueResult = parseValue(source, pos);
			if (!valueResult || valueResult.pos <= pos) {
				pos++;
				continue;
			}
			pos = valueResult.pos;
			operandStack.push(valueResult.value);
			if (operandStack.length > 64) operandStack.shift();
			continue;
		}

		let end = pos;
		while (end < source.length && !isWhitespaceCode(source.charCodeAt(end)) && !isDelimiter(source[end])) end++;
		if (end === pos) {
			pos++;
			continue;
		}
		const operator = source.slice(pos, end);
		pos = end;

		switch (operator) {
			case 'BT':
				textX = 0;
				textY = 0;
				lineX = 0;
				lineY = 0;
				break;
			case 'Tf': {
				const fontName = operandStack[operandStack.length - 2];
				currentFont = fontName instanceof PdfName ? fontDecoders.get(fontName.name) ?? null : null;
				const size = operandStack[operandStack.length - 1];
				if (typeof size === 'number' && Number.isFinite(size)) currentSize = size;
				break;
			}
			case 'TL':
				leading = numberOf(operandStack.length - 1);
				break;
			case 'Td': {
				const translateX = numberOf(operandStack.length - 2);
				const translateY = numberOf(operandStack.length - 1);
				lineX += translateX;
				lineY += translateY;
				textX = lineX;
				textY = lineY;
				break;
			}
			case 'TD': {
				const translateX = numberOf(operandStack.length - 2);
				const translateY = numberOf(operandStack.length - 1);
				lineX += translateX;
				lineY += translateY;
				textX = lineX;
				textY = lineY;
				leading = -translateY;
				break;
			}
			case 'Tm':
				textX = numberOf(operandStack.length - 2);
				textY = numberOf(operandStack.length - 1);
				lineX = textX;
				lineY = textY;
				break;
			case 'T*':
				lineY -= leading;
				textX = lineX;
				textY = lineY;
				break;
			case 'Tj':
				showString(last());
				break;
			case "'":
				lineY -= leading;
				textX = lineX;
				textY = lineY;
				showString(last());
				break;
			case '"':
				lineY -= leading;
				textX = lineX;
				textY = lineY;
				showString(last());
				break;
			case 'TJ': {
				const array = last();
				if (Array.isArray(array)) {
					for (const item of array) {
						if (item instanceof PdfString) showString(item);
						else if (typeof item === 'number' && Number.isFinite(item)) textX += (-item / 1000) * currentSize;
					}
				}
				break;
			}
			default:
				break;
		}
		operandStack.length = 0;
	}

	return assembleFragments(fragments);
}

function normalizePageText(text) {
	return text
		.replace(/[ \t]+\n/g, '\n')
		.replace(/[ \t]{2,}/g, ' ')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

// ---------------------------------------------------------------------------
// 入口
// ---------------------------------------------------------------------------

function findLastStartxref(source) {
	const regex = /startxref\s+(\d+)/g;
	let match;
	let lastOffset = null;
	while ((match = regex.exec(source)) !== null) lastOffset = Number(match[1]);
	return lastOffset;
}

/**
 * 抽取 PDF 文本。
 * @param {string} absPath
 * @returns {Promise<{ text: string, warnings: string[], images: Array<never> }>}
 */
export async function extractPdf(absPath) {
	const warnings = [];
	try {
		const buffer = await readFile(absPath);
		const source = buffer.toString('latin1');
		if (!/^%PDF-/.test(source.slice(0, 1024))) {
			return { text: '', warnings: ['不是有效的 PDF 文件（缺少 %PDF 头）'], images: [] };
		}

		const objects = new Map();
		let trailer = null;
		const startxref = findLastStartxref(source);
		if (startxref !== null) {
			try {
				const xref = readXrefChain(source, startxref, objects);
				if (xref.entries.size > 0) {
					loadObjectsFromEntries(source, xref.entries, objects);
					trailer = xref.trailer;
				}
			} catch (error) {
				warnings.push(`PDF 交叉引用解析失败：${error instanceof Error ? error.message : String(error)}`);
			}
		}

		let root = findRoot(objects, trailer);
		if (!root) {
			// 兜底：直接扫描对象（损坏的 xref / 缺少 startxref）
			const fallbackTrailer = scanObjectsFallback(source, objects);
			if (fallbackTrailer) {
				if (!(trailer instanceof PdfDict)) trailer = new PdfDict();
				for (const [key, value] of fallbackTrailer.entries()) if (!trailer.has(key)) trailer.set(key, value);
			}
			root = findRoot(objects, trailer);
		}
		if (!root) {
			return { text: '', warnings: uniqueWarnings([...warnings, 'PDF 结构无法解析（未找到文档目录 /Catalog）']), images: [] };
		}

		if (trailer instanceof PdfDict && trailer.has('Encrypt')) {
			return { text: '', warnings: uniqueWarnings([...warnings, 'PDF 已加密，暂不支持文本抽取']), images: [] };
		}

		const pages = collectPages(objects, root);
		if (pages.length === 0) {
			return { text: '', warnings: uniqueWarnings([...warnings, 'PDF 中未找到页面']), images: [] };
		}

		const pageTexts = [];
		for (let index = 0; index < pages.length; index++) {
			let pageText = '';
			try {
				const content = pageContent(objects, pages[index]);
				if (content) {
					const fontDecoders = buildFontDecoders(objects, pages[index].resources);
					pageText = normalizePageText(extractTextFromContent(content, fontDecoders));
				}
			} catch (error) {
				warnings.push(`第 ${index + 1} 页解析失败：${error instanceof Error ? error.message : String(error)}`);
			}
			pageTexts.push(pageText);
		}

		const text = pageTexts
			.map((pageText, index) => (pageText ? `[第${index + 1}页]\n${pageText}` : `[第${index + 1}页]`))
			.join('\n\n')
			.trim();

		if (pageTexts.every((pageText) => !pageText)) {
			warnings.push('PDF 中未抽取到文本（可能是扫描件或使用了特殊字体编码）');
		}

		return { text, warnings: uniqueWarnings(warnings), images: [] };
	} catch (error) {
		return {
			text: '',
			warnings: [`PDF 文本抽取失败：${error instanceof Error ? error.message : String(error)}`],
			images: [],
		};
	}
}

// 便于测试/调试的内部能力（不对外承诺）
export const __internal = {
	parseValue,
	parseIndirectObject,
	parseCMap,
	decodeWithCMap,
	ascii85Decode,
	asciiHexDecode,
	applyPredictor,
	decodeStream,
	readXrefChain,
	loadObjectsFromEntries,
	findRoot,
	collectPages,
	pageContent,
	buildFontDecoders,
	extractTextFromContent,
};
