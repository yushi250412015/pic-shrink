import { describe, it, expect } from 'vitest';
import {
  CUSTOM_PREFIX,
  isValidScenarioSize,
  normalizeScenario,
  scenarioSizeKey,
  serializeCustomScenarios,
  parseCustomScenarios,
  customScenarioValue,
  parseCustomScenarioId,
  filterOutBuiltin,
} from '../src/utils/scenarios.js';

describe('isValidScenarioSize', () => {
  it('1-20000 的整数合法', () => {
    expect(isValidScenarioSize(1)).toBe(true);
    expect(isValidScenarioSize(20000)).toBe(true);
    expect(isValidScenarioSize(800)).toBe(true);
  });

  it('越界与小数非法', () => {
    expect(isValidScenarioSize(0)).toBe(false);
    expect(isValidScenarioSize(20001)).toBe(false);
    expect(isValidScenarioSize(1.5)).toBe(false);
    expect(isValidScenarioSize(NaN)).toBe(false);
  });
});

describe('normalizeScenario', () => {
  it('合法输入归一化（name 去空格、数字转整数）', () => {
    expect(normalizeScenario({ name: ' 我的封面 ', width: '800', height: 600 })).toEqual({
      name: '我的封面',
      width: 800,
      height: 600,
    });
  });

  it('非法返回 null', () => {
    expect(normalizeScenario(null)).toBeNull();
    expect(normalizeScenario({ name: '', width: 800, height: 600 })).toBeNull();
    expect(normalizeScenario({ name: 'x', width: 0, height: 600 })).toBeNull();
    expect(normalizeScenario({ name: 'x', width: 800, height: 30000 })).toBeNull();
    expect(normalizeScenario({ name: 'x', width: 1.2, height: 600 })).toBeNull();
  });
});

describe('serializeCustomScenarios', () => {
  it('过滤非法项', () => {
    const out = serializeCustomScenarios([
      { name: 'a', width: 800, height: 600 },
      { name: '', width: 1, height: 1 },
      null,
      'junk',
    ]);
    expect(out).toEqual([{ name: 'a', width: 800, height: 600 }]);
  });

  it('按尺寸去重（保留首个）', () => {
    const out = serializeCustomScenarios([
      { name: 'a', width: 800, height: 600 },
      { name: 'b', width: 800, height: 600 },
      { name: 'c', width: 900, height: 600 },
    ]);
    expect(out.map((s) => s.name)).toEqual(['a', 'c']);
  });

  it('非数组回退空数组', () => {
    expect(serializeCustomScenarios(null)).toEqual([]);
    expect(serializeCustomScenarios('x')).toEqual([]);
  });
});

describe('parseCustomScenarios', () => {
  it('解析合法 JSON', () => {
    const raw = JSON.stringify([{ name: 'a', width: 800, height: 600 }]);
    expect(parseCustomScenarios(raw)).toEqual([{ name: 'a', width: 800, height: 600 }]);
  });

  it('非法 JSON / 非字符串回退空数组', () => {
    expect(parseCustomScenarios('not-json')).toEqual([]);
    expect(parseCustomScenarios('')).toEqual([]);
    expect(parseCustomScenarios(null)).toEqual([]);
  });
});

describe('customScenarioValue / parseCustomScenarioId', () => {
  it('value 与解析互为逆运算', () => {
    const value = customScenarioValue(800, 600);
    expect(value).toBe(`${CUSTOM_PREFIX}800x600`);
    expect(parseCustomScenarioId(value)).toEqual({ width: 800, height: 600 });
  });

  it('非自定义 id 返回 null', () => {
    expect(parseCustomScenarioId('wechat-avatar')).toBeNull();
    expect(parseCustomScenarioId('custom:abc')).toBeNull();
    expect(parseCustomScenarioId('custom:0x600')).toBeNull();
    expect(parseCustomScenarioId(null)).toBeNull();
  });
});

describe('filterOutBuiltin', () => {
  it('过滤与内置尺寸重复的项', () => {
    const builtin = [{ value: 'x', width: 800, height: 600 }];
    const custom = [
      { name: '重复', width: 800, height: 600 },
      { name: '独有', width: 900, height: 700 },
    ];
    expect(filterOutBuiltin(custom, builtin).map((s) => s.name)).toEqual(['独有']);
  });

  it('scenarioSizeKey 稳定', () => {
    expect(scenarioSizeKey(800, 600)).toBe('800x600');
  });
});
