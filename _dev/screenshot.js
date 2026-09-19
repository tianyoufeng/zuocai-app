#!/usr/bin/env node
/* ============================================================
   screenshot.js — 截取关键屏，用于人工验收视觉效果
   产物：_dev/shots/*.png
   用法：NODE_PATH=<puppeteer-core 所在 node_modules> node _dev/screenshot.js
   ============================================================ */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, '_dev', 'shots');
const PORT = 8898;

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json'
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

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle0' });
  await sleep(700);

  const shot = async name => {
    await page.screenshot({ path: path.join(OUT, name) });
    console.log('  ✓ ' + name);
  };

  console.log('截图中…');
  await shot('1-home.png');

  /* 菜谱库 */
  await page.evaluate(() => { document.querySelector('[data-tab="library"]').click(); });
  await sleep(900);
  await shot('2-library.png');

  /* 详情页（找一道有图的菜） */
  await page.evaluate(() => { document.querySelector('.recipe').click(); });
  await page.waitForFunction(() => document.querySelector('.screen.is-active')?.dataset.screen === 'detail');
  await page.waitForFunction(() => document.querySelectorAll('#ing-card .ing-row').length > 1, { timeout: 8000 });
  await sleep(600);
  await shot('3-detail.png');

  /* 滚到底看「新手小技巧」卡片 */
  await page.evaluate(() => {
    const c = document.querySelector('.screen.is-active .content');
    if (c) c.scrollTop = c.scrollHeight;
  });
  await sleep(500);
  await shot('3b-detail-tips.png');

  /* 份量 4 人份的样子 */
  await page.click('[data-dserve="1"]');
  await sleep(300);
  await page.click('[data-dserve="1"]');
  await sleep(500);
  await shot('4-detail-serve4.png');

  /* 做菜页（一页到底） */
  await page.click('[data-cook]');
  await page.waitForFunction(() => document.querySelectorAll('#steps-list .step').length > 0, { timeout: 8000 });
  await sleep(600);
  await shot('5-cook-top.png');
  await page.evaluate(() => { const s = document.getElementById('cook-scroll'); s.scrollTop = s.scrollHeight * 0.45; });
  await sleep(500);
  await shot('6-cook-mid.png');

  /* 记录页 + 我的（厨师头像）——做菜页与详情页没有 tabbar，先退两层 */
  await page.evaluate(() => { document.querySelector('[data-back]').click(); });
  await sleep(400);
  await page.evaluate(() => { document.querySelector('[data-back]').click(); });
  await sleep(400);
  await page.evaluate(() => { document.querySelector('[data-tab="records"]').click(); });
  await sleep(700);
  await shot('7-records.png');
  await page.evaluate(() => { document.querySelector('[data-tab="profile"]').click(); });
  await sleep(700);
  await shot('8-profile.png');

  /* 深色模式：我的 + 做菜页 */
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await sleep(400);
  await shot('9-profile-dark.png');

  await browser.close();
  srv.close();
  console.log('完成，产物在 _dev/shots/');
})().catch(e => { console.error('FATAL', e); process.exit(2); });
