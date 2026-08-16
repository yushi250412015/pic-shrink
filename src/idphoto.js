// 证件照排版核心：在 Worker 内把照片缩放居中铺满网格（canvas 合成）。
import { planIdPhotoGrid, resolveIdBackground, normalizeGap } from './utils/id-photo.js';
import { aspectCropRect } from './utils/geometry.js';

/**
 * 把一张照片按网格铺满一张相纸（cover 居中裁剪到每格）。
 * @param {Blob|File} blob 源图片（通常为用户裁剪后的结果图）
 * @param {{unit?: '1in'|'2in', dpi?: number, background?: 'white'|'red'|'blue',
 *   count?: number, gap?: number}} [options]
 * @returns {Promise<{blob: Blob, width: number, height: number, placed: number}>}
 */
export async function composeIdPhotos(
  blob,
  { unit = '1in', dpi = 300, background = 'white', count = 1, gap = 0 } = {},
) {
  const grid = planIdPhotoGrid({ unit, dpi, gap });
  const gapPx = normalizeGap(gap);
  const wanted = Math.min(grid.capacity, Math.max(1, Math.floor(Number(count) || 1)));

  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = new OffscreenCanvas(grid.pageW, grid.pageH);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('当前环境不支持 OffscreenCanvas');

    ctx.fillStyle = resolveIdBackground(background);
    ctx.fillRect(0, 0, grid.pageW, grid.pageH);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const crop = aspectCropRect(bitmap.width, bitmap.height, grid.cellW, grid.cellH);

    let placed = 0;
    outer: for (let r = 0; r < grid.rows; r += 1) {
      for (let c = 0; c < grid.cols; c += 1) {
        if (placed >= wanted) break outer;
        const x = c * (grid.cellW + gapPx);
        const y = r * (grid.cellH + gapPx);
        ctx.drawImage(bitmap, crop.sx, crop.sy, crop.sw, crop.sh, x, y, grid.cellW, grid.cellH);
        placed += 1;
      }
    }

    const png = await canvas.convertToBlob({ type: 'image/png' });
    return { blob: png, width: grid.pageW, height: grid.pageH, placed };
  } finally {
    bitmap.close();
  }
}
