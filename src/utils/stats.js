/**
 * 持久化统计的纯逻辑（无 DOM / 无 localStorage，IO 在 ui/stats-bar.js）。
 * 统计维度：累计处理张数、累计节省字节、使用天数（跨天会话数）。
 */

export function emptyStats() {
  return { totalFiles: 0, totalSavedBytes: 0, totalSessions: 0, lastDate: '' };
}

/** 日期键，本地时区 YYYY-MM-DD，用于判断是否跨天 */
export function dateKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 首次记录（lastDate 为空）或日期变化时，视为新的一天会话 */
export function isNewSession(lastDate, key) {
  return Boolean(key) && key !== lastDate;
}

/**
 * 把一次处理记录合并进累计统计。
 * @param {object} stats 当前累计
 * @param {{files?: number, savedBytes?: number, date?: Date}} delta
 */
export function recordProcessing(
  stats,
  { files = 0, savedBytes = 0, date = new Date() } = {},
) {
  const base = { ...emptyStats(), ...stats };
  const key = dateKey(date);
  const newSession = isNewSession(base.lastDate, key) ? 1 : 0;
  return {
    totalFiles: base.totalFiles + files,
    totalSavedBytes: base.totalSavedBytes + savedBytes,
    totalSessions: base.totalSessions + newSession,
    lastDate: key,
  };
}

/** 读取统计的展示字段（数值，未做 i18n / 字节格式化） */
export function summarizeStats(stats) {
  const base = { ...emptyStats(), ...stats };
  return {
    files: base.totalFiles,
    savedBytes: base.totalSavedBytes,
    days: base.totalSessions,
  };
}
