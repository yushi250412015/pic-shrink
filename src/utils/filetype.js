// 文件类型识别纯函数：主要解决浏览器对 HEIC/HEIF 不设 MIME 类型（拖入时为 ''）的识别问题。

const HEIC_EXTENSIONS = ['heic', 'heif'];

export const HEIC_MIME_TYPES = ['image/heic', 'image/heif'];

/** 取文件名扩展名（不含点，小写）；无扩展名返回 '' */
export function fileExtension(name) {
  if (typeof name !== 'string') return '';
  const dot = name.lastIndexOf('.');
  if (dot <= 0 || dot === name.length - 1) return '';
  return name.slice(dot + 1).toLowerCase();
}

/** 按文件名后缀判断是否为 HEIC/HEIF（iOS 拖入的 HEIC 常无 MIME 类型，只能靠扩展名） */
export function isHeicName(name) {
  return HEIC_EXTENSIONS.includes(fileExtension(name));
}

/** 按 MIME 类型判断是否为 HEIC/HEIF */
export function isHeicType(type) {
  return HEIC_MIME_TYPES.includes(String(type || '').toLowerCase());
}

/** 文件对象层面判断：文件名或 MIME 任一命中即可 */
export function isHeicFile(file) {
  if (!file) return false;
  return isHeicType(file.type) || isHeicName(file.name);
}

/** 判断是否为可接受的图片输入：常规 image/* 或 HEIC/HEIF */
export function isImageInput(file) {
  if (!file) return false;
  return Boolean(file.type && file.type.startsWith('image/')) || isHeicFile(file);
}
