import { clamp, fitContain } from '../utils/geometry.js';

const MIN_SIZE = 0.02;

/**
 * 打开交互式裁剪弹窗。
 * @param {File} file 原始图片文件
 * @param {{onConfirm?: (rect: {x:number,y:number,width:number,height:number}) => void,
 *   onClear?: () => void}} callbacks
 */
export function openCropModal(file, { onConfirm, onClear } = {}) {
  const objectUrl = URL.createObjectURL(file);

  const overlay = document.createElement('div');
  overlay.className = 'crop-overlay';
  overlay.innerHTML = `
    <div class="crop-dialog" role="dialog" aria-modal="true" aria-label="裁剪图片">
      <div class="crop-head">
        <span>裁剪图片</span>
        <button class="crop-close" data-action="cancel" type="button" aria-label="关闭">✕</button>
      </div>
      <div class="crop-stage">
        <div class="crop-canvas">
          <img class="crop-img" alt="" draggable="false" />
          <div class="crop-box" data-crop-box hidden>
            <span class="crop-handle" data-handle="nw"></span>
            <span class="crop-handle" data-handle="ne"></span>
            <span class="crop-handle" data-handle="sw"></span>
            <span class="crop-handle" data-handle="se"></span>
          </div>
        </div>
      </div>
      <div class="crop-actions">
        <button class="btn btn-ghost" data-action="clear" type="button">清除裁剪</button>
        <button class="btn btn-ghost" data-action="cancel" type="button">取消</button>
        <button class="btn btn-primary" data-action="apply" type="button">应用裁剪</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  const img = overlay.querySelector('.crop-img');
  const canvas = overlay.querySelector('.crop-canvas');
  const box = overlay.querySelector('[data-crop-box]');

  let selection = null; // { x, y, width, height }，归一化 0-1
  let drag = null;

  const toNorm = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
      y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
    };
  };

  const render = () => {
    if (!selection) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    box.style.left = `${selection.x * 100}%`;
    box.style.top = `${selection.y * 100}%`;
    box.style.width = `${selection.width * 100}%`;
    box.style.height = `${selection.height * 100}%`;
  };

  const normRect = (x1, y1, x2, y2) => ({
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  });

  const inside = (point, rect) =>
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height;

  const shiftRect = (rect, dx, dy) => ({
    ...rect,
    x: clamp(rect.x + dx, 0, 1 - rect.width),
    y: clamp(rect.y + dy, 0, 1 - rect.height),
  });

  const resizeRect = (rect, start, point, handle) => {
    const right = rect.x + rect.width;
    const bottom = rect.y + rect.height;
    const dx = point.x - start.x;
    const dy = point.y - start.y;
    let left = rect.x;
    let top = rect.y;
    let r = right;
    let b = bottom;
    if (handle.includes('w')) left = clamp(rect.x + dx, 0, r - MIN_SIZE);
    if (handle.includes('e')) r = clamp(right + dx, left + MIN_SIZE, 1);
    if (handle.includes('n')) top = clamp(rect.y + dy, 0, b - MIN_SIZE);
    if (handle.includes('s')) b = clamp(bottom + dy, top + MIN_SIZE, 1);
    return { x: left, y: top, width: r - left, height: b - top };
  };

  function onPointerDown(event) {
    if (!img.naturalWidth) return;
    const handle = event.target.closest('[data-handle]');
    const point = toNorm(event);
    if (handle) {
      drag = { mode: 'resize', handle: handle.dataset.handle, start: point, orig: { ...selection } };
    } else if (selection && inside(point, selection)) {
      drag = { mode: 'move', start: point, orig: { ...selection } };
    } else {
      drag = { mode: 'draw', start: point };
    }
    event.preventDefault();
  }

  function onMove(event) {
    if (!drag) return;
    const point = toNorm(event);
    if (drag.mode === 'draw') {
      selection = normRect(drag.start.x, drag.start.y, point.x, point.y);
    } else if (drag.mode === 'move') {
      selection = shiftRect(drag.orig, point.x - drag.start.x, point.y - drag.start.y);
    } else if (drag.mode === 'resize') {
      selection = resizeRect(drag.orig, drag.start, point, drag.handle);
    }
    render();
  }

  function onUp() {
    drag = null;
  }

  function onKey(event) {
    if (event.key === 'Escape') close(null);
  }

  function close(result) {
    URL.revokeObjectURL(objectUrl);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('keydown', onKey);
    overlay.remove();
    if (result === 'confirm' && selection) onConfirm?.({ ...selection });
    if (result === 'clear') onClear?.();
  }

  img.onload = () => {
    const maxW = Math.min(window.innerWidth * 0.8, 640);
    const maxH = Math.min(window.innerHeight * 0.6, 480);
    const size = fitContain(img.naturalWidth, img.naturalHeight, maxW, maxH);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    render();
  };
  img.src = objectUrl;

  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('keydown', onKey);

  overlay.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'cancel') close(null);
    else if (action === 'apply') close('confirm');
    else if (action === 'clear') close('clear');
    else if (event.target === overlay) close(null);
  });
}
