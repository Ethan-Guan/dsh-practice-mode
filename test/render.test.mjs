/**
 * host-llm-dev — render.js 集成测试。
 *
 * 运行：node --test test/render.test.mjs
 *
 * 用 python-docx 生成一个临时 docx，经 LibreOffice Kit `convert` 转成 PDF，
 * 再经 `render` 渲染为页面 PNG，断言页面图片真实存在且为合法 PNG。
 * 环境不满足（找不到 LibreOffice Kit / Node 运行时 / python-docx）时 skip 并给出原因。
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createRender } from '../lib/host/render.js';
import { resolveNodeBinary, resolveOfficeCli } from '../lib/host/paths.js';

/**
 * 测试进程不在 Desktop Electron 主进程里，process.resourcesPath 不存在，
 * 因此显式指向本机 Desktop 应用资源目录（paths.js 会在每次调用时读取该属性）。
 */
const RESOURCES_ROOT = '/Applications/DeepSeek Harness.app/Contents/Resources';
const PYTHON = process.env.DSH_TEST_PYTHON
	?? '/Users/ethan/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/python/bin/python3';

if (typeof process.resourcesPath !== 'string' || process.resourcesPath === '') {
	try {
		process.resourcesPath = RESOURCES_ROOT;
	} catch {
		/* 只读属性时忽略，后续会因找不到 CLI 而 skip */
	}
}

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** 判断跳过原因；可跑时返回 null。 */
function skipReason() {
	if (typeof resolveOfficeCli() !== 'string' || !existsSync(resolveOfficeCli())) {
		return `未找到 LibreOffice Kit CLI（${resolveOfficeCli() ?? 'undefined'}），跳过真实渲染测试`;
	}
	if (!existsSync(resolveNodeBinary())) {
		return `未找到 LibreOffice Kit 所需的 Node 运行时（${resolveNodeBinary()}），跳过真实渲染测试`;
	}
	if (!existsSync(PYTHON)) {
		return `未找到用于生成测试 docx 的 Python（${PYTHON}），跳过真实渲染测试`;
	}
	return null;
}

/** 用 python-docx 生成一个含标题、题干、选项、答案的docx。 */
function generateDocx(filePath) {
	const script = [
		'import sys',
		'import docx',
		'from docx.shared import Pt',
		'path = sys.argv[1]',
		'document = docx.Document()',
		'document.add_heading("刷题模式渲染测试", level=1)',
		'paragraph = document.add_paragraph("1. 已知函数 f(x)=x^2，求 f(2) 的值。")',
		'paragraph.runs[0].font.size = Pt(14)',
		'document.add_paragraph("A. 1    B. 2    C. 4    D. 8")',
		'document.add_paragraph("答案：C")',
		'document.add_paragraph("2. 判断题：函数 y=x 是奇函数。（  ）")',
		'document.save(path)',
		'print("saved")'
	].join('\n');
	return new Promise((resolvePromise, rejectPromise) => {
		const child = spawn(PYTHON, ['-c', script, filePath], { stdio: ['ignore', 'pipe', 'pipe'] });
		let stderr = '';
		child.stderr.on('data', (chunk) => {
			stderr += String(chunk);
		});
		child.on('error', rejectPromise);
		child.on('close', (code) => {
			if (code === 0 && existsSync(filePath)) resolvePromise();
			else rejectPromise(new Error(`生成测试 docx 失败（exit ${code}）：${stderr.slice(0, 400)}`));
		});
	});
}

test('render.officeToPdf：输入文件不存在时抛中文错误', async () => {
	const render = createRender({ logger: { warn() {}, info() {}, debug() {}, error() {} } });
	await assert.rejects(
		() => render.officeToPdf('/tmp/definitely-not-exists-pm-test.docx', `${tmpdir()}/pm-test-out.pdf`),
		(error) => error instanceof Error && /输入文件不存在/.test(error.message)
	);
});

test('render：docx → convert → render 真实生成页面 PNG', { timeout: 240_000 }, async (t) => {
	const reason = skipReason();
	if (reason !== null) {
		t.skip(reason);
		return;
	}
	const render = createRender({ logger: { warn() {}, info() {}, debug() {}, error() {} } });
	const available = await render.available();
	if (!available) {
		t.skip('LibreOffice Kit 能力探测失败（render.available() === false），跳过真实渲染测试');
		return;
	}
	assert.equal(available, true);

	const workDir = await mkdtemp(join(tmpdir(), 'pm-render-test-'));
	try {
		const docxPath = join(workDir, '题目测试.docx');
		const pdfPath = join(workDir, '题目测试.pdf');
		const pagesDir = join(workDir, 'pages');

		await generateDocx(docxPath);
		assert.ok(existsSync(docxPath));

		// 1) docx → pdf
		await render.officeToPdf(docxPath, pdfPath);
		assert.ok(existsSync(pdfPath), 'PDF 应已生成');
		const pdfBytes = await readFile(pdfPath);
		assert.equal(pdfBytes.subarray(0, 5).toString('latin1'), '%PDF-', '输出应为合法 PDF');
		assert.ok(pdfBytes.byteLength > 1000);

		// 2) pdf → 页面 PNG（输出目录必须是全新目录）
		const result = await render.renderPages(pdfPath, pagesDir, { dpi: 120 });
		assert.ok(Array.isArray(result.pages) && result.pages.length >= 1, '至少应渲染出一页');
		assert.ok(Array.isArray(result.missingFonts));
		const first = result.pages[0];
		assert.equal(typeof first.path, 'string');
		assert.ok(existsSync(first.path), `页面图片应存在：${first.path}`);
		assert.ok(first.width > 0 && first.height > 0, '页面应有宽高');
		assert.ok(first.page >= 1);
		const png = await readFile(first.path);
		assert.ok(png.byteLength > 1000, '页面 PNG 不应是空文件');
		assert.ok(png.subarray(0, 8).equals(PNG_MAGIC), '页面图片应为合法 PNG');

		// 3) 重复使用已存在的输出目录应报错（CLI 要求 fresh directory）。
		await assert.rejects(
			() => render.renderPages(pdfPath, pagesDir),
			(error) => error instanceof Error && /全新目录|输出目录/.test(error.message)
		);
	} finally {
		await rm(workDir, { recursive: true, force: true });
	}
});
