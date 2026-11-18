/**
 * Agent 提示与结构化提交工具测试。
 *
 * 运行：node --test test/agent-prompts.test.mjs
 * 覆盖：所有 build*Prompt 只组装「一句话任务 + 数据」、结构化 schema 放在工具里、
 *       normalize* 直接接受工具回传的对象、多段 assistant 文本里取最后的 JSON。
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	ANSWER_KEY_RESULT_TOOL,
	ANSWER_RESULT_TOOL,
	GRADE_RESULT_TOOL,
	PARSE_RESULT_TOOL,
	buildAnswerKeyAgentPrompt,
	buildAnswerPrompt,
	buildChatAgentPrompt,
	buildDiagnosePrompt,
	buildGradePrompt,
	buildParseAgentPrompt,
	buildSvgPrompt,
	normalizeAnswerKey,
	normalizeGeneratedAnswers,
	normalizeGradeResult,
	normalizeParsedSet
} from '../lib/host/prompts.js';

const COURSE_ID = 'c_test';

test('PARSE_RESULT_TOOL：完整题目 schema + 图形两种 kind，schema 不靠提示词', () => {
	assert.equal(PARSE_RESULT_TOOL.name, 'submit_questions');
	assert.deepEqual(PARSE_RESULT_TOOL.parameters.required, ['questions']);
	const question = PARSE_RESULT_TOOL.parameters.properties.questions.items;
	assert.ok(question.properties.number);
	assert.ok(question.properties.stem);
	assert.deepEqual(question.properties.type.enum, ['single', 'multiple', 'judge', 'fill', 'short', 'other']);
	assert.deepEqual(question.properties.figures.items.properties.kind.enum, ['image', 'svg']);
	assert.ok(question.properties.figures.items.properties.path);
	assert.ok(question.properties.figures.items.properties.svg);
});

test('buildParseAgentPrompt：直接给文件 + 显式 JSON 格式（不写页面图片路径）', () => {
	const promptText = buildParseAgentPrompt({
		courseName: 'COMP90041',
		files: ['exam.pdf', { name: 'answers.docx' }],
		workingDir: '/data/sets/s1/source'
	});
	assert.ok(promptText.includes('exam.pdf'));
	assert.ok(promptText.includes('answers.docx'));
	assert.ok(promptText.includes('/data/sets/s1/source'));
	assert.ok(promptText.includes('COMP90041'));
	assert.ok(promptText.includes('# 输出格式'));
	assert.ok(promptText.includes('"questions"'), '必须明确告诉 Agent 字段格式');
	assert.ok(promptText.includes('"answerFigures"'));
	assert.ok(promptText.includes('submit_questions'));
	assert.ok(!promptText.includes('.png（第'), '不再给页面图片路径');

	const retryPrompt = buildParseAgentPrompt({ files: ['a.pdf'], retry: true });
	assert.ok(retryPrompt.includes('上一轮的图形无效'));
});

test('buildChatAgentPrompt：只有当前题目 + 我的回答 + 问题，不注入课程文档/参考答案', () => {
	const promptText = buildChatAgentPrompt({
		courseName: '数据库',
		question: { number: '3', type: 'single', stem: '什么是 3NF？', options: [{ key: 'A', text: '…' }], answerDisplay: 'B', analysis: '这是解析' },
		userAnswer: '我选了 A',
		selectedText: '选中的一句话',
		userText: '为什么选 B？'
	});
	assert.ok(promptText.includes('课程：数据库'));
	assert.ok(promptText.includes('第 3 题'));
	assert.ok(promptText.includes('我选了 A'));
	assert.ok(promptText.includes('选中的一句话'));
	assert.ok(promptText.includes('为什么选 B？'));
	assert.ok(!promptText.includes('参考答案'), '答疑上下文不带参考答案');
	assert.ok(!promptText.includes('这是解析'), '答疑上下文不带解析');
	assert.ok(promptText.length < 1200, `提示应保持较短，实际 ${promptText.length} 字`);
});

test('buildDiagnosePrompt：统计/错题是数据，只要求四个标题', () => {
	const promptText = buildDiagnosePrompt({
		scope: 'course',
		courseName: '数据库',
		stats: { questionTotal: 10, answeredCount: 8, correctCount: 6, accuracy: 0.75, typeStats: [], recent: [] },
		wrongQuestions: [{ number: '2', type: 'single', stem: '题干', userAnswer: 'A', answerDisplay: 'B', analysis: '解析' }]
	});
	assert.ok(promptText.includes('## 学情概览'));
	assert.ok(promptText.includes('## 主要易错点'));
	assert.ok(promptText.includes('## 复习重点'));
	assert.ok(promptText.includes('## 7 天复习计划'));
	assert.ok(promptText.includes('题干'));
});

test('buildSvgPrompt：题目、图形说明与只输出 svg', () => {
	const promptText = buildSvgPrompt({
		question: { number: '5', type: 'short', stem: '画出函数图像' },
		figureIndex: 0,
		explanation: '原图路径（可用 read_image 查看）：/assets/f1.png'
	});
	assert.ok(promptText.includes('第 5 题'));
	assert.ok(promptText.includes('/assets/f1.png'));
	assert.ok(promptText.includes('只输出一个完整的 <svg>'));
});

test('buildAnswerPrompt / ANSWER_RESULT_TOOL：显式答案格式 + 答案图', () => {
	const promptText = buildAnswerPrompt({
		courseName: '数据库',
		questions: [{ number: '1', type: 'single', stem: '题干', options: [{ key: 'A', text: '选项' }] }]
	});
	assert.ok(promptText.includes('共 1 道'));
	assert.ok(promptText.includes('submit_reference_answers'));
	assert.ok(promptText.includes('answerFigures'));
	assert.equal(ANSWER_RESULT_TOOL.name, 'submit_reference_answers');
	assert.deepEqual(ANSWER_RESULT_TOOL.parameters.required, ['answers']);
	assert.deepEqual(ANSWER_RESULT_TOOL.parameters.properties.answers.items.properties.answer.type, 'array');
});

test('buildAnswerKeyAgentPrompt / ANSWER_KEY_RESULT_TOOL：直接给答案文件 + 题号与答案图', () => {
	const promptText = buildAnswerKeyAgentPrompt({
		files: ['solutions.pdf'],
		workingDir: '/data/sets/s1/source',
		courseName: '数据库'
	});
	assert.ok(promptText.includes('solutions.pdf'));
	assert.ok(promptText.includes('/data/sets/s1/source'));
	assert.ok(promptText.includes('submit_answer_key'));
	assert.ok(promptText.includes('answerFigures'), '答案可能有图，必须给出字段');
	assert.equal(ANSWER_KEY_RESULT_TOOL.name, 'submit_answer_key');
	assert.ok(ANSWER_KEY_RESULT_TOOL.parameters.properties.answers.items.properties.answerFigures);
});

test('buildGradePrompt / GRADE_RESULT_TOOL：标准答案已准备，只让学生答案比对', () => {
	const promptText = buildGradePrompt({
		courseName: '数据库',
		question: { number: '2', type: 'single', stem: '题干', options: [{ key: 'A', text: '选项' }], answerDisplay: 'A', analysis: '原卷解析' },
		userAnswer: 'B'
	});
	assert.ok(promptText.includes('标准答案（已准备，不要改写）'));
	assert.ok(promptText.includes('A'));
	assert.ok(promptText.includes('学生答案'));
	assert.ok(promptText.includes('submit_grade'));
	assert.ok(promptText.includes('最多 3 句'), '解析要求简短');
	assert.ok(!promptText.includes('工作目录'), '判卷不给文档工作目录');
	assert.equal(GRADE_RESULT_TOOL.name, 'submit_grade');
	assert.deepEqual(GRADE_RESULT_TOOL.parameters.properties.verdict.enum, ['correct', 'partial', 'incorrect']);
	assert.deepEqual(GRADE_RESULT_TOOL.parameters.required, ['verdict']);
});

test('normalize*：直接接受提交工具回传的对象', () => {
	const parsed = normalizeParsedSet({
		title: '工具卷',
		questions: [{ number: '1', type: 'single', stem: '1+1？', options: [{ key: 'A', text: '2' }], hasAnswer: true, answer: ['A'] }]
	}, { courseId: 'c', setId: 's' });
	assert.equal(parsed.set.questions.length, 1);
	assert.equal(parsed.set.questions[0].answerDisplay, 'A');

	const grade = normalizeGradeResult({ verdict: 'correct', score: 100, standardAnswer: 'A', suggestions: ['保持'] }, { allowedRefs: [] });
	assert.equal(grade.result.verdict, 'correct');
	assert.equal(grade.result.standardAnswer, 'A');

	const key = normalizeAnswerKey({ answers: [{ number: '1', answer: ['B'], analysis: '解析' }] }, {
		questions: [{ id: 'q1', number: '1', type: 'single', options: [{ key: 'A', text: 'a' }, { key: 'B', text: 'b' }] }]
	});
	assert.equal(key.answers.get('q1').answerDisplay, 'B');

	const answers = normalizeGeneratedAnswers({ answers: [{ number: '1', answer: ['B'], analysis: '推导', refs: ['第一章.pdf'] }] }, {
		questions: [{ id: 'q1', number: '1', type: 'single', options: [{ key: 'A', text: 'a' }, { key: 'B', text: 'b' }] }],
		allowedRefs: ['第一章.pdf']
	});
	assert.deepEqual(answers.answers.get('q1').refs, ['第一章.pdf']);
});

test('normalizeParsedSet：多段 assistant 文本拼接时取最后的完整 JSON', () => {
	const raw = [
		'我先看一下页面。```json\n{"note":"过程片段"}\n```',
		'现在输出正式结果：',
		'```json\n{"title":"最终卷","questions":[{"number":"1","type":"single","stem":"题干","options":[{"key":"A","text":"a"}],"hasAnswer":false,"answer":[]}]}\n```'
	].join('\n');
	const parsed = normalizeParsedSet(raw, { courseId: 'c', setId: 's' });
	assert.equal(parsed.set.title, '最终卷');
	assert.equal(parsed.set.questions.length, 1);
});
