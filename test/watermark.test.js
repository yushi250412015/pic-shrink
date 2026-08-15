import { describe, it, expect } from 'vitest';
import { computeWatermarkPosition } from '../src/utils/watermark.js';

describe('computeWatermarkPosition', () => {
  it('九宫格九个位置坐标正确', () => {
    const f = 10;
    expect(computeWatermarkPosition('top-left', 100, 200, f)).toEqual({ x: 10, y: 10 });
    expect(computeWatermarkPosition('top-center', 100, 200, f)).toEqual({ x: 50, y: 10 });
    expect(computeWatermarkPosition('top-right', 100, 200, f)).toEqual({ x: 90, y: 10 });
    expect(computeWatermarkPosition('middle-left', 100, 200, f)).toEqual({ x: 10, y: 100 });
    expect(computeWatermarkPosition('middle-center', 100, 200, f)).toEqual({ x: 50, y: 100 });
    expect(computeWatermarkPosition('middle-right', 100, 200, f)).toEqual({ x: 90, y: 100 });
    expect(computeWatermarkPosition('bottom-left', 100, 200, f)).toEqual({ x: 10, y: 190 });
    expect(computeWatermarkPosition('bottom-center', 100, 200, f)).toEqual({ x: 50, y: 190 });
    expect(computeWatermarkPosition('bottom-right', 100, 200, f)).toEqual({ x: 90, y: 190 });
  });

  it('非法位置回退到右下角', () => {
    expect(computeWatermarkPosition('oops', 100, 200, 10)).toEqual({ x: 90, y: 190 });
  });
});
