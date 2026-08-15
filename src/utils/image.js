export const MIME_BY_FORMAT = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
};

export function mimeFromFormat(format) {
  return MIME_BY_FORMAT[format] || 'image/jpeg';
}

const AUTO_FORMAT_MAP = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'webp',
  'image/gif': 'gif',
  'image/bmp': 'png',
  'image/svg+xml': 'png',
};

/** 决定输出格式：手动指定优先；'auto' 时按输入类型映射 */
export function resolveFormat(inputType, requested) {
  if (requested && requested !== 'auto') return requested;
  return AUTO_FORMAT_MAP[inputType] || 'png';
}

/** 无损格式无法通过质量参数压缩 */
export function isLosslessFormat(format) {
  return format === 'png' || format === 'gif';
}
