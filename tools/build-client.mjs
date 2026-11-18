/**
 * 构建 Client 半：把 src/client/*.js 与 src/client/css/*.css 拼成单文件。
 * 只有 Lead 运行此脚本；开发者不要手动改 client.js。
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, '..');
const clientDir = join(packageRoot, 'src', 'client');
const cssDir = join(clientDir, 'css');
const outFile = join(packageRoot, 'client.js');

const packageJson = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
const id = packageJson.name;

const scriptNames = (await readdir(clientDir)).filter((name) => name.endsWith('.js')).sort();
const cssNames = (await readdir(cssDir)).filter((name) => name.endsWith('.css')).sort();

const fragments = [];
for (const name of scriptNames) {
	const body = await readFile(join(clientDir, name), 'utf8');
	fragments.push(`\n/* ==== src/client/${name} ==== */\n${body.trimEnd()}\n`);
}

const cssParts = [];
for (const name of cssNames) {
	const css = await readFile(join(cssDir, name), 'utf8');
	cssParts.push(`/* ==== src/client/css/${name} ==== */\n${css.trimEnd()}`);
}
const css = cssParts.join('\n');

const output = `/* 刷题模式 Client 半 — 由 tools/build-client.mjs 生成，勿手改。 */
window.__ModuleLoader__.load({
	id: ${JSON.stringify(id)},
	factory(require) {
		const React = require('react');
		const h = React.createElement;
		const __DSP_CSS__ = ${JSON.stringify(css)};
${fragments.join('')}
		return { inject: ['slots', 'layout', 'locale'], apply: applyPracticeMode };
	},
});
`;

await writeFile(outFile, output, 'utf8');
try {
	await execFileAsync(process.execPath, ['--check', outFile], { timeout: 60_000 });
} catch (error) {
	console.error('client.js syntax check failed:');
	console.error(error?.stderr ?? error?.message ?? error);
	process.exitCode = 1;
	throw error;
}
const bytes = Buffer.byteLength(output, 'utf8');
console.log(`built client.js (${scriptNames.length} fragments, ${cssNames.length} css, ${(bytes / 1024).toFixed(1)} KiB)`);
