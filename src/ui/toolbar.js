import { downloadAllAsZip } from './download.js';
import { openImg2PdfModal } from './img2pdf-modal.js';
import { openStitchModal } from './stitch-modal.js';
import { t } from './i18n.js';

export function initToolbar(root, store) {
  const downloadAll = root.querySelector('[data-download-all]');
  const clearBtn = root.querySelector('[data-clear]');
  const img2pdfBtn = root.querySelector('[data-img2pdf]');
  const stitchBtn = root.querySelector('[data-stitch]');

  function render() {
    const items = [...store.getState().items.values()];
    const doneItems = items.filter((item) => item.status === 'done' && item.result);
    downloadAll.hidden = doneItems.length === 0;
    if (img2pdfBtn) img2pdfBtn.hidden = doneItems.length === 0;
    if (stitchBtn) stitchBtn.hidden = doneItems.length < 2;
    clearBtn.hidden = items.length === 0;
  }

  downloadAll.addEventListener('click', async () => {
    downloadAll.disabled = true;
    const original = downloadAll.textContent;
    downloadAll.textContent = t('toolbar.packaging');
    try {
      await downloadAllAsZip(store.getState().items, store.getSettings());
    } finally {
      downloadAll.disabled = false;
      downloadAll.textContent = original;
    }
  });

  if (img2pdfBtn) {
    img2pdfBtn.addEventListener('click', () => {
      const blobs = [...store.getState().items.values()]
        .filter((item) => item.status === 'done' && item.result)
        .map((item) => item.result.blob);
      openImg2PdfModal(blobs);
    });
  }

  if (stitchBtn) {
    stitchBtn.addEventListener('click', () => {
      const blobs = [...store.getState().items.values()]
        .filter((item) => item.status === 'done' && item.result)
        .map((item) => item.result.blob);
      openStitchModal(blobs);
    });
  }

  clearBtn.addEventListener('click', () => store.clear());

  store.subscribe(render);
  render();
}
