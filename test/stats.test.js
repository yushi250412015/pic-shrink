import { describe, it, expect } from 'vitest';
import {
  emptyStats,
  dateKey,
  isNewSession,
  recordProcessing,
  summarizeStats,
} from '../src/utils/stats.js';
import { formatBytes } from '../src/utils/bytes.js';

describe('recordProcessing 累计', () => {
  it('从空统计累加首次记录', () => {
    const stats = recordProcessing(emptyStats(), { files: 3, savedBytes: 1500, date: new Date(2024, 0, 15) });
    expect(stats.totalFiles).toBe(3);
    expect(stats.totalSavedBytes).toBe(1500);
    expect(stats.totalSessions).toBe(1);
    expect(stats.lastDate).toBe('2024-01-15');
  });

  it('同一天多次处理不增加会话数', () => {
    const first = recordProcessing(emptyStats(), { files: 1, savedBytes: 10, date: new Date(2024, 0, 15) });
    const second = recordProcessing(first, { files: 2, savedBytes: 20, date: new Date(2024, 0, 15, 23, 59) });
    expect(second.totalFiles).toBe(3);
    expect(second.totalSavedBytes).toBe(30);
    expect(second.totalSessions).toBe(1);
  });

  it('跨天累加会话数', () => {
    const first = recordProcessing(emptyStats(), { files: 1, savedBytes: 10, date: new Date(2024, 0, 15) });
    const second = recordProcessing(first, { files: 1, savedBytes: 5, date: new Date(2024, 0, 16) });
    expect(second.totalSessions).toBe(2);
    expect(second.lastDate).toBe('2024-01-16');
  });
});

describe('dateKey / isNewSession', () => {
  it('dateKey 输出本地 YYYY-MM-DD', () => {
    expect(dateKey(new Date(2024, 0, 15))).toBe('2024-01-15');
  });

  it('首次或跨天判定为新会话', () => {
    expect(isNewSession('', '2024-01-15')).toBe(true);
    expect(isNewSession('2024-01-15', '2024-01-15')).toBe(false);
    expect(isNewSession('2024-01-15', '2024-01-16')).toBe(true);
  });
});

describe('字节格式化', () => {
  it('累计节省字节可格式化为可读单位', () => {
    const stats = recordProcessing(emptyStats(), { files: 1, savedBytes: 1536, date: new Date(2024, 0, 15) });
    expect(formatBytes(summarizeStats(stats).savedBytes)).toBe('1.5 KB');
  });
});
