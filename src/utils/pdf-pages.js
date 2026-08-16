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

/**
 * 根据一串页面操作计算最终页面顺序与每页累计旋转角度。
 * operations 元素形如 { type, index, delta? }：
 *   type 'rotate'：index 页左旋 90°（累计角度 -90 ≡ 270）
 *   type 'delete'：删除 index 页
 *   type 'move'：index 页上移（delta < 0）或下移（delta > 0）一位
 * 返回 [{ originalIndex, angle }]，angle ∈ {0, 90, 180, 270}。
 * 非法 index 的操作被忽略，保证越界安全。
 */
export function applyPageOperations(pageCount, operations = []) {
  const pages = Array.from({ length: pageCount }, (_, i) => ({ originalIndex: i, angle: 0 }));

  for (const op of operations) {
    if (!op || typeof op !== 'object') continue;
    const { type, index } = op;
    if (!Number.isInteger(index) || index < 0 || index >= pages.length) continue;

    if (type === 'rotate') {
      pages[index].angle = (pages[index].angle + 270) % 360;
    } else if (type === 'delete') {
      pages.splice(index, 1);
    } else if (type === 'move') {
      const delta = op.delta > 0 ? 1 : -1;
      const target = clamp(index + delta, 0, pages.length - 1);
      if (target === index) continue;
      const [page] = pages.splice(index, 1);
      pages.splice(target, 0, page);
    }
  }

  return pages.map((page) => ({ ...page }));
}
