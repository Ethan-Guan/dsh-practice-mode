/**
 * PDF 基础对象、值解析与流解码（pdf.js 的内部实现）。
 *
 * 本文件从 pdf.js 中拆出，只包含与 PDF 语法/流解码相关的纯函数，便于单独维护。
 * 仅依赖 Node 内置模块。
 */

import { inflateRawSync, inflateSync } from 'node:zlib';

// ---------------------------------------------------------------------------
// PDF 基础对象
// ---------------------------------------------------------------------------

class PdfName {
	constructor(name) {
		this.name = name;
	}
}

class PdfString {
	constructor(bytes) {
		this.bytes = bytes;
	}
}

class PdfRef {
	constructor(num, gen) {
		this.num = num;
		this.gen = gen;
	}
}

class PdfDict {
	constructor() {
		this.map = new Map();
	}
	get(key) {
		return this.map.get(key);
	}
	set(key, value) {
		this.map.set(key, value);
	}
	has(key) {
		return this.map.has(key);
	}
	entries() {
		return this.map.entries();
	}
}

const PDF_WHITESPACE = new Set([0, 9, 10, 12, 13, 32]);
const PDF_DELIMITERS = new Set(['(', ')', '<', '>', '[', ']', '{', '}', '/', '%']);

function isWhitespaceCode(code) {
	return PDF_WHITESPACE.has(code);
}

function isDelimiter(char) {
	return PDF_DELIMITERS.has(char);
}

function isDigit(char) {
	return char >= '0' && char <= '9';
}

function isValueStart(char) {
	return (
		char === '/' ||
		char === '(' ||
		char === '<' ||
		char === '[' ||
		char === '+' ||
		char === '-' ||
		char === '.' ||
		isDigit(char)
	);
}

function skipWhitespaceAndComments(source, start) {
	let pos = start;
	const length = source.length;
	while (pos < length) {
		const code = source.charCodeAt(pos);
		if (isWhitespaceCode(code)) {
			pos++;
			continue;
		}
		if (source[pos] === '%') {
			const newline = source.indexOf('\n', pos);
			pos = newline < 0 ? length : newline + 1;
			continue;
		}
		break;
	}
	return pos;
}

// ---------------------------------------------------------------------------
// 值解析
// ---------------------------------------------------------------------------

function parseNumberValue(source, start) {
	const match = /^[+-]?(?:\d+\.?\d*|\.\d+)/.exec(source.slice(start, start + 32));
	if (!match) return { value: 0, pos: start + 1 };
	return { value: Number(match[0]), pos: start + match[0].length };
}

function parseNameValue(source, start) {
	let pos = start + 1;
	let name = '';
	while (pos < source.length) {
		const char = source[pos];
		if (isWhitespaceCode(source.charCodeAt(pos)) || isDelimiter(char)) break;
		if (char === '#') {
			const hex = source.slice(pos + 1, pos + 3);
			if (/^[0-9a-fA-F]{2}$/.test(hex)) {
				name += String.fromCharCode(Number.parseInt(hex, 16));
				pos += 3;
				continue;
			}
		}
		name += char;
		pos++;
	}
	return { value: new PdfName(name), pos };
}

function parseLiteralString(source, start) {
	let pos = start + 1;
	const bytes = [];
	let depth = 1;
	while (pos < source.length) {
		const char = source[pos];
		if (char === '\\') {
			const next = source[pos + 1];
			pos += 2;
			if (next === undefined) break;
			switch (next) {
				case 'n':
					bytes.push(0x0a);
					break;
				case 'r':
					bytes.push(0x0d);
					break;
				case 't':
					bytes.push(0x09);
					break;
				case 'b':
					bytes.push(0x08);
					break;
				case 'f':
					bytes.push(0x0c);
					break;
				case '(':
					bytes.push(0x28);
					break;
				case ')':
					bytes.push(0x29);
					break;
				case '\\':
					bytes.push(0x5c);
					break;
				case '\r':
					if (source[pos] === '\n') pos++;
					break;
				case '\n':
					break;
				default:
					if (next >= '0' && next <= '7') {
						let octal = next;
						if (source[pos] >= '0' && source[pos] <= '7') {
							octal += source[pos];
							pos++;
						}
						if (source[pos] >= '0' && source[pos] <= '7') {
							octal += source[pos];
							pos++;
						}
						bytes.push(Number.parseInt(octal, 8) & 0xff);
					} else {
						bytes.push(next.charCodeAt(0) & 0xff);
					}
			}
			continue;
		}
		if (char === '(') {
			depth++;
			bytes.push(0x28);
			pos++;
			continue;
		}
		if (char === ')') {
			depth--;
			pos++;
			if (depth === 0) break;
			bytes.push(0x29);
			continue;
		}
		if (char === '\r') {
			if (source[pos + 1] === '\n') pos++;
			bytes.push(0x0a);
			pos++;
			continue;
		}
		bytes.push(char.charCodeAt(0) & 0xff);
		pos++;
	}
	return { value: new PdfString(Buffer.from(bytes)), pos };
}

function hexToBytes(hex) {
	let cleaned = String(hex).replace(/[^0-9a-fA-F]/g, '');
	if (cleaned.length % 2 === 1) cleaned += '0';
	return Buffer.from(cleaned, 'hex');
}

function parseHexString(source, start) {
	let pos = start + 1;
	const chars = [];
	while (pos < source.length && source[pos] !== '>') {
		const char = source[pos];
		if (/[0-9a-fA-F]/.test(char)) chars.push(char);
		pos++;
	}
	if (pos < source.length) pos++;
	return { value: new PdfString(hexToBytes(chars.join(''))), pos };
}

function parseArrayValue(source, start) {
	let pos = start + 1;
	const values = [];
	let guard = 0;
	while (pos < source.length) {
		pos = skipWhitespaceAndComments(source, pos);
		if (pos >= source.length) break;
		if (source[pos] === ']') {
			pos++;
			break;
		}
		const result = parseValue(source, pos);
		if (!result || result.pos <= pos) {
			pos++;
			continue;
		}
		values.push(result.value);
		pos = result.pos;
		if (++guard > 100_000) break;
	}
	return { value: values, pos };
}

function parseDictValue(source, start) {
	let pos = start + 2;
	const dict = new PdfDict();
	let guard = 0;
	while (pos < source.length) {
		pos = skipWhitespaceAndComments(source, pos);
		if (pos >= source.length) break;
		if (source[pos] === '>' && source[pos + 1] === '>') {
			pos += 2;
			break;
		}
		if (source[pos] !== '/') {
			// 容错：跳过异常字符
			pos++;
			continue;
		}
		const nameResult = parseNameValue(source, pos);
		pos = skipWhitespaceAndComments(source, nameResult.pos);
		const valueResult = parseValue(source, pos);
		if (!valueResult || valueResult.pos <= pos) {
			pos++;
			continue;
		}
		dict.set(nameResult.value.name, valueResult.value);
		pos = valueResult.pos;
		if (++guard > 100_000) break;
	}
	return { value: dict, pos };
}

/**
 * 解析一个 PDF 值（数字/名字/字符串/数组/字典/间接引用/布尔/null）。
 * @returns {{ value: any, pos: number }}
 */
function parseValue(source, start) {
	let pos = skipWhitespaceAndComments(source, start);
	if (pos >= source.length) return { value: null, pos };
	const char = source[pos];

	if (char === '/') return parseNameValue(source, pos);
	if (char === '(') return parseLiteralString(source, pos);
	if (char === '<') {
		if (source[pos + 1] === '<') return parseDictValue(source, pos);
		return parseHexString(source, pos);
	}
	if (char === '[') return parseArrayValue(source, pos);
	if (char === '+' || char === '-' || char === '.' || isDigit(char)) {
		const numberResult = parseNumberValue(source, pos);
		pos = numberResult.pos;
		// 间接引用：N G R
		if (Number.isInteger(numberResult.value) && numberResult.value >= 0) {
			const secondPos = skipWhitespaceAndComments(source, pos);
			if (isDigit(source[secondPos] ?? '')) {
				const generationResult = parseNumberValue(source, secondPos);
				if (Number.isInteger(generationResult.value) && generationResult.value >= 0) {
					const thirdPos = skipWhitespaceAndComments(source, generationResult.pos);
					const nextChar = source[thirdPos + 1];
					const refEnded =
						nextChar === undefined || isWhitespaceCode(nextChar.charCodeAt(0)) || isDelimiter(nextChar);
					if (source[thirdPos] === 'R' && refEnded) {
						return { value: new PdfRef(numberResult.value, generationResult.value), pos: thirdPos + 1 };
					}
				}
			}
		}
		return { value: numberResult.value, pos };
	}

	const keyword = /^[A-Za-z]+/.exec(source.slice(pos, pos + 12));
	if (keyword) {
		const word = keyword[0];
		if (word === 'true') return { value: true, pos: pos + 4 };
		if (word === 'false') return { value: false, pos: pos + 5 };
		if (word === 'null') return { value: null, pos: pos + 4 };
		return { value: null, pos: pos + word.length };
	}
	return { value: null, pos: pos + 1 };
}

/** 解析 "N G obj ... endobj"；流数据单独放在 stream 字段（未解码）。 */
function parseIndirectObject(source, offset) {
	let pos = skipWhitespaceAndComments(source, offset);
	const head = /^(\d+)\s+(\d+)\s+obj\b/.exec(source.slice(pos, pos + 40));
	if (!head) return null;
	const num = Number(head[1]);
	const gen = Number(head[2]);
	pos += head[0].length;

	const valueResult = parseValue(source, pos);
	pos = valueResult.pos;

	let stream = null;
	const afterValue = skipWhitespaceAndComments(source, pos);
	if (source.startsWith('stream', afterValue)) {
		let dataStart = afterValue + 6;
		if (source[dataStart] === '\r' && source[dataStart + 1] === '\n') dataStart += 2;
		else if (source[dataStart] === '\n' || source[dataStart] === '\r') dataStart += 1;
		const streamEnd = source.indexOf('endstream', dataStart);
		let dataEnd = streamEnd < 0 ? source.length : streamEnd;
		if (source[dataEnd - 1] === '\n') dataEnd--;
		if (source[dataEnd - 1] === '\r') dataEnd--;
		stream = Buffer.from(source.slice(dataStart, dataEnd), 'latin1');
		pos = streamEnd < 0 ? source.length : streamEnd + 9;
	}
	return { num, gen, value: valueResult.value, stream, endPos: pos };
}

// ---------------------------------------------------------------------------
// 解析辅助
// ---------------------------------------------------------------------------

function resolveValue(objects, value) {
	let current = value;
	let guard = 0;
	while (current instanceof PdfRef) {
		if (++guard > 32) return undefined;
		const object = objects.get(current.num);
		if (!object) return undefined;
		current = object.value;
	}
	return current;
}

function resolveDict(objects, value) {
	const resolved = resolveValue(objects, value);
	return resolved instanceof PdfDict ? resolved : null;
}

function directName(value) {
	return value instanceof PdfName ? value.name : null;
}

function numberValue(objects, value, fallback) {
	const resolved = resolveValue(objects, value);
	return typeof resolved === 'number' && Number.isFinite(resolved) ? resolved : fallback;
}

function bytesToInt(bytes) {
	let value = 0;
	for (const byte of bytes) value = value * 256 + byte;
	return value;
}

// ---------------------------------------------------------------------------
// 流解码
// ---------------------------------------------------------------------------

function filterNames(objects, value) {
	if (value === undefined) return [];
	const resolved = resolveValue(objects, value);
	if (resolved instanceof PdfName) return [resolved.name];
	if (Array.isArray(resolved)) {
		return resolved.map((item) => {
			const one = resolveValue(objects, item);
			return one instanceof PdfName ? one.name : null;
		});
	}
	return [];
}

function parmList(objects, value, count) {
	const resolved = resolveValue(objects, value);
	const list = [];
	if (Array.isArray(resolved)) {
		for (const item of resolved) list.push(resolveDict(objects, item));
	} else if (resolved instanceof PdfDict) {
		list.push(resolved);
	}
	while (list.length < count) list.push(null);
	return list;
}

/** 逐行 PNG/TIFF predictor 还原（xref stream、内容流有时会用到）。 */
function applyPredictor(objects, data, params) {
	if (!params) return data;
	const predictor = numberValue(objects, params.get('Predictor'), 1);
	if (!(predictor > 1)) return data;
	const colors = numberValue(objects, params.get('Colors'), 1);
	const bitsPerComponent = numberValue(objects, params.get('BitsPerComponent'), 8);
	const columns = numberValue(objects, params.get('Columns'), 1);
	const bytesPerPixel = Math.max(1, Math.ceil((colors * bitsPerComponent) / 8));
	const rowLength = Math.ceil((colors * bitsPerComponent * columns) / 8);
	if (!(rowLength > 0)) return data;

	if (predictor >= 10) {
		const rowCount = Math.floor(data.length / (rowLength + 1));
		const output = Buffer.alloc(rowCount * rowLength);
		for (let row = 0; row < rowCount; row++) {
			const filterType = data[row * (rowLength + 1)];
			const inputStart = row * (rowLength + 1) + 1;
			const outputStart = row * rowLength;
			const previousStart = outputStart - rowLength;
			for (let index = 0; index < rowLength; index++) {
				const raw = data[inputStart + index];
				const left = index >= bytesPerPixel ? output[outputStart + index - bytesPerPixel] : 0;
				const up = row > 0 ? output[previousStart + index] : 0;
				const upLeft = row > 0 && index >= bytesPerPixel ? output[previousStart + index - bytesPerPixel] : 0;
				let value;
				if (filterType === 0) value = raw;
				else if (filterType === 1) value = raw + left;
				else if (filterType === 2) value = raw + up;
				else if (filterType === 3) value = raw + Math.floor((left + up) / 2);
				else if (filterType === 4) {
					const p = left + up - upLeft;
					const pa = Math.abs(p - left);
					const pb = Math.abs(p - up);
					const pc = Math.abs(p - upLeft);
					const paeth = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
					value = raw + paeth;
				} else value = raw;
				output[outputStart + index] = value & 0xff;
			}
		}
		return output;
	}

	if (predictor === 2 && bitsPerComponent === 8) {
		const output = Buffer.from(data);
		const rowCount = Math.floor(output.length / rowLength);
		const componentsPerRow = Math.floor(rowLength / Math.max(1, colors));
		for (let row = 0; row < rowCount; row++) {
			const rowStart = row * rowLength;
			for (let index = 1; index < componentsPerRow; index++) {
				for (let color = 0; color < colors; color++) {
					const position = rowStart + index * colors + color;
					const previous = rowStart + (index - 1) * colors + color;
					output[position] = (output[position] + output[previous]) & 0xff;
				}
			}
		}
		return output;
	}
	return null;
}

function asciiHexDecode(data) {
	const text = data.toString('latin1').replace(/>[\s\S]*$/, '').replace(/[^0-9a-fA-F]/g, '');
	let hex = text;
	if (hex.length % 2 === 1) hex += '0';
	return Buffer.from(hex, 'hex');
}

function ascii85Decode(data) {
	let text = data.toString('latin1').trim();
	const start = text.indexOf('<~');
	if (start >= 0) text = text.slice(start + 2);
	const end = text.indexOf('~>');
	if (end >= 0) text = text.slice(0, end);
	text = text.replace(/\s+/g, '');
	const output = [];
	let group = [];
	const flush = () => {
		if (group.length === 0) return;
		const length = group.length;
		while (group.length < 5) group.push(84);
		let value = 0;
		for (const code of group) value = value * 85 + (code - 33);
		const bytes = [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
		output.push(...bytes.slice(0, length - 1));
		group = [];
	};
	for (const char of text) {
		if (char === 'z' && group.length === 0) {
			output.push(0, 0, 0, 0);
			continue;
		}
		group.push(char.charCodeAt(0));
		if (group.length === 5) flush();
	}
	flush();
	return Buffer.from(output);
}

/** 解码对象流；不支持/失败时返回 null。 */
function decodeStream(objects, dict, stream) {
	if (!stream) return null;
	let data = stream;
	const filters = filterNames(objects, dict.get('Filter') ?? dict.get('F'));
	if (filters.length === 0) return data;
	const parameters = parmList(objects, dict.get('DecodeParms') ?? dict.get('DP'), filters.length);
	for (let index = 0; index < filters.length; index++) {
		const filter = filters[index];
		if (filter === 'FlateDecode' || filter === 'Fl') {
			try {
				data = inflateSync(data);
			} catch {
				try {
					data = inflateRawSync(data);
				} catch {
					return null;
				}
			}
			const predicted = applyPredictor(objects, data, parameters[index]);
			if (!predicted) return null;
			data = predicted;
		} else if (filter === 'ASCIIHexDecode' || filter === 'AHx') {
			data = asciiHexDecode(data);
		} else if (filter === 'ASCII85Decode' || filter === 'A85') {
			data = ascii85Decode(data);
		} else {
			// 未知过滤器（如 LZWDecode / DCTDecode）：不参与文本抽取
			return null;
		}
	}
	return data;
}

/** 取某个对象引用对应的解码后流数据。 */
function decodedStreamOf(objects, value) {
	const object = value instanceof PdfRef ? objects.get(value.num) : null;
	if (!object || !object.stream) return null;
	const dict = object.value instanceof PdfDict ? object.value : new PdfDict();
	return decodeStream(objects, dict, object.stream);
}

export {
	PdfName,
	PdfString,
	PdfRef,
	PdfDict,
	parseValue,
	parseIndirectObject,
	resolveValue,
	resolveDict,
	directName,
	numberValue,
	decodeStream,
	decodedStreamOf,
	applyPredictor,
	asciiHexDecode,
	ascii85Decode,
	hexToBytes,
	bytesToInt,
	skipWhitespaceAndComments,
	isWhitespaceCode,
	isDelimiter,
	isValueStart,
};
