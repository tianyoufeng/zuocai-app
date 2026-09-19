#!/usr/bin/env node
/* ============================================================
   validate-data.js — 数据与资源完整性校验
   检查：schema 字段完整 / id 唯一 / 分类一致 / 步骤与食材非空 /
        图片文件存在（有图字段才查）/ manifest 与分类文件同步
   用法：node tools/validate-data.js [--allow-missing-images]
   退出码：0 通过；1 有问题
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'src', 'data');
const IMG_DIR = path.join(ROOT, 'src', 'assets', 'images');
const allowMissing = process.argv.includes('--allow-missing-images');

const CATS = ['jiachangcai', 'tanggeng', 'zhushi', 'liangcai', 'zaocan', 'yexiao'];
const DIFFS = ['简单', '中等', '进阶'];

function loadCat(key) {
  const fp = path.join(DATA_DIR, key + '.js');
  if (!fs.existsSync(fp)) return null;
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(fp, 'utf8'), sandbox, { filename: key + '.js' });
  return (sandbox.window.RECIPES || {})[key] || [];
}

let errors = 0;
const err = m => { errors++; console.error('  ✗ ' + m); };
const ok = m => console.log('  ✓ ' + m);
const seenId = new Set(), seenName = new Set();
let total = 0, withImg = 0;

for (const cat of CATS) {
  const list = loadCat(cat);
  if (list === null) { err(`缺少分类文件 data/${cat}.js`); continue; }
  ok(`${cat}: ${list.length} 道`);
  for (const r of list) {
    total++;
    const at = `${cat}/${r.id}`;
    if (!r.id || /[^a-z0-9-]/.test(r.id)) err(`${at} id 缺失或含非 ASCII 小写字符`);
    if (seenId.has(r.id)) err(`${at} id 重复`);
    if (seenName.has(r.name)) err(`${at} 菜名重复: ${r.name}`);
    seenId.add(r.id); seenName.add(r.name);
    if (r.cat !== cat) err(`${at} cat 字段(${r.cat})与所在文件不符`);
    if (!r.name) err(`${at} 缺 name`);
    if (!(Number.isFinite(r.time) && r.time > 0 && r.time <= 480)) err(`${at} time 异常: ${r.time}`);
    if (!DIFFS.includes(r.diff)) err(`${at} diff 异常: ${r.diff}`);
    if (!(Number.isFinite(r.kcal) && r.kcal > 0 && r.kcal < 3000)) err(`${at} kcal 异常: ${r.kcal}`);
    if (!Array.isArray(r.tags) || !r.tags.length) err(`${at} 缺 tags`);
    if (!Array.isArray(r.ings) || r.ings.length < 2) err(`${at} 食材少于 2 项`);
    else r.ings.forEach((i, n) => { if (!Array.isArray(i) || !i[0] || !i[1]) err(`${at} 第 ${n + 1} 项食材格式错误`); });
    if (!Array.isArray(r.steps) || r.steps.length < 2) err(`${at} 步骤少于 2 步`);
    else r.steps.forEach((s, n) => { if (!s || !s.t || !s.d) err(`${at} 第 ${n + 1} 步缺标题或描述`); });
    /* 图片按约定存在性检查 */
    const img = path.join(IMG_DIR, cat, r.id + '.webp');
    if (fs.existsSync(img)) withImg++;
    else if (!allowMissing) err(`缺少图片: assets/images/${cat}/${r.id}.webp`);
  }
}

/* manifest 同步检查 */
const mfp = path.join(DATA_DIR, 'manifest.js');
if (!fs.existsSync(mfp)) { err('缺少 data/manifest.js（先跑 tools/gen-manifest.js）'); }
else {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(mfp, 'utf8'), sandbox);
  const items = (sandbox.window.MANIFEST || {}).items || [];
  if (items.length !== total) err(`manifest 条目(${items.length}) 与分类文件(${total}) 不一致`);
  const mids = new Set(items.map(i => i.id));
  for (const id of seenId) if (!mids.has(id)) err(`manifest 缺少: ${id}`);
}

console.log(`\n合计 ${total} 道 · 有图 ${withImg} 道 · ${errors ? `发现 ${errors} 个问题` : '校验通过'}`);
process.exit(errors ? 1 : 0);
