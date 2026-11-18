/* 刷题模式 Client — 所有课程看板（course-ui-dev）。
 * 汇总统计 / 课程对比 / 最近活动 / 全局 AI 学情分析与建议。
 * 依赖 60-dash.js 中的 DashStatCard、DashAnalysisCard、dashDayKey 等共享工具。
 */

function globalDashActivities(courses) {
	const activities = [];
	(courses || []).forEach(function (course) {
		const setTitles = new Map();
		(course.sets || []).forEach(function (set) {
			setTitles.set(set.id, set.title || '');
		});
		(course.records || []).forEach(function (record) {
			if (!record) return;
			activities.push({
				id: record.id,
				courseId: course.id,
				courseName: course.name || '',
				setTitle: setTitles.get(record.setId) || '',
				correct: record.correct,
				at: Number(record.at) || 0
			});
		});
	});
	activities.sort(function (left, right) {
		return right.at - left.at;
	});
	return activities.slice(0, 15);
}

function globalDashActiveDays(records) {
	const days = new Set();
	(records || []).forEach(function (record) {
		const key = dashDayKey(record && record.at);
		if (key) days.add(key);
	});
	return days.size;
}

/* 课程卡片「最近更新」：取课程/套题/文档/作答记录里的最大时间戳。 */
function globalDashRecentAt(course) {
	let latest = Number(course.updatedAt) || Number(course.createdAt) || 0;
	(course.sets || []).forEach(function (set) {
		latest = Math.max(latest, Number(set.updatedAt) || 0);
	});
	(course.docs || []).forEach(function (doc) {
		latest = Math.max(latest, Number(doc.addedAt) || 0);
	});
	(course.records || []).forEach(function (record) {
		latest = Math.max(latest, Number(record.at) || 0);
	});
	return latest;
}

function GlobalDashboardView() {
	const storeState = DSP.useStore(function (state) {
		return {
			courses: state.data.courses || [],
			global: state.data.global || { analysis: null },
			analysisJob: state.ui.analysisJob || null,
			courseId: state.ui.courseId,
			loading: state.loading
		};
	});
	const createState = React.useState(false);
	const creating = createState[0];
	const setCreating = createState[1];
	const courses = storeState.courses || [];
	const globalAnalysis = storeState.global && storeState.global.analysis ? storeState.global.analysis : null;
	const analysisJob = storeState.analysisJob && storeState.analysisJob.scope === 'global' ? storeState.analysisJob : null;
	const analysisRunning = Boolean(analysisJob && analysisJob.status === 'running');
	const allRecords = [];
	const mergedLatest = [];
	courses.forEach(function (course) {
		(course.records || []).forEach(function (record) {
			if (record) allRecords.push(record);
		});
		/* 全局活跃度/统计按「每个课程内每题最新记录」后合并。 */
		DSP.latestRecords(course.records || []).forEach(function (record) {
			mergedLatest.push(record);
		});
	});
	const latestAll = mergedLatest;
	const accuracy = DSP.accuracyOf(latestAll);
	const activeDays = globalDashActiveDays(allRecords);
	const courseRows = courses.map(function (course) {
		const sets = course.sets || [];
		const latest = DSP.latestRecords(course.records || []);
		const questionTotal = sets.reduce(function (sum, set) {
			return sum + (Number(set.questionCount) || 0);
		}, 0);
		return {
			course: course,
			description: course.description || '',
			setCount: sets.length,
			questionTotal: questionTotal,
			answered: latest.length,
			accuracy: DSP.accuracyOf(latest),
			recentAt: globalDashRecentAt(course)
		};
	});
	const activities = globalDashActivities(courses);

	function openGlobalAnalysis() {
		if (analysisRunning) return;
		Promise.resolve(DSP.store.actions.diagnose('global')).catch(function (failure) {
			DSP.store.actions.toast(dashAnalysisError(failure), 'error');
		});
	}

	return h(
		'div',
		{ className: 'dsp-page dsp-dash-page dsp-global-page' },
		h(
			'div',
			{ className: 'dsp-page-head dsp-dash-head' },
			h(
				'div',
				{ className: 'dsp-col dsp-gap-6 dsp-dash-head-main' },
				h(
					'div',
					{ className: 'dsp-row dsp-gap-8 dsp-dash-title-row' },
					h('h1', { className: 'dsp-page-title' }, DSP.t('所有课程看板')),
					h(DSP.Tag, { tone: 'brand' }, DSP.t('全局'))
				),

			),
			h(
				'div',
				{ className: 'dsp-dash-head-actions' },
				storeState.courseId
					? h(
							DSP.Btn,
							{
								variant: 'secondary',
								icon: 'book',
								onClick: function () { DSP.store.actions.openCourse(storeState.courseId); }
							},
							DSP.t('返回课程主页')
						)
					: null,
				h(
					DSP.Btn,
					{
						variant: 'primary',
						icon: 'plus',
						onClick: function () { setCreating(true); }
					},
					DSP.t('新建课程')
				)
			)
		),
		h(
			'div',
			{ className: 'dsp-scroll' },
			h(
				'div',
				{ className: 'dsp-page-body dsp-dash-body' },
				h(
					'section',
					{ className: 'dsp-global-courses' },
					h(
						'div',
						{ className: 'dsp-section-head' },
						h(
							'div',
							{ className: 'dsp-row dsp-gap-8' },
							h('span', { className: 'dsp-section-icon' }, h(DSP.Icon, { name: 'layers', size: 16 })),
							h('h2', { className: 'dsp-section-title' }, DSP.t('课程')),
							courses.length > 0 ? h('span', { className: 'dsp-count-badge' }, String(courses.length)) : null
						)
					),
					courses.length === 0
						? h(
								'div',
								{ className: 'dsp-card dsp-global-courses-empty' },
								h(
									DSP.Empty,
									{
										icon: 'book',
										title: DSP.t('还没有课程'),
										action: h(
											DSP.Btn,
											{ variant: 'primary', icon: 'plus', onClick: function () { setCreating(true); } },
											DSP.t('新建课程')
										)
									},
									DSP.t('新建课程后，可上传课程文档与题目文件，开始 AI 刷题。')
								)
							)
						: h(
								'div',
								{ className: 'dsp-course-grid' },
								courseRows.map(function (row) {
									const courseName = row.course.name || DSP.t('未命名课程');
									function openCourse() {
										DSP.store.actions.openCourse(row.course.id);
									}
									function openDashboard(event) {
										if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
										DSP.store.actions.openCourseDash(row.course.id);
									}
									return h(
										'div',
										{
											key: row.course.id,
											className: 'dsp-course-card',
											role: 'button',
											tabIndex: 0,
											title: courseName,
											onClick: openCourse,
											onKeyDown: function (event) {
												if (event.target !== event.currentTarget) return;
												if (event.key === 'Enter' || event.key === ' ') {
													event.preventDefault();
													openCourse();
												}
											}
										},
										h(
											'div',
											{ className: 'dsp-course-card-head' },
											h('span', { className: 'dsp-course-card-icon' }, h(DSP.Icon, { name: 'book', size: 15 })),
											h('span', { className: 'dsp-course-card-name dsp-truncate' }, courseName)
										),
										h('p', { className: 'dsp-course-card-desc' }, row.description || DSP.t('暂无课程简介')),
										h(
											'div',
											{ className: 'dsp-course-card-meta' },
											h('span', null, DSP.t('套题数') + ' ' + String(row.setCount)),
											h('span', null, DSP.t('答题数') + ' ' + String(row.answered)),
											h('span', null, DSP.t('正确率') + ' ' + (row.accuracy === null ? '—' : DSP.fmtPct(row.accuracy)))
										),
										h('div', { className: 'dsp-course-card-time' }, DSP.t('最近更新') + ' ' + DSP.fmtShortDate(row.recentAt)),
										h(
											'div',
											{ className: 'dsp-course-card-actions' },
											h(
												DSP.Btn,
												{ variant: 'secondary', icon: 'chart', className: 'dsp-btn-sm', onClick: openDashboard },
												DSP.t('看板')
											),
											h(
												DSP.Btn,
												{
													variant: 'primary',
													icon: 'chevronRight',
													className: 'dsp-btn-sm',
													onClick: function (event) {
														if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
														openCourse();
													}
												},
												DSP.t('进入课程')
											)
										)
									);
								})
							)
				),
				h(
					'div',
					{ className: 'dsp-stats' },
					h(DashStatCard, { icon: 'book', label: DSP.t('课程数'), value: String(courses.length) }),
					h(DashStatCard, { icon: 'list', label: DSP.t('累计刷题'), value: String(latestAll.length), tone: 'brand' }),
					h(DashStatCard, { icon: 'target', label: DSP.t('总正确率'), value: accuracy === null ? '—' : DSP.fmtPct(accuracy), tone: 'success' }),
					h(DashStatCard, { icon: 'clock', label: DSP.t('活跃天数'), value: String(activeDays), tone: 'warn' })
				),
				h(DSP.DashActivityHeatmap, { records: latestAll }),
				h(
					'div',
					{ className: 'dsp-dash-grid dsp-global-grid' },
					h(
						'div',
						{ className: 'dsp-card dsp-compare-card' },
						h(
							'div',
							{ className: 'dsp-section-head' },
							h(
								'div',
								{ className: 'dsp-row dsp-gap-8' },
								h('span', { className: 'dsp-section-icon' }, h(DSP.Icon, { name: 'layers', size: 16 })),
								h('h2', { className: 'dsp-section-title' }, DSP.t('课程对比')),
								courses.length > 0 ? h('span', { className: 'dsp-count-badge' }, String(courses.length)) : null
							)
						),
						courses.length === 0
							? h(DSP.Empty, { icon: 'chart', title: DSP.t('还没有数据') }, DSP.t('添加课程并完成练习后，这里会显示课程对比。'))
							: h(
									'div',
									{ className: 'dsp-compare-list' },
									courseRows.map(function (row) {
										const percent = row.accuracy === null ? 0 : row.accuracy * 100;
										return h(
											'button',
											{
												key: row.course.id,
												type: 'button',
												className: 'dsp-compare-row',
												onClick: function () { DSP.store.actions.openCourseDash(row.course.id); }
											},
											h(
												'span',
												{ className: 'dsp-compare-name' },
												h('span', { className: 'dsp-compare-title dsp-truncate' }, row.course.name || DSP.t('未命名课程')),
												h(
													'span',
													{ className: 'dsp-compare-meta' },
													DSP.t('套数') + ' ' + String(row.setCount) + ' · ' + DSP.t('题数') + ' ' + String(row.questionTotal) + ' · ' + DSP.t('已答') + ' ' + String(row.answered)
												)
											),
											h(
												'span',
												{ className: 'dsp-compare-track' },
												h('span', {
													className: 'dsp-compare-fill' + (row.accuracy !== null && row.accuracy < 0.5 ? ' dsp-compare-fill-bad' : ''),
													style: { width: Math.max(0, Math.min(100, percent)) + '%' }
												})
											),
											h('span', { className: 'dsp-compare-value' }, row.accuracy === null ? '—' : DSP.fmtPct(row.accuracy))
										);
									})
								)
					),
					h(
						'div',
						{ className: 'dsp-card dsp-activity-card' },
						h(
							'div',
							{ className: 'dsp-section-head' },
							h(
								'div',
								{ className: 'dsp-row dsp-gap-8' },
								h('span', { className: 'dsp-section-icon' }, h(DSP.Icon, { name: 'clock', size: 16 })),
								h('h2', { className: 'dsp-section-title' }, DSP.t('最近活动'))
							)
						),
						activities.length === 0
							? h(DSP.Empty, { icon: 'clock', title: DSP.t('还没有数据') }, DSP.t('完成练习后，这里会显示所有课程的最近作答。'))
							: h(
									'div',
									{ className: 'dsp-activity-list' },
									activities.map(function (activity, index) {
										const tone = activity.correct === true ? 'success' : activity.correct === false ? 'error' : 'neutral';
										const label = activity.correct === true ? DSP.t('正确') : activity.correct === false ? DSP.t('错误') : DSP.t('已答');
										return h(
											'div',
											{ key: String(activity.id || index) + '-' + index, className: 'dsp-activity-row' },
											h('span', { className: 'dsp-activity-dot dsp-activity-dot-' + tone }),
											h(
												'span',
												{ className: 'dsp-activity-main' },
												h('span', { className: 'dsp-activity-course dsp-truncate' }, activity.courseName || DSP.t('未命名课程')),
												h('span', { className: 'dsp-activity-sep' }, '·'),
												h('span', { className: 'dsp-activity-set dsp-truncate' }, activity.setTitle || DSP.t('未命名套题'))
											),
											h(DSP.Tag, { tone: tone }, label),
											h('span', { className: 'dsp-activity-time' }, DSP.fmtShortDate(activity.at))
										);
									})
								)
					)
				),
				h(DashAnalysisCard, {
					title: DSP.t('全局学情分析与建议'),
					markdown: globalAnalysis && globalAnalysis.markdown ? globalAnalysis.markdown : '',
					generatedAt: globalAnalysis && globalAnalysis.generatedAt ? globalAnalysis.generatedAt : null,
					job: analysisJob,
					disabled: courses.length === 0,
					onGenerate: openGlobalAnalysis,
					emptyTitle: DSP.t('还没有全局学情分析'),
					emptyText: DSP.t('汇总所有课程的作答记录，生成跨课程的学情分析与复习建议。')
				})
			)
		),
		creating ? h(DSP.CourseCreateModal, { onClose: function () { setCreating(false); } }) : null
	);
}

DSP.GlobalDashboard = GlobalDashboardView;
