import { describe, it, expect } from 'vitest';
import piexif from 'piexifjs';
import {
  toBinaryString,
  fromBinaryString,
  utf8ByteString,
  buildMetadataExif,
  embedJpegMetadata,
} from '../src/utils/metadata.js';

// 1x1 最小 JPEG（用于 round-trip 验证）
const MIN_JPEG_B64 =
  '/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==';
const minJpeg = Uint8Array.from(Buffer.from(MIN_JPEG_B64, 'base64'));

/** 把 EXIF 读回的二进制字符串按 UTF-8 解码 */
function decodeUtf8(binaryStr) {
  return new TextDecoder().decode(fromBinaryString(binaryStr));
}

describe('buildMetadataExif', () => {
  it('标题/作者写入 EXIF（UTF-8 字节，可正确往返）', () => {
    const exif = buildMetadataExif({ title: '标题', author: '作者' });
    expect(decodeUtf8(exif['0th'][piexif.ImageIFD.ImageDescription])).toBe('标题');
    expect(decodeUtf8(exif['0th'][piexif.ImageIFD.Artist])).toBe('作者');
  });

  it('空输入返回 null', () => {
    expect(buildMetadataExif({})).toBeNull();
    expect(buildMetadataExif({ title: '', author: '' })).toBeNull();
    expect(buildMetadataExif({ title: '   ', author: '  ' })).toBeNull();
  });
});

describe('binary string helpers', () => {
  it('round-trip 保持字节', () => {
    const bytes = new Uint8Array([0, 1, 2, 255, 254, 128, 64]);
    expect(fromBinaryString(toBinaryString(bytes))).toEqual(bytes);
  });

  it('utf8ByteString 与 TextEncoder 字节一致', () => {
    const s = '测试标题';
    expect(fromBinaryString(utf8ByteString(s))).toEqual(new TextEncoder().encode(s));
  });
});

describe('embedJpegMetadata', () => {
  it('无内容返回 null', () => {
    expect(embedJpegMetadata(minJpeg, {})).toBeNull();
  });

  it('写入后可读回标题/作者（UTF-8）', () => {
    const result = embedJpegMetadata(minJpeg, { title: '测试标题', author: '测试作者' });
    expect(result).not.toBeNull();
    const exif = piexif.load(toBinaryString(result.data));
    expect(decodeUtf8(exif['0th'][piexif.ImageIFD.ImageDescription])).toBe('测试标题');
    expect(decodeUtf8(exif['0th'][piexif.ImageIFD.Artist])).toBe('测试作者');
  });
});
