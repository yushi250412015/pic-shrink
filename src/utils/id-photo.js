// 证件照排版纯函数：网格计算与英寸/毫米换算（无 DOM、无副作用）。

export const MM_PER_INCH = 25.4;

// 一寸 / 二寸证件照的标准物理尺寸（毫米）
export const ID_UNITS_MM = Object.freeze({
  '1in': { width: 25, height: 35 },
  '2in': { width: 35, height: 49 },
});

// 相纸尺寸（英寸）
export const PAPERS_IN = Object.freeze({
  '4x6in': { width: 4, height: 6 },
});

// 底色预设（红/蓝为常见证件照底色）
export const ID_BACKGROUNDS = Object.freeze({
  white: '#ffffff',
  red: '#d9001b',
  blue: '#009adf',
});

/** 毫米换算为像素（按 dpi 取整） */
export function mmToPixels(mm, dpi) {
  const safeDpi = Number(dpi) > 0 ? Number(dpi) : 300;
  return Math.round((Number(mm) / MM_PER_INCH) * safeDpi);
}

/** 把可选 gap 归一化为非负整数像素 */
export function normalizeGap(gap) {
  const n = Number(gap);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

/** 解析底色名称，非法值回退白色 */
export function resolveIdBackground(name) {
  return ID_BACKGROUNDS[name] || ID_BACKGROUNDS.white;
}

/**
 * 计算证件照排版网格。
 * @param {{unit?: '1in'|'2in', dpi?: number, paper?: '4x6in', gap?: number}} [options]
 * @returns {{cols:number, rows:number, pageW:number, pageH:number,
 *   cellW:number, cellH:number, capacity:number}}
 */
export function planIdPhotoGrid({ unit = '1in', dpi = 300, paper = '4x6in', gap = 0 } = {}) {
  const unitMm = ID_UNITS_MM[unit] || ID_UNITS_MM['1in'];
  const paperIn = PAPERS_IN[paper] || PAPERS_IN['4x6in'];

  const cellW = mmToPixels(unitMm.width, dpi);
  const cellH = mmToPixels(unitMm.height, dpi);
  const pageW = Math.round(paperIn.width * (Number(dpi) > 0 ? Number(dpi) : 300));
  const pageH = Math.round(paperIn.height * (Number(dpi) > 0 ? Number(dpi) : 300));
  const gapPx = normalizeGap(gap);

  const cols = Math.max(1, Math.floor((pageW + gapPx) / (cellW + gapPx)));
  const rows = Math.max(1, Math.floor((pageH + gapPx) / (cellH + gapPx)));

  return { cols, rows, pageW, pageH, cellW, cellH, capacity: cols * rows };
}
