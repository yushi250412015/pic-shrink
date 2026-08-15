import { describe, it, expect } from 'vitest';
import {
  splitExtension,
  replaceExtension,
  renderOutputName,
  makeUnique,
} from '../src/utils/filename.js';

describe('splitExtension', () => {
  it('拆分主名与扩展名', () => {
    expect(splitExtension('photo.jpg')).toEqual({ base: 'photo', ext: 'jpg' });
    expect(splitExtension('a.b.c.png')).toEqual({ base: 'a.b.c', ext: 'png' });
    expect(splitExtension('noext')).toEqual({ base: 'noext', ext: '' });
    expect(splitExtension('.gitignore')).toEqual({ base: '.gitignore', ext: '' });
  });
});

describe('replaceExtension', () => {
  it('替换扩展名', () => {
    expect(replaceExtension('photo.jpg', 'webp')).toBe('photo.webp');
    expect(replaceExtension('a.b.c.png', 'jpeg')).toBe('a.b.c.jpeg');
    expect(replaceExtension('noext', 'png')).toBe('noext.png');
  });
});

describe('renderOutputName', () => {
  it('按前缀/后缀模板生成名称', () => {
    expect(renderOutputName('photo.jpg', 'webp')).toBe('photo.webp');
    expect(renderOutputName('photo.jpg', 'webp', { prefix: 'p_', suffix: '_s' })).toBe('p_photo_s.webp');
  });
});

describe('makeUnique', () => {
  it('重名自动加序号', () => {
    const used = new Set();
    expect(makeUnique('a.png', used)).toBe('a.png');
    expect(makeUnique('a.png', used)).toBe('a-2.png');
    expect(makeUnique('a.png', used)).toBe('a-3.png');
    expect(makeUnique('b.png', used)).toBe('b.png');
  });

  it('无扩展名文件也能去重', () => {
    const used = new Set();
    expect(makeUnique('noext', used)).toBe('noext');
    expect(makeUnique('noext', used)).toBe('noext-2');
  });
});
