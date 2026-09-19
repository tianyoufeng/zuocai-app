#!/usr/bin/env node
/* ============================================================
   missing-images.js — 统计缺图菜谱，输出 _dev/missing-images.json
   用途：生图（ImageGen）时按清单逐道生成，生成后 compress_images 入库。
   用法：node _dev/missing-images.js
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'src', 'data');
const IMG = path.join(ROOT, 'src', 'assets', 'images');
const CATS = ['jiachangcai', 'tanggeng', 'zhushi', 'liangcai', 'zaocan', 'yexiao', 'yuecai', 'chuancai', 'xiangcai'];

const out = [];
const byCat = {};
let have = 0, total = 0;

for (const cat of CATS) {
  const sb = { window: {} };
  vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(DATA, cat + '.js'), 'utf8'), sb);
  const list = (sb.window.RECIPES || {})[cat] || [];
  let miss = 0;
  for (const r of list) {
    total++;
    if (fs.existsSync(path.join(IMG, cat, r.id + '.webp'))) { have++; continue; }
    miss++;
    out.push({
      id: r.id, name: r.name, cat,
      main: r.ings.slice(0, 5).map(i => i[0]).join('、'),
      tags: r.tags
    });
  }
  byCat[cat] = { total: list.length, missing: miss };
}

fs.writeFileSync(path.join(ROOT, '_dev', 'missing-images.json'),
  JSON.stringify(out, null, 1), 'utf8');

console.log(`菜谱合计 ${total} 道 · 有图 ${have} 道 · 缺图 ${out.length} 道`);
Object.keys(byCat).forEach(k => console.log(`  ${k}: ${byCat[k].missing}/${byCat[k].total} 缺`));
console.log('清单已写入 _dev/missing-images.json');
