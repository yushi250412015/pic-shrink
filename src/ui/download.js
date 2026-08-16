import { splitExtension, replaceExtension, makeUnique } from '../utils/filename.js';
import { applyRenameTemplate } from '../utils/rename.js';

/** 触发浏览器下载（object URL 延迟回收） */
export function triggerDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function downloadBlob(blob, filename) {
  triggerDownload(URL.createObjectURL(blob), filename);
}

/** 按重命名模板生成输出文件名；扩展名始终与输出格式一致 */
export function outputNameFor(file, format, settings, { index = 0, date = new Date() } = {}) {
  const { base, ext } = splitExtension(file.name);
  const template = settings.renameTemplate || '{name}';
  const rendered = applyRenameTemplate(template, { name: base, ext, index, date });
  return replaceExtension(rendered, format);
}

/** 把所有完成项打包成 ZIP 下载；返回是否成功打包 */
export async function downloadAllAsZip(items, settings) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const used = new Set();
  const date = new Date();
  let count = 0;

  for (const item of items.values()) {
    if (item.status !== 'done' || !item.result) continue;
    const name = makeUnique(outputNameFor(item.file, item.result.format, settings, { index: count, date }), used);
    zip.file(name, item.result.blob);
    count += 1;
  }

  if (!count) return false;

  const blob = await zip.generateAsync({ type: 'blob' });
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  downloadBlob(blob, `pic-shrink-${stamp}.zip`);
  return true;
}
