/* 刷题模式 Client — 聊天输入区辅助（chat-ui-dev）。
 * 上下文 chips 的渲染放在这里，由 50-chat.js 的上下文条在运行时调用
 * （DSP.renderChatChip），避免 50 与 75 的顶层求值顺序问题。
 */

var chatAttachPreviewLength = 140;

function chatAttachmentTitle(attachment) {
	if (!attachment) return '';
	if (attachment.type === 'question') {
		/* store 的 askQuestion 已经生成「第 N 题」label，优先沿用保证展示一致。 */
		if (attachment.label) return DSP.t(attachment.label);
		var number = attachment.number === undefined || attachment.number === null ? '' : String(attachment.number);
		if (number) return DSP.t('第') + ' ' + number + ' ' + DSP.t('题');
		return DSP.t('题目');
	}
	return DSP.t(attachment.label || '选中文字');
}

function chatAttachmentPreview(attachment) {
	if (!attachment || attachment.type === 'question') return '';
	var source = attachment.text ? String(attachment.text) : '';
	if (!source) return '';
	var compact = source.replace(/\s+/g, ' ').trim();
	if (!compact) return '';
	return compact.length > chatAttachPreviewLength ? compact.slice(0, chatAttachPreviewLength) + '…' : compact;
}

DSP.chatAttachmentTitle = chatAttachmentTitle;
DSP.chatAttachmentPreview = chatAttachmentPreview;

/* 渲染一个上下文 chip：attachment + 可选移除回调。 */
DSP.renderChatChip = function renderChatChip(attachment, onRemove) {
	if (!attachment) return null;
	var isQuestion = attachment.type === 'question';
	var title = chatAttachmentTitle(attachment);
	var preview = chatAttachmentPreview(attachment);
	var children = [
		h(DSP.Icon, { key: 'icon', name: isQuestion ? 'list' : 'chat', size: 13 }),
		h('span', { key: 'label', className: 'dsp-chat-chip-label' }, title)
	];
	if (preview) children.push(h('span', { key: 'preview', className: 'dsp-chat-chip-text', title: preview }, preview));
	if (typeof onRemove === 'function' && attachment.id) {
		children.push(
			h(DSP.IconBtn, {
				key: 'remove',
				icon: 'x',
				size: 12,
				label: DSP.t('删除'),
				className: 'dsp-chat-chip-remove',
				onClick: function (event) {
					if (event) {
						event.preventDefault();
						event.stopPropagation();
					}
					onRemove(attachment.id);
				}
			})
		);
	}
	return h(
		'div',
		{
			key: attachment.id || ('chat-chip-' + attachment.type),
			className: 'dsp-chat-chip ' + (isQuestion ? 'dsp-chat-chip-question' : 'dsp-chat-chip-selection')
		},
		children
	);
};
