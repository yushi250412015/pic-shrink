// 长截图拼接入口弹窗：选方向 / 间距 / 对齐，交 Worker 合成后下载
import { t } from './i18n.js';
import { downloadBlob } from './download.js';

let worker = null;
const callbacks = new Map();
let nextId = 1;

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('../stitch-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (event) => {
      const cb = callbacks.get(event.data.id);
      if (!cb) return;
      callbacks.delete(event.data.id);
      if (event.data.ok) cb.resolve(event.data.result);
      else cb.reject(new Error(event.data.error || t('stitch.fail')));
    };
  }
  return worker;
}

function run(blobs, options) {
  return new Promise((resolve, reject) => {
    const id = nextId;
    nextId += 1;
    callbacks.set(id, { resolve, reject });
    getWorker().postMessage({ id, files: blobs, options });
  });
}

export function openStitchModal(blobs) {
  if (!blobs.length || blobs.length < 2) return;

  const overlay = document.createElement('div');
  overlay.className = 'compare-overlay';
  overlay.innerHTML = `
    <div class="compare-dialog idphoto-dialog" role="dialog" aria-modal="true" aria-label="${t('stitch.title')}">
      <div class="compare-head">
        <span>${t('stitch.title')}</span>
        <button class="crop-close" data-action="cancel" type="button" aria-label="${t('stitch.close')}">✕</button>
      </div>
      <fieldset class="img2pdf-modes">
        <legend class="field-label">${t('stitch.direction')}</legend>
        <label class="radio">
          <input type="radio" name="stitch-direction" value="vertical" checked />
          <span>${t('stitch.direction.vertical')}</span>
        </label>
        <label class="radio">
          <input type="radio" name="stitch-direction" value="horizontal" />
          <span>${t('stitch.direction.horizontal')}</span>
        </label>
      </fieldset>
      <fieldset class="img2pdf-modes">
        <legend class="field-label">${t('stitch.align')}</legend>
        <label class="radio">
          <input type="radio" name="stitch-align" value="start" checked />
          <span>${t('stitch.align.start')}</span>
        </label>
        <label class="radio">
          <input type="radio" name="stitch-align" value="center" />
          <span>${t('stitch.align.center')}</span>
        </label>
        <label class="radio">
          <input type="radio" name="stitch-align" value="end" />
          <span>${t('stitch.align.end')}</span>
        </label>
      </fieldset>
      <label class="field">
        <span class="field-label">${t('stitch.gap')}</span>
        <input type="number" min="0" max="200" value="0" data-stitch-gap />
      </label>
      <small class="field-note" data-stitch-note>${t('stitch.note', { n: blobs.length })}</small>
      <div class="crop-actions">
        <button class="btn btn-ghost" data-action="cancel" type="button">${t('stitch.cancel')}</button>
        <button class="btn btn-primary" data-action="generate" type="button">${t('stitch.generate')}</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  const generateBtn = overlay.querySelector('[data-action="generate"]');
  const note = overlay.querySelector('[data-stitch-note]');

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
    const direction = overlay.querySelector('input[name="stitch-direction"]:checked')?.value || 'vertical';
    const align = overlay.querySelector('input[name="stitch-align"]:checked')?.value || 'start';
    const gap = Number(overlay.querySelector('[data-stitch-gap]')?.value) || 0;
    generateBtn.disabled = true;
    const original = generateBtn.textContent;
    generateBtn.textContent = t('stitch.processing');
    try {
      const { blob } = await run(blobs, { direction, gap, align });
      downloadBlob(blob, 'pic-shrink-stitch.png');
      close();
    } catch (error) {
      generateBtn.disabled = false;
      generateBtn.textContent = original;
      note.textContent = t('stitch.fail') + error.message;
    }
  }
}
