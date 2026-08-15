import { escapeHtml } from '../utils/dom.js';
import { formatBytes } from '../utils/bytes.js';
import { splitExtension } from '../utils/filename.js';
import { downloadBlob } from './download.js';

export function initPdfTool(root) {
  const dropZone = root.querySelector('[data-pdf-dropzone]');
  const input = root.querySelector('[data-pdf-input]');
  const list = root.querySelector('[data-pdf-list]');
  const emptyState = root.querySelector('[data-pdf-empty]');
  const rangeInput = root.querySelector('[data-pdf-range]');
  const statusEl = root.querySelector('[data-pdf-status]');

  const files = [];
  const callbacks = new Map();
  let nextId = 1;

  const worker = new Worker(new URL('../pdf-worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = (event) => {
    const cb = callbacks.get(event.data.id);
    if (!cb) return;
    callbacks.delete(event.data.id);
    if (event.data.ok) cb.resolve(event.data.result);
    else cb.reject(new Error(event.data.error || '处理失败'));
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
  }

  function render() {
    if (!files.length) {
      list.innerHTML = '';
      emptyState.hidden = false;
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
            <button class="btn btn-ghost btn-small" data-pdf-remove="${i}" type="button">移除</button>
          </div>
        </div>
      </li>`,
      )
      .join('');
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
      setStatus('至少需要 2 个 PDF 才能合并');
      return;
    }
    setBusy(true);
    setStatus('合并中…');
    try {
      const { blob } = await run('merge', { files: [...files] });
      downloadBlob(blob, 'merged.pdf');
      setStatus('合并完成');
    } catch (e) {
      setStatus(`合并失败：${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function doSplit() {
    if (!files.length) return;
    setBusy(true);
    setStatus('拆分中…');
    try {
      const results = [];
      for (const file of files) {
        const pages = await run('split', { files: [file] });
        const base = stripName(file.name);
        for (const p of pages) results.push({ blob: p.blob, name: `${base}-第${p.page}页.pdf` });
      }
      await downloadResults(results, 'pdf-split.zip');
      setStatus('拆分完成');
    } catch (e) {
      setStatus(`拆分失败：${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function doExtract() {
    if (!files.length) return;
    const spec = rangeInput.value.trim();
    if (!spec) {
      setStatus('请先输入页码范围，如 1-3,5');
      return;
    }
    setBusy(true);
    setStatus('提取中…');
    try {
      const results = [];
      for (const file of files) {
        const { blob } = await run('extract', { files: [file], spec });
        results.push({ blob, name: `${stripName(file.name)}-提取.pdf` });
      }
      await downloadResults(results, 'pdf-extract.zip');
      setStatus('提取完成');
    } catch (e) {
      setStatus(`提取失败：${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function doOptimize() {
    if (!files.length) return;
    setBusy(true);
    setStatus('优化中…');
    try {
      const results = [];
      for (const file of files) {
        const { blob } = await run('optimize', { files: [file] });
        results.push({ blob, name: `${stripName(file.name)}-优化.pdf` });
      }
      await downloadResults(results, 'pdf-optimize.zip');
      setStatus('优化完成');
    } catch (e) {
      setStatus(`优化失败：${e.message}`);
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
    }
  });

  render();
}
