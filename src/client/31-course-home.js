/* 刷题模式 Client — 课程主页（course-ui-dev）。
 * 课程概览 + 题目集（上传/解析/练习/删除） + 课程文档（上传文件/文件夹/删除）。
 * 数据全部来自 DSP.store；上传与解析走 store.actions。
 */

const COURSE_HOME_QUESTION_ACCEPT = '.pdf,.docx,.doc,.pptx,.ppt,.png,.jpg,.jpeg,.webp,.txt,.md,.markdown';
const COURSE_HOME_DOC_ACCEPT = '.pdf,.docx,.pptx,.txt,.md,.markdown,.csv,.json,.html,.htm';
const COURSE_HOME_IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

/* 课程文档折叠状态：按课程持久化到 localStorage，默认收起。 */
const COURSE_HOME_DOCS_OPEN_PREFIX = 'practice-mode.docs-open.';

function courseHomeStorageGet(key) {
	try {
		if (typeof window === 'undefined' || !window.localStorage) return null;
		return window.localStorage.getItem(key);
	} catch (error) {
		return null;
	}
}

function courseHomeStorageSet(key, value) {
	try {
		if (typeof window === 'undefined' || !window.localStorage) return;
		window.localStorage.setItem(key, value);
	} catch (error) {
		/* 隐私模式/配额不足时忽略 */
	}
}

function courseHomeReadDocsOpen(courseId) {
	if (!courseId) return false;
	return courseHomeStorageGet(COURSE_HOME_DOCS_OPEN_PREFIX + courseId) === '1';
}

function courseHomeWriteDocsOpen(courseId, open) {
	if (!courseId) return;
	courseHomeStorageSet(COURSE_HOME_DOCS_OPEN_PREFIX + courseId, open ? '1' : '0');
}

function courseHomeErrorText(error) {
	if (!error) return DSP.t('操作失败');
	return error.message ? String(error.message) : String(error);
}

/* 仅当拖拽内容包含文件时才走上传逻辑，避免干扰文本拖拽（拖选文字等）默认行为。 */
function courseHomeIsFileDrag(event) {
	const dataTransfer = event && event.dataTransfer;
	if (!dataTransfer || !dataTransfer.types) return false;
	return Array.from(dataTransfer.types || []).indexOf('Files') >= 0;
}

const COURSE_HOME_DRAG_FILE_LIMIT = 300;

/* 拖拽 DataTransferItem → FileSystemEntry；不支持 webkitGetAsEntry 的浏览器返回空数组。 */
function courseHomeDropEntries(dataTransfer) {
	const entries = [];
	if (!dataTransfer || !dataTransfer.items || typeof dataTransfer.items.length !== 'number') return entries;
	for (let index = 0; index < dataTransfer.items.length; index += 1) {
		const item = dataTransfer.items[index];
		if (!item || item.kind !== 'file') continue;
		try {
			const entry = typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : null;
			if (entry) entries.push(entry);
		} catch (error) {
			/* 单个条目读取失败不影响其它条目 */
		}
	}
	return entries;
}

/* 递归读取一个 FileSystemEntry；state = { files: File[], truncated: boolean }。 */
function courseHomeReadEntry(entry, prefix, state) {
	return new Promise(function (resolve, reject) {
		if (!entry) {
			resolve();
			return;
		}
		if (state.files.length >= COURSE_HOME_DRAG_FILE_LIMIT) {
			state.truncated = true;
			resolve();
			return;
		}
		if (entry.isFile) {
			entry.file(
				function (file) {
					if (state.files.length >= COURSE_HOME_DRAG_FILE_LIMIT) {
						state.truncated = true;
						resolve();
						return;
					}
					try {
						/* store.upload* 会优先使用该字段作为上传相对路径。 */
						file.__dspRelativePath = prefix ? prefix + file.name : file.name;
					} catch (error) {
						/* File 只读时忽略，store 会回退 webkitRelativePath / name */
					}
					state.files.push(file);
					resolve();
				},
				function (error) {
					reject(error || new Error('读取文件失败'));
				}
			);
			return;
		}
		if (!entry.isDirectory) {
			resolve();
			return;
		}
		const reader = entry.createReader();
		const dirPrefix = prefix + (entry.name || '') + '/';
		function readNextBatch() {
			reader.readEntries(
				function (entries) {
					/* readEntries 每次返回一批，必须循环到返回空数组为止。 */
					if (!entries || entries.length === 0) {
						resolve();
						return;
					}
					let index = 0;
					function next() {
						if (state.files.length >= COURSE_HOME_DRAG_FILE_LIMIT) {
							state.truncated = true;
							resolve();
							return;
						}
						if (index >= entries.length) {
							readNextBatch();
							return;
						}
						const child = entries[index];
						index += 1;
						courseHomeReadEntry(child, dirPrefix, state).then(next, reject);
					}
					next();
				},
				function (error) {
					reject(error || new Error('读取文件夹失败'));
				}
			);
		}
		readNextBatch();
	});
}

/* 读取拖入的顶层 entries（文件/文件夹混合），返回 { files, truncated }。 */
function courseHomeReadDroppedEntries(entries) {
	return new Promise(function (resolve, reject) {
		const state = { files: [], truncated: false };
		let index = 0;
		function nextEntry() {
			if (index >= entries.length) {
				resolve(state);
				return;
			}
			const entry = entries[index];
			index += 1;
			courseHomeReadEntry(entry, '', state).then(nextEntry, reject);
		}
		nextEntry();
	});
}

/* 非文件夹环境兜底：直接使用 dataTransfer.files，并统一写 __dspRelativePath。 */
function courseHomeFilesFromDataTransfer(dataTransfer) {
	const files = [];
	const list = dataTransfer && dataTransfer.files ? dataTransfer.files : [];
	for (let index = 0; index < list.length; index += 1) {
		const file = list[index];
		if (!file) continue;
		try {
			file.__dspRelativePath = file.__dspRelativePath || file.webkitRelativePath || file.name;
		} catch (error) {
			/* ignore */
		}
		files.push(file);
	}
	return files;
}

/* 文档相对路径：优先 Host 的 relativePath；旧数据从 relPath 提取；最后回退 doc.name。 */
function courseHomeDocRelativePath(doc) {
	if (!doc) return '';
	if (typeof doc.relativePath === 'string' && doc.relativePath) return doc.relativePath;
	const relPath = typeof doc.relPath === 'string' ? doc.relPath : '';
	if (relPath) {
		const matched = /^courses\/[^/]+\/docs\/[^/]+\/(.*)$/.exec(relPath);
		if (matched && matched[1]) return matched[1];
	}
	return doc.name || '';
}

function courseHomeDocFileName(doc, relativePath) {
	const path = typeof relativePath === 'string' && relativePath ? relativePath : courseHomeDocRelativePath(doc);
	const slash = path.lastIndexOf('/');
	const name = slash >= 0 ? path.slice(slash + 1) : path;
	return name || (doc && doc.name) || DSP.t('未命名文档');
}

/* 按目录分组：分组头为目录路径（根目录为空串），组内按文件名排序。 */
function courseHomeDocGroups(docs) {
	const groups = [];
	const index = new Map();
	(docs || []).forEach(function (doc) {
		const relativePath = courseHomeDocRelativePath(doc);
		const slash = relativePath.lastIndexOf('/');
		const dir = slash >= 0 ? relativePath.slice(0, slash) : '';
		let group = index.get(dir);
		if (!group) {
			group = { path: dir, docs: [] };
			index.set(dir, group);
			groups.push(group);
		}
		group.docs.push({ doc: doc, fileName: courseHomeDocFileName(doc, relativePath) });
	});
	groups.sort(function (left, right) {
		if (left.path === right.path) return 0;
		if (left.path === '') return -1;
		if (right.path === '') return 1;
		return left.path.localeCompare(right.path);
	});
	groups.forEach(function (group) {
		group.docs.sort(function (left, right) {
			return left.fileName.localeCompare(right.fileName);
		});
	});
	return groups;
}

function courseHomeSetStatus(set) {
	const status = set && set.status;
	if (status === 'parsing') return { label: DSP.t('正在解析'), tone: 'brand' };
	if (status === 'failed') return { label: DSP.t('解析失败'), tone: 'error' };
	if (status === 'ready') {
		if (set.completedAt) return { label: DSP.t('已完成'), tone: 'success' };
		return { label: DSP.t('可练习'), tone: 'brand' };
	}
	return { label: DSP.t('待解析'), tone: 'warn' };
}

function courseHomeDocStatus(doc) {
	const status = doc && doc.status;
	if (status === 'ready') {
		const chars = Number(doc.chars) || 0;
		return {
			tone: 'success',
			text: chars > 0 ? DSP.t('已提取文本') + ' · ' + String(chars) + ' ' + DSP.t('字') : '已上传（Agent 可读）'
		};
	}
	if (status === 'empty') return { tone: 'warn', text: DSP.t('未提取到文字') };
	if (status === 'unsupported') return { tone: 'neutral', text: DSP.t('不支持该格式的文本抽取') };
	if (status === 'failed') {
		return { tone: 'error', text: DSP.t('抽取失败') + (doc.error ? '：' + String(doc.error) : '') };
	}
	return { tone: 'neutral', text: DSP.t('待处理') };
}

function courseHomeSetAccuracy(course, setId) {
	const records = (course && course.records ? course.records : []).filter(function (record) {
		return record && record.setId === setId;
	});
	return DSP.accuracyOf(DSP.latestRecords(records));
}

function CourseHomeChip(props) {
	return h(
		'span',
		{ className: 'dsp-chip' },
		props.icon ? h('span', { className: 'dsp-chip-icon' }, h(DSP.Icon, { name: props.icon, size: 13 })) : null,
		h('span', { className: 'dsp-chip-label' }, props.label),
		h('span', { className: 'dsp-chip-value' }, props.value)
	);
}

function CourseHomeSetRow(props) {
	const set = props.set;
	const course = props.course;
	const parse = props.parse;
	const status = courseHomeSetStatus(set);
	const parsingHere = Boolean(parse && parse.setId === set.id && parse.status === 'running');
	const parsing = parsingHere || set.status === 'parsing';
	const questionCount = Number(set.questionCount) || 0;
	const answeredCount = Number(set.answeredCount) || 0;
	const accuracy = courseHomeSetAccuracy(course, set.id);
	const aiAnswerMode = set.aiAnswerMode === 'off' || set.aiAnswerMode === 'regenerate' ? set.aiAnswerMode : 'auto';
	const answerFiles = (set.sourceFiles || []).filter(function (file) {
		return file && file.role === 'answers';
	});
	const answerFileNames = answerFiles
		.map(function (file) {
			return file.name || file.relPath || '';
		})
		.filter(Boolean)
		.join('、');
	const answerInputRef = React.useRef(null);
	const answerBusyState = React.useState(false);
	const answerBusy = answerBusyState[0];
	const setAnswerBusy = answerBusyState[1];
	const modeBusyState = React.useState(false);
	const modeBusy = modeBusyState[0];
	const setModeBusy = modeBusyState[1];
	const controlsDisabled = parsing || answerBusy || modeBusy;
	const aiModeOptions = [
		{ value: 'auto', label: DSP.t('自动补充缺失答案') },
		{ value: 'off', label: DSP.t('不生成 AI 答案') },
		{ value: 'regenerate', label: DSP.t('全部 AI 重新生成') }
	];

	function pickAnswerFiles() {
		if (controlsDisabled) return;
		if (answerInputRef.current) answerInputRef.current.click();
	}

	/* 补传答案：上传后立即重新解析（调用模型），失败 toast。 */
	function handleAnswerFiles(fileList) {
		if (!course || controlsDisabled) return;
		const files = Array.from(fileList || []);
		if (files.length === 0) return;
		const confirmed = window.confirm(DSP.t('上传后将重新解析本套题并调用模型，是否继续？'));
		if (!confirmed) return;
		setAnswerBusy(true);
		Promise.resolve(DSP.store.actions.uploadAnswerFiles(course.id, set.id, files))
			.then(function () {
				return DSP.store.actions.startParse(course.id, set.id);
			})
			.catch(function (failure) {
				DSP.store.actions.toast(courseHomeErrorText(failure), 'error');
			})
			.then(function () {
				setAnswerBusy(false);
			});
	}

	function changeAiAnswerMode(mode) {
		if (controlsDisabled || mode === aiAnswerMode) return;
		setModeBusy(true);
		Promise.resolve(DSP.store.actions.setAiAnswerMode(course.id, set.id, mode))
			.catch(function (failure) {
				DSP.store.actions.toast(courseHomeErrorText(failure), 'error');
			})
			.then(function () {
				setModeBusy(false);
			});
	}

	const actions = [];
	if (parsingHere) {
		actions.push(
			h(DSP.Btn, { key: 'parsing', variant: 'secondary', loading: true, disabled: true, className: 'dsp-btn-sm' }, DSP.t('正在解析'))
		);
	} else if (set.status === 'parsing') {
		/* 服务端仍标记解析中但没有本地 job（例如上次进程中断），允许重新解析。 */
		actions.push(
			h(
				DSP.Btn,
				{ key: 'reparse', variant: 'secondary', icon: 'refresh', className: 'dsp-btn-sm', onClick: props.onReparse },
				DSP.t('重新解析')
			)
		);
	} else if (set.status === 'failed') {
		actions.push(
			h(
				DSP.Btn,
				{ key: 'reparse', variant: 'primary', icon: 'refresh', className: 'dsp-btn-sm', onClick: props.onReparse },
				DSP.t('重新解析')
			)
		);
	} else if (set.status === 'draft') {
		actions.push(
			h(DSP.Btn, { key: 'parse', variant: 'primary', icon: 'sparkles', className: 'dsp-btn-sm', onClick: props.onStartParse }, DSP.t('开始解析'))
		);
	} else if (set.status === 'ready') {
		const label = set.completedAt ? DSP.t('查看结果') : answeredCount > 0 ? DSP.t('继续刷题') : DSP.t('开始刷题');
		actions.push(
			h(
				DSP.Btn,
				{ key: 'open', variant: 'primary', icon: set.completedAt ? 'eye' : 'play', className: 'dsp-btn-sm', onClick: props.onOpen },
				label
			)
		);
	}
	actions.push(
		h(
			DSP.Btn,
			{
				key: 'answers',
				variant: 'secondary',
				icon: 'upload',
				className: 'dsp-btn-sm',
				loading: answerBusy,
				disabled: controlsDisabled,
				onClick: pickAnswerFiles
			},
			answerFiles.length > 0 ? '重新提交答案' : DSP.t('补传答案')
		)
	);
	if (set.status === 'ready') {
		actions.push(
			h(
				DSP.Btn,
				{ key: 'reparse', variant: 'secondary', icon: 'refresh', className: 'dsp-btn-sm', onClick: props.onReparse },
				DSP.t('重新解析')
			)
		);
	}
	actions.push(
		h(DSP.IconBtn, { key: 'delete', icon: 'trash', danger: true, label: DSP.t('删除'), onClick: props.onDelete })
	);

	return h(
		'div',
		{ className: 'dsp-set-row' },
		h('input', {
			ref: answerInputRef,
			className: 'dsp-file-input',
			type: 'file',
			multiple: true,
			accept: COURSE_HOME_QUESTION_ACCEPT,
			tabIndex: -1,
			'aria-hidden': 'true',
			disabled: controlsDisabled,
			onChange: function (event) {
				const files = event.target.files;
				event.target.value = '';
				handleAnswerFiles(files);
			}
		}),
		h(
			'div',
			{ className: 'dsp-set-main' },
			h(
				'div',
				{ className: 'dsp-row dsp-gap-8 dsp-set-title-row' },
				h('span', { className: 'dsp-set-title dsp-truncate', title: set.title || '' }, set.title || DSP.t('未命名套题')),
				h(DSP.Tag, { tone: status.tone }, status.label),
				answerFiles.length > 0
					? h(
							'span',
							{ className: 'dsp-set-answer-tag', title: answerFileNames ? DSP.t('答案文件') + '：' + answerFileNames : DSP.t('答案文件') },
							h(DSP.Tag, { tone: 'brand' }, DSP.t('含答案文件'))
						)
					: null
			),
			h(
				'div',
				{ className: 'dsp-set-meta dsp-small dsp-muted' },
				h('span', null, DSP.t('题数') + ' ' + String(questionCount)),
				h('span', { className: 'dsp-set-meta-sep' }, '·'),
				h('span', null, DSP.t('已答') + ' ' + String(answeredCount) + '/' + String(questionCount)),
				h('span', { className: 'dsp-set-meta-sep' }, '·'),
				h('span', null, DSP.t('正确率') + ' ' + (accuracy === null ? '—' : DSP.fmtPct(accuracy))),
				h('span', { className: 'dsp-set-meta-sep' }, '·'),
				h('span', null, DSP.fmtShortDate(set.updatedAt || set.createdAt))
			),
			h(
				'div',
				{ className: 'dsp-set-ai-row' },
				h('span', { className: 'dsp-set-ai-label' }, DSP.t('AI 答案解析')),
				h(
					'div',
					{ className: 'dsp-set-ai-control', role: 'group', 'aria-label': DSP.t('AI 答案解析') },
					aiModeOptions.map(function (option) {
						const active = option.value === aiAnswerMode;
						return h(
							'button',
							{
								key: option.value,
								type: 'button',
								className: 'dsp-set-ai-option' + (active ? ' dsp-set-ai-option-active' : ''),
								'aria-pressed': active,
								disabled: controlsDisabled,
								onClick: function () { changeAiAnswerMode(option.value); }
							},
							option.label
						);
					})
				),
				h('span', { className: 'dsp-set-ai-hint' }, DSP.t('重新解析后生效'))
			),
			set.status === 'failed' && set.error ? h('div', { className: 'dsp-inline-error' }, String(set.error)) : null,
			parsingHere
				? h(
						'div',
						{ className: 'dsp-set-progress' },
						h(DSP.ProgressBar, { value: courseUiProgressFraction(parse.progress) }),
						h('span', { className: 'dsp-small dsp-muted' }, parse.message || DSP.t('正在解析'))
					)
				: null
		),
		h('div', { className: 'dsp-set-actions' }, actions)
	);
}

function CourseHomeDocRow(props) {
	const doc = props.doc;
	const relativePath = courseHomeDocRelativePath(doc);
	const fileName = props.fileName || courseHomeDocFileName(doc, relativePath);
	const ext = String(doc.ext || '').toLowerCase();
	const isImage = COURSE_HOME_IMAGE_EXTS.indexOf(ext) >= 0;
	const status = courseHomeDocStatus(doc);
	return h(
		'div',
		{ className: 'dsp-doc-row' },
		h('span', { className: 'dsp-doc-icon' }, h(DSP.Icon, { name: isImage ? 'image' : 'doc', size: 16 })),
		h(
			'div',
			{ className: 'dsp-doc-main' },
			h(
				'div',
				{ className: 'dsp-row dsp-gap-6 dsp-doc-title-row' },
				h('span', { className: 'dsp-doc-name dsp-truncate', title: relativePath || doc.name || '' }, fileName),
				ext ? h(DSP.Tag, { tone: 'neutral' }, ext) : null
			),
			h(
				'div',
				{ className: 'dsp-doc-meta dsp-small dsp-muted' },
				h('span', null, DSP.fmtBytes(doc.size)),
				h('span', { className: 'dsp-set-meta-sep' }, '·'),
				h('span', { className: 'dsp-doc-status dsp-doc-status-' + status.tone }, status.text)
			)
		),
		h(DSP.IconBtn, { icon: 'trash', danger: true, label: DSP.t('删除'), onClick: props.onDelete })
	);
}

/* 上传弹窗文件去重/展示 helper：同一文件（路径+大小+修改时间）只保留一次。 */
function courseHomeFileKey(file) {
	if (!file) return '';
	const path = file.__dspRelativePath || file.webkitRelativePath || file.name || '';
	return path + '|' + String(Number(file.size) || 0) + '|' + String(Number(file.lastModified) || 0);
}

function courseHomeFileLabel(file) {
	if (!file) return '';
	return file.__dspRelativePath || file.webkitRelativePath || file.name || '';
}

function courseHomeMergeFiles(current, incoming) {
	const merged = (current || []).slice();
	const seen = new Set();
	merged.forEach(function (file) {
		seen.add(courseHomeFileKey(file));
	});
	(incoming || []).forEach(function (file) {
		const key = courseHomeFileKey(file);
		if (seen.has(key)) return;
		seen.add(key);
		merged.push(file);
	});
	return merged;
}

function CourseHomeUploadFileRow(props) {
	const file = props.file;
	const name = file.name || DSP.t('未命名文件');
	const path = props.path || '';
	return h(
		'div',
		{ className: 'dsp-upload-file-row' },
		h('span', { className: 'dsp-upload-file-icon' }, h(DSP.Icon, { name: 'doc', size: 14 })),
		h(
			'div',
			{ className: 'dsp-upload-file-main' },
			h('span', { className: 'dsp-upload-file-name dsp-truncate', title: path || name }, name),
			path && path !== name ? h('span', { className: 'dsp-upload-file-path dsp-truncate', title: path }, path) : null
		),
		h('span', { className: 'dsp-upload-file-size' }, DSP.fmtBytes(file.size)),
		h(DSP.IconBtn, { icon: 'x', label: DSP.t('移除'), disabled: Boolean(props.disabled), onClick: props.onRemove })
	);
}

/* 「上传题目」弹窗：已选试卷文件可增删，可再挂答案文件；确认后一次上传并开始解析。 */
function CourseHomeUploadModal(props) {
	const course = props.course;
	const questionState = React.useState(function () {
		return Array.isArray(props.initialQuestionFiles) ? props.initialQuestionFiles.slice() : [];
	});
	const questionFiles = questionState[0];
	const setQuestionFiles = questionState[1];
	const answerState = React.useState([]);
	const answerFiles = answerState[0];
	const setAnswerFiles = answerState[1];
	const uploadState = React.useState(false);
	const uploading = uploadState[0];
	const setUploading = uploadState[1];
	const errorState = React.useState(null);
	const error = errorState[0];
	const setError = errorState[1];
	const dragState = React.useState(null); // 'question' | 'answer' | null
	const dragTarget = dragState[0];
	const setDragTarget = dragState[1];
	const readState = React.useState(null); // 正在读取文件夹的区域
	const readingTarget = readState[0];
	const setReadingTarget = readState[1];
	const questionInputRef = React.useRef(null);
	const answerInputRef = React.useRef(null);

	function toastSkipped(skipped) {
		const list = skipped || [];
		if (list.length === 0) return;
		DSP.store.actions.toast(DSP.t('已跳过') + ' ' + String(list.length) + ' ' + DSP.t('个不支持的文件'), 'warn');
	}

	function addQuestionFiles(fileList) {
		const result = DSP.store.actions.filterFiles(fileList, 'question');
		toastSkipped(result.skipped);
		if (result.accepted.length === 0) return;
		setQuestionFiles(function (current) {
			return courseHomeMergeFiles(current, result.accepted);
		});
	}

	function addAnswerFiles(fileList) {
		const result = DSP.store.actions.filterFiles(fileList, 'question');
		toastSkipped(result.skipped);
		if (result.accepted.length === 0) return;
		setAnswerFiles(function (current) {
			return courseHomeMergeFiles(current, result.accepted);
		});
	}

	function removeQuestionFile(index) {
		setQuestionFiles(function (current) {
			return current.filter(function (file, position) {
				return position !== index;
			});
		});
	}

	function removeAnswerFile(index) {
		setAnswerFiles(function (current) {
			return current.filter(function (file, position) {
				return position !== index;
			});
		});
	}

	function pickQuestionFiles() {
		if (uploading) return;
		if (questionInputRef.current) questionInputRef.current.click();
	}

	function pickAnswerFiles() {
		if (uploading) return;
		if (answerInputRef.current) answerInputRef.current.click();
	}

	function onInputChange(addFiles) {
		return function (event) {
			const files = event.target.files;
			event.target.value = '';
			addFiles(files);
		};
	}

	function addFilesToZone(target, fileList) {
		if (target === 'question') addQuestionFiles(fileList);
		else addAnswerFiles(fileList);
	}

	function onZoneDragOver(target, event) {
		if (!courseHomeIsFileDrag(event) || uploading) return;
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
		setDragTarget(target);
	}

	function onZoneDragLeave(target, event) {
		if (!courseHomeIsFileDrag(event)) return;
		event.preventDefault();
		const related = event.relatedTarget;
		if (related && event.currentTarget && event.currentTarget.contains(related)) return;
		setDragTarget(function (current) {
			return current === target ? null : current;
		});
	}

	function onZoneDrop(target, event) {
		if (!courseHomeIsFileDrag(event)) return;
		event.preventDefault();
		setDragTarget(null);
		if (uploading || readingTarget) return;
		const dataTransfer = event.dataTransfer;
		if (!dataTransfer) return;
		const entries = courseHomeDropEntries(dataTransfer);
		const hasDirectory = entries.some(function (entry) {
			return Boolean(entry && entry.isDirectory);
		});
		if (!hasDirectory) {
			addFilesToZone(target, courseHomeFilesFromDataTransfer(dataTransfer));
			return;
		}
		setReadingTarget(target);
		DSP.store.actions.toast(DSP.t('正在读取文件夹…'), 'info');
		courseHomeReadDroppedEntries(entries)
			.then(function (result) {
				setReadingTarget(null);
				if (result.truncated) {
					DSP.store.actions.toast(DSP.t('拖入的文件超过 300 个，已保留前 300 个'), 'warn');
				}
				if (result.files.length === 0) return;
				addFilesToZone(target, result.files);
			})
			.catch(function (failure) {
				setReadingTarget(null);
				DSP.store.actions.toast(courseHomeErrorText(failure), 'error');
			});
	}

	function submit() {
		if (uploading) return;
		if (questionFiles.length === 0) {
			const message = DSP.t('请至少选择一个试卷文件');
			setError(message);
			DSP.store.actions.toast(message, 'warn');
			return;
		}
		setError(null);
		setUploading(true);
		Promise.resolve(DSP.store.actions.uploadExamSet(course.id, questionFiles, answerFiles))
			.then(function () {
				if (typeof props.onClose === 'function') props.onClose();
			})
			.catch(function (failure) {
				const message = courseHomeErrorText(failure);
				setUploading(false);
				setError(message);
				DSP.store.actions.toast(message, 'error');
			});
	}

	function close() {
		if (uploading) return;
		if (typeof props.onClose === 'function') props.onClose();
	}

	function dropZone(target, emptyText, fileList, removeFile) {
		return h(
			'div',
			{
				className: 'dsp-upload-drop' + (dragTarget === target ? ' dsp-drop-active' : ''),
				onDragOver: function (event) { onZoneDragOver(target, event); },
				onDragLeave: function (event) { onZoneDragLeave(target, event); },
				onDrop: function (event) { onZoneDrop(target, event); }
			},
			dragTarget === target
				? h(
						'div',
						{ className: 'dsp-drop-hint' },
						h(DSP.Icon, { name: 'upload', size: 16 }),
						h('span', null, target === 'question' ? DSP.t('松开以上传试卷文件') : DSP.t('松开以上传答案文件'))
					)
				: null,
			fileList.length === 0
				? h('div', { className: 'dsp-upload-empty' }, emptyText)
				: h(
						'div',
						{ className: 'dsp-upload-file-list' },
						fileList.map(function (file, index) {
							return h(CourseHomeUploadFileRow, {
								key: courseHomeFileKey(file) + '-' + index,
								file: file,
								path: courseHomeFileLabel(file),
								disabled: uploading,
								onRemove: function () { removeFile(index); }
							});
						})
					),
			readingTarget === target
				? h(
						'div',
						{ className: 'dsp-upload-status dsp-small dsp-muted' },
						h(DSP.Spinner, { size: 14 }),
						h('span', null, DSP.t('正在读取文件夹…'))
					)
				: null
		);
	}

	return h(
		DSP.Modal,
		{
			open: true,
			title: DSP.t('上传题目'),
			onClose: close,
			width: '680px',
			footer: [
				h(DSP.Btn, { key: 'cancel', variant: 'ghost', disabled: uploading, onClick: close }, DSP.t('取消')),
				h(
					DSP.Btn,
					{
						key: 'upload',
						variant: 'primary',
						icon: 'upload',
						loading: uploading,
						disabled: uploading || Boolean(readingTarget),
						onClick: submit
					},
					DSP.t('上传并开始解析')
				)
			]
		},
		h(
			'div',
			{ className: 'dsp-upload-modal' },
			h(
				'div',
				{ className: 'dsp-upload-group' },
				h(
					'div',
					{ className: 'dsp-upload-group-head' },
					h('span', { className: 'dsp-upload-group-title' }, DSP.t('试卷文件')),
					h(
						DSP.Btn,
						{ variant: 'secondary', icon: 'plus', className: 'dsp-btn-sm', disabled: uploading, onClick: pickQuestionFiles },
						DSP.t('添加文件')
					)
				),
				dropZone('question', DSP.t('选择或拖入试卷文件'), questionFiles, removeQuestionFile)
			),
			h(
				'div',
				{ className: 'dsp-upload-group' },
				h(
					'div',
					{ className: 'dsp-upload-group-head' },
					h(
						'span',
						{ className: 'dsp-upload-group-title' },
						DSP.t('答案文件'),
						h('span', { className: 'dsp-upload-optional' }, DSP.t('可选'))
					),
					h(
						DSP.Btn,
						{ variant: 'secondary', icon: 'plus', className: 'dsp-btn-sm', disabled: uploading, onClick: pickAnswerFiles },
						DSP.t('添加文件')
					)
				),
				dropZone('answer', DSP.t('答案文件可选，留空将按 AI 答案解析设置生成'), answerFiles, removeAnswerFile)
			),
			error ? h('div', { className: 'dsp-inline-error', role: 'alert' }, error) : null,
			h('input', {
				ref: questionInputRef,
				className: 'dsp-file-input',
				type: 'file',
				multiple: true,
				accept: COURSE_HOME_QUESTION_ACCEPT,
				tabIndex: -1,
				'aria-hidden': 'true',
				onChange: onInputChange(addQuestionFiles)
			}),
			h('input', {
				ref: answerInputRef,
				className: 'dsp-file-input',
				type: 'file',
				multiple: true,
				accept: COURSE_HOME_QUESTION_ACCEPT,
				tabIndex: -1,
				'aria-hidden': 'true',
				onChange: onInputChange(addAnswerFiles)
			})
		)
	);
}

function CourseHomeView() {
	const storeState = DSP.useStore(function (state) {
		const courses = state.data.courses || [];
		return {
			course: courses.find(function (item) { return item.id === state.ui.courseId; }) || null,
			parse: state.ui.parse,
			loading: state.loading
		};
	});
	const course = storeState.course;
	const parse = storeState.parse;
	const createState = React.useState(false);
	const creating = createState[0];
	const setCreating = createState[1];
	const editState = React.useState(false);
	const editing = editState[0];
	const setEditing = editState[1];
	const uploadModalState = React.useState(null); // { key, files } 打开「上传题目」弹窗
	const uploadModal = uploadModalState[0];
	const setUploadModal = uploadModalState[1];
	const docsUploadState = React.useState(false);
	const docsUploading = docsUploadState[0];
	const setDocsUploading = docsUploadState[1];
	const docsErrorState = React.useState(null);
	const docsError = docsErrorState[0];
	const setDocsError = docsErrorState[1];
	const dragState = React.useState(null); // 'questions' | 'docs' | null
	const dragTarget = dragState[0];
	const setDragTarget = dragState[1];
	const dragReadState = React.useState(null); // 正在读取拖入文件夹的区块
	const dragReadingTarget = dragReadState[0];
	const setDragReadingTarget = dragReadState[1];
	const docsOpenState = React.useState(function () {
		return courseHomeReadDocsOpen(course ? course.id : null);
	});
	const docsOpen = docsOpenState[0];
	const setDocsOpen = docsOpenState[1];
	const questionInputRef = React.useRef(null);
	const docInputRef = React.useRef(null);
	const folderInputRef = React.useRef(null);
	const courseId = course ? course.id : null;

	React.useEffect(function () {
		setDocsError(null);
		setDragTarget(null);
		setDragReadingTarget(null);
		setDocsOpen(courseHomeReadDocsOpen(courseId));
		setUploadModal(null);
	}, [courseId]);

	function toastError(message) {
		DSP.store.actions.toast(message, 'error');
	}

	/* 上传题目：先打开确认弹窗（可同时选答案文件），确认后才上传并解析。 */
	function openUploadModal(fileList) {
		if (!course) return;
		const files = Array.from(fileList || []);
		if (files.length === 0) return;
		const result = DSP.store.actions.filterFiles(files, 'question');
		if (result.skipped.length > 0) {
			DSP.store.actions.toast(
				DSP.t('已跳过') + ' ' + String(result.skipped.length) + ' ' + DSP.t('个不支持的文件'),
				'warn'
			);
		}
		if (result.accepted.length === 0) {
			DSP.store.actions.toast(DSP.t('没有可上传的题目文件'), 'warn');
			return;
		}
		setUploadModal({ key: 'upload-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6), files: result.accepted });
	}

	function handleDocFiles(fileList) {
		if (!course || docsUploading) return;
		const files = Array.from(fileList || []);
		if (files.length === 0) return;
		setDocsError(null);
		setDocsUploading(true);
		DSP.store.actions.toast(DSP.t('正在上传课程文档…'), 'info');
		Promise.resolve(DSP.store.actions.uploadDocs(course.id, files))
			.catch(function (failure) {
				const message = courseHomeErrorText(failure);
				setDocsError(message);
				toastError(message);
				/* 逐个上传时可能已成功部分文件，失败后重新同步 bootstrap。 */
				DSP.store.actions.reload().catch(function () {});
			})
			.then(function () {
				setDocsUploading(false);
			});
	}

	function onFileInputChange(handler) {
		return function (event) {
			const files = event.target.files;
			handler(files);
			event.target.value = '';
		};
	}

	function openPractice(set) {
		if (!course) return;
		DSP.store.actions.openPractice(course.id, set.id);
	}

	function startParse(set) {
		if (!course) return;
		Promise.resolve(DSP.store.actions.startParse(course.id, set.id)).catch(function (failure) {
			toastError(courseHomeErrorText(failure));
		});
	}

	/* 重新解析（应用答案文件 / AI 答案解析模式）：二次确认后调用 startParse。 */
	function reparseSet(set) {
		if (!course) return;
		const confirmed = window.confirm(DSP.t('将重新调用模型解析本套题，是否继续？'));
		if (!confirmed) return;
		startParse(set);
	}

	function removeSet(set) {
		if (!course) return;
		const label = set.title || DSP.t('未命名套题');
		const confirmed = window.confirm(DSP.t('确定删除') + '「' + label + '」' + DSP.t('吗？'));
		if (!confirmed) return;
		Promise.resolve(DSP.store.actions.deleteSet(course.id, set.id)).catch(function (failure) {
			toastError(courseHomeErrorText(failure));
		});
	}

	function removeDoc(doc) {
		if (!course) return;
		const label = courseHomeDocRelativePath(doc) || doc.name || DSP.t('未命名文档');
		const confirmed = window.confirm(DSP.t('确定删除') + '「' + label + '」' + DSP.t('吗？'));
		if (!confirmed) return;
		Promise.resolve(DSP.store.actions.deleteDoc(course.id, doc.id)).catch(function (failure) {
			toastError(courseHomeErrorText(failure));
		});
	}

	/* 拖拽：题目集/课程文档两个区块共用一套处理（高亮 + 松开提示 + drop 上传）。 */
	const parseRunning = Boolean(parse && parse.status === 'running');
	const questionsDragDisabled = parseRunning;
	const docsDragDisabled = docsUploading;

	function toggleDocsOpen() {
		const next = !docsOpen;
		setDocsOpen(next);
		if (course) courseHomeWriteDocsOpen(course.id, next);
	}

	function openDocsSection() {
		if (docsOpen) return;
		setDocsOpen(true);
		if (course) courseHomeWriteDocsOpen(course.id, true);
	}

	function isDragDisabled(target) {
		if (dragReadingTarget) return true;
		return target === 'questions' ? questionsDragDisabled : docsDragDisabled;
	}

	function onSectionDragOver(target, event) {
		if (!courseHomeIsFileDrag(event)) return;
		event.preventDefault();
		if (!event.dataTransfer) return;
		event.dataTransfer.dropEffect = 'copy';
		if (isDragDisabled(target)) {
			setDragTarget(function (current) {
				return current === target ? null : current;
			});
			return;
		}
		if (target === 'docs') openDocsSection();
		setDragTarget(target);
	}

	function onSectionDragLeave(target, event) {
		if (!courseHomeIsFileDrag(event)) return;
		event.preventDefault();
		const related = event.relatedTarget;
		if (related && event.currentTarget && event.currentTarget.contains(related)) return;
		setDragTarget(function (current) {
			return current === target ? null : current;
		});
	}

	function onSectionDrop(target, event) {
		if (!courseHomeIsFileDrag(event)) return;
		event.preventDefault();
		setDragTarget(null);
		if (isDragDisabled(target)) return;
		if (target === 'docs') openDocsSection();
		const dataTransfer = event.dataTransfer;
		if (!dataTransfer) return;
		const entries = courseHomeDropEntries(dataTransfer);
		const hasDirectory = entries.some(function (entry) {
			return Boolean(entry && entry.isDirectory);
		});
		if (!hasDirectory) {
			/* 普通文件拖入（或浏览器不支持 webkitGetAsEntry）直接走 dataTransfer.files。 */
			const files = courseHomeFilesFromDataTransfer(dataTransfer);
			if (files.length === 0) return;
			if (target === 'questions') openUploadModal(files);
			else handleDocFiles(files);
			return;
		}
		/* 拖入文件夹：先提示读取中，递归收集 File 后再走 store.actions 上传。 */
		setDragReadingTarget(target);
		DSP.store.actions.toast(DSP.t('正在读取文件夹…'), 'info');
		courseHomeReadDroppedEntries(entries)
			.then(function (result) {
				setDragReadingTarget(null);
				if (result.truncated) {
					DSP.store.actions.toast(DSP.t('拖入的文件超过 300 个，已保留前 300 个'), 'warn');
				}
				if (result.files.length === 0) {
					DSP.store.actions.toast(DSP.t('拖入的文件夹中没有可上传的文件'), 'warn');
					return;
				}
				if (target === 'questions') openUploadModal(result.files);
				else handleDocFiles(result.files);
			})
			.catch(function (failure) {
				setDragReadingTarget(null);
				DSP.store.actions.toast(courseHomeErrorText(failure), 'error');
			});
	}

	/* 根节点兜底：阻止浏览器把拖入文件直接打开。 */
	function onRootDragOver(event) {
		if (!courseHomeIsFileDrag(event)) return;
		event.preventDefault();
	}

	function onRootDrop(event) {
		if (!courseHomeIsFileDrag(event)) return;
		event.preventDefault();
		setDragTarget(null);
	}

	const questionInputs = h(
		React.Fragment,
		null,
		h('input', {
			key: 'question-input',
			ref: questionInputRef,
			className: 'dsp-file-input',
			type: 'file',
			multiple: true,
			accept: COURSE_HOME_QUESTION_ACCEPT,
			tabIndex: -1,
			'aria-hidden': 'true',
			onChange: onFileInputChange(openUploadModal)
		}),
		h('input', {
			key: 'doc-input',
			ref: docInputRef,
			className: 'dsp-file-input',
			type: 'file',
			multiple: true,
			accept: COURSE_HOME_DOC_ACCEPT,
			tabIndex: -1,
			'aria-hidden': 'true',
			onChange: onFileInputChange(handleDocFiles)
		}),
		h('input', {
			key: 'folder-input',
			ref: folderInputRef,
			className: 'dsp-file-input',
			type: 'file',
			multiple: true,
			webkitdirectory: 'true',
			tabIndex: -1,
			'aria-hidden': 'true',
			onChange: onFileInputChange(handleDocFiles)
		})
	);

	if (!course) {
		return h(
			'div',
			{ className: 'dsp-page dsp-course-page', onDragOver: onRootDragOver, onDrop: onRootDrop },
			h(
				'div',
				{ className: 'dsp-page-head' },
				h(
					'div',
					{ className: 'dsp-col dsp-gap-6' },
					h('h1', { className: 'dsp-page-title' }, DSP.t('课程主页'))
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
								icon: 'book',
								title: DSP.t('暂无课程'),
								action: h(
									DSP.Btn,
									{ variant: 'primary', icon: 'plus', onClick: function () { setCreating(true); } },
									DSP.t('新建课程')
								)
							},
							DSP.t('新建课程即可上传课程文档与题目文件')
						)
					)
				)
			),
			creating ? h(DSP.CourseCreateModal, { onClose: function () { setCreating(false); } }) : null
		);
	}

	const sets = (course.sets || []).slice().sort(function (left, right) {
		return (Number(right.createdAt) || 0) - (Number(left.createdAt) || 0);
	});
	const docs = (course.docs || []).slice().sort(function (left, right) {
		return (Number(right.addedAt) || 0) - (Number(left.addedAt) || 0);
	});
	const docGroups = courseHomeDocGroups(docs);
	const retrievableDocs = docs.filter(function (doc) {
		return doc && doc.status === 'ready' && (Number(doc.chars) || 0) > 0;
	}).length;
	const latest = DSP.latestRecords(course.records || []);
	const accuracy = DSP.accuracyOf(latest);
	const completedCount = sets.filter(function (set) { return Boolean(set.completedAt); }).length;
	const uploadingDocs = docsUploading;

	return h(
		'div',
		{ className: 'dsp-page dsp-course-page', onDragOver: onRootDragOver, onDrop: onRootDrop },
		questionInputs,
		h(
			'div',
			{ className: 'dsp-page-head dsp-course-head' },
			h(
				'div',
				{ className: 'dsp-col dsp-gap-6 dsp-course-head-main' },
				h(
					'div',
					{ className: 'dsp-row dsp-gap-8 dsp-course-title-row' },
					h(
						'h1',
						{ className: 'dsp-page-title' },
						h('span', { className: 'dsp-truncate', title: course.name || '' }, course.name || DSP.t('未命名课程')),
						h(DSP.IconBtn, {
							icon: 'edit',
							label: DSP.t('编辑课程'),
							title: DSP.t('编辑课程'),
							onClick: function () { setEditing(true); }
						})
					)
				),
				h('p', { className: 'dsp-page-sub dsp-course-desc' }, course.description || DSP.t('暂无课程简介')),
				h(
					'div',
					{ className: 'dsp-chips' },
					h(CourseHomeChip, { icon: 'layers', label: DSP.t('题目集'), value: String(sets.length) }),
					h(CourseHomeChip, { icon: 'checkCircle', label: DSP.t('已完成套数'), value: String(completedCount) }),
					h(CourseHomeChip, { icon: 'target', label: DSP.t('总正确率'), value: accuracy === null ? '—' : DSP.fmtPct(accuracy) })
				)
			),
			h(
				'div',
				{ className: 'dsp-course-head-actions' },
				h(
					DSP.Btn,
					{
						variant: 'secondary',
						icon: 'layers',
						onClick: function () { DSP.store.actions.openGlobalDash(); }
					},
					DSP.t('所有课程')
				),
				h(
					DSP.Btn,
					{
						variant: 'secondary',
						icon: 'chart',
						onClick: function () { DSP.store.actions.openCourseDash(course.id); }
					},
					DSP.t('课程看板')
				),
				h(
					DSP.Btn,
					{
						variant: 'primary',
						icon: 'upload',
						onClick: function () { if (questionInputRef.current) questionInputRef.current.click(); }
					},
					DSP.t('上传题目文件')
				)
			)
		),
		h(
			'div',
			{ className: 'dsp-scroll' },
			h(
				'div',
				{ className: 'dsp-page-body' },
				h(
					'section',
					{
						className: 'dsp-card dsp-set-section' + (dragTarget === 'questions' ? ' dsp-drop-active' : ''),
						onDragOver: function (event) { onSectionDragOver('questions', event); },
						onDragLeave: function (event) { onSectionDragLeave('questions', event); },
						onDrop: function (event) { onSectionDrop('questions', event); }
					},
					h(
						'div',
						{ className: 'dsp-section-head' },
						h(
							'div',
							{ className: 'dsp-row dsp-gap-8' },
							h('span', { className: 'dsp-section-icon' }, h(DSP.Icon, { name: 'list', size: 16 })),
							h('h2', { className: 'dsp-section-title' }, DSP.t('题目集')),
							sets.length > 0 ? h('span', { className: 'dsp-count-badge' }, String(sets.length)) : null
						),
						h(
							DSP.Btn,
							{
								variant: 'secondary',
								icon: 'upload',
								className: 'dsp-btn-sm',
								onClick: function () { if (questionInputRef.current) questionInputRef.current.click(); }
							},
							DSP.t('上传题目文件')
						)
					),
					dragTarget === 'questions'
						? h(
								'div',
								{ className: 'dsp-drop-hint' },
								h(DSP.Icon, { name: 'upload', size: 16 }),
								h('span', null, DSP.t('松开以上传题目文件'))
							)
						: null,
					dragReadingTarget === 'questions'
						? h(
								'div',
								{ className: 'dsp-upload-status dsp-small dsp-muted' },
								h(DSP.Spinner, { size: 14 }),
								h('span', null, DSP.t('正在读取文件夹…'))
							)
						: null,
					sets.length === 0
						? h(
								DSP.Empty,
								{
									icon: 'list',
									title: DSP.t('上传一套题目文件开始'),
									action: h(
										DSP.Btn,
										{
											variant: 'primary',
											icon: 'upload',
											onClick: function () { if (questionInputRef.current) questionInputRef.current.click(); }
										},
										DSP.t('上传题目文件')
									)
								},
								DSP.t('上传后会自动解析为结构化题目，随后即可开始练习。')
							)
						: h(
								'div',
								{ className: 'dsp-set-list' },
								sets.map(function (set) {
									return h(CourseHomeSetRow, {
										key: set.id,
										course: course,
										set: set,
										parse: parse,
										onOpen: function () { openPractice(set); },
										onStartParse: function () { startParse(set); },
										onReparse: function () { reparseSet(set); },
										onDelete: function () { removeSet(set); }
									});
								})
							)
				),
				h(
					'section',
					{
						className: 'dsp-card dsp-doc-section' + (dragTarget === 'docs' ? ' dsp-drop-active' : ''),
						onDragOver: function (event) { onSectionDragOver('docs', event); },
						onDragLeave: function (event) { onSectionDragLeave('docs', event); },
						onDrop: function (event) { onSectionDrop('docs', event); }
					},
					h(
						'button',
						{
							type: 'button',
							className: 'dsp-doc-section-head' + (docsOpen ? ' dsp-doc-section-head-open' : ''),
							'aria-expanded': docsOpen,
							title: docsOpen ? DSP.t('收起课程文档') : DSP.t('展开课程文档'),
							onClick: toggleDocsOpen
						},
						h('span', { className: 'dsp-section-icon' }, h(DSP.Icon, { name: 'folder', size: 16 })),
						h('span', { className: 'dsp-section-title' }, DSP.t('课程文档')),
						docs.length > 0 ? h('span', { className: 'dsp-count-badge' }, String(docs.length)) : null,
						h('span', { className: 'dsp-doc-summary' }, DSP.t('可检索') + ' ' + String(retrievableDocs)),
						h('span', { className: 'dsp-doc-chevron' }, h(DSP.Icon, { name: 'chevronDown', size: 16 }))
					),
					dragTarget === 'docs'
						? h(
							'div',
							{ className: 'dsp-drop-hint' },
							h(DSP.Icon, { name: 'upload', size: 16 }),
							h('span', null, DSP.t('松开以上传课程文档'))
						)
						: null,
					docsError ? h('div', { className: 'dsp-inline-error', role: 'alert' }, docsError) : null,
					uploadingDocs
						? h(
							'div',
							{ className: 'dsp-upload-status dsp-small dsp-muted' },
							h(DSP.Spinner, { size: 14 }),
							h('span', null, DSP.t('上传中') + ' · ' + DSP.t('正在上传课程文档，请稍候…'))
						)
						: null,
					dragReadingTarget === 'docs'
						? h(
							'div',
							{ className: 'dsp-upload-status dsp-small dsp-muted' },
							h(DSP.Spinner, { size: 14 }),
							h('span', null, DSP.t('正在读取文件夹…'))
						)
						: null,
					docsOpen
						? h(
							'div',
							{ className: 'dsp-doc-section-body' },
							h(
								'div',
								{ className: 'dsp-upload-actions' },
								h(
									DSP.Btn,
									{
										variant: 'secondary',
										icon: 'upload',
										className: 'dsp-btn-sm',
										loading: uploadingDocs,
										disabled: uploadingDocs,
										onClick: function () { if (docInputRef.current) docInputRef.current.click(); }
									},
									DSP.t('上传文件')
								),
								h(
									DSP.Btn,
									{
										variant: 'secondary',
										icon: 'folder',
										className: 'dsp-btn-sm',
										disabled: uploadingDocs,
										onClick: function () { if (folderInputRef.current) folderInputRef.current.click(); }
									},
									DSP.t('上传文件夹')
								)
							),
							docs.length === 0
								? h(
									DSP.Empty,
									{ icon: 'book', title: DSP.t('暂无课程文档') },
									DSP.t('支持 PDF / Word / PPT / 文本 / Markdown / HTML 等格式。')
								)
								: h(
									'div',
									{ className: 'dsp-doc-list' },
									docGroups.map(function (group) {
										const groupLabel = group.path || DSP.t('根目录');
										return h(
											'div',
											{ key: group.path || '__root__', className: 'dsp-doc-group' },
											h(
												'div',
												{ className: 'dsp-doc-group-head' },
												h('span', { className: 'dsp-doc-group-icon' }, h(DSP.Icon, { name: 'folder', size: 14 })),
												h('span', { className: 'dsp-doc-group-path dsp-truncate', title: groupLabel }, groupLabel),
												h('span', { className: 'dsp-doc-group-count' }, String(group.docs.length))
											),
											h(
												'div',
												{ className: 'dsp-doc-group-body' },
												group.docs.map(function (item) {
													return h(CourseHomeDocRow, {
														key: item.doc.id,
														doc: item.doc,
														fileName: item.fileName,
														onDelete: function () { removeDoc(item.doc); }
													});
												})
											)
										);
									})
								)
							)
						: null
				)
			)
		),
		uploadModal
			? h(CourseHomeUploadModal, {
					key: uploadModal.key,
					course: course,
					initialQuestionFiles: uploadModal.files,
					onClose: function () { setUploadModal(null); }
				})
			: null,
		creating ? h(DSP.CourseCreateModal, { onClose: function () { setCreating(false); } }) : null,
		editing ? h(DSP.CourseCreateModal, { course: course, onClose: function () { setEditing(false); } }) : null
	);
}

DSP.CourseHome = CourseHomeView;
