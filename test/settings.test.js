import { describe, it, expect } from 'vitest';
import { resolveResize } from '../src/utils/settings.js';
import { SCENARIOS, findScenario } from '../src/config.js';

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

describe('SCENARIOS 场景预设', () => {
  it('包含 v1.1 新增的平台尺寸', () => {
    const values = SCENARIOS.map((s) => s.value);
    for (const v of ['weibo', 'bilibili', 'zhihu', 'douyin', 'github-avatar', 'qq-avatar', 'taobao-detail', 'gzh-card']) {
      expect(values).toContain(v);
    }
  });

  it('findScenario 解析新场景宽高', () => {
    expect(findScenario('douyin')).toMatchObject({ width: 1080, height: 1920 });
    expect(findScenario('github-avatar')).toMatchObject({ width: 460, height: 460 });
    expect(findScenario('bilibili')).toMatchObject({ width: 1146, height: 717 });
  });

  it('场景总数达到 16 个', () => {
    expect(SCENARIOS.length).toBe(16);
  });
});
