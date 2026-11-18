/**
 * Host 文档抽取模块测试（node --test test/extract.test.mjs）。
 *
 * docx/pptx fixture 由 bundled python 在 test/fixtures/ 下现场生成（脚本
 * test/fixtures/make_fixtures.py）；PDF 用 LibreOffice Kit CLI 从 docx 转出。
 * 若生成环境不可用（缺 python / 缺 LibreOffice Kit），相关用例 skip 并说明原因。
 * 所有临时目录与生成物在测试结束后清理。
 */

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test, before, after } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { deflateSync } from 'node:zlib';

import { DOC_EXTS, extractDocument, isSupportedDocExt } from '../lib/host/extract/index.js';
import { parseZip, readZip } from '../lib/host/extract/zip.js';

const execFileAsync = promisify(execFile);

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(HERE, 'fixtures');
const GENERATOR = join(FIXTURES_DIR, 'make_fixtures.py');

const PYTHON =
	process.env.PRACTICE_PYTHON ||
	'/Users/ethan/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/python/bin/python3';
const NODE = process.execPath;
const OFFICE_CLI =
	process.env.PRACTICE_OFFICE_CLI ||
	'/Applications/DeepSeek Harness.app/Contents/Resources/app.asar.unpacked/dsh/node_modules/@deepseek-ai/libreoffice-kit/lib/cli.js';

const GENERATED_FILES = ['sample.docx', 'sample.pptx', 'sample.pdf', 'sample-slides.pdf', 'sample.png'];

const env = {
	fixtureError: null,
	pdfError: null,
	pdfSlidesError: null,
	docx: join(FIXTURES_DIR, 'sample.docx'),
	pptx: join(FIXTURES_DIR, 'sample.pptx'),
	pdf: join(FIXTURES_DIR, 'sample.pdf'),
	pdfSlides: join(FIXTURES_DIR, 'sample-slides.pdf'),
};

async function runPythonGenerator() {
	await execFileAsync(PYTHON, [GENERATOR, FIXTURES_DIR], { timeout: 120_000 });
	await readFile(env.docx);
	await readFile(env.pptx);
}

async function convertOfficeToPdf(inputPath, outputPath) {
	await readFile(OFFICE_CLI);
	await rm(outputPath, { force: true });
	await execFileAsync(NODE, [OFFICE_CLI, 'convert', '--input', inputPath, '--output', outputPath], {
		timeout: 120_000,
	});
	await readFile(outputPath);
}

before(async () => {
	await mkdir(FIXTURES_DIR, { recursive: true });
	try {
		await runPythonGenerator();
	} catch (error) {
		env.fixtureError = `无法生成 docx/pptx fixture（${error instanceof Error ? error.message : String(error)}）`;
	}
	if (!env.fixtureError) {
		try {
			await convertOfficeToPdf(env.docx, env.pdf);
		} catch (error) {
			env.pdfError = `无法用 LibreOffice Kit 生成 PDF fixture（${error instanceof Error ? error.message : String(error)}）`;
		}
		try {
			await convertOfficeToPdf(env.pptx, env.pdfSlides);
		} catch (error) {
			env.pdfSlidesError = `无法用 LibreOffice Kit 生成多页 PDF fixture（${error instanceof Error ? error.message : String(error)}）`;
		}
	}
});

after(async () => {
	await Promise.all(
		GENERATED_FILES.map((name) => rm(join(FIXTURES_DIR, name), { force: true }).catch(() => {})),
	);
});

/** 建一个测试用临时目录，测试结束自动清理。 */
async function makeTempDir(t) {
	const dir = await mkdtemp(join(tmpdir(), 'practice-extract-'));
	t.after(() => rm(dir, { recursive: true, force: true }).catch(() => {}));
	return dir;
}

// ---------------------------------------------------------------------------
// 合成夹具：stored zip / xref stream PDF（不依赖外部工具）
// ---------------------------------------------------------------------------

/** 构造只含 stored（method=0）条目的最小 ZIP，用于验证 zip.js 的 stored 分支。 */
function buildStoredZip(files) {
	const localParts = [];
	const centralParts = [];
	let offset = 0;
	for (const file of files) {
		const name = Buffer.from(file.name, 'utf8');
		const data = Buffer.isBuffer(file.content) ? file.content : Buffer.from(String(file.content), 'utf8');
		const local = Buffer.alloc(30);
		local.writeUInt32LE(0x04034b50, 0);
		local.writeUInt16LE(20, 4); // version needed
		local.writeUInt16LE(0x0800, 6); // UTF-8 文件名
		local.writeUInt32LE(data.length, 18);
		local.writeUInt32LE(data.length, 22);
		local.writeUInt16LE(name.length, 26);
		const central = Buffer.alloc(46);
		central.writeUInt32LE(0x02014b50, 0);
		central.writeUInt16LE(20, 4);
		central.writeUInt16LE(20, 6);
		central.writeUInt16LE(0x0800, 8);
		central.writeUInt32LE(data.length, 20);
		central.writeUInt32LE(data.length, 24);
		central.writeUInt16LE(name.length, 28);
		central.writeUInt32LE(offset, 42);
		localParts.push(local, name, data);
		centralParts.push(central, name);
		offset += local.length + name.length + data.length;
	}
	const centralBuffer = Buffer.concat(centralParts);
	const eocd = Buffer.alloc(22);
	eocd.writeUInt32LE(0x06054b50, 0);
	eocd.writeUInt16LE(files.length, 8);
	eocd.writeUInt16LE(files.length, 10);
	eocd.writeUInt32LE(centralBuffer.length, 12);
	eocd.writeUInt32LE(offset, 16);
	return Buffer.concat([...localParts, centralBuffer, eocd]);
}

/**
 * 构造一个使用 xref stream + 对象流 + FlateDecode + ToUnicode 的最小 PDF。
 * 用于覆盖真实 LibreOffice 输出之外的解析路径（/Type /XRef、/Type /ObjStm）。
 */
function buildXrefStreamPdf() {
	const contentDeflated = deflateSync(Buffer.from('BT\n/F1 12 Tf\n72 720 Td\n<0102>Tj\nET\n', 'latin1'));
	const cmapPlain = Buffer.from(
		`/CIDInit /ProcSet findresource begin
12 dict begin
begincmap
1 begincodespacerange
<00> <FF>
endcodespacerange
2 beginbfchar
<01> <4E2D>
<02> <6587>
endbfchar
endcmap
CMapName currentdict /CMap defineresource pop
end
end
`,
		'latin1',
	);
	const cmapDeflated = deflateSync(cmapPlain);

	const bodies = [
		'<< /Type /Catalog /Pages 2 0 R >>',
		'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
		'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
	];
	let header = '';
	let relative = 0;
	for (let index = 0; index < bodies.length; index++) {
		header += `${index + 1} ${relative} `;
		relative += bodies[index].length + 1;
	}
	const first = header.length;
	const objStmPlain = Buffer.from(`${header}${bodies.join('\n')}\n`, 'latin1');
	const objStmDeflated = deflateSync(objStmPlain);

	let out = Buffer.from('%PDF-1.5\n%\xE2\xE3\xCF\xD3\n', 'latin1');
	const offsets = new Map();
	const pushStream = (num, dict, data) => {
		offsets.set(num, out.length);
		out = Buffer.concat([
			out,
			Buffer.from(`${num} 0 obj\n${dict}\nstream\n`, 'latin1'),
			data,
			Buffer.from('\nendstream\nendobj\n', 'latin1'),
		]);
	};

	pushStream(4, `<< /Length ${contentDeflated.length} /Filter /FlateDecode >>`, contentDeflated);
	pushStream(5, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /FirstChar 0 /LastChar 2 /Widths [0 500 500] /ToUnicode 6 0 R >>', Buffer.alloc(0));
	pushStream(6, `<< /Length ${cmapDeflated.length} /Filter /FlateDecode >>`, cmapDeflated);
	pushStream(7, `<< /Type /ObjStm /N 3 /First ${first} /Filter /FlateDecode /Length ${objStmDeflated.length} >>`, objStmDeflated);

	const xrefOffset = out.length;
	const xrefBytes = [];
	const entry = (type, field2, field3) => {
		xrefBytes.push(
			type,
			(field2 >>> 24) & 0xff,
			(field2 >>> 16) & 0xff,
			(field2 >>> 8) & 0xff,
			field2 & 0xff,
			(field3 >>> 8) & 0xff,
			field3 & 0xff,
		);
	};
	entry(0, 0, 0xffff);
	entry(2, 7, 0);
	entry(2, 7, 1);
	entry(2, 7, 2);
	for (const num of [4, 5, 6, 7]) entry(1, offsets.get(num), 0);
	entry(1, xrefOffset, 0);

	// 用 PNG Up predictor（Predictor 12）压缩 xref 流，覆盖 applyPredictor 分支
	const rowLength = 7;
	const rawXref = Buffer.from(xrefBytes);
	const encodedRows = [];
	let previousRow = Buffer.alloc(rowLength);
	for (let start = 0; start < rawXref.length; start += rowLength) {
		const row = rawXref.subarray(start, start + rowLength);
		const encoded = Buffer.alloc(rowLength + 1);
		encoded[0] = 2; // PNG Up
		for (let index = 0; index < rowLength; index++) {
			encoded[index + 1] = (row[index] - previousRow[index]) & 0xff;
		}
		encodedRows.push(encoded);
		previousRow = row;
	}
	const xrefData = deflateSync(Buffer.concat(encodedRows));
	pushStream(
		8,
		`<< /Type /XRef /Size 9 /W [1 4 2] /Index [0 9] /Root 1 0 R /Filter /FlateDecode /DecodeParms << /Predictor 12 /Columns 7 >> /Length ${xrefData.length} >>`,
		xrefData,
	);
	out = Buffer.concat([out, Buffer.from(`startxref\n${xrefOffset}\n%%EOF\n`, 'latin1')]);
	return out;
}

// ---------------------------------------------------------------------------
// 接口 / 扩展名
// ---------------------------------------------------------------------------

test('DOC_EXTS 与 isSupportedDocExt 符合契约', () => {
	assert.deepEqual([...DOC_EXTS], [
		'.txt',
		'.md',
		'.markdown',
		'.csv',
		'.json',
		'.html',
		'.htm',
		'.docx',
		'.pptx',
		'.pdf',
	]);
	for (const ext of DOC_EXTS) {
		assert.equal(isSupportedDocExt(ext), true, ext);
		assert.equal(isSupportedDocExt(ext.slice(1)), true, `无点写法 ${ext}`);
		assert.equal(isSupportedDocExt(ext.toUpperCase()), true, `大写写法 ${ext}`);
	}
	assert.equal(isSupportedDocExt('.xlsx'), false);
	assert.equal(isSupportedDocExt('.doc'), false);
	assert.equal(isSupportedDocExt(''), false);
	assert.equal(isSupportedDocExt(null), false);
	assert.equal(isSupportedDocExt(undefined), false);
});

// ---------------------------------------------------------------------------
// 纯文本类
// ---------------------------------------------------------------------------

test('txt / md 抽取：保留结构、统一换行', async (t) => {
	const dir = await makeTempDir(t);
	const txtPath = join(dir, 'a.txt');
	const mdPath = join(dir, 'b.md');
	await writeFile(txtPath, '纯文本第一行\r\n纯文本第二行\r\n');
	await writeFile(mdPath, '# 标题\n\n- 列表一\n- 列表二\n\n**加粗**');

	const txt = await extractDocument({ absPath: txtPath, ext: '.txt' });
	assert.equal(txt.text, '纯文本第一行\n纯文本第二行');
	assert.deepEqual(txt.warnings, []);
	assert.deepEqual(txt.images, []);

	const md = await extractDocument({ absPath: mdPath, ext: '.md' });
	assert.match(md.text, /# 标题/);
	assert.match(md.text, /- 列表一\n- 列表二/);
	assert.match(md.text, /\*\*加粗\*\*/);

	const markdown = await extractDocument({ absPath: mdPath, ext: 'MARKDOWN' });
	assert.match(markdown.text, /# 标题/);
});

test('html 抽取：去 script/style/head、解实体、保留块级换行', async (t) => {
	const dir = await makeTempDir(t);
	const htmlPath = join(dir, 'page.html');
	await writeFile(
		htmlPath,
		`<!DOCTYPE html>
<html><head><title>不该出现</title><style>.hidden{display:none}</style></head>
<body>
<h1>课程标题</h1>
<p>段落 &amp; 实体 &lt;标签&gt; &#20013;&#x6587;</p>
<script>alert('不该出现')</script>
<ul><li>要点一</li><li>要点二</li></ul>
</body></html>`,
	);

	const result = await extractDocument({ absPath: htmlPath, ext: '.html' });
	assert.match(result.text, /课程标题/);
	assert.match(result.text, /段落 & 实体 <标签> 中文/);
	assert.match(result.text, /要点一/);
	assert.match(result.text, /要点二/);
	assert.doesNotMatch(result.text, /不该出现/);
	assert.doesNotMatch(result.text, /alert/);
	assert.doesNotMatch(result.text, /\.hidden/);
});

test('csv / json 抽取', async (t) => {
	const dir = await makeTempDir(t);
	const csvPath = join(dir, 'score.csv');
	const jsonPath = join(dir, 'data.json');
	await writeFile(csvPath, '姓名,分数\r\n张三,90\r\n');
	await writeFile(jsonPath, '{"course":"高等数学","count":3}');

	const csv = await extractDocument({ absPath: csvPath, ext: '.csv' });
	assert.match(csv.text, /姓名,分数/);
	assert.match(csv.text, /张三,90/);

	const json = await extractDocument({ absPath: jsonPath, ext: '.json' });
	assert.match(json.text, /"course": "高等数学"/);
	assert.match(json.text, /"count": 3/);

	const brokenJsonPath = join(dir, 'broken.json');
	await writeFile(brokenJsonPath, '{not valid json');
	const broken = await extractDocument({ absPath: brokenJsonPath, ext: '.json' });
	assert.match(broken.text, /\{not valid json/);
	assert.equal(broken.warnings.length, 1);
});

test('txt：非 UTF-8（GBK）编码按 GBK 解码并给 warning', async (t) => {
	const dir = await makeTempDir(t);
	const gbkPath = join(dir, 'gbk.txt');
	// “中文”的 GBK 字节
	await writeFile(gbkPath, Buffer.from([0xd6, 0xd0, 0xce, 0xc4]));
	const result = await extractDocument({ absPath: gbkPath, ext: '.txt' });
	assert.equal(result.text, '中文');
	assert.ok(result.warnings.some((warning) => warning.includes('GBK')));
});

// ---------------------------------------------------------------------------
// docx
// ---------------------------------------------------------------------------

test('docx：段落/表格阅读顺序 + 图片占位与图片二进制', async (t) => {
	if (env.fixtureError) return t.skip(env.fixtureError);

	const zip = await readZip(env.docx);
	assert.equal(zip.has('word/document.xml'), true);
	assert.ok(zip.read('word/document.xml').length > 0);

	const result = await extractDocument({ absPath: env.docx, ext: '.docx' });
	const text = result.text;

	// 中文段落内容
	assert.match(text, /刷题模式文档抽取测试/);
	assert.match(text, /第一段：中文段落内容，用于验证段落顺序。/);
	assert.match(text, /第二段：包含 English words 与数字 12345。/);
	// 表格单元格按行输出
	assert.match(text, /表头甲 \| 表头乙/);
	assert.match(text, /数据一 \| 数据二/);
	// 阅读顺序：标题 -> 第一段 -> 表格 -> 第三段 -> 图片 -> 第四段
	const order = ['刷题模式文档抽取测试', '第一段', '表头甲', '第三段', '[[图:media/', '第四段']
		.map((keyword) => text.indexOf(keyword));
	for (const index of order) assert.ok(index >= 0, `缺少片段：${text}`);
	for (let index = 1; index < order.length; index++) {
		assert.ok(order[index - 1] < order[index], `片段顺序错误：${JSON.stringify(order)}`);
	}

	// 图片：占位符 + 二进制 + mediaType
	assert.equal(result.images.length, 1);
	const [image] = result.images;
	assert.equal(image.name, 'media/image1.png');
	assert.equal(image.mediaType, 'image/png');
	assert.ok(Buffer.isBuffer(image.data));
	assert.deepEqual([...image.data.subarray(0, 4)], [0x89, 0x50, 0x4e, 0x47]);
	assert.deepEqual(result.warnings, []);
});

test('docx：maxChars 截断并加 warning', async (t) => {
	if (env.fixtureError) return t.skip(env.fixtureError);

	const result = await extractDocument({ absPath: env.docx, ext: '.docx', maxChars: 12 });
	assert.equal(result.text.length, 12);
	assert.equal(result.text, '刷题模式文档抽取测试\n第');
	assert.ok(result.warnings.some((warning) => warning.includes('上限') && warning.includes('截断')));
});

test('docx：损坏文件不抛错，返回空文本 + warning', async (t) => {
	const dir = await makeTempDir(t);
	const badPath = join(dir, 'broken.docx');
	await writeFile(badPath, 'this is not a zip file');
	const result = await extractDocument({ absPath: badPath, ext: '.docx' });
	assert.equal(result.text, '');
	assert.ok(result.warnings.length >= 1);
	assert.ok(result.warnings[0].includes('docx'));
});

// ---------------------------------------------------------------------------
// pptx
// ---------------------------------------------------------------------------

test('pptx：两页文本顺序、表格与图片占位', async (t) => {
	if (env.fixtureError) return t.skip(env.fixtureError);

	const result = await extractDocument({ absPath: env.pptx, ext: '.pptx' });
	const text = result.text;

	assert.match(text, /\[第1页\]/);
	assert.match(text, /\[第2页\]/);
	assert.match(text, /第一页标题/);
	assert.match(text, /第一页正文：中文内容/);
	assert.match(text, /第二页标题/);
	assert.match(text, /表头A \| 表头B/);
	assert.match(text, /数据A \| 数据B/);
	assert.match(text, /\[\[图:media\/image1\.png\]\]/);

	// 第一页内容在第二页之前，页分隔符为 "\n\n[第N页]\n"
	assert.ok(text.indexOf('[第1页]') < text.indexOf('第一页标题'));
	assert.ok(text.indexOf('第一页正文') < text.indexOf('[第2页]'));
	assert.ok(text.indexOf('[第2页]') < text.indexOf('第二页标题'));
	assert.ok(text.includes('\n\n[第2页]\n'));

	assert.equal(result.images.length, 1);
	assert.equal(result.images[0].name, 'media/image1.png');
	assert.equal(result.images[0].mediaType, 'image/png');
	assert.ok(Buffer.isBuffer(result.images[0].data));
});

// ---------------------------------------------------------------------------
// pdf
// ---------------------------------------------------------------------------

test('pdf：从 docx 转出的 PDF 能抽出中文文本', async (t) => {
	if (env.fixtureError) return t.skip(env.fixtureError);
	if (env.pdfError) return t.skip(env.pdfError);

	const result = await extractDocument({ absPath: env.pdf, ext: '.pdf' });
	assert.match(result.text, /\[第1页\]/);
	assert.match(result.text, /刷题模式文档抽取测试/);
	assert.match(result.text, /第一段/);
	assert.match(result.text, /中文段落内容/);
	assert.match(result.text, /第二段/);
	assert.ok(result.text.length > 20);
	assert.deepEqual(result.images, []);
	assert.deepEqual(result.warnings, []);
});

test('pdf：损坏文件不抛错，返回空文本 + warning', async (t) => {
	const dir = await makeTempDir(t);
	const badPath = join(dir, 'broken.pdf');
	await writeFile(badPath, 'not a pdf at all');
	const result = await extractDocument({ absPath: badPath, ext: '.pdf' });
	assert.equal(result.text, '');
	assert.ok(result.warnings.length >= 1);
	assert.ok(result.warnings[0].includes('PDF'));
});

test('pdf：多页 PDF 按 [第N页] 分隔', async (t) => {
	if (env.fixtureError) return t.skip(env.fixtureError);
	if (env.pdfSlidesError) return t.skip(env.pdfSlidesError);

	const result = await extractDocument({ absPath: env.pdfSlides, ext: '.pdf' });
	assert.match(result.text, /\[第1页\]/);
	assert.match(result.text, /\[第2页\]/);
	assert.ok(result.text.indexOf('第一页标题') < result.text.indexOf('[第2页]'));
	assert.ok(result.text.indexOf('[第2页]') < result.text.indexOf('第二页标题'));
	assert.ok(result.text.includes('\n\n[第2页]\n'));
	assert.deepEqual(result.warnings, []);
});

test('pdf：xref stream + 对象流 + ToUnicode 解码（合成 PDF）', async (t) => {
	const dir = await makeTempDir(t);
	const pdfPath = join(dir, 'xref-stream.pdf');
	await writeFile(pdfPath, buildXrefStreamPdf());

	const result = await extractDocument({ absPath: pdfPath, ext: '.pdf' });
	assert.match(result.text, /\[第1页\]/);
	assert.match(result.text, /中文/);
	assert.deepEqual(result.warnings, []);
});

// ---------------------------------------------------------------------------
// zip（stored 分支）
// ---------------------------------------------------------------------------

test('zip：支持 stored（未压缩）条目', () => {
	const buffer = buildStoredZip([
		{ name: 'word/document.xml', content: '<w:document/>' },
		{ name: '中文/说明.txt', content: '你好，ZIP' },
	]);
	const zip = parseZip(buffer);
	assert.deepEqual(zip.names().sort(), ['word/document.xml', '中文/说明.txt'].sort());
	assert.equal(zip.readText('word/document.xml'), '<w:document/>');
	assert.equal(zip.readText('中文/说明.txt'), '你好，ZIP');
	assert.equal(zip.read('missing.txt'), null);
});

// ---------------------------------------------------------------------------
// 通用容错
// ---------------------------------------------------------------------------

test('不支持的扩展名 / 文件不存在：返回 warning 不抛错', async (t) => {
	const dir = await makeTempDir(t);
	const xlsxPath = join(dir, 'book.xlsx');
	await writeFile(xlsxPath, 'fake');
	const unsupported = await extractDocument({ absPath: xlsxPath, ext: '.xlsx' });
	assert.equal(unsupported.text, '');
	assert.equal(unsupported.warnings.length, 1);
	assert.match(unsupported.warnings[0], /不支持/);

	const missing = await extractDocument({ absPath: join(dir, 'missing.pdf'), ext: '.pdf' });
	assert.equal(missing.text, '');
	assert.ok(missing.warnings.length >= 1);

	const noPath = await extractDocument({});
	assert.equal(noPath.text, '');
	assert.ok(noPath.warnings.length >= 1);

	const emptyDir = await extractDocument({ absPath: dir, ext: '.txt' });
	assert.equal(emptyDir.text, '');
	assert.ok(emptyDir.warnings.length >= 1);
});

test('默认 maxChars 上限为 400000，超出截断', async (t) => {
	const dir = await makeTempDir(t);
	const longPath = join(dir, 'long.txt');
	await writeFile(longPath, '中'.repeat(400_010));
	const result = await extractDocument({ absPath: longPath, ext: '.txt' });
	assert.equal(result.text.length, 400_000);
	assert.ok(result.warnings.some((warning) => warning.includes('400000')));
});
