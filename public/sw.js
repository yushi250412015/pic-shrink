// Service Worker：安装时缓存核心入口，运行时对同源 GET 做 stale-while-revalidate。
// Vite 产物带 hash 文件名，这里用「先返回缓存、后台更新」的通用实现，离线可用且不阻塞首屏。
const CACHE_NAME = 'pic-shrink-v1';
const CORE_ASSETS = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => {
        // 缓存部分失败不阻塞安装（例如离线首次安装）
      }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached || Response.error());
      // 有缓存先返回缓存（后台刷新），无缓存等网络并把结果写回
      return cached || network;
    }),
  );
});
