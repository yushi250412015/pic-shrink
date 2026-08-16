// 极简模式：localStorage `ps-simple-mode`。开启后隐藏高级设置，只留
// 格式 + 质量/目标大小 + 场景。显隐由 settings-panel 在渲染时过滤，不删代码。

const STORAGE_KEY = 'ps-simple-mode';

export function isSimpleMode() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSimpleMode(on) {
  try {
    if (on) localStorage.setItem(STORAGE_KEY, '1');
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage 不可用时忽略
  }
}

/**
 * 初始化极简模式切换按钮。
 * @param {{button?: HTMLElement, root?: HTMLElement, onToggle?: (simple: boolean) => void}} [opts]
 */
export function initSimpleMode({ button, root, onToggle } = {}) {
  function sync() {
    const simple = isSimpleMode();
    if (button) button.classList.toggle('active', simple);
    if (root) root.classList.toggle('simple-mode', simple);
    onToggle?.(simple);
  }

  if (button) {
    button.addEventListener('click', () => {
      setSimpleMode(!isSimpleMode());
      sync();
    });
  }

  sync();
  return { sync };
}
