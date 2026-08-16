// 拼接 Worker 入口：接收多张图片，返回拼接后的长图
import { stitchImages } from './stitch-core.js';

self.onmessage = async (event) => {
  const { id, files, options } = event.data;
  try {
    const result = await stitchImages(files, options);
    self.postMessage({ id, ok: true, result });
  } catch (error) {
    self.postMessage({ id, ok: false, error: error instanceof Error ? error.message : String(error) });
  }
};
