// 自定义场景预设：localStorage 读写 + 添加弹窗（纯逻辑在 utils/scenarios.js）
import { t } from './i18n.js';
import { escapeHtml } from '../utils/dom.js';
import {
  parseCustomScenarios,
  serializeCustomScenarios,
  normalizeScenario,
  customScenarioValue,
  filterOutBuiltin,
} from '../utils/scenarios.js';
import { SCENARIOS } from '../config.js';

const STORAGE_KEY = 'ps-custom-scenarios';

export function loadCustomScenarios() {
  try {
    return parseCustomScenarios(localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

export function saveCustomScenarios(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeCustomScenarios(list)));
  } catch {
    // localStorage 不可用时忽略
  }
}

/** 新增自定义场景；返回归一化后的项（尺寸重复时返回已存在的该项） */
export function addCustomScenario(input) {
  const s = normalizeScenario(input);
  if (!s) return null;
  const list = loadCustomScenarios();
  const existing = list.find((x) => x.width === s.width && x.height === s.height);
  const next = existing ? list : [...list, s];
  saveCustomScenarios(next);
  return existing || s;
}

/** 删除指定尺寸的自定义场景 */
export function removeCustomScenario(width, height) {
  const next = loadCustomScenarios().filter((s) => s.width !== width || s.height !== height);
  saveCustomScenarios(next);
  return next;
}

/** 生成场景下拉的选项 HTML（内置 + 「我的预设」分组，过滤重复尺寸） */
export function renderScenarioOptions(select) {
  const builtin = SCENARIOS.map(
    (o) => `<option value="${o.value}">${t(o.labelKey)}</option>`,
  ).join('');
  const custom = filterOutBuiltin(loadCustomScenarios(), SCENARIOS);
  const customHtml = custom
    .map(
      (s) =>
        `<option value="${customScenarioValue(s.width, s.height)}">${escapeHtml(s.name)}</option>`,
    )
    .join('');
  select.innerHTML = custom.length
    ? `${builtin}<optgroup label="${escapeHtml(t('scenario.custom.group'))}">${customHtml}</optgroup>`
    : builtin;
}

/**
 * 打开「添加场景预设」弹窗。
 * @param {(added: {name: string, width: number, height: number}) => void} onAdded
 */
export function openAddScenarioModal(onAdded) {
  const overlay = document.createElement('div');
  overlay.className = 'compare-overlay';
  overlay.innerHTML = `
    <div class="compare-dialog idphoto-dialog" role="dialog" aria-modal="true" aria-label="${t('scenario.add.title')}">
      <div class="compare-head">
        <span>${t('scenario.add.title')}</span>
        <button class="crop-close" data-action="cancel" type="button" aria-label="${t('scenario.add.cancel')}">✕</button>
      </div>
      <label class="field">
        <span class="field-label">${t('scenario.add.name')}</span>
        <input type="text" data-scenario-name placeholder="${t('scenario.add.name.ph')}" />
      </label>
      <div class="scenario-size-row">
        <label class="field">
          <span class="field-label">${t('scenario.add.width')}</span>
          <input type="number" min="1" max="20000" value="800" data-scenario-width />
        </label>
        <label class="field">
          <span class="field-label">${t('scenario.add.height')}</span>
          <input type="number" min="1" max="20000" value="600" data-scenario-height />
        </label>
      </div>
      <small class="field-note" data-scenario-error></small>
      <div class="crop-actions">
        <button class="btn btn-ghost" data-action="cancel" type="button">${t('scenario.add.cancel')}</button>
        <button class="btn btn-primary" data-action="save" type="button">${t('scenario.add.save')}</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  const errorEl = overlay.querySelector('[data-scenario-error]');

  function close() {
    window.removeEventListener('keydown', onKey);
    overlay.remove();
  }
  function onKey(event) {
    if (event.key === 'Escape') close();
  }
  window.addEventListener('keydown', onKey);

  overlay.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'cancel') close();
    else if (action === 'save') save();
    else if (event.target === overlay) close();
  });

  function save() {
    const input = {
      name: overlay.querySelector('[data-scenario-name]').value,
      width: overlay.querySelector('[data-scenario-width]').value,
      height: overlay.querySelector('[data-scenario-height]').value,
    };
    const added = addCustomScenario(input);
    if (!added) {
      errorEl.textContent = t('scenario.add.invalid');
      return;
    }
    close();
    onAdded?.(added);
  }
}
