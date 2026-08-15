// 应用常量、默认设置与预设选项（文案用 i18n key 表示，见 ui/i18n.js）

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
  { value: 'original', labelKey: 'size.original' },
  { value: '1280', labelKey: 'size.1280' },
  { value: '1920', labelKey: 'size.1920' },
  { value: '2560', labelKey: 'size.2560' },
  { value: '3840', labelKey: 'size.3840' },
];

export const SCENARIOS = [
  { value: 'wechat-avatar', labelKey: 'scenario.wechat-avatar', width: 132, height: 132 },
  { value: 'wechat-cover', labelKey: 'scenario.wechat-cover', width: 900, height: 383 },
  { value: 'redbook', labelKey: 'scenario.redbook', width: 1080, height: 1440 },
  { value: 'redbook-square', labelKey: 'scenario.redbook-square', width: 1080, height: 1080 },
  { value: 'taobao', labelKey: 'scenario.taobao', width: 800, height: 800 },
  { value: 'video-cover', labelKey: 'scenario.video-cover', width: 1920, height: 1080 },
  { value: 'id-1in', labelKey: 'scenario.id-1in', width: 295, height: 413 },
  { value: 'id-2in', labelKey: 'scenario.id-2in', width: 413, height: 579 },
];

export function findScenario(id) {
  return SCENARIOS.find((s) => s.value === id) || null;
}

export const ROTATIONS = [
  { value: 0, labelKey: 'rotate.0' },
  { value: 90, labelKey: 'rotate.90' },
  { value: 180, labelKey: 'rotate.180' },
  { value: 270, labelKey: 'rotate.270' },
];

export const FLIPS = [
  { value: 'none', labelKey: 'flip.none' },
  { value: 'horizontal', labelKey: 'flip.horizontal' },
  { value: 'vertical', labelKey: 'flip.vertical' },
];

export const WATERMARK_POSITIONS = [
  { value: 'top-left', labelKey: 'wm.top-left' },
  { value: 'top-center', labelKey: 'wm.top-center' },
  { value: 'top-right', labelKey: 'wm.top-right' },
  { value: 'middle-left', labelKey: 'wm.middle-left' },
  { value: 'middle-center', labelKey: 'wm.middle-center' },
  { value: 'middle-right', labelKey: 'wm.middle-right' },
  { value: 'bottom-left', labelKey: 'wm.bottom-left' },
  { value: 'bottom-center', labelKey: 'wm.bottom-center' },
  { value: 'bottom-right', labelKey: 'wm.bottom-right' },
];
