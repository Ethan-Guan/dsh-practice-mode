/* 刷题模式 Client — 课程学情看板（course-ui-dev）。
 * 统计卡 / 题型正确率 / 最近 7 天趋势 / 易错题 / AI 学情分析与复习方案。
 * 依赖 store：课程数据来自 bootstrap；题目 type 与题干通过 actions.loadSet 懒加载并缓存。
 */

const DASH_TYPE_ORDER = ['single', 'multiple', 'judge', 'fill', 'short', 'other'];
const DASH_TYPE_SET_LIMIT = 8;
const DASH_WRONG_LIMIT = 10;

function dashTypeLabel(type) {
	if (type === 'single') return DSP.t('单选');
	if (type === 'multiple') return DSP.t('多选');
	if (type === 'judge') return DSP.t('判断');
	if (type === 'fill') return DSP.t('填空');
	if (type === 'short') return DSP.t('简答');
	return DSP.t('其他');
}

function dashPad2(number) {
	return number < 10 ? '0' + number : String(number);
}

function dashDayKey(timestamp) {
	const date = new Date(Number(timestamp));
	if (Number.isNaN(date.getTime())) return '';
	return date.getFullYear() + '-' + dashPad2(date.getMonth() + 1) + '-' + dashPad2(date.getDate());
}

/* 连续复习天数：以今天（或昨天）为起点向前数连续有作答的日期。 */
function dashStreakDays(records) {
	const days = new Set();
	(records || []).forEach(function (record) {
		const key = dashDayKey(record && record.at);
		if (key) days.add(key);
	});
	if (days.size === 0) return 0;
	const cursor = new Date();
	cursor.setHours(0, 0, 0, 0);
	if (!days.has(dashDayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);
	let streak = 0;
	while (days.has(dashDayKey(cursor.getTime()))) {
		streak += 1;
		cursor.setDate(cursor.getDate() - 1);
	}
	return streak;
}

/* 最近 N 天（含今天）每天作答数。 */
function dashRecentDays(records, count) {
	const total = count || 7;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const days = [];
	const index = new Map();
	for (let offset = total - 1; offset >= 0; offset -= 1) {
		const day = new Date(today.getTime());
		day.setDate(day.getDate() - offset);
		const bucket = { key: dashDayKey(day.getTime()), label: day.getMonth() + 1 + '/' + day.getDate(), count: 0 };
		days.push(bucket);
		index.set(bucket.key, bucket);
	}
	(records || []).forEach(function (record) {
		const bucket = index.get(dashDayKey(record && record.at));
		if (bucket) bucket.count += 1;
	});
	return days;
}

/* 最近作答里做错的题目（去重后按时间倒序）。 */
function dashWrongRecords(course) {
	const latest = DSP.latestRecords((course && course.records) || []);
	return latest
		.filter(function (record) {
			return record && record.correct === false;
		})
		.sort(function (left, right) {
			return (Number(right.at) || 0) - (Number(left.at) || 0);
		})
		.slice(0, DASH_WRONG_LIMIT);
}

function dashCourseSetIds(course) {
	const order = new Map();
	((course && course.sets) || []).forEach(function (set, position) {
		order.set(set.id, position);
	});
	const seen = new Set();
	const ids = [];
	((course && course.records) || []).forEach(function (record) {
		if (!record || !record.setId || seen.has(record.setId)) return;
		seen.add(record.setId);
		ids.push(record.setId);
	});
	ids.sort(function (left, right) {
		const leftPosition = order.has(left) ? order.get(left) : 9999;
		const rightPosition = order.has(right) ? order.get(right) : 9999;
		return leftPosition - rightPosition;
	});
	return ids;
}

/* 需要懒加载 set.json 的套题：题型统计最多前 8 套 + 易错题所在套题。 */
function dashSetPlan(course) {
	const typeSetIds = dashCourseSetIds(course).slice(0, DASH_TYPE_SET_LIMIT);
	const wrong = dashWrongRecords(course);
	const neededSetIds = typeSetIds.slice();
	wrong.forEach(function (record) {
		if (record.setId && neededSetIds.indexOf(record.setId) < 0) neededSetIds.push(record.setId);
	});
	return { typeSetIds: typeSetIds, neededSetIds: neededSetIds, wrong: wrong, key: neededSetIds.join('|') };
}

/* 题型正确率：records（每题最近一次）+ set.json 的 question.type。 */
function dashTypeStats(latest, setCache, setIds) {
	const typeByQuestion = new Map();
	(setIds || []).forEach(function (setId) {
		const entry = setCache ? setCache[setId] : null;
		const data = entry && entry.data;
		if (!data || !Array.isArray(data.questions)) return;
		data.questions.forEach(function (question) {
			if (!question || question.id === undefined || question.id === null) return;
			typeByQuestion.set(String(setId) + '/' + String(question.id), question.type || 'other');
		});
	});
	const buckets = new Map();
	(latest || []).forEach(function (record) {
		if (!record || (record.correct !== true && record.correct !== false)) return;
		const type = typeByQuestion.get(String(record.setId || '') + '/' + String(record.questionId || ''));
		if (!type) return;
		const key = DASH_TYPE_ORDER.indexOf(type) >= 0 ? type : 'other';
		const bucket = buckets.get(key) || { type: key, judged: 0, correct: 0 };
		bucket.judged += 1;
		if (record.correct === true) bucket.correct += 1;
		buckets.set(key, bucket);
	});
	const stats = [];
	DASH_TYPE_ORDER.forEach(function (type) {
		const bucket = buckets.get(type);
		if (!bucket) return;
		stats.push({ type: type, total: bucket.judged, correct: bucket.correct, accuracy: bucket.judged > 0 ? bucket.correct / bucket.judged : 0 });
	});
	return stats;
}

function dashSetTitle(course, setId) {
	const set = ((course && course.sets) || []).find(function (item) {
		return item.id === setId;
	});
	return set && set.title ? set.title : DSP.t('未命名套题');
}

function dashAnalysisError(failure) {
	return failure && failure.message ? String(failure.message) : String(failure || DSP.t('操作失败'));
}

/* ------------------------------------------------------------------ */
/* 活跃度热力图（GitHub 贡献图风格，16 周 × 7 天）                       */
/* ------------------------------------------------------------------ */

const DASH_HEAT_WEEKS = 16;

/* 最近 16 周的周网格：列=周，行=周一~周日；未来日期标记 future。 */
function dashHeatmapWeeks() {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const todayTime = today.getTime();
	const mondayOffset = (today.getDay() + 6) % 7;
	const currentMonday = new Date(todayTime);
	currentMonday.setDate(currentMonday.getDate() - mondayOffset);
	const firstMonday = new Date(currentMonday.getTime());
	firstMonday.setDate(firstMonday.getDate() - (DASH_HEAT_WEEKS - 1) * 7);
	const weeks = [];
	for (let weekIndex = 0; weekIndex < DASH_HEAT_WEEKS; weekIndex += 1) {
		const days = [];
		for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
			const date = new Date(firstMonday.getTime());
			date.setDate(date.getDate() + weekIndex * 7 + dayIndex);
			const time = date.getTime();
			days.push({ key: dashDayKey(time), time: time, future: time > todayTime, count: 0 });
		}
		weeks.push(days);
	}
	return weeks;
}

/* 每日作答次数 → 0~4 五档。 */
function dashHeatLevel(count) {
	if (!count || count <= 0) return 0;
	if (count === 1) return 1;
	if (count <= 3) return 2;
	if (count <= 6) return 3;
	return 4;
}

/* 共享组件：records 需传入「每题最新记录」；课程看板与全局看板共用。 */
function DashActivityHeatmap(props) {
	const records = props.records || [];
	const weeks = dashHeatmapWeeks();
	const counts = new Map();
	records.forEach(function (record) {
		const key = dashDayKey(record && record.at);
		if (!key) return;
		counts.set(key, (counts.get(key) || 0) + 1);
	});
	let activeDays = 0;
	let totalCount = 0;
	const cells = [];
	weeks.forEach(function (days, weekIndex) {
		days.forEach(function (day, dayIndex) {
			const count = day.future ? 0 : counts.get(day.key) || 0;
			day.count = count;
			if (count > 0) {
				activeDays += 1;
				totalCount += count;
			}
			const level = day.future ? 0 : dashHeatLevel(count);
			cells.push(
				h('span', {
					key: 'c' + weekIndex + '-' + dayIndex,
					className:
						'dsp-dash-heat-cell dsp-dash-heat-cell-l' +
						String(level) +
						(day.future ? ' dsp-dash-heat-cell-future' : ''),
					title: day.future ? undefined : day.key + ' · ' + String(count) + ' ' + DSP.t('题')
				})
			);
		});
	});
	const summary =
		totalCount > 0
			? DSP.t('最近 16 周共') +
				' ' +
				String(activeDays) +
				' ' +
				DSP.t('天有刷题') +
				' / ' +
				DSP.t('累计') +
				' ' +
				String(totalCount) +
				' ' +
				DSP.t('次')
			: '';
	return h(
		'div',
		{ className: 'dsp-card dsp-dash-heat-card' },
		h(
			'div',
			{ className: 'dsp-section-head' },
			h(
				'div',
				{ className: 'dsp-row dsp-gap-8' },
				h('span', { className: 'dsp-section-icon' }, h(DSP.Icon, { name: 'chart', size: 16 })),
				h('h2', { className: 'dsp-section-title' }, DSP.t('活跃度'))
			),
			summary ? h('span', { className: 'dsp-small dsp-faint' }, summary) : null
		),
		totalCount === 0
			? h(DSP.Empty, { icon: 'chart', title: DSP.t('最近 16 周还没有刷题记录') }, DSP.t('完成练习后，这里会显示每日活跃度。'))
			: h(
					'div',
					{ className: 'dsp-dash-heat-wrap' },
					h('div', { className: 'dsp-dash-heat-grid' }, cells),
					h(
						'div',
						{ className: 'dsp-dash-heat-legend' },
						h('span', { className: 'dsp-dash-heat-legend-label' }, DSP.t('少')),
						[0, 1, 2, 3, 4].map(function (level) {
							return h('span', { key: 'legend-' + level, className: 'dsp-dash-heat-swatch dsp-dash-heat-cell-l' + String(level) });
						}),
						h('span', { className: 'dsp-dash-heat-legend-label' }, DSP.t('多'))
					)
				)
	);
}

function DashStatCard(props) {
	return h(
		'div',
		{ className: 'dsp-stat-card' + (props.tone ? ' dsp-stat-card-' + props.tone : '') },
		h(
			'div',
			{ className: 'dsp-stat-top' },
			h('span', { className: 'dsp-stat-icon' }, h(DSP.Icon, { name: props.icon, size: 15 })),
			h('span', { className: 'dsp-stat-label' }, props.label)
		),
		h('div', { className: 'dsp-stat-value' }, props.value),
		props.hint ? h('div', { className: 'dsp-stat-hint' }, props.hint) : null
	);
}

function DashTypeBars(props) {
	const stats = props.stats || [];
	if (props.loading) {
		return h(
			'div',
			{ className: 'dsp-bars dsp-bars-skeleton', 'aria-hidden': 'true' },
			[0, 1, 2, 3].map(function (row) {
				return h(
					'div',
					{ key: row, className: 'dsp-bar-row' },
					h('span', { className: 'dsp-skeleton dsp-skeleton-label' }),
					h('span', { className: 'dsp-bar-track' }, h('span', { className: 'dsp-skeleton dsp-skeleton-fill', style: { width: 72 - row * 14 + '%' } })),
					h('span', { className: 'dsp-skeleton dsp-skeleton-value' })
				);
			})
		);
	}
	if (stats.length === 0) {
		return h(
			DSP.Empty,
			{ icon: 'target', title: DSP.t('还没有数据') },
			DSP.t('完成练习后，这里会按题型显示正确率。')
		);
	}
	return h(
		'div',
		{ className: 'dsp-bars' },
		stats.map(function (stat) {
			const tone = stat.accuracy >= 0.8 ? 'good' : stat.accuracy < 0.5 ? 'bad' : '';
			return h(
				'div',
				{ key: stat.type, className: 'dsp-bar-row' },
				h(
					'span',
					{ className: 'dsp-bar-label' },
					dashTypeLabel(stat.type),
					h('span', { className: 'dsp-bar-label-count' }, String(stat.total))
				),
				h(
					'span',
					{ className: 'dsp-bar-track' },
					h('span', {
						className: 'dsp-bar-fill' + (tone ? ' dsp-bar-fill-' + tone : ''),
						style: { width: Math.max(2, Math.min(100, stat.accuracy * 100)) + '%' }
					})
				),
				h('span', { className: 'dsp-bar-value' }, DSP.fmtPct(stat.accuracy))
			);
		})
	);
}

function DashTrendChart(props) {
	const days = props.days || [];
	const total = days.reduce(function (sum, day) { return sum + day.count; }, 0);
	if (total === 0) {
		return h(
			DSP.Empty,
			{ icon: 'chart', title: DSP.t('还没有数据') },
			DSP.t('完成练习后，这里会显示最近 7 天的作答趋势。')
		);
	}
	const width = 680;
	const height = 200;
	const padding = { top: 20, right: 12, bottom: 30, left: 12 };
	const innerWidth = width - padding.left - padding.right;
	const innerHeight = height - padding.top - padding.bottom;
	const maxValue = days.reduce(function (max, day) { return Math.max(max, day.count); }, 1);
	const step = innerWidth / days.length;
	const barWidth = Math.max(12, Math.min(48, step * 0.5));
	const baseline = padding.top + innerHeight;
	const nodes = [];
	nodes.push(h('line', { key: 'grid', className: 'dsp-trend-grid', x1: padding.left, y1: padding.top, x2: width - padding.right, y2: padding.top }));
	nodes.push(h('line', { key: 'axis', className: 'dsp-trend-axis', x1: padding.left, y1: baseline, x2: width - padding.right, y2: baseline }));
	days.forEach(function (day, index) {
		const x = padding.left + step * index + (step - barWidth) / 2;
		const ratio = maxValue > 0 ? day.count / maxValue : 0;
		const barHeight = day.count > 0 ? Math.max(4, ratio * innerHeight) : 2;
		const y = baseline - barHeight;
		const isToday = index === days.length - 1;
		nodes.push(
			h(
				'g',
				{ key: day.key },
				h('rect', {
					className: 'dsp-trend-bar' + (day.count > 0 ? '' : ' dsp-trend-bar-empty') + (isToday ? ' dsp-trend-bar-today' : ''),
					x: x,
					y: y,
					width: barWidth,
					height: barHeight,
					rx: Math.min(4, barWidth / 2)
				}),
				day.count > 0
					? h('text', { className: 'dsp-trend-value', x: x + barWidth / 2, y: y - 7, textAnchor: 'middle' }, String(day.count))
					: null,
				h('text', { className: 'dsp-trend-label' + (isToday ? ' dsp-trend-label-today' : ''), x: x + barWidth / 2, y: height - 9, textAnchor: 'middle' }, isToday ? DSP.t('今天') : day.label)
			)
		);
	});
	return h(
		'svg',
		{
			className: 'dsp-trend-svg',
			viewBox: '0 0 ' + width + ' ' + height,
			role: 'img',
			'aria-label': DSP.t('最近 7 天作答趋势')
		},
		nodes
	);
}

function DashAnalysisCard(props) {
	const job = props.job;
	const running = Boolean(job && job.status === 'running');
	const fraction = running ? courseUiProgressFraction(job.progress) : 0;
	const markdown = props.markdown || '';
	const disabled = running || Boolean(props.disabled);
	const generateButton = h(
		DSP.Btn,
		{
			variant: markdown ? 'secondary' : 'primary',
			icon: markdown ? 'refresh' : 'sparkles',
			loading: running,
			disabled: disabled,
			title: props.disabled ? DSP.t('暂无可分析的数据') : undefined,
			onClick: props.onGenerate
		},
		markdown ? DSP.t('刷新分析') : DSP.t('生成学情分析')
	);
	return h(
		'div',
		{ className: 'dsp-card dsp-analysis-card' },
		h(
			'div',
			{ className: 'dsp-section-head' },
			h(
				'div',
				{ className: 'dsp-row dsp-gap-8' },
				h('span', { className: 'dsp-section-icon' }, h(DSP.Icon, { name: 'sparkles', size: 16 })),
				h('h2', { className: 'dsp-section-title' }, props.title),
				markdown ? h(DSP.Tag, { tone: 'brand' }, DSP.t('AI 生成')) : null
			),
			h(
				'div',
				{ className: 'dsp-row dsp-gap-8 dsp-analysis-head-actions' },
				markdown && props.generatedAt ? h('span', { className: 'dsp-small dsp-faint' }, DSP.t('生成于') + ' ' + DSP.fmtDate(props.generatedAt)) : null,
				markdown || running ? generateButton : null
			)
		),
		running
			? h(
					'div',
					{ className: 'dsp-dash-analysis-progress' },
					h('div', { className: 'dsp-row dsp-gap-8 dsp-small dsp-muted' }, h(DSP.Spinner, { size: 14 }), h('span', null, job.message || DSP.t('正在生成'))),
					fraction > 0 ? h(DSP.ProgressBar, { value: fraction }) : null
				)
			: markdown
				? h('div', { className: 'dsp-md dsp-analysis-md' }, DSP.markdown(markdown))
				: h(
						DSP.Empty,
						{
							icon: 'bulb',
							title: props.emptyTitle || DSP.t('还没有学情分析'),
							action: h(
								DSP.Btn,
								{
									variant: 'primary',
									icon: 'sparkles',
									loading: running,
									disabled: disabled,
									title: props.disabled ? DSP.t('暂无可分析的数据') : undefined,
									onClick: props.onGenerate
								},
								DSP.t('生成学情分析')
							)
						},
						props.emptyText || DSP.t('结合作答记录与题目解析生成学情分析与复习方案。')
					)
	);
}

/* 课程级看板。 */
function CourseDashboardView() {
	const storeState = DSP.useStore(function (state) {
		const courses = state.data.courses || [];
		return {
			course: courses.find(function (item) { return item.id === state.ui.courseId; }) || null,
			setCache: state.setCache || {},
			analysisJob: state.ui.analysisJob || null,
			loading: state.loading
		};
	});
	const course = storeState.course;
	const setCache = storeState.setCache || {};
	const courseId = course ? course.id : null;
	const plan = course ? dashSetPlan(course) : { typeSetIds: [], neededSetIds: [], wrong: [], key: '' };
	const neededKey = plan.key;

	React.useEffect(
		function () {
			if (!course || plan.neededSetIds.length === 0) return;
			const cache = DSP.store.get().setCache || {};
			plan.neededSetIds.forEach(function (setId) {
				const entry = cache[setId];
				if (entry && (entry.loading || entry.data || entry.error)) return;
				DSP.store.actions.loadSet(course.id, setId).catch(function () {});
			});
		},
		[courseId, neededKey]
	);

	function loadTopicSets() {
		if (!course) return;
		const cache = DSP.store.get().setCache || {};
		plan.neededSetIds.forEach(function (setId) {
			const entry = cache[setId];
			if (entry && (entry.loading || entry.data)) return;
			DSP.store.actions.loadSet(course.id, setId).catch(function () {});
		});
	}

	if (!course) {
		return h(
			'div',
			{ className: 'dsp-page dsp-dash-page' },
			h(
				'div',
				{ className: 'dsp-page-head' },
				h(
					'div',
					{ className: 'dsp-col dsp-gap-6' },
					h('h1', { className: 'dsp-page-title' }, DSP.t('课程看板'))
				)
			),
			h(
				'div',
				{ className: 'dsp-scroll' },
				h(
					'div',
					{ className: 'dsp-page-body' },
					h(
						'div',
						{ className: 'dsp-card' },
						h(
							DSP.Empty,
							{
								icon: 'chart',
								title: DSP.t('暂无课程'),
								action: h(
									DSP.Btn,
									{ variant: 'primary', icon: 'chart', onClick: function () { DSP.store.actions.openGlobalDash(); } },
									DSP.t('所有课程看板')
								)
							},
							DSP.t('新建课程并完成练习后，这里会显示课程学情看板。')
						)
					)
				)
			)
		);
	}

	const records = course.records || [];
	const latest = DSP.latestRecords(records);
	const sets = course.sets || [];
	const accuracy = DSP.accuracyOf(latest);
	const completedSets = sets.filter(function (set) { return Boolean(set.completedAt); }).length;
	const streak = dashStreakDays(records);
	const analysis = course.analyses && course.analyses.course ? course.analyses.course : null;
	const analysisJob = storeState.analysisJob && storeState.analysisJob.scope === 'course' ? storeState.analysisJob : null;
	const analysisRunning = Boolean(analysisJob && analysisJob.status === 'running');
	const typeLoading = plan.typeSetIds.some(function (setId) {
		const entry = setCache[setId];
		return !entry || entry.loading;
	});
	const typeLoadFailed = plan.typeSetIds.some(function (setId) {
		const entry = setCache[setId];
		return Boolean(entry && entry.error);
	});
	const typeStats = dashTypeStats(latest, setCache, plan.typeSetIds);
	const trendDays = dashRecentDays(records, 7);
	const wrongItems = plan.wrong.map(function (record) {
		const entry = setCache[record.setId];
		const setData = entry && entry.data;
		const questions = setData && Array.isArray(setData.questions) ? setData.questions : null;
		let question = null;
		let questionIndex = -1;
		if (questions) {
			for (let index = 0; index < questions.length; index += 1) {
				if (String(questions[index].id) === String(record.questionId)) {
					question = questions[index];
					questionIndex = index;
					break;
				}
			}
		}
		const number = question && question.number !== undefined && question.number !== null ? question.number : questionIndex >= 0 ? questionIndex + 1 : null;
		const stem = question && question.stem ? String(question.stem) : '';
		const wrongCount = records.filter(function (item) {
			return item && item.setId === record.setId && String(item.questionId) === String(record.questionId) && item.correct === false;
		}).length;
		return {
			record: record,
			setTitle: dashSetTitle(course, record.setId),
			number: number,
			stem: stem,
			questionIndex: questionIndex,
			loaded: Boolean(questions),
			loadError: Boolean(entry && entry.error),
			wrongCount: wrongCount
		};
	});

	function generateAnalysis() {
		Promise.resolve(DSP.store.actions.diagnose('course')).catch(function (failure) {
			DSP.store.actions.toast(dashAnalysisError(failure), 'error');
		});
	}

	function openWrongItem(item) {
		DSP.store.actions.openPractice(course.id, item.record.setId);
		if (item.questionIndex >= 0) DSP.store.actions.ui({ questionIndex: item.questionIndex });
	}

	return h(
		'div',
		{ className: 'dsp-page dsp-dash-page' },
		h(
			'div',
			{ className: 'dsp-page-head dsp-dash-head' },
			h(
				'div',
				{ className: 'dsp-col dsp-gap-6 dsp-dash-head-main' },
				h(
					'div',
					{ className: 'dsp-row dsp-gap-8 dsp-dash-title-row' },
					h(DSP.IconBtn, {
						icon: 'arrowLeft',
						label: DSP.t('返回课程主页'),
						title: DSP.t('返回课程主页'),
						onClick: function () { DSP.store.actions.openCourse(course.id); }
					}),
					h(
						'h1',
						{ className: 'dsp-page-title' },
						h('span', { className: 'dsp-truncate', title: course.name || '' }, course.name || DSP.t('未命名课程')),
						h(DSP.Tag, { tone: 'brand' }, DSP.t('学情看板'))
					)
				),

			),
			h(
				'div',
				{ className: 'dsp-dash-head-actions' },
				h(
					DSP.Btn,
					{
						variant: 'secondary',
						icon: 'book',
						onClick: function () { DSP.store.actions.openCourse(course.id); }
					},
					DSP.t('返回课程主页')
				),
				h(
					DSP.Btn,
					{
						variant: 'primary',
						icon: 'sparkles',
						loading: analysisRunning,
						disabled: analysisRunning,
						onClick: generateAnalysis
					},
					analysis && analysis.markdown ? DSP.t('刷新学习分析') : DSP.t('生成学习分析')
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
					'div',
					{ className: 'dsp-stats' },
					h(DashStatCard, { icon: 'list', label: DSP.t('刷题次数'), value: String(latest.length) }),
					h(DashStatCard, { icon: 'target', label: DSP.t('正确率'), value: accuracy === null ? '—' : DSP.fmtPct(accuracy), tone: 'brand' }),
					h(DashStatCard, { icon: 'checkCircle', label: DSP.t('已完成套数'), value: String(completedSets), tone: 'success' }),
					h(DashStatCard, { icon: 'clock', label: DSP.t('连续复习天数'), value: String(streak), tone: 'warn' })
				),
				h(
					'div',
					{ className: 'dsp-dash-grid' },
					h(
						'div',
						{ className: 'dsp-card dsp-dash-type-card' },
						h(
							'div',
							{ className: 'dsp-section-head' },
							h(
								'div',
								{ className: 'dsp-row dsp-gap-8' },
								h('span', { className: 'dsp-section-icon' }, h(DSP.Icon, { name: 'target', size: 16 })),
								h('h2', { className: 'dsp-section-title' }, DSP.t('题型正确率'))
							),
							typeLoading
								? h(DSP.Spinner, { size: 14 })
								: typeLoadFailed
									? h(
											DSP.Btn,
											{
												variant: 'ghost',
												icon: 'refresh',
												className: 'dsp-btn-sm',
												onClick: loadTopicSets
											},
											DSP.t('重新加载题目')
										)
									: null
						),
						h(DashTypeBars, { stats: typeStats, loading: typeLoading })
					),
					h(
						'div',
						{ className: 'dsp-card dsp-trend-card' },
						h(
							'div',
							{ className: 'dsp-section-head' },
							h(
								'div',
								{ className: 'dsp-row dsp-gap-8' },
								h('span', { className: 'dsp-section-icon' }, h(DSP.Icon, { name: 'chart', size: 16 })),
								h('h2', { className: 'dsp-section-title' }, DSP.t('最近 7 天趋势'))
							)
						),
						h(DashTrendChart, { days: trendDays })
					)
				),
				h(DashActivityHeatmap, { records: latest }),
				h(
					'div',
					{ className: 'dsp-dash-bottom' },
					h(
						'div',
						{ className: 'dsp-card dsp-wrong-card' },
						h(
							'div',
							{ className: 'dsp-section-head' },
							h(
								'div',
								{ className: 'dsp-row dsp-gap-8' },
								h('span', { className: 'dsp-section-icon' }, h(DSP.Icon, { name: 'alert', size: 16 })),
								h('h2', { className: 'dsp-section-title' }, DSP.t('易错题')),
								wrongItems.length > 0 ? h('span', { className: 'dsp-count-badge' }, String(wrongItems.length)) : null
							)
						),
						wrongItems.length === 0
							? h(DSP.Empty, { icon: 'checkCircle', title: DSP.t('暂无错题') }, DSP.t('继续保持，最近没有做错的题目。'))
							: h(
									'div',
									{ className: 'dsp-wrong-list' },
									wrongItems.map(function (item) {
										const stemText = item.stem.length > 80 ? item.stem.slice(0, 80) + '…' : item.stem;
										return h(
											'button',
											{
												key: String(item.record.id || item.record.setId + '/' + item.record.questionId),
												type: 'button',
												className: 'dsp-wrong-item',
												onClick: function () { openWrongItem(item); }
											},
											h(
												'span',
												{ className: 'dsp-wrong-head' },
												h('span', { className: 'dsp-wrong-set dsp-truncate' }, item.setTitle),
												item.number === null ? null : h('span', { className: 'dsp-wrong-index' }, '· ' + DSP.t('第') + String(item.number) + DSP.t('题')),
												h('span', { className: 'dsp-wrong-count' }, '· ' + DSP.t('错误') + ' ' + String(item.wrongCount) + ' ' + DSP.t('次'))
											),
											h(
												'span',
												{ className: 'dsp-wrong-stem' },
												stemText || (item.loaded ? DSP.t('无题干') : item.loadError ? DSP.t('题目加载失败') : DSP.t('正在加载题目…'))
											),
											h('span', { className: 'dsp-wrong-meta' }, DSP.fmtShortDate(item.record.at))
										);
									})
								)
					),
					h(DashAnalysisCard, {
						title: DSP.t('学情分析与复习方案'),
						markdown: analysis && analysis.markdown ? analysis.markdown : '',
						generatedAt: analysis && analysis.generatedAt ? analysis.generatedAt : null,
						job: analysisJob,
						onGenerate: generateAnalysis,
						emptyTitle: DSP.t('还没有学情分析'),
						emptyText: DSP.t('基于作答记录、题型分布与易错题生成学情分析和复习方案。')
					})
				)
			)
		)
	);
}

DSP.DashActivityHeatmap = DashActivityHeatmap;
DSP.CourseDashboard = CourseDashboardView;
