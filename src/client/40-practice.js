/* 刷题模式 Client — 刷题区（中间核心区），practice-ui-dev 维护。
 *
 * 组件结构（本文件）：
 *   PracticeArea            根组件。读取 DSP.useStore 的 ui / course / setCache / capabilities，
 *                           按优先级渲染：解析进度 → 加载/错误/空态 → 结果页 → 模式选择 → 练习主体。
 *                           负责按 setId 加载 set.json、把当前题号写回 store.ui.questionIndex、
 *                           根节点 onMouseUp 转交 DSP.handlePracticeSelection（支持框选提问）。
 *   PracticeParseCard       解析中 / 解析失败的进度卡（Spinner + 进度条 + 重试 / 返回课程）。
 *   PracticeModeSelect      未开始练习时的模式选择卡（答一题看一题 / 全部做完再看）。
 *   PracticeTopBar          练习顶部条：返回课程、套题标题、第 i/n 题、已答、正确率、模式徽标、用时。
 *   PracticeQuestionNav     题号导航条：正确=success、错误=error、当前=brand、待自评=warn、未答=neutral。
 *   PracticeBody            练习主体：题目卡（41 文件）+ 底部按钮 + 交卷确认。
 *   PracticeFooter          上一题 / 下一题 / 提交 / 交卷。
 *   PracticeCapabilityHint  capabilities.images=false 时的图片输入提示（只影响扫描件解析）。
 *
 * 相邻碎片：
 *   41-practice-question.js  题目卡、共用材料、题图与「重新绘制」、按题型作答控件、解析区。
 *   42-practice-result.js    交卷结果页：本套统计、各题型正确率、待自评列表、生成复习建议。
 *
 * 接口约定（详见 docs/CONTRACT.md 第 6.4 节，以 20-store.js 实际实现为准）：
 *   只读：DSP.useStore；写：DSP.store.actions.{loadSet, setMode, saveRecords, completeSet,
 *   startParse, redrawFigure, diagnose, askQuestion, openCourse, openPractice, openCourseDash,
 *   openGlobalDash, ui, toast}。
 *
 * 本地作答状态：模块级 __practiceLocal[setId] = {answers, revealed, records, recordIds,
 * startedAt, finished, mode, hydrated}。切题 / 切看板（组件卸载再挂载）后不丢；首次进入从
 * 课程 records 恢复（revealed 视为已看答案，correct=null 视为待自评）。本地变更后调用
 * React.useState 的 bump 强制刷新。
 */

var __practiceLocal = {};

var PRACTICE_MODE_IMMEDIATE = 'immediate';
var PRACTICE_MODE_END = 'end';
var PRACTICE_TYPE_LABELS = { single: '单选', multiple: '多选', judge: '判断', fill: '填空', short: '简答', other: '其他' };
var PRACTICE_DIFFICULTY_LABELS = { easy: '简单', medium: '中等', hard: '困难' };

/* ------------------------------------------------------------------ */
/* 基础小工具                                                          */
/* ------------------------------------------------------------------ */

function pracToArray(value) {
	if (value === undefined || value === null || value === '') return [];
	if (Array.isArray(value)) {
		return value.map(function (item) {
			return item === undefined || item === null ? '' : String(item);
		});
	}
	return [String(value)];
}

function pracClampIndex(value, total) {
	const number = Number(value);
	const safe = Number.isFinite(number) ? Math.floor(number) : 0;
	if (!total || total <= 0) return 0;
	return Math.min(total - 1, Math.max(0, safe));
}

function pracProgressFraction(progress) {
	const number = Number(progress);
	if (!Number.isFinite(number) || number <= 0) return 0;
	if (number <= 1) return number;
	return Math.min(1, number / 100);
}

function pracToastError(error) {
	const message = error && error.message ? error.message : String(error || '请求失败');
	DSP.store.actions.toast(message, 'error');
}

function pracModeLabel(mode) {
	return mode === PRACTICE_MODE_END ? DSP.t('全部做完再看') : DSP.t('答一题看一题');
}

function pracTypeLabel(type) {
	return DSP.t(PRACTICE_TYPE_LABELS[type] || PRACTICE_TYPE_LABELS.other);
}

function pracDifficultyLabel(difficulty) {
	return DSP.t(PRACTICE_DIFFICULTY_LABELS[difficulty] || PRACTICE_DIFFICULTY_LABELS.medium);
}

function pracDifficultyTone(difficulty) {
	if (difficulty === 'hard') return 'warn';
	if (difficulty === 'easy') return 'success';
	return 'neutral';
}

function pracQuestionNumber(question, index) {
	const number = question && question.number !== undefined && question.number !== null && String(question.number).trim() !== '' ? String(question.number) : String(index + 1);
	return number;
}

function pracFindGroup(setData, groupId) {
	if (!groupId) return null;
	const groups = (setData && setData.groups) || [];
	return (
		groups.find(function (group) {
			return group && group.id === groupId;
		}) || null
	);
}

function pracQuestionStemText(question) {
	const stem = question && question.stem ? String(question.stem) : '';
	return stem.replace(/\s+/g, ' ').trim();
}

/* ------------------------------------------------------------------ */
/* 本地作答状态（模块级，按 setId 隔离）                               */
/* ------------------------------------------------------------------ */

function pracLocal(setId) {
	const key = String(setId || '');
	if (!__practiceLocal[key]) {
		__practiceLocal[key] = {
			answers: {},
			revealed: {},
			records: {},
			recordIds: {},
			grades: {}, // questionId -> {status:'running'|'done'|'error'|'stale', promise?, record?}
			startedAt: null,
			finished: false,
			mode: null,
			hydrated: false
		};
	}
	return __practiceLocal[key];
}

function pracLatestRecords(records, setId) {
	const map = {};
	(records || []).forEach(function (record) {
		if (!record || !record.questionId) return;
		if (setId && record.setId && record.setId !== setId) return;
		const key = String(record.questionId);
		const previous = map[key];
		const at = Number(record.at) || 0;
		const previousAt = previous ? Number(previous.at) || 0 : -1;
		if (!previous || at >= previousAt) map[key] = record;
	});
	return map;
}

/* 首次进入某套题时从 bootstrap 的 course.records 恢复。已恢复过则不再覆盖本地进度。 */
function pracEnsureLocal(records, setId, setSummary) {
	const local = pracLocal(setId);
	if (local.hydrated) return local;
	local.hydrated = true;
	const latest = pracLatestRecords(records || [], setId);
	let earliest = 0;
	let latestMode = null;
	let latestModeAt = -1;
	Object.keys(latest).forEach(function (questionId) {
		const record = latest[questionId];
		if (!record) return;
		local.recordIds[questionId] = record.id || DSP.uid('r');
		local.records[questionId] = record;
		local.answers[questionId] = pracToArray(record.answer);
		local.revealed[questionId] = Boolean(record.revealed);
		if (record.aiGrade) local.grades[questionId] = { status: 'done', record: record };
		const at = Number(record.at) || 0;
		if (at > 0 && (earliest === 0 || at < earliest)) earliest = at;
		if ((record.mode === PRACTICE_MODE_END || record.mode === PRACTICE_MODE_IMMEDIATE) && at >= latestModeAt) {
			latestMode = record.mode;
			latestModeAt = at;
		}
	});
	if (setSummary) {
		if (setSummary.mode) local.mode = setSummary.mode === PRACTICE_MODE_END ? PRACTICE_MODE_END : PRACTICE_MODE_IMMEDIATE;
		if (setSummary.completedAt) local.finished = true;
		const startedAt = Number(setSummary.startedAt);
		if (Number.isFinite(startedAt) && startedAt > 0) local.startedAt = startedAt;
	}
	if (!local.mode && latestMode) local.mode = latestMode;
	if (!local.startedAt && earliest > 0) local.startedAt = earliest;
	return local;
}

/* 「再练一次」：保留 recordIds 以便同题重复提交时后端 upsert，而不是堆积新记录。 */
function pracRestartLocal(setId) {
	const local = pracLocal(setId);
	local.answers = {};
	local.revealed = {};
	local.records = {};
	local.grades = {};
	local.startedAt = null;
	local.finished = false;
	return local;
}

function pracEffectiveMode(local, ui, setSummary) {
	if (local && local.mode) return local.mode === PRACTICE_MODE_END ? PRACTICE_MODE_END : PRACTICE_MODE_IMMEDIATE;
	if (ui && ui.mode) return ui.mode === PRACTICE_MODE_END ? PRACTICE_MODE_END : PRACTICE_MODE_IMMEDIATE;
	if (setSummary && setSummary.mode) return setSummary.mode === PRACTICE_MODE_END ? PRACTICE_MODE_END : PRACTICE_MODE_IMMEDIATE;
	return PRACTICE_MODE_IMMEDIATE;
}

/* ------------------------------------------------------------------ */
/* 判分 / 答案格式化                                                    */
/* ------------------------------------------------------------------ */

function pracHasAnswer(question, value) {
	const type = (question && question.type) || 'other';
	const list = pracToArray(value);
	if (list.length === 0) return false;
	if (type === 'multiple' || type === 'fill') {
		return list.some(function (item) {
			return String(item).trim() !== '';
		});
	}
	return String(list[0] || '').trim() !== '';
}

/* 提交给后端的规范化答案：选择题按选项顺序排序，其他保留数组。 */
function pracNormalizeWrite(question, value) {
	const type = (question && question.type) || 'other';
	const list = pracToArray(value).map(function (item) {
		return String(item).trim();
	});
	if (type === 'multiple') {
		const order = ((question && question.options) || []).map(function (option) {
			return String(option && option.key !== undefined ? option.key : '');
		});
		return list
			.slice()
			.sort(function (left, right) {
				const leftIndex = order.indexOf(left);
				const rightIndex = order.indexOf(right);
				return (leftIndex < 0 ? 999 : leftIndex) - (rightIndex < 0 ? 999 : rightIndex);
			});
	}
	return list;
}

function pracJudgeBool(text) {
	const value = String(text === undefined || text === null ? '' : text)
		.trim()
		.toLowerCase();
	if (value === '') return null;
	if (['正确', '对', '是', 'true', 't', 'a', '√', '✓', 'yes', 'y'].indexOf(value) >= 0) return true;
	if (['错误', '错', '否', 'false', 'f', 'b', '×', '✗', 'no', 'n'].indexOf(value) >= 0) return false;
	return null;
}

function pracJudgeCorrectKeys(question) {
	const first = pracToArray(question && question.answer)[0];
	const boolValue = pracJudgeBool(first);
	if (boolValue === true) return ['正确'];
	if (boolValue === false) return ['错误'];
	return pracToArray(question && question.answer).map(String);
}

/* 去空白、去常见中英文标点、全角转半角后比较，允许「1,000」与「1000」这类差异。 */
function pracNormalizeFill(text) {
	let value = String(text === undefined || text === null ? '' : text);
	value = value.replace(/[\uFF01-\uFF5E]/g, function (character) {
		return String.fromCharCode(character.charCodeAt(0) - 0xfee0);
	});
	value = value.replace(/\u3000/g, ' ');
	value = value.replace(/\s+/g, '');
	value = value.replace(/[。．.，,、；;：:！!？?（）()【】\[\]{}「」『』“”"'‘’《》〈〉<>…—\-_/\\|~`·*^#@$%&+=]/g, '');
	value = value.replace(/[０-９]/g, function (character) {
		return String.fromCharCode(character.charCodeAt(0) - 0xfee0);
	});
	return value.toLowerCase();
}

function pracEvaluate(question, value) {
	const type = (question && question.type) || 'other';
	const expected = pracToArray(question && question.answer);
	const user = pracNormalizeWrite(question, value);
	if (expected.length === 0) return { correct: null, selfGrade: true };
	if (type === 'single' || type === 'multiple') {
		const expectedKeys = expected.map(String).sort();
		const userKeys = user.map(String).sort();
		const same = expectedKeys.length === userKeys.length && expectedKeys.every(function (key, index) { return key === userKeys[index]; });
		return { correct: same, selfGrade: false };
	}
	if (type === 'judge') {
		const expectedBool = pracJudgeBool(expected[0]);
		const userBool = pracJudgeBool(user[0]);
		if (expectedBool === null || userBool === null) {
			return { correct: String(expected[0] || '') === String(user[0] || ''), selfGrade: false };
		}
		return { correct: expectedBool === userBool, selfGrade: false };
	}
	if (type === 'fill') {
		const expectedNorm = expected.map(pracNormalizeFill);
		const userNorm = user.map(pracNormalizeFill);
		const filled = userNorm.filter(function (item) { return item !== ''; });
		if (filled.length === 0) return { correct: null, selfGrade: true };
		const same = expectedNorm.length === userNorm.length && expectedNorm.every(function (item, index) { return item === userNorm[index]; });
		if (same) return { correct: true, selfGrade: false };
		/* 规范化后仍不一致（表述差异），revel 后交给用户自评。 */
		return { correct: null, selfGrade: true };
	}
	return { correct: null, selfGrade: true };
}

/* AI 判题 verdict → record.correct：correct/答对 → true，partial/incorrect/答错 → false。
 * verdict 缺失/无法识别时返回 null，调用方回退本地对比判分（不凭 score 猜测中间值）。 */
function pracAiGradeCorrect(aiGrade) {
	const raw = aiGrade && aiGrade.verdict !== undefined && aiGrade.verdict !== null ? String(aiGrade.verdict).trim().toLowerCase() : '';
	if (raw === 'correct' || raw === '答对' || raw === '正确') return true;
	if (raw === 'partial' || raw === '部分正确' || raw === '部分对' || raw === 'incorrect' || raw === 'wrong' || raw === '答错' || raw === '错误') return false;
	const score = Number(aiGrade && aiGrade.score);
	if (Number.isFinite(score)) {
		if (score >= 99.5) return true;
		if (score <= 0) return false;
	}
	return null;
}

function pracFormatAnswer(question) {
	if (!question) return '—';
	if (question.answerDisplay !== undefined && question.answerDisplay !== null && String(question.answerDisplay).trim() !== '') return String(question.answerDisplay);
	const type = question.type || 'other';
	const answer = pracToArray(question.answer).filter(function (item) { return String(item).trim() !== ''; });
	if (answer.length === 0) return '—';
	if (type === 'judge') {
		const boolValue = pracJudgeBool(answer[0]);
		if (boolValue === true) return '正确';
		if (boolValue === false) return '错误';
	}
	if (type === 'fill') return answer.join('；');
	if (type === 'short' || type === 'other') return answer.join('\n');
	return answer.join('、');
}

function pracFormatUserAnswer(question, answer) {
	const list = pracToArray(answer).filter(function (item) { return String(item).trim() !== ''; });
	if (list.length === 0) return DSP.t('未作答');
	if ((question && (question.type === 'short' || question.type === 'other')) || (question && question.type === 'fill')) return list.join('；');
	return list.join('、');
}

function pracCorrectChoiceTexts(question) {
	const options = (question && question.options) || [];
	const keys = question && question.type === 'judge' ? pracJudgeCorrectKeys(question) : pracToArray(question && question.answer).map(String);
	return keys
		.map(function (key) {
			const option = options.find(function (item) {
				return item && String(item.key) === key;
			});
			if (!option) return null;
			return String(option.key) + '. ' + String(option.text === undefined || option.text === null ? '' : option.text);
		})
		.filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* 统计                                                                */
/* ------------------------------------------------------------------ */

function pracSetStats(questions, local) {
	const source = questions || [];
	const byType = {};
	const byTypeOrder = [];
	let answered = 0;
	let judged = 0;
	let correct = 0;
	source.forEach(function (question) {
		const type = (question && question.type) || 'other';
		if (!byType[type]) {
			byType[type] = { type: type, total: 0, answered: 0, judged: 0, correct: 0 };
			byTypeOrder.push(type);
		}
		const bucket = byType[type];
		bucket.total += 1;
		const record = question ? (local.records || {})[question.id] : null;
		if (!record) return;
		bucket.answered += 1;
		answered += 1;
		if (record.correct === true || record.correct === false) {
			bucket.judged += 1;
			judged += 1;
			if (record.correct === true) {
				bucket.correct += 1;
				correct += 1;
			}
		}
	});
	return {
		total: source.length,
		answered: answered,
		judged: judged,
		correct: correct,
		accuracy: judged > 0 ? correct / judged : null,
		byType: byTypeOrder.map(function (type) { return byType[type]; })
	};
}

function pracTotalDuration(questions, local) {
	let total = 0;
	(questions || []).forEach(function (question) {
		const record = question ? (local.records || {})[question.id] : null;
		const duration = record ? Number(record.durationMs) : 0;
		if (Number.isFinite(duration) && duration > 0) total += duration;
	});
	return total;
}

function pracQuestionNavState(question, local, currentIndex, index) {
	if (index === currentIndex) return 'current';
	const record = question ? (local.records || {})[question.id] : null;
	if (!record) return pracHasAnswer(question, (local.answers || {})[question.id]) ? 'answered' : 'empty';
	if (!record.revealed) return 'answered';
	if (record.correct === true) return 'correct';
	if (record.correct === false) return 'wrong';
	return 'pending';
}

/* ------------------------------------------------------------------ */
/* 每秒刷新一次，用于顶部用时显示                                       */
/* ------------------------------------------------------------------ */

function pracUseTick(active) {
	const state = React.useState(0);
	const bump = state[1];
	React.useEffect(
		function () {
			if (!active) return undefined;
			const timer = window.setInterval(function () {
				bump(function (value) {
					return value + 1;
				});
			}, 1000);
			return function () {
				window.clearInterval(timer);
			};
		},
		[active]
	);
	return state[0];
}

/* ------------------------------------------------------------------ */
/* 左侧固定图片面板：占比持久化 / 缩放范围                              */
/* ------------------------------------------------------------------ */

var PRACTICE_IMAGE_PANE_DEFAULT = 0.32;
var PRACTICE_IMAGE_PANE_MIN = 0.18;
var PRACTICE_IMAGE_PANE_MAX = 0.6;
var PRACTICE_IMAGE_PANE_STORAGE_KEY = 'practice-mode.imagePaneRatio';

function pracClampPaneRatio(value) {
	const number = Number(value);
	if (!Number.isFinite(number)) return PRACTICE_IMAGE_PANE_DEFAULT;
	return Math.min(PRACTICE_IMAGE_PANE_MAX, Math.max(PRACTICE_IMAGE_PANE_MIN, number));
}

function pracLoadPaneRatio() {
	try {
		const raw = window.localStorage.getItem(PRACTICE_IMAGE_PANE_STORAGE_KEY);
		if (raw === null || raw === '') return PRACTICE_IMAGE_PANE_DEFAULT;
		return pracClampPaneRatio(parseFloat(raw));
	} catch (error) {
		return PRACTICE_IMAGE_PANE_DEFAULT;
	}
}

function pracSavePaneRatio(value) {
	try {
		window.localStorage.setItem(PRACTICE_IMAGE_PANE_STORAGE_KEY, String(pracClampPaneRatio(value)));
	} catch (error) {
		/* localStorage 不可用时忽略，仅本次会话生效 */
	}
}

/* 图片固定键：courseId + relPath，同一张图只能固定一次。 */
function pracFigurePinKey(courseId, relPath) {
	return String(courseId || '') + '|' + String(relPath || '');
}

/* ------------------------------------------------------------------ */
/* 题目字号缩放：80%~150%，持久化到 localStorage                        */
/* ------------------------------------------------------------------ */

var PRACTICE_FONT_SCALE_DEFAULT = 1;
var PRACTICE_FONT_SCALE_MIN = 0.8;
var PRACTICE_FONT_SCALE_MAX = 1.5;
var PRACTICE_FONT_SCALE_STEP = 0.1;
var PRACTICE_FONT_SCALE_STORAGE_KEY = 'practice-mode.questionFontScale';

function pracClampFontScale(value) {
	const number = Number(value);
	if (!Number.isFinite(number)) return PRACTICE_FONT_SCALE_DEFAULT;
	const clamped = Math.min(PRACTICE_FONT_SCALE_MAX, Math.max(PRACTICE_FONT_SCALE_MIN, number));
	return Math.round(clamped * 100) / 100;
}

function pracLoadFontScale() {
	try {
		const raw = window.localStorage.getItem(PRACTICE_FONT_SCALE_STORAGE_KEY);
		if (raw === null || raw === '') return PRACTICE_FONT_SCALE_DEFAULT;
		return pracClampFontScale(parseFloat(raw));
	} catch (error) {
		return PRACTICE_FONT_SCALE_DEFAULT;
	}
}

function pracSaveFontScale(value) {
	try {
		window.localStorage.setItem(PRACTICE_FONT_SCALE_STORAGE_KEY, String(pracClampFontScale(value)));
	} catch (error) {
		/* localStorage 不可用时忽略，仅本次会话生效 */
	}
}

/* 左侧固定图片面板：标题 + 关闭、缩放控件（− / 百分比 / + / 重置）、可滚动画布。
 * 图片使用「基准宽度 × zoom」的显式像素宽高（按 naturalWidth/naturalHeight 保持比例），
 * 这样放大后画布高度/宽度都会真实增长，滚动容器横纵两个方向都能滚动。 */
function PracticeImagePane(props) {
	const figure = props.figure || {};
	const figureKey = figure.key || '';
	const zoomState = React.useState(1);
	const zoom = zoomState[0];
	const setZoom = zoomState[1];
	const failedState = React.useState(false);
	const failed = failedState[0];
	const setFailed = failedState[1];
	const baseWidthState = React.useState(0);
	const baseWidth = baseWidthState[0];
	const setBaseWidth = baseWidthState[1];
	const naturalState = React.useState(null);
	const natural = naturalState[0];
	const setNatural = naturalState[1];
	const scrollRef = React.useRef(null);

	React.useEffect(
		function () {
			setZoom(1);
			setFailed(false);
			setNatural(null);
		},
		[figureKey]
	);

	/* 基准宽度 = 滚动容器可视宽度 - 画布左右 padding(10*2)。 */
	function measureBaseWidth() {
		const element = scrollRef.current;
		const width = element && element.clientWidth ? element.clientWidth : 0;
		if (width > 0) setBaseWidth(Math.max(80, width - 20));
	}

	/* 分隔条拖动（widthPct 变化）/窗口变化时重新测量基准宽度。 */
	React.useEffect(
		function () {
			measureBaseWidth();
		},
		[figureKey, props.widthPct]
	);

	React.useEffect(
		function () {
			measureBaseWidth();
			let observer = null;
			const target = scrollRef.current;
			if (target && typeof window.ResizeObserver === 'function') {
				try {
					observer = new window.ResizeObserver(function () {
						measureBaseWidth();
					});
					observer.observe(target);
				} catch (error) {
					observer = null;
				}
			}
			window.addEventListener('resize', measureBaseWidth);
			return function () {
				window.removeEventListener('resize', measureBaseWidth);
				if (observer) {
					try {
						observer.disconnect();
					} catch (error) {
						/* ResizeObserver 清理失败不影响功能 */
					}
				}
			};
		},
		[figureKey]
	);

	const src = figure.relPath ? DSP.assetUrl(figure.courseId, figure.relPath) : '';
	const alt = figure.alt || DSP.t('图片');
	const percent = Math.round(zoom * 100);
	const naturalWidth = natural && natural.width > 0 ? natural.width : 0;
	const naturalHeight = natural && natural.height > 0 ? natural.height : 0;
	const aspect = naturalWidth > 0 && naturalHeight > 0 ? naturalHeight / naturalWidth : 0.72;
	const imageWidth = baseWidth > 0 ? Math.max(1, Math.round(baseWidth * zoom)) : 0;
	const imageHeight = imageWidth > 0 ? Math.max(1, Math.round(imageWidth * aspect)) : 0;
	const imageStyle = imageWidth > 0 ? { width: imageWidth + 'px', height: imageHeight + 'px' } : { width: '100%', height: 'auto' };

	function changeZoom(delta) {
		setZoom(function (value) {
			return Math.min(4, Math.max(0.25, Math.round((value + delta) * 100) / 100));
		});
	}

	return h(
		'aside',
		{ className: 'dsp-practice-image-pane', style: { flexBasis: Math.max(0, Number(props.widthPct) || 32) + '%' }, 'aria-label': '固定图片' },
		h(
			'div',
			{ className: 'dsp-practice-image-pane-head' },
			h('span', { className: 'dsp-practice-image-pane-title dsp-truncate', title: alt }, alt),
			h(DSP.IconBtn, { icon: 'x', label: DSP.t('关闭'), title: '取消固定图片', onClick: props.onClose })
		),
		h(
			'div',
			{ className: 'dsp-practice-image-pane-zoom' },
			h(DSP.Btn, { variant: 'ghost', icon: 'minus', title: '缩小', disabled: zoom <= 0.25, onClick: function () { changeZoom(-0.25); } }),
			h('span', { className: 'dsp-practice-image-pane-percent' }, percent + '%'),
			h(DSP.Btn, { variant: 'ghost', icon: 'plus', title: '放大', disabled: zoom >= 4, onClick: function () { changeZoom(0.25); } }),
			h(
				DSP.Btn,
				{
					variant: 'ghost',
					className: 'dsp-practice-image-pane-reset',
					title: '重置缩放',
					disabled: zoom === 1,
					onClick: function () {
						setZoom(1);
					}
				},
				'重置'
			)
		),
		h(
			'div',
			{ className: 'dsp-practice-image-pane-scroll', ref: scrollRef },
			src && !failed
				? h(
						'div',
						{ className: 'dsp-practice-image-pane-canvas' },
						h('img', {
							className: 'dsp-practice-image-pane-img',
							src: src,
							alt: alt,
							style: imageStyle,
							onLoad: function (event) {
								const element = event && event.target;
								if (element && element.naturalWidth > 0 && element.naturalHeight > 0) {
									setNatural({ width: element.naturalWidth, height: element.naturalHeight });
								}
							},
							onError: function () {
								setFailed(true);
							}
						})
				  )
				: h(
						'div',
						{ className: 'dsp-practice-image-pane-empty' },
						h(DSP.Icon, { name: 'image', size: 22 }),
						h('span', null, failed ? '图片加载失败' : '暂无图片')
				  )
		)
	);
}

/* ------------------------------------------------------------------ */
/* PracticeArea：刷题区根组件                                           */
/* ------------------------------------------------------------------ */

function PracticeArea() {
	const selection = DSP.useStore(function (value) {
		const uiValue = value.ui || {};
		const courseValue =
			(value.data.courses || []).find(function (course) {
				return course.id === uiValue.courseId;
			}) || null;
		const cacheValue = uiValue.setId ? (value.setCache || {})[uiValue.setId] || null : null;
		return { ui: uiValue, course: courseValue, cache: cacheValue, capabilities: value.data.capabilities || null };
	});

	const ui = selection.ui;
	const course = selection.course;
	const cache = selection.cache;
	const capabilities = selection.capabilities || {};
	const courseId = ui.courseId || null;
	const setId = ui.setId || null;
	const parse = ui.parse || null;
	const svgJob = ui.svgJob || null;
	const setSummary =
		course && setId
			? (course.sets || []).find(function (item) {
					return item.id === setId;
			  }) || null
			: null;

	/* 本地刷新器：本地作答状态不是 React state，改完手动 bump。 */
	const bumpState = React.useState(0);
	const bumpLocal = bumpState[1];
	const refresh = React.useCallback(function () {
		bumpLocal(function (value) {
			return value + 1;
		});
	}, []);

	/* 左侧固定图片面板：同一时间固定一张，占比存 localStorage。 */
	const pinState = React.useState(null);
	const pinnedFigure = pinState[0];
	const setPinnedFigure = pinState[1];
	const ratioState = React.useState(pracLoadPaneRatio);
	const paneRatio = ratioState[0];
	const setPaneRatio = ratioState[1];
	const paneRatioRef = React.useRef(paneRatio);
	paneRatioRef.current = paneRatio;
	const splitRef = React.useRef(null);

	/* 题目字号缩放（顶部条 A− / 百分比 / A+ / 重置），持久化到 localStorage。 */
	const fontScaleState = React.useState(pracLoadFontScale);
	const fontScale = fontScaleState[0];
	const setFontScaleState = fontScaleState[1];

	function changeFontScale(next) {
		const value = pracClampFontScale(next);
		setFontScaleState(value);
		pracSaveFontScale(value);
	}

	React.useEffect(
		function () {
			setPinnedFigure(null);
		},
		[courseId, setId]
	);

	/* 结果页在 completeSet invalidateSet 之后仍需要题目数据，这里保留一份快照。 */
	const snapshotRef = React.useRef(null);
	const cachedSet = cache && cache.data ? cache.data : null;
	if (cachedSet) snapshotRef.current = { id: setId, data: cachedSet };
	const snapshot = snapshotRef.current;
	const setData = cachedSet || (snapshot && snapshot.id === setId ? snapshot.data : null);

	/* 挂载 / setId 变化时加载 set.json；缓存被失效（例如重绘、交卷）后自动补加载。 */
	React.useEffect(
		function () {
			if (courseId && setId) {
				DSP.store.actions.loadSet(courseId, setId).catch(function () {});
			}
		},
		[courseId, setId]
	);
	const needsLoad = Boolean(courseId && setId && (!cache || (!cache.loading && !cache.data && !cache.error)));
	React.useEffect(
		function () {
			if (needsLoad && courseId && setId) {
				DSP.store.actions.loadSet(courseId, setId).catch(function () {});
			}
		},
		[needsLoad, courseId, setId]
	);

	function handleMouseUp(event) {
		if (typeof DSP.handlePracticeSelection !== 'function') return;
		try {
			DSP.handlePracticeSelection(event);
		} catch (error) {
			/* 框选提问异常不应中断练习 */
		}
	}

	function goToCourse() {
		if (courseId) DSP.store.actions.openCourse(courseId);
		else DSP.store.actions.openGlobalDash();
	}

	function restartPractice() {
		pracRestartLocal(setId);
		DSP.store.actions.ui({ questionIndex: 0 });
		refresh();
	}

	function retryParse() {
		if (!courseId || !setId) return;
		DSP.store.actions.startParse(courseId, setId).catch(pracToastError);
	}

	/* 点击题图/材料图：未固定 → 固定到左侧；点同一张 → 取消固定。 */
	function handleTogglePinFigure(figure) {
		if (!figure || !figure.relPath) return;
		const key = pracFigurePinKey(figure.courseId || courseId, figure.relPath);
		setPinnedFigure(function (previous) {
			if (previous && previous.key === key) return null;
			return {
				key: key,
				courseId: figure.courseId || courseId,
				relPath: String(figure.relPath),
				alt: figure.alt ? String(figure.alt) : ''
			};
		});
	}

	function closePinnedFigure() {
		setPinnedFigure(null);
	}

	/* 拖动分隔条调整左侧图片区占比（18%~60%），松手后写入 localStorage。 */
	function handleSplitterMouseDown(event) {
		if (!splitRef.current) return;
		event.preventDefault();
		const rect = splitRef.current.getBoundingClientRect();
		if (!rect || rect.width <= 0) return;
		let latest = paneRatioRef.current;
		function onMove(moveEvent) {
			latest = pracClampPaneRatio((moveEvent.clientX - rect.left) / rect.width);
			paneRatioRef.current = latest;
			setPaneRatio(latest);
		}
		function onUp() {
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
			pracSavePaneRatio(latest);
		}
		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
	}

	let content = null;
	let practiceBodyVisible = false;

	if (!courseId || !setId) {
		content = h(
			'div',
			{ className: 'dsp-practice-scroll' },
			h(
				'div',
				{ className: 'dsp-practice-inner' },
				h(
					DSP.Empty,
					{
						icon: 'list',
						title: DSP.t('无题目'),
						action: h(DSP.Btn, { variant: 'primary', icon: 'arrowLeft', onClick: goToCourse }, DSP.t('返回课程'))
					},
					'请先从课程主页选择一套题开始练习。'
				)
			)
		);
	} else if (parse && parse.setId === setId) {
		content = h(PracticeParseCard, {
			parse: parse,
			capabilities: capabilities,
			onBack: goToCourse,
			onRetry: retryParse
		});
	} else if (!course) {
		content = h(
			'div',
			{ className: 'dsp-practice-scroll' },
			h(
				'div',
				{ className: 'dsp-practice-inner' },
				h('div', { className: 'dsp-practice-center' },
					h('div', { className: 'dsp-row dsp-gap-8 dsp-muted' }, h(DSP.Spinner, { size: 18 }), h('span', null, DSP.t('正在加载')))
				)
			)
		);
	} else if (!setData) {
		if (cache && cache.error) {
			content = h(PracticeSetError, {
				error: cache.error,
				capabilities: capabilities,
				onBack: goToCourse,
				onRetry: function () {
					DSP.store.actions.invalidateSet(setId);
					DSP.store.actions.loadSet(courseId, setId).catch(pracToastError);
				},
				onParse: retryParse
			});
		} else {
			content = h(
				'div',
				{ className: 'dsp-practice-scroll' },
				h(
					'div',
					{ className: 'dsp-practice-inner' },
					h(
						'div',
						{ className: 'dsp-practice-center' },
						h('div', { className: 'dsp-row dsp-gap-8 dsp-muted' },
							h(DSP.Spinner, { size: 18 }),
							h('span', null, DSP.t('正在加载') + ' ' + DSP.t('题目') + '…')
						)
					)
				)
			);
		}
	} else if (!Array.isArray(setData.questions) || setData.questions.length === 0) {
		/* 解析完成但没有题目：提示重新解析 / 返回课程。 */
		content = h(PracticeSetEmpty, {
			setData: setData,
			setSummary: setSummary,
			capabilities: capabilities,
			onBack: goToCourse,
			onParse: retryParse
		});
	} else {
		const questions = setData.questions;
		const local = pracEnsureLocal(course.records || [], setId, setSummary);
		const mode = pracEffectiveMode(local, ui, setSummary);
		const completed = Boolean(local.finished);
		const started = !completed && (Object.keys(local.records || {}).length > 0 || local.startedAt !== null);
		if (completed) {
			content = h(PracticeResultPage, {
				courseId: courseId,
				setId: setId,
				course: course,
				setSummary: setSummary,
				setData: setData,
				local: local,
				mode: mode,
				refresh: refresh,
				onRestart: restartPractice,
				onBack: goToCourse
			});
		} else if (!started) {
			content = h(PracticeModeSelect, {
				courseId: courseId,
				setId: setId,
				course: course,
				setSummary: setSummary,
				setData: setData,
				local: local,
				capabilities: capabilities,
				refresh: refresh,
				onBack: goToCourse
			});
		} else {
			practiceBodyVisible = true;
			content = h(PracticeBody, {
				courseId: courseId,
				setId: setId,
				course: course,
				setSummary: setSummary,
				setData: setData,
				local: local,
				mode: mode,
				capabilities: capabilities,
				svgJob: svgJob,
				initialIndex: ui.questionIndex,
				refresh: refresh,
				onBack: goToCourse,
				pinnedFigureKey: pinnedFigure ? pinnedFigure.key : null,
				onPinFigure: handleTogglePinFigure,
				fontScale: fontScale,
				onFontScaleChange: changeFontScale
			});
		}
	}

	const showImagePane = Boolean(pinnedFigure && practiceBodyVisible && pinnedFigure.courseId === courseId);
	/* 布局树保持稳定：无论是否固定图片，内容都渲染在 .dsp-practice-split-main 中，
	 * 避免固定/取消时 PracticeBody 重新挂载导致题目内原图闪烁或缺失。 */
	const rendered = h(
		'div',
		{ className: 'dsp-practice-split', ref: splitRef },
		showImagePane
			? h(PracticeImagePane, {
					key: 'image-pane',
					figure: pinnedFigure,
					widthPct: paneRatio * 100,
					onClose: closePinnedFigure
			  })
			: null,
		showImagePane
			? h('div', {
					key: 'image-splitter',
					className: 'dsp-practice-splitter',
					role: 'separator',
					'aria-orientation': 'vertical',
					'aria-label': '调整图片区域宽度',
					'aria-valuemin': 18,
					'aria-valuemax': 60,
					'aria-valuenow': Math.round(paneRatio * 100),
					tabIndex: 0,
					title: '拖动调整图片区域宽度（←/→ 微调）',
					onMouseDown: handleSplitterMouseDown,
					onKeyDown: function (event) {
						if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
						event.preventDefault();
						const next = pracClampPaneRatio(paneRatioRef.current + (event.key === 'ArrowLeft' ? -0.02 : 0.02));
						paneRatioRef.current = next;
						setPaneRatio(next);
						pracSavePaneRatio(next);
					}
			  })
			: null,
		h('div', { key: 'practice-main', className: 'dsp-practice-split-main' }, content)
	);

	return h(
		'div',
		{
			className: 'dsp-practice',
			onMouseUp: handleMouseUp,
			style: { '--dsp-question-font-scale': String(fontScale) }
		},
		rendered
	);
}

/* ------------------------------------------------------------------ */
/* 能力提示 / 解析进度卡 / 加载错误 / 空态                             */
/* ------------------------------------------------------------------ */

function PracticeCapabilityHint(props) {
	const state = React.useState(false);
	const dismissed = state[0];
	const setDismissed = state[1];
	const capabilities = props.capabilities || {};
	if (dismissed || capabilities.images !== false) return null;
	return h(
		'div',
		{ className: 'dsp-practice-banner' },
		h(DSP.Icon, { name: 'alert', size: 14 }),
		h(
			'span',
			{ className: 'dsp-practice-banner-text' },
			'当前模型不支持图片输入，扫描件/图片型题目可能无法解析；文本层完整的 PDF / Office / 文本题目不受影响。'
		),
		h(DSP.IconBtn, { icon: 'x', size: 13, label: DSP.t('关闭'), onClick: function () { setDismissed(true); } })
	);
}

function PracticeWarnings(props) {
	const warnings = (props.warnings || []).filter(function (warning) { return Boolean(warning); });
	const key = warnings.join('|');
	const hiddenState = React.useState(false);
	const hidden = hiddenState[0];
	const setHidden = hiddenState[1];
	React.useEffect(function () {
		if (warnings.length === 0) return undefined;
		setHidden(false);
		/* 解析提示只显示几秒，不长期占住顶部。 */
		const timer = window.setTimeout(function () { setHidden(true); }, 5000);
		return function () { window.clearTimeout(timer); };
	}, [key]);
	if (warnings.length === 0 || hidden) return null;
	return h(
		'div',
		{ className: 'dsp-practice-banner dsp-practice-banner-info' },
		h(DSP.Icon, { name: 'bulb', size: 14 }),
		h('span', { className: 'dsp-practice-banner-text' }, '解析提示：' + warnings.slice(0, 3).join('；'))
	);
}

function PracticeParseCard(props) {
	const parse = props.parse || {};
	const failed = parse.status === 'error';
	const running = !failed;
	const fraction = pracProgressFraction(parse.progress);
	const message = parse.message || (running ? DSP.t('正在解析') : DSP.t('解析失败'));
	return h(
		'div',
		{ className: 'dsp-practice-scroll' },
		h(
			'div',
			{ className: 'dsp-practice-inner' },
			h(
				'div',
				{ className: 'dsp-practice-center' },
				h(
					'div',
					{ className: 'dsp-card dsp-parse-card' },
					h(
						'div',
						{ className: 'dsp-parse-icon' + (failed ? ' dsp-parse-icon-error' : '') },
						failed ? h(DSP.Icon, { name: 'alert', size: 26 }) : h(DSP.Spinner, { size: 26 })
					),
					h('div', { className: 'dsp-parse-title' }, failed ? DSP.t('解析失败') : DSP.t('正在解析')),
					h('div', { className: 'dsp-parse-message dsp-muted' }, message),
					running
						? h(
								'div',
								{ className: 'dsp-parse-progress' },
								h(DSP.ProgressBar, { value: fraction }),
								h('div', { className: 'dsp-parse-progress-meta dsp-small dsp-muted' }, Math.round(fraction * 100) + '%')
						  )
						: null,
					failed && parse.error ? h('div', { className: 'dsp-parse-error dsp-small' }, String(parse.error)) : null,
					h(PracticeCapabilityHint, { capabilities: props.capabilities }),
					h(
						'div',
						{ className: 'dsp-parse-actions' },
						failed ? h(DSP.Btn, { variant: 'primary', icon: 'refresh', onClick: props.onRetry }, DSP.t('重试')) : null,
						h(DSP.Btn, { variant: 'secondary', icon: 'arrowLeft', onClick: props.onBack }, DSP.t('返回课程'))
					)
				)
			)
		)
	);
}

function PracticeSetError(props) {
	return h(
		'div',
		{ className: 'dsp-practice-scroll' },
		h(
			'div',
			{ className: 'dsp-practice-inner' },
			h(
				'div',
				{ className: 'dsp-practice-center' },
				h(
					'div',
					{ className: 'dsp-card dsp-practice-notice' },
					h('div', { className: 'dsp-practice-notice-icon dsp-practice-notice-icon-error' }, h(DSP.Icon, { name: 'alert', size: 24 })),
					h('div', { className: 'dsp-practice-notice-title' }, '题目加载失败'),
					h('div', { className: 'dsp-practice-notice-text dsp-muted' }, String(props.error || '') || '未知错误'),
					h(PracticeCapabilityHint, { capabilities: props.capabilities }),
					h(
						'div',
						{ className: 'dsp-row dsp-gap-8 dsp-practice-notice-actions' },
						h(DSP.Btn, { variant: 'primary', icon: 'refresh', onClick: props.onRetry }, DSP.t('重试')),
						h(DSP.Btn, { variant: 'secondary', icon: 'sparkles', onClick: props.onParse }, '重新解析'),
						h(DSP.Btn, { variant: 'ghost', icon: 'arrowLeft', onClick: props.onBack }, DSP.t('返回课程'))
					)
				)
			)
		)
	);
}

function PracticeSetEmpty(props) {
	const setData = props.setData || {};
	const setSummary = props.setSummary || {};
	const status = setSummary.status || 'ready';
	const failed = status === 'failed';
	return h(
		'div',
		{ className: 'dsp-practice-scroll' },
		h(
			'div',
			{ className: 'dsp-practice-inner' },
			h(
				'div',
				{ className: 'dsp-practice-center' },
				h(
					'div',
					{ className: 'dsp-card dsp-practice-notice' },
					h('div', { className: 'dsp-practice-notice-icon' }, h(DSP.Icon, { name: 'list', size: 24 })),
					h('div', { className: 'dsp-practice-notice-title' }, failed ? DSP.t('解析失败') : DSP.t('无题目')),
					h(
						'div',
						{ className: 'dsp-practice-notice-text dsp-muted' },
						failed && setSummary.error ? String(setSummary.error) : '这套题还没有可练习的题目。请确认题目文件已上传并完成解析。'
					),
					Array.isArray(setData.warnings) && setData.warnings.length > 0 ? h(PracticeWarnings, { warnings: setData.warnings }) : null,
					h(PracticeCapabilityHint, { capabilities: props.capabilities }),
					h(
						'div',
						{ className: 'dsp-row dsp-gap-8 dsp-practice-notice-actions' },
						h(DSP.Btn, { variant: 'primary', icon: 'sparkles', onClick: props.onParse }, '重新解析'),
						h(DSP.Btn, { variant: 'secondary', icon: 'arrowLeft', onClick: props.onBack }, DSP.t('返回课程'))
					)
				)
			)
		)
	);
}

/* ------------------------------------------------------------------ */
/* 模式选择卡                                                          */
/* ------------------------------------------------------------------ */

function PracticeModeSelect(props) {
	const questions = (props.setData && props.setData.questions) || [];
	const summaryMode =
		props.setSummary && (props.setSummary.mode === PRACTICE_MODE_END || props.setSummary.mode === PRACTICE_MODE_IMMEDIATE) ? props.setSummary.mode : null;
	const defaultMode = summaryMode || props.local.mode || PRACTICE_MODE_IMMEDIATE;
	const modeState = React.useState(defaultMode === PRACTICE_MODE_END ? PRACTICE_MODE_END : PRACTICE_MODE_IMMEDIATE);
	const selectedMode = modeState[0];
	const setSelectedMode = modeState[1];

	const typeCounts = {};
	questions.forEach(function (question) {
		const type = (question && question.type) || 'other';
		typeCounts[type] = (typeCounts[type] || 0) + 1;
	});
	const typeSummary = Object.keys(typeCounts)
		.map(function (type) {
			return pracTypeLabel(type) + ' ' + typeCounts[type];
		})
		.join(' · ');

	function startPractice() {
		props.local.mode = selectedMode;
		props.local.startedAt = Date.now();
		props.local.finished = false;
		DSP.store.actions.setMode(props.courseId, props.setId, selectedMode).catch(pracToastError);
		props.refresh();
	}

	function renderModeCard(mode, icon, title, description) {
		const active = selectedMode === mode;
		return h(
			'button',
			{
				type: 'button',
				key: mode,
				className: DSP.cls('dsp-mode-card', active ? 'dsp-mode-card-active' : ''),
				onClick: function () {
					setSelectedMode(mode);
				},
				'aria-pressed': active
			},
			h('div', { className: 'dsp-mode-card-top' },
				h('span', { className: 'dsp-mode-card-icon' }, h(DSP.Icon, { name: icon, size: 20 })),
				active ? h(DSP.Icon, { name: 'checkCircle', size: 17, className: 'dsp-mode-card-check' }) : null
			),
			h('div', { className: 'dsp-mode-card-title' }, title),
			h('div', { className: 'dsp-mode-card-desc' }, description)
		);
	}

	return h(
		'div',
		{ className: 'dsp-practice-scroll' },
		h(
			'div',
			{ className: 'dsp-practice-inner dsp-mode-select' },
			h(
				'div',
				{ className: 'dsp-mode-head' },
				h(DSP.IconBtn, { icon: 'arrowLeft', label: DSP.t('返回课程'), onClick: props.onBack }),
				h(
					'div',
					{ className: 'dsp-col dsp-gap-4 dsp-mode-head-text' },
					h('h1', { className: 'dsp-page-title' }, (props.setData && props.setData.title) || (props.setSummary && props.setSummary.title) || DSP.t('题目集')),
					h(
						'div',
						{ className: 'dsp-page-sub' },
						(props.course && props.course.name ? props.course.name + ' · ' : '') + questions.length + ' 道题' + (typeSummary ? ' · ' + typeSummary : '')
					)
				)
			),
			h(PracticeCapabilityHint, { capabilities: props.capabilities }),
			h(
				'div',
				{ className: 'dsp-mode-grid' },
				renderModeCard(PRACTICE_MODE_IMMEDIATE, 'play', DSP.t('答一题看一题'), '每提交一题立即显示答案与解析，适合边练边学、及时纠错。'),
				renderModeCard(PRACTICE_MODE_END, 'clock', DSP.t('全部做完再看'), '逐题作答，交卷后统一查看答案解析，适合模拟考试。')
			),
			h(
				'div',
				{ className: 'dsp-mode-actions' },
				h(DSP.Btn, { variant: 'primary', className: 'dsp-btn-lg', icon: 'play', onClick: startPractice }, DSP.t('开始刷题'))
			)
		)
	);
}

/* ------------------------------------------------------------------ */
/* 顶部条 / 题号导航 / 底部按钮                                        */
/* ------------------------------------------------------------------ */

function PracticeTopBar(props) {
	const accuracyText = props.accuracy === null || props.accuracy === undefined ? '—' : DSP.fmtPct(props.accuracy);
	const fontScale = typeof props.fontScale === 'number' ? props.fontScale : 1;
	const fontPercent = Math.round(fontScale * 100);
	function changeFontScale(next) {
		if (typeof props.onFontScaleChange === 'function') props.onFontScaleChange(next);
	}
	return h(
		'div',
		{ className: 'dsp-practice-top' },
		h(
			'div',
			{ className: 'dsp-practice-head' },
			h(
				'div',
				{ className: 'dsp-practice-head-main' },
				h(DSP.IconBtn, { icon: 'arrowLeft', label: DSP.t('返回课程'), onClick: props.onBack }),
				h(
					'div',
					{ className: 'dsp-practice-head-titles' },
					h('div', { className: 'dsp-practice-title dsp-truncate' }, props.title),
					h('div', { className: 'dsp-practice-sub dsp-truncate' }, props.courseName || '')
				)
			),
			h(
				'div',
				{ className: 'dsp-practice-head-meta' },
				h(DSP.Tag, { tone: 'brand' }, props.modeLabel),
				h('span', { className: 'dsp-practice-meta' }, '第 ' + (props.index + 1) + ' / ' + props.total + ' 题'),
				h('span', { className: 'dsp-practice-meta' }, DSP.t('已答') + ' ' + props.answered + '/' + props.total),
				h('span', { className: 'dsp-practice-meta' }, DSP.t('正确率') + ' ' + accuracyText),
				h('span', { className: 'dsp-practice-meta dsp-practice-clock' }, h(DSP.Icon, { name: 'clock', size: 13 }), props.elapsedText),
				h(
					'div',
					{ className: 'dsp-practice-font-scale', role: 'group', 'aria-label': '题目字号' },
					h(
						DSP.Btn,
						{
							variant: 'ghost',
							className: 'dsp-font-scale-btn',
							title: '缩小题目字号',
							disabled: fontScale <= 0.8,
							onClick: function () {
								changeFontScale(fontScale - 0.1);
							}
						},
						'A−'
					),
					h('span', { className: 'dsp-practice-font-scale-percent' }, fontPercent + '%'),
					h(
						DSP.Btn,
						{
							variant: 'ghost',
							className: 'dsp-font-scale-btn',
							title: '放大题目字号',
							disabled: fontScale >= 1.5,
							onClick: function () {
								changeFontScale(fontScale + 0.1);
							}
						},
						'A+'
					),
					h(
						DSP.Btn,
						{
							variant: 'ghost',
							className: 'dsp-font-scale-btn',
							title: '重置题目字号',
							disabled: Math.abs(fontScale - 1) < 0.001,
							onClick: function () {
								changeFontScale(1);
							}
						},
						'重置'
					)
				)
			)
		),
		h('div', { className: 'dsp-practice-head-progress' }, h(DSP.ProgressBar, { value: props.total > 0 ? props.answered / props.total : 0 }))
	);
}

function PracticeQuestionNav(props) {
	const questions = props.questions || [];
	if (questions.length <= 1) return null;
	return h(
		'div',
		{ className: 'dsp-practice-nav', role: 'tablist', 'aria-label': '题号导航' },
		questions.map(function (question, index) {
			const state = pracQuestionNavState(question, props.local, props.currentIndex, index);
			const number = pracQuestionNumber(question, index);
			const record = question ? props.local.records[question.id] : null;
			let title = '第 ' + number + ' 题';
			if (record && record.revealed) {
				if (record.correct === true) title += ' · 正确';
				else if (record.correct === false) title += ' · 错误';
				else title += ' · 待自评';
			} else if (record) title += ' · 已作答';
			return h(
				'button',
				{
					key: question && question.id ? question.id : 'q' + index,
					type: 'button',
					role: 'tab',
					'aria-selected': index === props.currentIndex,
					className: DSP.cls('dsp-practice-nav-item', 'dsp-practice-nav-item-' + state),
					title: title,
					onClick: function () {
						props.onJump(index);
					}
				},
				number
			);
		})
	);
}

function PracticeFooter(props) {
	const isLast = props.index >= props.total - 1;
	const submitLabel = props.mode === PRACTICE_MODE_END ? (props.submitted ? '更新答案' : DSP.t('提交')) : props.submitting ? 'AI 批改中…' : 'AI 判题';
	const resetButton = props.revealed && typeof props.onReset === 'function'
		? h(
				DSP.Btn,
				{ variant: 'secondary', icon: 'refresh', disabled: props.submitting, onClick: props.onReset },
				'重新作答'
		  )
		: null;
	let primaryAction = null;
	if (!props.revealed) {
		primaryAction = h(
			DSP.Btn,
			{
				variant: 'primary',
				icon: 'check',
				loading: props.submitting,
				disabled: props.submitting || !props.canSubmit,
				onClick: props.onSubmit
			},
			submitLabel
		);
	} else if (isLast) {
		primaryAction = h(DSP.Btn, { variant: 'primary', icon: 'flag', disabled: props.submitting, onClick: props.onFinish }, DSP.t('交卷'));
	} else {
		primaryAction = h(DSP.Btn, { variant: 'primary', icon: 'chevronRight', onClick: props.onNext }, DSP.t('下一题'));
	}
	const showFinish = !props.revealed || !isLast;
	return h(
		'div',
		{ className: 'dsp-practice-foot' },
		h(
			'div',
			{ className: 'dsp-practice-foot-left' },
			h(DSP.Btn, { variant: 'secondary', icon: 'chevronLeft', disabled: props.index <= 0, onClick: props.onPrev }, DSP.t('上一题')),
			h(DSP.Btn, { variant: 'secondary', disabled: isLast, onClick: props.onNext }, DSP.t('下一题'))
		),
		h(
			'div',
			{ className: 'dsp-practice-foot-right' },
			resetButton,
			primaryAction,
			showFinish ? h(DSP.Btn, { variant: 'ghost', icon: 'flag', disabled: props.submitting, onClick: props.onFinish }, DSP.t('交卷')) : null
		)
	);
}

/* ------------------------------------------------------------------ */
/* 练习主体                                                            */
/* ------------------------------------------------------------------ */

function PracticeBody(props) {
	const questions = (props.setData && props.setData.questions) || [];
	const total = questions.length;
	const initialIndex = pracClampIndex(props.initialIndex, total);
	const indexState = React.useState(initialIndex);
	const storedIndex = indexState[0];
	const storeIndex = indexState[1];
	const currentIndex = Math.min(storedIndex, Math.max(0, total - 1));
	const question = questions[currentIndex] || null;

	const bumpState = React.useState(0);
	const bumpLocal = bumpState[1];
	const refreshLocal = React.useCallback(function () {
		bumpLocal(function (value) {
			return value + 1;
		});
	}, []);

	const [submitting, setSubmitting] = React.useState(false);
	const [finishOpen, setFinishOpen] = React.useState(false);
	const [finishing, setFinishing] = React.useState(false);
	const [gradingProgress, setGradingProgress] = React.useState(null); // {done,total}

	/* 当前题号写回全局，看板可据此定位。 */
	React.useEffect(
		function () {
			const storeState = DSP.store.get();
			if (storeState.ui.questionIndex !== currentIndex) DSP.store.actions.ui({ questionIndex: currentIndex });
		},
		[currentIndex]
	);

	/* 外部（看板「定位错题」等）修改 questionIndex 时跟随跳转。 */
	const externalIndex = pracClampIndex(props.initialIndex, total);
	const externalIndexRef = React.useRef(externalIndex);
	React.useEffect(
		function () {
			if (externalIndex !== externalIndexRef.current) {
				externalIndexRef.current = externalIndex;
				storeIndex(externalIndex);
			}
		},
		[externalIndex]
	);

	const scrollRef = React.useRef(null);
	React.useEffect(
		function () {
			if (scrollRef.current) scrollRef.current.scrollTop = 0;
		},
		[currentIndex, props.setId]
	);

	const questionStartRef = React.useRef(Date.now());
	React.useEffect(
		function () {
			questionStartRef.current = Date.now();
		},
		[currentIndex, props.setId]
	);

	pracUseTick(!props.local.finished);
	const stats = pracSetStats(questions, props.local);
	const elapsedMs = props.local.startedAt ? Math.max(0, Date.now() - props.local.startedAt) : 0;
	const mode = props.mode || PRACTICE_MODE_IMMEDIATE;
	const currentRecord = question ? props.local.records[question.id] : null;
	const revealed = question ? Boolean(props.local.revealed[question.id]) : false;
	const canSubmit = question ? pracHasAnswer(question, props.local.answers[question.id]) : false;

	function setIndex(nextIndex) {
		const value = pracClampIndex(nextIndex, total);
		if (value !== currentIndex) storeIndex(value);
	}

	function handleAnswerChange(value) {
		if (!question) return;
		props.local.answers[question.id] = value;
		/* 答案改过就作废旧判题缓存，重新提交时才会重新判卷。 */
		delete props.local.grades[question.id];
		const existing = props.local.records[question.id];
		if (existing && existing.aiGrade) {
			const next = Object.assign({}, existing);
			delete next.aiGrade;
			props.local.records[question.id] = next;
		}
		if (props.local.startedAt === null) props.local.startedAt = Date.now();
		refreshLocal();
	}

	/** 重新作答：清掉本题的 reveal/判题缓存，回到可编辑状态；再次提交会重新判卷。 */
	function handleResetAnswer() {
		if (!question) return;
		props.local.revealed[question.id] = false;
		delete props.local.grades[question.id];
		const record = props.local.records[question.id];
		if (record) {
			const next = Object.assign({}, record, { revealed: false, correct: null, selfGraded: false });
			delete next.aiGrade;
			props.local.records[question.id] = next;
		}
		refreshLocal();
	}

	function createBaseRecord(questionItem, value) {
		const previous = props.local.records[questionItem.id];
		const elapsed = Math.max(0, Date.now() - questionStartRef.current);
		return {
			id: (previous && previous.id) || props.local.recordIds[questionItem.id] || DSP.uid('r'),
			questionId: questionItem.id,
			answer: pracNormalizeWrite(questionItem, value),
			correct: pracEvaluate(questionItem, value).correct,
			revealed: false,
			durationMs: previous && Number.isFinite(Number(previous.durationMs)) ? Math.max(0, Number(previous.durationMs)) : elapsed,
			mode: mode,
			selfGraded: false
		};
	}

	/* 启动一次 AI 批改：同一题只调用一次；失败回退本地对比判分并 toast。
	 * 返回 Promise<record>（correct 已按 AI verdict 或本地回退确定，成功时带 aiGrade）。 */
	function startAiGrade(questionItem, baseRecord) {
		const cached = props.local.grades[questionItem.id];
		if (cached && cached.promise) return cached.promise;
		if (cached && cached.record) return Promise.resolve(cached.record);
		if (baseRecord && baseRecord.aiGrade) return Promise.resolve(baseRecord);
		const answerSnapshot = pracToArray(baseRecord && baseRecord.answer);
		const promise = Promise.resolve()
			.then(function () {
				return DSP.store.actions.gradeQuestion(questionItem.id, answerSnapshot);
			})
			.then(function (aiGrade) {
				const current = props.local.records[questionItem.id] || baseRecord;
				const currentAnswer = pracToArray(current.answer);
				const sameAnswer =
					currentAnswer.length === answerSnapshot.length &&
					currentAnswer.every(function (item, index) {
						return String(item) === String(answerSnapshot[index]);
					});
				const verdictCorrect = pracAiGradeCorrect(aiGrade);
				const next = Object.assign({}, current, {
					correct: verdictCorrect === null ? pracEvaluate(questionItem, current.answer).correct : verdictCorrect
				});
				/* 用户在批改期间改过答案则丢弃该次 AI 结果，仅保留本地兜底判分。 */
				if (sameAnswer) next.aiGrade = aiGrade && typeof aiGrade === 'object' ? aiGrade : {};
				props.local.records[questionItem.id] = next;
				props.local.recordIds[questionItem.id] = next.id;
				props.local.grades[questionItem.id] = { status: sameAnswer ? 'done' : 'stale', record: next };
				refreshLocal();
				return next;
			})
			.catch(function (error) {
				pracToastError(error);
				const current = Object.assign({}, props.local.records[questionItem.id] || baseRecord, {
					correct: pracEvaluate(questionItem, (props.local.records[questionItem.id] || baseRecord).answer).correct
				});
				props.local.records[questionItem.id] = current;
				props.local.grades[questionItem.id] = { status: 'error', record: current };
				refreshLocal();
				return current;
			});
		props.local.grades[questionItem.id] = { status: 'running', promise: promise };
		return promise;
	}

	function handleSubmit() {
		if (submitting || !question) return;
		const value = props.local.answers[question.id];
		if (!pracHasAnswer(question, value)) {
			DSP.store.actions.toast('这道题还没有作答', 'warn');
			return;
		}
		const baseRecord = createBaseRecord(question, value);
		props.local.records[question.id] = Object.assign({}, baseRecord, { revealed: false });
		props.local.recordIds[question.id] = baseRecord.id;
		props.local.answers[question.id] = pracToArray(value);
		if (props.local.startedAt === null) props.local.startedAt = Date.now();
		refreshLocal();

		if (mode === PRACTICE_MODE_IMMEDIATE) {
			/* 即时模式：先 AI 批改（loading），再保存 record（含 aiGrade），最后 reveal。 */
			setSubmitting(true);
			startAiGrade(question, baseRecord)
				.then(function (graded) {
					const record = Object.assign({}, props.local.records[question.id] || graded || baseRecord, graded || {}, {
						revealed: true,
						selfGraded: false
					});
					return DSP.store.actions
						.saveRecords(props.courseId, props.setId, [record])
						.catch(pracToastError)
						.then(function () {
							props.local.records[question.id] = record;
							props.local.recordIds[question.id] = record.id;
							props.local.revealed[question.id] = true;
							refreshLocal();
						});
				})
				.then(function () {
					setSubmitting(false);
				});
			return;
		}

		/* 全部做完模式：后台批改，不阻塞继续做题；交卷时统一等待并写 records。 */
		startAiGrade(question, baseRecord);
		if (currentIndex < total - 1) setIndex(currentIndex + 1);
	}

	function handleSelfGrade(questionId, correct) {
		const record = props.local.records[questionId];
		if (!record) return;
		const next = Object.assign({}, record, { correct: Boolean(correct), selfGraded: true, revealed: true });
		props.local.records[questionId] = next;
		props.local.revealed[questionId] = true;
		refreshLocal();
		Promise.resolve(DSP.store.actions.saveRecords(props.courseId, props.setId, [next])).catch(pracToastError);
	}

	function handleAsk() {
		if (question) DSP.store.actions.askQuestion(question);
	}

	function handleRedrawFigure(questionId, figureIndex) {
		if (!questionId) return;
		DSP.store.actions.redrawFigure(props.setId, questionId, figureIndex).catch(pracToastError);
	}

	function handleNext() {
		setIndex(currentIndex + 1);
		questionStartRef.current = Date.now();
	}

	function handlePrev() {
		setIndex(currentIndex - 1);
		questionStartRef.current = Date.now();
	}

	function handleJump(index) {
		setIndex(index);
		questionStartRef.current = Date.now();
	}

	function handleFinish() {
		if (finishing) return;
		setFinishing(true);
		(async function () {
			/* 先等待所有「后台 AI 批改」完成并显示 x/y 进度，再统一写 records。 */
			const pending = [];
			questions.forEach(function (item) {
				const grade = props.local.grades[item.id];
				if (grade && grade.status === 'running' && grade.promise) pending.push(grade.promise);
			});
			if (pending.length > 0) {
				let done = 0;
				setGradingProgress({ done: 0, total: pending.length });
				/* 单题兜底：批改失败/超时都允许交卷继续（超时 90s，回退本地判分结果）。 */
				const waitOne = function (promise) {
					return new Promise(function (resolve) {
						let settled = false;
						const timer = window.setTimeout(function () {
							if (settled) return;
							settled = true;
							resolve(null);
						}, 90000);
						Promise.resolve(promise).then(
							function (value) {
								if (settled) return;
								settled = true;
								window.clearTimeout(timer);
								resolve(value);
							},
							function () {
								if (settled) return;
								settled = true;
								window.clearTimeout(timer);
								resolve(null);
							}
						);
					});
				};
				await Promise.all(
					pending.map(function (promise) {
						return waitOne(promise).then(function (value) {
							done += 1;
							setGradingProgress({ done: done, total: pending.length });
							return value;
						});
					})
				);
			}
			setGradingProgress(null);
			const batch = [];
			questions.forEach(function (item) {
				const record = props.local.records[item.id];
				if (!record) return;
				batch.push(Object.assign({}, record, { revealed: true }));
			});
			if (batch.length > 0) await DSP.store.actions.saveRecords(props.courseId, props.setId, batch);
			await DSP.store.actions.completeSet(props.courseId, props.setId);
			if (props.local.startedAt === null) props.local.startedAt = Date.now();
			if (!props.local.finished) props.local.finished = true;
			questions.forEach(function (item) {
				const record = props.local.records[item.id];
				if (!record) return;
				props.local.records[item.id] = Object.assign({}, record, { revealed: true });
				props.local.revealed[item.id] = true;
			});
			setFinishOpen(false);
			refreshLocal();
			DSP.store.actions.toast(DSP.t('完成') + '：' + (props.setData.title || '本套题'), 'success');
		})()
			.catch(pracToastError)
			.then(function () {
				setFinishing(false);
				setGradingProgress(null);
			});
	}

	const warnings = (props.setData && props.setData.warnings) || [];

	return h(
		'div',
		{ className: 'dsp-practice-panel' },
		h(PracticeTopBar, {
			title: (props.setData && (props.setData.title || props.setSummary && props.setSummary.title)) || DSP.t('题目集'),
			courseName: (props.course && props.course.name) || '',
			index: currentIndex,
			total: total,
			answered: stats.answered,
			accuracy: stats.accuracy,
			modeLabel: pracModeLabel(mode),
			elapsedText: props.local.startedAt ? DSP.fmtDuration(elapsedMs) : '—',
			fontScale: typeof props.fontScale === 'number' ? props.fontScale : 1,
			onFontScaleChange: props.onFontScaleChange,
			onBack: props.onBack
		}),
		h(
			'div',
			{ className: 'dsp-practice-scroll', ref: scrollRef },
			h(
				'div',
				{ className: 'dsp-practice-inner' },
				h(PracticeCapabilityHint, { capabilities: props.capabilities }),
				h(PracticeWarnings, { warnings: warnings }),
				h(PracticeQuestionNav, {
					questions: questions,
					local: props.local,
					currentIndex: currentIndex,
					onJump: handleJump
				}),
				question
					? h(PracticeQuestionCard, {
							question: question,
							index: currentIndex,
							setData: props.setData,
							courseId: props.courseId,
							setId: props.setId,
							local: props.local,
							svgJob: props.svgJob,
							revealed: revealed,
							record: currentRecord,
							isLast: currentIndex >= total - 1,
							onChange: handleAnswerChange,
							onAsk: handleAsk,
							onSelfGrade: function (correct) {
								handleSelfGrade(question.id, correct);
							},
							onNext: handleNext,
							onRedrawFigure: handleRedrawFigure,
							aiGrade: currentRecord && currentRecord.aiGrade ? currentRecord.aiGrade : null,
							locked: submitting && mode === PRACTICE_MODE_IMMEDIATE,
							pinnedFigureKey: props.pinnedFigureKey,
							onPinFigure: props.onPinFigure
					  })
					: null
			)
		),
		h(PracticeFooter, {
			index: currentIndex,
			total: total,
			revealed: revealed,
			submitted: Boolean(currentRecord),
			canSubmit: canSubmit,
			submitting: submitting,
			mode: mode,
			onPrev: handlePrev,
			onNext: handleNext,
			onSubmit: handleSubmit,
			onReset: handleResetAnswer,
			onFinish: function () {
				setFinishOpen(true);
			}
		}),
		h(
			DSP.Modal,
			{
				open: finishOpen,
				title: DSP.t('交卷'),
				onClose: function () {
					if (!finishing) setFinishOpen(false);
				},
				footer: [
					h(
						DSP.Btn,
						{
							key: 'cancel',
							variant: 'secondary',
							disabled: finishing,
							onClick: function () {
								if (!finishing) setFinishOpen(false);
							}
						},
						DSP.t('取消')
					),
					h(
						DSP.Btn,
						{
							key: 'confirm',
							variant: 'primary',
							icon: 'flag',
							loading: finishing,
							disabled: finishing,
							onClick: handleFinish
						},
						DSP.t('确认')
					)
				]
			},
			h(
				'div',
				{ className: 'dsp-col dsp-gap-8' },
				gradingProgress
					? h(
							'div',
							{ className: 'dsp-col dsp-gap-6' },
							h('div', null, 'AI 批改中… ' + gradingProgress.done + ' / ' + gradingProgress.total),
							h(DSP.ProgressBar, { value: gradingProgress.total > 0 ? gradingProgress.done / gradingProgress.total : 0 }),
							h('div', { className: 'dsp-small dsp-muted' }, '正在等待本套题目完成 AI 批改，完成后自动保存并统计成绩。')
					  )
					: h('div', null, '确定要交卷吗？交卷后本套题会标记为已完成，并统计本套成绩。'),
				h('div', { className: 'dsp-small dsp-muted' }, '当前进度：已答 ' + stats.answered + ' / ' + total + ' 题，正确率 ' + (stats.accuracy === null ? '—' : DSP.fmtPct(stats.accuracy)) + '。'),
				stats.answered < total ? h('div', { className: 'dsp-small dsp-muted' }, '还有 ' + (total - stats.answered) + ' 题未作答，未作答题目不计入正确率。') : null
			)
		)
	);
}

/* 供 90-app.js 的 ViewRouter 使用（ui.view === 'practice' 时渲染）。 */
DSP.PracticeArea = PracticeArea;
