import { describe, it, expect } from 'vitest';
import {
  fileExtension,
  isHeicName,
  isHeicType,
  isHeicFile,
  isImageInput,
} from '../src/utils/filetype.js';

describe('fileExtension', () => {
  it('取小写扩展名', () => {
    expect(fileExtension('Photo.HEIC')).toBe('heic');
    expect(fileExtension('a.b.c.JPG')).toBe('jpg');
  });

  it('无扩展名或空值返回空串', () => {
    expect(fileExtension('noext')).toBe('');
    expect(fileExtension('.hidden')).toBe('');
    expect(fileExtension('')).toBe('');
    expect(fileExtension(null)).toBe('');
  });
});

describe('isHeicName', () => {
  it('识别 heic / heif 后缀（大小写不敏感）', () => {
    expect(isHeicName('IMG_001.heic')).toBe(true);
    expect(isHeicName('IMG_002.HEIF')).toBe(true);
    expect(isHeicName('IMG_003.HeIc')).toBe(true);
  });

  it('其他格式返回 false', () => {
    expect(isHeicName('a.jpg')).toBe(false);
    expect(isHeicName('a.png')).toBe(false);
    expect(isHeicName('a')).toBe(false);
  });
});

describe('isHeicType', () => {
  it('识别 HEIC / HEIF MIME（大小写不敏感）', () => {
    expect(isHeicType('image/heic')).toBe(true);
    expect(isHeicType('image/heif')).toBe(true);
    expect(isHeicType('IMAGE/HEIC')).toBe(true);
  });

  it('其他 MIME 返回 false', () => {
    expect(isHeicType('image/jpeg')).toBe(false);
    expect(isHeicType('')).toBe(false);
    expect(isHeicType(null)).toBe(false);
  });
});

describe('isHeicFile', () => {
  it('文件名命中即识别（MIME 为空的情况）', () => {
    expect(isHeicFile({ name: 'x.heic', type: '' })).toBe(true);
  });

  it('MIME 命中即识别（无扩展名的情况）', () => {
    expect(isHeicFile({ name: 'noext', type: 'image/heif' })).toBe(true);
  });

  it('两者都不命中返回 false', () => {
    expect(isHeicFile({ name: 'a.jpg', type: 'image/jpeg' })).toBe(false);
    expect(isHeicFile(null)).toBe(false);
  });
});

describe('isImageInput', () => {
  it('常规图片与 HEIC 都接受', () => {
    expect(isImageInput({ name: 'a.jpg', type: 'image/jpeg' })).toBe(true);
    expect(isImageInput({ name: 'a.heic', type: '' })).toBe(true);
  });

  it('非图片拒绝', () => {
    expect(isImageInput({ name: 'a.pdf', type: 'application/pdf' })).toBe(false);
    expect(isImageInput({ name: 'a.txt', type: '' })).toBe(false);
  });
});
