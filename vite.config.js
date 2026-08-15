import { defineConfig } from 'vite';

// base: './' 让构建产物使用相对路径，
// 这样 dist/ 可以部署到任意子路径（例如 GitHub Pages 的 https://用户名.github.io/pic-shrink/）
export default defineConfig({
  base: './',
});
