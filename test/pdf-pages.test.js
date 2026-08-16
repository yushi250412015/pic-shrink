import { describe, it, expect } from 'vitest';
import { expandRanges, applyPageOperations } from '../src/utils/pdf-pages.js';

describe('expandRanges', () => {
  it('解析逗号与区间', () => {
    expect(expandRanges('1-3,5', 10)).toEqual([0, 1, 2, 4]);
  });

  it('单个页码列表', () => {
    expect(expandRanges('2,4,6', 10)).toEqual([1, 3, 5]);
  });

  it('开区间到末尾', () => {
    expect(expandRanges('3-', 5)).toEqual([2, 3, 4]);
  });

  it('越界裁剪到有效范围', () => {
    expect(expandRanges('8-10', 5)).toEqual([4]);
  });

  it('空字符串返回空数组', () => {
    expect(expandRanges('', 10)).toEqual([]);
  });

  it('去重且升序', () => {
    expect(expandRanges('3,1,2-3', 5)).toEqual([0, 1, 2]);
  });
});

describe('applyPageOperations', () => {
  it('左旋 90° 累计角度为 270（≡ -90）', () => {
    const plan = applyPageOperations(3, [{ type: 'rotate', index: 0 }]);
    expect(plan[0]).toEqual({ originalIndex: 0, angle: 270 });
    expect(plan[1]).toEqual({ originalIndex: 1, angle: 0 });
    // 连续左旋两次 = 180°
    expect(applyPageOperations(1, [
      { type: 'rotate', index: 0 },
      { type: 'rotate', index: 0 },
    ])[0].angle).toBe(180);
  });

  it('删除页面后其余页按原顺序前移', () => {
    const plan = applyPageOperations(3, [{ type: 'delete', index: 1 }]);
    expect(plan.map((p) => p.originalIndex)).toEqual([0, 2]);
  });

  it('上移 / 下移重排页面顺序', () => {
    expect(applyPageOperations(3, [{ type: 'move', index: 0, delta: 1 }]).map((p) => p.originalIndex)).toEqual([1, 0, 2]);
    expect(applyPageOperations(3, [{ type: 'move', index: 2, delta: -1 }]).map((p) => p.originalIndex)).toEqual([0, 2, 1]);
  });

  it('旋转 + 删除 + 移动按顺序叠加，旋转跟随原页', () => {
    const plan = applyPageOperations(4, [
      { type: 'rotate', index: 1 },
      { type: 'delete', index: 0 },
      { type: 'move', index: 0, delta: 1 },
    ]);
    expect(plan).toEqual([
      { originalIndex: 2, angle: 0 },
      { originalIndex: 1, angle: 270 },
      { originalIndex: 3, angle: 0 },
    ]);
  });

  it('非法 index 的操作被忽略', () => {
    expect(applyPageOperations(2, [{ type: 'delete', index: 5 }]).map((p) => p.originalIndex)).toEqual([0, 1]);
    expect(applyPageOperations(2, [{ type: 'rotate', index: -1 }])[0].angle).toBe(0);
  });
});
