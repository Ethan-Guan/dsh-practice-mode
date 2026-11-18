/**
 * prompts.js / retrieval.js 单元测试。
 *
 * 运行：node --test test/prompts.test.mjs
 * 覆盖：脏 JSON 容错（含多段 assistant 文本）、字段规范化（题型/选项/答案/answerDisplay/题号）、
 *       跨题共用材料、SVG 清洗、批处理合并去重、课程文档相对路径/目录树、文档检索。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
	docRelativePath,
	formatDocTree,
	mergeParsedSets,
	needsFigureRetry,
	normalizeAiAnswerMode,
	normalizeAnswerKey,
	normalizeGeneratedAnswers,
	normalizeGradeResult,
	normalizeParsedSet,
	sanitizeSvg
} from '../lib/host/prompts.js';
import { clampCropBox, cropImageRegion, readImageDimensions } from '../lib/host/image-crop.js';
import { resolveDshHome, resolveResourcesRoot } from '../lib/host/paths.js';

const DIRTY_PARSE_OUTPUT = `好的，我已经完成解析。下面是结果：

\`\`\`json
{
  "title": "期中测试卷",
  "groups": [
    { "id": "m1", "material": "阅读下面的材料，完成第 1-2 题。材料正文：春天来了……" }
  ],
  "questions": [
    {
      "number": "1",
      "type": "单选题",
      "groupId": "m1",
      "stem": "材料中\\"春天\\"象征什么？",
      "options": { "A": "希望", "B": "冬天", "C": "秋天", "D": "夏天" },
      "answer": "A",
      "analysis": "由材料第一段可知，春天象征希望。"
    },
    {
      "number": "2",
      "type": "多选题",
      "groupId": "m1",
      "stem": "下列说法正确的有",
      "options": [
        { "key": "a", "text": "甲" },
        { "key": "b", "text": "乙" },
        { "key": "c", "text": "丙" }
      ],
      "answer": "A、C"
    },
    { "number": "3", "type": "判断题", "stem": "函数 y=x 是奇函数。", "answer": "正确" },
    { "number": "4", "type": "填空题", "stem": "1+1=____", "answer": ["2"] },
    {
      "number": "5",
      "type": "解答题",
      "stem": "证明：对任意实数 x，x^2 >= 0。",
      "answer": ["由平方定义知 x^2 >= 0，得证。"],
      "analysis": "第一步：讨论 x 的符号……"
    },
    { "number": "6", "type": "单选题", "stem": "", "options": [], "answer": [] },
    {
      "number": "二、3",
      "type": "单选",
      "stem": "如图，求角 A 的度数。",
      "options": [{ "key": "A", "text": "30°" }, { "key": "B", "text": "45°" }],
      "answer": "B",
      "figures": [
        {
          "kind": "svg",
          "svg": "<svg width='200' height='120'><script>alert(1)</script><foreignObject><div>x</div></foreignObject><line x1='0' y1='0' x2='100' y2='100' stroke='#000' onclick='alert(2)'/><text x='10' y='20'>角A</text></svg>"
        }
      ]
    }
  ]
}
\`\`\`

以上为全部题目，请查收。`;

test('normalizeParsedSet：脏 JSON + 字段规范化 + 跨题共用材料', () => {
	const { set, warnings } = normalizeParsedSet(DIRTY_PARSE_OUTPUT, {
		courseId: 'c_test01',
		setId: 's_test01',
		titleFallback: '备用标题'
	});

	assert.equal(set.id, 's_test01');
	assert.equal(set.courseId, 'c_test01');
	assert.equal(set.title, '期中测试卷');
	assert.deepEqual(set.pages, []);
	assert.ok(Array.isArray(set.warnings));
	assert.ok(Array.isArray(warnings));

	// 空题（第 6 题）被过滤。
	assert.equal(set.questions.length, 6);
	assert.ok(warnings.some((warning) => warning.includes('空题')));

	// 共用材料 + groupId 重映射。
	assert.equal(set.groups.length, 1);
	assert.equal(set.groups[0].id, 'g1');
	assert.match(set.groups[0].material, /春天来了/);

	const [q1, q2, q3, q4, q5] = set.questions;
	// 题号保留、选项 key 大写、单选答案数组、answerDisplay 生成。
	assert.equal(q1.number, '1');
	assert.equal(q1.type, 'single');
	assert.equal(q1.groupId, 'g1');
	assert.deepEqual(q1.options.map((option) => option.key), ['A', 'B', 'C', 'D']);
	assert.deepEqual(q1.answer, ['A']);
	assert.equal(q1.answerDisplay, 'A');
	assert.match(q1.analysis, /春天象征希望/);

	// 多选答案 "A、C" → ["A","C"]。
	assert.equal(q2.type, 'multiple');
	assert.deepEqual(q2.answer, ['A', 'C']);
	assert.equal(q2.answerDisplay, 'A、C');

	// 判断答案规范化。
	assert.equal(q3.type, 'judge');
	assert.deepEqual(q3.answer, ['正确']);
	assert.equal(q3.answerDisplay, '正确');

	// 填空/简答。
	assert.equal(q4.type, 'fill');
	assert.deepEqual(q4.answer, ['2']);
	assert.equal(q5.type, 'short');
	assert.ok(Array.isArray(q5.answer) && q5.answer.length > 0);

	// 末尾题：题号 "二、3" 原样保留，图形 SVG 被清洗。
	const last = set.questions.at(-1);
	assert.equal(last.number, '二、3');
	assert.equal(last.answerDisplay, 'B');
	assert.equal(last.figures.length, 1);
	assert.equal(last.figures[0].kind, 'svg');
	assert.equal(last.figures[0].alt, '图1');
	assert.ok(last.figures[0].svg.includes('<svg'));
	assert.ok(last.figures[0].svg.includes('xmlns="http://www.w3.org/2000/svg"'));
	assert.ok(last.figures[0].svg.includes('viewBox="0 0 200 120"'));
	assert.ok(!last.figures[0].svg.includes('<script'));
	assert.ok(!last.figures[0].svg.includes('foreignObject'));
	assert.ok(!last.figures[0].svg.includes('onclick'));
	// 每道题都有规范化的 id、tags 和 difficulty。
	for (const [index, question] of set.questions.entries()) {
		assert.equal(question.id, `q${index + 1}`);
		assert.ok(Array.isArray(question.tags));
		assert.ok(['easy', 'medium', 'hard'].includes(question.difficulty));
	}
});

test('normalizeParsedSet：裸 JSON 数组 + 尾逗号 + 首尾杂质', () => {
	const raw = `这是结果：[{"number":"1","type":"single","stem":"1+1=?","options":["1","2"],"answer":"B",},] 谢谢`;
	const { set } = normalizeParsedSet(raw, { courseId: 'c1', setId: 's1' });
	assert.equal(set.questions.length, 1);
	assert.equal(set.questions[0].answerDisplay, 'B');
	assert.deepEqual(set.questions[0].options.map((option) => option.key), ['A', 'B']);
});

test('normalizeParsedSet：单题顶层对象与标题回退', () => {
	const raw = JSON.stringify({ stem: '下列说法正确的是？', type: 'single', options: { A: '甲', B: '乙' }, answer: '乙' });
	const { set } = normalizeParsedSet(raw, { courseId: 'c1', setId: 's1', titleFallback: '第一章练习' });
	assert.equal(set.questions.length, 1);
	// answer 是选项原文时能映射回 key。
	assert.deepEqual(set.questions[0].answer, ['B']);
	assert.equal(set.title, '第一章练习');
});

test('normalizeParsedSet：完全无法解析时抛中文错误', () => {
	assert.throws(
		() => normalizeParsedSet('抱歉，我无法识别这张图片的内容。', { courseId: 'c1', setId: 's1' }),
		(error) => error instanceof Error && /无法解析|没有/.test(error.message)
	);
});

test('mergeParsedSets：跨批重叠去重 + 重新编号 + 共用材料合并', () => {
	const partA = normalizeParsedSet(
		JSON.stringify({
			title: '第一套',
			groups: [{ id: 'x', material: '共用材料：某段阅读材料……' }],
			questions: [
				{ number: '1', type: 'single', groupId: 'x', stem: '第 1 题题干', options: ['甲', '乙'], answer: 'A' },
				{ number: '2', type: 'single', stem: '第 2 题题干', options: ['甲', '乙'], answer: 'B' }
			]
		}),
		{ courseId: 'c1', setId: 's1', now: 1000 }
	);
	const partB = normalizeParsedSet(
		JSON.stringify({
			groups: [{ id: 'm1', material: '共用材料：某段阅读材料……' }],
			questions: [
				// 与 partA 第 2 题重叠（同一道题，补充了解析）。
				{ number: '2', type: 'single', stem: '第 2 题题干', options: ['甲', '乙'], answer: 'B', analysis: '因为……所以选 B。' },
				{ number: '3', type: 'judge', groupId: 'm1', stem: '第 3 题题干', answer: '错误' }
			]
		}),
		{ courseId: 'c1', setId: 's1', now: 2000 }
	);
	const { set, warnings } = mergeParsedSets([partA, partB], { courseId: 'c1', setId: 's1', titleFallback: '备用' });
	assert.equal(set.questions.length, 3);
	assert.deepEqual(set.questions.map((question) => question.id), ['q1', 'q2', 'q3']);
	assert.deepEqual(set.questions.map((question) => question.number), ['1', '2', '3']);
	// 重叠题补全了解析。
	assert.match(set.questions[1].analysis, /所以选 B/);
	// 材料相同 → 合并成一个 group，并重映射 groupId。
	assert.equal(set.groups.length, 1);
	assert.equal(set.questions[0].groupId, 'g1');
	assert.equal(set.questions[2].groupId, 'g1');
	assert.ok(Array.isArray(warnings));
});

test('sanitizeSvg：去危险内容、补 xmlns/viewBox、拒绝非 SVG', () => {
	const dirty =
		'<svg width="300" height="200">' +
		'<script>alert(1)</script>' +
		'<foreignObject><div>hi</div></foreignObject>' +
		'<a xlink:href="javascript:alert(2)"><text x="1" y="2">点</text></a>' +
		'<image href="https://evil.example/x.png"/>' +
		'<rect x="0" y="0" width="50" height="50" fill="#fff" stroke="#000" onmouseover="alert(3)"/>' +
		'</svg>';
	const cleaned = sanitizeSvg(dirty);
	assert.ok(cleaned.startsWith('<svg'));
	assert.ok(cleaned.includes('xmlns="http://www.w3.org/2000/svg"'));
	assert.ok(cleaned.includes('viewBox="0 0 300 200"'));
	assert.ok(!cleaned.includes('<script'));
	assert.ok(!cleaned.includes('foreignObject'));
	assert.ok(!cleaned.includes('javascript:'));
	assert.ok(!cleaned.includes('evil.example'));
	assert.ok(!cleaned.includes('onmouseover'));
	assert.ok(cleaned.includes('stroke="#000"'));

	// 代码块围栏被剥掉。
	assert.ok(sanitizeSvg('```svg\n<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>\n```').includes('<circle'));

	// 非 SVG / 空图返回空串。
	assert.equal(sanitizeSvg('这不是图'), '');
	assert.equal(sanitizeSvg('<svg></svg>'), '');
	assert.equal(sanitizeSvg(undefined), '');
});

test('docRelativePath：relativePath 优先 / relPath 去前缀推导 / name fallback', () => {
	// 新数据：api 上传时写入 relativePath。
	assert.equal(
		docRelativePath({ id: 'd1', name: '1.1 极限.pdf', relativePath: '第一章/1.1 极限.pdf', relPath: 'courses/c1/docs/d1/第一章/1.1 极限.pdf' }, 'c1'),
		'第一章/1.1 极限.pdf'
	);
	// 旧数据：没有 relativePath，从 relPath 去掉 courses/<cid>/docs/<did>/ 前缀推导。
	assert.equal(
		docRelativePath({ id: 'd2', name: '2.1 积分.pdf', relPath: 'courses/c1/docs/d2/第二章/2.1 积分.pdf' }, 'c1'),
		'第二章/2.1 积分.pdf'
	);
	// 旧数据且 courseId 缺失：用通用模式推导。
	assert.equal(
		docRelativePath({ id: 'd3', name: 'x.pdf', relPath: 'courses/c9/docs/d3/附录/x.pdf' }),
		'附录/x.pdf'
	);
	// 再 fallback doc.name。
	assert.equal(docRelativePath({ name: '说明.md' }, 'c1'), '说明.md');
	// 异常输入安全。
	assert.equal(docRelativePath(null, 'c1'), '');
	assert.equal(docRelativePath({}, 'c1'), '未命名文档');
	// 反斜杠路径与 .. 段被规范化。
	assert.equal(docRelativePath({ relativePath: '第一章\\..\\1.1 极限.pdf' }, 'c1'), '第一章/1.1 极限.pdf');
});

test('formatDocTree：按目录分组、仅列可检索文档、旧数据 fallback', () => {
	const docs = [
		{ id: 'd1', name: '1.1 极限.pdf', relativePath: '第一章/1.1 极限.pdf', textRelPath: 'courses/c1/docs/d1/text.md' },
		{ id: 'd2', name: '1.2 导数.pdf', relativePath: '第一章/1.2 导数.pdf', textRelPath: 'courses/c1/docs/d2/text.md' },
		{ id: 'd3', name: '2.1 积分.pdf', relativePath: '第二章/2.1 积分.pdf', textRelPath: 'courses/c1/docs/d3/text.md' },
		{ id: 'd4', name: '课程说明.md', relativePath: '课程说明.md', textRelPath: 'courses/c1/docs/d4/text.md' },
		// 抽取失败（没有 textRelPath）→ 不应出现在目录树里。
		{ id: 'd5', name: '扫描件.pdf', relativePath: '第一章/扫描件.pdf', textRelPath: null },
		// 旧数据：无 relativePath，从 relPath 推导。
		{ id: 'd6', name: '3.1 级数.pdf', relPath: 'courses/c1/docs/d6/第三章/3.1 级数.pdf', textRelPath: 'courses/c1/docs/d6/text.md' }
	];
	const tree = formatDocTree(docs, { courseId: 'c1' });
	assert.ok(tree.includes('课程文档目录'));
	assert.ok(tree.includes('共 5 个文件'));
	assert.match(tree, /^课程文档目录/m);
	// 目录层级：目录行以 / 结尾，文件在其下一级缩进。
	assert.ok(tree.includes('- 第一章/'));
	assert.ok(tree.includes('  - 1.1 极限.pdf'));
	assert.ok(tree.includes('  - 1.2 导数.pdf'));
	assert.ok(tree.includes('- 第二章/'));
	assert.ok(tree.includes('  - 2.1 积分.pdf'));
	assert.ok(tree.includes('- 第三章/'));
	assert.ok(tree.includes('  - 3.1 级数.pdf'));
	// 根目录文件直接列在顶层。
	assert.ok(tree.includes('- 课程说明.md'));
	// 不可检索文档被排除。
	assert.ok(!tree.includes('扫描件'));
	// 目录按名称稳定排序（中文目录名按 ICU 拼音排序，这里用 ASCII 目录名验证排序逻辑）。
	const asciiTree = formatDocTree([
		{ name: 'b.pdf', relativePath: 'b目录/b.pdf', textRelPath: 't' },
		{ name: 'a.pdf', relativePath: 'a目录/a.pdf', textRelPath: 't' }
	], { courseId: 'c1' });
	assert.ok(asciiTree.indexOf('a目录/') < asciiTree.indexOf('b目录/'));

	// 没有可检索文档时返回空串（调用方据此跳过该区块）。
	assert.equal(formatDocTree([], { courseId: 'c1' }), '');
	assert.equal(formatDocTree([{ name: 'a.pdf', textRelPath: null }], { courseId: 'c1' }), '');
});

test('formatDocTree：目录深度折叠与 80 行截断', () => {
	// 超过 3 层目录：更深目录折叠进文件名，仍保留完整相对路径信息。
	const deepTree = formatDocTree([
		{ id: 'd1', name: 'file.pdf', relativePath: 'a/b/c/d/e/file.pdf', textRelPath: 'courses/c1/docs/d1/text.md' }
	], { courseId: 'c1' });
	assert.ok(deepTree.includes('- a/'));
	assert.ok(deepTree.includes('  - b/'));
	assert.ok(deepTree.includes('    - c/'));
	// d/e 折叠进文件行走，且不再新增目录层级。
	assert.ok(deepTree.includes('      - d/e/file.pdf'));

	// 生成 120 个同一目录下的文档 → 总行数受限并注明省略。
	const many = [];
	for (let index = 0; index < 120; index += 1) {
		many.push({
			id: `d${index}`,
			name: `知识点${index}.md`,
			relativePath: `章节/知识点${String(index).padStart(3, '0')}.md`,
			textRelPath: `courses/c1/docs/d${index}/text.md`
		});
	}
	const truncated = formatDocTree(many, { courseId: 'c1' });
	const lines = truncated.split('\n');
	assert.ok(lines.length <= 82, `目录树行数应受限，实际 ${lines.length}`);
	assert.ok(lines.length < many.length);
	assert.ok(truncated.includes('目录过长'));
	assert.ok(truncated.includes('共 120 个文件'));
});

test('normalizeParsedSet：hasAnswer/answerSource/answerRefs 两阶段字段', () => {
	const raw = JSON.stringify({
		questions: [
			// 原卷明确有答案。
			{ number: '1', type: 'single', stem: '有答案的题', options: ['甲', '乙'], answer: 'A', answerDisplay: 'A', analysis: '原卷解析。', hasAnswer: true },
			// 原卷无答案：即使模型给了答案与解析也必须清空，等待第二阶段生成。
			{ number: '2', type: 'single', stem: '无答案的题', options: ['甲', '乙'], answer: 'B', analysis: '模型自行推导……', hasAnswer: false },
			// 旧模型输出没有 hasAnswer 标记：answer 非空 → 视为原卷有答案。
			{ number: '3', type: 'fill', stem: '旧输出题', answer: ['2'] },
			// 旧模型输出：只有解析没有 answer → 也视为原卷有答案（hasAnswer=true，answer 为空）。
			{ number: '4', type: 'short', stem: '只有解析的题', analysis: '原卷给出的解析内容。' },
			// 什么都没有 → hasAnswer=false。
			{ number: '5', type: 'single', stem: '缺答案的题', options: ['甲', '乙'] }
		]
	});
	const { set } = normalizeParsedSet(raw, { courseId: 'c1', setId: 's1' });
	assert.equal(set.questions.length, 5);

	const [q1, q2, q3, q4, q5] = set.questions;
	// 原卷答案：answerSource='source'，answerRefs=[]。
	assert.equal(q1.hasAnswer, true);
	assert.equal(q1.answerSource, 'source');
	assert.deepEqual(q1.answerRefs, []);
	assert.deepEqual(q1.answer, ['A']);
	assert.equal(q1.answerDisplay, 'A');
	assert.ok(!JSON.stringify(q1).includes('ai-doc'));

	// 显式 hasAnswer=false：answer/answerDisplay 清空，analysis 保留，等待第二阶段。
	assert.equal(q2.hasAnswer, false);
	assert.equal(q2.answerSource, null);
	assert.deepEqual(q2.answerRefs, []);
	assert.deepEqual(q2.answer, []);
	assert.equal(q2.answerDisplay, '');
	assert.match(q2.analysis, /模型自行推导/);

	// 旧模型输出推断：answer 非空 → 原卷有答案。
	assert.equal(q3.hasAnswer, true);
	assert.equal(q3.answerSource, 'source');
	assert.deepEqual(q3.answer, ['2']);

	// 旧模型输出推断：analysis 非空 → 原卷有答案，但 answer 保持空。
	assert.equal(q4.hasAnswer, true);
	assert.equal(q4.answerSource, 'source');
	assert.deepEqual(q4.answer, []);
	assert.equal(q4.answerDisplay, '');

	// 完全没有答案与解析 → hasAnswer=false，等第二阶段生成。
	assert.equal(q5.hasAnswer, false);
	assert.equal(q5.answerSource, null);
	assert.deepEqual(q5.answerRefs, []);
	assert.deepEqual(q5.answer, []);
});

test('mergeParsedSets：保留 hasAnswer/answerSource，重叠批补全原卷答案时以原卷为准', () => {
	const partA = normalizeParsedSet(
		JSON.stringify({
			questions: [
				{ number: '1', type: 'single', stem: '第 1 题', options: ['甲', '乙'], hasAnswer: false },
				{ number: '2', type: 'judge', stem: '第 2 题', hasAnswer: false }
			]
		}),
		{ courseId: 'c1', setId: 's1' }
	);
	const partB = normalizeParsedSet(
		JSON.stringify({
			questions: [
				// 重叠页补全了第 1 题的原卷答案。
				{ number: '1', type: 'single', stem: '第 1 题', options: ['甲', '乙'], answer: 'B', analysis: '原卷解析。', hasAnswer: true },
				{ number: '2', type: 'judge', stem: '第 2 题', hasAnswer: false }
			]
		}),
		{ courseId: 'c1', setId: 's1' }
	);
	const { set } = mergeParsedSets([partA, partB], { courseId: 'c1', setId: 's1' });
	assert.equal(set.questions.length, 2);
	const q1 = set.questions[0];
	assert.equal(q1.hasAnswer, true);
	assert.equal(q1.answerSource, 'source');
	assert.deepEqual(q1.answerRefs, []);
	assert.deepEqual(q1.answer, ['B']);
	assert.match(q1.analysis, /原卷解析/);
	const q2 = set.questions[1];
	assert.equal(q2.hasAnswer, false);
	assert.equal(q2.answerSource, null);
	assert.deepEqual(q2.answer, []);
});

test('normalizeGeneratedAnswers：脏 JSON 映射 + 答案规范化 + refs 过滤', () => {
	const questions = [
		{ id: 'q1', number: '1', type: 'single', options: [{ key: 'A', text: '甲' }, { key: 'B', text: '乙' }] },
		{ id: 'q2', number: '2', type: 'judge' },
		{ id: 'q3', number: '3', type: 'fill' }
	];
	const raw = `模型输出如下：
\`\`\`json
[
  { "number": "1", "answer": "乙", "refs": ["第一章/1.1 极限.pdf", "幻觉章节/不存在.pdf"], },
  { "number": "2", "answer": "×", "analysis": "因为……", "refs": [], },
  { "number": "3", "answer": ["x=1", "y=2"], },
  { "number": "99", "answer": "A" },
]
\`\`\`
以上。`;
	const { answers, warnings } = normalizeGeneratedAnswers(raw, {
		questions,
		allowedRefs: ['第一章/1.1 极限.pdf']
	});
	assert.ok(answers instanceof Map);
	assert.equal(answers.size, 3);
	const a1 = answers.get('q1');
	// 选项原文「乙」映射回 key B；answerDisplay 自动生成。
	assert.deepEqual(a1.answer, ['B']);
	assert.equal(a1.answerDisplay, 'B');
	// 真实引用保留为相对路径，幻觉引用被过滤。
	assert.deepEqual(a1.refs, ['第一章/1.1 极限.pdf']);
	const a2 = answers.get('q2');
	assert.deepEqual(a2.answer, ['错误']);
	assert.match(a2.analysis, /因为/);
	assert.deepEqual(a2.refs, []);
	const a3 = answers.get('q3');
	assert.deepEqual(a3.answer, ['x=1', 'y=2']);
	assert.equal(a3.answerDisplay, 'x=1；y=2');
	// 未知题号忽略并给出 warning；幻觉引用给出 warning。
	assert.ok(warnings.some((warning) => warning.includes('99')));
	assert.ok(warnings.some((warning) => warning.includes('引用')));

	// 模型只写文件名时，能唯一补全为相对路径。
	const basenameRef = normalizeGeneratedAnswers(
		JSON.stringify([{ number: '1', answer: 'A', refs: ['1.1 极限.pdf'] }]),
		{ questions: [questions[0]], allowedRefs: ['第一章/1.1 极限.pdf'] }
	);
	assert.deepEqual(basenameRef.answers.get('q1').refs, ['第一章/1.1 极限.pdf']);

	// 完全无法解析时抛中文错误。
	assert.throws(
		() => normalizeGeneratedAnswers('抱歉，我无法完成。', { questions, allowedRefs: [] }),
		(error) => error instanceof Error && /无法解析|没有/.test(error.message)
	);
});


test('normalizeAiAnswerMode：默认 auto / off / regenerate / 非法值回退', () => {
	assert.equal(normalizeAiAnswerMode(undefined), 'auto');
	assert.equal(normalizeAiAnswerMode(null), 'auto');
	assert.equal(normalizeAiAnswerMode(''), 'auto');
	assert.equal(normalizeAiAnswerMode('auto'), 'auto');
	assert.equal(normalizeAiAnswerMode('OFF'), 'off');
	assert.equal(normalizeAiAnswerMode(' regenerate '), 'regenerate');
	assert.equal(normalizeAiAnswerMode('unknown-mode'), 'auto');
});

test('normalizeAnswerKey：题号匹配 / 多题连写 / 选项原文→key / 未匹配 warning / 脏 JSON', () => {
	const questions = [
		{ id: 'q1', number: '1', type: 'single', options: [{ key: 'A', text: '甲' }, { key: 'B', text: '乙' }] },
		{ id: 'q2', number: '2', type: 'judge' },
		{ id: 'q3', number: '3', type: 'multiple', options: [{ key: 'A', text: '甲' }, { key: 'B', text: '乙' }, { key: 'C', text: '丙' }] },
		{ id: 'q4', number: '4', type: 'fill' },
		{ id: 'q5', number: '5', type: 'single', options: [{ key: 'A', text: '甲' }, { key: 'B', text: '乙' }] },
		{ id: 'q6', number: '二、6', type: 'single', options: [{ key: 'A', text: '甲' }, { key: 'B', text: '乙' }] }
	];
	const raw = '解析结果如下：\n```json\n[\n {"number":"1.","answer":"乙",},\n {"number":"第2题","answer":"×"},\n {"number":"T3","answer":"A、C"},\n {"number":"4","answer":["2"]},\n {"number":"5","answer":"B"},\n {"number":"二、6","answer":"B"},\n {"number":"99","answer":"A"}\n]\n```\n以上。';
	const { answers, warnings } = normalizeAnswerKey(raw, { questions });
	assert.ok(answers instanceof Map);
	assert.equal(answers.size, 6);
	// 选项原文「乙」映射回 key B；题号 "1." 匹配题目 "1"。
	assert.deepEqual(answers.get('q1').answer, ['B']);
	assert.equal(answers.get('q1').answerDisplay, 'B');
	// "×" → 判断题「错误」；"第2题" 匹配题目 "2"。
	assert.deepEqual(answers.get('q2').answer, ['错误']);
	// "T3" 匹配题目 "3"；多选按选项顺序。
	assert.deepEqual(answers.get('q3').answer, ['A', 'C']);
	assert.deepEqual(answers.get('q4').answer, ['2']);
	assert.deepEqual(answers.get('q6').answer, ['B']);
	assert.equal(answers.get('q6').number, '二、6');
	// 未匹配题号给 warning。
	assert.ok(warnings.some((warning) => warning.includes('99')), JSON.stringify(warnings));

	// 多题连写："1-3 正确 错误 正确" 按顺序展开。
	const compactQuestions = [
		{ id: 'a1', number: '1', type: 'judge' },
		{ id: 'a2', number: '2', type: 'judge' },
		{ id: 'a3', number: '3', type: 'judge' }
	];
	const compact = normalizeAnswerKey(JSON.stringify([{ number: '1-3', answer: '正确 错误 正确' }]), { questions: compactQuestions });
	assert.deepEqual(compact.answers.get('a1').answer, ['正确']);
	assert.deepEqual(compact.answers.get('a2').answer, ['错误']);
	assert.deepEqual(compact.answers.get('a3').answer, ['正确']);
	// 连续字母 "1-3 B C D" 拆成单题答案。
	const letterQuestions = ['1', '2', '3'].map((number, index) => ({
		id: `l${index + 1}`,
		number,
		type: 'single',
		options: [{ key: 'A', text: '甲' }, { key: 'B', text: '乙' }, { key: 'C', text: '丙' }, { key: 'D', text: '丁' }]
	}));
	const letters = normalizeAnswerKey(JSON.stringify([{ number: '1-3', answer: 'B C D' }]), { questions: letterQuestions });
	assert.deepEqual(letters.answers.get('l1').answer, ['B']);
	assert.deepEqual(letters.answers.get('l2').answer, ['C']);
	assert.deepEqual(letters.answers.get('l3').answer, ['D']);

	// 「题号 → 答案」映射对象也可解析（单选）。
	const mapped = normalizeAnswerKey(JSON.stringify({ 1: 'B', 2: 'C' }), { questions: letterQuestions.slice(0, 2) });
	assert.deepEqual(mapped.answers.get('l1').answer, ['B']);
	assert.deepEqual(mapped.answers.get('l2').answer, ['C']);

	// 完全无法解析时抛中文错误。
	assert.throws(
		() => normalizeAnswerKey('抱歉，答案文件看不清。', { questions }),
		(error) => error instanceof Error && /无法解析|没有/.test(error.message)
	);
});

test('判断题答案归一化：A/B/1/0/true/false → 正确/错误，answerDisplay 同步归一', () => {
	const raw = {
		questions: [
			{ number: '1', type: 'judge', stem: 'a', answer: 'A', answerDisplay: 'True' },
			{ number: '2', type: 'judge', stem: 'b', answer: 'B' },
			{ number: '3', type: 'judge', stem: 'c', answer: '1' },
			{ number: '4', type: 'judge', stem: 'd', answer: '0' },
			{ number: '5', type: 'judge', stem: 'e', answer: 'true' },
			{ number: '6', type: 'judge', stem: 'f', answer: 'false' },
			{ number: '7', type: 'judge', stem: 'g', answer: 'True' },
			{ number: '8', type: 'judge', stem: 'h', answer: 'False' },
			{ number: '9', type: 'judge', stem: 'i', answer: '正确' },
			{ number: '10', type: 'judge', stem: 'j', answer: '×' }
		]
	};
	const { set } = normalizeParsedSet(JSON.stringify(raw), { courseId: 'c1', setId: 's1' });
	const expected = ['正确', '错误', '正确', '错误', '正确', '错误', '正确', '错误', '正确', '错误'];
	set.questions.forEach((question, index) => {
		assert.deepEqual(question.answer, [expected[index]], `第 ${index + 1} 题答案归一化失败`);
		assert.equal(question.answerDisplay, expected[index], `第 ${index + 1} 题 answerDisplay 应归一为 正确/错误`);
	});
	// 真实旧数据的 Q25 形态（Canvas 判断题 answer "A" / display "True"）。
	const q25 = normalizeParsedSet(JSON.stringify({
		questions: [{ number: '25', type: 'judge', stem: 'Is `<? extends Number>` a correct notation?', answer: 'A', answerDisplay: 'True' }]
	}), { courseId: 'c1', setId: 's1' });
	assert.deepEqual(q25.set.questions[0].answer, ['正确']);
	assert.equal(q25.set.questions[0].answerDisplay, '正确');
});

test('hasVisual：解析输出、合并保留与 needsFigureRetry 判定', () => {
	const svg = '<svg viewBox="0 0 100 80"><rect x="1" y="1" width="40" height="20" stroke="#000" fill="none"/><text x="4" y="16">A</text></svg>';
	const raw = {
		groups: [{ id: 'g1', material: 'UML 类图材料', hasVisual: true, figures: [{ kind: 'svg', svg, alt: '图1' }] }],
		questions: [
			{ number: '1', type: 'single', stem: '带图题', options: ['甲', '乙'], groupId: 'g1', hasVisual: true, figures: [{ kind: 'svg', svg, alt: '图1' }] },
			{ number: '2', type: 'single', stem: '未标记但有图', options: ['甲', '乙'], figures: [{ kind: 'svg', svg }] },
			{ number: '3', type: 'single', stem: '纯文字题', options: ['甲', '乙'] }
		]
	};
	const parsed = normalizeParsedSet(JSON.stringify(raw), { courseId: 'c1', setId: 's1' });
	const groups = parsed.set.groups;
	const [q1, q2, q3] = parsed.set.questions;
	assert.equal(groups[0].hasVisual, true);
	assert.equal(groups[0].figures.length, 1);
	assert.equal(q1.hasVisual, true);
	assert.equal(q1.figures.length, 1);
	// 未显式给 hasVisual 但有合法 figures → 推断为 true。
	assert.equal(q2.hasVisual, true);
	// 纯文字题 → false。
	assert.equal(q3.hasVisual, false);
	assert.deepEqual(q3.figures, []);

	// mergeParsedSets 保留 hasVisual/figures。
	const merged = mergeParsedSets([parsed, parsed], { courseId: 'c1', setId: 's1' });
	assert.equal(merged.set.questions[0].hasVisual, true);
	assert.equal(merged.set.groups[0].hasVisual, true);

	// needsFigureRetry：hasVisual 但图形缺失 → 需要重试。
	assert.equal(needsFigureRetry({ set: { groups: [], questions: [{ hasVisual: true, figures: [] }] } }), true);
	assert.equal(needsFigureRetry({ set: { groups: [{ hasVisual: true, figures: [] }], questions: [] } }), true);
	// SVG 无效 warning → 需要重试。
	assert.equal(needsFigureRetry({ set: { groups: [], questions: [] } }, ['某题：有一处图形无法转换为有效 SVG，已忽略。']), true);
	// 图形齐全且无 warning → 不需要重试。
	assert.equal(needsFigureRetry({ set: { groups: [], questions: [{ hasVisual: true, figures: [{ kind: 'svg' }] }] } }), false);
	assert.equal(needsFigureRetry({ set: { groups: [], questions: [] } }, []), false);
});

test('sanitizeSvg：放宽常见 SVG 元素，仍移除脚本/foreignObject/事件/外链', () => {
	const svg = [
		'<svg width="240" height="160">',
		'<defs><marker id="arrow" markerWidth="6" markerHeight="6"><path d="M0,0 L6,3 L0,6 z"/></marker>',
		'<linearGradient id="g1"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient></defs>',
		'<style>.cls{stroke:#000;fill:none}</style>',
		'<g class="cls"><use href="#arrow"/><rect x="1" y="1" width="40" height="20"/>',
		'<circle cx="60" cy="10" r="5"/><ellipse cx="80" cy="10" rx="8" ry="4"/>',
		'<path d="M0,0 L10,10"/><polygon points="0,0 4,8 8,0"/><polyline points="0,10 4,2 8,10"/>',
		'<text x="2" y="14">类名</text><tspan x="2" y="28">字段</tspan></g>',
		'<image href="https://evil.example/x.png" width="10" height="10"/>',
		'<script>alert(1)</script><foreignObject><div>x</div></foreignObject>',
		'<rect x="0" y="0" width="5" height="5" onclick="alert(2)"/>',
		'</svg>'
	].join('');
	const cleaned = sanitizeSvg(svg);
	assert.ok(cleaned.length > 0);
	for (const tag of ['<defs', '<marker', '<linearGradient', '<style', '<g', '<use', '<rect', '<circle', '<ellipse', '<path', '<polygon', '<polyline', '<text', '<tspan']) {
		assert.ok(cleaned.includes(tag), `应保留常见 SVG 元素 ${tag}`);
	}
	assert.ok(!cleaned.includes('<script'));
	assert.ok(!cleaned.includes('foreignObject'));
	assert.ok(!cleaned.includes('onclick'));
	assert.ok(!cleaned.includes('evil.example'));
	// 内部引用保留、外链 href 移除。
	const href = sanitizeSvg('<svg viewBox="0 0 10 10"><use href="#a"/><use href="https://x.example/y"/></svg>');
	assert.ok(href.includes('href="#a"'));
	assert.ok(!href.includes('https://x.example'));
	// style 中的 @import 与外链 url 清理。
	const style = sanitizeSvg('<svg viewBox="0 0 10 10"><style>@import url(https://x.example/a.css); .a{fill:url(https://x.example/b.png);}</style><rect class="a"/></svg>');
	assert.ok(style.includes('<style'));
	assert.ok(!style.includes('@import'));
	assert.ok(!style.includes('https://x.example'));
});


test('normalizeParsedSet：不保留 page/__page 字段，figure image 用 path', () => {
	const raw = JSON.stringify({
		groups: [{ id: 'g1', page: 2, material: '共用材料' }],
		questions: [
			{ number: '1', page: 3, type: 'single', stem: 'q1', options: ['甲', '乙'], answer: 'A' },
			{ number: '2', type: 'single', stem: 'q2', options: ['甲', '乙'], answer: 'B' }
		]
	});
	const parsed = normalizeParsedSet(raw, { courseId: 'c1', setId: 's1' });
	// page 字段删除后不再进入内部结构。
	for (const head of [...parsed.set.questions, ...parsed.set.groups]) {
		assert.equal(head.__page, undefined);
		assert.equal(head.page, undefined);
	}
	// 跨组合并后也不出现内部 page 字段。
	const merged = mergeParsedSets([parsed, parsed], { courseId: 'c1', setId: 's1' });
	for (const head of [...merged.set.questions, ...merged.set.groups]) {
		assert.equal(head.__page, undefined);
		assert.equal(head.__pageRelPath, undefined);
	}
});

test('normalizeGradeResult：脏 JSON / verdict 归一 / score 归一 / refs 过滤', () => {
	const raw = '批改结果如下：\n```json\n{"verdict":"部分正确","score":72.4,"summary":"思路对但缺少夹逼定理的证明步骤。","suggestions":["补上夹逼定理的两侧不等式","写出取极限的步骤","注意 x→0 的条件"],"correctedAnswer":["由夹逼定理得 1"],"refs":["第一章/1.1 极限.pdf","幻觉章节/不存在.pdf"]}\n```';
	const { result, warnings } = normalizeGradeResult(raw, {
		allowedRefs: ['第一章/1.1 极限.pdf']
	});
	assert.equal(result.verdict, 'partial');
	assert.equal(result.score, 72);
	// 新结构：先标准答案 → 再错因 → 再解析；旧字段 summary/correctedAnswer 兼容回退。
	assert.equal(result.standardAnswer, '由夹逼定理得 1');
	assert.match(result.mistakeAnalysis, /夹逼/);
	assert.match(result.summary, /夹逼/);
	assert.equal(result.suggestions.length, 3);
	assert.equal(result.correctedAnswer, '由夹逼定理得 1');
	assert.deepEqual(result.refs, ['第一章/1.1 极限.pdf']);
	assert.ok(warnings.some((warning) => warning.includes('引用')));

	// score 0-1 比例兼容、越界 clamp。
	const ratio = normalizeGradeResult(JSON.stringify({ verdict: 'correct', score: 0.8, summary: 'good', suggestions: ['ok'] }), { allowedRefs: [] });
	assert.equal(ratio.result.score, 80);
	const overflow = normalizeGradeResult(JSON.stringify({ verdict: 'incorrect', score: 150, summary: 'bad', suggestions: ['a'] }), { allowedRefs: [] });
	assert.equal(overflow.result.score, 100);
	const negative = normalizeGradeResult(JSON.stringify({ verdict: 'incorrect', score: -5, summary: 'bad', suggestions: ['a'] }), { allowedRefs: [] });
	assert.equal(negative.result.score, 0);

	// verdict 非法 → 按 score 推断；verdict 中文「正确」→ correct。
	const invalidVerdict = normalizeGradeResult(JSON.stringify({ verdict: 'maybe', score: 90, summary: 'ok', suggestions: ['a'] }), { allowedRefs: [] });
	assert.equal(invalidVerdict.result.verdict, 'correct');
	assert.ok(invalidVerdict.warnings.some((warning) => warning.includes('verdict')));
	const chinese = normalizeGradeResult(JSON.stringify({ verdict: '正确', score: 100, summary: 'ok', suggestions: [] }), { allowedRefs: [] });
	assert.equal(chinese.result.verdict, 'correct');
	assert.ok(chinese.warnings.some((warning) => warning.includes('建议')));

	// result 包装 + 无法解析抛中文错误。
	const wrapped = normalizeGradeResult(JSON.stringify({ result: { verdict: 'incorrect', score: 10, summary: 'wrong', suggestions: ['看课本'] } }), { allowedRefs: [] });
	assert.equal(wrapped.result.verdict, 'incorrect');
	assert.throws(
		() => normalizeGradeResult('抱歉，我无法批改。', { allowedRefs: [] }),
		(error) => error instanceof Error && /无法解析|没有/.test(error.message)
	);
});


test('normalizeParsedSet：figure image path 归一（合法保留 / 缺失丢弃 / 与 SVG 混合）', () => {
	const raw = JSON.stringify({
		questions: [{
			number: '1',
			page: 2,
			type: 'single',
			stem: '带图题',
			options: ['甲', '乙'],
			hasVisual: true,
			figures: [
				// 合法：Agent 生成的图片绝对路径。
				{ kind: 'image', path: '/tmp/agent-fig1.png', alt: '裁剪图1' },
				// 合法：兼容 absPath 字段。
				{ kind: 'image', absPath: '/tmp/agent-fig2.png' },
				// 非法：kind=image 但缺 path。
				{ kind: 'image', x: 10, y: 10, width: 20, height: 20 },
				// SVG 形态仍保留。
				{ kind: 'svg', svg: '<svg viewBox="0 0 10 10"><rect width="5" height="5"/></svg>', alt: 'SVG图' }
			]
		}]
	});
	const { set, warnings } = normalizeParsedSet(raw, { courseId: 'c1', setId: 's1' });
	const figures = set.questions[0].figures;
	assert.equal(figures.length, 3);
	assert.deepEqual(figures[0], { kind: 'image', path: '/tmp/agent-fig1.png', alt: '裁剪图1' });
	assert.deepEqual(figures[1], { kind: 'image', path: '/tmp/agent-fig2.png', alt: '图2' });
	assert.equal(figures[2].kind, 'svg');
	assert.ok(warnings.some((warning) => warning.includes('缺少 path')), JSON.stringify(warnings));
	assert.equal(set.questions[0].hasVisual, true);
});

test('clampCropBox：纯函数严格 clamp 到图片范围内', () => {
	// 负坐标 + 超出宽高 → clamp 到整图。
	assert.deepEqual(clampCropBox({ x: -10, y: -5, width: 500, height: 500 }, 100, 80), { x: 0, y: 0, width: 100, height: 80 });
	// 内部区域保持不变。
	assert.deepEqual(clampCropBox({ x: 10, y: 10, width: 30, height: 20 }, 100, 80), { x: 10, y: 10, width: 30, height: 20 });
	// 起点靠近右下角 → 宽高被裁到剩余范围。
	assert.deepEqual(clampCropBox({ x: 90, y: 70, width: 30, height: 20 }, 100, 80), { x: 90, y: 70, width: 10, height: 10 });
	// 非法：宽高 <= 0、非数字、图片尺寸非法。
	assert.equal(clampCropBox({ x: 0, y: 0, width: 0, height: 10 }, 100, 80), null);
	assert.equal(clampCropBox({ x: 0, y: 0, width: 10, height: -1 }, 100, 80), null);
	assert.equal(clampCropBox({ x: 'a', y: 0, width: 10, height: 10 }, 100, 80), null);
	assert.equal(clampCropBox({ x: 0, y: 0, width: 10, height: 10 }, 0, 0), null);
});

/** 找一个可用的 Python 解释器（bundled 优先）。 */
function findTestPython() {
	const candidates = [];
	const envConfigured = (process.env.DSH_PYTHON || process.env.PYTHON || '').trim();
	if (envConfigured !== '') candidates.push(envConfigured);
	const resources = resolveResourcesRoot();
	if (typeof resources === 'string' && resources !== '') {
		candidates.push(join(resources, 'runtime', 'primary-runtime', 'dependencies', 'python', 'bin', 'python3'));
	}
	try {
		candidates.push(join(resolveDshHome(), 'dsh-runtimes', 'dsh-primary-runtime', 'dependencies', 'python', 'bin', 'python3'));
	} catch {
		/* ignore */
	}
	if (process.env.HOME) {
		candidates.push(join(process.env.HOME, '.dsh', 'dsh-runtimes', 'dsh-primary-runtime', 'dependencies', 'python', 'bin', 'python3'));
		if (process.env.HOME) candidates.push(join(process.env.HOME, 'dsh-runtimes', 'dsh-primary-runtime', 'dependencies', 'python', 'bin', 'python3'));
	}
	for (const candidate of candidates) {
		if (existsSync(candidate)) return candidate;
	}
	return null;
}

/** 跑一段 Python 脚本。 */
function runTestPython(pythonPath, script, args) {
	return new Promise((resolvePromise, rejectPromise) => {
		execFile(pythonPath, ['-c', script, ...args], { timeout: 60_000, maxBuffer: 4 * 1024 * 1024 }, (error, stdout, stderr) => {
			if (error) rejectPromise(new Error(String(stderr || error.message)));
			else resolvePromise(String(stdout));
		});
	});
}

test('cropImageRegion：真实裁剪 / 越界 clamp / 中文错误（Electron/Python 回退）', { timeout: 120_000 }, async (t) => {
	const pythonPath = findTestPython();
	if (pythonPath === null) {
		t.skip('环境不满足：没有可用的 Python，无法生成测试图片并验证裁剪（Electron 在 node --test 下不可用）');
		return;
	}
	const workDir = await mkdtemp(join(tmpdir(), 'pm-crop-test-'));
	try {
		const inputPath = join(workDir, 'input.png');
		try {
			await runTestPython(
				pythonPath,
				'import sys\nfrom PIL import Image\nImage.new("RGB", (100, 80), (200, 10, 10)).save(sys.argv[1])',
				[inputPath]
			);
		} catch (error) {
			t.skip(`环境不满足：Python/Pillow 不可用（${error.message}），跳过真实裁剪测试`);
			return;
		}
		assert.ok(existsSync(inputPath));
		assert.deepEqual(await readImageDimensions(inputPath), { width: 100, height: 80 });

		// 正常裁剪。
		const outputPath = join(workDir, 'crop.png');
		const result = await cropImageRegion({ inputPath, outputPath, x: 10, y: 10, width: 30, height: 20 });
		assert.ok(['electron', 'python'].includes(result.backend));
		assert.equal(result.width, 30);
		assert.equal(result.height, 20);
		assert.deepEqual(await readImageDimensions(outputPath), { width: 30, height: 20 });
		const png = await readFile(outputPath);
		assert.equal(png.subarray(0, 4).toString('hex'), '89504e47', '输出应为 PNG');

		// 越界 bbox 会被 clamp 到图片剩余范围。
		const clampedPath = join(workDir, 'clamped.png');
		const clamped = await cropImageRegion({ inputPath, outputPath: clampedPath, x: 50, y: 40, width: 500, height: 500 });
		assert.equal(clamped.width, 50);
		assert.equal(clamped.height, 40);
		assert.deepEqual(await readImageDimensions(clampedPath), { width: 50, height: 40 });

		// 非法 bbox / 不存在的输入 → 中文错误。
		await assert.rejects(
			() => cropImageRegion({ inputPath, outputPath: join(workDir, 'bad.png'), x: 0, y: 0, width: 0, height: 10 }),
			(error) => /图片裁剪失败/.test(error.message)
		);
		await assert.rejects(
			() => cropImageRegion({ inputPath: join(workDir, 'nope.png'), outputPath: join(workDir, 'bad2.png'), x: 0, y: 0, width: 10, height: 10 }),
			(error) => /输入图片不存在/.test(error.message)
		);
	} finally {
		await rm(workDir, { recursive: true, force: true });
	}
});


test('normalizeGradeResult：结构化字段（standardAnswer/mistakeAnalysis/explanation）优先，旧字段回退', () => {
	const raw = JSON.stringify({
		verdict: 'incorrect',
		score: 20,
		standardAnswer: '答案是 1（第一重要极限）',
		mistakeAnalysis: '你没有说明 sin(x)/x 的极限，且把 x→0 写成了 x→∞。',
		explanation: '由夹逼定理：cos x ≤ sin x / x ≤ 1，两侧极限都为 1，所以极限为 1。',
		suggestions: ['记住第一重要极限', '注意极限过程'],
		refs: []
	});
	const { result } = normalizeGradeResult(raw, { allowedRefs: [] });
	assert.equal(result.standardAnswer, '答案是 1（第一重要极限）');
	assert.match(result.mistakeAnalysis, /x→∞/);
	assert.match(result.explanation, /夹逼定理/);
	assert.equal(result.suggestions.length, 2);
	// 旧字段：summary 缺省时回退 mistakeAnalysis；correctedAnswer 缺省时回退 standardAnswer。
	assert.equal(result.summary, result.mistakeAnalysis);
	assert.equal(result.correctedAnswer, result.standardAnswer);

	// 完全旧格式（只有 summary/correctedAnswer）也能读出结构化字段。
	const legacy = normalizeGradeResult(JSON.stringify({
		verdict: 'correct',
		score: 100,
		summary: '答案正确。',
		correctedAnswer: 'B',
		suggestions: ['保持']
	}), { allowedRefs: [] });
	assert.equal(legacy.result.standardAnswer, 'B');
	assert.equal(legacy.result.mistakeAnalysis, '答案正确。');
	assert.equal(legacy.result.explanation, '答案正确。');
});


