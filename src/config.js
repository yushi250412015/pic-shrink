// 应用常量、默认设置与预设选项

export const DEFAULT_SETTINGS = Object.freeze({
  format: 'auto',
  strategy: 'quality',
  quality: 0.8,
  targetKb: 200,
  resizeMode: 'none',
  preset: '1920',
  longestEdge: 1920,
  percent: 50,
  squareCrop: false,
  rotate: 0,
  flip: 'none',
  background: '#ffffff',
  prefix: '',
  suffix: '',
});

export const SIZE_PRESETS = [
  { value: 'original', label: '原始尺寸' },
  { value: '1280', label: '标清 · 1280px' },
  { value: '1920', label: '高清 · 1920px' },
  { value: '2560', label: '2K · 2560px' },
  { value: '3840', label: '4K · 3840px' },
];

export const ROTATIONS = [
  { value: 0, label: '不旋转' },
  { value: 90, label: '顺时针 90°' },
  { value: 180, label: '旋转 180°' },
  { value: 270, label: '逆时针 90°' },
];

export const FLIPS = [
  { value: 'none', label: '不翻转' },
  { value: 'horizontal', label: '水平翻转' },
  { value: 'vertical', label: '垂直翻转' },
];
