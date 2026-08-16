import { describe, it, expect } from 'vitest';
import { computeStitchLayout, STITCH_DIRECTIONS, STITCH_ALIGNS } from '../src/utils/stitch.js';

describe('computeStitchLayout', () => {
  const dims = [
    { width: 100, height: 50 },
    { width: 80, height: 120 },
    { width: 120, height: 60 },
  ];

  it('纵向拼接：高度相加 + 间距，宽度取最大', () => {
    const layout = computeStitchLayout(dims, { direction: 'vertical', gap: 10 });
    expect(layout.width).toBe(120);
    expect(layout.height).toBe(50 + 120 + 60 + 10 * 2);
    expect(layout.items).toHaveLength(3);
    expect(layout.items[0].y).toBe(0);
    expect(layout.items[1].y).toBe(50 + 10);
    expect(layout.items[2].y).toBe(50 + 120 + 10 * 2);
  });

  it('横向拼接：宽度相加 + 间距，高度取最大', () => {
    const layout = computeStitchLayout(dims, { direction: 'horizontal', gap: 5 });
    expect(layout.height).toBe(120);
    expect(layout.width).toBe(100 + 80 + 120 + 5 * 2);
    expect(layout.items[0].x).toBe(0);
    expect(layout.items[1].x).toBe(100 + 5);
    expect(layout.items[2].x).toBe(100 + 80 + 5 * 2);
  });

  it('对齐：纵向 start/center/end 决定水平 x', () => {
    const [a, b] = [
      { width: 80, height: 10 },
      { width: 120, height: 10 },
    ];
    expect(computeStitchLayout([a, b], { direction: 'vertical', align: 'start' }).items[0].x).toBe(0);
    expect(computeStitchLayout([a, b], { direction: 'vertical', align: 'center' }).items[0].x).toBe(20);
    expect(computeStitchLayout([a, b], { direction: 'vertical', align: 'end' }).items[0].x).toBe(40);
  });

  it('对齐：横向 start/center/end 决定垂直 y', () => {
    const [a, b] = [
      { width: 10, height: 60 },
      { width: 10, height: 120 },
    ];
    expect(computeStitchLayout([a, b], { direction: 'horizontal', align: 'start' }).items[0].y).toBe(0);
    expect(computeStitchLayout([a, b], { direction: 'horizontal', align: 'center' }).items[0].y).toBe(30);
    expect(computeStitchLayout([a, b], { direction: 'horizontal', align: 'end' }).items[0].y).toBe(60);
  });

  it('空列表返回空布局', () => {
    expect(computeStitchLayout([])).toEqual({ width: 0, height: 0, items: [] });
  });

  it('非法参数回退默认（纵向 + start + gap 0）', () => {
    const layout = computeStitchLayout([{ width: 10, height: 10 }], { direction: 'bad', align: 'bad', gap: -5 });
    expect(layout.width).toBe(10);
    expect(layout.height).toBe(10);
    expect(layout.items[0]).toEqual({ x: 0, y: 0, width: 10, height: 10 });
  });

  it('常量表完整性', () => {
    expect(STITCH_DIRECTIONS).toEqual(['horizontal', 'vertical']);
    expect(STITCH_ALIGNS).toEqual(['start', 'center', 'end']);
  });
});
