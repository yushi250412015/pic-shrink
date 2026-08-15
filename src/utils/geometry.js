export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * 根据缩放模式计算目标尺寸。
 * resizeMode: 'none' 不缩放 | 'longest' 最长边限制（像素）| 'percent' 百分比
 */
export function computeTargetSize(width, height, resizeMode, value) {
  if (resizeMode === 'percent') {
    const factor = clamp(Number(value) || 0, 1, 1000) / 100;
    return {
      width: Math.max(1, Math.round(width * factor)),
      height: Math.max(1, Math.round(height * factor)),
    };
  }
  if (resizeMode === 'longest') {
    const longestEdge = Math.max(1, Number(value) || 0);
    const longest = Math.max(width, height);
    if (!longestEdge || longest <= longestEdge) return { width, height };
    const factor = longestEdge / longest;
    return {
      width: Math.max(1, Math.round(width * factor)),
      height: Math.max(1, Math.round(height * factor)),
    };
  }
  return { width, height };
}

/** 旋转 90°/270° 时交换宽高 */
export function rotatedSize(width, height, rotate) {
  return rotate % 180 === 0 ? { width, height } : { width: height, height: width };
}

/** 计算居中正方形裁剪的源矩形（未开启时返回完整区域） */
export function squareCropRect(width, height, enabled) {
  if (!enabled) return { sx: 0, sy: 0, sw: width, sh: height };
  const size = Math.min(width, height);
  return {
    sx: Math.round((width - size) / 2),
    sy: Math.round((height - size) / 2),
    sw: size,
    sh: size,
  };
}
