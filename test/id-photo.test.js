import { describe, it, expect } from 'vitest';
import {
  MM_PER_INCH,
  mmToPixels,
  normalizeGap,
  resolveIdBackground,
  planIdPhotoGrid,
} from '../src/utils/id-photo.js';

describe('mmToPixels 英寸-像素换算', () => {
  it('1 英寸 = dpi 像素', () => {
    expect(mmToPixels(25.4, 300)).toBe(300);
    expect(mmToPixels(25.4, 150)).toBe(150);
  });

  it('取整', () => {
    expect(mmToPixels(25, 300)).toBe(295);
    expect(mmToPixels(35, 300)).toBe(413);
    expect(mmToPixels(49, 300)).toBe(579);
  });

  it('非法 dpi 回退 300', () => {
    expect(mmToPixels(25.4, 0)).toBe(300);
    expect(mmToPixels(25.4, -5)).toBe(300);
  });
});

describe('normalizeGap', () => {
  it('非负整数', () => {
    expect(normalizeGap(0)).toBe(0);
    expect(normalizeGap(10)).toBe(10);
    expect(normalizeGap(2.6)).toBe(3);
  });

  it('非法值回退 0', () => {
    expect(normalizeGap(-1)).toBe(0);
    expect(normalizeGap(NaN)).toBe(0);
    expect(normalizeGap(undefined)).toBe(0);
  });
});

describe('resolveIdBackground', () => {
  it('白/红/蓝映射', () => {
    expect(resolveIdBackground('white')).toBe('#ffffff');
    expect(resolveIdBackground('red')).toBe('#d9001b');
    expect(resolveIdBackground('blue')).toBe('#009adf');
  });

  it('未知值回退白色', () => {
    expect(resolveIdBackground('green')).toBe('#ffffff');
    expect(resolveIdBackground(undefined)).toBe('#ffffff');
  });
});

describe('planIdPhotoGrid 网格计算', () => {
  it('一寸 300dpi 4x6：单格 295×413，页 1200×1800', () => {
    const grid = planIdPhotoGrid({ unit: '1in', dpi: 300, paper: '4x6in' });
    expect(grid.cellW).toBe(295);
    expect(grid.cellH).toBe(413);
    expect(grid.pageW).toBe(1200);
    expect(grid.pageH).toBe(1800);
  });

  it('一寸可排 4 列 4 行 = 16 张', () => {
    const grid = planIdPhotoGrid({ unit: '1in' });
    expect(grid.cols).toBe(4);
    expect(grid.rows).toBe(4);
    expect(grid.capacity).toBe(16);
    expect(grid.capacity).toBe(grid.cols * grid.rows);
  });

  it('二寸 300dpi：单格 413×579，可排 2 列 3 行 = 6 张', () => {
    const grid = planIdPhotoGrid({ unit: '2in' });
    expect(grid.cellW).toBe(413);
    expect(grid.cellH).toBe(579);
    expect(grid.cols).toBe(2);
    expect(grid.rows).toBe(3);
    expect(grid.capacity).toBe(6);
  });

  it('gap 会减少容量且不小于 1', () => {
    const tight = planIdPhotoGrid({ unit: '2in' });
    const loose = planIdPhotoGrid({ unit: '2in', gap: 60 });
    expect(loose.capacity).toBeLessThanOrEqual(tight.capacity);
    expect(loose.cols).toBeGreaterThanOrEqual(1);
    expect(loose.rows).toBeGreaterThanOrEqual(1);
  });

  it('非法 unit / paper 回退默认', () => {
    expect(planIdPhotoGrid({ unit: 'oops' }).cellW).toBe(295);
    expect(planIdPhotoGrid({ paper: 'oops' }).pageW).toBe(1200);
  });

  it('dpi 影响页与格像素但容量基本一致（同比例）', () => {
    const low = planIdPhotoGrid({ unit: '1in', dpi: 150 });
    expect(low.pageW).toBe(600);
    expect(low.cellW).toBe(Math.round((25 / MM_PER_INCH) * 150));
  });
});
