// 图像压缩/转换核心：解码 → 裁剪 → 缩放 → 旋转/翻转 → 编码。
// 运行在 Web Worker 中，全程本地处理。

import { resolveFormat, mimeFromFormat, isLosslessFormat } from './utils/image.js';
import {
  clamp,
  aspectCropRect,
  computeTargetSize,
  mergeCrops,
  normalizedCropToRect,
  rotatedSize,
  squareCropRect,
} from './utils/geometry.js';
import { findQualityForSize } from './utils/quality.js';
import { computeWatermarkPosition } from './utils/watermark.js';
import { resolveResize } from './utils/settings.js';
import { findScenario } from './config.js';
import { findSubmissionSize } from './utils/submission-sizes.js';
import { isHeicFile } from './utils/filetype.js';
import { decodeHeicToJpeg } from './heic.js';
import { parseCustomScenarioId } from './utils/scenarios.js';
import {
  effectivePngStrategy,
  quantizeChannel,
  lossyChannelLevels,
  oxipngOptions,
} from './utils/png-opt.js';
import gifsicle from 'gifsicle-wasm-browser';
import { embedJpegMetadataBlob } from './utils/metadata.js';

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

async function processGif(file, settings, itemCrop, originalWidth, originalHeight) {
  const baseCrop = itemCrop
    ? normalizedCropToRect(itemCrop, originalWidth, originalHeight)
    : squareCropRect(originalWidth, originalHeight, settings.squareCrop);

  const args = [];
  const cropped = baseCrop.sw !== originalWidth || baseCrop.sh !== originalHeight;
  if (cropped) {
    args.push(`--crop ${baseCrop.sx},${baseCrop.sy}+${baseCrop.sw}x${baseCrop.sh}`);
  }

  let width = baseCrop.sw;
  let height = baseCrop.sh;
  const { mode, value } = resolveResize(settings);
  if (mode !== 'none') {
    const target = computeTargetSize(baseCrop.sw, baseCrop.sh, mode, value);
    width = target.width;
    height = target.height;
    args.push(`--resize ${width}x${height}`);
  }

  args.push('-O1');
  const lossy = Math.max(0, Math.min(200, Math.round((1 - settings.quality) * 200)));
  if (lossy > 0) args.push(`--lossy=${lossy}`);

  const command = `input.gif ${args.join(' ')} -o /out/out.gif`;
  const outputs = await gifsicle.run({
    input: [{ file, name: 'input.gif' }],
    command: [command],
  });

  if (!outputs || !outputs[0]) throw new Error('GIF 处理失败');

  return {
    blob: outputs[0],
    width,
    height,
    format: 'gif',
    originalWidth,
    originalHeight,
    quality: settings.quality,
  };
}

function drawWatermark(ctx, width, height, settings) {
  const text = (settings.watermarkText || '').trim();
  if (!text) return;

  const shorter = Math.min(width, height);
  const fontSize = Math.max(8, Math.round((shorter * (Number(settings.watermarkSize) || 0)) / 100));
  const { x, y } = computeWatermarkPosition(settings.watermarkPosition, width, height, fontSize);
  const opacity = clamp(Number(settings.watermarkOpacity) ?? 80, 0, 100) / 100;

  ctx.save();
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, 'Segoe UI', sans-serif`;
  ctx.fillStyle = settings.watermarkColor || '#ffffff';
  ctx.globalAlpha = opacity;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = Math.max(1, Math.round(fontSize * 0.2));
  ctx.fillText(text, x, y);
  ctx.restore();
}

/**
 * 压缩/转换一张图片。
 * @returns {Promise<{blob: Blob, width: number, height: number, format: string,
 *   originalWidth: number, originalHeight: number, quality: number}>}
 */
export async function compressImage(file, settings, itemCrop = null) {
  // HEIC/HEIF：先解码为 JPEG，再进入常规图片管线（解码在 Worker 内完成）
  let sourceFile = file;
  if (isHeicFile(file)) {
    sourceFile = await decodeHeicToJpeg(file);
  }

  const format = resolveFormat(sourceFile.type, settings.format);

  let bitmap;
  try {
    bitmap = await createImageBitmap(sourceFile);
  } catch {
    throw new Error('无法解码该图片（浏览器可能不支持此格式）');
  }

  const originalWidth = bitmap.width;
  const originalHeight = bitmap.height;

  // GIF：用 gifsicle 处理（压缩/裁剪/缩放），保留动画帧
  if (sourceFile.type === 'image/gif' && format === 'gif') {
    bitmap.close();
    return processGif(sourceFile, settings, itemCrop, originalWidth, originalHeight);
  }

  const baseCrop = itemCrop
    ? normalizedCropToRect(itemCrop, originalWidth, originalHeight)
    : squareCropRect(originalWidth, originalHeight, settings.squareCrop);

  let sourceRect = baseCrop;
  let targetSize;
  const scenario =
    settings.resizeMode === 'scenario'
      ? parseCustomScenarioId(settings.scenario) || findScenario(settings.scenario) || findSubmissionSize(settings.scenario)
      : null;
  if (scenario) {
    const aspect = aspectCropRect(baseCrop.sw, baseCrop.sh, scenario.width, scenario.height);
    sourceRect = mergeCrops(baseCrop, aspect);
    targetSize = { width: scenario.width, height: scenario.height };
  } else {
    const { mode, value } = resolveResize(settings);
    targetSize = computeTargetSize(baseCrop.sw, baseCrop.sh, mode, value);
  }
  const canvasSize = rotatedSize(targetSize.width, targetSize.height, settings.rotate);

  const canvas = new OffscreenCanvas(canvasSize.width, canvasSize.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('当前浏览器不支持 OffscreenCanvas');

  // 转 JPEG 时填充背景色（透明区域无法用 JPEG 表达）
  if (format === 'jpeg') {
    ctx.fillStyle = settings.background || '#ffffff';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
  }

  drawSource(ctx, canvasSize, targetSize, bitmap, sourceRect, settings.rotate, settings.flip);
  drawWatermark(ctx, canvasSize.width, canvasSize.height, settings);
  bitmap.close();

  // 有损 PNG：先把像素量化（减少颜色数），再交给 canvas 编码，体积更小
  if (effectivePngStrategy(format, settings.pngOpt) === 'lossy') {
    const imageData = ctx.getImageData(0, 0, canvasSize.width, canvasSize.height);
    const levels = lossyChannelLevels();
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = quantizeChannel(data[i], levels);
      data[i + 1] = quantizeChannel(data[i + 1], levels);
      data[i + 2] = quantizeChannel(data[i + 2], levels);
      // 保留 alpha 通道不变，避免透明边缘出现锯齿
    }
    ctx.putImageData(imageData, 0, 0);
  }

  const encode = (quality) => canvas.convertToBlob({ type: mimeFromFormat(format), quality });

  let blob;
  let quality = settings.quality;
  let note;

  if (settings.strategy === 'target-size' && !isLosslessFormat(format)) {
    const targetBytes = Math.max(1, Number(settings.targetKb) || 1) * 1024;
    const found = await findQualityForSize(async (q) => (await encode(q)).size, targetBytes);
    quality = found.quality;
    blob = await encode(found.quality);
  } else {
    blob = await encode(settings.quality);
  }

  // 无损 PNG：用 oxipng wasm 瘦身；加载/执行失败时优雅回退默认编码
  if (effectivePngStrategy(format, settings.pngOpt) === 'lossless') {
    try {
      const { optimise } = await import('@jsquash/oxipng');
      const buffer = await blob.arrayBuffer();
      const slim = await optimise(buffer, oxipngOptions());
      if (slim && slim.byteLength > 0) {
        blob = new Blob([slim], { type: 'image/png' });
      }
    } catch {
      note = 'list.png.opt.fallback';
    }
  }

  // 元数据写入：标题/作者仅支持 JPEG（EXIF）；其余格式诚实跳过
  if (format === 'jpeg') {
    const withMeta = await embedJpegMetadataBlob(blob, {
      title: settings.metadataTitle,
      author: settings.metadataAuthor,
    });
    if (withMeta) blob = withMeta;
  }

  return {
    blob,
    width: canvasSize.width,
    height: canvasSize.height,
    format,
    originalWidth,
    originalHeight,
    quality,
    note,
  };
}
