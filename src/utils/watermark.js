/** 计算水印文字锚点坐标（3×3 九宫格，position 形如 'bottom-right'）；非法值回退到右下角 */
export function computeWatermarkPosition(position, width, height, fontSize) {
  const [rawRow, rawCol] = String(position).split('-');
  const row = rawRow === 'top' || rawRow === 'middle' ? rawRow : 'bottom';
  const col = rawCol === 'left' || rawCol === 'center' ? rawCol : 'right';
  const pad = fontSize;
  const x = col === 'left' ? pad : col === 'right' ? width - pad : width / 2;
  const y = row === 'top' ? pad : row === 'bottom' ? height - pad : height / 2;
  return { x, y };
}
