import { createStore } from './store.js';
import { Pipeline } from './pipeline.js';
import { DEFAULT_SETTINGS } from './config.js';
import { initDropZone } from './ui/dropzone.js';
import { initSettingsPanel } from './ui/settings-panel.js';
import { initFileList } from './ui/file-list.js';
import { initStatsBar } from './ui/stats-bar.js';
import { initToolbar } from './ui/toolbar.js';

const store = createStore(DEFAULT_SETTINGS);
const pipeline = new Pipeline(store);

initDropZone(document.getElementById('drop-zone'), (files) => {
  const images = files.filter((file) => file.type && file.type.startsWith('image/'));
  if (!images.length) return;
  store.addFiles(images);
  pipeline.run();
});

initSettingsPanel(document.getElementById('settings-panel'), store, () => pipeline.rerun());
initFileList(document.getElementById('list-section'), store, pipeline);
initStatsBar(document.getElementById('stats'), store);
initToolbar(document.getElementById('toolbar'), store);
