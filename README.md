# Pic Shrink

纯本地运行的图片 / PDF / GIF 处理工具。所有处理都在浏览器内完成，文件不会上传到任何服务器。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Deploy](https://github.com/yushi250412015/pic-shrink/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/yushi250412015/pic-shrink/actions/workflows/deploy-pages.yml)

在线使用：<https://yushi250412015.github.io/pic-shrink/>

> A privacy-first image / PDF / GIF toolbox that runs entirely in your browser. Batch-compress, convert, crop, watermark and resize images, merge or split PDFs, and optimize GIFs — nothing is uploaded. Available in English and Chinese.

## 功能

- **图片批量压缩**：拖拽 / 粘贴 / 多选，多 Worker 并行处理，逐张显示节省比例
- **格式转换**：JPEG / PNG / WebP / AVIF，或保持原格式
- **两种压缩策略**：按质量（10%–100%），或按目标大小自动寻找最接近的质量
- **尺寸调整**：不缩放 / 常用预设（1280 / 1920 / 2560 / 3840）/ 最长边限制 / 百分比 / **16 个场景预设**（微信头像、公众号封面、小红书、淘宝主图、证件照、微博 / B站 / 知乎 / 抖音、GitHub / QQ 头像等一键出图）
- **几何变换**：90° / 180° / 270° 旋转、水平 / 垂直翻转、居中裁剪为正方形、**自定义区域裁剪**（交互式框选）
- **文字水印**：九宫格位置、字号、颜色、不透明度可调
- **GIF 处理**：压缩、缩放、裁剪，保留动画帧
- **PDF 工具**：合并、拆分每页、按页码范围提取、优化压缩、**页面旋转 / 删除 / 重排**
- **EXIF 查看与清除**：读取相机 / 日期 / GPS 定位，转换后自动清除并给出隐私提示
- **输出重命名模板**：`{name}` `{ext}` `{index}` `{index:0>2}` `{date}` 占位符；多结果自动打包 ZIP
- **处理前后对比**：每张结果卡片可拖动滑杆对比原图与压缩图
- **暗色模式**：跟随系统 / 手动切换，localStorage 记忆
- **PWA 离线安装**：可安装到桌面，Service Worker 缓存后离线可用
- **持久化统计**：累计处理张数、累计节省体积、使用天数
- **快捷键**：Ctrl/Cmd+O 选择文件、Delete 删除选中、Esc 关闭弹窗
- **中英双语**：界面可切换
- **隐私优先**：Canvas / OffscreenCanvas / pdf-lib / gifsicle-wasm 全本地处理，零上传、零后端

## 快速开始

```bash
npm install
npm run dev      # 开发模式（http://localhost:5173）
npm test         # 运行单元测试
npm run build    # 构建产物到 dist/
npm run preview  # 预览构建产物
```

## 技术栈

| 层 | 选型 |
|---|---|
| 构建 | Vite |
| 语言 | 原生 JavaScript（ES Modules，无框架） |
| 图像处理 | createImageBitmap + OffscreenCanvas（Web Worker） |
| PDF | pdf-lib（按需分包） |
| GIF | gifsicle-wasm（自包含，打进图片 Worker） |
| EXIF | exifr（按需分包） |
| 打包下载 | JSZip（按需分包） |
| 测试 | Vitest |
| 部署 | GitHub Pages + GitHub Actions |

## 项目结构

```
pic-shrink/
├── index.html                # 页面结构
├── public/                   # PWA 静态资源（manifest / sw / 图标）
├── src/
│   ├── main.js               # 入口：装配各模块
│   ├── config.js             # 常量、默认设置与预设
│   ├── store.js              # 应用状态管理
│   ├── pipeline.js           # 图片 Worker 池与任务调度
│   ├── compression.js        # 图片/水印/GIF 压缩核心（Worker 内运行）
│   ├── worker.js             # 图片 Worker 入口
│   ├── pdf-core.js           # PDF 处理核心（Worker 内运行）
│   ├── pdf-worker.js         # PDF Worker 入口
│   ├── exif.js               # EXIF 读取
│   ├── ui/                   # 界面模块（i18n、上传、设置、列表、统计、裁剪、PDF、下载等）
│   └── utils/                # 纯函数工具（字节、文件名、几何、质量搜索、重命名模板、页码、统计等）
├── test/                     # 单元测试
├── ARCHITECTURE.md           # 架构与开发规范
├── .github/workflows/        # 自动部署
└── LICENSE
```

## 部署到 GitHub Pages

仓库内置 GitHub Actions 工作流，推送到 `main` 后自动「安装依赖 → 测试 → 构建 → 部署」：

1. 在仓库 **Settings → Pages** 中，将 Source 设为 **GitHub Actions**
2. 推送代码后，Actions 会自动构建并部署
3. 完成后即可访问 `https://<用户名>.github.io/pic-shrink/`

## 使用说明

1. 顶部切换「图片工具」或「PDF 工具」
2. 拖入 / 选择 / 粘贴文件，支持多选
3. 在「转换设置」中调整格式、压缩方式、尺寸、旋转、水印等
4. 每张卡片显示原大小、新大小、尺寸与格式；按住预览图可对比原图；点「对比」拖动滑杆看处理前后；点「裁剪」可框选区域
5. 单张下载，或「下载全部（ZIP）」一键打包

## 常见问题

**文件会传到服务器吗？**
不会。所有处理都在浏览器本地完成，代码完全开源可审计，断网也能使用。

**支持哪些输入格式？**
图片：JPG / PNG / WebP / GIF / BMP / AVIF / SVG（取决于浏览器解码能力）；PDF 工具支持 PDF。

**目标大小压缩对 PNG 有效吗？**
PNG 是无损格式，无法通过质量参数压缩；目标大小策略仅对 JPEG / WebP / AVIF 生效。

**GIF 会丢失动画吗？**
保持 GIF 格式输出时使用 gifsicle 处理，动画帧会保留；转换为 JPG / PNG / WebP 时输出首帧静态图。

## 路线图

- [x] PWA 离线安装
- [x] 更强大的批量重命名规则（`{name}/{index}/{date}/{ext}` 模板）
- [ ] 图片拼接 / 长图
- [ ] HEIC/HEIF 解码支持
- [ ] 扫描件增强（灰度、去阴影）

## License

[MIT](LICENSE) © yushi250412015
