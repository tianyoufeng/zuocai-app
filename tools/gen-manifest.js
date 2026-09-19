#!/usr/bin/env node
/* ============================================================
   gen-manifest.js — 从 data/{cat}.js 生成 data/manifest.js
   分类文件是唯一数据源；manifest 是搜索/列表用的摘要索引。
   用法：node tools/gen-manifest.js  （在仓库根执行）
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'src', 'data');

const CATS = [
  { key: 'jiachangcai', label: '家常菜' },
  { key: 'tanggeng',    label: '汤羹' },
  { key: 'zhushi',      label: '主食' },
  { key: 'liangcai',    label: '凉菜' },
  { key: 'zaocan',      label: '早餐' },
  { key: 'yexiao',      label: '夜宵' },
  { key: 'yuecai',      label: '粤菜' },
  { key: 'chuancai',    label: '川菜' },
  { key: 'xiangcai',    label: '湘菜' }
];

function loadCat(file) {
  const code = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: file });
  return sandbox.window.RECIPES || {};
}

const items = [];
const seen = new Set();
const dupName = new Set();
const problems = [];

for (const cat of CATS) {
  const file = cat.key + '.js';
  const fp = path.join(DATA_DIR, file);
  if (!fs.existsSync(fp)) { problems.push(`缺少分类文件: ${file}`); continue; }
  const recipes = loadCat(file)[cat.key] || [];
  for (const r of recipes) {
    if (seen.has(r.id)) problems.push(`重复 id: ${r.id}`);
    if (dupName.has(r.name)) problems.push(`重复菜名: ${r.name}(${r.id})`);
    if (r.cat !== cat.key) problems.push(`分类不一致: ${r.id} 声明 ${r.cat} 但在 ${cat.key}`);
    seen.add(r.id);
    dupName.add(r.name);
    items.push({
      id: r.id, name: r.name, cat: r.cat, time: r.time, diff: r.diff,
      kcal: r.kcal, tags: r.tags, ings: r.ings.map(i => i[0])
    });
  }
}

const manifest = { version: new Date().toISOString().slice(0, 10).replace(/-/g, ''), categories: CATS, items };
const out = '/* 自动生成：tools/gen-manifest.js —— 请勿手改，改 data/{cat}.js 后重新生成 */\n' +
  'window.MANIFEST = ' + JSON.stringify(manifest, null, 0) + ';\n';
fs.writeFileSync(path.join(DATA_DIR, 'manifest.js'), out, 'utf8');

console.log(`manifest 已生成：${items.length} 道菜`);
if (problems.length) {
  console.error('发现问题：');
  problems.forEach(p => console.error('  - ' + p));
  process.exit(1);
}
