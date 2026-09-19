/* ============================================================
   screens/detail.js — 菜品详情（食材清单 + 份数换算 + 收藏）
   完整做法（steps）按分类懒加载；加载完成前按钮显示加载态。
   ============================================================ */
(function () {
  'use strict';

  function render(st) {
    const c = ICONS.colors();
    const item = DATA.summary(st.current);
    if (!item) return `<section class="screen" data-screen="detail">
      <div class="content"><div class="empty">数据加载中，请返回重试。</div></div></section>`;

    const fav = st.favs.includes(item.id);
    return `<section class="screen" data-screen="detail">
    <div class="content content--plain">
      <div class="nav">
        <button class="icon-btn" data-back="1">${ICONS.ICON.back(null, c)}</button>
        <div class="page-title">菜品详情</div>
        <button class="icon-btn" data-fav="${item.id}">
          ${ICONS.ICON.star(c.ink, fav ? c.brand : 'none', c)}
        </button>
      </div>

      ${UI.thumb(item, 'detail__img')}

      <div class="name-block">
        <div class="dish-name dish-name--sm">${UI.esc(item.name)}</div>
        <div class="meta-line">${UI.metaOf(item, st.serve)}</div>
        <div class="tags">${UI.tagsHtml(item)}</div>
      </div>

      <div class="sec-head">
        <div class="sec-title">食材配料</div>
        <div class="sec-note">${st.serve} 人份 · 按现有库存调整</div>
      </div>
      <div class="ing-card" id="ing-card">
        <div class="ing-row"><div class="ing-row__n">食材加载中…</div></div>
      </div>
    </div>
    <div class="bottom">
      <div class="bottom__row">
        <button class="btn btn--ghost" style="flex:0 0 3.5rem;padding:0" data-fav="${item.id}">
          ${ICONS.ICON.star(c.ink, fav ? c.brand : 'none', c)}
        </button>
        <button class="btn btn--primary" style="flex:1 1 auto" data-cook="1">
          ${ICONS.ICON.timer(c)}<span>开始做菜 · ${item.time} 分钟计时</span>
        </button>
      </div>
    </div>
  </section>`;
  }

  /* 详情页异步部分：食材清单（需要完整数据里的用量） */
  function hydrate(st) {
    const card = document.getElementById('ing-card');
    if (!card) return Promise.resolve();
    return DATA.get(st.current).then(r => {
      if (!card.isConnected) return;
      if (!r) { card.innerHTML = '<div class="ing-row"><div class="ing-row__n">暂无食材数据</div></div>'; return; }
      card.innerHTML = r.ings.map(([n, v]) => `<div class="ing-row">
        <div class="ing-row__n">${UI.esc(n)}</div>
        <div class="ing-row__v">${UI.esc(RANDOM.scaledAmount(v, st.serve))}</div>
      </div>`).join('');
    });
  }

  window.SCREENS = window.SCREENS || {};
  window.SCREENS.detail = { render, hydrate };
})();
