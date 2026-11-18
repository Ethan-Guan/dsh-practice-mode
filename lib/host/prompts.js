/**
 * 刷题模式 — Agent 提示、结构化提交工具与模型输出规范化（prompts.js）。
 *
 * 本模块只做纯函数：不读写文件、不调用模型。
 *   - 各 build*Prompt：只组装「任务一句话 + 数据」的极短 Agent 提示；结构化字段由工具 schema 表达；
 *   - PARSE_RESULT_TOOL / ANSWER_KEY_RESULT_TOOL / ANSWER_RESULT_TOOL / GRADE_RESULT_TOOL：
 *     Agent 作用域内注册的提交工具，Host 直接拿到对象，不再依赖回答文本里的 JSON；
 *   - normalizeParsedSet：容错解析模型输出（对象 / 裸 JSON / ```json 代码块 / 首尾夹带说明），
 *     规范化字段（type 枚举、options key、answer 数组、answerDisplay、id、题号保留），过滤空题，
 *     清洗图形内联 SVG；返回的 set 里 SVG 仍是内联文本（不含二进制），由 tasks.parseSet 统一落盘；
 *   - mergeParsedSets：合并多批解析结果，跨批去重，重新分配全局 q* / g* id；
 *   - sanitizeSvg：清洗 SVG（去 script / foreignObject / 事件属性 / javascript: / 外部 URL / base64），
 *     补齐 xmlns 与 viewBox；非法内容返回空串。
 *
 * 模型可见的题目 JSON 结构以 docs/CONTRACT.md 3.2 节为准。
 */

const MAX_QUESTIONS = 800;
const MAX_OPTIONS = 12;
const MAX_FIGURES_PER_HEAD = 8;
const MAX_TAGS = 6;
const MAX_SVG_CHARS = 200_000;
const MAX_WARNINGS = 60;
const MAX_ANALYSIS_CHARS = 8000;
const MAX_STEM_CHARS = 20000;

/** 题型枚举 → 中文展示名。 */
const TYPE_LABELS = {
	single: '单选',
	multiple: '多选',
	judge: '判断',
	fill: '填空',
	short: '简答',
	other: '其他'
};

/** 题型同义词（先匹配更具体的多选/判断等，避免「选择题」误判）。 */
const TYPE_ALIASES = [
	['multiple', ['多选', '多项', '不定项', 'multiple', 'multi-select', 'multi']],
	['judge', ['判断', '是非', '正误', 'judge', 'true-false', 'true/false', 'tf']],
	['fill', ['填空', 'fill', 'blank', 'cloze']],
	['short', ['简答', '解答', '计算', '证明', '论述', '问答', '综合', '写作', 'short', 'essay', 'free-response', 'free', 'solution']],
	['single', ['单选', '单项', 'single', 'radio', 'choice']],
	['other', ['其他', '其它', 'other', 'unknown']]
];

/** 难度同义词。 */
const DIFFICULTY_ALIASES = [
	['easy', ['easy', '简单', '容易', '基础', '低']],
	['medium', ['medium', '中等', '一般', '中']],
	['hard', ['hard', '困难', '难', '高', '拔高']]
];

// ---------------------------------------------------------------------------
// 基础工具
// ---------------------------------------------------------------------------

/** @returns {boolean} */
function isPlainObject(value) {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 尽量把任意值转成去空白字符串（数字、布尔也接受）。 */
function asString(value) {
	if (typeof value === 'string') return value.trim();
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	return '';
}

/** 尽量把任意值转成数字；不合法返回 null。 */
function asNumber(value) {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value.trim()))) return Number(value.trim());
	return null;
}

/** 截断超长文本。 */
function truncate(text, max) {
	const value = typeof text === 'string' ? text : '';
	if (value.length <= max) return value;
	return `${value.slice(0, max)}\n…（内容过长已截断）`;
}

/** 去重后的字符串数组。 */
function uniqueStrings(values) {
	const seen = new Set();
	const result = [];
	for (const value of values) {
		const text = asString(value);
		if (text === '' || seen.has(text)) continue;
		seen.add(text);
		result.push(text);
	}
	return result;
}

/** 比较用归一化文本（忽略空白与常见标点，便于跨批去重/答案对选项）。 */
function normalizeCompare(text) {
	return asString(text)
		.toLowerCase()
		.replace(/[\s\u3000]+/g, '')
		.replace(/[，。；：、,.!?；：'"“”‘’()（）[\]【】<>《》\-—_/\\|]+/g, '');
}

/** 收集 warnings；超过上限后不再追加细节，避免刷屏。 */
function createWarningBag() {
	const warnings = [];
	let overflow = 0;
	return {
		add(message) {
			if (asString(message) === '') return;
			if (warnings.length >= MAX_WARNINGS - 1) {
				overflow += 1;
				return;
			}
			warnings.push(message);
		},
		/** @returns {string[]} */
		finish() {
			if (overflow > 0) warnings.push(`另有 ${overflow} 条提示未展开。`);
			return uniqueStrings(warnings);
		}
	};
}

// ---------------------------------------------------------------------------
// SVG 清洗
// ---------------------------------------------------------------------------

// 只从元素级移除脚本执行类内容；rect/circle/ellipse/path/line/polygon/polyline/g/text/tspan/
// defs/marker/linearGradient/pattern/use/style/image 等常见元素保留，靠属性清洗去掉危险内容。
const DANGEROUS_ELEMENT_RE = /<(script|foreignObject)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const DANGEROUS_SELF_CLOSING_RE = /<(script|foreignObject)\b[^>]*\/?>/gi;

/** 从 width / height 属性中读取像素尺寸（支持 "816" / "816px" / "8.5in" 难处理，忽略非像素）。 */
function parseLength(value) {
	const match = /^\s*(\d+(?:\.\d+)?)\s*(?:px)?\s*$/i.exec(asString(value));
	if (!match) return null;
	const number = Number(match[1]);
	return Number.isFinite(number) && number > 0 ? Math.round(number) : null;
}

/** 给 <svg> 开标签补 xmlns / viewBox，并去掉危险属性。 */
function ensureSvgAttributes(svg) {
	const openMatch = /<svg\b([^>]*)>/i.exec(svg);
	if (!openMatch) return '';
	let attrs = openMatch[1] ?? '';
	const selfClosing = attrs.trimEnd().endsWith('/');
	if (selfClosing) attrs = attrs.trimEnd().slice(0, -1);

	// 去掉带事件的属性、javascript:/data: 等危险属性值。
	attrs = attrs.replace(/\son[a-z-]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
	attrs = attrs.replace(/\s[\w:-]+\s*=\s*("[^"]*(?:javascript:|data:|base64)[^"]*"|'[^']*(?:javascript:|data:|base64)[^']*')/gi, '');
	attrs = attrs.replace(/\s(?:xlink:)?href\s*=\s*("[^"]*"|'[^']*')/gi, (whole, raw) => {
		const value = String(raw).slice(1, -1).trim();
		return value.startsWith('#') ? whole : '';
	});

	const hasViewBox = /\bviewBox\s*=/i.test(attrs);
	if (!hasViewBox) {
		const width = parseLength(/\bwidth\s*=\s*("([^"]*)"|'([^']*)')/i.exec(attrs)?.slice(2).find(Boolean));
		const height = parseLength(/\bheight\s*=\s*("([^"]*)"|'([^']*)')/i.exec(attrs)?.slice(2).find(Boolean));
		const w = width ?? 800;
		const h = height ?? 600;
		attrs += ` viewBox="0 0 ${w} ${h}"`;
	}
	if (!/\sxmlns\s*=/i.test(attrs)) attrs = ` xmlns="http://www.w3.org/2000/svg"${attrs}`;

	const open = `<svg${attrs}${selfClosing ? '/' : ''}>`;
	return svg.slice(0, openMatch.index) + open + svg.slice(openMatch.index + openMatch[0].length);
}

/**
 * 清洗模型生成的 SVG：只保留形状/文本等安全元素，去掉脚本、外部资源与事件属性，
 * 并保证根元素带 xmlns 与 viewBox。
 * @param {unknown} input 原始 SVG 文本（可带 ```svg 代码块围栏）
 * @returns {string} 清洗后的 SVG；无法识别时返回空串
 */
export function sanitizeSvg(input) {
	if (typeof input !== 'string') return '';
	let svg = input.replace(/^\uFEFF/, '').trim();
	if (svg === '') return '';
	// 去掉 Markdown 代码块围栏。
	svg = svg.replace(/^```(?:svg|xml|html)?\s*/i, '').replace(/```\s*$/i, '').trim();
	// 截取第一个 <svg> 到最后一个 </svg>（或自闭合）。
	const start = svg.search(/<svg\b/i);
	if (start < 0) return '';
	svg = svg.slice(start);
	const closeMatch = /<\/svg\s*>/gi;
	let lastClose = null;
	let match = closeMatch.exec(svg);
	while (match !== null) {
		lastClose = match;
		match = closeMatch.exec(svg);
	}
	if (lastClose !== null) svg = svg.slice(0, lastClose.index + lastClose[0].length);
	else if (!/^<svg\b[^>]*\/>/i.test(svg)) return '';

	if (svg.length > MAX_SVG_CHARS) return '';

	// 去掉 XML/DOCTYPE 声明、注释与危险元素。
	svg = svg.replace(/<\?xml[\s\S]*?\?>/gi, '').replace(/<!DOCTYPE[\s\S]*?>/gi, '');
	svg = svg.replace(/<!--[\s\S]*?-->/g, '');
	svg = svg.replace(DANGEROUS_ELEMENT_RE, '');
	svg = svg.replace(DANGEROUS_SELF_CLOSING_RE, '');
	// 去掉所有元素上的事件属性（onclick / onmouseover …）。
	svg = svg.replace(/\son[a-z-]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
	// 去掉指向脚本/内联数据的属性值（保留 style 等常见属性）。
	svg = svg.replace(/\s[\w:-]+\s*=\s*("[^"]*(?:javascript:|data:)[^"]*"|'[^']*(?:javascript:|data:)[^']*')/gi, '');
	// 去掉外部 href，只保留内部 #id 引用（use / textPath / image 等）。
	svg = svg.replace(/\s(?:xlink:)?href\s*=\s*("[^"]*"|'[^']*')/gi, (whole, raw) => {
		const value = String(raw).slice(1, -1).trim();
		return value.startsWith('#') ? whole : '';
	});
	// <style> 允许保留，但去掉 @import 与残留的脚本片段（url 外链由下方统一处理）。
	svg = svg.replace(/@import[^;]*;?/gi, '');
	svg = svg.replace(/javascript:/gi, '');
	// 去掉 url(外部地址)，保留 url(#id) 这类内部引用。
	svg = svg.replace(/url\(\s*(['"]?)(?:https?:|data:|file:)[^)]*\)/gi, 'none');

	svg = ensureSvgAttributes(svg.trim());
	if (svg === '') return '';
	// 空图（无任何子元素）没有重绘价值。
	const body = svg.replace(/^<svg\b[^>]*>/i, '').replace(/<\/svg\s*>$/i, '').trim();
	if (body === '' || /^<svg\b[^>]*\/>$/i.test(svg)) return '';
	return svg;
}

// ---------------------------------------------------------------------------
// 模型 JSON 提取
// ---------------------------------------------------------------------------

/** 尝试修复常见脏 JSON：删除尾逗号、去掉行首多余逗号、把中文引号包住的键换成英文引号。 */
function repairJson(text) {
	let repaired = text;
	repaired = repaired.replace(/,\s*([}\]])/g, '$1');
	repaired = repaired.replace(/([}\]])\s*,/g, '$1,');
	repaired = repaired.replace(/^\s*[，,]\s*/gm, '');
	// 全角引号偶发出现在键/字符串两端时，转成普通引号会破坏字符串内部，所以只处理键位置。
	repaired = repaired.replace(/([{,]\s*)“([^”\n]{1,60})”\s*:/g, '$1"$2":');
	return repaired;
}

/** 在文本中按括号配对截取一个完整 JSON 对象/数组（跳过字符串内的括号）。 */
function sliceBalancedJson(text) {
	const startIndex = text.search(/[{[]/);
	if (startIndex < 0) return null;
	const open = text[startIndex];
	const close = open === '{' ? '}' : ']';
	let depth = 0;
	let inString = false;
	let escaped = false;
	for (let index = startIndex; index < text.length; index += 1) {
		const char = text[index];
		if (inString) {
			if (escaped) escaped = false;
			else if (char === '\\') escaped = true;
			else if (char === '"') inString = false;
			continue;
		}
		if (char === '"') {
			inString = true;
			continue;
		}
		if (char === open) depth += 1;
		else if (char === close) {
			depth -= 1;
			if (depth === 0) return text.slice(startIndex, index + 1);
		}
	}
	return null;
}

/**
 * 从模型输出里提取 JSON 对象（容忍对象直传、裸 JSON、```json 代码块、前后夹带说明文字、尾逗号、
 * 多段 assistant 文本拼接）。多个候选时优先使用靠后的完整 JSON（通常才是最终答案）。
 * @param {string|object|Array} rawText
 * @returns {object|Array} 解析出的 JSON 值
 * @throws {Error} 完全无法解析时抛出中文错误
 */
function extractJsonValue(rawText) {
	// Agent 的结构化提交工具已经给出对象，直接使用。
	if (isPlainObject(rawText) || Array.isArray(rawText)) return rawText;
	if (typeof rawText !== 'string' || rawText.trim() === '') {
		throw new Error('模型没有返回任何题目内容。');
	}
	const candidates = [];
	const raw = rawText.replace(/^\uFEFF/, '').trim();
	candidates.push(raw);
	// 代码块内容优先（后面的代码块更可能是最终结果）。
	const fenceRe = /```(?:json|JSON|javascript|js)?\s*([\s\S]*?)```/g;
	const fences = [];
	let fence = fenceRe.exec(raw);
	while (fence !== null) {
		fences.push(fence[1].trim());
		fence = fenceRe.exec(raw);
	}
	candidates.push(...fences.slice().reverse());
	// 逐个括号配对截取（跳过字符串内的括号），从后往前试；跳过嵌套值（前一个非空字符是 { : , [）。
	for (let start = 0; start < raw.length; start += 1) {
		if (raw[start] !== '{' && raw[start] !== '[') continue;
		let previous = start - 1;
		while (previous >= 0 && /\s/.test(raw[previous])) previous -= 1;
		if (previous >= 0 && '{:,[`'.includes(raw[previous])) continue;
		const value = sliceBalancedJson(raw.slice(start));
		if (value !== null) candidates.push(value);
	}
	// 从第一个 { 到最后一个 }。
	const firstBrace = raw.indexOf('{');
	const lastBrace = raw.lastIndexOf('}');
	if (firstBrace >= 0 && lastBrace > firstBrace) candidates.push(raw.slice(firstBrace, lastBrace + 1));
	const firstBracket = raw.indexOf('[');
	const lastBracket = raw.lastIndexOf(']');
	if (firstBracket >= 0 && lastBracket > firstBracket) candidates.push(raw.slice(firstBracket, lastBracket + 1));

	for (const candidate of candidates) {
		if (candidate.trim() === '') continue;
		for (const attempt of [candidate, repairJson(candidate)]) {
			try {
				const parsed = JSON.parse(attempt);
				if (isPlainObject(parsed) || Array.isArray(parsed)) return parsed;
			} catch {
				/* 继续尝试下一个候选 */
			}
		}
	}
	const snippet = raw.slice(0, 160).replace(/\s+/g, ' ');
	const error = new Error(`模型返回的题目内容无法解析为 JSON（开头：${snippet}…）`);
	error.code = 'PARSE_JSON_INVALID';
	error.raw = rawText;
	throw error;
}

// ---------------------------------------------------------------------------
// 字段规范化
// ---------------------------------------------------------------------------

/** 规范化题型枚举。 */
function normalizeType(value, options, answer) {
	const text = asString(value).toLowerCase();
	if (text !== '') {
		for (const [type, aliases] of TYPE_ALIASES) {
			if (aliases.some((alias) => text.includes(alias))) return type;
		}
	}
	// 没有明确 type 时按答案形态推断。
	const keys = Array.isArray(answer) ? answer : [];
	if (options.length > 0) {
		if (keys.length > 1) return 'multiple';
		return 'single';
	}
	if (keys.length > 0 && keys.every((key) => key === '正确' || key === '错误')) return 'judge';
	return 'other';
}

/** 规范化难度枚举。 */
function normalizeDifficulty(value) {
	const text = asString(value).toLowerCase();
	if (text === '') return 'medium';
	for (const [difficulty, aliases] of DIFFICULTY_ALIASES) {
		if (aliases.some((alias) => text.includes(alias))) return difficulty;
	}
	return 'medium';
}

/** 把字母序号（0 → A）转成大写字母 key。 */
function letterAt(index) {
	return String.fromCharCode(65 + index);
}

/** 规范化选项数组，返回 [{key,text}]。 */
function normalizeOptions(rawOptions) {
	const result = [];
	const seen = new Set();
	const push = (rawKey, rawText, fallbackIndex) => {
		let key = asString(rawKey).replace(/[.、:：)）\s]/g, '').toUpperCase();
		if (key.length > 2) key = key.slice(0, 2);
		if (key === '') key = letterAt(fallbackIndex);
		let text = asString(rawText);
		// 选项文本若自带 "A. xxx" 前缀，去掉前缀。
		const prefixed = /^([A-Za-z])\s*[.、:：)]\s*(.+)$/.exec(text);
		if (prefixed && prefixed[1].toUpperCase() === key) text = prefixed[2].trim();
		if (result.some((option) => option.key === key)) return;
		if (seen.has(key)) return;
		seen.add(key);
		result.push({ key, text });
	};

	const source = rawOptions;
	if (Array.isArray(source)) {
		source.forEach((item, index) => {
			if (typeof item === 'string' || typeof item === 'number') {
				const text = asString(item);
				const prefixed = /^([A-Za-z])\s*[.、:：)]\s*(.+)$/.exec(text);
				if (prefixed) push(prefixed[1], prefixed[2], index);
				else push('', text, index);
				return;
			}
			if (isPlainObject(item)) {
				push(item.key ?? item.label ?? item.optionKey ?? item.code ?? item.id, item.text ?? item.content ?? item.value ?? item.option ?? item.desc, index);
			}
		});
	} else if (isPlainObject(source)) {
		Object.entries(source).forEach(([key, value], index) => {
			if (isPlainObject(value)) push(value.key ?? key, value.text ?? value.content ?? value.value, index);
			else push(key, value, index);
		});
	} else {
		const text = asString(source);
		if (text !== '') {
			// "A. 1 B. 2 C. 3" 这类整行选项。
			const matches = [...text.matchAll(/([A-Za-z])\s*[.、:：)）]\s*([^A-Za-z]*?(?=(?:[A-Za-z]\s*[.、:：)）])|$))/g)];
			if (matches.length >= 2) matches.forEach((m, index) => push(m[1], m[2], index));
			else push('', text, 0);
		}
	}
	return result.slice(0, MAX_OPTIONS);
}

/** 判断题答案归一化。 */
/** 判断题答案归一：A/1/true/T/yes → 正确；B/0/false/F/no → 错误（兼容 Canvas True/False 与选项字母两种形态）。 */
function normalizeJudgeValue(value) {
	const text = asString(value);
	if (text === '') return '';
	// 先按「去掉空白、引号、括号、标点」后的整体 token 精确匹配，避免 "A" / "1" / "True" 之类的答案漏掉。
	const token = text.toLowerCase().replace(/[\s\u3000"'“”‘’()（）\[\]【】.。、,，:：;；!！?？/\\|]+/g, '');
	if (['a', '1', 'true', 't', 'yes', 'y', '正确', '对', '是', '√', '✔', '✓', '成立'].includes(token)) return '正确';
	if (['b', '0', 'false', 'f', 'no', 'n', '错误', '错', '否', '×', '✗', '✘', '不成立'].includes(token)) return '错误';
	// 兜底：答案里夹带中文/英文说明的情况。
	if (/正确|对的|对|√|✔|✓|true|成立/i.test(text)) return '正确';
	if (/错误|错的|错|×|✗|✘|false|不成立/i.test(text)) return '错误';
	return text;
}

/** 选择题答案归一化（字符串 "A、C" / "AC" / 选项原文都能映射回 key）。 */
function normalizeChoiceAnswer(rawAnswer, options, type) {
	const values = [];
	const push = (value) => {
		if (value === null || value === undefined) return;
		if (Array.isArray(value)) {
			value.forEach(push);
			return;
		}
		values.push(value);
	};
	push(rawAnswer);
	const optionKeys = options.map((option) => option.key);
	const result = [];
	const addKey = (key) => {
		const upper = asString(key).toUpperCase();
		if (upper === '') return;
		if (!result.includes(upper)) result.push(upper);
	};
	for (const value of values) {
		if (typeof value === 'number') {
			if (Number.isInteger(value) && value >= 0 && value < options.length) addKey(options[value].key);
			continue;
		}
		const text = asString(value);
		if (text === '') continue;
		// 与选项文本完全一致。
		const byText = options.find((option) => normalizeCompare(option.text) === normalizeCompare(text));
		if (byText) {
			addKey(byText.key);
			continue;
		}
		// "AB" / "A、C" / "A C"：纯字母 + 分隔符，按字母集合解析。
		const pureLetters = /^[A-Za-z\s、,，;；/|·]+$/.test(text);
		if (pureLetters && /[A-Za-z]/.test(text)) {
			for (const letter of text.match(/[A-Za-z]/g) ?? []) addKey(letter);
			continue;
		}
		// "A. xxx" 形式。
		const leading = /(?:^|[^A-Za-z])([A-Za-z])\s*[.、:：)）]/.exec(text);
		if (leading && (optionKeys.length === 0 || optionKeys.includes(leading[1].toUpperCase()))) {
			addKey(leading[1]);
			continue;
		}
		// 单独的 "B"（外面可能带中文标点）。
		const single = /(?:^|[^A-Za-z])([A-Za-z])(?:$|[^A-Za-z])/.exec(text);
		if (single) {
			addKey(single[1]);
			continue;
		}
		// 兜底：原样保留，避免丢信息。
		if (!result.includes(text)) result.push(text);
	}
	// 选择题答案按选项顺序排列。
	const ordered = optionKeys.length > 0 ? optionKeys.filter((key) => result.includes(key)) : result;
	const extras = result.filter((key) => !ordered.includes(key));
	const finalAnswer = [...ordered, ...extras];
	return type === 'single' && finalAnswer.length > 1 ? finalAnswer.slice(0, 1) : finalAnswer;
}

/** 判断是否为纯字母选择题答案数组。 */
function looksLikeLetters(answer) {
	return answer.length > 0 && answer.every((item) => /^[A-Z]$/.test(item));
}

/** 生成展示用答案串。 */
function answerDisplayFor(answer, type) {
	const values = Array.isArray(answer) ? answer : [];
	if (values.length === 0) return '';
	if (type === 'single' || type === 'multiple') {
		if (looksLikeLetters(values)) return values.join('、');
		return values.join('；');
	}
	if (type === 'judge') return values[0] ?? '';
	return values.join('；');
}

/** 规范化答案字段，返回数组。 */
function normalizeAnswer(rawAnswer, { type, options }) {
	const raw = rawAnswer === undefined || rawAnswer === null ? [] : rawAnswer;
	if (type === 'judge') {
		const values = (Array.isArray(raw) ? raw : [raw]).map(normalizeJudgeValue).filter((text) => text !== '');
		return values.length > 0 ? [values[0]] : [];
	}
	if (type === 'single' || type === 'multiple') {
		const answer = normalizeChoiceAnswer(raw, options, type);
		if (answer.length === 0) {
			const text = asString(raw);
			if (text !== '') return [text];
		}
		return answer;
	}
	// fill / short / other
	if (isPlainObject(raw)) {
		const text = asString(raw.text ?? raw.value ?? raw.answer ?? raw.content);
		return text === '' ? [] : [text];
	}
	return (Array.isArray(raw) ? raw : [raw])
		.map((value) => {
			if (isPlainObject(value)) return asString(value.text ?? value.value ?? value.content ?? value.answer);
			return asString(value);
		})
		.filter((text) => text !== '');
}

/** 规范化知识点标签。 */
function normalizeTags(rawTags) {
	const values = [];
	const push = (value) => {
		if (typeof value === 'string') {
			value.split(/[、,，;；|/]+/).forEach((part) => {
				const text = part.trim();
				if (text !== '') values.push(text);
			});
			return;
		}
		const text = asString(value);
		if (text !== '') values.push(text);
	};
	if (Array.isArray(rawTags)) rawTags.forEach(push);
	else push(rawTags);
	return uniqueStrings(values).slice(0, MAX_TAGS);
}

/**
 * 规范化图形数组。支持两种形态：
 *   - {kind:'image', path, alt}：Agent 自己生成/裁剪好的图片绝对路径（Host 校验存在后复制到 assets）；
 *   - {kind:'svg', svg}：无法生成图片时由模型输出的内联 SVG（就地清洗）。
 * 缺少有效 path / SVG 的图形丢弃并记 warning；表格不在此处理（表格直接写进 Markdown 文本）。
 */
function normalizeFigures(rawFigures, questionLabel, warnings) {
	const values = [];
	if (Array.isArray(rawFigures)) values.push(...rawFigures);
	else if (rawFigures !== undefined && rawFigures !== null) values.push(rawFigures);
	const figures = [];
	for (const raw of values) {
		const alt = isPlainObject(raw) && asString(raw.alt) !== '' ? asString(raw.alt) : `图${figures.length + 1}`;
		if (isPlainObject(raw)) {
			const kind = asString(raw.kind).toLowerCase();
			const imagePath = asString(raw.path ?? raw.absPath ?? raw.imagePath ?? raw.file ?? raw.image);
			const svgText = asString(raw.svg ?? raw.svgText ?? raw.content ?? raw.code ?? raw.value ?? raw.text);
			if (kind === 'image' || imagePath !== '') {
				if (imagePath === '') {
					warnings.add(`${questionLabel}：有一处图片图形缺少 path（Agent 生成图片的绝对路径），已忽略。`);
					continue;
				}
				figures.push({ kind: 'image', path: imagePath, alt });
				if (figures.length >= MAX_FIGURES_PER_HEAD) break;
				continue;
			}
			if (svgText === '' && kind !== 'svg') {
				warnings.add(`${questionLabel}：有一处图形既没有图片 path 也没有有效 SVG，已忽略。`);
				continue;
			}
		}
		let svg = '';
		if (typeof raw === 'string') svg = raw;
		else if (isPlainObject(raw)) {
			svg = asString(raw.svg ?? raw.svgText ?? raw.content ?? raw.code ?? raw.value ?? raw.text);
			if (svg === '' && asString(raw.kind) === 'svg') svg = asString(raw.markup);
		}
		const cleaned = sanitizeSvg(svg);
		if (cleaned === '') {
			if (asString(svg) !== '' || raw !== undefined) warnings.add(`${questionLabel}：有一处图形既没有图片 path 也没有有效 SVG，已忽略。`);
			continue;
		}
		figures.push({ kind: 'svg', svg: cleaned, alt });
		if (figures.length >= MAX_FIGURES_PER_HEAD) break;
	}
	return figures;
}

/** 题目/材料的展示标题，用于 warnings。 */
function questionLabel(question) {
	const number = asString(question.number);
	return number === '' ? '某题' : `第 ${number} 题`;
}

/** 从共用材料数组/对象里提取材料文本。 */
function normalizeMaterialText(raw) {
	if (typeof raw === 'string') return raw.trim();
	if (Array.isArray(raw)) return raw.map(normalizeMaterialText).filter(Boolean).join('\n\n');
	if (isPlainObject(raw)) return asString(raw.material ?? raw.text ?? raw.content ?? raw.materialText ?? raw.stem);
	return '';
}

/** 规范化 groups：返回 { groups, idMap }，idMap 把模型给的原始 group 标识映射到新的 g* id。 */
function normalizeGroups(rawGroups, warnings) {
	const entries = [];
	if (Array.isArray(rawGroups)) {
		for (const item of rawGroups) {
			if (isPlainObject(item)) entries.push({ rawKey: asString(item.id ?? item.key ?? item.groupId), item });
			else {
				const material = normalizeMaterialText(item);
				if (material !== '') entries.push({ rawKey: '', item: { material } });
			}
		}
	} else if (isPlainObject(rawGroups)) {
		for (const [key, value] of Object.entries(rawGroups)) {
			entries.push({ rawKey: asString(key), item: isPlainObject(value) ? value : { material: normalizeMaterialText(value) } });
		}
	}
	const groups = [];
	const idMap = new Map();
	for (const entry of entries) {
		const material = truncate(normalizeMaterialText(entry.item.material ?? entry.item.text ?? entry.item.content ?? entry.item.stem), MAX_STEM_CHARS);
		const figures = normalizeFigures(entry.item.figures ?? entry.item.images ?? entry.item.pictures, '共用材料', warnings);
		if (material === '' && figures.length === 0) continue;
		const explicitHasVisual = typeof entry.item.hasVisual === 'boolean'
			? entry.item.hasVisual
			: (typeof entry.item.has_visual === 'boolean' ? entry.item.has_visual : undefined);
		const hasVisual = explicitHasVisual !== undefined ? explicitHasVisual : figures.length > 0;
		const id = `g${groups.length + 1}`;
		groups.push({ id, material, figures, hasVisual });
		if (entry.rawKey !== '') idMap.set(entry.rawKey, id);
		idMap.set(String(groups.length - 1), id);
		idMap.set(id, id);
	}
	return { groups, idMap };
}

// ---------------------------------------------------------------------------
// 归一化单个解析结果
// ---------------------------------------------------------------------------

/** 把模型返回的原始题目对象规范化，返回 { question, warnings } 或 null（空题）。 */
function normalizeQuestion(rawQuestion, options) {
	const { index, groupIdMap } = options;
	const bag = createWarningBag();
	if (typeof rawQuestion === 'string') {
		const stem = rawQuestion.trim();
		if (stem === '') return null;
		return {
			question: {
				id: '',
				number: String(index + 1),
				type: 'other',
				groupId: null,
				stem: truncate(stem, MAX_STEM_CHARS),
				options: [],
				answer: [],
				answerDisplay: '',
				analysis: '',
				hasAnswer: false,
				answerSource: null,
				answerRefs: [],
				answerFigures: [],
				hasVisual: false,
				figures: [],
				tags: [],
				difficulty: 'medium'
			},
			warnings: bag.finish()
		};
	}
	if (!isPlainObject(rawQuestion)) return null;

	const stem = truncate(asString(
		rawQuestion.stem ?? rawQuestion.question ?? rawQuestion.title ?? rawQuestion.text ?? rawQuestion.content
	), MAX_STEM_CHARS);
	const rawOptions = rawQuestion.options ?? rawQuestion.choices ?? rawQuestion.optionList;
	const optionsList = normalizeOptions(rawOptions);
	const rawAnswer = rawQuestion.answer ?? rawQuestion.answers ?? rawQuestion.correctAnswer ?? rawQuestion.answerKey
		?? rawQuestion.correct ?? rawQuestion.solution;
	const rawType = rawQuestion.type ?? rawQuestion.questionType ?? rawQuestion.kind ?? rawQuestion.category;
	const answer = normalizeAnswer(rawAnswer, { type: '', options: optionsList });
	const type = normalizeType(rawType, optionsList, answer);
	// type 确定后对答案做一次更强的归一化（例如判断题）。
	const finalAnswer = normalizeAnswer(rawAnswer, { type, options: optionsList });
	const figures = normalizeFigures(
		rawQuestion.figures ?? rawQuestion.images ?? rawQuestion.pictures ?? rawQuestion.diagrams ?? rawQuestion.svg,
		'某题',
		bag
	);
	const answerFigures = normalizeFigures(
		rawQuestion.answerFigures ?? rawQuestion.answerImages ?? rawQuestion.answerPictures,
		'某题答案',
		bag
	);
	const explicitHasVisual = typeof rawQuestion.hasVisual === 'boolean'
		? rawQuestion.hasVisual
		: (typeof rawQuestion.has_visual === 'boolean' ? rawQuestion.has_visual : undefined);
	const hasVisual = explicitHasVisual !== undefined ? explicitHasVisual : figures.length > 0;
	const questionNumber = asString(
		rawQuestion.number ?? rawQuestion.no ?? rawQuestion.questionNo ?? rawQuestion.serial ?? rawQuestion.num
	) || (/^\d+$/.test(asString(rawQuestion.id)) ? asString(rawQuestion.id) : '') || String(index + 1);

	if (stem === '' && optionsList.length === 0 && figures.length === 0) return null;

	const rawGroupId = asString(rawQuestion.groupId ?? rawQuestion.group ?? rawQuestion.materialId ?? rawQuestion.materialGroup);
	let groupId = null;
	if (rawGroupId !== '') {
		groupId = groupIdMap.get(rawGroupId) ?? groupIdMap.get(rawGroupId.toLowerCase()) ?? null;
		if (groupId === null) bag.add(`第 ${questionNumber} 题引用了不存在的共用材料（${rawGroupId}），已按独立题处理。`);
	}

	const analysis = truncate(asString(
		rawQuestion.analysis ?? rawQuestion.explanation ?? rawQuestion.solutionText ?? rawQuestion.parse
		?? rawQuestion.solving ?? rawQuestion.comment
	), MAX_ANALYSIS_CHARS);

	// 两阶段参考答案：解析阶段只接受原卷答案。
	// 显式 hasAnswer 优先；兼容旧模型输出（answer 或 analysis 非空即视为原卷有答案）。
	const explicitHasAnswer = typeof rawQuestion.hasAnswer === 'boolean'
		? rawQuestion.hasAnswer
		: (typeof rawQuestion.has_answer === 'boolean' ? rawQuestion.has_answer : undefined);
	const hasAnswer = explicitHasAnswer !== undefined
		? explicitHasAnswer
		: (finalAnswer.length > 0 || analysis !== '');
	const answerForQuestion = hasAnswer ? finalAnswer : [];
	const answerDisplayBase = asString(
		rawQuestion.answerDisplay ?? rawQuestion.answerText ?? rawQuestion.answerShow ?? rawQuestion.displayAnswer
	);
	// 判断题的展示答案统一归一为「正确 / 错误」（即使原卷写的是 True/False/A/B）。
	const answerDisplay = hasAnswer
		? (type === 'judge' && answerForQuestion.length > 0
			? answerDisplayFor(answerForQuestion, 'judge')
			: (answerDisplayBase || answerDisplayFor(answerForQuestion, type)))
		: '';

	return {
		question: {
			id: '',
			number: questionNumber,
			type,
			groupId,
			stem,
			options: optionsList,
			answer: answerForQuestion,
			answerDisplay,
			analysis,
			hasAnswer,
			answerSource: hasAnswer ? 'source' : null,
			answerRefs: [],
			answerFigures,
			hasVisual,
			figures,
			tags: normalizeTags(rawQuestion.tags ?? rawQuestion.knowledgePoints ?? rawQuestion.knowledge ?? rawQuestion.kp),
			difficulty: normalizeDifficulty(rawQuestion.difficulty ?? rawQuestion.level ?? rawQuestion.hardness)
		},
		warnings: bag.finish()
	};
}

/** 把已规范化的题目/组重新编号（q1、g1…），并重映射 groupId。 */
function reindexSet(set) {
	const groupIdMap = new Map();
	const groups = set.groups.map((group, index) => {
		const id = `g${index + 1}`;
		groupIdMap.set(group.id, id);
		return { ...group, id };
	});
	const questions = set.questions.map((question, index) => ({
		...question,
		id: `q${index + 1}`,
		groupId: question.groupId === null ? null : (groupIdMap.get(question.groupId) ?? null)
	}));
	return { ...set, groups, questions };
}

/** 从原始 JSON 构建 set（单批）。 */
function buildSetFromRaw(rawValue, { courseId, setId, titleFallback, now }) {
	const warnings = createWarningBag();
	let raw = rawValue;
	if (Array.isArray(raw)) raw = { questions: raw };
	if (!isPlainObject(raw)) throw new Error('模型返回的题目 JSON 顶层不是对象或数组。');
	if (isPlainObject(raw.data) && !Array.isArray(raw.questions) && !Array.isArray(raw.groups)) raw = { ...raw, ...raw.data };
	if (isPlainObject(raw.result) && !Array.isArray(raw.questions)) raw = { ...raw, ...raw.result };
	// 只有单题字段时按一题处理。
	if (!Array.isArray(raw.questions) && (asString(raw.stem) !== '' || Array.isArray(raw.options))) {
		raw = { ...raw, questions: [raw] };
	}
	if (!Array.isArray(raw.questions)) {
		throw new Error('模型返回的 JSON 中没有 questions 题目数组。');
	}

	const { groups, idMap } = normalizeGroups(raw.groups ?? raw.materials ?? raw.materialGroups, warnings);
	const questions = [];
	let dropped = 0;
	raw.questions.forEach((rawQuestion, index) => {
		const normalized = normalizeQuestion(rawQuestion, { index, groupIdMap: idMap, warnings });
		if (normalized === null) {
			dropped += 1;
			return;
		}
		normalized.warnings.forEach((message) => warnings.add(message));
		questions.push(normalized.question);
	});
	const set = reindexSet({
		id: setId,
		courseId,
		title: asString(raw.title ?? raw.setTitle ?? raw.name) || titleFallback || '未命名套题',
		createdAt: now,
		updatedAt: now,
		pages: [],
		groups,
		questions,
		warnings: []
	});
	return {
		set,
		warnings: warnings.finish(),
		dropped
	};
}

/**
 * 解析并规范化模型返回的一套题目 JSON。
 *
 * 容错：裸 JSON、```json 代码块、前后夹带解释文字、尾逗号、单题顶层对象、数组顶层。
 * 返回的 `set` 符合 `docs/CONTRACT.md` 3.2 节；其中 `figures[].svg` 是**内联 SVG 文本**，
 * 由调用方（tasks.parseSet）负责落盘到 assets/ 并把 relPath 写回。
 *
 * @param {string} rawText 模型原始输出
 * @param {{courseId?: string, setId?: string, titleFallback?: string, now?: number}} [options]
 * @returns {{set: object, warnings: string[]}}
 * @throws {Error} 完全无法解析出 JSON 时抛出中文错误
 */
export function normalizeParsedSet(rawText, options = {}) {
	const rawValue = extractJsonValue(rawText);
	const now = Number.isFinite(options.now) ? options.now : Date.now();
	const { set, warnings, dropped } = buildSetFromRaw(rawValue, {
		courseId: options.courseId ?? '',
		setId: options.setId ?? '',
		titleFallback: options.titleFallback ?? '',
		now
	});
	if (dropped > 0) warnings.unshift(`已忽略 ${dropped} 道缺少题干与选项的空题。`);
	if (set.questions.length > MAX_QUESTIONS) {
		warnings.push(`题目数量超过 ${MAX_QUESTIONS} 道上限，已截断。`);
		set.questions = set.questions.slice(0, MAX_QUESTIONS);
		set.questions = reindexSet(set).questions;
	}
	if (set.questions.length === 0) {
		const error = new Error('模型没有识别出任何题目，请确认上传的文件是否清晰完整。');
		error.code = 'PARSE_NO_QUESTIONS';
		throw error;
	}
	const finalWarnings = uniqueStrings(warnings);
	set.warnings = finalWarnings;
	return { set, warnings: finalWarnings };
}

/** 题目去重键：题号 + 题干前 40 字。 */
function questionDedupeKey(question) {
	const number = normalizeCompare(question.number);
	const stem = normalizeCompare(question.stem).slice(0, 40);
	return `${number}|${stem}`;
}

/** 两份同一道题（跨批重叠）时合并字段，保留信息更全的一份；原卷答案优先。 */
function mergeQuestion(existing, incoming) {
	const merged = { ...existing };
	const existingHasAnswer = existing.hasAnswer === true;
	const incomingHasAnswer = incoming.hasAnswer === true;
	// 后一批（重叠页补全）提供了原卷答案时，覆盖先前空答案。
	if (incomingHasAnswer && !existingHasAnswer) {
		merged.hasAnswer = true;
		merged.answer = incoming.answer;
		merged.answerDisplay = incoming.answerDisplay;
		merged.answerSource = 'source';
	} else if (incomingHasAnswer && existingHasAnswer && incoming.answer.length > merged.answer.length) {
		merged.answer = incoming.answer;
		merged.answerDisplay = incoming.answerDisplay;
	}
	for (const key of ['stem', 'analysis']) {
		if (asString(merged[key]) === '' && asString(incoming[key]) !== '') merged[key] = incoming[key];
	}
	if (merged.hasAnswer === true && asString(merged.answerDisplay) === '' && asString(incoming.answerDisplay) !== '') {
		merged.answerDisplay = incoming.answerDisplay;
	}
	if (incoming.options.length > merged.options.length) merged.options = incoming.options;
	if (incoming.figures.length > merged.figures.length) merged.figures = incoming.figures;
	if (incoming.hasVisual === true || merged.hasVisual === true) {
		merged.hasVisual = true;
		if (incoming.figures.length > 0) merged.figures = incoming.figures;
	}
	if (incoming.tags.length > merged.tags.length) merged.tags = incoming.tags;
	if (incoming.groupId !== null && merged.groupId === null) merged.groupId = incoming.groupId;
	if (incoming.analysis !== '' || incoming.stem !== '') merged.difficulty = merged.difficulty || incoming.difficulty;

	merged.hasAnswer = existingHasAnswer || incomingHasAnswer;
	if (merged.hasAnswer) {
		merged.answerSource = 'source';
		merged.answerRefs = [];
	} else {
		// 解析阶段不产生 AI 答案，缺失答案保持空并等待第二阶段生成。
		merged.answer = [];
		merged.answerDisplay = '';
		merged.answerSource = merged.answerSource ?? null;
		merged.answerRefs = Array.isArray(merged.answerRefs) ? merged.answerRefs : [];
	}
	return merged;
}

/**
 * 合并多批解析结果（每批 normalizeParsedSet 的返回值），跨批去重并重新编号。
 * 相邻批次有 1 页重叠，重叠页里的题会被识别为重复并合并。
 *
 * @param {Array<{set: object, warnings?: string[]}>} parts
 * @param {{courseId?: string, setId?: string, titleFallback?: string, now?: number}} [options]
 * @returns {{set: object, warnings: string[]}}
 */
export function mergeParsedSets(parts, options = {}) {
	const list = Array.isArray(parts) ? parts.filter((part) => isPlainObject(part) && isPlainObject(part.set)) : [];
	if (list.length === 0) throw new Error('没有可合并的解析结果。');
	const now = Number.isFinite(options.now) ? options.now : Date.now();
	const warnings = createWarningBag();
	list.forEach((part) => (part.warnings ?? []).forEach((message) => warnings.add(message)));

	// 合并共用材料：材料文本相同则视为同一 group。
	const groups = [];
	const groupKeyToId = new Map();
	const partGroupMaps = [];
	for (const part of list) {
		const map = new Map();
		for (const group of part.set.groups ?? []) {
			const key = `${normalizeCompare(group.material)}|${(group.figures ?? []).map((figure) => normalizeCompare(figure.svg)).join(',')}`;
			let id = groupKeyToId.get(key);
			if (id === undefined) {
				id = `g${groups.length + 1}`;
				groupKeyToId.set(key, id);
				groups.push({
					id,
					material: group.material ?? '',
					figures: group.figures ?? [],
					hasVisual: group.hasVisual === true || (group.figures ?? []).length > 0,

				});
			} else {
				// 同一材料在多个批次出现：合并图形（优先更多/更完整的一份）。
				const existing = groups.find((item) => item.id === id);
				if (existing !== undefined) {
					if (group.hasVisual === true || (group.figures ?? []).length > 0) existing.hasVisual = true;
					if ((group.figures ?? []).length > (existing.figures ?? []).length) existing.figures = group.figures;
				}
			}
			map.set(group.id, id);
		}
		partGroupMaps.push(map);
	}

	const mergedQuestions = [];
	const byKey = new Map();
	let duplicateNumberDiffContent = 0;
	list.forEach((part, partIndex) => {
		const groupMap = partGroupMaps[partIndex];
		for (const question of part.set.questions ?? []) {
			const remapped = {
				...question,
				groupId: question.groupId === null ? null : (groupMap.get(question.groupId) ?? null)
			};
			const key = questionDedupeKey(remapped);
			const numberOnlyKey = normalizeCompare(remapped.number) === '' ? null : `#${normalizeCompare(remapped.number)}`;
			const existingIndex = byKey.get(key);
			if (existingIndex !== undefined) {
				mergedQuestions[existingIndex] = mergeQuestion(mergedQuestions[existingIndex], remapped);
				continue;
			}
			// 题号相同但题干不同：如果题干高度相似也合并，否则两题都保留（可能是同号不同卷的错误数据）。
			if (numberOnlyKey !== null) {
				const numberMatch = byKey.get(numberOnlyKey);
				if (numberMatch !== undefined) {
					const existing = mergedQuestions[numberMatch];
					const stemA = normalizeCompare(existing.stem).slice(0, 24);
					const stemB = normalizeCompare(remapped.stem).slice(0, 24);
					if (stemA !== '' && stemB !== '' && (stemA.includes(stemB) || stemB.includes(stemA))) {
						mergedQuestions[numberMatch] = mergeQuestion(existing, remapped);
						continue;
					}
					duplicateNumberDiffContent += 1;
				}
				if (byKey.get(numberOnlyKey) === undefined) byKey.set(numberOnlyKey, mergedQuestions.length);
			}
			byKey.set(key, mergedQuestions.length);
			mergedQuestions.push(remapped);
		}
	});
	if (duplicateNumberDiffContent > 0) {
		warnings.add(`有 ${duplicateNumberDiffContent} 个题号在不同批次中内容不同，已全部保留，请核对。`);
	}

	// 统一重编号。
	const groupIdRemap = new Map(groups.map((group, index) => [group.id, `g${index + 1}`]));
	const finalGroups = groups.map((group, index) => ({ ...group, id: `g${index + 1}` }));
	let questions = mergedQuestions.map((question, index) => ({
		...question,
		id: `q${index + 1}`,
		groupId: question.groupId === null ? null : (groupIdRemap.get(question.groupId) ?? null)
	}));
	if (questions.length > MAX_QUESTIONS) {
		warnings.add(`题目数量超过 ${MAX_QUESTIONS} 道上限，已截断。`);
		questions = questions.slice(0, MAX_QUESTIONS).map((question, index) => ({ ...question, id: `q${index + 1}` }));
	}

	const title = asString(list.find((part) => asString(part.set.title) !== '')?.set.title)
		|| options.titleFallback
		|| '未命名套题';
	const set = {
		id: options.setId ?? list[0].set.id ?? '',
		courseId: options.courseId ?? list[0].set.courseId ?? '',
		title,
		createdAt: now,
		updatedAt: now,
		pages: [],
		groups: finalGroups,
		questions,
		warnings: []
	};
	const finalWarnings = uniqueStrings(warnings.finish());
	set.warnings = finalWarnings;
	if (questions.length === 0) {
		const error = new Error('所有批次都没有识别出题目，请确认上传的文件是否清晰完整。');
		error.code = 'PARSE_NO_QUESTIONS';
		throw error;
	}
	return { set, warnings: finalWarnings };
}

// ---------------------------------------------------------------------------
// 图形重试判定
// ---------------------------------------------------------------------------

const FIGURE_INVALID_WARNING_RE = /无法转换为有效 SVG|SVG 无效|图形无法/;

/**
 * 判断一页解析结果是否需要做「图形重绘重试」：
 *   - 任一共用材料/题目 hasVisual===true 但 figures 为空；
 *   - 或 normalize 产生「图形无法转换为有效 SVG」类 warning。
 * tasks.parseSet 每页解析后命中时，会用同一页图片再重试一次并要求输出合法 SVG。
 *
 * @param {{set?: object, warnings?: string[]}|object} parsed normalizeParsedSet / mergeParsedSets 的返回值
 * @param {string[]} [warnings] 额外 warnings（默认使用 parsed.warnings）
 * @returns {boolean}
 */
export function needsFigureRetry(parsed, warnings) {
	const set = isPlainObject(parsed?.set) ? parsed.set : (isPlainObject(parsed) ? parsed : null);
	if (set === null) return false;
	const heads = [
		...(Array.isArray(set.groups) ? set.groups : []),
		...(Array.isArray(set.questions) ? set.questions : [])
	];
	const missing = heads.some((head) => isPlainObject(head)
		&& head.hasVisual === true
		&& (!Array.isArray(head.figures) || head.figures.length === 0));
	if (missing) return true;
	const messages = Array.isArray(warnings)
		? warnings
		: (Array.isArray(parsed?.warnings) ? parsed.warnings : []);
	return messages.some((message) => FIGURE_INVALID_WARNING_RE.test(String(message)));
}

// ---------------------------------------------------------------------------
// 解析题目：Agent 短提示 + 结构化提交工具
// ---------------------------------------------------------------------------

/** 图形字段 schema（Agent 提交裁剪图片路径或内联 SVG）。 */
const FIGURE_SCHEMA = {
	type: 'array',
	items: {
		type: 'object',
		properties: {
			kind: { type: 'string', enum: ['image', 'svg'] },
			path: { type: 'string', description: '裁剪/生成图片的绝对路径（kind=image）' },
			svg: { type: 'string', description: '内联 SVG 文本（kind=svg）' },
			alt: { type: 'string' }
		},
		required: ['kind']
	}
};

/** 题目对象 schema：解析结果的结构同时写在提示词和工具 schema 里。 */
const QUESTION_SCHEMA = {
	type: 'object',
	properties: {
		number: { type: 'string', description: '原题号，保留原样' },
		type: { type: 'string', enum: ['single', 'multiple', 'judge', 'fill', 'short', 'other'] },
		stem: { type: 'string', description: '题干（不含选项）；保留原文空格、缩进与换行' },
		options: {
			type: 'array',
			items: {
				type: 'object',
				properties: { key: { type: 'string' }, text: { type: 'string' } },
				required: ['key', 'text']
			}
		},
		hasAnswer: { type: 'boolean', description: '原卷是否明确给出答案；没有就 false，不要自行解题' },
		answer: { type: 'array', items: { type: 'string' } },
		answerDisplay: { type: 'string' },
		answerFigures: FIGURE_SCHEMA,
		analysis: { type: 'string', description: '只转录原卷解析；没有就空字符串' },
		groupId: { type: 'string', description: '共用材料组 id；独立题不填' },
		hasVisual: { type: 'boolean' },
		figures: FIGURE_SCHEMA,
		tags: { type: 'array', items: { type: 'string' } },
		difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] }
	},
	required: ['number', 'stem']
};

/** 解析输出的文本格式：必须明确告诉 Agent 字段名，结果才能直接匹配。 */
const PARSE_JSON_FORMAT = `{
  "title": "卷名",
  "groups": [{"id": "g1", "material": "共用材料", "hasVisual": false, "figures": []}],
  "questions": [{
    "number": "1",
    "type": "single|multiple|judge|fill|short",
    "stem": "题干",
    "options": [{"key": "A", "text": "选项文本"}],
    "hasAnswer": true,
    "answer": ["B"],
    "answerDisplay": "B",
    "answerFigures": [{"kind": "image", "path": "/abs/answer-fig.png", "alt": "答案图1"}],
    "analysis": "原卷解析，没有就空字符串",
    "groupId": null,
    "hasVisual": false,
    "figures": [{"kind": "image", "path": "/abs/fig1.png", "alt": "图1"}],
    "tags": [],
    "difficulty": "medium"
  }]
}`;

/** 解析结果提交工具：Agent 调一次，Host 直接拿到结构化对象，不再从回答文本里抠 JSON。 */
export const PARSE_RESULT_TOOL = {
	name: 'submit_questions',
	description: '解析完成后调用一次，提交这套题的全部题目（包括共用材料）。',
	parameters: {
		type: 'object',
		properties: {
			title: { type: 'string' },
			groups: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						material: { type: 'string', description: '共用材料全文；表格用 Markdown 表格' },
						hasVisual: { type: 'boolean' },
						figures: FIGURE_SCHEMA
					},
					required: ['id', 'material']
				}
			},
			questions: { type: 'array', items: QUESTION_SCHEMA }
		},
		required: ['questions']
	},
	outputSchema: { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'] }
};


/** 文件清单：支持字符串或 {name} 对象。 */
function formatFileNames(files) {
	return (Array.isArray(files) ? files : [])
		.map((file) => (isPlainObject(file) ? asString(file.name ?? file.relPath) : asString(file)))
		.filter((name) => name !== '')
		.map((name) => `- ${name}`)
		.join('\n');
}

/**
 * 组装解析题目的 Agent 提示：直接给原始文件（不转页面图片），
 * 并用完整 JSON 格式说明字段，保证结果能直接匹配。
 *
 * @param {object} options
 * @param {string} [options.courseName]
 * @param {Array<string|{name:string}>} [options.files] 题目文件（相对于工作目录）
 * @param {string} [options.workingDir] Agent 工作目录（绝对路径）
 * @param {boolean} [options.retry]
 * @returns {string} promptText
 */
export function buildParseAgentPrompt({ courseName, files, workingDir, retry } = {}) {
	const lines = ['解析下面这些题目文件，按指定 JSON 格式输出全部题目。'];
	if (asString(courseName) !== '') lines.push(`课程：${asString(courseName)}`);
	if (asString(workingDir) !== '') lines.push(`工作目录：${asString(workingDir)}`);
	const fileList = formatFileNames(files);
	if (fileList !== '') lines.push(`# 题目文件\n${fileList}`);
	lines.push(`# 输出格式（字段名必须完全一致）\n${PARSE_JSON_FORMAT}`);
	lines.push('# 要求');
	lines.push('1. 用 read / read_image 读取文件；PDF / Office 优先提取文本层。**不要为图形做裁剪、截图或 OCR**：图形能内联 SVG 就写，不能就留空；先把全部题目文本整理完。');
	lines.push('2. 原卷明确给出答案或解析时才填 hasAnswer=true；没有就 hasAnswer=false、answer=[]、answerDisplay=""，不要自行解题。');
	lines.push('3. 表格用 Markdown 表格直接写进 stem / analysis；图形（UML、流程图、坐标图、截图）用内联 SVG 或图片绝对路径放进 figures，并置 hasVisual=true。答案里的图放进 answerFigures。');
	lines.push('4. 保留英文单词之间的空格、代码缩进与真实换行；共用材料放进 groups，并用 groupId 关联。');
	lines.push('5. 只输出 JSON（也可以调用 submit_questions 提交同一份 JSON），不要输出解释文字；不要只描述你正在做什么，必须给出完整 JSON。');
	if (retry === true) lines.push('上一轮的图形无效：请为 hasVisual 的题/材料提供可读取的图片路径或合法 SVG。');
	return lines.join('\n');
}
// 展示辅助
// ---------------------------------------------------------------------------

/** 格式化的题型名。 */
function typeLabel(type) {
	return TYPE_LABELS[type] ?? '题目';
}

/** 把题目对象格式化为提示词里的文本块。 */
function formatQuestionBlock(question) {
	if (!isPlainObject(question)) return '';
	const lines = [];
	const number = asString(question.number);
	lines.push(`${number === '' ? '当前题目' : `第 ${number} 题`}（${typeLabel(question.type)}）`);
	if (asString(question.stem) !== '') lines.push(`题干：${question.stem}`);
	const options = Array.isArray(question.options) ? question.options : [];
	if (options.length > 0) {
		lines.push('选项：');
		options.forEach((option) => lines.push(`${option.key}. ${option.text}`));
	}
	const answer = Array.isArray(question.answer) ? question.answer : [];
	const display = asString(question.answerDisplay) || answerDisplayFor(answer, question.type);
	if (display !== '') lines.push(`参考答案：${display}`);
	if (asString(question.analysis) !== '') lines.push(`解析：${question.analysis}`);
	const figures = Array.isArray(question.figures) ? question.figures : [];
	if (figures.length > 0) lines.push(`附图：${figures.map((figure, index) => asString(figure.alt) || `图${index + 1}`).join('、')}`);
	return lines.join('\n');
}

/** 把共用材料格式化为文本块。 */
function formatMaterials(materials) {
	const list = [];
	if (Array.isArray(materials)) {
		for (const material of materials) {
			if (typeof material === 'string') {
				if (material.trim() !== '') list.push(material.trim());
				continue;
			}
			if (isPlainObject(material)) {
				const text = asString(material.material ?? material.text ?? material.content ?? material.materialText);
				if (text !== '') list.push(`【${asString(material.title) || '共用材料'}】\n${text}`);
			}
		}
	} else if (typeof materials === 'string' && materials.trim() !== '') {
		list.push(materials.trim());
	}
	return list.join('\n\n');
}

/** 把检索出的课程文档片段格式化为文本块。 */
function formatDocs(docs) {
	const list = Array.isArray(docs) ? docs : [];
	const blocks = [];
	for (const doc of list) {
		if (!isPlainObject(doc)) continue;
		const name = asString(doc.name) || '课程文档';
		const chunks = Array.isArray(doc.chunks)
			? doc.chunks.map((chunk) => (typeof chunk === 'string' ? chunk : asString(chunk?.text))).filter((text) => text !== '')
			: (asString(doc.text) !== '' ? [asString(doc.text)] : []);
		if (chunks.length === 0) continue;
		blocks.push(`《${name}》\n${chunks.join('\n…\n')}`);
	}
	return blocks.join('\n\n');
}

// ---------------------------------------------------------------------------
// 课程文档相对路径与目录树
// ---------------------------------------------------------------------------

const DOC_TREE_MAX_LINES = 80;
const DOC_TREE_MAX_DIR_DEPTH = 3;
const DOC_REL_PATH_RE = /^courses\/([^/]+)\/docs\/([^/]+)\/(.+)$/;

/** 规范化相对路径：统一斜杠，去掉空段与 `.` / `..`。 */
function normalizeRelativePath(value) {
	const raw = typeof value === 'string' ? value.replace(/\\/g, '/').trim() : '';
	if (raw === '') return '';
	return raw
		.split('/')
		.map((segment) => segment.trim())
		.filter((segment) => segment !== '' && segment !== '.' && segment !== '..')
		.join('/');
}

/**
 * 推导课程文档相对于 `courses/<courseId>/docs/<docId>/` 的相对路径（用于 AI 检索/引用）。
 * 优先级：`doc.relativePath` → 从 `doc.relPath` 去前缀推导 → `doc.name`（基名）。
 * 兼容没有 relativePath 的旧数据；路径会统一成 `/` 分隔、去掉空段与 `..`。
 *
 * @param {object} doc store.json 里的 doc 记录
 * @param {string} [courseId] 课程 id（旧数据从 relPath 推导时用于匹配前缀）
 * @returns {string} 相对路径（如 `第一章/1.1 极限.pdf`），无法推导时返回 `未命名文档`
 */
export function docRelativePath(doc, courseId) {
	if (!isPlainObject(doc)) return '';
	const direct = normalizeRelativePath(doc.relativePath);
	if (direct !== '') return direct;
	const relPath = normalizeRelativePath(doc.relPath);
	const cid = asString(courseId);
	const docId = asString(doc.id);
	if (relPath !== '') {
		if (cid !== '' && docId !== '') {
			const prefix = `courses/${cid}/docs/${docId}/`;
			if (relPath.startsWith(prefix)) {
				const rest = normalizeRelativePath(relPath.slice(prefix.length));
				if (rest !== '') return rest;
			}
		}
		// 旧数据：courseId/docId 缺失时用通用模式匹配。
		const match = DOC_REL_PATH_RE.exec(relPath);
		if (match !== null
			&& (cid === '' || match[1] === cid)
			&& (docId === '' || match[2] === docId)) {
			const rest = normalizeRelativePath(match[3]);
			if (rest !== '') return rest;
		}
	}
	const fallback = normalizeRelativePath(doc.name);
	return fallback !== '' ? fallback : '未命名文档';
}

/** 收集目录树条目：仅 textRelPath 可检索的文档，按相对路径去重。 */
function docTreeEntries(courseDocs, courseId) {
	const docs = Array.isArray(courseDocs) ? courseDocs : [];
	const entries = [];
	const seen = new Set();
	for (const doc of docs) {
		if (!isPlainObject(doc)) continue;
		if (asString(doc.textRelPath) === '') continue;
		const relPath = docRelativePath(doc, courseId);
		const segments = relPath.split('/').filter((segment) => segment !== '');
		if (segments.length === 0 || seen.has(relPath)) continue;
		seen.add(relPath);
		entries.push({ relPath, segments });
	}
	return entries;
}

/** 构建目录树：目录层级最多 DOC_TREE_MAX_DIR_DEPTH 层，更深的目录折叠进文件名。 */
function buildDocTree(entries) {
	const root = { dirs: new Map(), files: [] };
	for (const entry of entries) {
		const { segments } = entry;
		const fileName = segments[segments.length - 1];
		const dirs = segments.slice(0, -1);
		let node = root;
		let depth = 0;
		let index = 0;
		for (; index < dirs.length && depth < DOC_TREE_MAX_DIR_DEPTH; index += 1, depth += 1) {
			let child = node.dirs.get(dirs[index]);
			if (child === undefined) {
				child = { dirs: new Map(), files: [] };
				node.dirs.set(dirs[index], child);
			}
			node = child;
		}
		const restDirs = dirs.slice(index);
		const label = restDirs.length > 0 ? `${restDirs.join('/')}/${fileName}` : fileName;
		if (!node.files.includes(label)) node.files.push(label);
	}
	return root;
}

/** 把目录树渲染成缩进文本行（目录在前、文件在后，均按名称排序）。 */
function renderDocTreeLines(root) {
	const compare = (left, right) => left.localeCompare(right, 'zh-Hans-CN', { numeric: true });
	const lines = [];
	const visit = (node, depth) => {
		const indent = '  '.repeat(depth);
		for (const dirName of [...node.dirs.keys()].sort(compare)) {
			lines.push(`${indent}- ${dirName}/`);
			visit(node.dirs.get(dirName), depth + 1);
		}
		for (const fileName of [...node.files].sort(compare)) lines.push(`${indent}- ${fileName}`);
	};
	visit(root, 0);
	return lines;
}

/**
 * 生成「课程文档目录」文本树，供对话/学情分析 prompt 让模型定位课程资料。
 * 只列出可检索文档（textRelPath 非空）；目录按层级缩进、目录在前文件在后；
 * 最多 DOC_TREE_MAX_LINES 行，超出截断并注明；目录层级最多 3 层，更深目录折叠进文件名。
 *
 * @param {Array<object>} courseDocs store.json 的 course.docs
 * @param {{courseId?: string}} [options]
 * @returns {string} 目录树文本；没有可检索文档时返回空串
 */
export function formatDocTree(courseDocs, { courseId } = {}) {
	const entries = docTreeEntries(courseDocs, courseId);
	if (entries.length === 0) return '';
	const lines = renderDocTreeLines(buildDocTree(entries));
	const header = `课程文档目录（共 ${entries.length} 个文件，仅列出可检索文档；引用资料时请使用相对路径）：`;
	const kept = lines.slice(0, DOC_TREE_MAX_LINES - 1);
	const parts = [header, ...kept];
	if (lines.length > kept.length) {
		parts.push(`…（目录过长，仅显示前 ${kept.length} 行，共 ${entries.length} 个文件）`);
	}
	return parts.join('\n');
}

/** 百分比格式化。 */
function formatPercent(value) {
	const number = asNumber(value);
	if (number === null) return '—';
	const percent = number <= 1 ? number * 100 : number;
	return `${Math.round(percent * 10) / 10}%`;
}

/** 把统计对象格式化为可读文本。 */
function formatStats(stats) {
	if (!isPlainObject(stats)) return '（暂无统计数据）';
	const lines = [];
	const scope = asString(stats.scopeLabel) || asString(stats.label) || '本课程';
	lines.push(`统计范围：${scope}`);
	const pairs = [
		['套题数', asNumber(stats.setCount)],
		['题目总数', asNumber(stats.questionTotal)],
		['已作答', asNumber(stats.answeredCount)],
		['答对', asNumber(stats.correctCount)],
		['答错', asNumber(stats.wrongCount)]
	];
	const line = pairs
		.filter(([, value]) => value !== null)
		.map(([label, value]) => `${label} ${value}`)
		.join('；');
	if (line !== '') lines.push(line);
	if (asNumber(stats.accuracy) !== null) lines.push(`总正确率：${formatPercent(stats.accuracy)}`);
	if (asNumber(stats.practiceDays) !== null) lines.push(`有练习记录的天数：${asNumber(stats.practiceDays)}`);
	const typeStats = Array.isArray(stats.typeStats) ? stats.typeStats : [];
	if (typeStats.length > 0) {
		lines.push('分题型正确率：');
		for (const item of typeStats) {
			if (!isPlainObject(item)) continue;
			const label = asString(item.label) || typeLabel(asString(item.type)) || '其他';
			const total = asNumber(item.total);
			const answered = asNumber(item.answered);
			const correct = asNumber(item.correct);
			const accuracy = asNumber(item.accuracy);
			lines.push(`- ${label}：共 ${total ?? '—'} 题，已答 ${answered ?? '—'}，正确 ${correct ?? '—'}，正确率 ${formatPercent(accuracy)}`);
		}
	}
	const recent = Array.isArray(stats.recent) ? stats.recent : [];
	if (recent.length > 0) {
		lines.push('最近练习趋势（按天）：');
		for (const item of recent) {
			if (!isPlainObject(item)) continue;
			lines.push(`- ${asString(item.date) || '某天'}：作答 ${asNumber(item.answered) ?? 0} 题，答对 ${asNumber(item.correct) ?? 0} 题，正确率 ${formatPercent(item.accuracy)}`);
		}
	}
	return lines.join('\n');
}

/** 把易错题格式化为文本块。 */
function formatWrongQuestions(wrongQuestions) {
	const list = Array.isArray(wrongQuestions) ? wrongQuestions : [];
	if (list.length === 0) return '（暂无错题记录）';
	const blocks = list.map((item, index) => {
		if (!isPlainObject(item)) return '';
		const lines = [`${index + 1}. ${asString(item.setTitle) ? `【${asString(item.setTitle)}】` : ''}第 ${asString(item.number) || '?'} 题（${typeLabel(asString(item.type))}）`];
		if (asString(item.stem) !== '') lines.push(`   题干：${truncate(item.stem, 600)}`);
		if (asString(item.userAnswer) !== '') lines.push(`   学生作答：${asString(item.userAnswer)}`);
		const correct = asString(item.answerDisplay) || asString(item.answer);
		if (correct !== '') lines.push(`   正确答案：${correct}`);
		if (asString(item.analysis) !== '') lines.push(`   解析要点：${truncate(item.analysis, 600)}`);
		return lines.join('\n');
	});
	return blocks.filter((block) => block !== '').join('\n') || '（暂无错题记录）';
}

// ---------------------------------------------------------------------------
// 对话 prompt（Agent 持久会话：只给当前上下文，历史由 Session 自己保存）
// ---------------------------------------------------------------------------

/**
 * 组装答疑 Agent 的 prompt：课程、当前题目、共用材料、选中文字、用户问题。
 * 课程文档不整段塞入，只给路径，由 Agent 用 read / grep / glob 自行查阅。
 *
 * @param {object} options
 * @param {string} [options.courseName]
 * @param {object} [options.question] 当前题目
 * @param {string} [options.userAnswer] 学生当前的回答
 * @param {string} [options.selectedText]
 * @param {string} [options.userText]
 * @param {Array<{role: string, text: string}>} [options.history]
 * @returns {string} promptText
 */
export function buildChatAgentPrompt({ courseName, question, userAnswer, selectedText, userText, history } = {}) {
	const blocks = [];
	blocks.push(`课程：${asString(courseName) || '未命名课程'}`);
	const questionBlock = formatQuestionStem(question);
	if (questionBlock !== '') blocks.push(`# 当前题目\n${questionBlock}`);
	const answer = asString(userAnswer);
	if (answer !== '') blocks.push(`# 我的回答\n${truncate(answer, 6000)}`);
	const selected = asString(selectedText);
	if (selected !== '') blocks.push(`# 用户选中的文字\n${truncate(selected, 4000)}`);
	const recent = (Array.isArray(history) ? history : [])
		.filter((message) => isPlainObject(message) && asString(message.text) !== '')
		.slice(-6);
	if (recent.length > 0) {
		const lines = recent.map((message) => `${message.role === 'user' ? '用户' : '助手'}：${truncate(asString(message.text), 1200)}`);
		blocks.push(`# 最近对话\n${lines.join('\n')}`);
	}
	const ask = asString(userText) || (selected === '' ? '讲解当前题目。' : `解释这段内容：\n${selected}`);
	blocks.push(`# 问题\n${ask}`);
	return blocks.join('\n\n');
}

/** 只格式化题干与选项（答疑上下文不带参考答案/解析）。 */
function formatQuestionStem(question) {
	if (!isPlainObject(question)) return '';
	const lines = [];
	const number = asString(question.number);
	lines.push(`${number === '' ? '当前题目' : `第 ${number} 题`}（${typeLabel(question.type)}）`);
	if (asString(question.stem) !== '') lines.push(`题干：${question.stem}`);
	const options = Array.isArray(question.options) ? question.options : [];
	if (options.length > 0) {
		lines.push('选项：');
		options.forEach((option) => lines.push(`${asString(option.key)}. ${asString(option.text)}`));
	}
	const figures = Array.isArray(question.figures) ? question.figures : [];
	if (figures.length > 0) lines.push(`附图：${figures.map((figure, index) => asString(figure.alt) || `图${index + 1}`).join('、')}`);
	return lines.join('\n');
}

// ---------------------------------------------------------------------------
// 学情分析 prompt
// ---------------------------------------------------------------------------

/**
 * 组装学情分析 Agent 的 prompt：统计数据与错题是数据，输出要求只有一句。
 *
 * @param {object} options
 * @param {'course'|'set'|'global'} [options.scope]
 * @param {string} [options.courseName]
 * @param {object} [options.stats]
 * @param {Array<object>} [options.wrongQuestions]
 * @param {string|object[]} [options.materials]
 * @returns {string} promptText
 */
export function buildDiagnosePrompt({ scope, courseName, stats, wrongQuestions, materials } = {}) {
	const scopeLabel = scope === 'global' ? '全部课程' : scope === 'set' ? '单套题目' : '课程';
	const blocks = [];
	blocks.push(`分析范围：${scopeLabel}`);
	blocks.push(`对象：${asString(courseName) || (scope === 'global' ? '全部课程' : '未命名课程')}`);
	blocks.push(`## 刷题统计\n${formatStats(stats)}`);
	blocks.push(`## 错题记录\n${formatWrongQuestions(wrongQuestions)}`);
	const materialBlock = formatMaterials(materials);
	if (materialBlock !== '') blocks.push(`## 课程材料摘录\n${materialBlock}`);
	blocks.push('输出中文 Markdown，包含四个二级标题：## 学情概览、## 主要易错点、## 复习重点、## 7 天复习计划。');
	return blocks.join('\n\n');
}
// ---------------------------------------------------------------------------
// SVG 重绘 prompt
// ---------------------------------------------------------------------------

/**
 * 组装图形重绘 Agent 的 prompt。
 *
 * @param {object} options
 * @param {object} [options.question]
 * @param {number} [options.figureIndex]
 * @param {string} [options.explanation] 原 SVG / 原图路径 / 补充要求
 * @returns {string} promptText
 */
export function buildSvgPrompt({ question, figureIndex, explanation } = {}) {
	const blocks = [];
	const questionBlock = formatQuestionBlock(question);
	blocks.push(questionBlock === '' ? '题目信息缺失，请根据下面的说明重绘。' : `# 题目\n${questionBlock}`);
	const index = asNumber(figureIndex) ?? 0;
	const figures = Array.isArray(question?.figures) ? question.figures : [];
	const figure = figures[index];
	blocks.push(`# 要重绘的图\n第 ${index + 1} 个图${asString(figure?.alt) ? `（${asString(figure.alt)}）` : ''}。`);
	const note = asString(explanation);
	if (note !== '') blocks.push(`# 原图 / 补充要求\n${truncate(note, 12000)}`);
	blocks.push('只输出一个完整的 <svg> 元素。');
	return blocks.join('\n\n');
}
// ---------------------------------------------------------------------------
// AI 参考答案（解析阶段没有原卷答案的题目，结合课程文档生成）
// ---------------------------------------------------------------------------

/** 参考答案提交工具：结构化结果由工具参数承载。 */
export const ANSWER_RESULT_TOOL = {
	name: 'submit_reference_answers',
	description: '为每道题完成参考答案与解析后调用一次，提交全部结果。',
	parameters: {
		type: 'object',
		properties: {
			answers: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						number: { type: 'string', description: '题目题号，必须与输入一致' },
						answer: { type: 'array', items: { type: 'string' }, description: '单选 ["B"]；多选 ["A","C"]；判断 ["正确"]/["错误"]；填空按空的顺序' },
						answerDisplay: { type: 'string', description: '给人看的答案串' },
						answerFigures: FIGURE_SCHEMA,
						analysis: { type: 'string', description: '简明推导，最多 3 句（约 150 字）' },
						refs: { type: 'array', items: { type: 'string' }, description: '引用到的课程文档相对路径；没有就空数组' }
					},
					required: ['number', 'answer']
				}
			}
		},
		required: ['answers']
	},
	outputSchema: { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'] }
};

/** 把一道待补答案的题目格式化为提示词文本。 */
function formatAnswerQuestion(question, index) {
	if (!isPlainObject(question)) return '';
	const lines = [];
	const number = asString(question.number) || String(index + 1);
	lines.push(`## 题目 ${number}（${typeLabel(question.type)}）`);
	lines.push(`number：${number}`);
	if (asString(question.stem) !== '') lines.push(`题干：${question.stem}`);
	const options = Array.isArray(question.options) ? question.options : [];
	if (options.length > 0) {
		lines.push('选项：');
		options.forEach((option) => lines.push(`${asString(option.key)}. ${asString(option.text)}`));
	}
	const tags = Array.isArray(question.tags) ? question.tags.filter((tag) => asString(tag) !== '') : [];
	if (tags.length > 0) lines.push(`知识点：${tags.join('、')}`);
	if (asString(question.analysis) !== '') lines.push(`原卷解析（可参考）：${question.analysis}`);
	return lines.join('\n');
}

/**
 * 组装「生成参考答案」的 Agent 提示：显式给出 JSON 格式；课程文档在 Agent 的工作目录里。
 *
 * @param {object} options
 * @param {string} [options.courseName]
 * @param {Array<object>} [options.questions]
 * @returns {string} promptText
 */
export function buildAnswerPrompt({ courseName, questions } = {}) {
	const list = Array.isArray(questions) ? questions : [];
	const blocks = [];
	blocks.push(`课程：${asString(courseName) || '未命名课程'}`);
	blocks.push('工作目录是这门课的课程文档目录；需要依据课程资料时可用 read / grep / glob 查阅（没有把握就基于通用知识作答）。');
	const questionBlocks = list.map((question, index) => formatAnswerQuestion(question, index)).filter((block) => block !== '');
	blocks.push(`# 待生成参考答案的题目（共 ${list.length} 道）\n${questionBlocks.join('\n\n')}`);
	blocks.push(`# 输出格式（JSON 数组，只输出这个数组）
[{"number":"1","answer":["B"],"answerDisplay":"B","answerFigures":[{"kind":"image","path":"/abs/answer-fig.png","alt":"答案图1"}],"analysis":"简明推导，最多 3 句（约 150 字）"}]`);
	blocks.push('只输出 JSON 数组，不要输出 Markdown 说明或任何解释文字；每道题都要有一条结果，number 与输入题号一致。');
	blocks.push('answerDisplay 要短（如 "B"、"A、C"、"正确"、"x=1, y=2"）；analysis 不超过 3 句、约 150 字，不要长篇大论；答案里的图用 answerFigures 给出路径或 SVG。');
	blocks.push('完成后调用 submit_reference_answers 提交同一份 JSON。');
	return blocks.join('\n\n');
}

/** 过滤模型给出的文档引用：只保留 allowedRefs 中真实存在过的课程文档相对路径。 */
function normalizeGeneratedRefs(rawRefs, allowedRefs) {
	const allowed = (Array.isArray(allowedRefs) ? allowedRefs : [])
		.map((ref) => normalizeRelativePath(ref))
		.filter((ref) => ref !== '');
	const allowedSet = new Set(allowed);
	const byBaseName = new Map();
	for (const path of allowed) {
		const base = path.split('/').at(-1) ?? '';
		if (base === '') continue;
		if (!byBaseName.has(base)) byBaseName.set(base, []);
		byBaseName.get(base).push(path);
	}
	const values = Array.isArray(rawRefs) ? rawRefs : (rawRefs === undefined || rawRefs === null ? [] : [rawRefs]);
	const refs = [];
	const dropped = [];
	for (const raw of values) {
		const candidate = normalizeRelativePath(
			isPlainObject(raw)
				? asString(raw.path ?? raw.relPath ?? raw.name ?? raw.file)
				: raw
		);
		if (candidate === '') continue;
		let matched = '';
		if (allowedSet.has(candidate)) matched = candidate;
		else {
			// 模型可能只写文件名：唯一命中时补全为相对路径。
			const base = candidate.split('/').at(-1) ?? '';
			const byBase = byBaseName.get(base) ?? [];
			if (byBase.length === 1) matched = byBase[0];
			else {
				const suffixMatches = allowed.filter((path) => path.endsWith(`/${candidate}`) || candidate.endsWith(`/${path}`));
				if (suffixMatches.length === 1) matched = suffixMatches[0];
			}
		}
		if (matched === '') {
			if (!dropped.includes(candidate)) dropped.push(candidate);
			continue;
		}
		if (!refs.includes(matched)) refs.push(matched);
	}
	return { refs, dropped };
}

/**
 * 解析并校验「生成参考答案」阶段的模型输出。
 *
 * 容错：裸 JSON 数组 / ```json 代码块 / 前后夹带说明 / 尾逗号 / `{answers:[...]}` 包装。
 * 答案按题号（或 question.id）映射回传入的 questions，复用解析阶段的
 * normalizeAnswer / answerDisplayFor 规范化；refs 会被过滤为 allowedRefs 中真实存在的
 * 课程文档相对路径（防止模型编造引用）。
 *
 * @param {string} rawText 模型返回文本
 * @param {{questions?: Array<object>, allowedRefs?: string[]}} [options]
 * @returns {{answers: Map<string, {number: string, questionId: string, answer: string[], answerDisplay: string, analysis: string, refs: string[]}>, warnings: string[]}}
 */
export function normalizeGeneratedAnswers(rawText, { questions, allowedRefs } = {}) {
	const warnings = createWarningBag();
	const questionList = (Array.isArray(questions) ? questions : []).filter((question) => isPlainObject(question));
	const byNumber = new Map();
	const byId = new Map();
	for (const question of questionList) {
		const number = asString(question.number);
		if (number !== '' && !byNumber.has(number)) byNumber.set(number, question);
		const normalizedNumber = normalizeCompare(number);
		if (normalizedNumber !== '' && !byNumber.has(normalizedNumber)) byNumber.set(normalizedNumber, question);
		const id = asString(question.id);
		if (id !== '') byId.set(id, question);
	}
	const findQuestion = (item) => {
		const number = asString(item.number ?? item.questionNumber ?? item.no ?? item.serial);
		if (number !== '') {
			const direct = byNumber.get(number) ?? byNumber.get(normalizeCompare(number));
			if (direct !== undefined) return direct;
		}
		const id = asString(item.id ?? item.questionId);
		if (id !== '') {
			const byIdentifier = byId.get(id);
			if (byIdentifier !== undefined) return byIdentifier;
		}
		return undefined;
	};

	const rawValue = extractJsonValue(rawText);
	let list;
	if (Array.isArray(rawValue)) list = rawValue;
	else if (isPlainObject(rawValue)) {
		const candidate = rawValue.answers ?? rawValue.results ?? rawValue.data ?? rawValue.items ?? rawValue.questions;
		if (Array.isArray(candidate)) list = candidate;
		else if (isPlainObject(candidate)) list = [candidate];
		else if (isPlainObject(rawValue) && (rawValue.answer !== undefined || rawValue.analysis !== undefined)) list = [rawValue];
		else list = undefined;
	}
	if (!Array.isArray(list)) throw new Error('模型返回的参考答案 JSON 格式不正确（需要数组）。');

	const answers = new Map();
	for (const item of list) {
		if (!isPlainObject(item)) continue;
		const question = findQuestion(item);
		if (question === undefined) {
			const label = asString(item.number ?? item.id) || '（空）';
			warnings.add(`模型返回了题目集中不存在的题号 ${label}，已忽略。`);
			continue;
		}
		const key = asString(question.id) || asString(question.number);
		if (answers.has(key)) continue;
		const type = asString(question.type) || 'single';
		const options = Array.isArray(question.options) ? question.options : [];
		const rawAnswer = item.answer ?? item.answers ?? item.correctAnswer ?? item.answerKey ?? item.correct;
		const answer = normalizeAnswer(rawAnswer, { type, options });
		if (answer.length === 0) {
			warnings.add(`第 ${asString(question.number) || key} 题没有生成有效答案，已跳过。`);
			continue;
		}
		const answerDisplay = type === 'judge'
			? answerDisplayFor(answer, 'judge')
			: (asString(item.answerDisplay ?? item.answerText ?? item.displayAnswer) || answerDisplayFor(answer, type));
		const analysis = truncate(asString(
			item.analysis ?? item.explanation ?? item.solution ?? item.parse ?? item.solving
		), MAX_ANALYSIS_CHARS);
		const filtered = normalizeGeneratedRefs(
			item.refs ?? item.references ?? item.docs ?? item.citations ?? item.sources,
			allowedRefs
		);
		if (filtered.dropped.length > 0) {
			const sample = filtered.dropped.slice(0, 3).join('、');
			warnings.add(`已忽略 ${filtered.dropped.length} 个不存在或未提供的课程文档引用（如：${sample}）。`);
		}
		const answerFigures = normalizeFigures(
			item.answerFigures ?? item.answerImages ?? item.answerPictures ?? item.figures,
			`第 ${asString(question.number) || key} 题答案`,
			warnings
		);
		answers.set(key, {
			number: asString(question.number) || key,
			questionId: asString(question.id),
			answer,
			answerDisplay,
			analysis,
			answerFigures,
			refs: filtered.refs
		});
	}
	if (answers.size === 0) {
		const error = new Error('模型没有返回任何可用的参考答案。');
		error.code = 'ANSWERS_EMPTY';
		throw error;
	}
	return { answers, warnings: uniqueStrings(warnings.finish()) };
}

// ---------------------------------------------------------------------------
// 答案文件解析（原卷答案/解析与试卷分开上传时使用）
// ---------------------------------------------------------------------------

/** 答案文件提交工具：按题号提交答案与解析。 */
export const ANSWER_KEY_RESULT_TOOL = {
	name: 'submit_answer_key',
	description: '整理完成后调用一次，提交答案文件里每道题的答案与解析。',
	parameters: {
		type: 'object',
		properties: {
			answers: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						number: { type: 'string', description: '答案文件中的题号原文，如 "1"、"第1题"、"T1"；连续题号可写 "1-5"' },
						answer: { type: 'array', items: { type: 'string' }, description: '单选 ["B"]；多选 ["A","C"]；判断 ["正确"]/["错误"]；填空按空的顺序' },
						answerDisplay: { type: 'string' },
						answerFigures: FIGURE_SCHEMA,
						analysis: { type: 'string', description: '原答案文件中的解析；没有就空字符串' }
					},
					required: ['number', 'answer']
				}
			}
		},
		required: ['answers']
	},
	outputSchema: { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'] }
};

/**
 * 规范化 AI 答案解析模式：'auto'（默认）| 'off' | 'regenerate'，旧数据/非法值回退 'auto'。
 * @param {unknown} value
 * @returns {'auto'|'off'|'regenerate'}
 */
export function normalizeAiAnswerMode(value) {
	const mode = asString(value).toLowerCase();
	if (mode === 'off' || mode === 'regenerate') return mode;
	return 'auto';
}
/** 把答案文件里的题号归一化：去空白/全角数字/常见前缀后缀与括号。 */
function normalizeAnswerKeyNumber(value) {
	let text = asString(value);
	if (text === '') return '';
	text = text.replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
	text = text.replace(/\s+/g, '');
	text = text.replace(/^第+/, '');
	text = text.replace(/^(?:question|问题|题号|答案)/i, '');
	text = text.replace(/^(?:T|Q|NO\.?|#)/i, '');
	text = text.replace(/[()（）\[\]【】{}，,：:；;]/g, '');
	text = text.replace(/[.。、]/g, '');
	text = text.replace(/^第+/, '');
	text = text.replace(/题+$/, '');
	return text.trim().toLowerCase();
}

/** 构建题号查找索引（精确 / 归一化 / 尾部数字，并处理歧义）。 */
function buildAnswerKeyIndex(questions) {
	const exact = new Map();
	const normalized = new Map();
	const tails = new Map();
	const ids = new Map();
	for (const question of questions) {
		if (!isPlainObject(question)) continue;
		const raw = asString(question.number);
		if (raw !== '' && !exact.has(raw)) exact.set(raw, question);
		const norm = normalizeAnswerKeyNumber(raw);
		if (norm !== '') {
			if (normalized.has(norm)) normalized.set(norm, null);
			else normalized.set(norm, question);
		}
		const tail = /(\d+)$/.exec(norm);
		if (tail !== null) {
			const key = tail[1];
			if (!tails.has(key)) tails.set(key, question);
			else tails.set(key, null);
		}
		const id = asString(question.id);
		if (id !== '' && !ids.has(id)) ids.set(id, question);
	}
	return { exact, normalized, tails, ids };
}

/** 按题号查找题目（兼容 "1"、"1."、"第1题"、"T1"、"（1）" 等写法）。 */
function findAnswerKeyQuestion(index, rawNumber) {
	const raw = asString(rawNumber);
	if (raw === '') return undefined;
	const exactMatch = index.exact.get(raw);
	if (exactMatch !== undefined) return exactMatch;
	const norm = normalizeAnswerKeyNumber(raw);
	if (norm === '') return undefined;
	const normalizedMatch = index.normalized.get(norm);
	if (normalizedMatch !== undefined && normalizedMatch !== null) return normalizedMatch;
	const idMatch = index.ids.get(raw) ?? index.ids.get(norm);
	if (idMatch !== undefined) return idMatch;
	const tail = /(\d+)$/.exec(norm);
	if (tail !== null) {
		const tailMatch = index.tails.get(tail[1]);
		if (tailMatch !== undefined && tailMatch !== null) return tailMatch;
	}
	return undefined;
}

/** 把多题连写（如 "1-5 B C D A B"）展开成逐题条目。 */
function expandAnswerKeyEntries(list) {
	const entries = [];
	for (const item of list) {
		if (!isPlainObject(item)) continue;
		const numberText = asString(item.number ?? item.questionNo ?? item.no ?? item.questionNumber ?? item.num ?? item.id);
		const plainNumber = numberText
			.replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
			.replace(/\s+/g, '');
		const range = /^(\d{1,4})\s*[-~—–至到]\s*(\d{1,4})$/.exec(plainNumber);
		if (range === null) {
			entries.push(item);
			continue;
		}
		const start = Number(range[1]);
		const end = Number(range[2]);
		if (!Number.isInteger(start) || !Number.isInteger(end) || end < start || end - start > 200) {
			entries.push(item);
			continue;
		}
		const rawAnswer = item.answer ?? item.answers ?? item.correctAnswer ?? item.answerKey ?? item.correct;
		const tokens = [];
		if (Array.isArray(rawAnswer)) {
			rawAnswer.forEach((value) => tokens.push(asString(value)));
		} else {
			const text = asString(rawAnswer);
			if (text !== '') {
				const parts = text.split(/[\s、,，;；|/]+/).filter((part) => part !== '');
				if (parts.length > 1) tokens.push(...parts);
				else if (/^[A-Za-z]+$/.test(parts[0] ?? '')) tokens.push(...parts[0].split(''));
				else tokens.push(parts[0]);
			}
		}
		for (let value = start, offset = 0; value <= end; value += 1, offset += 1) {
			if (offset >= tokens.length) break;
			entries.push({
				number: String(value),
				answer: [tokens[offset]],
				answerDisplay: tokens[offset],
				analysis: item.analysis ?? item.explanation ?? ''
			});
		}
	}
	return entries;
}

/**
 * 解析答案文件模型输出并匹配到题目。
 *
 * 兼容脏 JSON（裸数组 / ```json / 前后杂质 / 尾逗号 / `{answers:[...]}` 包装 /
 * 「题号→答案」映射对象）与题号写法 "1"、"1."、"第1题"、"T1"、"（1）"，
 * 以及多题连写 "1-5 B C D"（按顺序展开）。
 * 答案按目标题目的 type/options 规范化（选项原文→key、判断题→正确/错误）；
 * refs（如有）按 allowedRefs 过滤为真实课程文档相对路径。
 *
 * @param {string} rawText 模型返回文本
 * @param {{questions?: Array<object>, allowedRefs?: string[]}} [options]
 * @returns {{answers: Map<string, {number: string, questionId: string, answer: string[], answerDisplay: string, analysis: string, refs: string[]}>, warnings: string[]}}
 */
export function normalizeAnswerKey(rawText, { questions, allowedRefs } = {}) {
	const warnings = createWarningBag();
	const questionList = (Array.isArray(questions) ? questions : []).filter((question) => isPlainObject(question));
	const index = buildAnswerKeyIndex(questionList);
	const rawValue = extractJsonValue(rawText);
	let list;
	if (Array.isArray(rawValue)) list = rawValue;
	else if (isPlainObject(rawValue)) {
		const wrapped = rawValue.answers ?? rawValue.results ?? rawValue.data ?? rawValue.items ?? rawValue.questions ?? rawValue.answerKey;
		if (Array.isArray(wrapped)) list = wrapped;
		else if (isPlainObject(wrapped)) list = [wrapped];
		else {
			// {"1":"B","2":"正确"} 这类「题号 → 答案」映射。
			list = Object.entries(rawValue).map(([number, value]) => (isPlainObject(value) ? { number, ...value } : { number, answer: value }));
		}
	}
	if (!Array.isArray(list)) throw new Error('模型返回的答案文件 JSON 格式不正确（需要数组）。');
	const entries = expandAnswerKeyEntries(list);
	const answers = new Map();
	const unmatched = [];
	for (const item of entries) {
		const rawNumber = asString(item.number ?? item.questionNo ?? item.no ?? item.questionNumber ?? item.num ?? item.id);
		const question = findAnswerKeyQuestion(index, rawNumber);
		if (question === undefined) {
			if (rawNumber !== '' && !unmatched.includes(rawNumber)) unmatched.push(rawNumber);
			continue;
		}
		const key = asString(question.id) || asString(question.number);
		if (key === '' || answers.has(key)) continue;
		const type = asString(question.type) || 'single';
		const options = Array.isArray(question.options) ? question.options : [];
		const rawAnswer = item.answer ?? item.answers ?? item.correctAnswer ?? item.answerKey ?? item.correct;
		const answer = normalizeAnswer(rawAnswer, { type, options });
		if (answer.length === 0) {
			warnings.add(`题号 ${rawNumber || key} 的答案无法规范化，已跳过。`);
			continue;
		}
		const answerDisplay = type === 'judge'
			? answerDisplayFor(answer, 'judge')
			: (asString(item.answerDisplay ?? item.answerText ?? item.displayAnswer) || answerDisplayFor(answer, type));
		const analysis = truncate(asString(
			item.analysis ?? item.explanation ?? item.solution ?? item.parse ?? item.solving
		), MAX_ANALYSIS_CHARS);
		const filtered = normalizeGeneratedRefs(
			item.refs ?? item.references ?? item.docs ?? item.citations,
			allowedRefs
		);
		const answerFigures = normalizeFigures(
			item.answerFigures ?? item.answerImages ?? item.answerPictures ?? item.figures,
			`第 ${rawNumber || key} 题答案`,
			warnings
		);
		answers.set(key, {
			number: asString(question.number) || rawNumber || key,
			questionId: asString(question.id),
			answer,
			answerDisplay,
			analysis,
			answerFigures,
			refs: filtered.refs
		});
	}
	if (unmatched.length > 0) {
		const sample = unmatched.slice(0, 8).join('、');
		warnings.add(`答案文件中以下题号未匹配到题目：${sample}${unmatched.length > 8 ? ' 等' : ''}（共 ${unmatched.length} 个）。`);
	}
	if (answers.size === 0) warnings.add('答案文件中没有解析出可匹配到题目的答案。');
	return { answers, warnings: uniqueStrings(warnings.finish()) };
}

// ---------------------------------------------------------------------------
// Agent 答案文件解析 prompt / AI 判题（grade）
// ---------------------------------------------------------------------------

/**
 * 组装答案文件的 Agent 提示：直接给原始答案文件（不转图片），
 * 并给出完整 JSON 格式；答案里有图时用 answerFigures。
 *
 * @param {object} options
 * @param {string} [options.courseName]
 * @param {Array<string|{name:string}>} [options.files]
 * @param {string} [options.workingDir]
 * @returns {string} promptText
 */
export function buildAnswerKeyAgentPrompt({ courseName, files, workingDir } = {}) {
	const lines = ['这是这套试卷的答案文件（不是题目本身），请整理每道题的答案与解析。'];
	if (asString(courseName) !== '') lines.push(`课程：${asString(courseName)}`);
	if (asString(workingDir) !== '') lines.push(`工作目录：${asString(workingDir)}`);
	const fileList = formatFileNames(files);
	if (fileList !== '') lines.push(`# 答案文件\n${fileList}`);
	lines.push(`# 输出格式（JSON 数组，字段名必须一致）
[{
  "number": "1",
  "answer": ["B"],
  "answerDisplay": "B",
  "answerFigures": [{"kind": "image", "path": "/abs/answer-fig.png", "alt": "答案图1"}],
  "analysis": "原答案文件中的解析；没有就空字符串"
}]`);
	lines.push('# 要求');
	lines.push('1. 用 read / read_image 读取答案文件；PDF / Office 优先文本层，只有图片题才看页面；不要写 OCR 脚本。');
	lines.push('2. number 保留答案文件中的题号原文（如 "1"、"第1题"、"T1"；连续题号可写 "1-5" 并在 answer 里按顺序给数组）。');
	lines.push('3. 只转录答案文件里真实存在的答案与解析，不要自行解题；判断题答案用 正确/错误。');
	lines.push('4. 答案中的图（ER 图、表格截图、示意图）用 answerFigures 给出图片绝对路径或内联 SVG。');
	lines.push('5. 只输出 JSON 数组（也可调用 submit_answer_key 提交同一份 JSON），不要输出解释文字。');
	return lines.join('\n');
}

/** 判题结果提交工具。 */
export const GRADE_RESULT_TOOL = {
	name: 'submit_grade',
	description: '完成批改后调用一次，提交判定结果与建议。',
	parameters: {
		type: 'object',
		properties: {
			verdict: { type: 'string', enum: ['correct', 'partial', 'incorrect'] },
			score: { type: 'number', description: '0-100' },
			standardAnswer: { type: 'string', description: '可省略；Host 使用已准备的标准答案' },
			mistakeAnalysis: { type: 'string', description: '学生答案错在哪；完全正确时写「无」' },
			explanation: { type: 'string', description: '关键理由，最多 3 句' },
			suggestions: { type: 'array', items: { type: 'string' } },
			refs: { type: 'array', items: { type: 'string' }, description: '课程文档相对路径；没有就空数组' }
		},
		required: ['verdict']
	},
	outputSchema: { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'] }
};

/**
 * 组装判题提示：标准答案已准备好，Agent 只做比对并指出错在哪。
 * 不读文档、不重新解题、解释保持简短，保证判卷快。
 *
 * @param {object} options
 * @param {string} [options.courseName]
 * @param {object} [options.question]
 * @param {string|object[]} [options.materials]
 * @param {string} [options.userAnswer]
 * @returns {string} promptText
 */
export function buildGradePrompt({ courseName, question, materials, userAnswer } = {}) {
	const blocks = [];
	blocks.push(`课程：${asString(courseName) || '未命名课程'}`);
	const questionBlock = formatQuestionStem(question) || '（题目信息缺失）';
	blocks.push(`# 题目\n${questionBlock}`);
	const materialBlock = formatMaterials(materials);
	if (materialBlock !== '') blocks.push(`# 题目共用材料\n${materialBlock}`);
	const standard = asString(question?.answerDisplay)
		|| (Array.isArray(question?.answer) ? question.answer.map(asString).filter(Boolean).join('、') : '')
		|| '（未提供标准答案，请依据题目判断）';
	blocks.push(`# 标准答案（已准备，不要改写）\n${standard}`);
	const analysis = asString(question?.analysis);
	if (analysis !== '') blocks.push(`# 原卷解析（参考，不要照抄）\n${truncate(analysis, 1200)}`);
	blocks.push(`# 学生答案\n${asString(userAnswer) || '（未作答）'}`);
	blocks.push(`# 输出格式（只输出 JSON）
{"verdict":"correct|partial|incorrect","score":0-100,"mistakeAnalysis":"学生错在哪、缺哪些要点；完全正确写「无」","explanation":"关键理由，最多 3 句","suggestions":["一条可执行建议"]}`);
	blocks.push('# 要求');
	blocks.push('1. 标准答案已经给出，不要重新解题、不要改写标准答案。');
	blocks.push('2. 客观题按标准答案精确比对；简答题按要点覆盖程度判断。');
	blocks.push('3. mistakeAnalysis 要具体指出错在哪（选项/步骤/缺失要点）；explanation 不要长篇大论。');
	blocks.push('4. 不要引用课程文档，不要输出 JSON 之外的文字；可调用 submit_grade 提交。');
	return blocks.join('\n\n');
}

const GRADE_VERDICTS = new Set(['correct', 'partial', 'incorrect']);
const GRADE_VERDICT_MAP = {
	'正确': 'correct', '全对': 'correct', '对': 'correct', '满分': 'correct',
	'部分正确': 'partial', '部分': 'partial', '半对': 'partial',
	'错误': 'incorrect', '错': 'incorrect', '不正确': 'incorrect', '全错': 'incorrect'
};

/**
 * 解析并校验 AI 判题结果。
 *
 * 容错：裸 JSON / ```json 代码块 / 前后杂质 / 尾逗号 / `{result:{...}}` 包装；
 * verdict 支持中英文写法并回退到按分数推断；score 兼容 0-100 与 0-1；
 * refs 过滤为真实课程文档相对路径（防幻觉）。
 *
 * @param {string} rawText 模型返回文本
 * @param {{question?: object, allowedRefs?: string[]}} [options]
 * @returns {{result: {verdict: 'correct'|'partial'|'incorrect', score: number, summary: string, suggestions: string[], correctedAnswer: string, refs: string[]}, warnings: string[]}}
 */
export function normalizeGradeResult(rawText, { question, allowedRefs } = {}) {
	void question;
	const warnings = createWarningBag();
	const rawValue = extractJsonValue(rawText);
	let raw = rawValue;
	if (isPlainObject(rawValue)) {
		const wrapped = isPlainObject(rawValue.result) ? rawValue.result : (isPlainObject(rawValue.grade) ? rawValue.grade : undefined);
		if (wrapped !== undefined) raw = wrapped;
	}
	if (!isPlainObject(raw)) throw new Error('模型返回的批改结果 JSON 格式不正确（需要对象）。');
	const rawVerdict = asString(raw.verdict ?? raw.result ?? raw.judgement ?? raw.judgment);
	const mappedVerdict = GRADE_VERDICT_MAP[rawVerdict] ?? rawVerdict.toLowerCase();
	let score = asNumber(raw.score ?? raw.points ?? raw.accuracy);
	if (score !== null && score > 0 && score < 1) score *= 100;
	if (score === null) {
		score = mappedVerdict === 'correct' ? 100 : mappedVerdict === 'partial' ? 60 : 0;
	}
	score = Math.max(0, Math.min(100, Math.round(score)));
	let verdict = mappedVerdict;
	if (!GRADE_VERDICTS.has(verdict)) {
		warnings.add(`批改结果 verdict 不合法（${verdict || '空'}），已按分数推断。`);
		verdict = score >= 85 ? 'correct' : score >= 50 ? 'partial' : 'incorrect';
	}
	const joinText = (value) => {
		if (Array.isArray(value)) return value.map((item) => asString(item)).filter((item) => item !== '').join('；');
		return asString(value);
	};
	// 新结构：先标准答案 → 再错因 → 再解析/建议。
	const standardAnswer = truncate(
		joinText(raw.standardAnswer ?? raw.standard_answer ?? raw.correctAnswer ?? raw.correct_answer ?? raw.answer ?? raw.correctedAnswer),
		2000
	);
	const mistakeAnalysis = truncate(
		joinText(raw.mistakeAnalysis ?? raw.mistake_analysis ?? raw.mistake ?? raw.errorAnalysis ?? raw.error ?? raw.summary),
		2000
	);
	const explanation = truncate(
		joinText(raw.explanation ?? raw.analysis ?? raw.reasoning ?? raw.solution ?? raw.summary),
		4000
	);
	// 兼容旧字段：summary/correctedAnswer 继续返回（前端旧版本可读）。
	const summary = truncate(asString(raw.summary ?? raw.comment ?? raw.feedback), 2000) || mistakeAnalysis || explanation || '未提供批改说明。';
	const rawSuggestions = Array.isArray(raw.suggestions)
		? raw.suggestions
		: (Array.isArray(raw.tips) ? raw.tips : (raw.suggestion === undefined ? [] : [raw.suggestion]));
	const suggestions = uniqueStrings(rawSuggestions.map((item) => asString(item))).slice(0, 4);
	if (suggestions.length === 0) warnings.add('批改结果没有给出改进建议。');
	const correctedAnswer = joinText(raw.correctedAnswer ?? raw.correctAnswer ?? raw.answer) || standardAnswer;
	const filtered = normalizeGeneratedRefs(raw.refs ?? raw.references ?? raw.docs ?? raw.citations, allowedRefs);
	if (filtered.dropped.length > 0) {
		warnings.add(`已忽略 ${filtered.dropped.length} 个不存在或未提供的课程文档引用。`);
	}
	return {
		result: {
			verdict,
			score,
			// 新结构
			standardAnswer,
			mistakeAnalysis,
			explanation,
			suggestions,
			refs: filtered.refs,
			// 旧字段兼容
			summary,
			correctedAnswer
		},
		warnings: uniqueStrings(warnings.finish())
	};
}

