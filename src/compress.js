// 核心压缩逻辑：在 Web Worker 中运行，不阻塞页面
// 使用 createImageBitmap + OffscreenCanvas，全程本地处理、零上传

import { computeTargetSize, extensionForOutput, mimeFromFormat } from './format.js';

/**
 * 压缩一张图片。
 * @param {File} file 原始图片文件
 * @param {{formatChoice: string, quality: number, scaleMode: string, scaleValue: number}} settings
 * @returns {Promise<{blob: Blob, width: number, height: number, format: string}>}
 */
export async function compressImage(file, settings) {
  const { formatChoice, quality, scaleMode, scaleValue } = settings;
  const format = extensionForOutput(file.type, formatChoice);

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('浏览器无法解码该图片（可能是浏览器不支持的格式）');
  }

  const originalWidth = bitmap.width;
  const originalHeight = bitmap.height;

  // GIF 且保持原格式：直接原样返回，不重编码，避免丢失动画帧
  if (file.type === 'image/gif' && format === 'gif') {
    bitmap.close();
    return { blob: file, width: originalWidth, height: originalHeight, format: 'gif' };
  }

  const { width, height } = computeTargetSize(originalWidth, originalHeight, scaleMode, scaleValue);

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('当前浏览器不支持 OffscreenCanvas');

  // 转 JPEG 时透明区域填充白色，避免变黑
  if (format === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await canvas.convertToBlob({ type: mimeFromFormat(format), quality });
  return { blob, width, height, format };
}
