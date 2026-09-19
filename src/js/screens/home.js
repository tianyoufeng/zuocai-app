/* ============================================================
   screens/home.js — 首页（今天吃什么）
   ============================================================ */
(function () {
  'use strict';

  function heroDish(st) {
    for (let i = st.history.length - 1; i >= 0; i--) {
      const s = DATA.summary(st.history[i].id);
      if (s) return s;
    }
    return DATA.allItems()[0] || null;
  }

  function recentDishes(st, limit) {
    const out = [];
    for (let i = st.history.length - 1; i >= 0 && out.length < limit; i--) {
      const s = DATA.summary(st.history[i].id);
      if (s && !out.some(x => x.id === s.id)) out.push(s);
    }
    return out;
  }

  function render(st) {
    const c = ICONS.colors();
    const h = heroDish(st);
    const rec = recentDishes(st, 6);
    const total = DATA.allItems().length;

    return `<section class="screen" data-screen="home">
    <div class="content content--home">
      <div class="hello">
        <div class="hello__col">
          <div class="hello__date">${UI.dateLine()}</div>
          <div class="hello__title">今天吃什么</div>
        </div>
        <div class="avatar">${ICONS.ICON.chef(null, c)}</div>
      </div>

      ${h ? `<article class="hero" data-open="${h.id}">
        ${UI.thumb(h, 'hero__img')}
        <div class="hero__body">
          <div class="hero__row">
            <div class="hero__name">${UI.esc(h.name)}</div>
            <div class="hero__time">${h.time} 分钟</div>
          </div>
          <div class="tags">
            ${UI.tagHtml(DATA.catLabel(h.cat), 'brand')}
            ${h.time <= 20 ? UI.tagHtml('20 分钟快手', 'sage') : ''}
            ${UI.tagHtml(`约 ${h.kcal} 千卡`, 'warm')}
          </div>
          <div class="hero__hint">共 ${total} 道菜谱，等你翻牌</div>
        </div>
      </article>` : `<div class="empty">菜谱库加载中…</div>`}

      <button class="btn btn--primary btn--lg" data-roll="1">
        ${ICONS.ICON.dice('#FFFFFF')}<span>随机抽一道菜</span>
      </button>

      <div class="chips">${UI.tagChips(st.filter)}</div>

      <div class="recent">
        <div class="sec-head">
          <div class="sec-title">最近吃过</div>
          <button class="row" data-tab="records" style="width:auto"><span class="sec-note">全部记录</span></button>
        </div>
        ${rec.length
          ? `<div class="strip">${rec.map(s => `<div class="strip__item" data-open="${s.id}">
              ${UI.thumb(s, 'strip__thumb')}
              <div class="strip__name">${UI.esc(s.name)}</div>
            </div>`).join('')}</div>`
          : `<div class="recent__empty">还没有下厨记录，点上面那颗骰子抽一道试试。</div>`}
      </div>
    </div>
    ${UI.tabBar('home')}
  </section>`;
  }

  window.SCREENS = window.SCREENS || {};
  window.SCREENS.home = { render };
})();
