// 全局快捷键：Ctrl/Cmd+O 打开文件选择、Delete 删除选中项、Esc 关闭所有弹窗。
// 各弹窗（裁剪 / 对比）自身也监听 Esc；这里兜底移除残留遮罩。

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

export function initShortcuts({ fileList }) {
  window.addEventListener('keydown', (event) => {
    const mod = event.ctrlKey || event.metaKey;

    if (mod && (event.key === 'o' || event.key === 'O')) {
      event.preventDefault();
      document.querySelector('[data-file-input]')?.click();
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      const target = event.target;
      if (target && (EDITABLE_TAGS.has(target.tagName) || target.isContentEditable)) return;
      event.preventDefault();
      fileList?.removeSelected();
      return;
    }

    if (event.key === 'Escape') {
      for (const overlay of document.querySelectorAll('.compare-overlay, .crop-overlay')) {
        overlay.remove();
      }
    }
  });
}
