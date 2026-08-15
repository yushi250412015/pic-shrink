# 轻图 · Pic Shrink

纯本地运行的图片压缩与格式转换工具。所有处理都在浏览器内完成，图片不会上传到任何服务器。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Deploy](https://github.com/yushi250412015/pic-shrink/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/yushi250412015/pic-shrink/actions/workflows/deploy-pages.yml)

在线使用：<https://yushi250412015.github.io/pic-shrink/>

> A privacy-first image toolbox that runs entirely in your browser. Batch-compress, resize, rotate and convert images between JPEG / PNG / WebP / AVIF — nothing is uploaded.

## 功能

- **批量处理**：拖拽、点击或粘贴多张图片，多 Worker 并行处理
- **格式转换**：JPEG / PNG / WebP / AVIF，或保持原格式（GIF 原样保留动画）
- **两种压缩策略**：按质量（10%–100%），或按目标大小自动寻找最接近的质量
- **尺寸调整**：不缩放 / 常用预设（1280 / 1920 / 2560 / 3840）/ 最长边限制 / 百分比
- **几何变换**：90° / 180° / 270° 旋转、水平 / 垂直翻转、居中裁剪为正方形
- **自定义区域裁剪**：交互式框选任意区域，四角可拖拽调整，支持清除
- **文字水印**：九宫格位置、字号、颜色、不透明度可调
- **JPEG 背景填充**：转 JPEG 时自定义透明区域的填充色
- **输出重命名**：自定义文件名前缀与后缀，打包时同名自动去重
- **逐张对比**：按住预览图即可对比原图与转换结果
- **一键打包**：所有结果打包为 ZIP 下载
- **隐私优先**：Canvas + OffscreenCanvas 全本地处理，零上传、零后端、断网可用

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
| 打包下载 | JSZip（按需动态加载） |
| 测试 | Vitest |
| 部署 | GitHub Pages + GitHub Actions |

## 项目结构

```
pic-shrink/
├── index.html                # 页面结构
├── src/
│   ├── main.js               # 入口：装配 store 与各 UI 模块
│   ├── config.js             # 常量、默认设置与预设
│   ├── store.js              # 应用状态管理
│   ├── pipeline.js           # Worker 池与任务调度
│   ├── compression.js        # 压缩/转换核心（Worker 内运行）
│   ├── worker.js             # Worker 入口
│   ├── ui/                   # 界面模块（上传区、设置面板、列表、统计、操作栏）
│   └── utils/                # 纯函数工具（字节、文件名、几何、质量搜索等）
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

1. 拖入 / 选择 / 粘贴图片，支持多选
2. 在「转换设置」中调整格式、压缩方式、尺寸、旋转等
3. 每张卡片显示原大小、新大小、尺寸与格式；按住预览图可对比原图
4. 单张下载，或「下载全部（ZIP）」一键打包
5. 修改设置后点击「按新设置重新转换全部」批量重压

> 转 JPEG 时透明区域会使用设置的背景色填充；GIF 在「保持原格式」下不重编码、保留动画。

## 常见问题

**图片会传到服务器吗？**
不会。所有处理都在浏览器本地完成，代码完全开源可审计，断网也能使用。

**支持哪些输入格式？**
JPG / PNG / WebP / GIF / BMP / AVIF / SVG（取决于浏览器解码能力）。

**目标大小压缩对 PNG 有效吗？**
PNG 是无损格式，无法通过质量参数压缩；目标大小策略仅对 JPEG / WebP / AVIF 生效。

## 路线图

- [ ] PWA 离线安装
- [ ] 自定义区域裁剪与更多尺寸预设
- [ ] 文字水印
- [ ] 多语言界面
- [ ] 扫描件增强（灰度、去阴影）

## License

[MIT](LICENSE) © yushi250412015
