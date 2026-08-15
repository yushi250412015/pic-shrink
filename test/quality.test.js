import { describe, it, expect } from 'vitest';
import { findQualityForSize } from '../src/utils/quality.js';

// bytes = round(quality * 1000)，单调递增，便于确定性测试
const linear = (k) => async (quality) => Math.round(quality * k);

describe('findQualityForSize', () => {
  it('目标很宽松时返回最高质量', async () => {
    const r = await findQualityForSize(linear(1000), 2000);
    expect(r.quality).toBe(1);
    expect(r.bytes).toBeLessThanOrEqual(2000);
  });

  it('目标很小时返回最低质量（尽力而为）', async () => {
    const r = await findQualityForSize(linear(1000), 10);
    expect(r.quality).toBe(0.02);
    expect(r.bytes).toBeGreaterThan(10);
  });

  it('在区间内二分逼近目标', async () => {
    const r = await findQualityForSize(linear(1000), 600);
    expect(r.bytes).toBeLessThanOrEqual(600);
    expect(r.quality).toBeGreaterThan(0.5);
    expect(r.quality).toBeLessThan(0.7);
  });
});
