import { describe, it, expect } from 'vitest';
import { computeTargetSize, rotatedSize, squareCropRect } from '../src/utils/geometry.js';

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

describe('rotatedSize', () => {
  it('90°/270° 交换宽高', () => {
    expect(rotatedSize(100, 200, 0)).toEqual({ width: 100, height: 200 });
    expect(rotatedSize(100, 200, 90)).toEqual({ width: 200, height: 100 });
    expect(rotatedSize(100, 200, 180)).toEqual({ width: 100, height: 200 });
    expect(rotatedSize(100, 200, 270)).toEqual({ width: 200, height: 100 });
  });
});

describe('squareCropRect', () => {
  it('未开启时返回完整区域', () => {
    expect(squareCropRect(300, 200, false)).toEqual({ sx: 0, sy: 0, sw: 300, sh: 200 });
  });

  it('横向图居中裁方形', () => {
    expect(squareCropRect(300, 200, true)).toEqual({ sx: 50, sy: 0, sw: 200, sh: 200 });
  });

  it('纵向图居中裁方形', () => {
    expect(squareCropRect(200, 300, true)).toEqual({ sx: 0, sy: 50, sw: 200, sh: 200 });
  });
});
