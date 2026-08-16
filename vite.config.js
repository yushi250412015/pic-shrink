import { defineConfig } from 'vite';

// base: './' 让构建产物使用相对路径，
// 这样 dist/ 可以部署到任意子路径（例如 GitHub Pages 的 https://用户名.github.io/pic-shrink/）
export default defineConfig({
  base: './',
  worker: {
    // 模块 Worker（type: 'module'）使用 ES 格式，支持在 Worker 内做动态 import
    // （HEIC 解码、PNG 无损优化等按需分包，避免把大依赖常驻进 Worker）
    format: 'es',
  },
});
