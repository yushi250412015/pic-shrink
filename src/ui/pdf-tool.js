import { escapeHtml } from '../utils/dom.js';
import { formatBytes } from '../utils/bytes.js';
import { splitExtension } from '../utils/filename.js';
import { applyPageOperations } from '../utils/pdf-pages.js';
import { downloadBlob } from './download.js';
import { t } from './i18n.js';

export function initPdfTool(root) {
  const dropZone = root.querySelector('[data-pdf-dropzone]');
  const input = root.querySelector('[data-pdf-input]');
  const list = root.querySelector('[data-pdf-list]');
  const emptyState = root.querySelector('[data-pdf-empty]');
  const rangeInput = root.querySelector('[data-pdf-range]');
  const statusEl = root.querySelector('[data-pdf-status]');
  const pagesPanel = root.querySelector('[data-pdf-pages]');
  const pagesList = root.querySelector('[data-pdf-page-list]');
  const pagesApply = root.querySelector('[data-pdf-pages-apply]');

  const files = [];
  const callbacks = new Map();
  let nextId = 1;
  let pagesInfo = null; // { file, pageCount, ops: [] }（仅单文件时可用）

  const worker = new Worker(new URL('../pdf-worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = (event) => {
    const cb = callbacks.get(event.data.id);
    if (!cb) return;
    callbacks.delete(event.data.id);
    if (event.data.ok) cb.resolve(event.data.result);
    else cb.reject(new Error(event.data.error || t('pdf.fail')));
  };

  function run(op, payload) {
    return new Promise((resolve, reject) => {
      const id = nextId;
      nextId += 1;
      callbacks.set(id, { resolve, reject });
      worker.postMessage({ id, op, ...payload });
    });
  }

  const stripName = (name) => splitExtension(name).base;

  function setStatus(text) {
    statusEl.textContent = text || '';
    statusEl.hidden = !text;
  }

  function setBusy(busy) {
    for (const btn of root.querySelectorAll('[data-pdf-action]')) btn.disabled = busy;
    if (pagesApply) pagesApply.disabled = busy;
  }

  function render() {
    if (!files.length) {
      list.innerHTML = '';
      emptyState.hidden = false;
      syncPagesPanel();
      return;
    }
    emptyState.hidden = true;
    list.innerHTML = files
      .map(
        (file, i) => `
      <li class="file-item">
        <div class="item-head">
          <span class="item-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
          <div class="item-head-actions">
            <span class="status status-neutral">${formatBytes(file.size)}</span>
            <button class="btn btn-ghost btn-small" data-pdf-remove="${i}" type="button">${t('list.remove')}</button>
          </div>
        </div>
      </li>`,
      )
      .join('');
    syncPagesPanel();
  }

  function renderPages() {
    if (!pagesInfo || !pagesList) return;
    const plan = applyPageOperations(pagesInfo.pageCount, pagesInfo.ops);
    if (!plan.length) {
      pagesList.innerHTML = `<li class="pdf-page-row"><span>${t('pdf.pages.noPages')}</span></li>`;
      return;
    }
    pagesList.innerHTML = plan
      .map((page, i) => {
        const rotations = page.angle === 0 ? 0 : (360 - page.angle) / 90;
        const upDisabled = i === 0 ? 'disabled' : '';
        const downDisabled = i === plan.length - 1 ? 'disabled' : '';
        return `
        <li class="pdf-page-row">
          <span class="pdf-page-num">${t('pdf.page', { n: page.originalIndex + 1 })}</span>
          ${rotations ? `<span class="status status-neutral">↺ ${rotations}</span>` : ''}
          <div class="pdf-page-actions">
            <button class="btn btn-ghost btn-small" data-pages="move" data-i="${i}" data-delta="-1" ${upDisabled} type="button">${t('pdf.moveUp')}</button>
            <button class="btn btn-ghost btn-small" data-pages="move" data-i="${i}" data-delta="1" ${downDisabled} type="button">${t('pdf.moveDown')}</button>
            <button class="btn btn-ghost btn-small" data-pages="rotate" data-i="${i}" type="button">${t('pdf.rotateLeft')}</button>
            <button class="btn btn-ghost btn-small" data-pages="delete" data-i="${i}" type="button">${t('pdf.deletePage')}</button>
          </div>
        </li>`;
      })
      .join('');
  }

  async function syncPagesPanel() {
    if (!pagesPanel) return;
    if (files.length !== 1) {
      pagesInfo = null;
      pagesPanel.hidden = true;
      pagesList.innerHTML = '';
      return;
    }
    const file = files[0];
    if (pagesInfo && pagesInfo.file === file) {
      pagesPanel.hidden = false;
      renderPages();
      return;
    }
    pagesPanel.hidden = false;
    pagesList.innerHTML = `<li class="pdf-page-row"><span>${t('pdf.pages.processing')}</span></li>`;
    try {
      const { pageCount } = await run('info', { files: [file] });
      if (files.length === 1 && files[0] === file) {
        pagesInfo = { file, pageCount, ops: [] };
        renderPages();
      }
    } catch (e) {
      pagesList.innerHTML = `<li class="pdf-page-row"><span>${t('pdf.pages.fail')}${escapeHtml(e.message)}</span></li>`;
    }
  }

  async function doRebuild() {
    if (!pagesInfo) {
      setStatus(t('pdf.pages.needOne'));
      return;
    }
    setBusy(true);
    setStatus(t('pdf.pages.processing'));
    try {
      const { blob } = await run('rebuild', { files: [pagesInfo.file], operations: pagesInfo.ops });
      downloadBlob(blob, `${stripName(pagesInfo.file.name)}-edited.pdf`);
      setStatus(t('pdf.pages.done'));
    } catch (e) {
      setStatus(t('pdf.pages.fail') + e.message);
    } finally {
      setBusy(false);
    }
  }

  function addFiles(incoming) {
    const pdfs = incoming.filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
    );
    if (!pdfs.length) return;
    files.push(...pdfs);
    render();
  }

  async function downloadResults(results, zipName) {
    if (results.length === 1) {
      downloadBlob(results[0].blob, results[0].name);
      return;
    }
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    for (const r of results) zip.file(r.name, r.blob);
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, zipName);
  }

  async function doMerge() {
    if (files.length < 2) {
      setStatus(t('pdf.merge.need2'));
      return;
    }
    setBusy(true);
    setStatus(t('pdf.merging'));
    try {
      const { blob } = await run('merge', { files: [...files] });
      downloadBlob(blob, 'merged.pdf');
      setStatus(t('pdf.merged'));
    } catch (e) {
      setStatus(t('pdf.merge.fail') + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function doSplit() {
    if (!files.length) return;
    setBusy(true);
    setStatus(t('pdf.splitting'));
    try {
      const results = [];
      for (const file of files) {
        const pages = await run('split', { files: [file] });
        const base = stripName(file.name);
        for (const p of pages) results.push({ blob: p.blob, name: `${base}-page-${p.page}.pdf` });
      }
      await downloadResults(results, 'pdf-split.zip');
      setStatus(t('pdf.split.done'));
    } catch (e) {
      setStatus(t('pdf.split.fail') + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function doExtract() {
    if (!files.length) return;
    const spec = rangeInput.value.trim();
    if (!spec) {
      setStatus(t('pdf.range.need'));
      return;
    }
    setBusy(true);
    setStatus(t('pdf.extracting'));
    try {
      const results = [];
      for (const file of files) {
        const { blob } = await run('extract', { files: [file], spec });
        results.push({ blob, name: `${stripName(file.name)}-extracted.pdf` });
      }
      await downloadResults(results, 'pdf-extract.zip');
      setStatus(t('pdf.extract.done'));
    } catch (e) {
      setStatus(t('pdf.extract.fail') + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function doOptimize() {
    if (!files.length) return;
    setBusy(true);
    setStatus(t('pdf.optimizing'));
    try {
      const results = [];
      for (const file of files) {
        const { blob } = await run('optimize', { files: [file] });
        results.push({ blob, name: `${stripName(file.name)}-optimized.pdf` });
      }
      await downloadResults(results, 'pdf-optimize.zip');
      setStatus(t('pdf.optimize.done'));
    } catch (e) {
      setStatus(t('pdf.optimize.fail') + e.message);
    } finally {
      setBusy(false);
    }
  }

  dropZone.addEventListener('click', () => input.click());
  dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      input.click();
    }
  });
  input.addEventListener('change', () => {
    addFiles([...input.files]);
    input.value = '';
  });

  for (const ev of ['dragenter', 'dragover']) {
    dropZone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropZone.classList.add('is-dragover');
    });
  }
  for (const ev of ['dragleave', 'drop']) {
    dropZone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropZone.classList.remove('is-dragover');
    });
  }
  dropZone.addEventListener('drop', (e) => addFiles([...(e.dataTransfer?.files || [])]));

  root.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('[data-pdf-action]');
    if (actionBtn) {
      const action = actionBtn.dataset.pdfAction;
      if (action === 'merge') doMerge();
      else if (action === 'split') doSplit();
      else if (action === 'extract') doExtract();
      else if (action === 'optimize') doOptimize();
      return;
    }
    const removeBtn = e.target.closest('[data-pdf-remove]');
    if (removeBtn) {
      files.splice(Number(removeBtn.dataset.pdfRemove), 1);
      render();
      return;
    }
    const pageBtn = e.target.closest('[data-pages]');
    if (pageBtn && pagesInfo) {
      const i = Number(pageBtn.dataset.i);
      const kind = pageBtn.dataset.pages;
      if (kind === 'move') pagesInfo.ops.push({ type: 'move', index: i, delta: Number(pageBtn.dataset.delta) });
      else if (kind === 'rotate') pagesInfo.ops.push({ type: 'rotate', index: i });
      else if (kind === 'delete') pagesInfo.ops.push({ type: 'delete', index: i });
      renderPages();
      return;
    }
    if (e.target.closest('[data-pdf-pages-apply]')) {
      doRebuild();
    }
  });

  render();
}
