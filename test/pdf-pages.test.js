import { describe, it, expect } from 'vitest';
import { expandRanges } from '../src/utils/pdf-pages.js';

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
