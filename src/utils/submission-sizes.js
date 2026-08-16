// 投稿尺寸库：主流内容平台（B站/知乎/公众号/小红书/微博/抖音）的投稿图片尺寸规范。
// 纯数据 + 纯函数（无 DOM、无 localStorage）。数据来源与置信度见 docs/research/submission-sizes.md。
//
// 说明：平台规范会随版本变化，此处记录的是最近一次核实（2026-08）的公开规范，
// 每一项都附 source 链接；如需精确对齐最新规范，请以平台官方为准复核。

export const SUBMISSION_PLATFORMS = [
  { value: 'bilibili', labelKey: 'sub.platform.bilibili' },
  { value: 'zhihu', labelKey: 'sub.platform.zhihu' },
  { value: 'wechat', labelKey: 'sub.platform.wechat' },
  { value: 'xiaohongshu', labelKey: 'sub.platform.xiaohongshu' },
  { value: 'weibo', labelKey: 'sub.platform.weibo' },
  { value: 'douyin', labelKey: 'sub.platform.douyin' },
];

export const SUBMISSION_SIZES = Object.freeze([
  // B站：视频投稿封面
  { id: 'sub-bilibili-cover-1610', platform: 'bilibili', labelKey: 'sub.bilibili.cover-1610', width: 1146, height: 717, ratio: '16:10', source: 'https://www.php.cn/faq/1521660.html' },
  { id: 'sub-bilibili-cover-169', platform: 'bilibili', labelKey: 'sub.bilibili.cover-169', width: 1920, height: 1080, ratio: '16:9', source: 'https://www.php.cn/faq/1521660.html' },
  // 知乎：文章/回答头图与封面
  { id: 'sub-zhihu-article-cover', platform: 'zhihu', labelKey: 'sub.zhihu.article-cover', width: 1380, height: 560, ratio: '69:28', source: 'https://zhuanlan.zhihu.com/p/640751635' },
  { id: 'sub-zhihu-cover', platform: 'zhihu', labelKey: 'sub.zhihu.cover', width: 1600, height: 900, ratio: '16:9', source: 'https://zhuanlan.zhihu.com/p/561091230' },
  // 微信公众号：封面/次图/卡片
  { id: 'sub-wechat-cover', platform: 'wechat', labelKey: 'sub.wechat.cover', width: 900, height: 383, ratio: '2.35:1', source: 'https://yiban.io/blog/39631' },
  { id: 'sub-wechat-mini', platform: 'wechat', labelKey: 'sub.wechat.mini', width: 400, height: 400, ratio: '1:1', source: 'https://yiban.io/blog/39323' },
  { id: 'sub-wechat-card', platform: 'wechat', labelKey: 'sub.wechat.card', width: 900, height: 500, ratio: '9:5', source: 'https://yiban.io/blog/26938' },
  // 小红书：笔记封面
  { id: 'sub-xiaohongshu-34', platform: 'xiaohongshu', labelKey: 'sub.xiaohongshu.34', width: 1080, height: 1440, ratio: '3:4', source: 'https://www.biaojixia.com/specs/xiaohongshu' },
  { id: 'sub-xiaohongshu-11', platform: 'xiaohongshu', labelKey: 'sub.xiaohongshu.11', width: 1080, height: 1080, ratio: '1:1', source: 'https://www.biaojixia.com/specs/xiaohongshu' },
  { id: 'sub-xiaohongshu-43', platform: 'xiaohongshu', labelKey: 'sub.xiaohongshu.43', width: 1440, height: 1080, ratio: '4:3', source: 'https://www.biaojixia.com/specs/xiaohongshu' },
  { id: 'sub-xiaohongshu-916', platform: 'xiaohongshu', labelKey: 'sub.xiaohongshu.916', width: 1080, height: 1920, ratio: '9:16', source: 'https://www.biaojixia.com/specs/xiaohongshu' },
  // 微博：头条横幅 / 配图
  { id: 'sub-weibo-banner', platform: 'weibo', labelKey: 'sub.weibo.banner', width: 980, height: 560, ratio: '7:4', source: 'https://viyi.cc/quick_check_on_cover_image_size_of_mainstream_platforms/' },
  { id: 'sub-weibo-feed', platform: 'weibo', labelKey: 'sub.weibo.feed', width: 1200, height: 1200, ratio: '1:1', source: 'https://viyi.cc/quick_check_on_cover_image_size_of_mainstream_platforms/' },
  // 抖音：竖版视频封面
  { id: 'sub-douyin-vertical', platform: 'douyin', labelKey: 'sub.douyin.vertical', width: 1080, height: 1920, ratio: '9:16', source: 'https://viyi.cc/quick_check_on_cover_image_size_of_mainstream_platforms/' },
]);

/** 平台值集合（用于校验） */
export function submissionPlatformValues() {
  return SUBMISSION_PLATFORMS.map((p) => p.value);
}

/** 按 id 查找投稿尺寸；未找到返回 null */
export function findSubmissionSize(id) {
  if (typeof id !== 'string') return null;
  return SUBMISSION_SIZES.find((s) => s.id === id) || null;
}

/** 某平台下的全部投稿尺寸（保持原始顺序） */
export function submissionSizesFor(platform) {
  if (typeof platform !== 'string') return [];
  return SUBMISSION_SIZES.filter((s) => s.platform === platform);
}

/** 解析投稿尺寸 id 为宽高；非投稿尺寸返回 null（供压缩管线直接使用） */
export function resolveSubmissionSize(id) {
  const s = findSubmissionSize(id);
  return s ? { width: s.width, height: s.height } : null;
}
