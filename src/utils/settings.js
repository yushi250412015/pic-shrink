/** 把设置中的「尺寸缩放」选项映射为 computeTargetSize 所需参数（{ mode, value }） */
export function resolveResize(settings) {
  const { resizeMode } = settings;
  if (resizeMode === 'preset') {
    return settings.preset === 'original'
      ? { mode: 'none', value: 0 }
      : { mode: 'longest', value: Number(settings.preset) };
  }
  if (resizeMode === 'longest') return { mode: 'longest', value: settings.longestEdge };
  if (resizeMode === 'percent') return { mode: 'percent', value: settings.percent };
  return { mode: 'none', value: 0 };
}
