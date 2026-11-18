/**
 * 刷题模式 — 共享路径解析。
 *
 * 数据写在 DSH home 下的 practice 目录；LibreOffice Kit 与 Node 运行时来自
 * Desktop 应用自身资源目录（process.resourcesPath）。所有函数都做容错回退，
 * 保证在非 Desktop 部署里也能给出可用的路径或 undefined。
 */

import { homedir } from 'node:os';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/** Resolve $DSH_HOME (blank treated as unset), defaulting to ~/.dsh. */
export function resolveDshHome() {
	const configured = process.env.DSH_HOME;
	if (typeof configured === 'string' && configured.trim() !== '') {
		return resolve(configured.trim());
	}
	return join(homedir(), '.dsh');
}

/** The plugin data root: $DSH_HOME/practice. */
export function resolveDataRoot() {
	return join(resolveDshHome(), 'practice');
}

/**
 * The Desktop Resources directory. `process.resourcesPath` exists in the
 * Electron main process; otherwise derive from this file's location when the
 * plugin is mounted from app.asar.unpacked.
 */
export function resolveResourcesRoot() {
	const fromProcess = process.resourcesPath;
	if (typeof fromProcess === 'string' && fromProcess.length > 0) return fromProcess;
	// .../Resources/app.asar.unpacked/dsh/node_modules/dsh-practice-mode/lib/host/paths.js
	const here = dirname(new URL(import.meta.url).pathname);
	const marker = `${join('app.asar.unpacked', 'dsh')}`;
	const index = here.indexOf(marker);
	if (index >= 0) return here.slice(0, index).replace(/\/$/, '');
	const appMarker = `${join('app.asar', 'dsh')}`;
	const appIndex = here.indexOf(appMarker);
	if (appIndex >= 0) return here.slice(0, appIndex).replace(/\/$/, '');
	return undefined;
}

/** Candidate Node binaries used to run the LibreOffice Kit CLI. */
export function resolveNodeBinary() {
	const candidates = [];
	const resources = resolveResourcesRoot();
	if (resources !== undefined) {
		candidates.push(join(resources, 'runtime', 'primary-runtime', 'dependencies', 'node', 'bin', process.platform === 'win32' ? 'node.exe' : 'node'));
		candidates.push(join(resources, 'runtime', 'bin', process.platform === 'win32' ? 'node.exe' : 'node'));
	}
	if (typeof process.execPath === 'string' && process.execPath.length > 0) {
		candidates.push(process.execPath);
	}
	for (const candidate of candidates) {
		if (existsSync(candidate)) return candidate;
	}
	return process.platform === 'win32' ? 'node.exe' : 'node';
}

/** The bundled LibreOffice Kit CLI entry, or undefined when not shipped. */
export function resolveOfficeCli() {
	const resources = resolveResourcesRoot();
	if (resources === undefined) return undefined;
	const candidates = [
		join(resources, 'app.asar.unpacked', 'dsh', 'node_modules', '@deepseek-ai', 'libreoffice-kit', 'lib', 'cli.js'),
		join(resources, 'app.asar', 'dsh', 'node_modules', '@deepseek-ai', 'libreoffice-kit', 'lib', 'cli.js')
	];
	for (const candidate of candidates) {
		if (existsSync(candidate)) return candidate;
	}
	return undefined;
}
