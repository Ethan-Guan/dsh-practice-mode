/* 刷题模式 Client — 右侧对话面板（chat-ui-dev）。
 * 负责：对话头部 / 上下文 chips / 消息列表（markdown + 流式）/ 空态 / 输入区。
 * 只读 DSP.store，所有写操作走 DSP.store.actions；组件全部用 React.createElement 书写。
 * 依赖：10-utils 的 DSP.* 基础能力、20-store 的聊天状态；75-composer-attach 提供 chips 渲染。
 */

var chatNewThreadKey = '__new__';
var chatSuggestionDefs = [
	{ icon: 'target', text: '帮我梳理这道题的考点' },
	{ icon: 'alert', text: '我的答案错在哪' },
	{ icon: 'chart', text: '这类题怎么避免再错' }
];
var chatMaxSelectionPreview = 160;

/* 对话区宽度 / 收起状态的本地持久化（localStorage 不可用时静默降级）。 */
var chatWidthStorageKey = 'practice-mode.chat.width';
var chatCollapsedStorageKey = 'practice-mode.chat.collapsed';
var chatDefaultWidth = 384;
var chatMinWidth = 280;
var chatMaxWidth = 640;
var chatCollapsedWidth = 44;

function chatStorageGet(key) {
	try {
		if (typeof window === 'undefined' || !window.localStorage) return null;
		return window.localStorage.getItem(key);
	} catch (error) {
		return null;
	}
}

function chatStorageSet(key, value) {
	try {
		if (typeof window === 'undefined' || !window.localStorage) return;
		window.localStorage.setItem(key, String(value));
	} catch (error) {
		/* localStorage 不可用时忽略 */
	}
}

function chatStorageRemove(key) {
	try {
		if (typeof window === 'undefined' || !window.localStorage) return;
		window.localStorage.removeItem(key);
	} catch (error) {
		/* localStorage 不可用时忽略 */
	}
}

function chatReadStoredWidth() {
	var raw = chatStorageGet(chatWidthStorageKey);
	if (raw === null || raw === undefined || raw === '') return null;
	var parsed = Number(raw);
	if (!Number.isFinite(parsed) || parsed <= 0) return null;
	return Math.round(parsed);
}

/* 宽度统一夹取：280~640；视口较窄时再夹到 min(640, 窗口宽度 * 0.55)。 */
function chatClampWidth(width, viewportWidth) {
	var value = Number(width);
	if (!Number.isFinite(value)) value = chatDefaultWidth;
	var maxWidth = chatMaxWidth;
	var windowWidth = Number(viewportWidth);
	if (Number.isFinite(windowWidth) && windowWidth > 0) {
		maxWidth = Math.max(chatMinWidth, Math.min(chatMaxWidth, Math.round(windowWidth * 0.55)));
	}
	return Math.max(chatMinWidth, Math.min(maxWidth, Math.round(value)));
}

/* ------------------------------------------------------------------ */
/* 输入动作                                                            */
/* ------------------------------------------------------------------ */

function chatSendText(text) {
	var value = String(text == null ? '' : text).trim();
	if (!value) return;
	DSP.store.actions.chatSend(value);
}

function chatSendDraft() {
	var state = DSP.store.get();
	var chat = state.ui && state.ui.chat ? state.ui.chat : {};
	var draft = String(chat.draft == null ? '' : chat.draft).trim();
	if (!draft) return;
	DSP.store.actions.chatSend(draft);
}

/* ------------------------------------------------------------------ */
/* 单条消息                                                            */
/* ------------------------------------------------------------------ */

function chatMessageKey(message, index) {
	var role = message && message.role ? String(message.role) : 'message';
	var at = message && message.at ? String(message.at) : '';
	return role + '-' + at + '-' + index;
}

/* 模型偶尔把 Markdown 标题/列表挤成一行；渲染前尽量修复换行。 */
function chatFormatMarkdown(text) {
	var source = String(text == null ? '' : text);
	if (typeof DSP.repairCollapsedMarkdown === 'function') {
		try {
			return DSP.repairCollapsedMarkdown(source);
		} catch (error) {
			return source;
		}
	}
	return source;
}

function chatUserMessageView(message) {
	var context = (message && message.context) || {};
	var attachments = Array.isArray(context.attachments) ? context.attachments.filter(function (item) {
		return item && (item.type === 'question' || item.type === 'selection');
	}) : [];
	var contextTags = null;
	if (attachments.length > 0) {
		contextTags = h(
			'div',
			{ className: 'dsp-chat-msg-context' },
			attachments.map(function (item, index) {
				var isQuestion = item.type === 'question';
				var label = item.label || (isQuestion ? DSP.t('题目') : DSP.t('选中文字'));
				return h(
					'span',
					{ key: 'ctx-' + index, className: 'dsp-chat-ctx-tag' },
					h(DSP.Icon, { name: isQuestion ? 'list' : 'chat', size: 11 }),
					h('span', null, DSP.t(label))
				);
			})
		);
	}
	var selectedText = typeof context.selectedText === 'string' ? context.selectedText.replace(/\s+/g, ' ').trim() : '';
	var quote = selectedText
		? h(
			'div',
			{ className: 'dsp-chat-quote' },
			selectedText.length > chatMaxSelectionPreview ? selectedText.slice(0, chatMaxSelectionPreview) + '…' : selectedText
		)
		: null;
	return h(
		'div',
		{ className: 'dsp-chat-msg dsp-chat-msg-user' },
		h(
			'div',
			{ className: 'dsp-chat-bubble dsp-chat-bubble-user' },
			contextTags,
			quote,
			h('div', { className: 'dsp-chat-bubble-text' }, String(message && message.text != null ? message.text : ''))
		)
	);
}

function chatAssistantMessageView(message) {
	var isError = Boolean(message && (message.error === true || message.role === 'error'));
	var text = String(message && message.text != null ? message.text : '');
	var refs = message && Array.isArray(message.refs) ? message.refs.filter(Boolean) : [];
	return h(
		'div',
		{ className: 'dsp-chat-msg dsp-chat-msg-assistant' + (isError ? ' dsp-chat-msg-error' : '') },
		h(
			'div',
			{ className: 'dsp-chat-avatar' },
			h(DSP.Icon, { name: isError ? 'alert' : 'robot', size: 15 })
		),
		h(
			'div',
			{ className: 'dsp-chat-assistant-body' },
			h('div', { className: 'dsp-md dsp-chat-md' }, DSP.markdown(chatFormatMarkdown(text))),
			refs.length > 0
				? h(
					'div',
					{ className: 'dsp-chat-refs' },
					refs.map(function (ref, index) {
						var name = typeof ref === 'string' ? ref : (ref && (ref.name || ref.title)) || '';
						if (!name) return null;
						return h(
							DSP.Tag,
							{ key: 'ref-' + index, tone: 'neutral', className: 'dsp-chat-ref' },
							h(DSP.Icon, { name: 'doc', size: 11 }),
							name
						);
					})
				)
				: null
		)
	);
}

function chatMessageView(props) {
	var message = props ? props.message : null;
	if (!message || !message.role) return null;
	if (message.role === 'user') return chatUserMessageView(message);
	return chatAssistantMessageView(message);
}

var chatMessageMemo = React.memo(chatMessageView);

/* ------------------------------------------------------------------ */
/* 消息列表 / 流式气泡                                                  */
/* ------------------------------------------------------------------ */

function chatHistoryView(props) {
	var messages = props && Array.isArray(props.messages) ? props.messages : [];
	if (messages.length === 0) return null;
	return h(
		'div',
		{ className: 'dsp-chat-messages', role: 'log' },
		messages.map(function (message, index) {
			return h(chatMessageMemo, { key: chatMessageKey(message, index), message: message });
		})
	);
}

var chatHistoryMemo = React.memo(chatHistoryView);

function chatPendingView(props) {
	if (!props || !props.streaming) return null;
	var pending = String(props.pending || '');
	return h(
		'div',
		{ className: 'dsp-chat-msg dsp-chat-msg-assistant dsp-chat-msg-pending' },
		h('div', { className: 'dsp-chat-avatar' }, h(DSP.Icon, { name: 'robot', size: 15 })),
		h(
			'div',
			{ className: 'dsp-chat-assistant-body' },
			pending
				? h('div', { className: 'dsp-md dsp-chat-md dsp-chat-stream-md' }, DSP.markdown(chatFormatMarkdown(pending)))
				: h(
					'div',
					{ className: 'dsp-chat-thinking' },
					h(DSP.Spinner, { size: 14 }),
					h('span', null, DSP.t('正在思考') + '…')
				)
		)
	);
}

var chatPendingMemo = React.memo(chatPendingView);

/* ------------------------------------------------------------------ */
/* 空态                                                               */
/* ------------------------------------------------------------------ */

function chatEmptyView(props) {
	var hasCourse = Boolean(props && props.hasCourse);
	if (!hasCourse) {
		return h(
			'div',
			{ className: 'dsp-chat-empty dsp-chat-empty-center' },
			h('div', { className: 'dsp-chat-empty-icon' }, h(DSP.Icon, { name: 'chat', size: 22 })),
			h('div', { className: 'dsp-chat-empty-title' }, DSP.t('选择一个课程开始提问'))
		);
	}
	return h(
		'div',
		{ className: 'dsp-chat-empty' },
		h('div', { className: 'dsp-chat-empty-icon' }, h(DSP.Icon, { name: 'sparkles', size: 22 })),
		h('div', { className: 'dsp-chat-empty-title' }, '基于当前题目与你的回答'),
		h(
			'div',
			{ className: 'dsp-chat-suggestions' },
			chatSuggestionDefs.map(function (item) {
				return h(
					'button',
					{
						key: item.text,
						type: 'button',
						className: 'dsp-chat-suggest',
						onClick: function () {
							DSP.store.actions.setDraft(item.text);
							chatSendText(item.text);
						}
					},
					h(DSP.Icon, { name: item.icon, size: 14 }),
					h('span', null, DSP.t(item.text))
				);
			})
		)
	);
}

var chatEmptyMemo = React.memo(chatEmptyView);

/* ------------------------------------------------------------------ */
/* 头部                                                               */
/* ------------------------------------------------------------------ */

function chatHeaderView(props) {
	var p = props || {};
	var courseName = p.courseName || '';
	var busy = Boolean(p.streaming);
	return h(
		'header',
		{ className: 'dsp-chat-head' },
		h(
			'div',
			{ className: 'dsp-chat-head-main' },
			h(
				'div',
				{ className: 'dsp-chat-title-row' },
				h(DSP.Icon, { name: 'chat', size: 15, className: 'dsp-chat-title-icon' }),
				h('div', { className: 'dsp-chat-title' }, DSP.t('答疑助手'))
			),
			h('div', { className: 'dsp-chat-sub', title: courseName }, courseName || DSP.t('未选择课程'))
		),
		h(
			'div',
			{ className: 'dsp-chat-head-actions' },
			h(DSP.IconBtn, {
				icon: 'chevronRight',
				size: 15,
				label: DSP.t('收起对话'),
				onClick: typeof p.onCollapse === 'function' ? p.onCollapse : undefined
			}),
			h(DSP.IconBtn, {
				icon: 'plus',
				size: 15,
				label: DSP.t('新对话'),
				disabled: busy,
				onClick: function () {
					if (DSP.store.get().ui.chat.streaming) return;
					DSP.store.actions.newChat();
					DSP.store.actions.focusChat();
				}
			}),
			h(DSP.IconBtn, {
				icon: 'trash',
				size: 15,
				label: DSP.t('清空对话'),
				disabled: !p.canClear || busy,
				onClick: typeof p.onClear === 'function' ? p.onClear : undefined
			})
		)
	);
}

var chatHeaderMemo = React.memo(chatHeaderView);

/* ------------------------------------------------------------------ */
/* 上下文 chips                                                        */
/* ------------------------------------------------------------------ */

function chatContextBarView(props) {
	var attachments = props && Array.isArray(props.attachments) ? props.attachments : [];
	if (attachments.length === 0) return null;
	return h(
		'div',
		{ className: 'dsp-chat-context', 'aria-label': DSP.t('附加到对话') },
		attachments.map(function (attachment) {
			var remove = function () {
				if (attachment && attachment.id) DSP.store.actions.removeAttachment(attachment.id);
			};
			if (attachment && typeof DSP.renderChatChip === 'function') return DSP.renderChatChip(attachment, remove);
			return h(
				'div',
				{ key: attachment && attachment.id ? attachment.id : 'attachment', className: 'dsp-chat-chip' },
				h('span', { className: 'dsp-chat-chip-label' }, attachment && attachment.type === 'question' ? DSP.t('题目') : DSP.t('选中文字')),
				h(DSP.IconBtn, {
					icon: 'x',
					size: 12,
					label: DSP.t('删除'),
					className: 'dsp-chat-chip-remove',
					onClick: remove
				})
			);
		})
	);
}

var chatContextBarMemo = React.memo(chatContextBarView);

/* ------------------------------------------------------------------ */
/* 输入区                                                              */
/* ------------------------------------------------------------------ */

function chatComposerView(props) {
	var p = props || {};
	var draft = p.draft == null ? '' : String(p.draft);
	var textareaRef = React.useRef(null);
	var streaming = Boolean(p.streaming);
	var hasCourse = Boolean(p.hasCourse);

	React.useEffect(function () {
		var element = textareaRef.current;
		if (!element) return;
		element.style.height = 'auto';
		/* 无边框透明 textarea：单行高度 = 上下 padding 10px + 行高 20px = 30px。 */
		var nextHeight = Math.min(element.scrollHeight || 0, 132);
		element.style.height = (nextHeight > 0 ? nextHeight : 30) + 'px';
	}, [draft]);

	React.useEffect(function () {
		if (!p.focusBump) return;
		var element = textareaRef.current;
		if (!element) return;
		element.focus();
		try {
			var length = element.value.length;
			element.setSelectionRange(length, length);
		} catch (error) {
			/* 某些环境不支持 setSelectionRange，忽略 */
		}
	}, [p.focusBump]);

	function onChange(event) {
		DSP.store.actions.setDraft(event.target.value);
	}

	function onKeyDown(event) {
		if (!event || event.key !== 'Enter') return;
		if (event.shiftKey) return;
		if (event.nativeEvent && event.nativeEvent.isComposing) return;
		event.preventDefault();
		chatSendDraft();
	}

	var canSend = hasCourse && draft.trim().length > 0 && !streaming;
	return h(
		'div',
		{ className: 'dsp-chat-composer' },
		h('textarea', {
			ref: textareaRef,
			className: 'dsp-chat-input',
			value: draft,
			rows: 1,
			placeholder: DSP.t('输入问题'),
			'aria-label': DSP.t('输入问题'),
			disabled: streaming,
			onChange: onChange,
			onKeyDown: onKeyDown
		}),
		h(DSP.Btn, {
			variant: 'primary',
			icon: 'send',
			iconSize: 15,
			loading: streaming,
			disabled: !canSend,
			className: 'dsp-chat-send',
			title: DSP.t('发送'),
			ariaLabel: DSP.t('发送'),
			onClick: chatSendDraft
		})
	);
}

var chatComposerMemo = React.memo(chatComposerView);

/* ------------------------------------------------------------------ */
/* 对话面板                                                            */
/* ------------------------------------------------------------------ */

DSP.ChatPanel = function ChatPanel() {
	var storeState = DSP.useStore(function (state) {
		var courseId = state.ui.courseId;
		var course = (state.data.courses || []).find(function (item) {
			return item.id === courseId;
		}) || null;
		return {
			course: course,
			courseId: courseId,
			chat: state.ui.chat,
			chatMessages: state.chatMessages,
			threads: state.threads
		};
	});

	var chat = storeState.chat || {};
	var course = storeState.course;
	var courseId = storeState.courseId || null;
	var threadId = chat.threadId || null;
	var messageKey = threadId || chatNewThreadKey;
	var messages = storeState.chatMessages[messageKey] || [];
	var threadInfo = threadId ? (storeState.threads || {})[threadId] : null;
	var loading = Boolean(threadInfo && threadInfo.loading);
	var threadError = threadInfo && threadInfo.error ? String(threadInfo.error) : '';
	var streaming = Boolean(chat.streaming);

	var confirmPair = React.useState(false);
	var confirmOpen = confirmPair[0];
	var setConfirmOpen = confirmPair[1];
	var scrollRef = React.useRef(null);
	var lastCourseRef = React.useRef(null);
	var lastExpandBumpRef = React.useRef(null);

	/* 宽度 / 收起 / 视口：纯 UI 状态，只存在组件内 + localStorage，不进 store。 */
	var widthPair = React.useState(function () {
		return chatReadStoredWidth();
	});
	var panelWidth = widthPair[0];
	var setPanelWidth = widthPair[1];
	var collapsedPair = React.useState(function () {
		return chatStorageGet(chatCollapsedStorageKey) === '1';
	});
	var collapsed = collapsedPair[0];
	var setCollapsed = collapsedPair[1];
	var viewportPair = React.useState(function () {
		return (typeof window !== 'undefined' && window.innerWidth) || 1440;
	});
	var viewportWidth = viewportPair[0];
	var setViewportWidth = viewportPair[1];
	var resizingPair = React.useState(false);
	var resizing = resizingPair[0];
	var setResizing = resizingPair[1];
	var dragRef = React.useRef(null);

	React.useEffect(function () {
		function onWindowResize() {
			setViewportWidth((typeof window !== 'undefined' && window.innerWidth) || 1440);
		}
		window.addEventListener('resize', onWindowResize);
		return function () {
			window.removeEventListener('resize', onWindowResize);
		};
	}, []);

	var collapsePanel = React.useCallback(function () {
		setCollapsed(true);
		chatStorageSet(chatCollapsedStorageKey, '1');
	}, []);

	var expandPanel = React.useCallback(function () {
		setCollapsed(false);
		chatStorageRemove(chatCollapsedStorageKey);
	}, []);

	/* 一键提问 / 框选附加后 store 会递增 ui.chat.expandBump：
	 * 若对话区处于收起态则自动展开。ref 记录上次值，首次挂载不误触发。 */
	React.useEffect(function () {
		var bump = Number(chat.expandBump) || 0;
		var previous = lastExpandBumpRef.current;
		lastExpandBumpRef.current = bump;
		if (previous === null) return;
		if (bump <= previous) return;
		if (!collapsed) return;
		expandPanel();
	}, [chat.expandBump, collapsed, expandPanel]);

	/* 左边缘拖拽：pointer capture + 实时宽度；双击恢复默认 384px。 */
	function handleResizePointerDown(event) {
		if (collapsed || !event) return;
		if (event.button !== undefined && event.button !== 0) return;
		var element = event.currentTarget;
		var root = element && element.parentElement ? element.parentElement : null;
		var startWidth = root && typeof root.getBoundingClientRect === 'function' ? root.getBoundingClientRect().width : panelWidth;
		if (!Number.isFinite(startWidth) || startWidth <= 0) startWidth = panelWidth || chatDefaultWidth;
		try {
			if (element && typeof element.setPointerCapture === 'function' && event.pointerId !== undefined) element.setPointerCapture(event.pointerId);
		} catch (error) {
			/* 指针捕获失败时仍可依赖普通 pointermove */
		}
		dragRef.current = {
			pointerId: event.pointerId,
			startX: typeof event.clientX === 'number' ? event.clientX : 0,
			startWidth: Math.round(startWidth),
			lastWidth: Math.round(startWidth)
		};
		setResizing(true);
		if (typeof event.preventDefault === 'function') event.preventDefault();
	}

	function handleResizePointerMove(event) {
		var drag = dragRef.current;
		if (!drag || !event) return;
		if (drag.pointerId !== undefined && event.pointerId !== undefined && drag.pointerId !== event.pointerId) return;
		var clientX = typeof event.clientX === 'number' ? event.clientX : drag.startX;
		var windowWidth = (typeof window !== 'undefined' && window.innerWidth) || viewportWidth;
		var nextWidth = chatClampWidth(drag.startWidth + (drag.startX - clientX), windowWidth);
		drag.lastWidth = nextWidth;
		setPanelWidth(nextWidth);
		if (typeof event.preventDefault === 'function') event.preventDefault();
	}

	function handleResizePointerUp(event) {
		var drag = dragRef.current;
		if (!drag) return;
		dragRef.current = null;
		setResizing(false);
		try {
			if (event && event.currentTarget && typeof event.currentTarget.releasePointerCapture === 'function' && event.pointerId !== undefined) {
				event.currentTarget.releasePointerCapture(event.pointerId);
			}
		} catch (error) {
			/* 释放指针捕获失败忽略 */
		}
		chatStorageSet(chatWidthStorageKey, drag.lastWidth || drag.startWidth);
	}

	function handleResizeDoubleClick(event) {
		if (event && typeof event.preventDefault === 'function') event.preventDefault();
		setPanelWidth(null);
		chatStorageRemove(chatWidthStorageKey);
	}

	var effectiveWidth = collapsed ? chatCollapsedWidth : chatClampWidth(panelWidth === null ? chatDefaultWidth : panelWidth, viewportWidth);

	/* 课程变化时自动加载最近一条对话线程（仅当当前未指定线程）。
	 * 若旧课程选中的线程不属于新课程，先重置为全新对话，避免跨课程串上下文。 */
	React.useEffect(function () {
		var previousCourseId = lastCourseRef.current;
		lastCourseRef.current = courseId;
		if (!courseId || previousCourseId === courseId) return;
		if (!course) return;
		var threads = Array.isArray(course.chatThreads) ? course.chatThreads : [];
		var activeThreadId = DSP.store.get().ui.chat.threadId;
		if (activeThreadId) {
			var belongsToCourse = threads.some(function (thread) {
				return thread && thread.id === activeThreadId;
			});
			if (!belongsToCourse) {
				DSP.store.actions.newChat();
				activeThreadId = null;
			}
		}
		if (!activeThreadId && threads.length > 0) {
			DSP.store.actions.selectThread(threads[0].id);
		}
	}, [courseId, course]);

	/* 始终滚动到底部；pending 变化时跟随流式输出。 */
	React.useEffect(function () {
		var element = scrollRef.current;
		if (!element) return;
		element.scrollTop = element.scrollHeight;
	}, [messages.length, chat.pending, streaming, threadId]);

	var requestClear = React.useCallback(function () {
		if (DSP.store.get().ui.chat.streaming) return;
		setConfirmOpen(true);
	}, []);
	var closeConfirm = React.useCallback(function () {
		setConfirmOpen(false);
	}, []);
	var applyClear = React.useCallback(function () {
		setConfirmOpen(false);
		DSP.store.actions.clearChat().then(function () {
			DSP.store.actions.toast(DSP.t('已清空对话'), 'success');
		}).catch(function (error) {
			DSP.store.actions.toast(error && error.message ? error.message : DSP.t('清空对话失败'), 'error');
		});
	}, []);

	var canClear = Boolean(course) && !streaming && Boolean(threadId) && messages.length > 0;

	var modal = confirmOpen
		? h(
			DSP.Modal,
			{
				open: true,
				title: DSP.t('清空对话'),
				onClose: closeConfirm,
				footer: [
					h(DSP.Btn, { key: 'cancel', variant: 'ghost', onClick: closeConfirm }, DSP.t('取消')),
					h(DSP.Btn, { key: 'confirm', variant: 'danger', onClick: applyClear }, DSP.t('确认'))
				]
			},
			h('div', { className: 'dsp-chat-confirm-text' }, DSP.t('清空后当前对话的消息将无法恢复，确定继续吗？'))
		)
		: null;

	/* 收起态：约 44px 窄竖条，只留展开按钮 + 竖排标题。 */
	if (collapsed) {
		return h(
			'aside',
			{
				className: 'dsp-chat dsp-chat-collapsed',
				style: { width: chatCollapsedWidth + 'px' },
				role: 'complementary',
				'aria-label': DSP.t('答疑助手')
			},
			h(
				'button',
				{
					type: 'button',
					className: 'dsp-chat-expand',
					title: DSP.t('展开对话'),
					'aria-label': DSP.t('展开对话'),
					onClick: expandPanel
				},
				h(DSP.Icon, { name: 'chevronLeft', size: 15 }),
				h('span', { className: 'dsp-chat-collapsed-title' }, DSP.t('答疑助手'))
			)
		);
	}

	return h(
		'aside',
		{
			className: 'dsp-chat' + (resizing ? ' dsp-chat-resizing' : ''),
			style: { width: effectiveWidth + 'px' },
			role: 'complementary',
			'aria-label': DSP.t('答疑助手')
		},
		h('div', {
			className: 'dsp-chat-resize-handle' + (resizing ? ' dsp-chat-resize-active' : ''),
			role: 'separator',
			'aria-orientation': 'vertical',
			'aria-label': DSP.t('拖动调整对话区宽度'),
			title: DSP.t('拖动调整对话区宽度，双击恢复默认'),
			onPointerDown: handleResizePointerDown,
			onPointerMove: handleResizePointerMove,
			onPointerUp: handleResizePointerUp,
			onPointerCancel: handleResizePointerUp,
			onDoubleClick: handleResizeDoubleClick
		}),
		h(chatHeaderMemo, {
			courseName: course ? course.name : '',
			canClear: canClear,
			streaming: streaming,
			onClear: requestClear,
			onCollapse: collapsePanel
		}),
		h(chatContextBarMemo, { attachments: chat.attachments || [] }),
		h(
			'div',
			{ className: 'dsp-chat-scroll', ref: scrollRef },
			threadError
				? h(
					'div',
					{ className: 'dsp-chat-banner-error' },
					h(DSP.Icon, { name: 'alert', size: 14 }),
					h('span', { className: 'dsp-chat-banner-text' }, DSP.t('加载对话失败') + '：' + threadError),
					h(DSP.Btn, {
						variant: 'ghost',
						className: 'dsp-btn-sm',
						onClick: function () {
							if (threadId) DSP.store.actions.selectThread(threadId);
						}
					}, DSP.t('重试'))
				)
				: null,
			loading && messages.length === 0
				? h(
					'div',
					{ className: 'dsp-chat-fill' },
					h(
						'div',
						{ className: 'dsp-chat-loading' },
						h(DSP.Spinner, { size: 16 }),
						h('span', null, DSP.t('正在加载对话') + '…')
					)
				)
				: messages.length === 0
					? h('div', { className: 'dsp-chat-fill' }, h(chatEmptyMemo, { hasCourse: Boolean(course) }))
					: h(chatHistoryMemo, { messages: messages }),
			h(chatPendingMemo, { pending: chat.pending || '', streaming: streaming })
		),
		h(chatComposerMemo, {
			draft: chat.draft || '',
			streaming: streaming,
			focusBump: chat.focusBump || 0,
			hasCourse: Boolean(course)
		}),
		modal
	);
};
