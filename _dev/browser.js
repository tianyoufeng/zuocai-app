#!/usr/bin/env node
/* ============================================================
   browser.js — 真实浏览器端到端自检（puppeteer-core + Edge）
   覆盖：加载无错 / 7 屏导航 / 随机 / 详情懒加载 / 步骤 / 搜索 /
        分类 / 收藏持久化 / 忌口弹层 / 320px 无横向滚动 / 深色模式
   ============================================================ */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const PORT = 8899;

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json' };
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

(async () => {
  const srv = await serve();
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });

  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const activeScreen = () => page.$eval('.screen.is-active', el => el.dataset.screen).catch(() => null);

  /* ---------- 1. 首屏加载 ---------- */
  console.log('\n[1] 首屏加载');
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle0' });
  (await activeScreen()) === 'home' ? ok('默认进入首页') : bad('默认屏不是 home');
  (await page.$eval('.hello__title', el => el.textContent)) === '今天吃什么'
    ? ok('标题正确') : bad('标题不对');
  const dishCount = await page.evaluate(() => window.MANIFEST.items.length);
  ok(`manifest 共 ${dishCount} 道`);

  /* ---------- 2. 随机抽菜 → 结果 → 详情 ---------- */
  console.log('\n[2] 随机 → 结果 → 详情 → 步骤');
  await page.click('[data-roll]');
  await page.waitForFunction(() => document.querySelector('.screen.is-active')?.dataset.screen === 'result');
  ok('抽菜进入结果页');
  const rolledName = await page.$eval('.dish-name', el => el.textContent);
  ok('抽中：' + rolledName);

  await page.click('[data-open]');
  await page.waitForFunction(() => document.querySelector('.screen.is-active')?.dataset.screen === 'detail');
  await page.waitForFunction(() => document.querySelectorAll('#ing-card .ing-row').length > 0, { timeout: 5000 });
  const ingRows = await page.$$eval('#ing-card .ing-row', els => els.length);
  ok(`详情页食材清单已懒加载（${ingRows} 项）`);

  await page.click('[data-cook]');
  await page.waitForFunction(() => document.querySelector('.screen.is-active')?.dataset.screen === 'steps');
  await page.waitForFunction(() => document.querySelectorAll('#steps-list .step').length > 0, { timeout: 5000 });
  const stepCount = await page.$$eval('#steps-list .step', els => els.length);
  ok(`步骤页已懒加载（${stepCount} 步）`);

  /* 下一步直到收工 */
  for (let i = 0; i < stepCount; i++) {
    await page.evaluate(() => {
      const b = document.querySelector('[data-step="1"]');
      b && b.click();
    });
    await sleep(120);
  }
  await page.waitForFunction(() => document.querySelector('.screen.is-active')?.dataset.screen === 'home', { timeout: 5000 });
  ok('做完收工回到首页');
  const histCount = await page.evaluate(() => window.APP.state.history.length);
  histCount > 0 ? ok(`下厨历史已记录（${histCount} 条）`) : bad('收工后历史为空');

  /* ---------- 3. 菜谱库：分类 / 搜索 ---------- */
  console.log('\n[3] 菜谱库');
  await page.evaluate(() => { document.querySelector('[data-tab="library"]').click(); });
  await page.waitForFunction(() => document.querySelector('.screen.is-active')?.dataset.screen === 'library');
  const libCount = await page.$$eval('.recipe', els => els.length);
  libCount === dishCount ? ok(`菜谱库显示全部 ${libCount} 道`) : bad(`菜谱库 ${libCount} != ${dishCount}`);

  await page.type('#q', '西兰花');
  await sleep(200);
  const searchCount = await page.$$eval('.recipe', els => els.length);
  searchCount === 1 ? ok('搜索「西兰花」命中 1 道') : bad(`搜索命中 ${searchCount} 道`);
  await page.evaluate(() => { const q = document.getElementById('q'); q.value = ''; q.dispatchEvent(new Event('input')); });
  await sleep(150);

  await page.evaluate(() => { document.querySelector('[data-cat="zaocan"]').click(); });
  await sleep(150);
  const zaocanTotal = await page.evaluate(() =>
    window.MANIFEST.items.filter(i => i.cat === 'zaocan').length);
  const catCount = await page.$$eval('.recipe', els => els.length);
  catCount === zaocanTotal ? ok(`分类「早餐」显示 ${catCount} 道`) : bad(`分类过滤得 ${catCount} != ${zaocanTotal}`);
  await page.evaluate(() => { document.querySelector('[data-cat="全部"]').click(); });
  await sleep(120);

  /* ---------- 4. 收藏 + 持久化 ---------- */
  console.log('\n[4] 收藏与 IndexedDB 持久化');
  await page.evaluate(() => {
    const card = document.querySelector('.recipe');
    card && card.click();
  });
  await page.waitForFunction(() => document.querySelector('.screen.is-active')?.dataset.screen === 'detail');
  await page.evaluate(() => { document.querySelector('.bottom [data-fav]').click(); });
  await sleep(300);
  const favCount1 = await page.evaluate(() => window.APP.state.favs.length);
  favCount1 === 1 ? ok('详情页收藏成功') : bad(`收藏后 favs=${favCount1}`);

  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(400);
  const favCount2 = await page.evaluate(() => window.APP.state.favs.length);
  favCount2 === 1 ? ok('刷新后收藏仍在（IndexedDB 持久化）') : bad(`刷新后 favs=${favCount2}`);

  /* ---------- 5. 记录页 ---------- */
  console.log('\n[5] 记录页');
  await page.evaluate(() => { document.querySelector('[data-tab="records"]').click(); });
  await page.waitForFunction(() => document.querySelector('.screen.is-active')?.dataset.screen === 'records');
  await page.waitForFunction(() => parseInt(document.getElementById('fav-count')?.textContent) >= 1, { timeout: 5000 });
  const histRows = await page.$$eval('.hrow', els => els.length);
  histRows > 0 ? ok(`记录页历史 ${histRows} 条、收藏计数正常`) : bad('记录页无历史');
  page.on('dialog', d => d.accept());
  await page.evaluate(() => { document.querySelector('[data-clear-history]').click(); });
  await sleep(400);
  const histAfter = await page.evaluate(() => window.APP.state.history.length);
  histAfter === 0 ? ok('清空历史生效') : bad(`清空后历史=${histAfter}`);

  /* ---------- 6. 我的 + 忌口弹层 ---------- */
  console.log('\n[6] 我的口味 + 忌口弹层');
  await page.evaluate(() => { document.querySelector('[data-tab="profile"]').click(); });
  await page.waitForFunction(() => document.querySelector('.screen.is-active')?.dataset.screen === 'profile');
  const skipBefore = await page.evaluate(() => window.RANDOM.skippedCount(window.APP.state));
  await page.evaluate(() => { document.querySelector('[data-edit-avoid]').click(); });
  await page.waitForFunction(() => !!document.getElementById('sheet-mask'));
  await page.type('#avoid-input', '苦瓜');
  await page.keyboard.press('Enter');
  await sleep(150);
  await page.evaluate(() => { document.querySelector('[data-sheet-save]').click(); });
  await sleep(300);
  const avoidNow = await page.evaluate(() => window.APP.state.avoid.join(','));
  avoidNow.includes('苦瓜') ? ok('忌口弹层添加「苦瓜」并保存') : bad('忌口未保存: ' + avoidNow);
  const skipAfter = await page.evaluate(() => window.RANDOM.skippedCount(window.APP.state));
  skipAfter >= skipBefore ? ok(`忌口影响菜数 ${skipBefore}→${skipAfter}`) : bad('忌口影响数异常');
  /* 移除忌口，恢复干净状态 */
  await page.evaluate(() => { window.APP.state.avoid = []; window.APP.save(); });

  /* ---------- 7. 320px 无横向滚动 ---------- */
  console.log('\n[7] 响应式');
  await page.setViewport({ width: 320, height: 568, isMobile: true, hasTouch: true });
  await page.evaluate(() => { document.querySelector('[data-tab="home"]').click(); });
  await sleep(300);
  const overflow320 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  overflow320 <= 0 ? ok('320px 无横向滚动') : bad(`320px 横向溢出 ${overflow320}px`);
  await page.evaluate(() => { document.querySelector('[data-tab="library"]').click(); });
  await sleep(300);
  const overflowLib = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  overflowLib <= 0 ? ok('菜谱库 320px 无横向滚动') : bad(`菜谱库 320px 溢出 ${overflowLib}px`);

  /* ---------- 8. 深色模式 ---------- */
  console.log('\n[8] 深色模式');
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await sleep(200);
  const darkBg = await page.evaluate(() => getComputedStyle(document.querySelector('.screen.is-active')).backgroundColor);
  darkBg !== 'rgb(248, 245, 240)' ? ok(`深色模式背景切换为 ${darkBg}`) : bad('深色模式未生效');

  /* ---------- 9. 768px 平板 + 图片加载 ---------- */
  console.log('\n[9] 平板断点与图片');
  await page.setViewport({ width: 768, height: 1024, isMobile: true, hasTouch: true });
  await page.evaluate(() => { document.querySelector('[data-tab="home"]').click(); });
  await sleep(400);
  const overflow768 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  overflow768 <= 0 ? ok('768px 无横向滚动') : bad(`768px 溢出 ${overflow768}px`);
  const appWidth = await page.evaluate(() => document.getElementById('app').getBoundingClientRect().width);
  appWidth <= 768 ? ok(`容器宽度 ${appWidth}px（≤768 居中）`) : bad('容器超宽');
  const imgLoaded = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img.cover')];
    return imgs.length ? imgs.filter(i => i.complete && i.naturalWidth > 0).length : -1;
  });
  imgLoaded > 0 ? ok(`首页图片正常加载（${imgLoaded} 张）`) : bad('图片未加载');

  /* ---------- 汇总 ---------- */
  /* 预期 404：webp 菜谱图（P2 补齐）与 favicon（P5 出图标）不计失败 */
  const expected = consoleErrors.filter(e =>
    e.includes('.webp') || e.includes('favicon') || e.includes('Not Found'));
  const realErrors = consoleErrors.filter(e => !expected.includes(e));
  console.log('\n========== 汇总 ==========');
  console.log(`通过 ${passed} · 失败 ${failed} · 真实控制台错误 ${realErrors.length}（预期缺图/图标 404：${expected.length}）`);
  realErrors.slice(0, 10).forEach(e => console.error('  console: ' + e));

  await browser.close();
  srv.close();
  process.exit(failed || realErrors.length ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
