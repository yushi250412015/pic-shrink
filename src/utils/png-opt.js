// PNG 优化策略纯函数（无 DOM、无副作用）。

export const PNG_OPT_STRATEGIES = ['auto', 'lossy', 'lossless'];

/** 有损 PNG 的每通道量化级数（5bit ≈ 32 级，显著减小体积，轻微可见损失） */
export function lossyChannelLevels() {
  return 32;
}

/** 把单个通道值量化到 levels 级（0-255 均匀分布），用于有损 PNG 的 canvas 重编码 */
export function quantizeChannel(value, levels) {
  const safeLevels = Math.max(2, Math.floor(Number(levels) || 32));
  const v = Math.max(0, Math.min(255, Math.round(Number(value) || 0)));
  const step = 255 / (safeLevels - 1);
  return Math.round(Math.round(v / step) * step);
}

/** 计算生效的 PNG 优化策略：仅输出格式为 png 时生效，非法值回退 auto */
export function effectivePngStrategy(format, requested) {
  if (format !== 'png') return 'auto';
  return PNG_OPT_STRATEGIES.includes(requested) ? requested : 'auto';
}

/** oxipng 无损优化参数（level 1-6，2 为体积/速度平衡点） */
export function oxipngOptions() {
  return { level: 2, interlace: false, optimiseAlpha: false };
}
