// PDF 处理核心：合并 / 拆分 / 提取页 / 优化压缩 / 页面操作。运行在 Web Worker 中。
import { PDFDocument, degrees } from 'pdf-lib';
import { expandRanges, applyPageOperations } from './utils/pdf-pages.js';

async function loadDoc(file) {
  const bytes = await file.arrayBuffer();
  return PDFDocument.load(bytes, { ignoreEncryption: true });
}

function toBlob(bytes) {
  return new Blob([bytes], { type: 'application/pdf' });
}

/** 按顺序合并多个 PDF 为一个 */
export async function mergePdfs(files) {
  const out = await PDFDocument.create();
  for (const file of files) {
    const src = await loadDoc(file);
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((page) => out.addPage(page));
  }
  const bytes = await out.save({ useObjectStreams: true });
  return { blob: toBlob(bytes), pageCount: out.getPageCount() };
}

/** 把一个 PDF 拆成单页，返回每页的 blob */
export async function splitPdf(file) {
  const src = await loadDoc(file);
  const results = [];
  for (let i = 0; i < src.getPageCount(); i += 1) {
    const doc = await PDFDocument.create();
    const [page] = await doc.copyPages(src, [i]);
    doc.addPage(page);
    const bytes = await doc.save({ useObjectStreams: true });
    results.push({ blob: toBlob(bytes), page: i + 1 });
  }
  return results;
}

/** 提取指定页码范围为一个新 PDF */
export async function extractPages(file, spec) {
  const src = await loadDoc(file);
  const indices = expandRanges(spec, src.getPageCount());
  if (!indices.length) throw new Error('页码范围未匹配到任何页');
  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(src, indices);
  pages.forEach((page) => doc.addPage(page));
  const bytes = await doc.save({ useObjectStreams: true });
  return { blob: toBlob(bytes), pageCount: doc.getPageCount() };
}

/** 读取 PDF 基本信息（页数等），用于页面操作 UI */
export async function getPdfInfo(file) {
  const src = await loadDoc(file);
  return { pageCount: src.getPageCount() };
}

/** 重存并启用对象流，减小体积（优化效果有限，视文件而定） */
export async function optimizePdf(file) {
  const src = await loadDoc(file);
  const bytes = await src.save({ useObjectStreams: true });
  return { blob: toBlob(bytes), pageCount: src.getPageCount() };
}

/**
 * 应用页面操作（旋转 / 删除 / 重排）后输出新 PDF。
 * @param {File} file
 * @param {Array<{type: string, index: number, delta?: number}>} operations
 */
export async function rebuildPdf(file, operations = []) {
  const src = await loadDoc(file);
  const plan = applyPageOperations(src.getPageCount(), operations);
  if (!plan.length) throw new Error('不能删除所有页面');

  const doc = await PDFDocument.create();
  const copied = await doc.copyPages(src, plan.map((p) => p.originalIndex));
  copied.forEach((page, i) => {
    const angle = plan[i].angle;
    if (angle) page.setRotation(degrees(angle));
    doc.addPage(page);
  });
  const bytes = await doc.save({ useObjectStreams: true });
  return { blob: toBlob(bytes), pageCount: doc.getPageCount() };
}
