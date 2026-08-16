import { describe, it, expect } from 'vitest';
import {
  PNG_OPT_STRATEGIES,
  lossyChannelLevels,
  quantizeChannel,
  effectivePngStrategy,
  oxipngOptions,
} from '../src/utils/png-opt.js';

describe('effectivePngStrategy', () => {
  it('仅输出 PNG 时生效', () => {
    expect(effectivePngStrategy('png', 'lossless')).toBe('lossless');
    expect(effectivePngStrategy('png', 'lossy')).toBe('lossy');
    expect(effectivePngStrategy('png', 'auto')).toBe('auto');
  });

  it('非 PNG 一律回退 auto', () => {
    expect(effectivePngStrategy('jpeg', 'lossless')).toBe('auto');
    expect(effectivePngStrategy('webp', 'lossy')).toBe('auto');
  });

  it('非法策略回退 auto', () => {
    expect(effectivePngStrategy('png', 'bogus')).toBe('auto');
    expect(effectivePngStrategy('png', undefined)).toBe('auto');
  });
});

describe('quantizeChannel', () => {
  it('端点保持不变', () => {
    expect(quantizeChannel(0, 32)).toBe(0);
    expect(quantizeChannel(255, 32)).toBe(255);
  });

  it('32 级量化到最近档位', () => {
    expect(quantizeChannel(128, 32)).toBe(132);
    expect(quantizeChannel(64, 32)).toBe(66);
  });

  it('2 级退化为二值', () => {
    expect(quantizeChannel(200, 2)).toBe(255);
    expect(quantizeChannel(100, 2)).toBe(0);
  });

  it('越界与非法值被钳制', () => {
    expect(quantizeChannel(-5, 32)).toBe(0);
    expect(quantizeChannel(999, 32)).toBe(255);
    expect(quantizeChannel(NaN, 32)).toBe(0);
    expect(quantizeChannel(128, 1)).toBeGreaterThanOrEqual(0);
  });
});

describe('lossyChannelLevels / oxipngOptions', () => {
  it('有损量化级数为 32', () => {
    expect(lossyChannelLevels()).toBe(32);
  });

  it('oxipng 默认 level 2', () => {
    expect(oxipngOptions().level).toBe(2);
    expect(PNG_OPT_STRATEGIES).toEqual(['auto', 'lossy', 'lossless']);
  });
});
