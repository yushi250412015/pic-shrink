/**
 * 批量重命名模板渲染（纯函数，无 DOM / 无副作用）。
 *
 * 占位符：
 *   {name}           原主名（不含扩展名）
 *   {ext}            原扩展名（不含点）
 *   {index}          0 起始序号
 *   {index1}         1 起始序号
 *   {index:0>N}      index 用 0 前导补齐到 N 位（如 {index:0>2} -> 00, 01, ...）
 *   {index1:0>N}     index1 用 0 前导补齐到 N 位
 *   {date}           日期时间，格式 YYYYMMDD-HHmmss
 *
 * 模板为空 / 非字符串 / 不含任何有效占位符时，回退为「{name}.{ext}」（保留原名与扩展名）。
 */

const TOKEN_RE = /\{(name|ext|index1?|date)(?::(0>\d+))?\}/g;

function pad(value, spec) {
  if (!spec) return String(value);
  const match = /^0>(\d+)$/.exec(spec);
  if (!match) return String(value);
  return String(value).padStart(Number(match[1]), '0');
}

/** 把 Date 格式化为 YYYYMMDD-HHmmss（本地时区） */
export function formatDateStamp(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${y}${m}${day}-${hh}${mm}${ss}`;
}

/**
 * 按模板渲染输出文件名（含扩展名，模板完全决定结果）。
 * @param {string} template 模板字符串
 * @param {{name: string, ext: string, index?: number, date?: Date}} ctx
 */
export function applyRenameTemplate(template, { name = '', ext = '', index = 0, date = new Date() } = {}) {
  if (typeof template !== 'string' || !template.trim()) {
    return ext ? `${name}.${ext}` : name;
  }

  let used = false;
  const dateStamp = formatDateStamp(date);
  const rendered = template.replace(TOKEN_RE, (token, key, spec) => {
    used = true;
    if (key === 'name') return name;
    if (key === 'ext') return ext;
    if (key === 'date') return dateStamp;
    const value = key === 'index1' ? Number(index) + 1 : Number(index);
    return pad(value, spec);
  });

  // 模板不含任何有效占位符时回退（避免输出无意义的常量名覆盖原文件）
  if (!used) return ext ? `${name}.${ext}` : name;
  return rendered;
}
