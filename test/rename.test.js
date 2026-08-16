import { describe, it, expect } from 'vitest';
import { applyRenameTemplate, formatDateStamp } from '../src/utils/rename.js';

const date = new Date(2024, 0, 15, 9, 5, 3); // 本地 2024-01-15 09:05:03

describe('applyRenameTemplate', () => {
  it('渲染 name / ext / date 占位符', () => {
    expect(applyRenameTemplate('{name}_{ext}', { name: 'photo', ext: 'jpg' })).toBe('photo_jpg');
    expect(applyRenameTemplate('{date}_{name}', { name: 'a', ext: '', date })).toBe('20240115-090503_a');
  });

  it('{index} 0 起始，支持 :0>N 前导零，{index1} 从 1 计数', () => {
    expect(applyRenameTemplate('img_{index:0>2}', { name: 'a', ext: 'png', index: 0 })).toBe('img_00');
    expect(applyRenameTemplate('img_{index:0>2}', { name: 'a', ext: 'png', index: 5 })).toBe('img_05');
    expect(applyRenameTemplate('img_{index:0>3}', { name: 'a', ext: 'png', index: 12 })).toBe('img_012');
    expect(applyRenameTemplate('img_{index1}', { name: 'a', ext: 'png', index: 0 })).toBe('img_1');
    expect(applyRenameTemplate('img_{index1:0>2}', { name: 'a', ext: 'png', index: 0 })).toBe('img_01');
  });

  it('空 / 非字符串 / 无占位符模板回退为「原名.扩展名」', () => {
    expect(applyRenameTemplate('', { name: 'photo', ext: 'jpg' })).toBe('photo.jpg');
    expect(applyRenameTemplate('   ', { name: 'photo', ext: 'jpg' })).toBe('photo.jpg');
    expect(applyRenameTemplate(123, { name: 'photo', ext: 'jpg' })).toBe('photo.jpg');
    expect(applyRenameTemplate('fixed-name', { name: 'photo', ext: 'jpg' })).toBe('photo.jpg');
  });

  it('中文名原样保留', () => {
    expect(applyRenameTemplate('{name}', { name: '风景照片', ext: 'png' })).toBe('风景照片');
    expect(applyRenameTemplate('{name}.{ext}', { name: '风景照片', ext: 'png' })).toBe('风景照片.png');
  });

  it('扩展名占位符 {ext} 保留原扩展名', () => {
    expect(applyRenameTemplate('{name}.{ext}', { name: 'photo', ext: 'png' })).toBe('photo.png');
    expect(applyRenameTemplate('v2_{ext}', { name: 'photo', ext: 'webp' })).toBe('v2_webp');
  });

  it('无扩展名文件回退不产生多余点', () => {
    expect(applyRenameTemplate('', { name: 'README', ext: '' })).toBe('README');
  });
});

describe('formatDateStamp', () => {
  it('格式化为 YYYYMMDD-HHmmss', () => {
    expect(formatDateStamp(new Date(2024, 0, 15, 9, 5, 3))).toBe('20240115-090503');
  });
});
