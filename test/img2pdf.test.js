import { describe, it, expect } from 'vitest';
import {
  A4_PT,
  computePageSize,
  fitImageOnPage,
} from '../src/utils/img2pdf.js';

describe('computePageSize', () => {
  it('a4 模式返回 A4 尺寸', () => {
    expect(computePageSize(1920, 1080, 'a4')).toEqual({ width: 595.28, height: 841.89 });
    expect(A4_PT.width).toBeCloseTo(595.28, 2);
    expect(A4_PT.height).toBeCloseTo(841.89, 2);
  });

  it('original 模式返回图片固有尺寸', () => {
    expect(computePageSize(1920, 1080, 'original')).toEqual({ width: 1920, height: 1080 });
  });

  it('未知模式回退 a4', () => {
    expect(computePageSize(100, 100, 'oops')).toEqual({ width: 595.28, height: 841.89 });
    expect(computePageSize(100, 100)).toEqual({ width: 595.28, height: 841.89 });
  });
});

describe('fitImageOnPage', () => {
  it('横向大图适配 A4：铺满宽度并垂直居中', () => {
    const r = fitImageOnPage(1920, 1080, 595.28, 841.89);
    expect(r.width).toBeCloseTo(595.28, 2);
    expect(r.height).toBeCloseTo(1080 * (595.28 / 1920), 2);
    expect(r.x).toBeCloseTo(0, 2);
    expect(r.y).toBeCloseTo((841.89 - r.height) / 2, 2);
  });

  it('竖向大图适配 A4：铺满高度并水平居中', () => {
    const r = fitImageOnPage(1080, 1920, 595.28, 841.89);
    expect(r.height).toBeCloseTo(841.89, 2);
    expect(r.width).toBeCloseTo(1080 * (841.89 / 1920), 2);
    expect(r.y).toBeCloseTo(0, 2);
    expect(r.x).toBeCloseTo((595.28 - r.width) / 2, 2);
  });

  it('小图不放大，居中放置', () => {
    const r = fitImageOnPage(100, 80, 595.28, 841.89);
    expect(r.width).toBeCloseTo(100, 2);
    expect(r.height).toBeCloseTo(80, 2);
    expect(r.x).toBeCloseTo((595.28 - 100) / 2, 2);
    expect(r.y).toBeCloseTo((841.89 - 80) / 2, 2);
  });

  it('margin 缩小可用区域', () => {
    const r = fitImageOnPage(1920, 1080, 595.28, 841.89, { margin: 20 });
    expect(r.width).toBeCloseTo(595.28 - 40, 2);
  });

  it('非法 margin 回退 0', () => {
    expect(fitImageOnPage(1920, 1080, 595.28, 841.89, { margin: -5 }).width).toBeCloseTo(595.28, 2);
  });
});
