/* 刷题模式 Client — 全局状态与动作（Lead 维护）。
 *
 * 所有 UI 片段都通过 DSP.store / DSP.useStore 读取状态，通过 DSP.store.actions
 * 调用后端。状态变更只走这里的 helper，组件不要自己 fetch bootstrap。
 */

var __storeState = {
	ready: false,
	loading: false,
	initStarted: false,
	error: null,
	data: { courses: [], global: { analysis: null }, capabilities: { images: false, render: false, model: null } },
	setCache: {}, // setId -> { loading, error, data }
	threads: {}, // threadId -> { loading, error, thread: {id,title,messages} }
	chatMessages: {}, // threadId -> [{role,text,at,context,error}]
	ui: {
		view: 'course-home', // course-home | practice | course-dash | global-dash
		courseId: null,
		setId: null,
		questionIndex: 0,
		mode: 'immediate',
		parse: null, // { setId, jobId, status, message, progress, error }
		analysisJob: null, // { scope, jobId, status, message, progress }
		svgJob: null, // { jobId, setId, questionId, figureIndex, status, message }
		chat: {
			threadId: null,
			draft: '',
			attachments: [],
			streaming: false,
			pending: '',
			focusBump: 0,
			expandBump: 0,
			error: null,
			autoAsk: false
		},
		toasts: []
	}
};

var __storeListeners = new Set();

function storeGet() {
	return __storeState;
}

function storeNotify() {
	__storeState = Object.assign({}, __storeState);
	const listeners = Array.from(__storeListeners);
	for (let index = 0; index < listeners.length; index += 1) {
		try {
			listeners[index]();
		} catch (error) {
			/* 单个订阅者异常不影响其他订阅者 */
		}
	}
}

function storePatch(updater) {
	updater(__storeState);
	storeNotify();
}

function setUI(patch) {
	storePatch(function (state) {
		state.ui = Object.assign({}, state.ui, patch);
	});
}

function setChatUI(patch) {
	storePatch(function (state) {
		state.ui = Object.assign({}, state.ui);
		state.ui.chat = Object.assign({}, state.ui.chat, patch);
	});
}

function sleep(ms) {
	return new Promise(function (resolve) {
		window.setTimeout(resolve, ms);
	});
}

function currentCourse() {
	const state = __storeState;
	const id = state.ui.courseId;
	if (!id) return null;
	return (state.data.courses || []).find(function (course) {
		return course.id === id;
	}) || null;
}

function currentSetSummary() {
	const course = currentCourse();
	if (!course || !__storeState.ui.setId) return null;
	return (course.sets || []).find(function (set) {
		return set.id === __storeState.ui.setId;
	}) || null;
}

function mutateCourse(courseId, mutator) {
	storePatch(function (state) {
		const courses = (state.data.courses || []).map(function (course) {
			if (course.id !== courseId) return course;
			const copy = Object.assign({}, course);
			mutator(copy);
			return copy;
		});
		state.data = Object.assign({}, state.data, { courses: courses });
	});
}

function pushToast(text, kind) {
	const id = DSP.uid('toast');
	storePatch(function (state) {
		state.ui = Object.assign({}, state.ui, {
			toasts: (state.ui.toasts || []).concat([{ id: id, text: String(text), kind: kind || 'info' }])
		});
	});
	window.setTimeout(function () {
		storePatch(function (state) {
			state.ui = Object.assign({}, state.ui, {
				toasts: (state.ui.toasts || []).filter(function (toast) {
					return toast.id !== id;
				})
			});
		});
	}, kind === 'error' ? 5200 : 3200);
}

function dismissToast(id) {
	storePatch(function (state) {
		state.ui = Object.assign({}, state.ui, {
			toasts: (state.ui.toasts || []).filter(function (toast) {
				return toast.id !== id;
			})
		});
	});
}

function upsertRecord(list, record) {
	const next = (list || []).slice();
	const index = next.findIndex(function (item) {
		return item.id === record.id;
	});
	if (index >= 0) next[index] = Object.assign({}, next[index], record);
	else next.push(record);
	return next;
}

async function loadBootstrap(keepUI) {
	const previous = __storeState;
	if (!keepUI) setUI({ courseId: previous.ui.courseId, setId: previous.ui.setId });
	storePatch(function (state) {
		state.loading = true;
		state.error = null;
	});
	try {
		const data = await DSP.api.bootstrap();
		storePatch(function (state) {
			state.data = {
				courses: Array.isArray(data.courses) ? data.courses : [],
				global: data.global || { analysis: null },
				capabilities: data.capabilities || { images: false, render: false, model: null }
			};
			state.ready = true;
			state.loading = false;
			state.error = null;
			const courses = state.data.courses;
			let courseId = state.ui.courseId;
			if (!courseId && courses.length > 0) courseId = courses[0].id;
			if (courseId && !courses.some(function (course) { return course.id === courseId; })) courseId = courses.length > 0 ? courses[0].id : null;
			let setId = state.ui.setId;
			const course = courses.find(function (item) { return item.id === courseId; });
			if (course && setId && !(course.sets || []).some(function (set) { return set.id === setId; })) setId = null;
			const view = courseId ? (state.ui.view === 'practice' && !setId ? 'course-home' : state.ui.view) : 'global-dash';
			state.ui = Object.assign({}, state.ui, { courseId: courseId, setId: setId, view: view });
		});
		return __storeState;
	} catch (error) {
		storePatch(function (state) {
			state.loading = false;
			state.error = error && error.message ? error.message : String(error);
		});
		throw error;
	}
}

async function pollJob(jobId, options) {
	const opts = options || {};
	const interval = opts.interval || 900;
	for (;;) {
		const job = await DSP.api.job(jobId);
		if (typeof opts.onUpdate === 'function') opts.onUpdate(job);
		if (!job || job.status !== 'running') return job;
		if (opts.signal && opts.signal.aborted) throw new Error('已取消');
		await sleep(interval);
	}
}

function updateThreadSummary(courseId, threadId, patch) {
	mutateCourse(courseId, function (course) {
		const threads = (course.chatThreads || []).slice();
		const index = threads.findIndex(function (thread) { return thread.id === threadId; });
		if (index >= 0) threads[index] = Object.assign({}, threads[index], patch);
		else threads.unshift(Object.assign({ id: threadId, title: '新对话', createdAt: Date.now(), updatedAt: Date.now(), messageCount: 0 }, patch));
		course.chatThreads = threads;
	});
}

const storeActions = {
	init: async function init() {
		if (__storeState.initStarted) return;
		storePatch(function (state) {
			state.initStarted = true;
		});
		// 首次进入插件默认停在「所有课程看板」（左栏移除后这里是课程/看板统一入口）。
		setUI({ view: 'global-dash' });
		try {
			await loadBootstrap(true);
		} catch (error) {
			/* 错误已进入 state.error，App 展示重试 */
		}
	},
	reload: function reload() {
		return loadBootstrap(true);
	},
	getCourse: currentCourse,
	getSetSummary: currentSetSummary,
	ui: setUI,
	chatUI: setChatUI,
	toast: pushToast,
	dismissToast: dismissToast,

	navigate: function navigate(view, patch) {
		setUI(Object.assign({ view: view }, patch || {}));
	},
	openCourse: function openCourse(courseId) {
		const changed = __storeState.ui.courseId !== courseId;
		setUI({
			view: 'course-home',
			courseId: courseId,
			setId: null,
			questionIndex: 0,
			parse: null,
			svgJob: null
		});
		if (changed) {
			storePatch(function (state) {
				state.ui = Object.assign({}, state.ui);
				state.ui.chat = {
					threadId: null,
					draft: '',
					attachments: [],
					streaming: false,
					pending: '',
					focusBump: 0,
					error: null,
					autoAsk: false
				};
			});
		}
	},
	openPractice: function openPractice(courseId, setId) {
		setUI({ view: 'practice', courseId: courseId, setId: setId, questionIndex: 0, parse: null });
		storeActions.loadSet(courseId, setId).catch(function () {});
	},
	openCourseDash: function openCourseDash(courseId) {
		setUI({ view: 'course-dash', courseId: courseId });
	},
	openGlobalDash: function openGlobalDash() {
		setUI({ view: 'global-dash' });
	},

	createCourse: async function createCourse(input) {
		const json = await DSP.api.post('course', { action: 'create', name: input.name, description: input.description || '' });
		await loadBootstrap(true);
		setUI({ view: 'course-home', courseId: json.courseId, setId: null });
		pushToast(DSP.t('课程已创建'), 'success');
		return json.courseId;
	},
	updateCourse: async function updateCourse(courseId, patch) {
		await DSP.api.post('course', Object.assign({ action: 'update', courseId: courseId }, patch));
		await loadBootstrap(true);
	},
	deleteCourse: async function deleteCourse(courseId) {
		await DSP.api.post('course', { action: 'delete', courseId: courseId });
		const state = __storeState;
		if (state.ui.courseId === courseId) setUI({ courseId: null, setId: null, view: 'course-home' });
		await loadBootstrap(true);
	},
	deleteSet: async function deleteSet(courseId, setId) {
		await DSP.api.post('set/delete', { courseId: courseId, setId: setId });
		if (__storeState.ui.setId === setId) setUI({ setId: null, view: 'course-home' });
		await loadBootstrap(true);
		pushToast('已删除该套题', 'success');
	},

	loadSet: async function loadSet(courseId, setId) {
		const cache = __storeState.setCache[setId];
		if (cache && cache.loading) return cache.promise;
		if (cache && cache.data && cache.courseId === courseId) return cache.data;
		const promise = (async function () {
			storePatch(function (state) {
				state.setCache = Object.assign({}, state.setCache, { [setId]: { loading: true, data: cache && cache.data, courseId: courseId } });
			});
			try {
				const data = await DSP.api.set(courseId, setId);
				storePatch(function (state) {
					state.setCache = Object.assign({}, state.setCache, { [setId]: { loading: false, data: data, courseId: courseId } });
				});
				return data;
			} catch (error) {
				storePatch(function (state) {
					state.setCache = Object.assign({}, state.setCache, { [setId]: { loading: false, error: error.message, courseId: courseId } });
				});
				throw error;
			}
		})();
		storePatch(function (state) {
			state.setCache = Object.assign({}, state.setCache, { [setId]: { loading: true, promise: promise, data: cache && cache.data, courseId: courseId } });
		});
		return promise;
	},
	invalidateSet: function invalidateSet(setId) {
		storePatch(function (state) {
			const next = Object.assign({}, state.setCache);
			delete next[setId];
			state.setCache = next;
		});
	},
	setData: function getSetData(setId) {
		const cache = __storeState.setCache[setId];
		return cache ? cache.data : null;
	},

	filterFiles: function filterFiles(files, mode) {
		const list = Array.from(files || []);
		const allowed = mode === 'question'
			? ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.png', '.jpg', '.jpeg', '.webp', '.txt', '.md', '.markdown']
			: ['.pdf', '.docx', '.pptx', '.txt', '.md', '.markdown', '.csv', '.json', '.html', '.htm'];
		const accepted = [];
		const skipped = [];
		list.forEach(function (file) {
			const name = file.name || 'file';
			const dot = name.lastIndexOf('.');
			const ext = dot >= 0 ? name.slice(dot).toLowerCase() : '';
			if (allowed.indexOf(ext) < 0) skipped.push({ name: name, reason: '不支持的文件类型' });
			else if (file.size > 25 * 1024 * 1024) skipped.push({ name: name, reason: '文件超过 25MB' });
			else accepted.push(file);
		});
		return { accepted: accepted, skipped: skipped };
	},

	uploadDocs: async function uploadDocs(courseId, files) {
		const { accepted, skipped } = storeActions.filterFiles(files, 'doc');
		const uploaded = [];
		for (let index = 0; index < accepted.length; index += 1) {
			const file = accepted[index];
			const data = await DSP.fileToBase64(file);
			const relative = file.__dspRelativePath || file.webkitRelativePath || file.name;
			const json = await DSP.api.post('upload', {
				courseId: courseId,
				category: 'doc',
				files: [{ name: file.name, path: relative, data: data }]
			});
			uploaded.push.apply(uploaded, json.docs || []);
			skipped.push.apply(skipped, json.skipped || []);
		}
		await loadBootstrap(true);
		if (uploaded.length > 0) pushToast('已上传 ' + uploaded.length + ' 个课程文档', 'success');
		if (skipped.length > 0) pushToast('已跳过 ' + skipped.length + ' 个文件', 'warn');
		return { docs: uploaded, skipped: skipped };
	},
	deleteDoc: async function deleteDoc(courseId, docId) {
		await DSP.api.post('doc/delete', { courseId: courseId, docId: docId });
		await loadBootstrap(true);
		pushToast('已删除文档', 'success');
	},

	uploadQuestions: async function uploadQuestions(courseId, files) {
		const { accepted, skipped } = storeActions.filterFiles(files, 'question');
		if (accepted.length === 0) throw new Error('没有可上传的题目文件');
		const payload = [];
		for (let index = 0; index < accepted.length; index += 1) {
			const file = accepted[index];
			const relative = file.__dspRelativePath || file.webkitRelativePath || file.name;
			payload.push({ name: file.name, path: relative, data: await DSP.fileToBase64(file) });
		}
		const json = await DSP.api.post('upload', { courseId: courseId, category: 'question', files: payload });
		await loadBootstrap(true);
		if ((json.skipped || []).length > 0) skipped.push.apply(skipped, json.skipped);
		if (json.setId) {
			setUI({ courseId: courseId, setId: json.setId, view: 'practice', questionIndex: 0 });
			await storeActions.startParse(courseId, json.setId);
		}
		return { setId: json.setId, skipped: skipped };
	},

	/** 上传试卷并可选同时上传答案文件，然后只解析一次（上传流程统一入口）。 */
	uploadExamSet: async function uploadExamSet(courseId, questionFiles, answerFiles) {
		const questionPick = storeActions.filterFiles(questionFiles, 'question');
		if (questionPick.accepted.length === 0) throw new Error('没有可上传的题目文件');
		const skipped = questionPick.skipped.slice();
		const payload = [];
		for (let index = 0; index < questionPick.accepted.length; index += 1) {
			const file = questionPick.accepted[index];
			const relative = file.__dspRelativePath || file.webkitRelativePath || file.name;
			payload.push({ name: file.name, path: relative, data: await DSP.fileToBase64(file) });
		}
		const json = await DSP.api.post('upload', { courseId: courseId, category: 'question', files: payload });
		await loadBootstrap(true);
		if ((json.skipped || []).length > 0) skipped.push.apply(skipped, json.skipped);
		if (!json.setId) return { setId: null, skipped: skipped };
		if (Array.isArray(answerFiles) && answerFiles.length > 0) {
			try {
				await storeActions.uploadAnswerFiles(courseId, json.setId, answerFiles, { silent: true });
			} catch (error) {
				pushToast('答案文件上传失败：' + (error && error.message ? error.message : String(error)), 'warn');
			}
		}
		setUI({ courseId: courseId, setId: json.setId, view: 'practice', questionIndex: 0 });
		await storeActions.startParse(courseId, json.setId);
		return { setId: json.setId, skipped: skipped };
	},

	uploadAnswerFiles: async function uploadAnswerFiles(courseId, setId, files, options) {
		const silent = Boolean(options && options.silent);
		const { accepted, skipped } = storeActions.filterFiles(files, 'question');
		if (accepted.length === 0) throw new Error('没有可上传的答案文件');
		const payload = [];
		for (let index = 0; index < accepted.length; index += 1) {
			const file = accepted[index];
			const relative = file.__dspRelativePath || file.webkitRelativePath || file.name;
			payload.push({ name: file.name, path: relative, data: await DSP.fileToBase64(file), role: 'answers' });
		}
		const json = await DSP.api.post('upload', {
			courseId: courseId,
			category: 'question',
			setId: setId,
			role: 'answers',
			files: payload
		});
		await loadBootstrap(true);
		if ((json.skipped || []).length > 0) skipped.push.apply(skipped, json.skipped);
		if (!silent) {
			pushToast('已上传 ' + payload.length + ' 个答案文件，重新解析后生效', 'success');
			if (skipped.length > 0) pushToast('已跳过 ' + skipped.length + ' 个文件', 'warn');
		}
		return { files: json.files || [], skipped: skipped };
	},
	setAiAnswerMode: async function setAiAnswerMode(courseId, setId, mode) {
		const allowed = ['auto', 'off', 'regenerate'];
		if (allowed.indexOf(mode) < 0) throw new Error('无效的 AI 答案解析模式');
		await DSP.api.post('set/ai-mode', { courseId: courseId, setId: setId, aiAnswerMode: mode });
		mutateCourse(courseId, function (course) {
			course.sets = (course.sets || []).map(function (set) {
				if (set.id !== setId) return set;
				return Object.assign({}, set, { aiAnswerMode: mode, updatedAt: Date.now() });
			});
		});
		pushToast('已保存答案解析设置，重新解析后生效', 'success');
	},

	startParse: async function startParse(courseId, setId) {
		setUI({ parse: { setId: setId, jobId: null, status: 'running', message: DSP.t('正在解析'), progress: 0 } });
		try {
			const json = await DSP.api.post('parse', { courseId: courseId, setId: setId });
			setUI({ parse: { setId: setId, jobId: json.jobId, status: 'running', message: DSP.t('正在解析'), progress: 3 } });
			const job = await pollJob(json.jobId, {
				onUpdate: function (update) {
					setUI({ parse: { setId: setId, jobId: json.jobId, status: update.status, message: update.message || '', progress: update.progress || 0 } });
				}
			});
			if (job.status === 'error') throw new Error(job.error || '解析失败');
			await loadBootstrap(true);
			storeActions.invalidateSet(setId);
			await storeActions.loadSet(courseId, setId);
			setUI({ parse: null, view: 'practice', courseId: courseId, setId: setId, questionIndex: 0 });
			pushToast(DSP.t('题目已解析') + '，参考答案后台解析中', 'success');
			/* 参考答案在后台任务里解析：题目先可作答，完成后静默刷新本套题。 */
			const answersJobId = job.result && job.result.answersJobId;
			if (answersJobId) {
				pollJob(answersJobId)
					.then(async function (answersJob) {
						if (!answersJob || answersJob.status !== 'done') {
							if (answersJob && answersJob.error && answersJob.error !== '任务已取消') {
								pushToast('参考答案解析失败：' + answersJob.error, 'warn');
							}
							return;
						}
						await loadBootstrap(true);
						storeActions.invalidateSet(setId);
						await storeActions.loadSet(courseId, setId);
						pushToast('参考答案已更新', 'success');
					})
					.catch(function () {
						/* 后台答案刷新失败不打断答题 */
					});
			}
		} catch (error) {
			setUI({ parse: { setId: setId, status: 'error', message: error.message, progress: 100, error: error.message } });
			await loadBootstrap(true).catch(function () {});
			throw error;
		}
	},

	pollJob: pollJob,

	saveRecords: async function saveRecords(courseId, setId, records) {
		if (!records || records.length === 0) return;
		await DSP.api.post('answers', { courseId: courseId, setId: setId, records: records });
		storePatch(function (state) {
			const courses = (state.data.courses || []).map(function (course) {
				if (course.id !== courseId) return course;
				let list = course.records || [];
				records.forEach(function (record) {
					list = upsertRecord(list, Object.assign({ setId: setId }, record));
				});
				const answered = new Set(list.filter(function (record) { return record.setId === setId; }).map(function (record) { return record.questionId; }));
				return Object.assign({}, course, {
					records: list,
					sets: (course.sets || []).map(function (set) {
						if (set.id !== setId) return set;
						return Object.assign({}, set, { answeredCount: answered.size, updatedAt: Date.now() });
					})
				});
			});
			state.data = Object.assign({}, state.data, { courses: courses });
		});
	},
	setMode: async function setMode(courseId, setId, mode) {
		setUI({ mode: mode });
		mutateCourse(courseId, function (course) {
			course.sets = (course.sets || []).map(function (set) {
				if (set.id !== setId) return set;
				return Object.assign({}, set, { mode: mode });
			});
		});
		await DSP.api.post('set/mode', { courseId: courseId, setId: setId, mode: mode });
	},
	completeSet: async function completeSet(courseId, setId) {
		const json = await DSP.api.post('set/complete', { courseId: courseId, setId: setId });
		await loadBootstrap(true);
		storeActions.invalidateSet(setId);
		return json.summary;
	},

	/** AI 判题：对某题的用户答案生成判定与建议（结果由调用方展示，并可随 record 持久化）。 */
	gradeQuestion: async function gradeQuestion(questionId, userAnswer) {
		const state = __storeState;
		const courseId = state.ui.courseId;
		const setId = state.ui.setId;
		if (!courseId || !setId) throw new Error('请先进入一套题目');
		const json = await DSP.api.post('grade', {
			courseId: courseId,
			setId: setId,
			questionId: questionId,
			userAnswer: Array.isArray(userAnswer) ? userAnswer : (userAnswer === undefined || userAnswer === null ? [] : [String(userAnswer)])
		});
		const job = await pollJob(json.jobId, { interval: 900 });
		if (job.status === 'error') throw new Error(job.error || 'AI 判题失败');
		const result = job.result && typeof job.result === 'object' ? job.result : {};
		return Object.assign({ generatedAt: Date.now() }, result);
	},

	diagnose: async function diagnose(scope, setId) {
		const state = __storeState;
		const courseId = state.ui.courseId;
		if (!courseId && scope !== 'global') throw new Error('请先选择课程');
		if (scope === 'global' && (state.data.courses || []).length === 0) throw new Error('还没有任何课程');
		setUI({ analysisJob: { scope: scope, setId: setId || null, status: 'running', message: DSP.t('正在生成'), progress: 0 } });
		try {
			const json = await DSP.api.post('diagnose', { courseId: courseId || undefined, scope: scope, setId: setId });
			const job = await pollJob(json.jobId, {
				onUpdate: function (update) {
					setUI({ analysisJob: { scope: scope, setId: setId || null, status: update.status, message: update.message || '', progress: update.progress || 0 } });
				}
			});
			if (job.status === 'error') throw new Error(job.error || '生成失败');
			await loadBootstrap(true);
			setUI({ analysisJob: null });
			return job.result && job.result.markdown ? job.result.markdown : '';
		} catch (error) {
			setUI({ analysisJob: null });
			throw error;
		}
	},

	redrawFigure: async function redrawFigure(setId, questionId, figureIndex) {
		const state = __storeState;
		const courseId = state.ui.courseId;
		setUI({ svgJob: { jobId: null, setId: setId, questionId: questionId, figureIndex: figureIndex, status: 'running', message: DSP.t('正在生成') } });
		try {
			const json = await DSP.api.post('svg', { courseId: courseId, setId: setId, questionId: questionId, figureIndex: figureIndex });
			const job = await pollJob(json.jobId, {
				onUpdate: function (update) {
					setUI({ svgJob: { jobId: json.jobId, setId: setId, questionId: questionId, figureIndex: figureIndex, status: update.status, message: update.message || '' } });
				}
			});
			if (job.status === 'error') throw new Error(job.error || '重绘失败');
			storeActions.invalidateSet(setId);
			await storeActions.loadSet(courseId, setId);
			setUI({ svgJob: null });
			pushToast('已重新绘制图示', 'success');
		} catch (error) {
			setUI({ svgJob: null });
			throw error;
		}
	},

	loadThread: async function loadThread(courseId, threadId) {
		if (!threadId) return null;
		const existing = __storeState.threads[threadId];
		if (existing && (existing.loading || existing.thread)) return existing.thread || null;
		storePatch(function (state) {
			state.threads = Object.assign({}, state.threads, { [threadId]: { loading: true } });
		});
		try {
			const json = await DSP.api.get('thread', { courseId: courseId, threadId: threadId });
			const thread = json.data;
			storePatch(function (state) {
				state.threads = Object.assign({}, state.threads, { [threadId]: { loading: false, thread: thread } });
				state.chatMessages = Object.assign({}, state.chatMessages, { [threadId]: (thread.messages || []).slice() });
			});
			return thread;
		} catch (error) {
			storePatch(function (state) {
				state.threads = Object.assign({}, state.threads, { [threadId]: { loading: false, error: error.message } });
			});
			return null;
		}
	},
	selectThread: async function selectThread(threadId) {
		const courseId = __storeState.ui.courseId;
		setChatUI({ threadId: threadId, pending: '', error: null });
		if (threadId && courseId) await storeActions.loadThread(courseId, threadId);
	},
	newChat: function newChat() {
		setChatUI({ threadId: null, pending: '', error: null, attachments: [], draft: '' });
	},
	clearChat: async function clearChat() {
		const courseId = __storeState.ui.courseId;
		const threadId = __storeState.ui.chat.threadId;
		if (!courseId) return;
		await DSP.api.post('chat/clear', { courseId: courseId, threadId: threadId || undefined });
		if (threadId) {
			storePatch(function (state) {
				const nextMessages = Object.assign({}, state.chatMessages);
				delete nextMessages[threadId];
				const nextThreads = Object.assign({}, state.threads);
				delete nextThreads[threadId];
				state.chatMessages = nextMessages;
				state.threads = nextThreads;
			});
		}
		await loadBootstrap(true);
		setChatUI({ threadId: null, pending: '', error: null });
	},
	setDraft: function setDraft(text) {
		setChatUI({ draft: text });
	},
	attachToChat: function attachToChat(payload) {
		const text = payload && payload.text ? String(payload.text).trim() : '';
		if (!text) return;
		const attachment = {
			id: DSP.uid('att'),
			type: 'selection',
			text: text,
			label: payload && payload.label ? payload.label : DSP.t('选中文字')
		};
		setChatUI({
			attachments: (__storeState.ui.chat.attachments || []).filter(function (item) {
				return item.type !== 'selection';
			}).concat([attachment]),
			focusBump: (__storeState.ui.chat.focusBump || 0) + 1,
			expandBump: (__storeState.ui.chat.expandBump || 0) + 1
		});
		pushToast(DSP.t('已附加到右侧对话'), 'success');
	},
	removeAttachment: function removeAttachment(id) {
		setChatUI({ attachments: (__storeState.ui.chat.attachments || []).filter(function (item) { return item.id !== id; }) });
	},
	focusChat: function focusChat() {
		setChatUI({ focusBump: (__storeState.ui.chat.focusBump || 0) + 1 });
	},
	askQuestion: function askQuestion(question) {
		if (!question) return;
		const state = __storeState;
		const courseId = state.ui.courseId;
		const setId = state.ui.setId;
		if (!courseId || !setId) return;
		const number = question.number || '';
		const attachment = {
			id: DSP.uid('att'),
			type: 'question',
			questionId: question.id,
			setId: setId,
			number: number,
			stem: question.stem || '',
			label: '第 ' + number + ' 题'
		};
		setChatUI({
			attachments: (state.ui.chat.attachments || []).filter(function (item) { return item.type !== 'question'; }).concat([attachment]),
			focusBump: (state.ui.chat.focusBump || 0) + 1,
			/* 收起状态下点「一键提问」时应先展开对话区 */
			expandBump: (state.ui.chat.expandBump || 0) + 1
		});
		const text = '请详细讲解第 ' + number + ' 题：解题思路、考点、易错点，并结合我的回答说明。';
		return storeActions.chatSend(text, { questionId: question.id, setId: setId, auto: true });
	},

	chatSend: async function chatSend(rawText, opts) {
		const options = opts || {};
		const state = __storeState;
		const courseId = state.ui.courseId;
		const text = String(rawText || '').trim();
		if (!courseId) {
			pushToast('请先选择课程', 'warn');
			return;
		}
		if (state.ui.chat.streaming) {
			pushToast('上一轮回答仍在生成，请稍候', 'warn');
			return;
		}
		if (!text) return;
		const attachments = state.ui.chat.attachments || [];
		const questionAttachment = attachments.find(function (item) { return item.type === 'question'; });
		const selectionAttachment = attachments.find(function (item) { return item.type === 'selection'; });
		const questionId = options.questionId || (questionAttachment ? questionAttachment.questionId : undefined);
		const setId = options.setId || (questionAttachment ? questionAttachment.setId : state.ui.setId);
		const selectedText = options.selectedText || (selectionAttachment ? selectionAttachment.text : '');
		const requestedThread = options.newThread ? null : state.ui.chat.threadId;
		const tempKey = requestedThread || '__new__';
		const userMessage = {
			role: 'user',
			text: text,
			at: Date.now(),
			context: { questionId: questionId || null, selectedText: selectedText || '', attachments: attachments.map(function (item) { return { type: item.type, label: item.label, text: item.text }; }) }
		};
		const priorMessages = (state.chatMessages[tempKey] || []).slice();
		const previousDraft = state.ui.chat.draft;
		const previousAttachments = attachments;
		storePatch(function (patchState) {
			patchState.chatMessages = Object.assign({}, patchState.chatMessages, { [tempKey]: priorMessages.concat([userMessage]) });
			patchState.ui = Object.assign({}, patchState.ui);
			patchState.ui.chat = Object.assign({}, patchState.ui.chat, {
				streaming: true,
				pending: '',
				error: null,
				draft: '',
				attachments: [],
				threadId: requestedThread || patchState.ui.chat.threadId
			});
		});
		let realThreadId = requestedThread || null;
		try {
			const response = await fetch(DSP.api.chatUrl, {
				method: 'POST',
				headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
				body: JSON.stringify({
					courseId: courseId,
					threadId: requestedThread || undefined,
					message: {
						text: text,
						questionId: questionId || undefined,
						setId: setId || undefined,
						selectedText: selectedText || undefined
					}
				})
			});
			await DSP.readSSE(response, {
				onEvent: function (event) {
					if (!event || typeof event.type !== 'string') return;
					if (event.type === 'meta' && event.threadId) {
						realThreadId = event.threadId;
						storePatch(function (patchState) {
							const messages = (patchState.chatMessages[tempKey] || []).slice();
							const next = Object.assign({}, patchState.chatMessages);
							delete next[tempKey];
							next[realThreadId] = messages;
							patchState.chatMessages = next;
							patchState.ui = Object.assign({}, patchState.ui);
							patchState.ui.chat = Object.assign({}, patchState.ui.chat, { threadId: realThreadId });
						});
					} else if (event.type === 'delta') {
						storePatch(function (patchState) {
							patchState.ui = Object.assign({}, patchState.ui);
							patchState.ui.chat = Object.assign({}, patchState.ui.chat, { pending: (patchState.ui.chat.pending || '') + (event.text || '') });
						});
					} else if (event.type === 'done') {
						const reply = event.message || { role: 'assistant', text: '', at: Date.now(), refs: [] };
						storePatch(function (patchState) {
							const key = realThreadId || tempKey;
							const messages = (patchState.chatMessages[key] || []).slice();
							messages.push(reply);
							patchState.chatMessages = Object.assign({}, patchState.chatMessages, { [key]: messages });
							patchState.ui = Object.assign({}, patchState.ui);
							patchState.ui.chat = Object.assign({}, patchState.ui.chat, { streaming: false, pending: '', threadId: realThreadId || patchState.ui.chat.threadId });
						});
						if (realThreadId) updateThreadSummary(courseId, realThreadId, { updatedAt: Date.now(), messageCount: ((__storeState.chatMessages[realThreadId] || []).length) });
					} else if (event.type === 'error') {
						throw new Error(event.error || '回答失败');
					}
				}
			});
			if (__storeState.ui.chat.streaming) setChatUI({ streaming: false, pending: '' });
		} catch (error) {
			const message = error && error.message ? error.message : String(error);
			const key = realThreadId || tempKey;
			storePatch(function (patchState) {
				const messages = (patchState.chatMessages[key] || []).slice();
				messages.push({ role: 'assistant', text: '（回答失败：' + message + '）', at: Date.now(), error: true });
				patchState.chatMessages = Object.assign({}, patchState.chatMessages, { [key]: messages });
				patchState.ui = Object.assign({}, patchState.ui);
				patchState.ui.chat = Object.assign({}, patchState.ui.chat, { streaming: false, pending: '', error: message, draft: previousDraft, attachments: previousAttachments });
			});
			pushToast(message, 'error');
		}
	}
};

DSP.store = {
	get: storeGet,
	subscribe: function subscribe(listener) {
		__storeListeners.add(listener);
		return function () {
			__storeListeners.delete(listener);
		};
	},
	actions: storeActions
};

DSP.useStore = function useStore(selector) {
	const bumpState = React.useState(0);
	const bump = bumpState[1];
	React.useEffect(function () {
		return DSP.store.subscribe(function () {
			bump(function (value) {
				return value + 1;
			});
		});
	}, []);
	const state = storeGet();
	return selector ? selector(state) : state;
};

DSP.useCourse = function useCourse() {
	return DSP.useStore(function (state) {
		const id = state.ui.courseId;
		return (state.data.courses || []).find(function (course) { return course.id === id; }) || null;
	});
};
