// 上传区交互：点击选择、拖拽、粘贴、键盘操作

import { isImageInput } from '../utils/filetype.js';

export function initDropZone(container, onFiles) {
  const input = container.querySelector('[data-file-input]');

  const openPicker = () => input.click();

  container.addEventListener('click', openPicker);
  container.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPicker();
    }
  });

  input.addEventListener('change', () => {
    onFiles([...input.files]);
    input.value = '';
  });

  for (const type of ['dragenter', 'dragover']) {
    container.addEventListener(type, (event) => {
      event.preventDefault();
      container.classList.add('is-dragover');
    });
  }
  for (const type of ['dragleave', 'drop']) {
    container.addEventListener(type, (event) => {
      event.preventDefault();
      container.classList.remove('is-dragover');
    });
  }
  container.addEventListener('drop', (event) => {
    onFiles([...(event.dataTransfer?.files || [])]);
  });

  // 防止浏览器直接打开被拖到页面其他位置的图片
  window.addEventListener('dragover', (event) => event.preventDefault());
  window.addEventListener('drop', (event) => event.preventDefault());

  window.addEventListener('paste', (event) => {
    const files = [...(event.clipboardData?.files || [])].filter(isImageInput);
    if (files.length) onFiles(files);
  });
}
