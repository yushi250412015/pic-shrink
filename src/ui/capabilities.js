import { mimeFromFormat } from '../utils/image.js';

/** 探测当前浏览器支持哪些输出格式（主线程 DOM 能力探测） */
export async function detectEncodableFormats() {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1, 1);

  const supported = [];
  for (const format of ['jpeg', 'png', 'webp', 'avif']) {
    const type = mimeFromFormat(format);
    const ok = await new Promise((resolve) => {
      try {
        canvas.toBlob((blob) => resolve(Boolean(blob) && blob.type === type), type, 0.8);
      } catch {
        resolve(false);
      }
    });
    if (ok) supported.push(format);
  }
  return supported;
}
