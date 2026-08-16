# Changelog

本文档记录项目的所有重要变更。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 新增

- **长截图拼接**：把多张已完成图片按顺序拼成一张长图（纵向上下 / 横向左右），可选间距与对齐（起点 / 居中 / 终点），PNG 无损输出；纯函数 `utils/stitch.js`（`computeStitchLayout`）+ Worker 合成（`stitch-core.js` / `stitch-worker.js`）+ 工具栏「拼接长图」入口（`ui/stitch-modal.js`），≥2 张完成图时显示。单测 7 项（总 137 用例）。
- **元数据批量编辑（标题/作者）**：设置面板新增「元数据标题/作者」，JPEG 输出时把标题(ImageDescription)与作者(Artist)写入 EXIF（UTF-8 编码，非 ASCII 文本可正确保存）；纯函数 `utils/metadata.js` + 集成进压缩管线 `compression.js`；其余格式诚实跳过；新增依赖 `piexifjs`。单测 6 项。
- **投稿尺寸库（ROADMAP §3 长期方向第一项）**：场景预设下拉新增按平台分组的「投稿尺寸库」（B站/知乎/公众号/小红书/微博/抖音，共 14 个尺寸），一键套用现有 cover 裁剪管线输出精确像素；纯数据 + 纯函数 `utils/submission-sizes.js`（`findSubmissionSize` / `submissionSizesFor` / `resolveSubmissionSize`）+ 来源/置信度入档 `docs/research/submission-sizes.md`；自定义预设去重同时排除投稿尺寸；单测 11 项（总 137 用例）。

## [1.2.0] - 2026-08-16

### 新增

- HEIC/HEIF 解码支持：iPhone 照片可直接拖入/选择，Worker 内用 heic2any 解码为 JPEG 后进入现有压缩管线（纯 JS，无 WASM，按需分包不常驻）
- 批量证件照排版：一寸/二寸铺满 4×6 相纸（底色白/红/蓝、张数可调），网格计算纯函数化
- PNG 优化策略：默认 / 有损（canvas 量化重编码）/ 无损（@jsquash/oxipng wasm 瘦身），wasm 失败优雅回退并在结果卡片提示
- 图片转 PDF：多图合并每图一页，页面尺寸可选「原图尺寸 / A4 适配居中」，JPEG 直嵌、PNG/WebP 先转 JPEG
- 极简模式：一键隐藏高级设置，只留「格式 + 质量/目标大小 + 场景」，localStorage 记忆
- 自定义场景预设：场景下拉新增「我的预设」分组，可添加/删除尺寸模板（宽高 1-20000 校验）

### 变更

- 图片 Worker 切换为 ES 模块格式（`worker.format: 'es'`），支持 Worker 内动态 import 按需分包
- 场景预设逻辑接入自定义预设（Worker 内通过 `custom:WxH` 自描述 value 解析，无需访问 localStorage）

## [1.1.0] - 2026-08-16

### 新增

- PWA 离线安装：manifest + Service Worker（stale-while-revalidate），可安装到桌面、离线可用
- 暗色模式：跟随系统 / 手动切换，localStorage 记忆
- 处理前后对比滑杆：每张结果卡片可打开 before/after 对比
- 批量重命名模板：`{name}` `{ext}` `{index}` `{index:0>2}` `{index1}` `{date}` 占位符，替代简单前后缀
- PDF 页面操作增强：左旋 90° / 删除 / 上移下移，重建并导出新 PDF
- 场景预设扩充至 16 个：微博 / B站 / 知乎 / 抖音 / GitHub 头像 / QQ 头像 / 淘宝详情 / 公众号卡片
- 持久化统计：累计处理张数、累计节省体积、跨天使用天数
- 快捷键：Ctrl/Cmd+O 选择文件、Delete 删除选中、Esc 关闭弹窗

### 变更

- 输出文件名前缀 / 后缀升级为模板输入框（默认 `{name}`，扩展名始终与输出格式一致）

## [1.0.0] - 2026-08-15

首个正式版本，功能完整。

### 新增

- 场景化预设：微信头像 / 公众号封面 / 小红书 / 淘宝主图 / 视频封面 / 证件照，一键 cover 裁剪 + 精确缩放
- PDF 工具：合并、拆分每页、按页码范围提取、优化压缩
- GIF 压缩 / 裁剪 / 缩放（保留动画帧）
- EXIF 查看与清除（含 GPS 定位隐私提示）
- 中英双语界面

### 变更

- README 重写为完整功能说明

## [0.3.0] - 2026-08-15

### 新增

- 自定义区域裁剪（交互式框选）
- 文字水印（九宫格位置 / 字号 / 颜色 / 不透明度）

### 变更

- 工程化加固：新增 `rev` 版本号防并发竞态、`ARCHITECTURE.md` 开发规范、`utils` 层纯函数化

## [0.2.0] - 2026-08-15

### 新增

- 目标大小压缩、旋转 / 翻转、尺寸预设、居中裁方形、背景填充、批量重命名

### 变更

- 重构为 `utils` / `core` / `ui` 分层架构，补充单元测试

## [0.1.0] - 2026-08-15

### 新增

- 批量压缩、格式转换（JPEG / PNG / WebP）、质量调节、尺寸缩放、ZIP 打包、按住对比预览
