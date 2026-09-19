/* ============================================================
   data.js — 数据加载层
   manifest.js（<script> 静态引入）提供 window.MANIFEST：
     { version, categories: [{key, label}], items: [摘要...] }
   摘要条目：{ id, name, cat, time, diff, kcal, tags, ings:[食材名...] }
   完整菜谱按分类懒加载：data/{cat}.js → window.RECIPES[cat] = [...]
   完整条目：{ id, name, cat, time, diff, kcal, tags, ings:[[名,用量]...], steps:[...] }
   图片路径按约定推导：assets/images/{cat}/{id}.webp（不占数据字段）
   ============================================================ */
(function () {
  'use strict';

  const RECIPES = window.RECIPES = window.RECIPES || {};
  const pending = {};

  const CAT_LABEL = {};
  (window.MANIFEST.categories || []).forEach(c => { CAT_LABEL[c.key] = c.label; });

  /* 动态注入 <script>（file:// / APK / http 三环境通用） */
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('load fail: ' + src));
      document.head.appendChild(s);
    });
  }

  /* 确保某分类的完整数据已加载（幂等，返回 Promise） */
  function ensureCat(cat) {
    if (RECIPES[cat]) return Promise.resolve(RECIPES[cat]);
    if (!pending[cat]) {
      pending[cat] = loadScript('data/' + cat + '.js')
        .then(() => {
          if (!RECIPES[cat]) RECIPES[cat] = [];
          return RECIPES[cat];
        })
        .catch(() => { RECIPES[cat] = RECIPES[cat] || []; return RECIPES[cat]; });
    }
    return pending[cat];
  }

  /* 选购与新手提示（v3.1）：data/pick-{cat}.js → window.PICKS[cat] = { 菜谱id: {pick, tips} } */
  const PICKS = window.PICKS = window.PICKS || {};
  const pendingPick = {};

  function ensurePicks(cat) {
    if (PICKS[cat]) return Promise.resolve(PICKS[cat]);
    if (!pendingPick[cat]) {
      pendingPick[cat] = loadScript('data/pick-' + cat + '.js')
        .then(() => { if (!PICKS[cat]) PICKS[cat] = {}; return PICKS[cat]; })
        .catch(() => { PICKS[cat] = PICKS[cat] || {}; return PICKS[cat]; });
    }
    return pendingPick[cat];
  }

  /* 取某道菜的选购要点与新手提示（懒加载对应分类） */
  function picksOf(id) {
    const s = INDEX[id];
    if (!s) return Promise.resolve(null);
    return ensurePicks(s.cat).then(m => m[id] || null);
  }

  /* 从摘要定位分类 */
  const INDEX = {};
  (window.MANIFEST.items || []).forEach(it => { INDEX[it.id] = it; });

  function summary(id) { return INDEX[id] || null; }

  /* 取完整菜谱（按需加载分类后返回；找不到返回 null） */
  function get(id) {
    const s = INDEX[id];
    if (!s) return Promise.resolve(null);
    return ensureCat(s.cat).then(list => list.find(r => r.id === id) || null);
  }

  /* 图片路径推导；缺图由渲染层降级占位 */
  function imgOf(id) {
    const s = INDEX[id];
    return s ? 'assets/images/' + s.cat + '/' + s.id + '.webp' : '';
  }

  function catLabel(key) { return CAT_LABEL[key] || key; }
  function allItems() { return window.MANIFEST.items || []; }
  function categories() { return window.MANIFEST.categories || []; }

  window.DATA = { ensureCat, get, summary, imgOf, catLabel, allItems, categories, ensurePicks, picksOf };
})();
