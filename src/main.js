// 主线程 UI 逻辑：拖拽上传、Worker 池调度、卡片渲染、统计与下载
import { formatBytes, calcSavedPercent, replaceExtension, makeUnique } from './format.js';
import JSZip from 'jszip';

const $ = (id) => document.getElementById(id);

const els = {
  dropZone: $('drop-zone'),
  fileInput: $('file-input'),
  list: $('file-list'),
  emptyState: $('empty-state'),
  stats: $('stats'),
  statsBody: $('stats-body'),
  format: $('format'),
  quality: $('quality'),
  qualityValue: $('quality-value'),
  scaleMode: $('scale-mode'),
  scaleValue: $('scale-value'),
  scaleValueField: $('scale-value-field'),
  rerun: $('rerun'),
  downloadAll: $('download-all'),
};

const state = {
  files: [], // 原始 File 列表（用于重新压缩）
  results: new Map(), // id -> { file, state, result, error, urls }
  queue: [], // 待处理任务 { id, file, settings }
  workers: [],
  nextId: 1,
  dirty: false, // 设置是否在添加文件后被修改过
};

/* ---------------- 设置面板 ---------------- */

const scaleMem = { longest: 1920, percent: 50 };
let currentMode = 'longest';

function readSettings() {
  return {
    formatChoice: els.format.value, // auto | jpeg | png | webp
    quality: Number(els.quality.value) / 100, // 0.1 ~ 1
    scaleMode: els.scaleMode.value, // none | longest | percent
    scaleValue: Number(els.scaleValue.value) || 0,
  };
}

function syncSettingsUI() {
  const mode = els.scaleMode.value;
  els.qualityValue.textContent = `${els.quality.value}%`;
  els.scaleValueField.classList.toggle('hidden', mode === 'none');
  if (mode === 'none') return;
  els.scaleValue.value = scaleMem[mode];
  els.scaleValue.max = mode === 'percent' ? 1000 : 20000;
  els.scaleValueField.querySelector('.field-label').textContent =
    mode === 'percent' ? '缩放比例（%）' : '最长边（像素）';
}

function onSettingChange() {
  syncSettingsUI();
  // 已经有结果时提示用户可一键重压
  if (state.results.size && !state.dirty) {
    state.dirty = true;
    els.rerun.hidden = false;
  }
}

/* ---------------- Worker 池 ---------------- */

function ensureWorkers() {
  if (state.workers.length) return;
  const count = Math.min(4, navigator.hardwareConcurrency || 2);
  for (let i = 0; i < count; i += 1) {
    const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    worker.busy = false;
    worker.onmessage = (event) => {
      worker.busy = false;
      onJobDone(event.data);
      pump();
    };
    worker.onerror = () => {
      worker.busy = false;
      pump();
    };
    state.workers.push(worker);
  }
}

function pump() {
  while (state.queue.length > 0) {
    const worker = state.workers.find((w) => !w.busy);
    if (!worker) break;
    const job = state.queue.shift();
    const rec = state.results.get(job.id);
    if (!rec) continue;
    rec.state = 'processing';
    worker.busy = true;
    renderCard(job.id);
    worker.postMessage(job);
  }
  updateStats();
}

function onJobDone(data) {
  const rec = state.results.get(data.id);
  if (!rec) return;
  if (data.ok) {
    rec.result = { blob: data.blob, width: data.width, height: data.height, format: data.format };
    rec.state = 'done';
  } else {
    rec.error = data.error || '未知错误';
    rec.state = 'error';
  }
  renderCard(data.id);
  updateStats();
}

/* ---------------- 文件队列 ---------------- */

function processFiles(files) {
  ensureWorkers();
  const images = files.filter((f) => f.type && f.type.startsWith('image/'));
  if (!images.length) return;
  const settings = readSettings();
  for (const file of images) {
    const id = state.nextId;
    state.nextId += 1;
    state.results.set(id, { file, state: 'queued', result: null, error: null, urls: [] });
    state.files.push(file);
    state.queue.push({ id, file, settings });
    renderCard(id);
  }
  state.dirty = false;
  els.rerun.hidden = true;
  pump();
}

function clearAll() {
  for (const rec of state.results.values()) {
    for (const url of rec.urls) URL.revokeObjectURL(url);
  }
  state.results.clear();
  state.files = [];
  state.queue.length = 0;
  els.list.innerHTML = '';
  updateStats();
}

/* ---------------- 卡片渲染 ---------------- */

function renderCard(id) {
  const rec = state.results.get(id);
  if (!rec) return;

  let li = document.getElementById(`item-${id}`);
  if (!li) {
    li = document.createElement('li');
    li.id = `item-${id}`;
    li.className = 'file-item';
    els.list.appendChild(li);
    els.emptyState.hidden = true;
  }

  const name = rec.file.name;
  let status = '';
  let body = '';

  if (rec.state === 'queued') {
    status = '<span class="status status-pending">排队中…</span>';
  } else if (rec.state === 'processing') {
    status = '<span class="status status-pending">处理中…</span>';
  } else if (rec.state === 'error') {
    status = '<span class="status status-error">失败</span>';
    body = `<div class="error-box">⚠️ ${escapeHtml(rec.error)}</div>`;
  } else {
    const saved = calcSavedPercent(rec.file.size, rec.result.blob.size);
    const cls = saved > 0 ? 'good' : saved < 0 ? 'bad' : 'neutral';
    const arrow = saved > 0 ? '↓' : saved < 0 ? '↑' : '·';
    status = `<span class="status status-${cls}">${arrow} ${Math.abs(saved)}%</span>`;
    body = doneBody(rec);
  }

  li.innerHTML = `
    <div class="item-head">
      <span class="item-name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
      ${status}
    </div>
    ${body}
  `;

  if (rec.state === 'done') wireDone(li, rec);

  li.querySelector('.btn-remove')?.addEventListener('click', () => removeItem(id));
  li.querySelector('.btn-download')?.addEventListener('click', () => downloadOne(rec));
}

function doneBody(rec) {
  const { result, file } = rec;
  const originalUrl = URL.createObjectURL(file);
  const outputUrl = URL.createObjectURL(result.blob);
  rec.urls.push(originalUrl, outputUrl);

  const sizeRow =
    result.width && result.height
      ? `<div class="meta-row"><span>尺寸</span><b>${result.width} × ${result.height}</b></div>`
      : '';
  const gifNote =
    file.type === 'image/gif' && result.format === 'gif'
      ? `<div class="meta-row"><span>提示</span><b>GIF 原样保留，动画未丢失</b></div>`
      : '';

  return `
    <div class="item-body">
      <div class="preview">
        <img class="preview-img" src="${outputUrl}" alt="压缩效果预览" draggable="false" />
        <span class="preview-tag">按住查看原图</span>
      </div>
      <div class="meta">
        <div class="meta-row"><span>原大小</span><b>${formatBytes(file.size)}</b></div>
        <div class="meta-row"><span>新大小</span><b>${formatBytes(result.blob.size)}</b></div>
        ${sizeRow}
        <div class="meta-row"><span>格式</span><b>${result.format.toUpperCase()}</b></div>
        ${gifNote}
        <div class="meta-actions">
          <button class="btn btn-primary btn-download" type="button">⬇ 下载</button>
          <button class="btn btn-ghost btn-remove" type="button">移除</button>
        </div>
      </div>
    </div>`;
}

/** 按住预览图显示原图，松开恢复压缩效果 */
function wireDone(li, rec) {
  const img = li.querySelector('.preview-img');
  if (!img) return;
  const [originalUrl, outputUrl] = rec.urls;
  const showResult = () => {
    img.src = outputUrl;
    li.classList.remove('comparing');
  };
  img.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    img.src = originalUrl;
    li.classList.add('comparing');
  });
  img.addEventListener('pointerup', showResult);
  img.addEventListener('pointercancel', showResult);
  img.addEventListener('pointerleave', showResult);
}

/* ---------------- 下载 ---------------- */

function triggerDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function downloadOne(rec) {
  const name = replaceExtension(rec.file.name, rec.result.format);
  triggerDownload(URL.createObjectURL(rec.result.blob), name);
}

async function downloadAll() {
  const zip = new JSZip();
  const used = new Set();
  let count = 0;
  for (const rec of state.results.values()) {
    if (rec.state !== 'done') continue;
    const name = makeUnique(replaceExtension(rec.file.name, rec.result.format), used);
    zip.file(name, rec.result.blob);
    count += 1;
  }
  if (!count) return;

  els.downloadAll.disabled = true;
  els.downloadAll.textContent = '打包中…';
  try {
    const blob = await zip.generateAsync({ type: 'blob' });
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    triggerDownload(URL.createObjectURL(blob), `pic-shrink-${stamp}.zip`);
  } catch (err) {
    console.error(err);
    alert('打包失败，请重试');
  } finally {
    els.downloadAll.disabled = false;
    els.downloadAll.textContent = '⬇ 全部下载（ZIP）';
  }
}

/* ---------------- 统计 ---------------- */

function updateStats() {
  const total = state.results.size;
  if (total === 0) {
    els.stats.hidden = true;
    els.emptyState.hidden = false;
    els.downloadAll.hidden = true;
    return;
  }

  let processed = 0;
  let okCount = 0;
  let originalSum = 0;
  let outputSum = 0;
  for (const rec of state.results.values()) {
    if (rec.state === 'done' || rec.state === 'error') {
      processed += 1;
      originalSum += rec.file.size;
    }
    if (rec.state === 'done') {
      okCount += 1;
      outputSum += rec.result.blob.size;
    }
  }

  const saved = originalSum > 0 ? calcSavedPercent(originalSum, outputSum) : 0;
  const savedCls = saved > 0 ? 'good' : saved < 0 ? 'bad' : 'neutral';
  const sign = saved > 0 ? '' : saved < 0 ? '-' : '';

  els.statsBody.innerHTML = `
    <div class="stat"><span>图片数</span><b>${total}</b></div>
    <div class="stat"><span>原始大小</span><b>${formatBytes(originalSum)}</b></div>
    <div class="stat"><span>压缩后</span><b>${formatBytes(outputSum)}</b></div>
    <div class="stat ${savedCls}"><span>共节省</span><b>${sign}${Math.abs(saved)}%</b></div>
    <div class="stat"><span>进度</span><b>${processed}/${total}</b></div>
  `;

  els.downloadAll.hidden = okCount === 0;
}

/* ---------------- 移除 ---------------- */

function removeItem(id) {
  const rec = state.results.get(id);
  if (!rec) return;
  for (const url of rec.urls) URL.revokeObjectURL(url);
  state.results.delete(id);
  state.files = state.files.filter((f) => f !== rec.file);
  document.getElementById(`item-${id}`)?.remove();
  updateStats();
}

/* ---------------- 事件绑定 ---------------- */

els.dropZone.addEventListener('click', () => els.fileInput.click());
els.dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    els.fileInput.click();
  }
});
els.fileInput.addEventListener('change', () => {
  processFiles([...els.fileInput.files]);
  els.fileInput.value = '';
});

for (const ev of ['dragenter', 'dragover']) {
  els.dropZone.addEventListener(ev, (e) => {
    e.preventDefault();
    els.dropZone.classList.add('dragover');
  });
}
for (const ev of ['dragleave', 'drop']) {
  els.dropZone.addEventListener(ev, (e) => {
    e.preventDefault();
    els.dropZone.classList.remove('dragover');
  });
}
els.dropZone.addEventListener('drop', (e) => {
  processFiles([...(e.dataTransfer?.files || [])]);
});

// 防止把图片拖到页面其他位置时浏览器直接打开文件
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => e.preventDefault());

window.addEventListener('paste', (e) => {
  const files = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith('image/'));
  if (files.length) processFiles(files);
});

els.quality.addEventListener('input', onSettingChange);
els.format.addEventListener('change', onSettingChange);
els.scaleMode.addEventListener('change', () => {
  scaleMem[currentMode] = Number(els.scaleValue.value) || scaleMem[currentMode];
  currentMode = els.scaleMode.value;
  onSettingChange();
});
els.scaleValue.addEventListener('input', () => {
  scaleMem[currentMode] = Number(els.scaleValue.value) || scaleMem[currentMode];
  onSettingChange();
});

els.rerun.addEventListener('click', () => {
  const files = state.files.slice();
  clearAll();
  processFiles(files);
});

els.downloadAll.addEventListener('click', downloadAll);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[ch]);
}

/* ---------------- 启动 ---------------- */

syncSettingsUI();
