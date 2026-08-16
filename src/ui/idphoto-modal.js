// 证件照排版入口弹窗：选规格 / 底色 / 张数，交 Worker 合成后下载
import { t } from './i18n.js';
import { downloadBlob } from './download.js';
import { planIdPhotoGrid } from '../utils/id-photo.js';

let worker = null;
const callbacks = new Map();
let nextId = 1;

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('../idphoto-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (event) => {
      const cb = callbacks.get(event.data.id);
      if (!cb) return;
      callbacks.delete(event.data.id);
      if (event.data.ok) cb.resolve(event.data.result);
      else cb.reject(new Error(event.data.error || t('idphoto.fail')));
    };
  }
  return worker;
}

function runCompose(blob, options) {
  return new Promise((resolve, reject) => {
    const id = nextId;
    nextId += 1;
    callbacks.set(id, { resolve, reject });
    getWorker().postMessage({ id, blob, options });
  });
}

/**
 * 打开证件照排版弹窗。
 * @param {Blob} sourceBlob 源图（通常为裁剪/处理后的结果）
 * @param {string} basename 输出文件名主名
 */
export function openIdPhotoModal(sourceBlob, basename) {
  const overlay = document.createElement('div');
  overlay.className = 'compare-overlay';
  overlay.innerHTML = `
    <div class="compare-dialog idphoto-dialog" role="dialog" aria-modal="true" aria-label="${t('idphoto.title')}">
      <div class="compare-head">
        <span>${t('idphoto.title')}</span>
        <button class="crop-close" data-action="cancel" type="button" aria-label="${t('idphoto.close')}">✕</button>
      </div>
      <label class="field">
        <span class="field-label" data-i18n="idphoto.unit">规格</span>
        <select data-idphoto="unit">
          <option value="1in">${t('idphoto.unit.1in')}</option>
          <option value="2in">${t('idphoto.unit.2in')}</option>
        </select>
      </label>
      <label class="field">
        <span class="field-label" data-i18n="idphoto.background">底色</span>
        <select data-idphoto="background">
          <option value="white">${t('idphoto.background.white')}</option>
          <option value="red">${t('idphoto.background.red')}</option>
          <option value="blue">${t('idphoto.background.blue')}</option>
        </select>
      </label>
      <label class="field">
        <span class="field-label" data-i18n="idphoto.count">张数</span>
        <input type="number" min="1" value="1" data-idphoto="count" />
        <small class="field-note" data-idphoto="capacity"></small>
      </label>
      <div class="crop-actions">
        <button class="btn btn-ghost" data-action="cancel" type="button">${t('idphoto.cancel')}</button>
        <button class="btn btn-primary" data-action="generate" type="button">${t('idphoto.generate')}</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  const unitSel = overlay.querySelector('[data-idphoto="unit"]');
  const countInput = overlay.querySelector('[data-idphoto="count"]');
  const capacityNote = overlay.querySelector('[data-idphoto="capacity"]');
  const generateBtn = overlay.querySelector('[data-action="generate"]');

  function capacity() {
    return planIdPhotoGrid({ unit: unitSel.value, dpi: 300, paper: '4x6in' }).capacity;
  }

  function syncCapacity() {
    const cap = capacity();
    countInput.max = cap;
    countInput.value = Math.min(Math.max(1, Number(countInput.value) || 1), cap);
    capacityNote.textContent = t('idphoto.count.note', { n: cap });
  }

  unitSel.addEventListener('change', syncCapacity);
  syncCapacity();

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
    const options = {
      unit: unitSel.value,
      background: overlay.querySelector('[data-idphoto="background"]').value,
      count: Number(countInput.value) || 1,
      dpi: 300,
    };
    generateBtn.disabled = true;
    const original = generateBtn.textContent;
    generateBtn.textContent = t('idphoto.processing');
    try {
      const { blob } = await runCompose(sourceBlob, options);
      downloadBlob(blob, `${basename}-idphoto.png`);
      close();
    } catch (error) {
      generateBtn.disabled = false;
      generateBtn.textContent = original;
      capacityNote.textContent = t('idphoto.fail') + error.message;
    }
  }
}
