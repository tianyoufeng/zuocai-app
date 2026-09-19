/* ============================================================
   sw.js — Service Worker（PWA 离线支持）
   策略：
     · install  → 预缓存核心资源（HTML/CSS/JS/数据索引/图标，约 1MB）
     · activate → 清掉旧版本缓存，然后**后台渐进预缓存 500 张菜谱图**
                  （分批拉，不阻塞首屏；用户第一次打开后放一会儿就全离线可用了）
     · fetch    → cache-first，miss 才走网络并顺手写入缓存
   菜谱图列表从 data/manifest.js 的 items 推导，不用手工维护。
   ⚠️ 只在 http(s) 下注册；APK 内的 WebView 壳（app.local）不注册。
   ============================================================ */
'use strict';

const VERSION = '3.0.0';
const CACHE = 'chishenme-' + VERSION;
const IMG_CACHE = CACHE + '-img';

const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/tokens.css',
  './css/base.css',
  './css/screens.css',
  './js/icons.js',
  './js/db.js',
  './js/data.js',
  './js/random.js',
  './js/ui.js',
  './js/screens/home.js',
  './js/screens/result.js',
  './js/screens/detail.js',
  './js/screens/steps.js',
  './js/screens/library.js',
  './js/screens/records.js',
  './js/screens/profile.js',
  './js/app.js',
  './data/manifest.js',
  './data/jiachangcai.js',
  './data/tanggeng.js',
  './data/zhushi.js',
  './data/liangcai.js',
  './data/zaocan.js',
  './data/yexiao.js',
  './assets/icons/icon-180.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

/* manifest.js 挂在 window 上，SW 里用 self 顶替一下再 importScripts */
self.window = self;
try {
  importScripts('./data/manifest.js');
} catch (e) { /* 拿不到就只缓存核心，图片走按需缓存 */ }

function imageList() {
  const items = (self.MANIFEST && self.MANIFEST.items) || [];
  return items.map(it => './assets/images/' + it.cat + '/' + it.id + '.webp');
}

/* ---------- install：核心资源 ---------- */
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(CORE.map(url => cache.add(url).catch(() => {})));
    self.skipWaiting();
  })());
});

/* ---------- activate：清旧缓存 + 后台预热图片 ---------- */
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k !== CACHE && k !== IMG_CACHE).map(k => caches.delete(k))
    );
    await self.clients.claim();
    prefetchImages();          /* 故意不 await：后台慢慢来，不挡首屏 */
  })());
});

async function prefetchImages() {
  const list = imageList();
  if (!list.length) return;
  const cache = await caches.open(IMG_CACHE);
  const BATCH = 6;
  for (let i = 0; i < list.length; i += BATCH) {
    await Promise.all(list.slice(i, i + BATCH).map(async url => {
      try {
        if (await cache.match(url)) return;
        const res = await fetch(url);
        if (res && res.ok) await cache.put(url, res);
      } catch (e) { /* 单张失败不影响整体 */ }
    }));
  }
  const clients = await self.clients.matchAll();
  clients.forEach(c => c.postMessage({ type: 'images-prefetched', total: list.length }));
}

/* ---------- fetch：cache-first ---------- */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isImage = url.pathname.indexOf('/assets/images/') !== -1;

  event.respondWith((async () => {
    const cache = await caches.open(isImage ? IMG_CACHE : CACHE);

    const hit = await cache.match(req, { ignoreSearch: false });
    if (hit) return hit;

    try {
      const res = await fetch(req);
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    } catch (err) {
      /* 离线且没缓存：导航请求兜底回首页 */
      if (req.mode === 'navigate') {
        const shell = await caches.match('./index.html');
        if (shell) return shell;
      }
      throw err;
    }
  })());
});

/* 允许页面主动触发一次预热（比如用户点了「离线可用」提示） */
self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type === 'prefetch-images') prefetchImages();
});
