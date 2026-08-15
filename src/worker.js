// Web Worker 入口：接收压缩任务，把结果或错误发回主线程
import { compressImage } from './compression.js';

self.onmessage = async (event) => {
  const { id, file, settings, crop, rev } = event.data;
  try {
    const result = await compressImage(file, settings, crop);
    self.postMessage({ id, rev, ok: true, ...result });
  } catch (error) {
    self.postMessage({
      id,
      rev,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
