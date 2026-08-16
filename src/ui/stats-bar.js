import { formatBytes, calcSavedPercent } from '../utils/bytes.js';
import { emptyStats, recordProcessing } from '../utils/stats.js';
import { t } from './i18n.js';

const STORAGE_KEY = 'ps-stats';

function loadLifetime() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStats();
    const parsed = JSON.parse(raw);
    return { ...emptyStats(), ...parsed };
  } catch {
    return emptyStats();
  }
}

function saveLifetime(stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // localStorage 不可用时仅保留内存累计
  }
}

export function initStatsBar(root, store) {
  const body = root.querySelector('[data-stats-body]');
  const lifetimeEl = root.querySelector('[data-lifetime]');
  let lifetime = loadLifetime();
  const counted = new Set(); // 本会话已计入累计的 item id，避免重渲染重复累加

  function render() {
    const items = [...store.getState().items.values()];

    let processed = 0;
    let okCount = 0;
    let originalSum = 0;
    let outputSum = 0;
    let addedFiles = 0;
    let addedSaved = 0;

    for (const item of items) {
      if (item.status === 'done' || item.status === 'error') {
        processed += 1;
        originalSum += item.file.size;
      }
      if (item.status === 'done') {
        okCount += 1;
        outputSum += item.result.blob.size;
        if (!counted.has(item.id)) {
          counted.add(item.id);
          addedFiles += 1;
          addedSaved += Math.max(0, item.file.size - item.result.blob.size);
        }
      }
    }

    // 每次处理完成（done）累加到持久化统计
    if (addedFiles > 0) {
      lifetime = recordProcessing(lifetime, { files: addedFiles, savedBytes: addedSaved });
      saveLifetime(lifetime);
    }

    if (!items.length && lifetime.totalFiles === 0) {
      root.hidden = true;
      return;
    }

    const saved = originalSum > 0 ? calcSavedPercent(originalSum, outputSum) : 0;
    const cls = saved > 0 ? 'good' : saved < 0 ? 'bad' : 'neutral';
    const sign = saved > 0 ? '' : saved < 0 ? '-' : '';

    root.hidden = false;
    body.innerHTML = `
      <div class="stat"><span>${t('stats.count')}</span><b>${items.length}</b></div>
      <div class="stat"><span>${t('stats.original')}</span><b>${formatBytes(originalSum)}</b></div>
      <div class="stat"><span>${t('stats.output')}</span><b>${formatBytes(outputSum)}</b></div>
      <div class="stat ${cls}"><span>${t('stats.saved')}</span><b>${sign}${Math.abs(saved)}%</b></div>
      <div class="stat"><span>${t('stats.progress')}</span><b>${processed}/${items.length}</b></div>`;

    if (lifetimeEl && lifetime.totalFiles > 0) {
      lifetimeEl.hidden = false;
      lifetimeEl.textContent = t('stats.lifetime', {
        n: lifetime.totalFiles,
        x: formatBytes(lifetime.totalSavedBytes),
        m: lifetime.totalSessions,
      });
    } else if (lifetimeEl) {
      lifetimeEl.hidden = true;
    }
  }

  store.subscribe(render);
  render();
}
