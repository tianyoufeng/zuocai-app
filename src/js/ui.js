/* ============================================================
   ui.js — 公共渲染片段与工具（esc / 缩略图 / 标签 / Tab 栏）
   ============================================================ */
(function () {
  'use strict';

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                           .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* 缩略图：固定比例容器 + object-fit:cover；缺图降级暖色渐变占位 */
  function thumb(item, cls) {
    const img = DATA.imgOf(item.id);
    return img
      ? `<div class="${cls}"><img class="cover" src="${img}" alt="${esc(item.name)}" loading="lazy"
           onerror="this.parentNode.classList.add('thumb-ph');this.remove()"></div>`
      : `<div class="${cls} thumb-ph"></div>`;
  }

  function tagHtml(text, kind) {
    return `<span class="tag tag--${kind}">${esc(text)}</span>`;
  }

  /* 标签语义色：清淡/素食/低脂 → 绿；下饭/硬菜/辣 → 橙；其余 → 暖灰 */
  function tagKind(t) {
    if (['清淡', '素食', '低脂', '少油'].includes(t)) return 'sage';
    if (['下饭', '硬菜', '重口', '辣', '暖胃'].includes(t)) return 'brand';
    return 'warm';
  }
  function tagsHtml(item, max) {
    const ts = (max ? item.tags.slice(0, max) : item.tags);
    return ts.map(t => tagHtml(t, tagKind(t))).join('');
  }

  const TABS = [
    { id: 'home',    label: '首页', icon: 'tabHome' },
    { id: 'library', label: '菜谱', icon: 'tabBook' },
    { id: 'records', label: '记录', icon: 'tabClock' },
    { id: 'profile', label: '我的', icon: 'tabUser' }
  ];

  function tabBar(active) {
    const c = ICONS.colors();
    return `<nav class="tabbar"><div class="tabbar__pill">
      ${TABS.map(t => `<button class="tab ${t.id === active ? 'is-active' : ''}" data-tab="${t.id}">
        ${ICONS.ICON[t.icon](t.id === active ? c.bg : c.mut)}<span>${t.label}</span></button>`).join('')}
    </div></nav>`;
  }

  function dateLine() {
    const D = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const n = new Date();
    return `${D[n.getDay()]} · ${n.getMonth() + 1} 月 ${n.getDate()} 日`;
  }

  function metaOf(item, serve) {
    return `${item.time} 分钟 · ${item.diff} · 约 ${item.kcal} 千卡 · ${serve || 2} 人份`;
  }

  /* 分类 chip 条（菜谱库用：全部 + 6 大分类） */
  function catChips(active) {
    const cats = [RANDOM.CATS_ALL].concat(DATA.categories().map(c => c.key));
    return cats.map(key => {
      const label = key === RANDOM.CATS_ALL ? '全部' : DATA.catLabel(key);
      return `<button class="chip ${active === key ? 'is-on' : ''}" data-cat="${key}">${label}</button>`;
    }).join('');
  }

  /* 标签筛选 chip 条（首页 / 菜谱库复用） */
  function tagChips(active) {
    return RANDOM.TAG_FILTERS.map(f =>
      `<button class="chip ${active === f ? 'is-on' : ''}" data-filter="${f}">${f}</button>`).join('');
  }

  window.UI = { esc, thumb, tagHtml, tagKind, tagsHtml, tabBar, dateLine, metaOf,
                catChips, tagChips, TABS };
})();
