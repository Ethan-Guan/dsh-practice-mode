/**
 * 刷题模式 — 图片裁剪（Host）。
 *
 * 解析时让 Agent 直接给出图形在原页 PNG 中的裁剪坐标（bbox），Host 用本模块从页面截图
 * 里裁出原图保存（比让模型重画 SVG 更忠实）。优先使用 Electron `nativeImage`（Host 运行在
 * Electron 主进程里），不可用时回退到 bundled Python + Pillow；两者都不可用抛中文错误。
 *
 * 导出：
 *   - clampCropBox(box, imageWidth, imageHeight)：纯函数，把 bbox 严格限制在图片范围内；
 *   - readImageDimensions(filePath)：读 PNG/JPEG/GIF 文件头拿宽高（读不出返回 null）；
 *   - cropImageRegion({inputPath, outputPath, x, y, width, height})：裁剪并写 PNG。
 */

import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, open, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';

import { resolveDshHome, resolveResourcesRoot } from './paths.js';

const execFileAsync = promisify(execFile);
const PYTHON_TIMEOUT_MS = 60_000;
const MAX_BUFFER = 4 * 1024 * 1024;

/** 任意值 → 去空白字符串。 */
function asString(value) {
	if (typeof value === 'string') return value.trim();
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	return '';
}

/** 把 bbox 严格 clamp 到图片范围内。 */
export function clampCropBox(box, imageWidth, imageHeight) {
	const maxWidth = Math.floor(Number(imageWidth));
	const maxHeight = Math.floor(Number(imageHeight));
	if (!Number.isFinite(maxWidth) || !Number.isFinite(maxHeight) || maxWidth < 1 || maxHeight < 1) return null;
	const x = Number(box?.x);
	const y = Number(box?.y);
	const width = Number(box?.width);
	const height = Number(box?.height);
	if (![x, y, width, height].every((value) => Number.isFinite(value))) return null;
	if (width < 1 || height < 1) return null;
	const left = Math.min(Math.max(0, Math.round(x)), maxWidth - 1);
	const top = Math.min(Math.max(0, Math.round(y)), maxHeight - 1);
	const remainingWidth = maxWidth - left;
	const remainingHeight = maxHeight - top;
	const croppedWidth = Math.min(Math.max(1, Math.round(width)), remainingWidth);
	const croppedHeight = Math.min(Math.max(1, Math.round(height)), remainingHeight);
	if (croppedWidth < 1 || croppedHeight < 1) return null;
	return { x: left, y: top, width: croppedWidth, height: croppedHeight };
}

/** 读取文件前 maxBytes 字节。 */
async function readHead(filePath, maxBytes) {
	const handle = await open(filePath, 'r');
	try {
		const buffer = Buffer.alloc(maxBytes);
		const { bytesRead } = await handle.read(buffer, 0, maxBytes, 0);
		return buffer.subarray(0, bytesRead);
	} finally {
		await handle.close();
	}
}

/** 读 JPEG 的 SOF 段拿宽高。 */
function readJpegSize(buffer) {
	if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
	let offset = 2;
	while (offset + 9 < buffer.length) {
		if (buffer[offset] !== 0xff) return null;
		const marker = buffer[offset + 1];
		if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
			offset += 2;
			continue;
		}
		const length = buffer.readUInt16BE(offset + 2);
		if (length < 2) return null;
		const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
		if (isSof) {
			if (offset + 9 > buffer.length) return null;
			return {
				height: buffer.readUInt16BE(offset + 5),
				width: buffer.readUInt16BE(offset + 7)
			};
		}
		offset += 2 + length;
	}
	return null;
}

/**
 * 读图片尺寸（PNG / JPEG / GIF；其它格式返回 null）。
 * @param {string} filePath
 * @returns {Promise<{width: number, height: number}|null>}
 */
export async function readImageDimensions(filePath) {
	try {
		const buffer = await readHead(resolve(asString(filePath)), 64 * 1024);
		// PNG：签名后 IHDR 的前两个 4 字节是宽高（大端）。
		if (buffer.length >= 24
			&& buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
			return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
		}
		// GIF：6-7 小端宽，8-9 小端高。
		if (buffer.length >= 10 && buffer.subarray(0, 3).toString('latin1') === 'GIF') {
			return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
		}
		const jpeg = readJpegSize(buffer);
		if (jpeg !== null) return jpeg;
		return null;
	} catch {
		return null;
	}
}

/** 动态加载 Electron nativeImage（普通 Node 环境下不可用）。 */
let electronPromise;
async function loadElectronNativeImage() {
	if (electronPromise === undefined) {
		electronPromise = (async () => {
			try {
				const electron = await import('electron');
				const nativeImage = electron?.nativeImage ?? electron?.default?.nativeImage;
				return typeof nativeImage?.createFromPath === 'function' ? nativeImage : null;
			} catch {
				return null;
			}
		})();
	}
	return electronPromise;
}

/** 用 Electron nativeImage 裁剪。 */
async function cropWithElectron(inputPath, outputPath, box) {
	const nativeImage = await loadElectronNativeImage();
	if (nativeImage === null) return null;
	const image = nativeImage.createFromPath(inputPath);
	if (image === undefined || image === null || (typeof image.isEmpty === 'function' && image.isEmpty())) {
		throw new Error('Electron 无法读取该图片');
	}
	const size = typeof image.getSize === 'function' ? image.getSize() : { width: 0, height: 0 };
	const clamped = clampCropBox(box, size.width, size.height);
	if (clamped === null) throw new Error('裁剪区域超出图片范围');
	const cropped = image.crop({ x: clamped.x, y: clamped.y, width: clamped.width, height: clamped.height });
	const png = cropped.toPNG();
	if (png === undefined || png === null || png.length === 0) throw new Error('Electron 裁剪结果为空');
	await writeFile(outputPath, png);
	return { width: clamped.width, height: clamped.height, backend: 'electron' };
}

/** 可能的 bundled Python 解释器路径（去重）。 */
function pythonCandidates() {
	const binaries = [];
	const envConfigured = asString(process.env.DSH_PYTHON) || asString(process.env.PYTHON);
	if (envConfigured !== '') binaries.push(envConfigured);
	const exeName = process.platform === 'win32' ? 'python.exe' : 'python3';
	const resources = resolveResourcesRoot();
	if (typeof resources === 'string' && resources !== '') {
		binaries.push(join(resources, 'runtime', 'primary-runtime', 'dependencies', 'python', 'bin', exeName));
		binaries.push(join(resources, 'runtime', 'dependencies', 'python', 'bin', exeName));
	}
	try {
		binaries.push(join(resolveDshHome(), 'dsh-runtimes', 'dsh-primary-runtime', 'dependencies', 'python', 'bin', exeName));
	} catch {
		/* ignore */
	}
	binaries.push(exeName, 'python');
	const seen = new Set();
	const result = [];
	for (const candidate of binaries) {
		const value = asString(candidate);
		if (value === '' || seen.has(value)) continue;
		seen.add(value);
		// 绝对路径的存在性先检查，避免 spawn 一个不存在的解释器；命令名留给 PATH 解析。
		if (value.includes('/') || value.includes('\\')) {
			if (!existsSync(value)) continue;
		}
		result.push(value);
	}
	return result;
}

/** Python + Pillow 裁剪脚本（内部再 clamp 一次，兼容未知尺寸）。 */
const PYTHON_CROP_SCRIPT = [
	'import json, sys',
	'from PIL import Image',
	'input_path, output_path = sys.argv[1], sys.argv[2]',
	'x, y, width, height = (int(float(value)) for value in sys.argv[3:7])',
	'image = Image.open(input_path)',
	'image_width, image_height = image.size',
	'left = max(0, min(image_width - 1, x))',
	'top = max(0, min(image_height - 1, y))',
	'cropped_width = max(1, min(image_width - left, width))',
	'cropped_height = max(1, min(image_height - top, height))',
	'if image.mode not in ("RGB", "RGBA"):',
	'    image = image.convert("RGBA")',
	'image.crop((left, top, left + cropped_width, top + cropped_height)).save(output_path, "PNG")',
	'print(json.dumps({"width": cropped_width, "height": cropped_height}))'
].join('\n');

/** 用 Python + Pillow 裁剪。 */
async function cropWithPython(pythonPath, inputPath, outputPath, box) {
	const args = ['-c', PYTHON_CROP_SCRIPT, inputPath, outputPath, String(box.x), String(box.y), String(box.width), String(box.height)];
	const { stdout } = await execFileAsync(pythonPath, args, { timeout: PYTHON_TIMEOUT_MS, maxBuffer: MAX_BUFFER, windowsHide: true });
	const parsed = JSON.parse(String(stdout).trim());
	return { width: Number(parsed.width), height: Number(parsed.height), backend: 'python' };
}

/**
 * 从原图中裁剪一块区域并保存为 PNG。
 *
 * 优先 Electron nativeImage；不可用时回退 bundled Python + Pillow；都不可用抛中文错误。
 * bbox 会被严格 clamp 到图片范围内。
 *
 * @param {{inputPath: string, outputPath: string, x: number, y: number, width: number, height: number}} options
 * @returns {Promise<{width: number, height: number, backend: 'electron'|'python'}>}
 */
export async function cropImageRegion({ inputPath, outputPath, x, y, width, height } = {}) {
	const input = asString(inputPath);
	const output = asString(outputPath);
	if (input === '' || output === '') throw new Error('图片裁剪失败：缺少输入或输出路径。');
	if (!existsSync(input)) throw new Error(`图片裁剪失败：输入图片不存在（${input}）。`);
	const rawBox = { x: Number(x), y: Number(y), width: Number(width), height: Number(height) };
	if (![rawBox.x, rawBox.y, rawBox.width, rawBox.height].every((value) => Number.isFinite(value))
		|| rawBox.width < 1 || rawBox.height < 1) {
		throw new Error('图片裁剪失败：裁剪区域坐标无效（需要正整数 x/y/width/height）。');
	}
	const dims = await readImageDimensions(input);
	let box = clampCropBox(rawBox, dims?.width, dims?.height);
	if (dims !== null && box === null) throw new Error('图片裁剪失败：裁剪区域超出图片范围。');
	if (box === null) box = { x: Math.max(0, Math.round(rawBox.x)), y: Math.max(0, Math.round(rawBox.y)), width: Math.max(1, Math.round(rawBox.width)), height: Math.max(1, Math.round(rawBox.height)) };
	await mkdir(dirname(output), { recursive: true });

	const errors = [];
	try {
		const electronResult = await cropWithElectron(input, output, box);
		if (electronResult !== null) {
			// Electron 内部按真实尺寸再 clamp 一次；宽高以实际裁剪结果为准。
			return electronResult;
		}
	} catch (error) {
		errors.push(`Electron：${error instanceof Error ? error.message : String(error)}`);
	}
	for (const pythonPath of pythonCandidates()) {
		try {
			return await cropWithPython(pythonPath, input, output, box);
		} catch (error) {
			errors.push(`Python(${pythonPath})：${error instanceof Error ? error.message : String(error)}`);
		}
	}
	const detail = errors.length > 0 ? `（${errors[0]}）` : '';
	throw new Error(`图片裁剪失败：当前环境没有可用的图片裁剪能力（Electron nativeImage / Python Pillow 均不可用）${detail}`);
}
