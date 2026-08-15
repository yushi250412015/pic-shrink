/** 把文件名拆成「主名 + 扩展名（不含点）」两部分 */
export function splitExtension(filename) {
  const dot = filename.lastIndexOf('.');
  if (dot <= 0) return { base: filename, ext: '' };
  return { base: filename.slice(0, dot), ext: filename.slice(dot + 1) };
}

/** 替换扩展名：photo.jpg + webp -> photo.webp */
export function replaceExtension(filename, ext) {
  return `${splitExtension(filename).base}.${ext}`;
}

/** 按模板生成输出文件名：`${prefix}${主名}${suffix}.${ext}` */
export function renderOutputName(filename, ext, { prefix = '', suffix = '' } = {}) {
  return `${prefix}${splitExtension(filename).base}${suffix}.${ext}`;
}

/** 在 used 集合内去重：a.png, a-2.png, a-3.png ... */
export function makeUnique(name, used) {
  if (!used.has(name)) {
    used.add(name);
    return name;
  }
  const { base, ext } = splitExtension(name);
  const suffix = ext ? `.${ext}` : '';
  let index = 2;
  let candidate = `${base}-${index}${suffix}`;
  while (used.has(candidate)) {
    index += 1;
    candidate = `${base}-${index}${suffix}`;
  }
  used.add(candidate);
  return candidate;
}
