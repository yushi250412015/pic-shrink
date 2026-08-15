import { downloadAllAsZip } from './download.js';
import { t } from './i18n.js';

export function initToolbar(root, store) {
  const downloadAll = root.querySelector('[data-download-all]');
  const clearBtn = root.querySelector('[data-clear]');

  function render() {
    const items = [...store.getState().items.values()];
    downloadAll.hidden = !items.some((item) => item.status === 'done');
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

  clearBtn.addEventListener('click', () => store.clear());

  store.subscribe(render);
  render();
}
