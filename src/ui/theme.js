// 深色 / 浅色主题：读取 localStorage `ps-theme`（system / light / dark），
// 跟随系统变化，切换按钮显式覆盖。实际生效值写入 <html data-theme>。

const STORAGE_KEY = 'ps-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

export function getThemePreference() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') return value;
  } catch {
    // localStorage 不可用时回退 system
  }
  return 'system';
}

export function setThemePreference(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

function systemPrefersDark() {
  return Boolean(window.matchMedia && window.matchMedia(DARK_QUERY).matches);
}

/** 把偏好解析为实际生效的 light / dark */
export function resolveTheme(preference = getThemePreference()) {
  if (preference === 'dark') return 'dark';
  if (preference === 'light') return 'light';
  return systemPrefersDark() ? 'dark' : 'light';
}

function apply(theme) {
  document.documentElement.dataset.theme = theme;
}

function syncButton(button, theme) {
  if (button) button.textContent = theme === 'dark' ? '☀' : '🌙';
}

/**
 * 初始化主题：应用初始值、绑定切换按钮、监听系统深浅色变化。
 * @param {HTMLButtonElement} [button] 切换按钮
 */
export function initTheme(button) {
  const applyResolved = () => {
    const theme = resolveTheme();
    apply(theme);
    syncButton(button, theme);
  };

  applyResolved();

  if (button) {
    button.addEventListener('click', () => {
      // 显式覆盖：按当前有效值反向切换（system 时以当前生效值反向）
      const next = resolveTheme() === 'dark' ? 'light' : 'dark';
      setThemePreference(next);
      applyResolved();
    });
  }

  const mq = window.matchMedia(DARK_QUERY);
  const onSystemChange = () => {
    if (getThemePreference() === 'system') applyResolved();
  };
  if (mq.addEventListener) mq.addEventListener('change', onSystemChange);
  else if (mq.addListener) mq.addListener(onSystemChange); // 旧版 Safari

  return { applyResolved };
}
