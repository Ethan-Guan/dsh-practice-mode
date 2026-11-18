/* 刷题模式 Client — 刷题区交卷结果页（practice-ui-dev 维护，40-practice.js 的相邻碎片）。
 *
 * 组件结构：
 *   PracticeResultPage     交卷/已完成后的结果页：本套统计（题数 / 已答 / 正确率 / 正确题数 / 总用时）、
 *                          各题型正确率、待自评题目（全部做完再看模式下交卷后仍可自评）、
 *                          学情分析与复习建议、返回课程 / 再练一次 / 查看课程看板。
 *   PracticeTypeAccuracy   纯 CSS 的题型正确率条形图。
 *   PracticePendingGrade   待自评列表（提交答案、自评正确/错误，保存后刷新统计）。
 *   PracticeAnalysisPanel  课程级 AI 学情分析：actions.diagnose('course') + course.analyses.course.markdown，
 *                          生成中展示 state.ui.analysisJob 进度。
 */

function PracticeResultPage(props) {
	const questions = (props.setData && props.setData.questions) || [];
	const local = props.local || {};
	const stats = pracSetStats(questions, local);
	const durationMs = pracTotalDuration(questions, local) || (local.startedAt ? Math.max(0, Date.now() - local.startedAt) : 0);
	const completedAt = props.setSummary && props.setSummary.completedAt;
	const title = (props.setData && (props.setData.title || (props.setSummary && props.setSummary.title))) || DSP.t('题目集');
	const courseName = (props.course && props.course.name) || '';

	const pendingQuestions = questions.filter(function (question) {
		const record = question && local.records ? local.records[question.id] : null;
		return Boolean(record && record.revealed && record.correct !== true && record.correct !== false);
	});

	function handleSelfGrade(question, correct) {
		const record = question ? local.records[question.id] : null;
		if (!record) return;
		const next = Object.assign({}, record, { correct: Boolean(correct), selfGraded: true, revealed: true });
		local.records[question.id] = next;
		local.revealed[question.id] = true;
		if (typeof props.refresh === 'function') props.refresh();
		Promise.resolve(DSP.store.actions.saveRecords(props.courseId, props.setId, [next])).catch(pracToastError);
	}

	const statItems = [
		{ label: DSP.t('题目'), value: String(stats.total) + ' 道' },
		{ label: DSP.t('已答'), value: stats.answered + ' / ' + stats.total },
		{ label: DSP.t('正确率'), value: stats.accuracy === null ? '—' : DSP.fmtPct(stats.accuracy) },
		{ label: DSP.t('正确') + ' / ' + DSP.t('已答'), value: stats.correct + ' / ' + stats.judged },
		{ label: DSP.t('用时'), value: DSP.fmtDuration(durationMs) }
	];

	return h(
		'div',
		{ className: 'dsp-practice-panel' },
		h(
			'div',
			{ className: 'dsp-practice-scroll' },
			h(
				'div',
				{ className: 'dsp-practice-inner dsp-result' },
				h(
					'div',
					{ className: 'dsp-card dsp-result-hero' },
					h('div', { className: 'dsp-result-icon' }, h(DSP.Icon, { name: 'checkCircle', size: 28 })),
					h(
						'div',
						{ className: 'dsp-result-hero-text' },
						h('h1', { className: 'dsp-page-title' }, '本套练习完成'),
						h(
							'div',
							{ className: 'dsp-page-sub' },
							(title ? title + ' · ' : '') + courseName + (completedAt ? ' · ' + DSP.fmtDate(completedAt) : '')
						)
					),
					h('div', { className: 'dsp-result-hero-side' }, h(DSP.Tag, { tone: 'brand' }, pracModeLabel(props.mode)))
				),
				h(
					'div',
					{ className: 'dsp-result-stats' },
					statItems.map(function (item) {
						return h(
							'div',
							{ key: item.label, className: 'dsp-card dsp-result-stat' },
							h('div', { className: 'dsp-result-stat-value' }, item.value),
							h('div', { className: 'dsp-result-stat-label dsp-small dsp-muted' }, item.label)
						);
					})
				),
				h(PracticeTypeAccuracy, { buckets: stats.byType }),
				pendingQuestions.length > 0
					? h(PracticePendingGrade, {
							questions: pendingQuestions,
							records: local.records,
							courseId: props.courseId,
							onSelfGrade: handleSelfGrade
					  })
					: null,
				h(
					'div',
					{ className: 'dsp-result-actions' },
					h(DSP.Btn, { variant: 'primary', icon: 'refresh', onClick: props.onRestart }, DSP.t('重新练习')),
					h(DSP.Btn, { variant: 'secondary', icon: 'arrowLeft', onClick: props.onBack }, DSP.t('返回课程')),
					h(
						DSP.Btn,
						{
							variant: 'ghost',
							icon: 'chart',
							onClick: function () {
								DSP.store.actions.openCourseDash(props.courseId);
							}
						},
						DSP.t('查看课程看板')
					)
				),
				h(PracticeAnalysisPanel, { courseId: props.courseId })
			)
		)
	);
}

function PracticeTypeAccuracy(props) {
	const buckets = props.buckets || [];
	return h(
		'div',
		{ className: 'dsp-card dsp-type-card' },
		h(
			'div',
			{ className: 'dsp-section-head' },
			h('h3', { className: 'dsp-section-title' }, DSP.t('题型分布')),
			h('span', { className: 'dsp-small dsp-muted' }, '正确率按已判定题目统计')
		),
		buckets.length === 0
			? h('div', { className: 'dsp-small dsp-muted' }, DSP.t('还没有数据'))
			: buckets.map(function (bucket) {
					const accuracy = bucket.judged > 0 ? bucket.correct / bucket.judged : null;
					const width = accuracy === null ? 0 : Math.round(accuracy * 100);
					return h(
						'div',
						{ key: bucket.type, className: 'dsp-type-row' },
						h('span', { className: 'dsp-type-label' }, pracTypeLabel(bucket.type)),
						h('span', { className: 'dsp-type-count dsp-small dsp-muted' }, bucket.answered + ' / ' + bucket.total),
						h(
							'div',
							{ className: 'dsp-type-track' },
							h('div', {
								className: 'dsp-type-fill' + (accuracy !== null && accuracy < 0.6 ? ' dsp-type-fill-low' : ''),
								style: { width: width + '%' }
							})
						),
						h('span', { className: 'dsp-type-pct' }, accuracy === null ? '—' : DSP.fmtPct(accuracy))
					);
			  })
	);
}

function PracticePendingGrade(props) {
	const questions = props.questions || [];
	const records = props.records || {};
	return h(
		'div',
		{ className: 'dsp-card dsp-pending-card' },
		h(
			'div',
			{ className: 'dsp-section-head' },
			h('h3', { className: 'dsp-section-title' }, '待自评题目 (' + questions.length + ')'),
			h('span', { className: 'dsp-small dsp-muted' }, '对照参考答案，选择你的答案是否算正确')
		),
		questions.map(function (question, index) {
			const record = records[question.id] || {};
			/* 与解析区一致：AI 参考答案来源 tag；旧数据/原卷答案不显示 tag。 */
			const answerSource = pracRevealAnswerSource(question);
			const hasAnswerText = pracRevealHasAnswerText(question);
			const answerText = hasAnswerText ? pracFormatAnswer(question) : '暂无参考答案';
			let sourceTag = null;
			if (answerSource === 'ai-doc') {
				sourceTag = h(DSP.Tag, { tone: 'neutral', className: 'dsp-reveal-source dsp-reveal-source-ai-doc' }, 'AI 参考 · 依据课程文档');
			} else if (answerSource === 'ai') {
				sourceTag = h(DSP.Tag, { tone: 'warn', className: 'dsp-reveal-source dsp-reveal-source-ai' }, 'AI 生成参考答案');
			}
			return h(
				'div',
				{ key: question.id || 'pending-' + index, className: 'dsp-card-flat dsp-pending-item' },
				h(
					'div',
					{ className: 'dsp-pending-head' },
					h('span', { className: 'dsp-pending-number' }, '第 ' + pracQuestionNumber(question, index) + ' 题'),
					sourceTag,
					h(DSP.Tag, { tone: 'neutral' }, pracTypeLabel(question.type)),
					h('span', { className: 'dsp-pending-stem dsp-truncate' }, pracQuestionStemText(question))
				),
				h(
					'div',
					{ className: 'dsp-pending-answers dsp-small' },
					h('span', { className: 'dsp-pending-answer' }, '你的答案：' + pracFormatUserAnswer(question, record.answer)),
					h('span', { className: 'dsp-pending-answer' }, '参考答案：' + answerText)
				),
				h(PracticeAnswerFigures, { figures: question.answerFigures, courseId: props.courseId }),
				h(
					'div',
					{ className: 'dsp-row dsp-gap-8 dsp-pending-actions' },
					h(
						DSP.Btn,
						{
							variant: 'secondary',
							icon: 'check',
							className: 'dsp-grade-btn dsp-grade-btn-correct',
							onClick: function () {
								props.onSelfGrade(question, true);
							}
						},
						'我答对了'
					),
					h(
						DSP.Btn,
						{
							variant: 'secondary',
							icon: 'x',
							className: 'dsp-grade-btn dsp-grade-btn-wrong',
							onClick: function () {
								props.onSelfGrade(question, false);
							}
						},
						'我答错了'
					)
				)
			);
		})
	);
}

function PracticeAnalysisPanel(props) {
	const storeState = DSP.useStore(function (value) {
		const courseValue =
			(value.data.courses || []).find(function (course) {
				return course.id === props.courseId;
			}) || null;
		const analyses = courseValue && courseValue.analyses ? courseValue.analyses : null;
		return { job: value.ui.analysisJob || null, analysis: analyses ? analyses.course || null : null };
	});
	const job = storeState.job;
	const analysis = storeState.analysis;
	const state = React.useState(false);
	const starting = state[0];
	const setStarting = state[1];
	const running = Boolean(job && job.scope === 'course' && job.status === 'running');
	const fraction = pracProgressFraction(job && job.progress);

	function generate() {
		if (starting || running) return;
		setStarting(true);
		(async function () {
			try {
				await DSP.store.actions.diagnose('course');
				DSP.store.actions.toast('复习建议已生成', 'success');
			} catch (error) {
				pracToastError(error);
			}
			setStarting(false);
		})();
	}

	return h(
		'div',
		{ className: 'dsp-card dsp-result-analysis' },
		h(
			'div',
			{ className: 'dsp-section-head' },
			h(
				'div',
				{ className: 'dsp-col dsp-gap-4' },
				h('h3', { className: 'dsp-section-title' }, DSP.t('学情分析') + ' · ' + DSP.t('复习方案')),
				h(
					'span',
					{ className: 'dsp-small dsp-muted' },
					analysis ? '更新于 ' + DSP.fmtDate(analysis.generatedAt) + (analysis.stale ? '（数据已更新，可刷新）' : '') : '结合本套成绩与课程文档生成学习建议'
				)
			),
			h(
				DSP.Btn,
				{
					variant: 'secondary',
					icon: 'sparkles',
					loading: running || starting,
					disabled: running || starting,
					onClick: generate
				},
				analysis ? DSP.t('刷新分析') : DSP.t('生成复习方案')
			)
		),
		running
			? h(
					'div',
					{ className: 'dsp-analysis-progress' },
					h(DSP.ProgressBar, { value: fraction }),
					h('div', { className: 'dsp-small dsp-muted' }, (job && job.message) || DSP.t('正在生成') + '…')
			  )
			: null,
		analysis && analysis.markdown
			? h('div', { className: 'dsp-md dsp-analysis-body' }, DSP.markdown(analysis.markdown))
			: running
			? null
			: h('div', { className: 'dsp-small dsp-muted' }, '还没有生成复习建议。点击右上角按钮，让 AI 结合本套练习记录与课程文档给出学情分析和复习重点。')
	);
}
