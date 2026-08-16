// 证件照排版 Worker 入口：接收源图与排版参数，返回合成的 PNG
import { composeIdPhotos } from './idphoto.js';

self.onmessage = async (event) => {
  const { id, blob, options } = event.data;
  try {
    const result = await composeIdPhotos(blob, options);
    self.postMessage({ id, ok: true, result });
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
