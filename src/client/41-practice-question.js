/* 刷题模式 Client — 刷题区题目渲染（practice-ui-dev 维护，40-practice.js 的相邻碎片）。
 *
 * 组件结构：
 *   PracticeQuestionCard   题目卡：题号 / 题型 / 难度 / 考点标签、共用材料、题干 markdown、题图、作答控件、解析区。
 *   PracticeMaterial       跨题共用材料（始终展开的固定区块，含材料内图片）。
 *   PracticeFigure         题图（DSP.assetUrl 取图；加载失败显示占位；旁边「重新绘制示图」按钮，
 *                          svgJob 进行中时按钮 loading，完成后由 store 刷新 set.json 替换图）。
 *   PracticeChoiceList     单选 / 多选 / 判断题的选项列表；reveal 后正确项 success、错选项 error。
 *   PracticeFillControl    填空题输入（按参考答案个数分空）；submit 后禁止编辑。
 *   PracticeTextControl    简答题 / 其他主观题 textarea。
 *   PracticeAnswerControl  按 question.type 分发到上面的控件。
 *   PracticeRevealPanel    reveal 后的答案 + 解析 + 一键提问 + 主观题自评 + 下一题。
 *
 * 富文本：题干/共用材料/解析用 DSP.markdown + `dsp-md-preserve`（保留连续空格/缩进）；
 * 选项、答案、用户作答等短文本用 DSP.inlineMarkdown（保留换行/空格/行内标记）；
 * 含 ``` fenced code block 的文本退回 DSP.markdown 以得到真正的代码块与横向滚动。
 */

/* ------------------------------------------------------------------ */
/* 富文本渲染小工具                                                    */
/* ------------------------------------------------------------------ */

function pracHasCodeFence(text) {
	if (text === undefined || text === null) return false;
	return String(text).indexOf('```') >= 0;
}

function pracInlineMarkdown(text) {
	const source = text === undefined || text === null ? '' : String(text);
	if (typeof DSP.inlineMarkdown === 'function') return DSP.inlineMarkdown(source);
	return source;
}

/* 短文本默认行内渲染；含 fenced code block（或 preferBlock 的多行文本）时改用块级 markdown
 * 以保留代码块 / 段落结构。 */
function pracRichText(text, inlineClassName, blockClassName, preferBlock) {
	const source = text === undefined || text === null ? '' : String(text);
	if (pracHasCodeFence(source) || (preferBlock && source.indexOf('\n') >= 0)) {
		return h('div', { className: 'dsp-md dsp-md-preserve ' + blockClassName }, DSP.markdown(source));
	}
	return h('span', { className: inlineClassName }, pracInlineMarkdown(source));
}

function PracticeQuestionCard(props) {
	const question = props.question || {};
	const type = question.type || 'other';
	const tags = Array.isArray(question.tags) ? question.tags.filter(Boolean) : [];
	const figures = Array.isArray(question.figures) ? question.figures : [];
	const group = pracFindGroup(props.setData, question.groupId);
	const record = props.record || null;
	const revealed = Boolean(props.revealed);
	const pinnedFigureKey = props.pinnedFigureKey || null;

	let statusTag = null;
	if (record && revealed) {
		if (record.correct === true) statusTag = h(DSP.Tag, { tone: 'success' }, DSP.t('正确'));
		else if (record.correct === false) statusTag = h(DSP.Tag, { tone: 'error' }, DSP.t('错误'));
		else statusTag = h(DSP.Tag, { tone: 'warn' }, '待自评');
	}

	return h(
		'div',
		{ className: 'dsp-card dsp-question' },
		h(
			'div',
			{ className: 'dsp-question-head' },
			h(
				'div',
				{ className: 'dsp-question-head-main' },
				h('span', { className: 'dsp-question-number' }, '第 ' + pracQuestionNumber(question, props.index) + ' 题'),
				h(DSP.Tag, { tone: 'neutral' }, pracTypeLabel(type)),
				question.difficulty ? h(DSP.Tag, { tone: pracDifficultyTone(question.difficulty) }, pracDifficultyLabel(question.difficulty)) : null,
				tags.slice(0, 4).map(function (tag, tagIndex) {
					return h(DSP.Tag, { key: 'tag-' + tagIndex, tone: 'neutral' }, String(tag));
				})
			),
			statusTag ? h('div', { className: 'dsp-question-head-status' }, statusTag) : null
		),
		group
			? h(PracticeMaterial, {
					group: group,
					courseId: props.courseId,
					setId: props.setId,
					onPinFigure: props.onPinFigure,
					pinnedFigureKey: pinnedFigureKey
			  })
			: null,
		h('div', { className: 'dsp-question-stem dsp-md dsp-md-preserve' }, DSP.markdown(question.stem || '')),
		figures.length > 0
			? h(
					'div',
					{ className: 'dsp-question-figures' },
					figures.map(function (figure, figureIndex) {
						const item = figure || {};
						return h(PracticeFigure, {
							key: String(item.relPath || item.kind || 'figure') + '-' + figureIndex,
							figure: item,
							index: figureIndex,
							courseId: props.courseId,
							setId: props.setId,
							questionId: question.id,
							svgJob: props.svgJob,
							onRedraw: props.onRedrawFigure,
							onPinFigure: props.onPinFigure,
							pinned: Boolean(item.relPath) && pracFigurePinKey(props.courseId, item.relPath) === pinnedFigureKey
						});
					})
			  )
			: null,
		h(PracticeAnswerControl, {
			question: question,
			index: props.index,
			value: (props.local.answers || {})[question.id],
			revealed: revealed,
			locked: Boolean(props.locked),
			onChange: props.onChange
		}),
		revealed
			? h(PracticeRevealPanel, {
					question: question,
					record: record,
					courseId: props.courseId,
					setId: props.setId,
					isLast: Boolean(props.isLast),
					onAsk: props.onAsk,
					onSelfGrade: props.onSelfGrade,
					onNext: props.onNext,
					aiGrade: props.aiGrade
			  })
			: null
	);
}

function PracticeMaterial(props) {
	const group = props.group || {};
	const figures = Array.isArray(group.figures) ? group.figures : [];
	const pinnedFigureKey = props.pinnedFigureKey || null;
	/* 材料（共用材料）直接显示：标题行 + 材料正文 + 材料内题图。 */
	return h(
		'div',
		{ className: 'dsp-question-material' },
		h(
			'div',
			{ className: 'dsp-question-material-head' },
			h(DSP.Icon, { name: 'book', size: 14 }),
			h('span', { className: 'dsp-question-material-title' }, DSP.t('材料'))
		),
		h(
			'div',
			{ className: 'dsp-question-material-body' },
			group.material
				? h('div', { className: 'dsp-md dsp-md-preserve' }, DSP.markdown(group.material))
				: h('div', { className: 'dsp-small dsp-muted' }, '（材料为空）'),
			figures.length > 0
				? h(
						'div',
						{ className: 'dsp-question-figures dsp-question-material-figures' },
						figures.map(function (figure, figureIndex) {
							const item = figure || {};
							return h(PracticeFigure, {
								key: 'material-figure-' + figureIndex,
								figure: item,
								index: figureIndex,
								courseId: props.courseId,
								setId: props.setId,
								questionId: null,
								svgJob: null,
								onRedraw: null,
								onPinFigure: props.onPinFigure,
								pinned: Boolean(item.relPath) && pracFigurePinKey(props.courseId, item.relPath) === pinnedFigureKey
							});
						})
				  )
				: null
		)
	);
}

function PracticeFigure(props) {
	const figure = props.figure || {};
	const errorState = React.useState(false);
	const failed = errorState[0];
	const setFailed = errorState[1];
	const svgJob = props.svgJob || null;
	const busy = Boolean(
		svgJob &&
			svgJob.status === 'running' &&
			svgJob.setId === props.setId &&
			svgJob.questionId === props.questionId &&
			Number(svgJob.figureIndex) === Number(props.index)
	);
	const canRedraw = typeof props.onRedraw === 'function' && Boolean(props.questionId);
	const canPin = Boolean(figure.relPath) && typeof props.onPinFigure === 'function';
	/* 该图已固定到左侧面板时，题目内 inline 图原地隐藏（display:none，DOM/组件保持挂载）。 */
	const pinned = Boolean(props.pinned);
	const src = figure.relPath ? DSP.assetUrl(props.courseId, figure.relPath) : '';
	const alt = figure.alt ? String(figure.alt) : DSP.t('图片') + ' ' + (props.index + 1);

	function handlePin(event) {
		if (!canPin) return;
		if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
		props.onPinFigure({
			courseId: props.courseId,
			relPath: figure.relPath,
			alt: alt
		});
	}

	/* 点击图片固定到左侧面板；固定后该 inline 图用 display:none 隐藏（不卸载），
	 * 关闭面板或固定另一张图时恢复显示；关闭按钮/换图在 PracticeArea 层处理。 */
	const pinProps = canPin
		? {
				onClick: handlePin,
				onKeyDown: function (event) {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						handlePin(event);
					}
				},
				role: 'button',
				tabIndex: 0,
				title: '固定到左侧查看（关闭左侧图片面板后恢复显示）'
		  }
		: {};

	return h(
		'figure',
		{
			className: 'dsp-figure',
			style: pinned ? { display: 'none' } : undefined,
			'aria-hidden': pinned ? 'true' : undefined
		},
		src && !failed
			? h(
					'img',
					Object.assign(
						{
							className: DSP.cls('dsp-figure-img', canPin ? 'dsp-figure-img-pinnable' : ''),
							src: src,
							alt: alt,
							loading: 'lazy',
							onError: function () {
								setFailed(true);
							}
						},
						pinProps
					)
			  )
			: h(
					'div',
					Object.assign({ className: 'dsp-figure-placeholder' }, pinProps),
					h(DSP.Icon, { name: 'image', size: 22 }),
					h('span', null, failed ? '图片加载失败' : '暂无图片')
			  ),
		h(
			'figcaption',
			{ className: 'dsp-figure-cap' },
			h('span', { className: 'dsp-figure-alt dsp-truncate' }, alt),
			canRedraw
				? h(
						DSP.Btn,
						{
							variant: 'ghost',
							icon: busy ? undefined : 'refresh',
							loading: busy,
							disabled: busy,
							className: 'dsp-figure-redraw',
							title: DSP.t('重新绘制示图'),
							onClick: function () {
								props.onRedraw(props.questionId, props.index);
							}
						},
						busy ? DSP.t('正在生成') : DSP.t('重新绘制示图')
				  )
				: null
		)
	);
}

function PracticeChoiceList(props) {
	const question = props.question || {};
	const options = Array.isArray(props.options) ? props.options : [];
	const selectedKeys = (props.selectedKeys || []).map(String);
	const correctKeys = (props.correctKeys || []).map(String);
	const revealed = Boolean(props.revealed);
	const locked = Boolean(props.locked);
	const disabled = revealed || locked;
	return h(
		'div',
		{ className: 'dsp-answer-list' + (props.multiple ? ' dsp-answer-multiple' : ''), role: props.multiple ? 'group' : 'radiogroup' },
		options.map(function (option, optionIndex) {
			const item = option || {};
			const key = String(item.key === undefined || item.key === null ? optionIndex : item.key);
			const selected = selectedKeys.indexOf(key) >= 0;
			const isCorrect = revealed && correctKeys.indexOf(key) >= 0;
			const isWrong = revealed && selected && !isCorrect;
			const text = item.text === undefined || item.text === null ? '' : String(item.text);
			return h(
				'label',
				{
					key: key + '-' + optionIndex,
					className: DSP.cls(
						'dsp-answer-option',
						selected ? 'dsp-answer-option-selected' : '',
						isCorrect ? 'dsp-answer-option-correct' : '',
						isWrong ? 'dsp-answer-option-wrong' : '',
						disabled ? 'dsp-answer-option-locked' : ''
					)
				},
				h('input', {
					type: props.multiple ? 'checkbox' : 'radio',
					name: props.name || 'practice-choice',
					checked: selected,
					disabled: disabled,
					onChange: function () {
						if (disabled) return;
						if (props.multiple) {
							const next = selectedKeys.slice();
							const position = next.indexOf(key);
							if (position >= 0) next.splice(position, 1);
							else next.push(key);
							props.onChange(next);
						} else {
							props.onChange([key]);
						}
					}
				}),
				h('span', { className: 'dsp-answer-indicator', 'aria-hidden': 'true' }, h('span', { className: 'dsp-answer-dot' })),
				h('span', { className: 'dsp-answer-key' }, key),
				pracRichText(text, 'dsp-answer-text', 'dsp-answer-text dsp-answer-text-block'),
				isCorrect ? h(DSP.Icon, { key: 'correct', name: 'checkCircle', size: 15, className: 'dsp-answer-mark dsp-answer-mark-correct' }) : null,
				isWrong ? h(DSP.Icon, { key: 'wrong', name: 'closeCircle', size: 15, className: 'dsp-answer-mark dsp-answer-mark-wrong' }) : null
			);
		})
	);
}

function PracticeFillControl(props) {
	const question = props.question || {};
	const value = pracToArray(props.value);
	const revealed = Boolean(props.revealed);
	const locked = Boolean(props.locked);
	const disabled = revealed || locked;
	const blanks = Math.max(1, pracToArray(question.answer).length);
	const inputs = [];
	for (let index = 0; index < blanks; index += 1) {
		inputs.push(
			h(
				'div',
				{ className: 'dsp-fill-row', key: 'blank-' + index },
				blanks > 1 ? h('span', { className: 'dsp-fill-label dsp-small dsp-muted' }, '第 ' + (index + 1) + ' 空') : null,
				h('input', {
					className: 'dsp-input dsp-fill-input',
					type: 'text',
					value: value[index] === undefined ? '' : value[index],
					placeholder: blanks > 1 ? '填写第 ' + (index + 1) + ' 空' : '填写答案',
					disabled: disabled,
					onChange: function (event) {
						if (disabled) return;
						const next = value.slice();
						while (next.length < blanks) next.push('');
						next[index] = event.target.value;
						props.onChange(next);
					}
				})
			)
		);
	}
	return h(
		'div',
		{ className: 'dsp-fill' },
		h('div', { className: 'dsp-fill-hint dsp-small dsp-muted' }, '填写后提交，系统会自动去空白 / 标点比对；若判定不一致，可对照参考答案自评。'),
		inputs
	);
}

function PracticeTextControl(props) {
	const value = pracToArray(props.value);
	const revealed = Boolean(props.revealed);
	const locked = Boolean(props.locked);
	const disabled = revealed || locked;
	return h(
		'div',
		{ className: 'dsp-answer-textarea-wrap' },
		h('textarea', {
			className: 'dsp-textarea dsp-answer-textarea',
			value: value[0] === undefined ? '' : value[0],
			placeholder: '写下你的答案…',
			disabled: disabled,
			onChange: function (event) {
				if (disabled) return;
				props.onChange([event.target.value]);
			}
		}),
		h('div', { className: 'dsp-small dsp-muted dsp-answer-textarea-hint' }, '简答题提交后显示参考答案，需要你对照自评。')
	);
}

function PracticeAnswerControl(props) {
	const question = props.question || {};
	const type = question.type || 'other';
	const value = pracToArray(props.value);
	const revealed = Boolean(props.revealed);
	const locked = Boolean(props.locked);
	if (type === 'single' || type === 'multiple') {
		const options = Array.isArray(question.options) ? question.options : [];
		if (options.length === 0) {
			return h('div', { className: 'dsp-practice-banner dsp-practice-banner-info' }, h(DSP.Icon, { name: 'alert', size: 14 }), h('span', { className: 'dsp-practice-banner-text' }, '这道题没有可选项，请结合材料作答。'));
		}
		return h(PracticeChoiceList, {
			question: question,
			options: options,
			multiple: type === 'multiple',
			selectedKeys: value,
			correctKeys: pracToArray(question.answer).map(String),
			revealed: revealed,
			locked: locked,
			name: 'practice-' + String(question.id || 'q') + '-' + props.index,
			onChange: props.onChange
		});
	}
	if (type === 'judge') {
		return h(PracticeChoiceList, {
			question: question,
			options: [
				{ key: '正确', text: DSP.t('正确') },
				{ key: '错误', text: DSP.t('错误') }
			],
			multiple: false,
			selectedKeys: value,
			correctKeys: pracJudgeCorrectKeys(question),
			revealed: revealed,
			locked: locked,
			name: 'practice-' + String(question.id || 'q') + '-' + props.index,
			onChange: props.onChange
		});
	}
	if (type === 'fill') {
		return h(PracticeFillControl, { question: question, value: value, revealed: revealed, locked: locked, onChange: props.onChange });
	}
	return h(PracticeTextControl, { question: question, value: value, revealed: revealed, locked: locked, onChange: props.onChange });
}

/* ------------------------------------------------------------------ */
/* 参考答案来源 / 无答案兜底（两阶段参考答案 Host 改造配套）            */
/*   answerSource: 'source' 原卷答案 | 'ai-doc' AI 参考+课程文档依据   */
/*                 | 'ai' AI 生成；旧 set.json 无字段时按原卷处理。     */
/* ------------------------------------------------------------------ */

function pracRevealAnswerSource(question) {
	const source = question ? question.answerSource : null;
	if (source === 'ai-doc' || source === 'ai') return source;
	return 'source';
}

function pracRevealAnswerRefs(question) {
	const refs = question && Array.isArray(question.answerRefs) ? question.answerRefs : [];
	return refs
		.map(function (ref) {
			return ref === undefined || ref === null ? '' : String(ref).trim();
		})
		.filter(function (ref) {
			return ref !== '';
		});
}

function pracRevealHasAnswerText(question) {
	if (!question) return false;
	if (question.answerDisplay !== undefined && question.answerDisplay !== null && String(question.answerDisplay).trim() !== '') return true;
	return pracToArray(question.answer).some(function (item) {
		return String(item).trim() !== '';
	});
}

function pracRevealHasAnalysis(question) {
	return Boolean(question && question.analysis !== undefined && question.analysis !== null && String(question.analysis).trim() !== '');
}

/* ------------------------------------------------------------------ */
/* AI 判题卡片                                                         */
/*   Host /grade job.result 约定：{verdict,score,summary,suggestions,   */
/*   correctedAnswer?,refs,generatedAt}；verdict: correct|partial|      */
/*   incorrect（兼容中文/旧值）；旧记录无 aiGrade 时不渲染。            */
/* ------------------------------------------------------------------ */

function pracAiGradeVerdictInfo(grade) {
	const raw = grade && grade.verdict !== undefined && grade.verdict !== null ? String(grade.verdict).trim().toLowerCase() : '';
	if (raw === 'correct' || raw === '答对' || raw === '正确') return { label: '答对', tone: 'success' };
	if (raw === 'partial' || raw === '部分正确' || raw === '部分对') return { label: '部分正确', tone: 'warn' };
	if (raw === 'incorrect' || raw === 'wrong' || raw === '答错' || raw === '错误') return { label: '答错', tone: 'error' };
	const score = Number(grade && grade.score);
	if (Number.isFinite(score)) {
		const ratio = score > 1 ? score / 100 : score;
		if (ratio >= 0.999) return { label: '答对', tone: 'success' };
		if (ratio > 0) return { label: '部分正确', tone: 'warn' };
		return { label: '答错', tone: 'error' };
	}
	return { label: 'AI 判定', tone: 'neutral' };
}

/* Host 约定 score 为 0-100；兼容 0~1 的比例值，统一展示为「N 分」。 */
function pracAiGradeScoreText(grade) {
	const score = grade && grade.score;
	if (score === undefined || score === null || score === '') return '';
	const number = Number(score);
	if (!Number.isFinite(number)) return String(score);
	const percent = number > 0 && number < 1 && number !== Math.floor(number) ? Math.round(number * 100) : Math.round(number);
	return percent + ' 分';
}

function pracAiGradeList(value) {
	if (Array.isArray(value)) {
		return value
			.map(function (item) {
				return item === undefined || item === null ? '' : String(item).trim();
			})
			.filter(function (item) {
				return item !== '';
			});
	}
	if (typeof value === 'string' && value.trim() !== '') return [value.trim()];
	return [];
}

/* AI 判题文本字段归一：字符串 trim，数组按行合并。 */
function pracAiGradeText(value) {
	if (value === undefined || value === null) return '';
	if (Array.isArray(value)) {
		return value
			.map(function (item) {
				return item === undefined || item === null ? '' : String(item).trim();
			})
			.filter(function (item) {
				return item !== '';
			})
			.join('\n');
	}
	return String(value).trim();
}

/** 标准答案里的图片：答案文件/AI 答案解析出的答案图。 */
function PracticeAnswerFigures(props) {
	const figures = (props.figures || []).filter(function (figure) { return figure && figure.relPath; });
	if (figures.length === 0) return null;
	const courseId = props.courseId;
	return h(
		'div',
		{ className: 'dsp-answer-figures' },
		figures.map(function (figure, index) {
			return h('img', {
				key: String(figure.relPath) + '-' + index,
				className: 'dsp-answer-figure',
				src: DSP.assetUrl(courseId, figure.relPath),
				alt: figure.alt || ('答案图 ' + (index + 1)),
				loading: 'lazy'
			});
		})
	);
}

function PracticeAiGradeCard(props) {
	const grade = props.grade || {};
	const question = props.question || {};
	const verdict = pracAiGradeVerdictInfo(grade);
	const scoreText = pracAiGradeScoreText(grade);
	const suggestions = pracAiGradeList(grade.suggestions);
	const refs = pracAiGradeList(grade.refs);

	/* 新字段：standardAnswer / mistakeAnalysis / explanation（顺序固定：标准答案→我错在哪→答案解析）；
	 * 兼容旧字段 correctedAnswer / summary，且避免 summary 重复出现在多个区块。 */
	const rawStandard = pracAiGradeText(grade.standardAnswer) || pracAiGradeText(grade.correctedAnswer);
	const rawMistake = pracAiGradeText(grade.mistakeAnalysis);
	const rawExplanation = pracAiGradeText(grade.explanation);
	const rawSummary = pracAiGradeText(grade.summary);
	let standardAnswer = rawStandard;
	let mistakeAnalysis = rawMistake;
	let explanation = rawExplanation;
	if (!standardAnswer && rawSummary) standardAnswer = rawSummary;
	else if (!explanation && rawSummary) explanation = rawSummary;
	if (!mistakeAnalysis && rawSummary && rawSummary !== standardAnswer && rawSummary !== explanation) mistakeAnalysis = rawSummary;

	const section = function (key, icon, title, body, boxClassName) {
		if (!body) return null;
		return h(
			'div',
			{ key: key, className: 'dsp-ai-grade-block' },
			h('div', { className: 'dsp-ai-grade-block-title' }, h(DSP.Icon, { name: icon, size: 13 }), h('span', null, title)),
			h('div', { className: 'dsp-md dsp-md-preserve ' + boxClassName }, DSP.markdown(body))
		);
	};

	return h(
		'div',
		{ className: 'dsp-ai-grade' },
		/* 先给标准答案（图片紧随其后），再给判定与错因。 */
		section('standard', 'check', '标准答案', standardAnswer, 'dsp-ai-grade-corrected'),
		h(PracticeAnswerFigures, { figures: question.answerFigures, courseId: props.courseId }),
		h(
			'div',
			{ className: 'dsp-ai-grade-head' },
			h(DSP.Icon, { name: 'robot', size: 15 }),
			h('span', { className: 'dsp-ai-grade-title' }, 'AI 判题'),
			h(DSP.Tag, { tone: verdict.tone }, scoreText ? verdict.label + ' · ' + scoreText : verdict.label),
			grade.generatedAt ? h('span', { className: 'dsp-ai-grade-time dsp-small dsp-muted' }, DSP.fmtDate(grade.generatedAt)) : null
		),
		section('mistake', 'alert', '我错在哪', mistakeAnalysis, 'dsp-ai-grade-summary'),
		section('explanation', 'bulb', '答案解析', explanation, 'dsp-ai-grade-summary'),
		suggestions.length > 0
			? h(
					'div',
					{ key: 'suggestions', className: 'dsp-ai-grade-block' },
					h('div', { className: 'dsp-ai-grade-block-title' }, h(DSP.Icon, { name: 'sparkles', size: 13 }), h('span', null, '改进建议')),
					h(
						'ul',
						{ className: 'dsp-md dsp-md-preserve dsp-md-list dsp-ai-grade-list' },
						suggestions.map(function (text, index) {
							return h('li', { key: 'tip-' + index }, pracInlineMarkdown(text));
						})
					)
			  )
			: null,
		refs.length > 0
			? h(
					'div',
					{ className: 'dsp-reveal-refs dsp-ai-grade-refs' },
					h('span', { className: 'dsp-reveal-refs-label' }, '参考文档：'),
					refs.map(function (ref, index) {
						return h('span', { key: 'ai-ref-' + index, className: 'dsp-reveal-refs-item' }, ref);
					})
			  )
			: null
	);
}

function PracticeRevealPanel(props) {
	const question = props.question || {};
	const record = props.record || {};
	const pending = record.correct !== true && record.correct !== false;
	const source = pracRevealAnswerSource(question);
	const aiSource = source === 'ai-doc' || source === 'ai';
	const refs = aiSource ? pracRevealAnswerRefs(question) : [];
	const hasAnswerText = pracRevealHasAnswerText(question);
	const hasAnalysis = pracRevealHasAnalysis(question);
	const answerText = hasAnswerText ? pracFormatAnswer(question) : '暂无参考答案';
	const answerLabel = aiSource ? DSP.t('参考答案') : DSP.t('正确答案');
	const answerDetails = pracCorrectChoiceTexts(question);
	const isChoice = question.type === 'single' || question.type === 'multiple';
	const statusTone = pending ? 'warn' : record.correct ? 'success' : 'error';
	const statusText = pending ? '待自评' : record.correct ? DSP.t('正确') : DSP.t('错误');
	const gradeText = hasAnswerText ? '你的答案与参考答案不一致，请对照上方答案后自评：' : '本题暂无参考答案，请结合上方提示与课程文档判断你的答案是否正确：';
	const userAnswerText = pracFormatUserAnswer(question, record.answer);
	const sourceAnswerDisplay = question.sourceAnswerDisplay === undefined || question.sourceAnswerDisplay === null ? '' : String(question.sourceAnswerDisplay).trim();
	/* AI 判题结果：优先用 PracticeBody 传入的当前记录，其次兼容 record.aiGrade。 */
	const aiGrade = props.aiGrade || (record && record.aiGrade) || null;

	let sourceTag = null;
	if (source === 'ai-doc') {
		sourceTag = h(DSP.Tag, { tone: 'neutral', className: 'dsp-reveal-source dsp-reveal-source-ai-doc' }, 'AI 参考 · 依据课程文档');
	} else if (source === 'ai') {
		sourceTag = h(DSP.Tag, { tone: 'warn', className: 'dsp-reveal-source dsp-reveal-source-ai' }, 'AI 生成参考答案');
	}

	const refsLine =
		aiSource && refs.length > 0
			? h(
					'div',
					{ className: 'dsp-reveal-refs' },
					h('span', { className: 'dsp-reveal-refs-label' }, '参考文档：'),
					refs.map(function (ref, refIndex) {
						return h('span', { key: 'ref-' + refIndex, className: 'dsp-reveal-refs-item' }, ref);
					})
			  )
			: null;
	const noRefsNote =
		aiSource && refs.length === 0
			? h('div', { className: 'dsp-reveal-source-note dsp-small dsp-muted' }, '未在课程文档中找到直接依据，答案由 AI 生成，建议核对')
			: null;
	/* 「全部 AI 重新生成」模式下 Host 会把原卷答案存进 sourceAnswerDisplay，供核对 */
	const sourceAnswerLine =
		aiSource && sourceAnswerDisplay !== ''
			? h(
					'div',
					{ className: 'dsp-reveal-source-answer' },
					h('span', { className: 'dsp-reveal-source-answer-label' }, '原卷答案（供核对）：'),
					pracRichText(sourceAnswerDisplay, 'dsp-reveal-source-answer-text', 'dsp-reveal-source-answer-text-block')
			  )
			: null;

	return h(
		'div',
		{ className: 'dsp-reveal' },
		h(
			'div',
			{ className: 'dsp-reveal-head' },
			h(DSP.Tag, { tone: statusTone }, statusText),
			h(
				'div',
				{ className: 'dsp-reveal-answer-row' },
				sourceTag,
				h('span', { className: 'dsp-reveal-label' }, answerLabel),
				hasAnswerText
					? pracRichText(answerText, 'dsp-reveal-answer', 'dsp-reveal-answer-block', question.type === 'short' || question.type === 'other')
					: h('span', { className: 'dsp-reveal-answer dsp-reveal-answer-empty' }, '暂无参考答案'),
				h(PracticeAnswerFigures, { figures: question.answerFigures, courseId: props.courseId })
			),
			h(
				'div',
				{ className: 'dsp-reveal-user dsp-small dsp-muted' },
				h('span', { className: 'dsp-reveal-user-label' }, '你的答案：'),
				pracRichText(userAnswerText, 'dsp-reveal-user-text', 'dsp-reveal-user-text-block')
			)
		),
		sourceAnswerLine,
		refsLine,
		noRefsNote,
		isChoice && answerDetails.length > 0
			? h(
					'div',
					{ className: 'dsp-reveal-options' },
					answerDetails.map(function (line, lineIndex) {
						return h(
							'div',
							{ key: 'correct-' + lineIndex, className: 'dsp-reveal-option-line' },
							pracRichText(line, 'dsp-reveal-option-line-text', 'dsp-reveal-option-line-text-block')
						);
					})
			  )
			: null,
		h(
			'div',
			{ className: 'dsp-reveal-analysis' },
			h('div', { className: 'dsp-reveal-analysis-title' }, h(DSP.Icon, { name: 'bulb', size: 14 }), h('span', null, DSP.t('解析'))),
			hasAnalysis
				? h('div', { className: 'dsp-md dsp-md-preserve dsp-reveal-analysis-body' }, DSP.markdown(question.analysis))
				: !hasAnswerText
				? h('div', { className: 'dsp-reveal-empty-hint dsp-small' }, '本题原卷未提供答案，可点「一键提问」让 AI 结合课程文档解答。')
				: h('div', { className: 'dsp-small dsp-muted' }, DSP.t('暂无解析'))
		),
		pending
			? h(
					'div',
					{ className: 'dsp-reveal-grade' },
					h('div', { className: 'dsp-reveal-grade-text' }, gradeText),
					h(
						'div',
						{ className: 'dsp-row dsp-gap-8 dsp-reveal-grade-actions' },
						h(
							DSP.Btn,
							{
								variant: 'secondary',
								icon: 'check',
								className: 'dsp-grade-btn dsp-grade-btn-correct',
								onClick: function () {
									props.onSelfGrade(true);
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
									props.onSelfGrade(false);
								}
							},
							'我答错了'
						)
					)
			  )
			: null,
		aiGrade ? h(PracticeAiGradeCard, { grade: aiGrade, question: question, courseId: props.courseId }) : null,
		h(
			'div',
			{ className: 'dsp-reveal-actions' },
			h(DSP.Btn, { variant: 'secondary', icon: 'sparkles', onClick: props.onAsk }, DSP.t('一键提问')),
			props.isLast ? null : h(DSP.Btn, { variant: 'primary', icon: 'chevronRight', onClick: props.onNext }, DSP.t('下一题'))
		)
	);
}
