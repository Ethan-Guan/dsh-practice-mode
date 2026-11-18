/* 刷题模式 Client — 基础工具（Lead 维护）。
 * 这里只放所有 UI 片段共享的底层能力：DSP 命名空间、i18n 回落、图标、按钮/弹窗等
 * 轻量原语、markdown 渲染、HTTP 客户端、SSE 解析与格式化工具。
 */

var DSP = (window.__DSP = window.__DSP || {});
DSP.h = h;
DSP.React = React;

/* ------------------------------------------------------------------ */
/* i18n：读 Client locale 服务；UI 以中文为主，英文用常见词条回落映射。 */
/* ------------------------------------------------------------------ */

var __localeService = null;
var __localeListeners = new Set();

DSP.initLocale = function initLocale(ctx) {
	try {
		__localeService = ctx && typeof ctx.get === 'function' ? (ctx.get('locale') || ctx.locale || null) : (ctx && ctx.locale) || null;
	} catch (error) {
		__localeService = null;
	}
	if (__localeService && typeof __localeService.subscribe === 'function') {
		try {
			__localeService.subscribe(function () {
				Array.from(__localeListeners).forEach(function (listener) {
					try {
						listener();
					} catch (error) {
						/* ignore one broken listener */
					}
				});
			});
		} catch (error) {
			/* locale subscription is best-effort */
		}
	}
};

DSP.subscribeLocale = function subscribeLocale(listener) {
	__localeListeners.add(listener);
	return function () {
		__localeListeners.delete(listener);
	};
};

function currentLocaleId() {
	try {
		const snapshot = __localeService && typeof __localeService.getLocale === 'function' ? __localeService.getLocale() : null;
		const id = snapshot && (snapshot.id || snapshot.locale || snapshot.language);
		return typeof id === 'string' ? id : 'zh';
	} catch (error) {
		return 'zh';
	}
}

DSP.localeId = currentLocaleId;

var EN_MAP = {
	刷题模式: 'Practice Mode',
	新会话: 'New chat',
	答疑助手: 'Study Assistant',
	新建课程: 'New course',
	所有课程: 'All courses',
	所有课程看板: 'All-course dashboard',
	课程文档: 'Course materials',
	题目集: 'Question sets',
	上传题目文件: 'Upload question file',
	上传课程文档: 'Upload course material',
	上传文件夹: 'Upload folder',
	支持: 'Supported: ',
	开始刷题: 'Start practice',
	继续刷题: 'Continue practice',
	重新练习: 'Practice again',
	查看解析: 'Review explanations',
	删除: 'Delete',
	取消: 'Cancel',
	确认: 'Confirm',
	保存: 'Save',
	关闭: 'Close',
	发送: 'Send',
	提交: 'Submit',
	上一题: 'Previous',
	下一题: 'Next',
	交卷: 'Finish set',
	正确答案: 'Answer',
	解析: 'Explanation',
	一键提问: 'Ask about this',
	重新绘制示图: 'Redraw figure',
	正在思考: 'Thinking',
	正在解析: 'Parsing',
	正在生成: 'Generating',
	正确: 'Correct',
	错误: 'Incorrect',
	已答: 'Answered',
	未答: 'Unanswered',
	跳过: 'Skip',
	单选: 'Single choice',
	多选: 'Multiple choice',
	判断: 'True / false',
	填空: 'Fill in the blank',
	简答: 'Short answer',
	其他: 'Other',
	难度: 'Difficulty',
	考点: 'Topics',
	错题: 'Wrong answers',
	易错点: 'Common mistakes',
	复习重点: 'Review focus',
	复习方案: 'Review plan',
	学情分析: 'Learning analysis',
	生成复习方案: 'Generate review plan',
	刷新分析: 'Refresh analysis',
	最近刷题: 'Recent practice',
	还没有数据: 'No data yet',
	第: 'No. ',
	题: '',
	无题目: 'No questions',
	课程名称: 'Course name',
	课程简介: 'Course description',
	可选: 'optional',
	学习看板: 'Dashboard',
	正确率: 'Accuracy',
	题型分布: 'By question type',
	最近趋势: 'Recent trend',
	刷题总数: 'Attempts',
	已刷套数: 'Sets completed',
	平均用时: 'Average time',
	查看全部: 'View all',
	暂无课程: 'No courses yet',
	新建课程即可上传课程文档与题目文件: 'Create a course to upload materials and questions.',
	选择题: 'Choice',
	材料: 'Material',
	共用材料: 'Shared material',
	图片: 'Image',
	选中文字: 'Selected text',
	附加到对话: 'Attach to chat',
	提问: 'Ask',
	清空对话: 'Clear chat',
	新对话: 'New conversation',
	基于课程文档与所选文字回答: 'Answers grounded in course materials and your selection.',
	输入问题: 'Type your question',
	回车发送: 'Enter to send',
	课程: 'Course',
	返回课程: 'Back to course',
	本套统计: 'Set summary',
	上传下一套: 'Upload next set',
	解析失败: 'Parsing failed',
	重试: 'Retry',
	完成: 'Done',
	数据: 'Data',
	全局: 'Global',
	全部错题: 'All wrong answers',
	暂无错题: 'No wrong answers yet',
	题目: 'Question',
	你的答案: 'Your answer',
	未作答: 'No answer',
	用时: 'Time spent',
	本次正确率: 'Accuracy this set',
	上传中: 'Uploading',
	请选择文件: 'Choose files',
	课程已创建: 'Course created',
	题目已解析: 'Questions parsed',
	已附加到右侧对话: 'Attached to the chat',
	复制: 'Copy',
	已复制: 'Copied',
	明细: 'Details',
	暂无解析: 'No explanation yet',
	暂无课程文档: 'No course materials yet',
	文档抽取完成: 'Material indexed',
	文档抽取失败: 'Failed to index material',
	图片识别: 'Figure',
	模式: 'Mode',
	答一题看一题: 'Reveal after each question',
	全部做完再看: 'Reveal after the whole set',
	开始: 'Start',
	继续: 'Continue'
};

DSP.t = function t(zhText) {
	if (typeof zhText !== 'string') return zhText;
	const id = currentLocaleId();
	if (typeof id === 'string' && id.toLowerCase().indexOf('zh') === 0) return zhText;
	return EN_MAP[zhText] || zhText;
};

/* ------------------------------------------------------------------ */
/* 图标                                                               */
/* ------------------------------------------------------------------ */

var ICON_PATHS = {
	logo: [
		'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z',
		'M8 7.5h8M8 11h6',
		'M4 17.5c0-1.4 1.1-2.5 2.5-2.5H20'
	],
	plus: ['M12 5v14M5 12h14'],
	minus: ['M5 12h14'],
	upload: ['M12 16V4', 'M7 9l5-5 5 5', 'M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3'],
	folder: ['M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
	doc: ['M6 3h8l4 4v14H6z', 'M14 3v5h5', 'M9 12h6M9 16h6'],
	image: ['M3 5h18v14H3z', 'M3 15l5-5 4 4 3-3 6 6', 'M15.5 8.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z'],
	trash: ['M4 7h16', 'M9 7V4h6v3', 'M6 7l1 13h10l1-13', 'M10 11v6M14 11v6'],
	chat: ['M4 5h16v11H9l-5 4z'],
	send: ['M4 12l16-8-6 16-3-6z', 'M11 14l9-10'],
	sparkles: ['M12 3l1.8 4.6L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.9z', 'M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z'],
	check: ['M4 12.5l5 5L20 6.5'],
	checkCircle: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M8 12.5l3 3 5-6'],
	closeCircle: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M9 9l6 6M15 9l-6 6'],
	x: ['M6 6l12 12M18 6L6 18'],
	chevronDown: ['M6 9l6 6 6-6'],
	chevronLeft: ['M15 6l-6 6 6 6'],
	chevronRight: ['M9 6l6 6-6 6'],
	book: ['M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z', 'M8 7.5h8M8 11h6'],
	chart: ['M4 20V10M10 20V4M16 20v-7M22 20H2'],
	refresh: ['M20 11a8 8 0 1 0-2.3 6.6', 'M20 4v7h-7'],
	arrowLeft: ['M19 12H5', 'M11 6l-6 6 6 6'],
	clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
	search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M16.5 16.5L21 21'],
	edit: ['M4 20h4L20 8l-4-4L4 16z', 'M13 5l4 4'],
	more: ['M6 12h.01M12 12h.01M18 12h.01'],
	alert: ['M12 3l9.5 17H2.5z', 'M12 9v5M12 17h.01'],
	bulb: ['M9 18h6', 'M10 21h4', 'M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2h5c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z'],
	target: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z'],
	list: ['M8 6h13M8 12h13M8 18h13', 'M3.5 6h.01M3.5 12h.01M3.5 18h.01'],
	play: ['M7 4l13 8-13 8z'],
	eye: ['M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
	copy: ['M9 9h11v12H9z', 'M4 15V3h11'],
	flag: ['M5 21V4', 'M5 4h11l-1.5 4L16 12H5'],
	layers: ['M12 3l9 5-9 5-9-5z', 'M3 13l9 5 9-5'],
	robot: ['M5 8h14v10H5z', 'M12 4v4', 'M9 12h.01M15 12h.01', 'M9 18v3M15 18v3'],
	bookmark: ['M6 3h12v18l-6-4-6 4z'],
	dot: ['M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z']
};

function Icon(props) {
	const name = props && props.name ? String(props.name) : 'dot';
	const paths = ICON_PATHS[name] || ICON_PATHS.dot;
	const size = (props && props.size) || 16;
	const children = paths.map(function (d, index) {
		return h('path', { key: index, d: d, fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' });
	});
	return h(
		'svg',
		{
			className: 'dsp-icon' + (props && props.className ? ' ' + props.className : ''),
			viewBox: '0 0 24 24',
			width: size,
			height: size,
			role: props && props.title ? 'img' : undefined,
			'aria-hidden': props && props.title ? undefined : true,
			'aria-label': props && props.title ? props.title : undefined,
			focusable: 'false'
		},
		props && props.title ? h('title', null, props.title) : null,
		children
	);
}

DSP.Icon = Icon;

/* ------------------------------------------------------------------ */
/* 基础原语                                                           */
/* ------------------------------------------------------------------ */

function joinClass() {
	const parts = [];
	for (let index = 0; index < arguments.length; index += 1) {
		const value = arguments[index];
		if (typeof value === 'string' && value.length > 0) parts.push(value);
	}
	return parts.join(' ');
}

DSP.cls = joinClass;

function Spinner(props) {
	const size = (props && props.size) || 16;
	return h('span', { className: 'dsp-spinner', style: { width: size + 'px', height: size + 'px' }, 'aria-hidden': 'true' });
}

DSP.Spinner = Spinner;

function Btn(props) {
	const p = props || {};
	const variant = p.variant || 'secondary';
	const children = [];
	if (p.loading) children.push(h(Spinner, { key: 'spinner', size: 14 }));
	else if (p.icon) children.push(h(Icon, { key: 'icon', name: p.icon, size: p.iconSize || 16 }));
	if (p.children !== undefined && p.children !== null && p.children !== false) children.push(h('span', { key: 'label', className: 'dsp-btn-label' }, p.children));
	return h(
		'button',
		{
			type: 'button',
			className: joinClass('dsp-btn', 'dsp-btn-' + variant, p.block ? 'dsp-btn-block' : '', p.className || ''),
			disabled: Boolean(p.disabled) || Boolean(p.loading),
			onClick: p.onClick,
			title: p.title,
			'aria-label': p.ariaLabel,
			style: p.style
		},
		children
	);
}

DSP.Btn = Btn;

function IconBtn(props) {
	const p = props || {};
	return h(
		'button',
		{
			type: 'button',
			className: joinClass('dsp-icon-btn', p.danger ? 'dsp-icon-btn-danger' : '', p.active ? 'dsp-icon-btn-active' : '', p.className || ''),
			onClick: p.onClick,
			disabled: Boolean(p.disabled),
			title: p.title || p.label,
			'aria-label': p.label || p.title
		},
		h(Icon, { name: p.icon, size: p.size || 16 })
	);
}

DSP.IconBtn = IconBtn;

function Tag(props) {
	const p = props || {};
	return h('span', { className: joinClass('dsp-tag', 'dsp-tag-' + (p.tone || 'neutral'), p.className || '') }, p.children);
}

DSP.Tag = Tag;

function Empty(props) {
	const p = props || {};
	return h(
		'div',
		{ className: 'dsp-empty' + (p.className ? ' ' + p.className : '') },
		p.icon ? h('div', { className: 'dsp-empty-icon' }, h(Icon, { name: p.icon, size: 30 })) : null,
		h('div', { className: 'dsp-empty-title' }, p.title || ''),
		p.children ? h('div', { className: 'dsp-empty-text' }, p.children) : null,
		p.action ? h('div', { className: 'dsp-empty-action' }, p.action) : null
	);
}

DSP.Empty = Empty;

function Field(props) {
	const p = props || {};
	return h(
		'label',
		{ className: 'dsp-field' + (p.className ? ' ' + p.className : '') },
		p.label ? h('span', { className: 'dsp-field-label' }, p.label, p.optional ? h('span', { className: 'dsp-field-optional' }, '(' + DSP.t('可选') + ')') : null) : null,
		p.children,
		p.hint ? h('span', { className: 'dsp-field-hint' }, p.hint) : null,
		p.error ? h('span', { className: 'dsp-field-error' }, p.error) : null
	);
}

DSP.Field = Field;

function ProgressBar(props) {
	const p = props || {};
	const value = Math.max(0, Math.min(1, Number(p.value) || 0));
	return h(
		'div',
		{ className: 'dsp-progress' + (p.className ? ' ' + p.className : ''), role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(value * 100) },
		h('div', { className: 'dsp-progress-fill', style: { width: Math.round(value * 100) + '%' } })
	);
}

DSP.ProgressBar = ProgressBar;

function Segmented(props) {
	const p = props || {};
	const options = p.options || [];
	return h(
		'div',
		{ className: 'dsp-segmented' + (p.className ? ' ' + p.className : ''), role: 'tablist' },
		options.map(function (option) {
			const active = option.value === p.value;
			return h(
				'button',
				{
					key: option.value,
					type: 'button',
					role: 'tab',
					'aria-selected': active,
					className: 'dsp-segmented-item' + (active ? ' dsp-segmented-active' : ''),
					onClick: function () {
						if (typeof p.onChange === 'function') p.onChange(option.value);
					}
				},
				option.label
			);
		})
	);
}

DSP.Segmented = Segmented;

function Toggle(props) {
	const p = props || {};
	return h(
		'button',
		{
			type: 'button',
			role: 'switch',
			'aria-checked': Boolean(p.checked),
			className: 'dsp-toggle' + (p.checked ? ' dsp-toggle-on' : ''),
			onClick: function () {
				if (typeof p.onChange === 'function') p.onChange(!p.checked);
			}
		},
		h('span', { className: 'dsp-toggle-thumb' })
	);
}

DSP.Toggle = Toggle;

/* 轻量弹窗：无 portal，覆盖在本组件树之上（App 根节点内固定定位）。 */
function Modal(props) {
	const p = props || {};
	React.useEffect(
		function () {
			if (!p.open) return undefined;
			function onKeyDown(event) {
				if (event.key === 'Escape' && typeof p.onClose === 'function') p.onClose();
			}
			window.addEventListener('keydown', onKeyDown);
			return function () {
				window.removeEventListener('keydown', onKeyDown);
			};
		},
		[p.open, p.onClose]
	);
	if (!p.open) return null;
	return h(
		'div',
		{ className: 'dsp-modal-mask', role: 'presentation', onMouseDown: function (event) { if (event.target === event.currentTarget && typeof p.onClose === 'function') p.onClose(); } },
		h(
			'div',
			{ className: 'dsp-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': p.title || 'dialog', style: p.width ? { width: p.width } : undefined },
			h(
				'div',
				{ className: 'dsp-modal-head' },
				h('div', { className: 'dsp-modal-title' }, p.title || ''),
				h(IconBtn, { icon: 'x', label: DSP.t('关闭'), onClick: p.onClose })
			),
			h('div', { className: 'dsp-modal-body' }, p.children),
			p.footer ? h('div', { className: 'dsp-modal-foot' }, p.footer) : null
		)
	);
}

DSP.Modal = Modal;

/* ------------------------------------------------------------------ */
/* Markdown 渲染（无外部依赖，容错流式文本）                           */
/* ------------------------------------------------------------------ */

function isBlockStart(line) {
	return /^(#{1,6}\s|```|\s*[-*+]\s|\s*\d+[.)]\s|>\s?|\|)/.test(line) || /^(-{3,}|\*{3,}|_{3,})\s*$/.test(line);
}

function renderInline(text, prefix) {
	const nodes = [];
	const source = String(text == null ? '' : text);
	const pattern = /(`[^`]*`)|(\*\*[^*]+\*\*)|(__[^_]+__)|(\*[^*\n]+\*)|(_[^_\n]+_)|(~~[^~]+~~)|(\[[^\]]*\]\([^)\s]+\))/g;
	let last = 0;
	let match;
	let index = 0;
	while ((match = pattern.exec(source)) !== null) {
		if (match.index > last) nodes.push(source.slice(last, match.index));
		const token = match[0];
		const key = prefix + '-i' + index;
		index += 1;
		if (token.charAt(0) === '`') {
			nodes.push(h('code', { key: key, className: 'dsp-md-code' }, token.slice(1, -1)));
		} else if (token.indexOf('**') === 0 || token.indexOf('__') === 0) {
			nodes.push(h('strong', { key: key }, token.slice(2, -2)));
		} else if (token.indexOf('~~') === 0) {
			nodes.push(h('del', { key: key }, token.slice(2, -2)));
		} else if (token.charAt(0) === '*') {
			nodes.push(h('em', { key: key }, token.slice(1, -1)));
		} else if (token.charAt(0) === '_') {
			nodes.push(h('em', { key: key }, token.slice(1, -1)));
		} else if (token.charAt(0) === '[') {
			const linkMatch = /^\[([^\]]*)\]\(([^)\s]+)\)$/.exec(token);
			if (linkMatch) {
				const safe = /^(https?:\/\/|mailto:|#|\/|api\/)/i.test(linkMatch[2]);
				nodes.push(
					safe
						? h('a', { key: key, href: linkMatch[2], target: '_blank', rel: 'noreferrer noopener' }, linkMatch[1] || linkMatch[2])
						: h('span', { key: key }, linkMatch[1] || linkMatch[2])
				);
			} else nodes.push(token);
		}
		last = match.index + token.length;
	}
	if (last < source.length) nodes.push(source.slice(last));
	return nodes;
}

function splitTableRow(line) {
	const trimmed = String(line).trim().replace(/^\|/, '').replace(/\|$/, '');
	const cells = [];
	let current = '';
	for (let i = 0; i < trimmed.length; i += 1) {
		const ch = trimmed.charAt(i);
		if (ch === '\\' && trimmed.charAt(i + 1) === '|') {
			current += '|';
			i += 1;
		} else if (ch === '|') {
			cells.push(current.trim());
			current = '';
		} else current += ch;
	}
	cells.push(current.trim());
	return cells;
}

/* 修复「Markdown 标记全部挤在一行」的模型输出（常见于流式/部分模型）。
 * 仅作用于展示层，不修改服务端已保存文本。 */
DSP.repairCollapsedMarkdown = function repairCollapsedMarkdown(text) {
	const source = String(text == null ? '' : text);
	if (source === '') return source;
	const newlineCount = (source.match(/\n/g) || []).length;
	if (newlineCount >= 3) return source;
	let out = source;
	/* 行内出现的 ## 标题标记：在此处断行并补空格。 */
	out = out.replace(/([^\n#])(#{1,6})(?=[^\s#])/g, '$1\n\n$2 ');
	/* 行首标题标记与文字之间没有空格。 */
	out = out.replace(/^(#{1,6})(?=[^\s#])/gm, '$1 ');
	/* 句末标点后紧跟 **加粗小节**。 */
	out = out.replace(/([。！？；;.!?])\s*(\*\*[^*\n]{1,40}\*\*)/g, '$1\n\n$2');
	/* 句末标点后紧跟 1. 2. 列表项（可无空格）。 */
	out = out.replace(/([。！？；;.!?])\s*(\d{1,2})[.、)]\s*/g, '$1\n$2. ');
	/* 中文/标点后紧跟数字列表项，如「推导1.表达式」。 */
	out = out.replace(/([\u4e00-\u9fff])(\d{1,2})[.、)](?=[\u4e00-\u9fffA-Za-z「『“])/g, '$1\n$2. ');
	/* 句末标点后的 - / * 列表。 */
	out = out.replace(/([。！？；;.!?])\s*[-*]\s+(?=[^\s])/g, '$1\n- ');
	/* 中文/句末标点后紧跟加粗 bullet，如「干扰项-**C.1**」「。-**D**」。 */
	out = out.replace(/([\u4e00-\u9fff。！？；;.!?])\s*[-*]\s*(?=\*\*)/g, '$1\n- ');
	/* 行首数字列表标记缺空格。 */
	out = out.replace(/^(\s*\d{1,2})[.)](?=[^\s])/gm, '$1. ');
	/* 全角/半角逗号、顿号后紧跟数字列表项（如「x=1，2.代入」）。 */
	out = out.replace(/([，,、])\s*(\d{1,2})[.、)](?=[\u4e00-\u9fffA-Za-z])/g, '$1\n$2. ');
	/* 逗号/顿号后紧跟加粗 bullet。 */
	out = out.replace(/([，,、])\s*[-*]\s*(?=\*\*)/g, '$1\n- ');
	return out;
};

/* 行内 Markdown 渲染（用于选项等单行/少行文本）：支持 **粗体**、*斜体*、`代码`、链接与换行，
 * 并保留连续空格（调用方给容器加 white-space:pre-wrap 或使用默认的 dsp-inline-md）。 */
DSP.inlineMarkdown = function inlineMarkdown(text) {
	const source = String(text == null ? '' : text);
	const lines = source.replace(/\r\n?/g, '\n').split('\n');
	const nodes = [];
	lines.forEach(function (line, lineIndex) {
		if (lineIndex > 0) nodes.push(h('br', { key: 'br-' + lineIndex }));
		renderInline(line, 'inline-' + lineIndex).forEach(function (node) {
			nodes.push(node);
		});
	});
	return h('span', { className: 'dsp-inline-md' }, nodes);
};

DSP.markdown = function markdown(text) {
	const source = String(text == null ? '' : text).replace(/\r\n?/g, '\n');
	const lines = source.split('\n');
	const blocks = [];
	let i = 0;
	let keySeed = 0;
	function nextKey() {
		keySeed += 1;
		return 'md-' + keySeed;
	}
	while (i < lines.length) {
		const line = lines[i];
		const trimmed = line.trim();
		if (trimmed === '') {
			i += 1;
			continue;
		}
		if (/^```/.test(trimmed)) {
			const lang = trimmed.slice(3).trim();
			const codeLines = [];
			i += 1;
			while (i < lines.length && !/^```/.test(lines[i].trim())) {
				codeLines.push(lines[i]);
				i += 1;
			}
			if (i < lines.length) i += 1;
			blocks.push(h('pre', { key: nextKey(), className: 'dsp-md-pre' }, h('code', { className: 'dsp-md-block-code', 'data-lang': lang }, codeLines.join('\n'))));
			continue;
		}
		const heading = /^(#{1,6})\s*(\S.*)$/.exec(trimmed);
		if (heading) {
			blocks.push(h('div', { key: nextKey(), className: 'dsp-md-h dsp-md-h' + heading[1].length }, renderInline(heading[2], 'h' + keySeed)));
			i += 1;
			continue;
		}
		if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(trimmed)) {
			blocks.push(h('hr', { key: nextKey(), className: 'dsp-md-hr' }));
			i += 1;
			continue;
		}
		if (/^>/.test(trimmed)) {
			const quoteLines = [];
			while (i < lines.length && /^>/.test(lines[i].trim())) {
				quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
				i += 1;
			}
			blocks.push(h('blockquote', { key: nextKey(), className: 'dsp-md-quote' }, DSP.markdown(quoteLines.join('\n'))));
			continue;
		}
		/* 4 空格/Tab 缩进的代码块（LLM 常用来保留代码缩进）。 */
		if (/^(\t| {4})/.test(line) && (i === 0 || lines[i - 1].trim() === '' || blocks.length > 0)) {
			const codeLines = [];
			while (i < lines.length && (lines[i].trim() === '' || /^(\t| {4})/.test(lines[i]))) {
				codeLines.push(lines[i].replace(/^(\t| {4})/, ''));
				i += 1;
			}
			while (codeLines.length > 0 && codeLines[codeLines.length - 1].trim() === '') codeLines.pop();
			if (codeLines.length > 0) {
				blocks.push(h('pre', { key: nextKey(), className: 'dsp-md-pre' }, h('code', { className: 'dsp-md-block-code' }, codeLines.join('\n'))));
				continue;
			}
		}
		if (/^\s*[-*+]\s+/.test(line)) {
			const items = [];
			while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
				items.push(lines[i].replace(/^\s*[-*+]\s+/, ''));
				i += 1;
			}
			blocks.push(h('ul', { key: nextKey(), className: 'dsp-md-list' }, items.map(function (item, itemIndex) {
				return h('li', { key: 'li' + itemIndex }, renderInline(item, 'li' + keySeed + '-' + itemIndex));
			})));
			continue;
		}
		if (/^\s*\d+[.)]\s+/.test(line)) {
			const items = [];
			while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
				items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ''));
				i += 1;
			}
			blocks.push(h('ol', { key: nextKey(), className: 'dsp-md-list' }, items.map(function (item, itemIndex) {
				return h('li', { key: 'li' + itemIndex }, renderInline(item, 'li' + keySeed + '-' + itemIndex));
			})));
			continue;
		}
		if (trimmed.indexOf('|') >= 0 && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1]) && lines[i + 1].indexOf('-') >= 0) {
			const header = splitTableRow(trimmed);
			i += 2;
			const rows = [];
			while (i < lines.length && lines[i].trim().indexOf('|') >= 0 && lines[i].trim() !== '') {
				rows.push(splitTableRow(lines[i]));
				i += 1;
			}
			blocks.push(
				h(
					'div',
					{ key: nextKey(), className: 'dsp-md-table-wrap' },
					h(
						'table',
						{ className: 'dsp-md-table' },
						h('thead', null, h('tr', null, header.map(function (cell, cellIndex) {
							return h('th', { key: 'th' + cellIndex }, renderInline(cell, 'th' + keySeed + '-' + cellIndex));
						}))),
						h('tbody', null, rows.map(function (row, rowIndex) {
							return h('tr', { key: 'tr' + rowIndex }, row.map(function (cell, cellIndex) {
								return h('td', { key: 'td' + cellIndex }, renderInline(cell, 'td' + keySeed + '-' + rowIndex + '-' + cellIndex));
							}));
						}))
					)
				)
			);
			continue;
		}
		const paragraph = [];
		while (i < lines.length && lines[i].trim() !== '' && !(paragraph.length > 0 && isBlockStart(lines[i]))) {
			paragraph.push(lines[i]);
			i += 1;
		}
		if (paragraph.length === 0) {
			i += 1;
			continue;
		}
		const paragraphNodes = [];
		paragraph.forEach(function (paragraphLine, lineIndex) {
			const parts = renderInline(paragraphLine, 'p' + keySeed + '-' + lineIndex);
			parts.forEach(function (part) {
				paragraphNodes.push(part);
			});
			if (lineIndex < paragraph.length - 1) paragraphNodes.push(h('br', { key: 'br' + keySeed + '-' + lineIndex }));
		});
		blocks.push(h('p', { key: nextKey(), className: 'dsp-md-p' }, paragraphNodes));
	}
	return blocks;
};

/* 安全地把服务端返回的相对路径转成题图 URL。 */
DSP.assetUrl = function assetUrl(courseId, relPath) {
	if (!relPath) return '';
	const encodedCourse = encodeURIComponent(courseId || '');
	const normalized = String(relPath).replace(/^\/+/, '');
	// figures 的 relPath 可能是数据根相对路径（courses/...）；asset 路由按 path 原样接收。
	const path = normalized.indexOf('courses/') === 0 ? normalized : 'courses/' + encodedCourse + '/assets/' + normalized;
	return 'api/practice/asset?courseId=' + encodedCourse + '&path=' + encodeURIComponent(path);
};

/* ------------------------------------------------------------------ */
/* HTTP 客户端                                                        */
/* ------------------------------------------------------------------ */

function practiceUrl(pathname) {
	return 'api/practice/' + String(pathname).replace(/^\/+/, '');
}

async function readErrorResponse(response) {
	let message = '';
	try {
		const text = await response.text();
		try {
			const parsed = JSON.parse(text);
			message = parsed && (parsed.error || parsed.message) ? parsed.error || parsed.message : '';
		} catch (error) {
			message = text.slice(0, 300);
		}
	} catch (error) {
		message = '';
	}
	return message || '请求失败（HTTP ' + response.status + '）';
}

async function apiRequest(pathname, options) {
	const opts = options || {};
	const init = { method: opts.method || 'GET', headers: Object.assign({}, opts.headers || {}) };
	if (opts.signal) init.signal = opts.signal;
	if (opts.body !== undefined) {
		init.headers['content-type'] = 'application/json';
		init.body = JSON.stringify(opts.body);
	}
	const response = await fetch(practiceUrl(pathname), init);
	if (!response.ok) throw new Error(await readErrorResponse(response));
	const text = await response.text();
	let json = null;
	try {
		json = JSON.parse(text);
	} catch (error) {
		throw new Error('服务返回了无法解析的数据');
	}
	if (json && json.ok === false) throw new Error(json.error || '请求失败');
	return json;
}

function queryString(params) {
	if (!params) return '';
	const pairs = [];
	Object.keys(params).forEach(function (key) {
		const value = params[key];
		if (value === undefined || value === null || value === '') return;
		pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(value)));
	});
	return pairs.length > 0 ? '?' + pairs.join('&') : '';
}

function getJson(pathname, params) {
	return apiRequest(pathname + queryString(params));
}

function postJson(pathname, body, options) {
	const merged = Object.assign({ method: 'POST', body: body === undefined ? {} : body }, options || {});
	return apiRequest(pathname, merged);
}

DSP.api = {
	request: apiRequest,
	get: getJson,
	post: postJson,
	url: practiceUrl,
	async bootstrap() {
		const json = await getJson('bootstrap');
		return json.data;
	},
	async set(courseId, setId) {
		const json = await getJson('set', { courseId: courseId, setId: setId });
		return json.data;
	},
	async job(jobId) {
		const json = await getJson('job', { jobId: jobId });
		return json.data;
	},
	assetUrl: DSP.assetUrl,
	chatUrl: practiceUrl('chat'),
	ping() {
		return getJson('ping');
	}
};

/* 读取 SSE 流（fetch Response.body），事件为 data: {json}\n\n。 */
DSP.readSSE = async function readSSE(response, handlers) {
	const onEvent = (handlers && handlers.onEvent) || function () {};
	if (!response.ok) throw new Error(await readErrorResponse(response));
	if (!response.body) throw new Error('当前浏览器不支持流式响应');
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	for (;;) {
		const chunk = await reader.read();
		if (chunk.done) break;
		buffer += decoder.decode(chunk.value, { stream: true });
		let boundary = buffer.indexOf('\n\n');
		while (boundary >= 0) {
			const frame = buffer.slice(0, boundary);
			buffer = buffer.slice(boundary + 2);
			const dataLines = frame
				.split('\n')
				.filter(function (line) { return line.indexOf('data:') === 0; })
				.map(function (line) { return line.slice(5).replace(/^\s/, ''); });
			if (dataLines.length > 0) {
				let payload = null;
				try {
					payload = JSON.parse(dataLines.join('\n'));
				} catch (error) {
					payload = null; /* 忽略单帧解析失败，继续读流 */
				}
				if (payload !== null) onEvent(payload);
			}
			boundary = buffer.indexOf('\n\n');
		}
	}
};

/* ------------------------------------------------------------------ */
/* 文件与格式化                                                       */
/* ------------------------------------------------------------------ */

function arrayBufferToBase64(buffer) {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	const chunkSize = 0x8000;
	for (let index = 0; index < bytes.length; index += chunkSize) {
		const chunk = bytes.subarray(index, Math.min(index + chunkSize, bytes.length));
		binary += String.fromCharCode.apply(null, chunk);
	}
	return btoa(binary);
}

DSP.fileToBase64 = async function fileToBase64(file) {
	const buffer = await file.arrayBuffer();
	return arrayBufferToBase64(buffer);
};

DSP.fmtPct = function fmtPct(value, digits) {
	const number = Number(value);
	if (!Number.isFinite(number)) return '—';
	const safeDigits = typeof digits === 'number' ? digits : 0;
	return (number * 100).toFixed(safeDigits) + '%';
};

DSP.fmtDuration = function fmtDuration(ms) {
	const totalSeconds = Math.max(0, Math.round((Number(ms) || 0) / 1000));
	if (totalSeconds < 60) return totalSeconds + ' 秒';
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	if (minutes < 60) return minutes + ' 分' + (seconds > 0 ? ' ' + seconds + ' 秒' : '');
	const hours = Math.floor(minutes / 60);
	const restMinutes = minutes % 60;
	return hours + ' 小时' + (restMinutes > 0 ? ' ' + restMinutes + ' 分' : '');
};

DSP.fmtBytes = function fmtBytes(bytes) {
	const size = Number(bytes) || 0;
	if (size < 1024) return size + ' B';
	if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
	return (size / 1024 / 1024).toFixed(1) + ' MB';
};

function pad2(number) {
	return number < 10 ? '0' + number : String(number);
}

DSP.fmtDate = function fmtDate(timestamp) {
	if (!timestamp) return '—';
	const date = new Date(Number(timestamp));
	if (Number.isNaN(date.getTime())) return '—';
	return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate()) + ' ' + pad2(date.getHours()) + ':' + pad2(date.getMinutes());
};

DSP.fmtDay = function fmtDay(timestamp) {
	const date = new Date(Number(timestamp));
	if (Number.isNaN(date.getTime())) return '—';
	return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
};

DSP.fmtShortDate = function fmtShortDate(timestamp) {
	const date = new Date(Number(timestamp));
	if (Number.isNaN(date.getTime())) return '—';
	return pad2(date.getMonth() + 1) + '-' + pad2(date.getDate()) + ' ' + pad2(date.getHours()) + ':' + pad2(date.getMinutes());
};

DSP.uid = function uid(prefix) {
	const random = Math.random().toString(36).slice(2, 8);
	return (prefix || 'id') + '_' + Date.now().toString(36) + random;
};

DSP.clamp = function clamp(value, min, max) {
	return Math.min(max, Math.max(min, Number(value) || 0));
};

/* 精确到秒的计时器 hook，返回 {elapsed}。 */
DSP.useElapsed = function useElapsed(active) {
	const state = React.useState(0);
	const setElapsed = state[1];
	const startRef = React.useRef(0);
	React.useEffect(
		function () {
			if (!active) return undefined;
			startRef.current = Date.now();
			const timer = window.setInterval(function () {
				setElapsed(Math.round((Date.now() - startRef.current) / 1000));
			}, 1000);
			return function () {
				window.clearInterval(timer);
			};
		},
		[active]
	);
	return state[0];
};

DSP.debounce = function debounce(fn, wait) {
	let timer = null;
	return function debounced() {
		const args = arguments;
		if (timer) window.clearTimeout(timer);
		timer = window.setTimeout(function () {
			timer = null;
			fn.apply(null, args);
		}, wait);
	};
};

DSP.copyText = async function copyText(text) {
	try {
		if (navigator.clipboard && navigator.clipboard.writeText) {
			await navigator.clipboard.writeText(String(text));
			return true;
		}
	} catch (error) {
		/* 落到 textarea 方案 */
	}
	const textarea = document.createElement('textarea');
	textarea.value = String(text);
	textarea.setAttribute('readonly', 'readonly');
	textarea.style.position = 'fixed';
	textarea.style.opacity = '0';
	document.body.appendChild(textarea);
	textarea.select();
	let ok = false;
	try {
		ok = document.execCommand('copy');
	} catch (error) {
		ok = false;
	}
	document.body.removeChild(textarea);
	return ok;
};

/* 记录聚合工具（多个片段共用）：同一题多次作答以最新一条为准。 */
DSP.latestRecords = function latestRecords(records) {
	const map = new Map();
	const source = Array.isArray(records) ? records : [];
	source.forEach(function (record) {
		if (!record || !record.questionId) return;
		const key = String(record.setId || '') + '/' + String(record.questionId);
		const previous = map.get(key);
		if (!previous || (Number(record.at) || 0) >= (Number(previous.at) || 0)) map.set(key, record);
	});
	return Array.from(map.values());
};

DSP.accuracyOf = function accuracyOf(records) {
	const judged = (records || []).filter(function (record) { return record && (record.correct === true || record.correct === false); });
	if (judged.length === 0) return null;
	const correct = judged.filter(function (record) { return record.correct === true; }).length;
	return correct / judged.length;
};
