// 纯函数工具集：字节格式化、比例计算、文件名处理、尺寸换算
// 全部不依赖浏览器 API，方便单元测试

const SIZES = ['B', 'KB', 'MB', 'GB', 'TB'];

/** 把字节数格式化成可读字符串，例如 1536 -> "1.5 KB" */
export function formatBytes(bytes, decimals = 1) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), SIZES.length - 1);
  const value = bytes / k ** i;
  return `${value.toFixed(i === 0 ? 0 : decimals)} ${SIZES[i]}`;
}

/** 计算节省比例（百分比，四舍五入）；负数表示反而变大 */
export function calcSavedPercent(original, compressed) {
  if (!original) return 0;
  return Math.round(((original - compressed) / original) * 100);
}

/** 把文件名扩展名替换成新格式，例如 photo.jpg + webp -> photo.webp */
export function replaceExtension(filename, ext) {
  const dot = filename.lastIndexOf('.');
  const base = dot > 0 ? filename.slice(0, dot) : filename;
  return `${base}.${ext}`;
}

/** 在 used 集合内为文件名去重：a.png, a-2.png, a-3.png ... */
export function makeUnique(name, used) {
  if (!used.has(name)) {
    used.add(name);
    return name;
  }
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  let i = 2;
  let candidate = `${base}-${i}${ext}`;
  while (used.has(candidate)) {
    i += 1;
    candidate = `${base}-${i}${ext}`;
  }
  used.add(candidate);
  return candidate;
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * 根据缩放模式计算目标尺寸。
 * scaleMode: 'none' 不缩放 | 'longest' 最长边限制（像素）| 'percent' 百分比
 */
export function computeTargetSize(width, height, scaleMode, scaleValue) {
  if (scaleMode === 'percent') {
    const f = clamp(Number(scaleValue) || 0, 1, 1000) / 100;
    return {
      width: Math.max(1, Math.round(width * f)),
      height: Math.max(1, Math.round(height * f)),
    };
  }
  if (scaleMode === 'longest') {
    const max = Math.max(1, Number(scaleValue) || 0);
    const longest = Math.max(width, height);
    if (!max || longest <= max) return { width, height };
    const f = max / longest;
    return {
      width: Math.max(1, Math.round(width * f)),
      height: Math.max(1, Math.round(height * f)),
    };
  }
  return { width, height };
}

const MIME_MAP = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

/** 输出格式对应的 MIME 类型 */
export function mimeFromFormat(format) {
  return MIME_MAP[format] || 'image/jpeg';
}

/**
 * 决定每个输入文件的输出格式。
 * chosenFormat 为 'auto' 时按输入类型映射；否则直接使用指定格式。
 * GIF 在 auto 模式下保持 gif（不重编码，保留动画）。
 */
export function extensionForOutput(inputType, chosenFormat) {
  if (chosenFormat !== 'auto') return chosenFormat;
  const map = {
    'image/jpeg': 'jpeg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/bmp': 'png',
    'image/avif': 'webp',
    'image/svg+xml': 'png',
  };
  return map[inputType] || 'png';
}
