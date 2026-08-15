import { clamp } from './geometry.js';

/**
 * 解析页码范围字符串为 0 起始的页索引数组。
 * 支持 "1-3,5"、"3-"（到末尾）、"1,3,5" 等写法；页码从 1 开始。
 * 结果去重、升序、并裁剪到 [0, totalPages-1]。
 */
export function expandRanges(spec, totalPages) {
  if (typeof spec !== 'string' || !spec.trim() || totalPages < 1) return [];

  const indices = new Set();
  for (const raw of spec.split(',')) {
    const part = raw.trim();
    if (!part) continue;

    if (part.includes('-')) {
      const [a, b] = part.split('-').map((s) => s.trim());
      const start = a === '' ? 1 : Number(a);
      const end = b === '' ? totalPages : Number(b);
      if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
      const lo = clamp(Math.min(start, end), 1, totalPages);
      const hi = clamp(Math.max(start, end), 1, totalPages);
      for (let p = lo; p <= hi; p += 1) indices.add(p);
    } else {
      const n = Number(part);
      if (Number.isFinite(n) && n >= 1 && n <= totalPages) indices.add(n);
    }
  }

  return [...indices].sort((x, y) => x - y).map((p) => p - 1);
}
