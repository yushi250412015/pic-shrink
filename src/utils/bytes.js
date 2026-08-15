const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

/** 把字节数格式化为可读字符串，例如 1536 -> "1.5 KB" */
export function formatBytes(bytes, decimals = 1) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), UNITS.length - 1);
  const value = bytes / k ** i;
  return `${value.toFixed(i === 0 ? 0 : decimals)} ${UNITS[i]}`;
}

/** 计算节省比例（百分比，四舍五入）；负数表示体积变大 */
export function calcSavedPercent(original, compressed) {
  if (!original) return 0;
  return Math.round(((original - compressed) / original) * 100);
}
