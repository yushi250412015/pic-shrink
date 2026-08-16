import { t } from './i18n.js';

/**
 * 打开处理前后对比滑杆：左原图、右处理后，中间滑杆拖动分界线。
 * 使用两层图片 + CSS clip-path：底层原图，顶层处理后图从 --compare-pos 处开始裁剪。
 * @param {{originalUrl: string, outputUrl: string}} urls 由 file-list 维护的对象 URL
 */
export function openCompare({ originalUrl, outputUrl }) {
  const overlay = document.createElement('div');
  overlay.className = 'compare-overlay';
  overlay.innerHTML = `
    <div class="compare-dialog" role="dialog" aria-modal="true" aria-label="${t('compare.title')}">
      <div class="compare-head">
        <span>${t('compare.title')}</span>
        <button class="crop-close" data-action="close" type="button" aria-label="${t('compare.close')}">✕</button>
      </div>
      <div class="compare-stage">
        <img class="compare-img compare-original" src="${originalUrl}" alt="${t('compare.original')}" draggable="false" />
        <img class="compare-img compare-output" src="${outputUrl}" alt="${t('compare.output')}" draggable="false" />
        <div class="compare-slider" data-slider role="slider" aria-label="${t('compare.title')}" tabindex="0"></div>
      </div>
      <div class="compare-labels">
        <span>${t('compare.original')}</span>
        <span>${t('compare.output')}</span>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  const stage = overlay.querySelector('.compare-stage');
  const slider = overlay.querySelector('[data-slider]');

  function setPercent(percent) {
    const ratio = Math.min(100, Math.max(0, percent));
    overlay.style.setProperty('--compare-pos', `${ratio}%`);
  }
  setPercent(50);

  function onMove(clientX) {
    const rect = stage.getBoundingClientRect();
    if (!rect.width) return;
    setPercent(((clientX - rect.left) / rect.width) * 100);
  }

  function onPointerDown(event) {
    event.preventDefault();
    onMove(event.clientX);
    const move = (e) => onMove(e.clientX);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  slider.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointerdown', onPointerDown);
  slider.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 10 : 2;
    const current = Number.parseFloat(overlay.style.getPropertyValue('--compare-pos')) || 50;
    if (event.key === 'ArrowLeft') setPercent(current - step);
    else if (event.key === 'ArrowRight') setPercent(current + step);
    else return;
    event.preventDefault();
  });

  function close() {
    window.removeEventListener('keydown', onKey);
    overlay.remove();
  }
  function onKey(event) {
    if (event.key === 'Escape') close();
  }
  window.addEventListener('keydown', onKey);

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay || event.target.closest('[data-action="close"]')) close();
  });
}
