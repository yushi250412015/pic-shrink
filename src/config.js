// 应用常量、默认设置与预设选项

export const DEFAULT_SETTINGS = Object.freeze({
  format: 'auto',
  strategy: 'quality',
  quality: 0.8,
  targetKb: 200,
  resizeMode: 'none',
  preset: '1920',
  scenario: 'wechat-avatar',
  longestEdge: 1920,
  percent: 50,
  squareCrop: false,
  rotate: 0,
  flip: 'none',
  background: '#ffffff',
  prefix: '',
  suffix: '',
  watermarkText: '',
  watermarkPosition: 'bottom-right',
  watermarkSize: 5,
  watermarkColor: '#ffffff',
  watermarkOpacity: 80,
});

export const SIZE_PRESETS = [
  { value: 'original', label: '原始尺寸' },
  { value: '1280', label: '标清 · 1280px' },
  { value: '1920', label: '高清 · 1920px' },
  { value: '2560', label: '2K · 2560px' },
  { value: '3840', label: '4K · 3840px' },
];

export const SCENARIOS = [
  { value: 'wechat-avatar', label: '微信头像（方形）', width: 132, height: 132 },
  { value: 'wechat-cover', label: '公众号封面', width: 900, height: 383 },
  { value: 'redbook', label: '小红书 3:4', width: 1080, height: 1440 },
  { value: 'redbook-square', label: '小红书 1:1', width: 1080, height: 1080 },
  { value: 'taobao', label: '淘宝主图 1:1', width: 800, height: 800 },
  { value: 'video-cover', label: '视频封面 16:9', width: 1920, height: 1080 },
  { value: 'id-1in', label: '一寸证件照', width: 295, height: 413 },
  { value: 'id-2in', label: '二寸证件照', width: 413, height: 579 },
];

export function findScenario(id) {
  return SCENARIOS.find((s) => s.value === id) || null;
}

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

export const WATERMARK_POSITIONS = [
  { value: 'top-left', label: '左上' },
  { value: 'top-center', label: '上中' },
  { value: 'top-right', label: '右上' },
  { value: 'middle-left', label: '左中' },
  { value: 'middle-center', label: '居中' },
  { value: 'middle-right', label: '右中' },
  { value: 'bottom-left', label: '左下' },
  { value: 'bottom-center', label: '下中' },
  { value: 'bottom-right', label: '右下' },
];
