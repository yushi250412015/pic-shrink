// HEIC/HEIF 解码：在 Web Worker 内运行（由 compression.js 调用）。
//
// 选型：heic2any（纯 JS，无 WASM，npm 上最成熟的浏览器端 HEIC 解码库）。
// heic2any 内部会再 spawn 一个子 Worker 跑真正的 libheif 解码，因此慢的解码
// 不会卡线程；只有「ImageData -> Blob」这一步走 canvas。
//
// Worker 兼容性：heic2any 依赖三个主线程 API，在 Worker 里不存在，这里做最小化 polyfill：
//   1. window        —— heic2any 用 window.__heic2any__worker 持有其子 Worker
//   2. document      —— imageDataToBlob 用 document.createElement('canvas')
//   3. canvas.toBlob —— OffscreenCanvas 只有 convertToBlob，需包一层 Promise 回调
// 这些 polyfill 在 worker 内是安全的：gifsicle 等模块的环境探测在 import 期已完成，
// 且其 document.currentScript / IDBFS 路径不会因这些空对象而改变行为。

let patched = false;

function ensureWorkerPatches() {
  if (patched) return;
  patched = true;

  if (typeof window === 'undefined') {
    globalThis.window = globalThis.self;
  }
  if (typeof document === 'undefined') {
    globalThis.document = {
      createElement(tag) {
        return tag === 'canvas' ? new OffscreenCanvas(1, 1) : null;
      },
    };
  }
  if (typeof OffscreenCanvas !== 'undefined' && !OffscreenCanvas.prototype.toBlob) {
    OffscreenCanvas.prototype.toBlob = function toBlob(callback, type, quality) {
      this.convertToBlob({ type, quality }).then(
        (blob) => callback(blob),
        () => callback(null),
      );
    };
  }
}

/** 解析 heic2any 的 CommonJS/UMD 导出，兼容多种 interop 形态 */
function unwrapHeic2any(mod) {
  const raw = mod && (mod.default ?? mod);
  if (typeof raw === 'function') return raw;
  return raw && typeof raw.default === 'function' ? raw.default : raw;
}

/**
 * 把 HEIC/HEIF 文件解码为 JPEG Blob，供现有图片管线继续处理。
 * @param {File|Blob} file
 * @param {{quality?: number}} [options] JPEG 输出质量（0-1）
 * @returns {Promise<Blob>} type 为 image/jpeg 的 Blob
 */
export async function decodeHeicToJpeg(file, { quality = 0.92 } = {}) {
  ensureWorkerPatches();
  const mod = await import('heic2any');
  const heic2any = unwrapHeic2any(mod);
  if (typeof heic2any !== 'function') {
    throw new Error('HEIC 解码库加载失败');
  }
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality });
  const blob = Array.isArray(result) ? result[0] : result;
  if (!blob) throw new Error('HEIC 解码失败');
  return new Blob([blob], { type: 'image/jpeg' });
}
