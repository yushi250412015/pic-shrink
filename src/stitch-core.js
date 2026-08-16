// 长截图拼接核心：把多张图片按布局绘制到一张画布上（在 Worker 内运行）。
import { computeStitchLayout } from './utils/stitch.js';

export async function stitchImages(files, { direction = 'vertical', gap = 0, align = 'start', format = 'image/png' } = {}) {
  if (!files || files.length === 0) throw new Error('没有可拼接的图片');
  const bitmaps = await Promise.all(files.map((file) => createImageBitmap(file)));
  try {
    const dims = bitmaps.map((b) => ({ width: b.width, height: b.height }));
    const layout = computeStitchLayout(dims, { direction, gap, align });
    if (layout.width <= 0 || layout.height <= 0) throw new Error('拼接尺寸无效');

    const canvas = new OffscreenCanvas(layout.width, layout.height);
    const ctx = canvas.getContext('2d');
    // 间距区域用白底填充（长截图通常为白底，避免透明缝隙）
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, layout.width, layout.height);

    bitmaps.forEach((bitmap, i) => {
      const item = layout.items[i];
      ctx.drawImage(bitmap, item.x, item.y, item.width, item.height);
    });

    const blob = await canvas.convertToBlob({ type: format });
    return { blob, width: layout.width, height: layout.height };
  } finally {
    for (const b of bitmaps) b.close();
  }
}
