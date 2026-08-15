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

/** 等比缩放尺寸以适配容器（不放大），用于弹窗内展示 */
export function fitContain(width, height, maxWidth, maxHeight) {
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** 把归一化裁剪矩形（0-1）换算为源图像素矩形，并约束在图像范围内 */
export function normalizedCropToRect(crop, width, height) {
  const x = Math.round(clamp(Number(crop.x) || 0, 0, 1) * width);
  const y = Math.round(clamp(Number(crop.y) || 0, 0, 1) * height);
  const cw = Math.round(clamp(Number(crop.width) || 1, 0.01, 1) * width);
  const ch = Math.round(clamp(Number(crop.height) || 1, 0.01, 1) * height);
  const sx = clamp(x, 0, width - 1);
  const sy = clamp(y, 0, height - 1);
  return {
    sx,
    sy,
    sw: clamp(cw, 1, width - sx),
    sh: clamp(ch, 1, height - sy),
  };
}
