/* 刷题模式 Client — 插件注册（Lead 维护）。
 * 把「刷题模式」入口注册到左侧插件栏 sidebar.panellist，并把工作台注册到
 * layout 的 main keyed slot（key=practice-mode）。sidebar 点击会调用
 * ctx.layout.selectPanel(id)，因此两个注册的 id/key 必须一致。
 */

function PracticePanelIcon(props) {
	// 直接返回 svg（.dsp-icon 为 display:block），避免内联元素基线对齐导致
	// 插件栏未选中时图标视觉上偏上。
	return h(DSP.Icon, { name: 'logo', size: (props && props.size) || 18, title: DSP.t('刷题模式') });
}

function applyPracticeMode(ctx) {
	DSP.initLocale(ctx);

	function logError(label, error) {
		try {
			console.error('[practice-mode] ' + label, error);
		} catch (ignored) {
			/* ignore */
		}
	}

	try {
		const disposePanelIcon = ctx.slots.inject('sidebar.panellist', function () {
			return ctx.slots.register(
				{
					name: 'sidebar.panellist',
					id: 'practice-mode',
					order: 18,
					label: function () {
						return DSP.t('刷题模式');
					}
				},
				PracticePanelIcon
			);
		});
		if (typeof ctx.effect === 'function') ctx.effect(function () { return disposePanelIcon; }, 'practice-mode: sidebar entry');
	} catch (error) {
		logError('sidebar.panellist registration failed', error);
	}

	try {
		const disposeMain = ctx.slots.inject('main', function () {
			return ctx.slots.register(
				{
					name: 'main',
					key: 'practice-mode'
				},
				App
			);
		});
		if (typeof ctx.effect === 'function') ctx.effect(function () { return disposeMain; }, 'practice-mode: main panel');
	} catch (error) {
		logError('main panel registration failed', error);
	}
}
