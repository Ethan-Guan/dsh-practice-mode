/**
 * 极简 XML 解析器：只解析文档抽取需要的良构结构（docx/pptx 的 OOXML）。
 *
 * 解析结果为普通节点树：`{ name, attrs, children }`，children 中
 * 文本节点是字符串（已解码实体），元素节点是同样结构的对象。
 * 不支持 DTD 校验；遇到注释/CDATA/处理指令做跳过或按文本处理。
 */

/** 常用命名实体；数字实体（&#123; / &#xAB;）另行处理。 */
const NAMED_ENTITIES = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: '\u00a0',
	ensp: '\u2002',
	emsp: '\u2003',
	thinsp: '\u2009',
	shy: '\u00ad',
	copy: '\u00a9',
	reg: '\u00ae',
	trade: '\u2122',
	hellip: '\u2026',
	mdash: '\u2014',
	ndash: '\u2013',
	lsquo: '\u2018',
	rsquo: '\u2019',
	ldquo: '\u201c',
	rdquo: '\u201d',
	middot: '\u00b7',
	bull: '\u2022',
	deg: '\u00b0',
	plusmn: '\u00b1',
	times: '\u00d7',
	divide: '\u00f7',
	frac12: '\u00bd',
	frac14: '\u00bc',
	frac34: '\u00be',
	laquo: '\u00ab',
	raquo: '\u00bb',
	sect: '\u00a7',
	para: '\u00b6',
	cent: '\u00a2',
	pound: '\u00a3',
	euro: '\u20ac',
	yen: '\u00a5',
	larr: '\u2190',
	rarr: '\u2192',
	uarr: '\u2191',
	darr: '\u2193',
};

/** 解码 XML/HTML 实体（命名实体 + 十进制/十六进制数字实体）。 */
export function decodeXmlEntities(input) {
	if (!input || input.indexOf('&') < 0) return input;
	return String(input).replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (match, body) => {
		if (body[0] === '#') {
			const hex = body[1] === 'x' || body[1] === 'X';
			const code = Number.parseInt(hex ? body.slice(2) : body.slice(1), hex ? 16 : 10);
			if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return match;
			try {
				return String.fromCodePoint(code);
			} catch {
				return match;
			}
		}
		return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, body) ? NAMED_ENTITIES[body] : match;
	});
}

/** 去掉命名空间前缀后的本地名（w:p -> p，a:t -> t）。 */
export function localName(name) {
	const index = name.indexOf(':');
	return index >= 0 ? name.slice(index + 1) : name;
}

/** 读取元素的所有文本后代（用于 w:t / a:t 这类纯文本元素）。 */
export function textContent(element) {
	if (!element) return '';
	if (typeof element === 'string') return element;
	let output = '';
	for (const child of element.children) output += textContent(child);
	return output;
}

/** 直接子元素列表。 */
export function childElements(element) {
	if (!element || typeof element === 'string') return [];
	return element.children.filter((child) => typeof child !== 'string');
}

/** 按标签名找直接子元素（可传多个名字）。 */
export function childrenNamed(element, ...names) {
	return childElements(element).filter((child) => names.includes(child.name));
}

/** 深度优先查找第一个指定名字的元素。 */
export function findFirst(element, name) {
	if (!element || typeof element === 'string') return null;
	if (element.name === name) return element;
	for (const child of element.children) {
		if (typeof child === 'string') continue;
		const found = findFirst(child, name);
		if (found) return found;
	}
	return null;
}

/** 深度优先遍历所有元素，回调返回 true 时提前停止。 */
export function walkElements(element, visitor) {
	if (!element || typeof element === 'string') return false;
	if (visitor(element) === true) return true;
	for (const child of element.children) {
		if (typeof child === 'string') continue;
		if (walkElements(child, visitor)) return true;
	}
	return false;
}

/** 收集深度优先遇到的所有指定名字元素。 */
export function elementsNamed(element, name) {
	const result = [];
	walkElements(element, (node) => {
		if (node.name === name) result.push(node);
	});
	return result;
}

const NAME_START = /[A-Za-z_:]/;

/** 从 `start` 位置的 `<` 开始找标签结束的 `>`（跳过引号内的尖括号）。 */
function findTagEnd(xml, start) {
	let quote = '';
	for (let index = start + 1; index < xml.length; index++) {
		const char = xml[index];
		if (quote) {
			if (char === quote) quote = '';
			continue;
		}
		if (char === '"' || char === "'") {
			quote = char;
		} else if (char === '>') {
			return index;
		}
	}
	return -1;
}

function parseAttributes(tagBody) {
	const attrs = Object.create(null);
	const regex = /([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
	let match;
	while ((match = regex.exec(tagBody)) !== null) {
		attrs[match[1]] = decodeXmlEntities(match[2] ?? match[3] ?? '');
	}
	return attrs;
}

/**
 * 解析 XML 字符串，返回根元素。
 * @param {string} xml
 * @returns {{ name: string, attrs: Record<string, string>, children: Array<object|string> } | null}
 */
export function parseXml(xml) {
	if (typeof xml !== 'string' || xml.length === 0) return null;
	let pos = 0;
	let root = null;
	const stack = [];
	const length = xml.length;

	while (pos < length) {
		const lt = xml.indexOf('<', pos);
		if (lt < 0) {
			// 结尾残余文本
			if (stack.length > 0) stack[stack.length - 1].children.push(decodeXmlEntities(xml.slice(pos)));
			break;
		}
		if (lt > pos && stack.length > 0) {
			stack[stack.length - 1].children.push(decodeXmlEntities(xml.slice(pos, lt)));
		}
		pos = lt;

		if (xml.startsWith('<!--', pos)) {
			const end = xml.indexOf('-->', pos + 4);
			pos = end < 0 ? length : end + 3;
			continue;
		}
		if (xml.startsWith('<![CDATA[', pos)) {
			const end = xml.indexOf(']]>', pos + 9);
			const text = xml.slice(pos + 9, end < 0 ? length : end);
			if (stack.length > 0) stack[stack.length - 1].children.push(text);
			pos = end < 0 ? length : end + 3;
			continue;
		}
		if (xml.startsWith('<?', pos) || xml.startsWith('<!', pos)) {
			// 处理指令 / DOCTYPE（DOCTYPE 可能带 [ ... ] 内部子集）
			if (xml.startsWith('<!', pos)) {
				let depth = 0;
				let end = -1;
				for (let index = pos + 2; index < length; index++) {
					const char = xml[index];
					if (char === '[') depth++;
					else if (char === ']') depth = Math.max(0, depth - 1);
					else if (char === '>' && depth === 0) {
						end = index;
						break;
					}
				}
				pos = end < 0 ? length : end + 1;
			} else {
				const end = xml.indexOf('?>', pos + 2);
				pos = end < 0 ? length : end + 2;
			}
			continue;
		}

		if (xml.startsWith('</', pos)) {
			const end = xml.indexOf('>', pos + 2);
			const name = xml.slice(pos + 2, end < 0 ? length : end).trim();
			// 容错：只在栈顶匹配时弹出，否则向上找最近的同名元素
			let matchIndex = -1;
			for (let index = stack.length - 1; index >= 0; index--) {
				if (stack[index].name === name) {
					matchIndex = index;
					break;
				}
			}
			if (matchIndex >= 0) stack.length = matchIndex;
			pos = end < 0 ? length : end + 1;
			continue;
		}

		// 开始标签 / 自闭合标签
		if (!NAME_START.test(xml[pos + 1] ?? '')) {
			pos++;
			continue;
		}
		const end = findTagEnd(xml, pos);
		if (end < 0) break;
		const selfClosing = xml[end - 1] === '/';
		const inner = xml.slice(pos + 1, selfClosing ? end - 1 : end);
		const spaceIndex = inner.search(/[\s/]/);
		const name = (spaceIndex < 0 ? inner : inner.slice(0, spaceIndex)).trim();
		const attrs = parseAttributes(spaceIndex < 0 ? '' : inner.slice(spaceIndex));
		const element = { name, attrs, children: [] };
		if (stack.length > 0) stack[stack.length - 1].children.push(element);
		else if (!root) root = element;
		if (!selfClosing) stack.push(element);
		pos = end + 1;
	}

	return root;
}
