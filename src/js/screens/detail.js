/* ============================================================
   screens/detail.js — 菜品详情（食材清单 + 份量步进 + 收藏）
   v3.0：默认份量可在本页直接调整（1~8 人份），按菜单独记忆并写入 prefs；
        调整时只重绘「摘要行 + 份量控件 + 食材区」，不打断滚动位置。
   完整做法（steps）仍按分类懒加载。
   ============================================================ */
(function () {
  'use strict';

  const MIN_SERVE = 1;
  const MAX_SERVE = 8;

  function clampServe(v) {
    const n = Math.round(Number(v));
    return (n >= MIN_SERVE && n <= MAX_SERVE) ? n : RANDOM.BASE_SERVE;
  }

  /* 当前份量：这道菜单独设过就用它，否则用「我的」页的全局默认份量 */
  function curServe(st, id) {
    const v = (st.serveOf || {})[id || st.current];
    return v ? clampServe(v) : clampServe(st.serve);
  }

  /* 份量步进器（- N 人份 +） */
  function servCtl(serve, c) {
    return `<div class="serv" id="serv-ctl">
      <button class="serv__btn ${serve <= MIN_SERVE ? 'is-off' : ''}" data-dserve="-1"
        aria-label="减少份量">${ICONS.ICON.minus(c.brandDeep, c)}</button>
      <div class="serv__v"><span id="serv-num">${serve}</span> 人份</div>
      <button class="serv__btn ${serve >= MAX_SERVE ? 'is-off' : ''}" data-dserve="1"
        aria-label="增加份量">${ICONS.ICON.plusLine(c.brandDeep, c)}</button>
    </div>`;
  }

  function ingHtml(r, serve) {
    if (!r || !r.ings || !r.ings.length) {
      return '<div class="ing-row"><div class="ing-row__n">暂无食材数据</div></div>';
    }
    return r.ings.map(([n, v]) => `<div class="ing-row">
      <div class="ing-row__n">${UI.esc(n)}</div>
      <div class="ing-row__v">${UI.esc(RANDOM.scaledAmount(v, serve))}</div>
    </div>`).join('');
  }

  function render(st) {
    const c = ICONS.colors();
    const item = DATA.summary(st.current);
    if (!item) return `<section class="screen" data-screen="detail">
      <div class="content"><div class="empty">数据加载中，请返回重试。</div></div></section>`;

    const fav = st.favs.includes(item.id);
    const serve = curServe(st, item.id);
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
        <div class="meta-line" id="meta-line">${UI.metaOf(item, serve)}</div>
        <div class="tags">${UI.tagsHtml(item)}</div>
      </div>

      <div class="sec-head">
        <div class="sec-title">食材配料</div>
        ${servCtl(serve, c)}
      </div>
      <div class="serv__hint">按人数调整份量，用量自动换算，只记在这道菜上</div>
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
          ${ICONS.ICON.timer(c)}<span>开始做菜 · ${item.time} 分钟</span>
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
      st.recipeIngs = (r && r.ings) ? r.ings : null;
      card.innerHTML = ingHtml(r, curServe(st, st.current));
    });
  }

  /* 只刷新跟份量有关的 DOM，整页不重绘（保留滚动位置与图片） */
  function applyServe(st) {
    const serve = curServe(st);
    const item = DATA.summary(st.current);

    const ctl = document.getElementById('serv-ctl');
    if (ctl) ctl.outerHTML = servCtl(serve, ICONS.colors());

    const meta = document.getElementById('meta-line');
    if (meta && item) meta.textContent = UI.metaOf(item, serve);

    const card = document.getElementById('ing-card');
    if (card && st.recipeIngs) card.innerHTML = ingHtml({ ings: st.recipeIngs }, serve);
  }

  window.SCREENS = window.SCREENS || {};
  window.SCREENS.detail = {
    render, hydrate, applyServe, curServe,
    MIN_SERVE, MAX_SERVE
  };
})();
