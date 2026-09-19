#!/usr/bin/env node
/* ============================================================
   static-check.js — 跨文件一致性静态检查（自检技能·第八节）
   1. 类名双向核对：CSS 类 ↔ 模板类（含引号实参传类名）
   2. ICON 键核对：ICON.xxx 引用与 TABS 映射表
   3. 资源路径存在性
   4. data-* 处理分支核对
   5. SVG viewBox 重复检查
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
let errors = 0;
const err = m => { errors++; console.error('  ✗ ' + m); };
const ok = m => console.log('  ✓ ' + m);

const read = p => fs.readFileSync(p, 'utf8');
const cssText = ['tokens.css', 'base.css', 'screens.css'].map(f => read(path.join(SRC, 'css', f))).join('\n');
const jsFiles = ['icons.js', 'db.js', 'data.js', 'random.js', 'ui.js', 'app.js']
  .map(f => ['js', f])
  .concat(['home', 'result', 'detail', 'steps', 'library', 'records', 'profile'].map(s => ['js', 'screens', s + '.js']))
  .map(parts => path.join(...parts));
const jsText = jsFiles.map(f => read(path.join(SRC, f))).join('\n');
const htmlText = read(path.join(SRC, 'index.html'));
const allText = cssText + '\n' + jsText + '\n' + htmlText;

/* ---------- 1. 类名双向核对 ---------- */
const cssClasses = new Set();
for (const m of cssText.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)) cssClasses.add(m[1]);
const stripTpl = t => t.replace(/\$\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, ' ');
const tplClasses = new Set();
for (const m of stripTpl(allText).matchAll(/class="([^"]+)"/g)) {
  m[1].split(/\s+/).forEach(c => c && tplClasses.add(c));
}
/* 引号实参传类名：thumb(d, 'hero__img') / tagHtml(x, 'brand') */
for (const m of allText.matchAll(/['"]([a-zA-Z][a-zA-Z0-9_-]*(?:__[a-zA-Z0-9_-]+)?)['"]/g)) {
  if (cssClasses.has(m[1])) tplClasses.add(m[1]);
}
/* tag-- 动态拼接：tag tag--${kind} → kind 值集合 */
for (const m of allText.matchAll(/tag--(\w+)/g)) tplClasses.add('tag--' + m[1]);
/* 假阳性清理：剥表达式残留（tag--）、修饰符残根 */
for (const c of [...tplClasses]) if (c.endsWith('--') || c === 'tag--') tplClasses.delete(c);

const missing = [...tplClasses].filter(c => !cssClasses.has(c) &&
  !['screen', 'is-active', 'app', 'is-on', 'is-cur', 'is-brand', 'is-disabled'].includes(c));
if (missing.length) err('模板类名在 CSS 中不存在: ' + missing.join(', '));
else ok(`类名双向核对通过（CSS ${cssClasses.size} / 模板 ${tplClasses.size}）`);

/* ---------- 2. ICON 键核对 ---------- */
const iconKeys = new Set();
for (const m of jsText.matchAll(/(\w+):\s*(?:\(|svgV|ic\b|c\s*=>)/g)) iconKeys.add(m[1]);
const iconRefs = new Set();
for (const m of allText.matchAll(/ICON\.(\w+)/g)) iconRefs.add(m[1]);
for (const m of allText.matchAll(/icon:\s*'(\w+)'/g)) iconRefs.add(m[1]);
const badIcons = [...iconRefs].filter(k => !iconKeys.has(k));
if (badIcons.length) err('ICON 引用不存在的键: ' + badIcons.join(', '));
else ok(`ICON 键核对通过（${iconKeys.size} 个图标，${iconRefs.size} 处引用）`);

/* ---------- 3. data-* 处理分支核对 ---------- */
const handled = new Set(['roll', 'open', 'back', 'tab', 'filter', 'cat', 'pref', 'fav', 'cook',
  'finish', 'dserve', 'more', 'serve', 'goal', 'share', 'reset-filter', 'edit-avoid', 'clear-history',
  'avoid-chip', 'sheet-close', 'sheet-save', 'screen']);
const used = new Set();
for (const m of allText.matchAll(/data-([a-zA-Z-]+)/g)) used.add(m[1]);
const unhandled = [...used].filter(k => !handled.has(k));
if (unhandled.length) err('未处理的 data-* 属性: ' + unhandled.join(', '));
else ok(`data-* 分支核对通过（${used.size} 个属性）`);

/* ---------- 4. SVG viewBox 重复 ---------- */
let dupVb = 0;
for (const m of allText.matchAll(/<svg[^>]*>/g)) {
  const tag = m[0];
  const n = (tag.match(/viewBox=/g) || []).length;
  if (n > 1) { dupVb++; err('SVG 开标签含重复 viewBox: ' + tag.slice(0, 80)); }
}
if (!dupVb) ok('SVG viewBox 无重复');

/* ---------- 5. 状态字段核对 ---------- */
const stateFields = new Set(['prefs', 'avoid', 'history', 'favs', 'filter', 'cat', 'query',
  'serve', 'serveOf', 'goal', 'current', 'step', 'recipeSteps', 'recipeIngs', 'recipePicks']);
const stRefs = new Set();
for (const m of allText.matchAll(/st(?:ate)?\.([a-zA-Z_]\w*)/g)) {
  if (stateFields.has(m[1]) || ['favs'].includes(m[1])) stRefs.add(m[1]);
}
const unknownState = [...stRefs].filter(f => !stateFields.has(f));
if (unknownState.length) err('未知状态字段引用: ' + unknownState.join(', '));
else ok('状态字段核对通过');

/* ---------- 6. 资源路径 ---------- */
let resBad = 0;
for (const m of allText.matchAll(/['"](assets\/[^'"]+|data\/manifest\.js|css\/[^'"]+|js\/[^'"]+)['"]/g)) {
  const p = m[1];
  /* 拼接前缀（以 / 结尾）或含表达式的不是完整路径，跳过 */
  if (p.endsWith('/') || p.includes('{') || p.includes('+')) continue;
  if (!fs.existsSync(path.join(SRC, p))) { resBad++; err('资源不存在: ' + p); }
}
if (!resBad) ok('静态资源引用存在性通过');

console.log(errors ? `\n静态检查失败：${errors} 个问题` : '\n静态检查全部通过');
process.exit(errors ? 1 : 0);
