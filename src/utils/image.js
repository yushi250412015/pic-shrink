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

/** 探测当前浏览器支持哪些输出格式（仅在主线程调用） */
export async function detectEncodableFormats() {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1, 1);

  const supported = [];
  for (const format of ['jpeg', 'png', 'webp', 'avif']) {
    const type = mimeFromFormat(format);
    const ok = await new Promise((resolve) => {
      try {
        canvas.toBlob((blob) => resolve(Boolean(blob) && blob.type === type), type, 0.8);
      } catch {
        resolve(false);
      }
    });
    if (ok) supported.push(format);
  }
  return supported;
}
