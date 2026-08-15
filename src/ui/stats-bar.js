import { formatBytes, calcSavedPercent } from '../utils/bytes.js';

export function initStatsBar(root, store) {
  const body = root.querySelector('[data-stats-body]');

  function render() {
    const items = [...store.getState().items.values()];
    if (!items.length) {
      root.hidden = true;
      return;
    }

    let processed = 0;
    let okCount = 0;
    let originalSum = 0;
    let outputSum = 0;

    for (const item of items) {
      if (item.status === 'done' || item.status === 'error') {
        processed += 1;
        originalSum += item.file.size;
      }
      if (item.status === 'done') {
        okCount += 1;
        outputSum += item.result.blob.size;
      }
    }

    const saved = originalSum > 0 ? calcSavedPercent(originalSum, outputSum) : 0;
    const cls = saved > 0 ? 'good' : saved < 0 ? 'bad' : 'neutral';
    const sign = saved > 0 ? '' : saved < 0 ? '-' : '';

    root.hidden = false;
    body.innerHTML = `
      <div class="stat"><span>图片数</span><b>${items.length}</b></div>
      <div class="stat"><span>原始大小</span><b>${formatBytes(originalSum)}</b></div>
      <div class="stat"><span>压缩后</span><b>${formatBytes(outputSum)}</b></div>
      <div class="stat ${cls}"><span>共节省</span><b>${sign}${Math.abs(saved)}%</b></div>
      <div class="stat"><span>进度</span><b>${processed}/${items.length}</b></div>`;
  }

  store.subscribe(render);
  render();
}
