import { SIZE_PRESETS, ROTATIONS, FLIPS, WATERMARK_POSITIONS } from '../config.js';
import { detectEncodableFormats } from './capabilities.js';

const SELECT_SOURCES = {
  preset: SIZE_PRESETS,
  rotate: ROTATIONS,
  flip: FLIPS,
  watermarkPosition: WATERMARK_POSITIONS,
};

const NUMERIC_KEYS = new Set([
  'quality',
  'rotate',
  'targetKb',
  'longestEdge',
  'percent',
  'watermarkSize',
  'watermarkOpacity',
]);

export function initSettingsPanel(root, store, onRerun) {
  const controls = [...root.querySelectorAll('[data-setting]')];
  const rerun = root.querySelector('[data-rerun]');
  const qualityLabel = root.querySelector('[data-quality-label]');

  for (const [key, options] of Object.entries(SELECT_SOURCES)) {
    const select = root.querySelector(`[data-setting="${key}"]`);
    select.innerHTML = options.map((o) => `<option value="${o.value}">${o.label}</option>`).join('');
  }

  function readControl(control) {
    const key = control.dataset.setting;
    if (control.type === 'checkbox') return control.checked;
    if (control.type === 'radio') return control.value;
    if (key === 'quality') return Number(control.value) / 100;
    if (NUMERIC_KEYS.has(key)) return Number(control.value);
    return control.value;
  }

  function syncUI() {
    const settings = store.getSettings();
    for (const control of controls) {
      const key = control.dataset.setting;
      const value = settings[key];
      if (control.type === 'checkbox') control.checked = Boolean(value);
      else if (control.type === 'radio') control.checked = String(value) === control.value;
      else if (key === 'quality') control.value = Math.round(value * 100);
      else control.value = value;
    }
    if (qualityLabel) qualityLabel.textContent = `${Math.round(settings.quality * 100)}%`;

    for (const block of root.querySelectorAll('[data-strategy]')) {
      block.classList.toggle('hidden', block.dataset.strategy !== settings.strategy);
    }
    for (const field of root.querySelectorAll('[data-resize-field]')) {
      field.classList.toggle('hidden', field.dataset.resizeField !== settings.resizeMode);
    }

    rerun.hidden = store.getState().items.size === 0;
  }

  function onChange(event) {
    const control = event.target;
    const key = control?.dataset?.setting;
    if (!key) return;
    store.setSettings({ [key]: readControl(control) });
    syncUI();
  }

  for (const control of controls) {
    const eventType =
      control.tagName === 'SELECT' || control.type === 'radio' || control.type === 'checkbox'
        ? 'change'
        : 'input';
    control.addEventListener(eventType, onChange);
  }

  rerun.addEventListener('click', onRerun);
  store.subscribe(syncUI);
  syncUI();

  detectEncodableFormats().then((supported) => {
    const avifOption = root.querySelector('[data-setting="format"] option[value="avif"]');
    if (avifOption && !supported.includes('avif')) {
      avifOption.disabled = true;
      avifOption.textContent = 'AVIF（当前浏览器不支持）';
    }
  });
}
