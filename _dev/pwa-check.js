#!/usr/bin/env node
/* ============================================================
   pwa-check.js — PWA / 离线能力自检（puppeteer-core + Edge）
   覆盖：manifest 合法 / SW 注册 / 核心资源入缓存 /
         图片渐进预热 / 断网后仍能打开与浏览
   用法：NODE_PATH=<puppeteer-core 所在 node_modules> node _dev/pwa-check.js
   ============================================================ */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const PORT = 8897;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.json': 'application/json'
};

function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const fp = path.join(SRC, p);
      if (!fp.startsWith(SRC) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
        res.writeHead(404); res.end('nf'); return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
      res.end(fs.readFileSync(fp));
    });
    srv.listen(PORT, '127.0.0.1', () => resolve(srv));
  });
}

let passed = 0, failed = 0;
const ok = m => { passed++; console.log('  ✓ ' + m); };
const bad = m => { failed++; console.error('  ✗ ' + m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const srv = await serve();
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));

  /* 先真正打开页面（否则页面在 about:blank，相对路径 fetch 会失败） */
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await sleep(900);

  /* ---------- 1. manifest ---------- */
  console.log('\n[1] manifest 与图标');
  const mf = await page.evaluate(async () => {
    const r = await fetch('manifest.webmanifest');
    return { ok: r.ok, type: r.headers.get('content-type') || '', body: await r.json() };
  }).catch(() => null);
  if (!mf || !mf.ok) { bad('manifest 取不到'); }
  else {
    mf.body.name === '今天吃什么' ? ok(`manifest 名称：${mf.body.name}`) : bad('manifest 名称不对');
    mf.body.display === 'standalone' ? ok('display = standalone（全屏无地址栏）') : bad('display 不是 standalone');
    mf.body.start_url && mf.body.scope ? ok(`start_url=${mf.body.start_url} scope=${mf.body.scope}`) : bad('缺 start_url/scope');
    (mf.body.icons || []).length >= 2 ? ok(`声明 ${mf.body.icons.length} 个图标`) : bad('图标声明不足');
  }
  const iconOk = await page.evaluate(async () => {
    const list = ['assets/icons/icon-180.png', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png'];
    const out = [];
    for (const u of list) { const r = await fetch(u); out.push(r.ok); }
    return out;
  });
  iconOk.every(Boolean) ? ok('图标文件（180/192/512）都能取到') : bad('有图标文件缺失：' + JSON.stringify(iconOk));

  /* ---------- 2. Service Worker 注册 ---------- */
  console.log('\n[2] Service Worker');
  let reg = null;
  try {
    reg = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return { supported: false };
      const r = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 15000))
      ]);
      return { supported: true, scope: r.scope, active: !!r.active, state: r.active && r.active.state };
    });
  } catch (e) { reg = { supported: true, error: String(e.message) }; }
  if (!reg || !reg.supported) bad('浏览器不支持 Service Worker');
  else if (reg.error) bad('SW 未在 15s 内就绪：' + reg.error);
  else {
    ok(`SW 已激活（scope ${reg.scope.replace(`http://127.0.0.1:${PORT}`, '')}，state=${reg.state}）`);
  }

  /* ---------- 3. 核心资源入缓存 ---------- */
  console.log('\n[3] 缓存');
  await sleep(1500);
  const cacheInfo = await page.evaluate(async () => {
    const out = {};
    for (const k of await caches.keys()) {
      out[k] = (await (await caches.open(k)).keys()).length;
    }
    return out;
  });
  const coreCache = Object.entries(cacheInfo).find(([k]) => !k.endsWith('-img'));
  if (coreCache && coreCache[1] >= 25) ok(`核心资源已缓存 ${coreCache[1]} 个（${coreCache[0]}）`);
  else bad('核心资源缓存不足：' + JSON.stringify(cacheInfo));

  const coreHit = await page.evaluate(async () => {
    const names = ['css/screens.css', 'js/app.js', 'data/manifest.js', 'index.html', 'assets/icons/icon-180.png'];
    const out = [];
    for (const n of names) out.push(!!(await caches.match(n)));
    return out;
  });
  coreHit.every(Boolean) ? ok('抽查 5 个核心文件都在缓存里') : bad('有核心文件没进缓存：' + JSON.stringify(coreHit));

  /* ---------- 4. 图片渐进预热 ---------- */
  console.log('\n[4] 图片预热（后台分批，最多等 25 秒）');
  let imgCached = 0;
  for (let i = 0; i < 10; i++) {
    await sleep(2500);
    imgCached = await page.evaluate(async () => {
      const key = (await caches.keys()).find(k => k.endsWith('-img'));
      if (!key) return 0;
      return (await (await caches.open(key)).keys()).length;
    });
    if (imgCached >= 40) break;
  }
  imgCached > 0 ? ok(`菜谱图已预热 ${imgCached} 张（后台继续）`) : bad('图片预热没有启动');

  /* ---------- 5. 断网后仍可用 ---------- */
  console.log('\n[5] 断网可用性');
  await page.setOfflineMode(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(1200);

  const offline = await page.evaluate(() => ({
    dishes: (window.MANIFEST && window.MANIFEST.items.length) || 0,
    screen: (document.querySelector('.screen.is-active') || {}).dataset
      ? document.querySelector('.screen.is-active').dataset.screen : null,
    title: (document.querySelector('.hello__title') || {}).textContent || ''
  }));
  offline.dishes === 500 ? ok(`断网后仍载入 ${offline.dishes} 道菜谱`) : bad(`断网后 manifest 只有 ${offline.dishes} 道`);
  offline.screen === 'home' ? ok('断网后首页正常渲染') : bad('断网后首页异常：' + offline.screen);

  /* 断网下抽菜 → 详情，看已缓存的图能否显示 */
  await page.click('[data-roll]');
  await sleep(800);
  const rolled = await page.evaluate(() => {
    const img = document.querySelector('.result__img img');
    return { has: !!img, loaded: img ? (img.complete && img.naturalWidth > 0) : false };
  });
  if (rolled.has) {
    rolled.loaded ? ok('断网下结果页图片正常显示（命中缓存）') : bad('断网下结果页图片没显示');
  } else {
    ok('断网下结果页无图容器（该菜图片可能尚未预热，属正常）');
  }

  /* ---------- 汇总 ---------- */
  console.log('\n========== 汇总 ==========');
  console.log(`通过 ${passed} · 失败 ${failed} · 页面错误 ${errors.length}`);
  errors.slice(0, 5).forEach(e => console.error('  ' + e));

  await browser.close();
  srv.close();
  process.exit(failed || errors.length ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
