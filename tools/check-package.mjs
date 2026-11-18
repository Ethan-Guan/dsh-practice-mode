/**
 * 包完整性检查：构建后、安装前由 Lead 运行。
 * 校验 manifest / patch / locale / icon / client.js 是否满足插件契约与 UI 片段完整性。
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];
const notes = [];

function fail(message) {
	failures.push(message);
}

async function readJson(path) {
	try {
		return JSON.parse(await readFile(join(root, path), 'utf8'));
	} catch (error) {
		fail(`${path} 不是合法 JSON：${error.message}`);
		return null;
	}
}

const pkg = await readJson('package.json');
if (pkg !== null) {
	if (typeof pkg.name !== 'string' || pkg.name.length === 0) fail('package.json 缺少 name');
	if (pkg.type !== 'module') fail('package.json type 必须为 module');
	if (!pkg.exports || !pkg.exports['.']) fail('package.json 缺少 "." export');
	if (!pkg.exports || !pkg.exports['./client']) fail('package.json 缺少 "./client" export');
	if (!pkg.dsh || !pkg.dsh.bundle || !pkg.dsh.bundle.patch) fail('package.json 缺少 dsh.bundle.patch');
	if (!pkg.dsh || !pkg.dsh.client || pkg.dsh.client.platform !== 'web') fail('package.json 缺少 dsh.client.platform=web');
	if (!pkg.dsh || !pkg.dsh.client || !Array.isArray(pkg.dsh.client.inject) || pkg.dsh.client.inject.length === 0) {
		fail('dsh.client.inject 需要声明 layout / sidebar 客户端包');
	}
	if (pkg.exports && !pkg.exports['./locale/*.json']) fail('exports 缺少 "./locale/*.json"');
	if (pkg.exports && !pkg.exports['./icon']) fail('exports 缺少 "./icon"');
}

for (const path of ['index.js', 'cordis.patch.yml', 'icon.svg', 'client.js', 'lib/host/paths.js', 'lib/host/store.js', 'lib/host/jobs.js', 'lib/host/api.js', 'lib/host/llm.js', 'lib/host/prompts.js', 'lib/host/render.js', 'lib/host/tasks.js', 'lib/host/extract/index.js']) {
	try {
		await stat(join(root, path));
	} catch (error) {
		if (path === 'client.js') notes.push('client.js 尚未构建（先运行 tools/build-client.mjs）');
		else fail(`缺少文件 ${path}`);
	}
}

for (const locale of ['locale/zh.json', 'locale/en.json']) {
	const value = await readJson(locale);
	if (value === null) continue;
	if (!value.meta || typeof value.meta.title !== 'string' || value.meta.title.length === 0) fail(`${locale} 缺少 meta.title`);
	if (!value.meta || typeof value.meta.description !== 'string' || value.meta.description.length === 0) fail(`${locale} 缺少 meta.description`);
}

try {
	const icon = await readFile(join(root, 'icon.svg'), 'utf8');
	if (!icon.includes('<svg')) fail('icon.svg 不是 SVG');
	if (!icon.includes('viewBox')) fail('icon.svg 缺少 viewBox');
} catch (error) {
	fail('icon.svg 缺失');
}

const patch = await readFile(join(root, 'cordis.patch.yml'), 'utf8').catch(() => '');
if (!patch.includes('insert:') || !patch.includes(pkg ? pkg.name : 'dsh-practice-mode')) {
	fail('cordis.patch.yml 必须 insert 本包 Host 行');
}

const requiredClientFiles = [
	'10-utils.js',
	'20-store.js',
	'30-rail.js',
	'40-practice.js',
	'50-chat.js',
	'60-dash.js',
	'70-selection.js',
	'75-composer-attach.js',
	'90-app.js',
	'99-footer.js',
	'css/base.css',
	'css/rail.css',
	'css/practice.css',
	'css/chat.css',
	'css/dash.css'
];
try {
	const entries = await readdir(join(root, 'src', 'client'));
	const cssEntries = await readdir(join(root, 'src', 'client', 'css'));
	const present = new Set(entries.concat(cssEntries.map((name) => 'css/' + name)));
	for (const file of requiredClientFiles) if (!present.has(file)) fail(`缺少客户端片段 ${file}`);
} catch (error) {
	fail('src/client 目录不完整：' + error.message);
}

try {
	const client = await readFile(join(root, 'client.js'), 'utf8');
	if (!client.includes('window.__ModuleLoader__.load')) fail('client.js 未使用 __ModuleLoader__.load');
	if (pkg && !client.includes(JSON.stringify(pkg.name))) fail('client.js 的模块 id 与包名不一致');
	if (client.includes('@deepseek-ai/dsh-client-ui-primitives')) fail('client.js 不得 require Harness Client primitives');
	for (const component of ['DSP.Rail', 'DSP.PracticeArea', 'DSP.ChatPanel', 'DSP.CourseHome', 'DSP.CourseDashboard', 'DSP.GlobalDashboard', 'DSP.SelectionAction', 'DSP.CourseCreateModal']) {
		if (!client.includes(component)) fail(`client.js 缺少组件赋值 ${component}`);
	}
} catch (error) {
	notes.push('client.js 读取失败：' + error.message);
}

for (const note of notes) console.log('NOTE ' + note);
if (failures.length > 0) {
	console.error('包检查失败：');
	for (const failure of failures) console.error(' - ' + failure);
	process.exitCode = 1;
} else {
	console.log('包检查通过：manifest / patch / locale / icon / client 片段齐全');
}
