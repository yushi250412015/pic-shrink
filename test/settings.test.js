import { describe, it, expect } from 'vitest';
import { resolveResize } from '../src/utils/settings.js';

describe('resolveResize', () => {
  it('预设为原始尺寸时映射为 none', () => {
    expect(resolveResize({ resizeMode: 'preset', preset: 'original' })).toEqual({ mode: 'none', value: 0 });
  });

  it('预设为具体像素时映射为 longest', () => {
    expect(resolveResize({ resizeMode: 'preset', preset: '1920' })).toEqual({ mode: 'longest', value: 1920 });
  });

  it('longest / percent / none 直接透传', () => {
    expect(resolveResize({ resizeMode: 'longest', longestEdge: 800 })).toEqual({ mode: 'longest', value: 800 });
    expect(resolveResize({ resizeMode: 'percent', percent: 50 })).toEqual({ mode: 'percent', value: 50 });
    expect(resolveResize({ resizeMode: 'none' })).toEqual({ mode: 'none', value: 0 });
  });

  it('未知模式回退为 none', () => {
    expect(resolveResize({ resizeMode: 'oops' })).toEqual({ mode: 'none', value: 0 });
  });
});
