// 长截图拼接的纯几何计算（无 DOM、无副作用）。

export const STITCH_DIRECTIONS = ['horizontal', 'vertical'];
export const STITCH_ALIGNS = ['start', 'center', 'end'];

/**
 * 计算拼接布局。
 * @param {Array<{width:number,height:number}>} dims 每张图片尺寸（按顺序）
 * @param {{direction?:'horizontal'|'vertical', gap?:number, align?:'start'|'center'|'end'}} [options]
 * @returns {{width:number, height:number, items:Array<{x:number,y:number,width:number,height:number}>}}
 */
export function computeStitchLayout(dims, { direction = 'vertical', gap = 0, align = 'start' } = {}) {
  const n = dims.length;
  if (n === 0) return { width: 0, height: 0, items: [] };

  const g = Math.max(0, Number(gap) || 0);
  const d = STITCH_DIRECTIONS.includes(direction) ? direction : 'vertical';
  const a = STITCH_ALIGNS.includes(align) ? align : 'start';

  if (d === 'horizontal') {
    const height = Math.max(...dims.map((s) => s.height));
    let x = 0;
    const items = dims.map((s) => {
      const y = a === 'center' ? (height - s.height) / 2 : a === 'end' ? height - s.height : 0;
      const item = { x, y, width: s.width, height: s.height };
      x += s.width + g;
      return item;
    });
    return { width: Math.max(0, x - g), height, items };
  }

  const width = Math.max(...dims.map((s) => s.width));
  let y = 0;
  const items = dims.map((s) => {
    const x = a === 'center' ? (width - s.width) / 2 : a === 'end' ? width - s.width : 0;
    const item = { x, y, width: s.width, height: s.height };
    y += s.height + g;
    return item;
  });
  return { width, height: Math.max(0, y - g), items };
}
