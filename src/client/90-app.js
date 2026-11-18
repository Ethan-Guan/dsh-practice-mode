/* 刷题模式 Client — 三栏应用壳（Lead 维护）。
 * 负责：初始化 bootstrap、主题 CSS 注入、左侧 Rail / 中间视图 / 右侧 Chat 的三栏布局、
 * 全局 Toast 与框选提问浮层。
 */

function AppLoading(props) {
	return h(
		'div',
		{ className: 'dsp-boot' },
		h('div', { className: 'dsp-boot-card' },
			h('div', { className: 'dsp-boot-logo' }, h(DSP.Icon, { name: 'logo', size: 34 })),
			h('div', { className: 'dsp-boot-title' }, DSP.t('刷题模式')),
			props.error
				? h('div', { className: 'dsp-col dsp-gap-10', style: { alignItems: 'center' } },
					h('div', { className: 'dsp-field-error', style: { maxWidth: '420px', textAlign: 'center' } }, props.error),
					h(DSP.Btn, { variant: 'primary', onClick: props.onRetry, icon: 'refresh' }, DSP.t('重试')))
				: h('div', { className: 'dsp-row dsp-gap-8 dsp-muted' },
					h(DSP.Spinner, { size: 16 }),
					h('span', null, DSP.t('正在加载学习数据…')))
		)
	);
}

function Welcome() {
	const createState = React.useState(false);
	const creating = createState[0];
	const setCreating = createState[1];
	return h(
		'div',
		{ className: 'dsp-welcome' },
		h('div', { className: 'dsp-welcome-hero' },
			h('div', { className: 'dsp-welcome-logo' }, h(DSP.Icon, { name: 'logo', size: 40 })),
			h('h1', { className: 'dsp-welcome-title' }, DSP.t('刷题模式')),
			h('p', { className: 'dsp-welcome-sub' }, '上传课程文档与题目文件，AI 自动解析题目、逐题练习、生成学情看板与复习方案。'),
			h('div', { className: 'dsp-welcome-actions' },
				h(DSP.Btn, { variant: 'primary', size: 'lg', icon: 'plus', onClick: function () { setCreating(true); } }, DSP.t('新建课程')),
				h(DSP.Btn, { variant: 'secondary', size: 'lg', icon: 'chart', onClick: function () { DSP.store.actions.openGlobalDash(); } }, DSP.t('所有课程看板'))
			),
			h('div', { className: 'dsp-welcome-grid' },
				[
					{ icon: 'book', title: '课程与文档', text: '按课程组织资料：上传 PDF / Word / PPT / 文本或整个文件夹。' },
					{ icon: 'list', title: '自动解析题目', text: '扫描题目文件为结构化题目，支持共用材料、选择题、判断题、填空题与简答题。' },
					{ icon: 'chat', title: '答题页答疑', text: '答题时随时提问，答疑只看当前题目与我的回答。' },
					{ icon: 'target', title: '学情与复习', text: '记录每次作答，课程级与全局看板给出易错点与复习计划。' }
				].map(function (item) {
					return h('div', { key: item.title, className: 'dsp-welcome-cell' },
						h('div', { className: 'dsp-welcome-cell-icon' }, h(DSP.Icon, { name: item.icon, size: 20 })),
						h('div', { className: 'dsp-welcome-cell-title' }, item.title),
						h('div', { className: 'dsp-welcome-cell-text' }, item.text));
				})
			)
		),
		creating ? h(DSP.CourseCreateModal, { onClose: function () { setCreating(false); } }) : null
	);
}

function ToastHost() {
	const toasts = DSP.useStore(function (state) {
		return state.ui.toasts || [];
	});
	if (toasts.length === 0) return null;
	return h(
		'div',
		{ className: 'dsp-toasts', role: 'status', 'aria-live': 'polite' },
		toasts.map(function (toast) {
			const icon = toast.kind === 'error' ? 'closeCircle' : toast.kind === 'success' ? 'checkCircle' : toast.kind === 'warn' ? 'alert' : 'bulb';
			return h(
				'div',
				{ key: toast.id, className: 'dsp-toast dsp-toast-' + (toast.kind || 'info') },
				h(DSP.Icon, { name: icon, size: 15 }),
				h('span', null, toast.text),
				h(DSP.IconBtn, {
					icon: 'x',
					size: 13,
					label: '关闭',
					onClick: function () {
						DSP.store.actions.dismissToast(toast.id);
					}
				})
			);
		})
	);
}

function ViewRouter() {
	const state = DSP.useStore(function (value) {
		return { view: value.ui.view, ui: value.ui, courses: value.data.courses };
	});
	const ui = state.ui;
	const hasCourse = Boolean(ui.courseId);
	if (state.view === 'global-dash') {
		return DSP.GlobalDashboard ? h(DSP.GlobalDashboard) : h(Welcome);
	}
	if (!hasCourse) {
		// 左栏已移除：无课程时直接进入中间的「所有课程看板」（课程与看板的统一入口）。
		return DSP.GlobalDashboard ? h(DSP.GlobalDashboard) : h(Welcome);
	}
	if (state.view === 'course-dash') {
		return DSP.CourseDashboard ? h(DSP.CourseDashboard) : h(Welcome);
	}
	if (state.view === 'practice') {
		if (!ui.setId) return DSP.CourseHome ? h(DSP.CourseHome) : h(Welcome);
		return DSP.PracticeArea ? h(DSP.PracticeArea) : h(Welcome);
	}
	return DSP.CourseHome ? h(DSP.CourseHome) : h(Welcome);
}

function App() {
	const state = DSP.useStore(function (value) {
		return { ready: value.ready, loading: value.loading, error: value.error, view: value.ui.view, setId: value.ui.setId };
	});
	const localeBumpState = React.useState(0);
	const bumpLocale = localeBumpState[1];

	React.useEffect(function () {
		DSP.store.actions.init();
	}, []);

	React.useEffect(function () {
		return DSP.subscribeLocale(function () {
			bumpLocale(function (value) {
				return value + 1;
			});
		});
	}, []);

	React.useEffect(function () {
		document.documentElement.classList.add('dsp-mode');
		return function () {
			document.documentElement.classList.remove('dsp-mode');
		};
	}, []);

	const styleElement = h('style', { 'data-practice-mode': 'true' }, __DSP_CSS__);

	if (!state.ready) {
		return h(
			'div',
			{ className: 'dsp-app dsp-app-boot' },
			styleElement,
			h(AppLoading, {
				error: state.error,
				onRetry: function () {
					DSP.store.actions.reload().catch(function () {});
				}
			})
		);
	}

	return h(
		'div',
		{ className: 'dsp-app' },
		styleElement,
		h(
			'main',
			{ className: 'dsp-main', role: 'region', 'aria-label': DSP.t('刷题模式') },
			h(ViewRouter)
		),
		/* 答疑助手只在答题界面出现；课程主页/看板不显示。 */
		state.view === 'practice' && state.setId && DSP.ChatPanel ? h(DSP.ChatPanel) : null,
		state.view === 'practice' && state.setId && DSP.SelectionAction ? h(DSP.SelectionAction) : null,
		h(ToastHost)
	);
}
