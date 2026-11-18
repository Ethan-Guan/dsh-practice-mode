/* 刷题模式 Client — 左课程栏 + 课程创建/编辑弹窗（course-ui-dev）。
 * 只读 DSP.store 并调用 store.actions；不直接 fetch。
 * 导出：DSP.Rail、DSP.CourseCreateModal。
 */

function railCourseAccuracy(course) {
	return DSP.accuracyOf(DSP.latestRecords(course && course.records ? course.records : []));
}

/* 任务进度兼容：0~1 视为比例，>1 视为百分数（Host jobs 的 progress 为百分数）。 */
function courseUiProgressFraction(progress) {
	const number = Number(progress);
	if (!Number.isFinite(number) || number <= 0) return 0;
	if (number <= 1) return number;
	return Math.min(1, number / 100);
}

function railCourseMeta(course) {
	const sets = course && course.sets ? course.sets : [];
	const accuracy = railCourseAccuracy(course);
	return sets.length + ' ' + DSP.t('套') + ' · ' + (accuracy === null ? '—' : DSP.fmtPct(accuracy));
}

function RailCourseButton(props) {
	const course = props.course;
	const active = props.active;
	return h(
		'button',
		{
			type: 'button',
			className: 'dsp-rail-course' + (active ? ' dsp-rail-course-active' : ''),
			title: course.name || DSP.t('未命名课程'),
			'aria-current': active ? 'page' : undefined,
			onClick: function () {
				DSP.store.actions.openCourse(course.id);
			}
		},
		h('span', { className: 'dsp-rail-course-name' }, course.name || DSP.t('未命名课程')),
		h('span', { className: 'dsp-rail-course-meta' }, railCourseMeta(course))
	);
}

/* 左栏：新建课程按钮 + 课程列表（可滚动） + 底部全局看板入口。 */
function Rail() {
	const storeState = DSP.useStore(function (state) {
		return {
			courses: state.data.courses || [],
			view: state.ui.view,
			courseId: state.ui.courseId,
			loading: state.loading
		};
	});
	const createState = React.useState(false);
	const creating = createState[0];
	const setCreating = createState[1];
	const courses = storeState.courses || [];
	return h(
		'aside',
		{ className: 'dsp-rail', 'aria-label': DSP.t('刷题模式') },
		h('div', { className: 'dsp-rail-new' },
			h(
				DSP.Btn,
				{
					variant: 'primary',
					icon: 'plus',
					block: true,
					onClick: function () {
						setCreating(true);
					}
				},
				DSP.t('新建课程')
			)
		),
		h(
			'div',
			{ className: 'dsp-rail-scroll' },
			h(
				'div',
				{ className: 'dsp-rail-section' },
				h('span', { className: 'dsp-rail-section-title' }, DSP.t('所有课程')),
				courses.length > 0 ? h('span', { className: 'dsp-rail-section-count' }, String(courses.length)) : null
			),
			courses.length === 0
				? h(
						'div',
						{ className: 'dsp-rail-empty' },
						h('div', { className: 'dsp-rail-empty-title' }, storeState.loading ? DSP.t('正在加载…') : DSP.t('暂无课程'))
					)
				: h(
						'div',
						{ className: 'dsp-rail-list' },
						courses.map(function (course) {
							return h(RailCourseButton, {
								key: course.id,
								course: course,
								active: storeState.view !== 'global-dash' && course.id === storeState.courseId
							});
						})
					)
		),
		h(
			'div',
			{ className: 'dsp-rail-foot' },
			h(
				DSP.Btn,
				{
					variant: 'secondary',
					icon: 'chart',
					block: true,
					className: storeState.view === 'global-dash' ? 'dsp-rail-global-active' : '',
					onClick: function () {
						DSP.store.actions.openGlobalDash();
					}
				},
				DSP.t('所有课程看板')
			)
		),
		creating ? h(DSP.CourseCreateModal, { onClose: function () { setCreating(false); } }) : null
	);
}

/* 新建 / 编辑课程弹窗：props { course?, onClose }。Esc 由 DSP.Modal 统一处理。 */
function CourseCreateModal(props) {
	const options = props || {};
	const editing = Boolean(options.course && options.course.id);
	const nameState = React.useState(editing ? String(options.course.name || '') : '');
	const name = nameState[0];
	const setName = nameState[1];
	const descriptionState = React.useState(editing ? String(options.course.description || '') : '');
	const description = descriptionState[0];
	const setDescription = descriptionState[1];
	const savingState = React.useState(false);
	const saving = savingState[0];
	const setSaving = savingState[1];
	const errorState = React.useState(null);
	const error = errorState[0];
	const setError = errorState[1];
	const nameRef = React.useRef(null);
	const composingState = React.useState(false);
	const composing = composingState[0];
	const setComposing = composingState[1];

	React.useEffect(function () {
		const element = nameRef.current;
		if (!element) return;
		element.focus();
		if (editing) element.select();
	}, []);

	function close() {
		if (typeof options.onClose === 'function') options.onClose();
	}

	function submit() {
		if (saving) return;
		const trimmed = String(name || '').trim();
		if (!trimmed) {
			setError(DSP.t('请输入课程名称'));
			return;
		}
		setSaving(true);
		setError(null);
		const payload = { name: trimmed, description: String(description || '').trim() };
		const request = editing ? DSP.store.actions.updateCourse(options.course.id, payload) : DSP.store.actions.createCourse(payload);
		Promise.resolve(request)
			.then(function () {
				close();
			})
			.catch(function (failure) {
				setSaving(false);
				setError(failure && failure.message ? failure.message : String(failure));
			});
	}

	function onNameKeyDown(event) {
		const nativeEvent = event.nativeEvent || {};
		/* 输入法候选词组合中：Enter 用于确认候选词，不提交表单。 */
		if (composing || nativeEvent.isComposing || nativeEvent.keyCode === 229) return;
		if (event.key === 'Enter') {
			event.preventDefault();
			submit();
		}
	}

	return h(
		DSP.Modal,
		{
			open: true,
			title: editing ? DSP.t('编辑课程') : DSP.t('新建课程'),
			onClose: close,
			footer: [
				h(DSP.Btn, { key: 'cancel', variant: 'ghost', onClick: close, disabled: saving }, DSP.t('取消')),
				h(
					DSP.Btn,
					{ key: 'save', variant: 'primary', icon: 'check', loading: saving, disabled: saving, onClick: submit },
					editing ? DSP.t('保存') : DSP.t('新建课程')
				)
			]
		},
		h(
			'div',
			{ className: 'dsp-col dsp-gap-12' },
			h(
				DSP.Field,
				{ label: DSP.t('课程名称') },
				h('input', {
					ref: nameRef,
					className: 'dsp-input',
					type: 'text',
					value: name,
					maxLength: 80,
					placeholder: DSP.t('例如：高等数学'),
					disabled: saving,
					'aria-invalid': Boolean(error) && !String(name || '').trim(),
					onChange: function (event) {
						setName(event.target.value);
					},
					onCompositionStart: function () {
						setComposing(true);
					},
					onCompositionEnd: function () {
						setComposing(false);
					},
					onKeyDown: onNameKeyDown
				})
			),
			h(
				DSP.Field,
				{ label: DSP.t('课程简介'), optional: true },
				h('textarea', {
					className: 'dsp-textarea',
					rows: 3,
					value: description,
					maxLength: 400,
					placeholder: DSP.t('这门课程的学习范围、目标或备注（可选）'),
					disabled: saving,
					onChange: function (event) {
						setDescription(event.target.value);
					}
				})
			),
			error ? h('div', { className: 'dsp-field-error', role: 'alert' }, error) : null
		)
	);
}

DSP.Rail = Rail;
DSP.CourseCreateModal = CourseCreateModal;
