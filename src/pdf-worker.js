// PDF Worker 入口：接收操作，返回结果或错误
import { mergePdfs, splitPdf, extractPages, optimizePdf, rebuildPdf, getPdfInfo } from './pdf-core.js';

self.onmessage = async (event) => {
  const { id, op, files, spec, operations } = event.data;
  try {
    let result;
    if (op === 'merge') result = await mergePdfs(files);
    else if (op === 'split') result = await splitPdf(files[0]);
    else if (op === 'extract') result = await extractPages(files[0], spec);
    else if (op === 'optimize') result = await optimizePdf(files[0]);
    else if (op === 'rebuild') result = await rebuildPdf(files[0], operations);
    else if (op === 'info') result = await getPdfInfo(files[0]);
    else throw new Error(`未知操作: ${op}`);
    self.postMessage({ id, ok: true, result });
  } catch (error) {
    self.postMessage({ id, ok: false, error: error instanceof Error ? error.message : String(error) });
  }
};
