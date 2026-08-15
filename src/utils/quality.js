/**
 * 在目标大小上限内寻找最高质量（二分搜索）。
 * @param {function(number): Promise<number>} measure 返回给定质量下的编码字节数
 * @param {number} targetBytes 目标字节数上限
 */
export async function findQualityForSize(
  measure,
  targetBytes,
  { min = 0.02, max = 1, maxIterations = 8 } = {},
) {
  const smallest = await measure(min);
  if (smallest > targetBytes) {
    // 最低质量仍超目标，尽力返回最低质量结果
    return { quality: min, bytes: smallest };
  }

  const largest = await measure(max);
  if (largest <= targetBytes) {
    return { quality: max, bytes: largest };
  }

  let lo = min;
  let hi = max;
  let best = { quality: min, bytes: smallest };

  for (let i = 0; i < maxIterations; i += 1) {
    const mid = (lo + hi) / 2;
    const bytes = await measure(mid);
    if (bytes <= targetBytes) {
      best = { quality: mid, bytes };
      lo = mid;
    } else {
      hi = mid;
    }
    if (hi - lo < 0.01) break;
  }

  return best;
}
