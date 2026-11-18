/* 刷题模式 Client — 框选提问浮层（chat-ui-dev）。
 * 监听 document 选区：在刷题区（.dsp-main / .dsp-practice-area）内选中文字时，
 * 于选区上方渲染固定定位的「提问」按钮；点击后附加到右侧对话。
 * 浮层由 React 渲染在 App 组件树内（不写 document.body），只用 fixed 定位。
 */

var selRecompute = null;
var selMaxTextLength = 2000;

/* 把选区里的节点安全地转成 Element。 */
function selNodeElement(node) {
	if (!node) return null;
	if (node.nodeType === 1) return node;
	return node.parentElement || null;
}

function selIsEditableElement(element) {
	if (!element || typeof element.closest !== 'function') return false;
	return Boolean(element.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""], [contenteditable="plaintext-only"]'));
}

/* 读取当前选区；不在刷题区或不该触发时返回 null。 */
function selReadSelection() {
	var selection = window.getSelection ? window.getSelection() : null;
	if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
	var rawText = String(selection.toString() || '').trim();
	if (!rawText) return null;
	var range = selection.getRangeAt(0);
	var element = selNodeElement(range.commonAncestorContainer);
	if (!element || typeof element.closest !== 'function') return null;
	/* 仅刷题工作区内触发（右侧对话 / 左侧课程栏 / 浮层自身的文字不触发）。 */
	if (!element.closest('.dsp-main') && !element.closest('.dsp-practice-area')) return null;
	if (element.closest('.dsp-chat') || element.closest('.dsp-rail') || element.closest('.dsp-selection-action')) return null;
	if (selIsEditableElement(element)) return null;
	var rect = range.getBoundingClientRect();
	if (!rect || (rect.width === 0 && rect.height === 0)) return null;
	var text = rawText.length > selMaxTextLength ? rawText.slice(0, selMaxTextLength) : rawText;
	var left = rect.left + rect.width / 2;
	var top = Math.max(40, rect.top - 8);
	if (typeof window.innerWidth === 'number' && window.innerWidth > 140) {
		left = Math.max(70, Math.min(window.innerWidth - 70, left));
	}
	return { text: text, truncated: rawText.length > selMaxTextLength, top: top, left: left };
}

function selClearNativeSelection() {
	try {
		var selection = window.getSelection ? window.getSelection() : null;
		if (selection && typeof selection.removeAllRanges === 'function') selection.removeAllRanges();
	} catch (error) {
		/* 清除选区失败不影响功能 */
	}
}

/* PracticeArea 的 onMouseUp 会调用（也允许外部手动触发重算）。 */
DSP.handlePracticeSelection = function handlePracticeSelection() {
	window.setTimeout(function () {
		if (typeof selRecompute === 'function') selRecompute();
	}, 0);
};

/* 兼容契约导出：附加文字到右侧对话。 */
DSP.attachToChat = function attachToChat(payload) {
	if (!payload) return;
	if (DSP.store && DSP.store.actions && typeof DSP.store.actions.attachToChat === 'function') {
		DSP.store.actions.attachToChat(payload);
	}
};

DSP.SelectionAction = function SelectionAction() {
	var statePair = React.useState(null);
	var overlay = statePair[0];
	var setOverlay = statePair[1];
	var overlayRef = React.useRef(null);
	var suppressRef = React.useRef(0);

	React.useEffect(function () {
		var timer = 0;
		var pressed = false;
		var downPoint = null;

		function apply(next) {
			var normalized = next || null;
			overlayRef.current = normalized;
			setOverlay(normalized);
		}

		function recompute() {
			/* 点击「提问」后短暂抑制重算，避免清空选区失败时按钮又闪回来。 */
			if (Date.now() < suppressRef.current) return;
			apply(selReadSelection());
		}

		selRecompute = recompute;

		function schedule(delay) {
			if (timer) window.clearTimeout(timer);
			timer = window.setTimeout(function () {
				timer = 0;
				recompute();
			}, delay);
		}

		function isActionTarget(node) {
			var element = selNodeElement(node);
			return Boolean(element && typeof element.closest === 'function' && element.closest('.dsp-selection-action'));
		}

		function onMouseDown(event) {
			pressed = true;
			downPoint = { x: event.clientX || 0, y: event.clientY || 0 };
			if (isActionTarget(event.target)) return;
			if (overlayRef.current) apply(null);
		}

		function onMouseUp(event) {
			pressed = false;
			var wasClick = false;
			if (downPoint) {
				wasClick = Math.abs((event.clientX || 0) - downPoint.x) < 4 && Math.abs((event.clientY || 0) - downPoint.y) < 4;
				downPoint = null;
			}
			if (isActionTarget(event.target)) return;
			/* 单纯点击别处（而非拖选）只隐藏，不重新弹出。 */
			if (wasClick) {
				if (overlayRef.current) apply(null);
				return;
			}
			schedule(0);
		}

		function onSelectionChange() {
			if (pressed) return;
			var selection = window.getSelection ? window.getSelection() : null;
			if (!selection || selection.isCollapsed) {
				if (overlayRef.current) apply(null);
				return;
			}
			schedule(90);
		}

		function onScroll() {
			if (overlayRef.current) apply(null);
		}

		function onResize() {
			if (overlayRef.current) apply(null);
		}

		function onKeyDown(event) {
			if (event && event.key === 'Escape' && overlayRef.current) apply(null);
		}

		document.addEventListener('mousedown', onMouseDown, true);
		document.addEventListener('mouseup', onMouseUp, true);
		document.addEventListener('selectionchange', onSelectionChange);
		document.addEventListener('scroll', onScroll, true);
		document.addEventListener('keydown', onKeyDown, true);
		window.addEventListener('resize', onResize);
		return function cleanup() {
			if (timer) window.clearTimeout(timer);
			if (selRecompute === recompute) selRecompute = null;
			document.removeEventListener('mousedown', onMouseDown, true);
			document.removeEventListener('mouseup', onMouseUp, true);
			document.removeEventListener('selectionchange', onSelectionChange);
			document.removeEventListener('scroll', onScroll, true);
			document.removeEventListener('keydown', onKeyDown, true);
			window.removeEventListener('resize', onResize);
		};
	}, []);

	if (!overlay) return null;

	return h(
		'div',
		{
			className: 'dsp-selection-action',
			style: { top: overlay.top + 'px', left: overlay.left + 'px' },
			role: 'presentation',
			onMouseDown: function (event) {
				event.preventDefault();
			}
		},
		h(
			'button',
			{
				type: 'button',
				className: 'dsp-selection-action-btn',
				title: DSP.t('附加到对话'),
				onClick: function (event) {
					event.preventDefault();
					event.stopPropagation();
					var current = overlayRef.current;
					if (!current || !current.text) return;
					if (DSP.store && DSP.store.actions && typeof DSP.store.actions.attachToChat === 'function') {
						DSP.store.actions.attachToChat({ text: current.text, label: DSP.t('选中文字') });
					}
					suppressRef.current = Date.now() + 300;
					selClearNativeSelection();
					overlayRef.current = null;
					setOverlay(null);
				}
			},
			h(DSP.Icon, { name: 'chat', size: 13 }),
			h('span', null, DSP.t('提问'))
		)
	);
};
