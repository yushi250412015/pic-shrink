import { describe, it, expect } from 'vitest';
import { formatBytes, calcSavedPercent } from '../src/utils/bytes.js';

describe('formatBytes', () => {
  it('格式化常见大小', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
    expect(formatBytes(2.5 * 1024 ** 3)).toBe('2.5 GB');
  });

  it('异常输入返回占位符', () => {
    expect(formatBytes(-1)).toBe('—');
    expect(formatBytes(NaN)).toBe('—');
  });
});

describe('calcSavedPercent', () => {
  it('计算节省比例（负数表示变大）', () => {
    expect(calcSavedPercent(1000, 250)).toBe(75);
    expect(calcSavedPercent(1000, 1000)).toBe(0);
    expect(calcSavedPercent(1000, 1250)).toBe(-25);
    expect(calcSavedPercent(0, 0)).toBe(0);
  });
});
