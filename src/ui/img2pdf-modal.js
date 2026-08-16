// 图片转 PDF 入口弹窗：选页面尺寸模式，交 Worker 合成后下载
import { t } from './i18n.js';
import { downloadBlob } from './download.js';

let worker = null;
const callbacks = new Map();
let nextId = 1;

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('../pdf-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (event) => {
      const cb = callbacks.get(event.data.id);
      if (!cb) return;
      callbacks.delete(event.data.id);
      if (event.data.ok) cb.resolve(event.data.result);
      else cb.reject(new Error(event.data.error || t('img2pdf.fail')));
    };
  }
  return worker;
}

function run(blobs, mode) {
  return new Promise((resolve, reject) => {
    const id = nextId;
    nextId += 1;
    callbacks.set(id, { resolve, reject });
    getWorker().postMessage({ id, op: 'img2pdf', files: blobs, mode });
  });
}

/**
 * 打开「图片转 PDF」弹窗。
 * @param {Blob[]} blobs 已完成图片的结果 blob（按列表顺序，每图一页）
 */
export function openImg2PdfModal(blobs) {
  if (!blobs.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'compare-overlay';
  overlay.innerHTML = `
    <div class="compare-dialog idphoto-dialog" role="dialog" aria-modal="true" aria-label="${t('img2pdf.title')}">
      <div class="compare-head">
        <span>${t('img2pdf.title')}</span>
        <button class="crop-close" data-action="cancel" type="button" aria-label="${t('img2pdf.close')}">✕</button>
      </div>
      <fieldset class="img2pdf-modes">
        <legend class="field-label">${t('img2pdf.mode')}</legend>
        <label class="radio">
          <input type="radio" name="img2pdf-mode" value="original" />
          <span>${t('img2pdf.mode.original')}</span>
        </label>
        <label class="radio">
          <input type="radio" name="img2pdf-mode" value="a4" checked />
          <span>${t('img2pdf.mode.a4')}</span>
        </label>
      </fieldset>
      <small class="field-note" data-img2pdf-note>${t('img2pdf.note', { n: blobs.length })}</small>
      <div class="crop-actions">
        <button class="btn btn-ghost" data-action="cancel" type="button">${t('img2pdf.cancel')}</button>
        <button class="btn btn-primary" data-action="generate" type="button">${t('img2pdf.generate')}</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  const generateBtn = overlay.querySelector('[data-action="generate"]');
  const note = overlay.querySelector('[data-img2pdf-note]');

  function close() {
    window.removeEventListener('keydown', onKey);
    overlay.remove();
  }
  function onKey(event) {
    if (event.key === 'Escape') close();
  }
  window.addEventListener('keydown', onKey);

  overlay.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'cancel') close();
    else if (action === 'generate') generate();
    else if (event.target === overlay) close();
  });

  async function generate() {
    const mode = overlay.querySelector('input[name="img2pdf-mode"]:checked')?.value || 'a4';
    generateBtn.disabled = true;
    const original = generateBtn.textContent;
    generateBtn.textContent = t('img2pdf.processing');
    try {
      const { blob } = await run(blobs, mode);
      downloadBlob(blob, 'pic-shrink-images.pdf');
      close();
    } catch (error) {
      generateBtn.disabled = false;
      generateBtn.textContent = original;
      note.textContent = t('img2pdf.fail') + error.message;
    }
  }
}
