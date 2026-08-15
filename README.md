# 🗜️ 轻图 · Pic Shrink

**本地图片压缩 / 格式转换 / 尺寸缩放工具箱** —— 图片**永不上传服务器**，全部在你的浏览器里完成。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Deploy to Pages](https://github.com/yushi250412015/pic-shrink/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/yushi250412015/pic-shrink/actions/workflows/deploy-pages.yml)

🔗 在线使用：<https://yushi250412015.github.io/pic-shrink/>

> A privacy-first image compression toolbox that runs 100% locally in your browser.
> Batch compress, resize, and convert between JPG / PNG / WebP — nothing is ever uploaded.

## ✨ 功能特性

- 🖼️ **批量压缩**：拖入 / 粘贴 / 选择多张图片，逐张显示「压缩后大小 + 节省比例」
- 🎚️ **质量调节**：JPEG / WebP 质量 10%–100%，改完设置一键重新压缩
- 📐 **尺寸缩放**：不缩放 / 最长边限制（像素）/ 按百分比
- 🔁 **格式转换**：保持原格式 / JPEG / PNG / WebP（GIF 保持原样，动画不丢失）
- 📦 **一键打包**：全部结果打包成 ZIP 下载（同名文件自动加序号去重）
- 🔍 **按住对比**：卡片预览图上按住即可对比原图与压缩效果
- 🔒 **隐私优先**：Canvas + OffscreenCanvas + Web Worker 全本地处理，零上传、零后端、断网可用
- 🌓 深色模式自动适配

## ❓ 为什么值得用

市面上的在线压缩工具会把图片上传到服务器，照片内容有泄露风险；本项目完全在本地浏览器中处理，速度更快、隐私更安全，代码完全开源可审计。

## 🚀 快速开始

```bash
npm install      # 安装依赖
npm run dev      # 本地开发（http://localhost:5173）
npm test         # 运行单元测试
npm run build    # 构建产物到 dist/
npm run preview  # 本地预览构建产物
```

## 🛠 技术栈

| 层 | 选型 |
|---|---|
| 构建工具 | Vite |
| 语言 | 原生 JavaScript（ES Modules，无框架，容易阅读） |
| 图像处理 | `createImageBitmap` + `OffscreenCanvas`（跑在 Web Worker 里，不卡界面） |
| 打包下载 | JSZip |
| 测试 | Vitest |
| 部署 | GitHub Pages（GitHub Actions 推送到 `main` 自动构建部署） |

## 📁 项目结构

```
pic-shrink/
├── index.html                  # 页面结构
├── src/
│   ├── main.js                 # UI 逻辑：拖拽、Worker 池调度、卡片渲染、统计与下载
│   ├── worker.js               # Web Worker 入口
│   ├── compress.js             # 核心压缩逻辑（在 Worker 中运行）
│   ├── format.js               # 纯函数工具（字节格式化、换算、命名）
│   └── style.css               # 样式（含深色模式与响应式）
├── test/
│   └── format.test.js          # 单元测试
├── .github/workflows/
│   └── deploy-pages.yml        # 推送到 main 自动部署 GitHub Pages
└── LICENSE                     # MIT
```

## 📖 使用说明

1. 打开页面，拖入图片（或点击选择 / 直接 Ctrl+V 粘贴），支持批量
2. 在上方「压缩设置」中调整输出格式、质量与尺寸
3. 每张图片卡片会显示原大小、新大小、节省比例；按住预览图可对比原图
4. 单张下载，或点击「全部下载（ZIP）」一键打包
5. 修改设置后点击「按新设置重新压缩全部」即可批量重压

> 提示：转 JPEG 时透明区域会自动填充白色；GIF 在「保持原格式」下不会被重编码（保留动画）。

## 📤 部署到 GitHub Pages（免费）

仓库已内置 GitHub Actions 工作流（`.github/workflows/deploy-pages.yml`），推送后自动完成「安装依赖 → 跑测试 → 构建 → 部署」：

1. 把代码推到 GitHub 上的仓库
2. 打开仓库 **Settings → Pages**，把 **Build and deployment → Source** 改成 **GitHub Actions**
3. 首次推送会自动触发构建；也可以在 **Actions** 页手动点 **Run workflow** 重跑
4. 部署完成后即可访问 `https://<你的用户名>.github.io/pic-shrink/`

> 由于 `vite.config.js` 中设置了 `base: './'`，构建产物使用相对路径，部署到任何子路径都不会资源 404。

## 🗺️ Roadmap

- [ ] PWA：可安装到桌面 / 手机，完全离线使用
- [ ] 输出 AVIF 格式
- [ ] 图片裁剪与旋转
- [ ] 批量重命名规则
- [ ] 英文界面（i18n）
- [ ] 扫描件增强（灰度、去阴影）

## 🤝 参与贡献

这是我作为大二学生用 AI 辅助编程（vibe coding）完成的学习项目，欢迎任何形式的贡献：提 Issue、发 PR，或者只是点一个 Star ⭐ 都很有帮助。

## 📄 License

[MIT](LICENSE) © yushi250412015
