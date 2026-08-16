// 图片转 PDF 的纯几何计算（无 DOM、无副作用）。

/** A4 页面尺寸（pt，1pt = 1/72 英寸） */
export const A4_PT = Object.freeze({ width: 595.28, height: 841.89 });

/** 支持的页面尺寸模式 */
export const IMG2PDF_MODES = ['original', 'a4'];

/**
 * 计算 PDF 页面尺寸。
 * - 'original'：按图片固有尺寸（1px = 1pt）
 * - 'a4'（默认）：A4 页面
 */
export function computePageSize(imgW, imgH, mode = 'a4') {
  if (mode === 'original') return { width: Number(imgW), height: Number(imgH) };
  return { ...A4_PT };
}

/**
 * 计算图片在页面上的绘制矩形（contain 等比缩放并居中，不放大）。
 * @returns {{x:number, y:number, width:number, height:number}}
 */
export function fitImageOnPage(imgW, imgH, pageW, pageH, { margin = 0 } = {}) {
  const m = Math.max(0, Number(margin) || 0);
  const availW = Math.max(1, pageW - m * 2);
  const availH = Math.max(1, pageH - m * 2);
  const scale = Math.min(availW / imgW, availH / imgH, 1);
  const width = imgW * scale;
  const height = imgH * scale;
  return {
    x: (pageW - width) / 2,
    y: (pageH - height) / 2,
    width,
    height,
  };
}
