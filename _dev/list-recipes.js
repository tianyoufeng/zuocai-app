#!/usr/bin/env node
/* ============================================================
   list-recipes.js — 导出全部菜谱清单（扩容时用来避免重复 / 核对配比）
   用法：node _dev/list-recipes.js [--ids] [--tags]
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'src', 'data');
const CATS = ['jiachangcai', 'tanggeng', 'zhushi', 'liangcai', 'zaocan', 'yexiao'];

const onlyIds = process.argv.includes('--ids');
const showTags = process.argv.includes('--tags');

const byCat = {};
const tagCount = {};
let total = 0;

for (const cat of CATS) {
  const fp = path.join(DATA_DIR, cat + '.js');
  if (!fs.existsSync(fp)) continue;
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(fp, 'utf8'), sandbox, { filename: cat + '.js' });
  const list = (sandbox.window.RECIPES || {})[cat] || [];
  byCat[cat] = list;
  total += list.length;
  for (const r of list) for (const t of (r.tags || [])) tagCount[t] = (tagCount[t] || 0) + 1;
}

console.log(`合计 ${total} 道`);
for (const cat of CATS) {
  const list = byCat[cat] || [];
  console.log(`\n### ${cat} (${list.length})`);
  if (onlyIds) console.log(list.map(r => r.id).join(' '));
  else console.log(list.map(r => `${r.id}=${r.name}${showTags ? '[' + r.tags.join('/') + ']' : ''}`).join('\n'));
}
if (showTags) {
  console.log('\n### tags');
  console.log(Object.entries(tagCount).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join('  '));
}
process.exit(0);
