/**
 * 图片媒体类型推断（docx/pptx 抽取图片时共用）。
 *
 * 只把多模态 LLM/附件保存能接受的常见格式返回给调用方；svg 也保留
 * （契约要求 svg 也返回），其余格式（emf/wmf 等）跳过并给出 warning。
 */

const MEDIA_TYPES = new Map([
	['png', 'image/png'],
	['jpg', 'image/jpeg'],
	['jpeg', 'image/jpeg'],
	['jpe', 'image/jpeg'],
	['gif', 'image/gif'],
	['webp', 'image/webp'],
	['svg', 'image/svg+xml'],
]);

/** 取小写扩展名（不含点）；没有扩展名时返回空串。 */
export function extnameOf(name) {
	const base = String(name ?? '').split(/[?#]/)[0];
	const slash = Math.max(base.lastIndexOf('/'), base.lastIndexOf('\\'));
	const dot = base.lastIndexOf('.');
	if (dot <= slash + 1) return '';
	return base.slice(dot + 1).toLowerCase();
}

/**
 * 按文件名/扩展名推断 mediaType。
 * @param {string} name
 * @returns {string | null} 支持的类型返回 image/*，否则 null
 */
export function guessMediaType(name) {
	return MEDIA_TYPES.get(extnameOf(name)) ?? null;
}

/** 是否是可返回给上层的图片格式。 */
export function isSupportedImage(name) {
	return guessMediaType(name) !== null;
}

/** 生成图片占位符；displayPath 一般是相对文档目录的媒体路径（如 media/image1.png）。 */
export function imagePlaceholder(displayPath) {
	return `[[图:${String(displayPath ?? '未知图片')}]]`;
}
