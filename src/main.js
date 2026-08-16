import { createStore } from './store.js';
import { Pipeline } from './pipeline.js';
import { DEFAULT_SETTINGS } from './config.js';
import { initDropZone } from './ui/dropzone.js';
import { initSettingsPanel } from './ui/settings-panel.js';
import { initFileList } from './ui/file-list.js';
import { initStatsBar } from './ui/stats-bar.js';
import { initToolbar } from './ui/toolbar.js';
import { initPdfTool } from './ui/pdf-tool.js';
import { initTheme } from './ui/theme.js';
import { initSimpleMode } from './ui/simple-mode.js';
import { initShortcuts } from './ui/shortcuts.js';
import { applyTranslations, getLang, setLang } from './ui/i18n.js';
import { readExif } from './exif.js';
import { isImageInput } from './utils/filetype.js';

const store = createStore(DEFAULT_SETTINGS);
const pipeline = new Pipeline(store);

initDropZone(document.getElementById('drop-zone'), (files) => {
  const images = files.filter(isImageInput);
  if (!images.length) return;
  const ids = store.addFiles(images);
  pipeline.run();
  for (let i = 0; i < ids.length; i += 1) {
    readExif(images[i]).then((exif) => {
      if (exif) store.setItemExif(ids[i], exif);
    });
  }
});

initSettingsPanel(document.getElementById('settings-panel'), store, () => pipeline.rerun());
const fileList = initFileList(document.getElementById('list-section'), store, pipeline);
initStatsBar(document.getElementById('stats'), store);
initToolbar(document.getElementById('toolbar'), store);

// PDF 工具
initPdfTool(document.getElementById('pdf-app'));

// 模式切换
const modeButtons = [...document.querySelectorAll('[data-mode]')];
const imageApp = document.getElementById('image-app');
const pdfApp = document.getElementById('pdf-app');
for (const button of modeButtons) {
  button.addEventListener('click', () => {
    const mode = button.dataset.mode;
    imageApp.hidden = mode !== 'image';
    pdfApp.hidden = mode !== 'pdf';
    for (const b of modeButtons) b.classList.toggle('active', b === button);
  });
}

// 语言切换
const langToggle = document.getElementById('lang-toggle');
langToggle.textContent = getLang() === 'zh' ? 'EN' : '中文';
langToggle.addEventListener('click', () => {
  setLang(getLang() === 'zh' ? 'en' : 'zh');
  location.reload();
});

// 深色 / 浅色主题
initTheme(document.getElementById('theme-toggle'));

// 极简模式：开启后隐藏高级设置，只留格式 + 质量/目标大小 + 场景
let previousResizeMode = store.getSettings().resizeMode;
initSimpleMode({
  button: document.getElementById('simple-toggle'),
  root: document.getElementById('settings-panel'),
  onToggle: (simple) => {
    const patch = {};
    if (simple) {
      if (store.getSettings().resizeMode !== 'scenario') {
        previousResizeMode = store.getSettings().resizeMode;
        patch.resizeMode = 'scenario';
      }
    } else if (
      store.getSettings().resizeMode === 'scenario' &&
      previousResizeMode &&
      previousResizeMode !== 'scenario'
    ) {
      patch.resizeMode = previousResizeMode;
    }
    store.setSettings(patch); // 总是 emit，触发设置面板按极简模式重渲染
  },
});

// 快捷键（Ctrl/Cmd+O、Delete、Esc）
initShortcuts({ fileList });

// 应用静态文案翻译
applyTranslations(document.body);

// Service Worker：仅在构建产物（非 dev）注册，避免开发时缓存干扰
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // 注册失败（如不支持）静默忽略
    });
  });
}
