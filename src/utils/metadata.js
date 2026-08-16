// 元数据写入：把标题(ImageDescription)与作者(Artist)写入 JPEG 的 EXIF。
// 仅支持 JPEG（EXIF）；其余格式的元数据写入不在范围内（诚实跳过）。
// 文本按 UTF-8 字节写入（EXIF 标签名义上为 ASCII，但按字节写入可正确保存非 ASCII 文本，避免截断）。
import piexif from 'piexifjs';

/** Uint8Array/ArrayBuffer → 二进制字符串（每个字符代表一个字节） */
export function toBinaryString(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  const chunk = 0x8000; // 32k 分块，避免 call stack 超限
  for (let i = 0; i < u8.length; i += chunk) {
    s += String.fromCharCode.apply(null, u8.subarray(i, i + chunk));
  }
  return s;
}

/** 二进制字符串 → Uint8Array */
export function fromBinaryString(s) {
  const u8 = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i += 1) u8[i] = s.charCodeAt(i) & 0xff;
  return u8;
}

/** JS 字符串 → 每个字符代表一个 UTF-8 字节的二进制字符串 */
export function utf8ByteString(str) {
  return toBinaryString(new TextEncoder().encode(String(str)));
}

/** 构造用于写入的 EXIF 对象（仅标题/作者）。无内容时返回 null。 */
export function buildMetadataExif({ title = '', author = '' } = {}) {
  const t = String(title || '').trim();
  const a = String(author || '').trim();
  if (!t && !a) return null;
  const zeroth = {};
  if (t) zeroth[piexif.ImageIFD.ImageDescription] = utf8ByteString(t);
  if (a) zeroth[piexif.ImageIFD.Artist] = utf8ByteString(a);
  return { '0th': zeroth };
}

/** 把标题/作者写入 JPEG 字节的 EXIF。无法写入（无内容 / 非 JPEG / 出错）返回 null。 */
export function embedJpegMetadata(bytes, meta = {}) {
  const exifObj = buildMetadataExif(meta);
  if (!exifObj) return null;
  try {
    const exifBytes = piexif.dump(exifObj);
    const inserted = piexif.insert(exifBytes, toBinaryString(bytes));
    return { data: fromBinaryString(inserted) };
  } catch {
    return null;
  }
}

/** 便捷封装：给 Blob 写入 EXIF 标题/作者，返回新 Blob（无内容/失败返回 null）。 */
export async function embedJpegMetadataBlob(blob, meta = {}) {
  const buffer = await blob.arrayBuffer();
  const result = embedJpegMetadata(buffer, meta);
  if (!result) return null;
  return new Blob([result.data], { type: 'image/jpeg' });
}
