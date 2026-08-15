import { formatBytes, calcSavedPercent } from '../utils/bytes.js';
import { escapeHtml } from '../utils/dom.js';
import { outputNameFor, downloadBlob } from './download.js';
import { openCropModal } from './crop-modal.js';
import { t } from './i18n.js';

export function initFileList(root, store, pipeline) {
  const list = root.querySelector('[data-file-list]');
  const emptyState = root.querySelector('[data-empty-state]');
  const urls = new Map(); // id -> { original, output }
  let activePreview = null;

  function ensureUrls(item) {
    let entry = urls.get(item.id);
    if (!entry && item.result) {
      entry = {
        original: URL.createObjectURL(item.file),
        output: URL.createObjectURL(item.result.blob),
      };
      urls.set(item.id, entry);
    }
    return entry || null;
  }

  function releaseUrls(id) {
    const entry = urls.get(id);
    if (!entry) return;
    URL.revokeObjectURL(entry.original);
    URL.revokeObjectURL(entry.output);
    urls.delete(id);
  }

  function statusBadge(item) {
    if (item.status === 'done') {
      const saved = calcSavedPercent(item.file.size, item.result.blob.size);
      const cls = saved > 0 ? 'good' : saved < 0 ? 'bad' : 'neutral';
      const arrow = saved > 0 ? '↓' : saved < 0 ? '↑' : '·';
      return `<span class="status status-${cls}">${arrow} ${Math.abs(saved)}%</span>`;
    }
    if (item.status === 'error') return `<span class="status status-error">${t('list.failed')}</span>`;
    const label = item.status === 'queued' ? t('list.queued') : t('list.processing');
    return `<span class="status status-pending">${label}</span>`;
  }

  function doneBody(item) {
    const entry = ensureUrls(item);
    const { result } = item;

    const rows = [
      [t('list.meta.original'), formatBytes(item.file.size)],
      [t('list.meta.output'), formatBytes(result.blob.size)],
      [t('list.meta.dim'), `${result.width} × ${result.height}`],
      [t('list.meta.originalDim'), `${result.originalWidth} × ${result.originalHeight}`],
      [t('list.meta.format'), result.format.toUpperCase()],
    ]
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([label, value]) => `<div class="meta-row"><span>${label}</span><b>${value}</b></div>`)
      .join('');

    const gifNote =
      item.file.type === 'image/gif' && result.format === 'gif'
        ? `<div class="meta-row"><b>${t('list.gif.note')}</b></div>`
        : '';

    return `
      <div class="item-body">
        <div class="preview">
          <img class="preview-img" data-preview data-id="${item.id}" src="${entry.output}" alt="${t('list.preview.tag')}" draggable="false" />
          <span class="preview-tag">${t('list.preview.tag')}</span>
        </div>
        <div class="meta">
          ${rows}
          ${gifNote}
          <div class="meta-actions">
            <button class="btn btn-primary" data-action="download" data-id="${item.id}" type="button">${t('list.download')}</button>
            <button class="btn btn-ghost" data-action="remove" data-id="${item.id}" type="button">${t('list.remove')}</button>
          </div>
        </div>
      </div>`;
  }

  function renderItem(item) {
    const cropLabel = item.crop ? t('list.crop.adjust') : t('list.crop');
    const head = `
      <div class="item-head">
        <span class="item-name" title="${escapeHtml(item.file.name)}">${escapeHtml(item.file.name)}</span>
        <div class="item-head-actions">
          <button class="btn btn-ghost btn-small" data-action="crop" data-id="${item.id}" type="button">${cropLabel}</button>
          ${statusBadge(item)}
        </div>
      </div>`;

    if (item.status === 'done') return `<li class="file-item" id="item-${item.id}">${head}${doneBody(item)}</li>`;
    if (item.status === 'error') {
      return `<li class="file-item" id="item-${item.id}">${head}<div class="error-box">⚠️ ${escapeHtml(item.error)}</div></li>`;
    }
    return `<li class="file-item" id="item-${item.id}">${head}</li>`;
  }

  function render() {
    const { items } = store.getState();
    const entries = [...items.values()];

    const liveIds = new Set(items.keys());
    for (const id of [...urls.keys()]) {
      if (!liveIds.has(id)) releaseUrls(id);
    }

    if (!entries.length) {
      list.innerHTML = '';
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;
    list.innerHTML = entries.map(renderItem).join('');
  }

  list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const id = Number(button.dataset.id);
    const item = store.getState().items.get(id);
    if (!item) return;

    if (button.dataset.action === 'crop') {
      openCropModal(item.file, {
        onConfirm: (crop) => {
          store.setItemCrop(id, crop);
          pipeline.rerunItem(id);
        },
        onClear: () => {
          store.setItemCrop(id, null);
          pipeline.rerunItem(id);
        },
      });
      return;
    }
    if (button.dataset.action === 'download') {
      const name = outputNameFor(item.file, item.result.format, store.getSettings());
      downloadBlob(item.result.blob, name);
    } else if (button.dataset.action === 'remove') {
      releaseUrls(id);
      store.removeItem(id);
    }
  });

  list.addEventListener('pointerdown', (event) => {
    const img = event.target.closest('[data-preview]');
    if (!img) return;
    const entry = urls.get(Number(img.dataset.id));
    if (!entry) return;
    event.preventDefault();
    img.src = entry.original;
    img.closest('.file-item')?.classList.add('is-comparing');
    activePreview = { img, outputUrl: entry.output };
  });

  function resetPreview() {
    if (!activePreview) return;
    activePreview.img.src = activePreview.outputUrl;
    activePreview.img.closest('.file-item')?.classList.remove('is-comparing');
    activePreview = null;
  }
  window.addEventListener('pointerup', resetPreview);
  window.addEventListener('pointercancel', resetPreview);

  store.subscribe(render);
  render();
}
