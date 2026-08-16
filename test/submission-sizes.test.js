import { describe, it, expect } from 'vitest';
import {
  SUBMISSION_PLATFORMS,
  SUBMISSION_SIZES,
  submissionPlatformValues,
  findSubmissionSize,
  submissionSizesFor,
  resolveSubmissionSize,
} from '../src/utils/submission-sizes.js';

describe('SUBMISSION_SIZES 数据完整性', () => {
  it('每条都有合法宽高（1-20000 整数）与唯一 id', () => {
    const ids = new Set();
    for (const s of SUBMISSION_SIZES) {
      expect(Number.isInteger(s.width)).toBe(true);
      expect(Number.isInteger(s.height)).toBe(true);
      expect(s.width).toBeGreaterThanOrEqual(1);
      expect(s.height).toBeGreaterThanOrEqual(1);
      expect(s.width).toBeLessThanOrEqual(20000);
      expect(s.height).toBeLessThanOrEqual(20000);
      expect(ids.has(s.id)).toBe(false);
      ids.add(s.id);
    }
  });

  it('每条都有平台、标签键与非空来源链接', () => {
    const platforms = new Set(submissionPlatformValues());
    for (const s of SUBMISSION_SIZES) {
      expect(platforms.has(s.platform)).toBe(true);
      expect(typeof s.labelKey).toBe('string');
      expect(s.labelKey.length).toBeGreaterThan(0);
      expect(typeof s.source).toBe('string');
      expect(s.source.startsWith('http')).toBe(true);
    }
  });

  it('覆盖路线图要求的四个平台：B站/知乎/公众号/小红书', () => {
    const platforms = new Set(SUBMISSION_SIZES.map((s) => s.platform));
    for (const p of ['bilibili', 'zhihu', 'wechat', 'xiaohongshu']) {
      expect(platforms.has(p)).toBe(true);
    }
  });

  it('至少包含 10 条投稿尺寸', () => {
    expect(SUBMISSION_SIZES.length).toBeGreaterThanOrEqual(10);
  });
});

describe('findSubmissionSize', () => {
  it('命中返回完整条目', () => {
    expect(findSubmissionSize('sub-xiaohongshu-34')).toMatchObject({ width: 1080, height: 1440 });
    expect(findSubmissionSize('sub-bilibili-cover-1610').platform).toBe('bilibili');
  });

  it('未命中返回 null', () => {
    expect(findSubmissionSize('wechat-avatar')).toBeNull();
    expect(findSubmissionSize('sub:nope')).toBeNull();
    expect(findSubmissionSize(null)).toBeNull();
  });
});

describe('submissionSizesFor', () => {
  it('按平台过滤并保持顺序', () => {
    const ids = submissionSizesFor('xiaohongshu').map((s) => s.id);
    expect(ids).toEqual(['sub-xiaohongshu-34', 'sub-xiaohongshu-11', 'sub-xiaohongshu-43', 'sub-xiaohongshu-916']);
  });

  it('未知平台 / 非字符串返回空数组', () => {
    expect(submissionSizesFor('nope')).toEqual([]);
    expect(submissionSizesFor(null)).toEqual([]);
  });
});

describe('resolveSubmissionSize', () => {
  it('返回宽高', () => {
    expect(resolveSubmissionSize('sub-douyin-vertical')).toEqual({ width: 1080, height: 1920 });
  });

  it('非投稿尺寸返回 null', () => {
    expect(resolveSubmissionSize('redbook')).toBeNull();
    expect(resolveSubmissionSize('')).toBeNull();
  });
});

describe('submissionPlatformValues', () => {
  it('顺序稳定且无重复', () => {
    const vals = submissionPlatformValues();
    expect(vals).toEqual(['bilibili', 'zhihu', 'wechat', 'xiaohongshu', 'weibo', 'douyin']);
    expect(new Set(vals).size).toBe(vals.length);
  });
});
