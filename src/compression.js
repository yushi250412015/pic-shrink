// 图像压缩/转换核心：解码 → 裁剪 → 缩放 → 旋转/翻转 → 编码。
// 运行在 Web Worker 中，全程本地处理。

import { resolveFormat, mimeFromFormat, isLosslessFormat } from './utils/image.js';
import { computeTargetSize, rotatedSize, squareCropRect } from './utils/geometry.js';
import { findQualityForSize } from './utils/quality.js';

function resolveResize(settings) {
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

function drawSource(ctx, canvasSize, targetSize, bitmap, crop, rotate, flip) {
  const { width: cw, height: ch } = canvasSize;
  const { width: dw, height: dh } = targetSize;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.translate(cw / 2, ch / 2);
  if (rotate === 90) ctx.rotate(Math.PI / 2);
  else if (rotate === 180) ctx.rotate(Math.PI);
  else if (rotate === 270) ctx.rotate(-Math.PI / 2);
  if (flip === 'horizontal') ctx.scale(-1, 1);
  else if (flip === 'vertical') ctx.scale(1, -1);
  ctx.translate(-dw / 2, -dh / 2);

  ctx.drawImage(bitmap, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, dw, dh);
  ctx.restore();
}

/**
 * 压缩/转换一张图片。
 * @returns {Promise<{blob: Blob, width: number, height: number, format: string,
 *   originalWidth: number, originalHeight: number, quality: number}>}
 */
export async function compressImage(file, settings) {
  const format = resolveFormat(file.type, settings.format);

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('无法解码该图片（浏览器可能不支持此格式）');
  }

  const originalWidth = bitmap.width;
  const originalHeight = bitmap.height;

  // GIF 保持原样，不重编码以保留动画
  if (file.type === 'image/gif' && format === 'gif') {
    bitmap.close();
    return {
      blob: file,
      width: originalWidth,
      height: originalHeight,
      format: 'gif',
      originalWidth,
      originalHeight,
      quality: null,
    };
  }

  const crop = squareCropRect(originalWidth, originalHeight, settings.squareCrop);
  const { mode, value } = resolveResize(settings);
  const targetSize = computeTargetSize(crop.sw, crop.sh, mode, value);
  const canvasSize = rotatedSize(targetSize.width, targetSize.height, settings.rotate);

  const canvas = new OffscreenCanvas(canvasSize.width, canvasSize.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('当前浏览器不支持 OffscreenCanvas');

  // 转 JPEG 时填充背景色（透明区域无法用 JPEG 表达）
  if (format === 'jpeg') {
    ctx.fillStyle = settings.background || '#ffffff';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
  }

  drawSource(ctx, canvasSize, targetSize, bitmap, crop, settings.rotate, settings.flip);
  bitmap.close();

  const encode = (quality) => canvas.convertToBlob({ type: mimeFromFormat(format), quality });

  let blob;
  let quality = settings.quality;

  if (settings.strategy === 'target-size' && !isLosslessFormat(format)) {
    const targetBytes = Math.max(1, Number(settings.targetKb) || 1) * 1024;
    const found = await findQualityForSize(async (q) => (await encode(q)).size, targetBytes);
    quality = found.quality;
    blob = await encode(found.quality);
  } else {
    blob = await encode(settings.quality);
  }

  return {
    blob,
    width: canvasSize.width,
    height: canvasSize.height,
    format,
    originalWidth,
    originalHeight,
    quality,
  };
}
