/* ============================================================
   screens/library.js — 菜谱库（搜索 + 分类条 + 标签条 + 双列网格）
   搜索基于 manifest 摘要（菜名 + 食材名），输入只软刷新网格。
   ============================================================ */
(function () {
  'use strict';

  function filtered(st) {
    const q = (st.query || '').trim();
    return RANDOM.pool(st).filter(d => {
      if (st.cat && st.cat !== '全部' && d.cat !== st.cat) return false;
      if (!q) return true;
      return d.name.indexOf(q) !== -1 || d.ings.some(n => n.indexOf(q) !== -1);
    });
  }

  function gridHtml(list) {
    return list.length
      ? `<div class="grid">${list.map(d => `<article class="recipe" data-open="${d.id}">
          ${UI.thumb(d, 'recipe__img')}
          <div class="recipe__body">
            <div class="recipe__name">${UI.esc(d.name)}</div>
            <div class="recipe__meta">${d.time} 分钟 · ${d.diff}</div>
          </div>
        </article>`).join('')}</div>`
      : `<div class="empty">没有符合条件的菜谱。<br>换个关键词，或把筛选和忌口放宽一点。</div>`;
  }

  function render(st) {
    const c = ICONS.colors();
    const list = filtered(st);
    const total = RANDOM.pool(st, true).length;
    return `<section class="screen" data-screen="library">
    <div class="content">
      <div class="nav">
        <div class="page-title">菜谱库</div>
        <div class="sec-note">共 ${total} 道</div>
        <button class="icon-btn" data-reset-filter="1">${ICONS.ICON.filter(c)}</button>
      </div>

      <label class="search">
        ${ICONS.ICON.search(c)}
        <input type="search" id="q" placeholder="搜索菜名或食材，比如「土豆」" value="${UI.esc(st.query)}">
      </label>

      <div class="chips">${UI.catChips(st.cat)}</div>
      <div class="chips">${UI.tagChips(st.filter)}</div>

      <div id="lib-result">${gridHtml(list)}</div>
    </div>
    ${UI.tabBar('library')}
  </section>`;
  }

  function softRefresh(st) {
    const wrap = document.getElementById('lib-result');
    if (wrap) wrap.innerHTML = gridHtml(filtered(st));
  }

  function afterRender(st) {
    const q = document.getElementById('q');
    if (q) q.addEventListener('input', e => {
      st.query = e.target.value;
      APP.save();
      softRefresh(st);
    });
  }

  window.SCREENS = window.SCREENS || {};
  window.SCREENS.library = { render, afterRender, softRefresh };
})();
