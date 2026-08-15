import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  calcSavedPercent,
  replaceExtension,
  makeUnique,
  computeTargetSize,
  extensionForOutput,
  mimeFromFormat,
} from '../src/format.js';

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
  it('计算节省比例（负数表示反而变大）', () => {
    expect(calcSavedPercent(1000, 250)).toBe(75);
    expect(calcSavedPercent(1000, 1000)).toBe(0);
    expect(calcSavedPercent(1000, 1250)).toBe(-25);
    expect(calcSavedPercent(0, 0)).toBe(0);
  });
});

describe('replaceExtension', () => {
  it('替换扩展名', () => {
    expect(replaceExtension('photo.jpg', 'webp')).toBe('photo.webp');
    expect(replaceExtension('a.b.c.png', 'jpeg')).toBe('a.b.c.jpeg');
    expect(replaceExtension('noext', 'png')).toBe('noext.png');
  });
});

describe('makeUnique', () => {
  it('重名自动加序号', () => {
    const used = new Set();
    expect(makeUnique('a.png', used)).toBe('a.png');
    expect(makeUnique('a.png', used)).toBe('a-2.png');
    expect(makeUnique('a.png', used)).toBe('a-3.png');
    expect(makeUnique('b.png', used)).toBe('b.png');
  });
});

describe('computeTargetSize', () => {
  it('不缩放时原样返回', () => {
    expect(computeTargetSize(800, 600, 'none', 0)).toEqual({ width: 800, height: 600 });
  });

  it('按百分比缩放并四舍五入', () => {
    expect(computeTargetSize(1000, 2000, 'percent', 50)).toEqual({ width: 500, height: 1000 });
    expect(computeTargetSize(999, 333, 'percent', 33.3)).toEqual({ width: 333, height: 111 });
  });

  it('按最长边缩放，小图不放大', () => {
    expect(computeTargetSize(4000, 2000, 'longest', 1920)).toEqual({ width: 1920, height: 960 });
    expect(computeTargetSize(1000, 500, 'longest', 1920)).toEqual({ width: 1000, height: 500 });
  });

  it('结果至少 1 像素', () => {
    expect(computeTargetSize(2, 2, 'percent', 1)).toEqual({ width: 1, height: 1 });
  });
});

describe('extensionForOutput / mimeFromFormat', () => {
  it('auto 模式根据输入类型选择输出格式', () => {
    expect(extensionForOutput('image/png', 'auto')).toBe('png');
    expect(extensionForOutput('image/jpeg', 'auto')).toBe('jpeg');
    expect(extensionForOutput('image/gif', 'auto')).toBe('gif');
    expect(extensionForOutput('image/bmp', 'auto')).toBe('png');
  });

  it('手动指定格式优先', () => {
    expect(extensionForOutput('image/png', 'webp')).toBe('webp');
  });

  it('mime 映射', () => {
    expect(mimeFromFormat('webp')).toBe('image/webp');
    expect(mimeFromFormat('jpeg')).toBe('image/jpeg');
  });
});
