/* ============================================================
   screens/result.js — 今日盲盒（随机结果）
   ============================================================ */
(function () {
  'use strict';

  function render(st) {
    const c = ICONS.colors();
    const item = DATA.summary(st.current);
    if (!item) return `<section class="screen" data-screen="result">
      <div class="content"><div class="empty">数据加载中，请返回首页重试。</div></div>${UI.tabBar('home')}</section>`;

    return `<section class="screen" data-screen="result">
    <div class="content content--plain">
      <div class="nav">
        <button class="icon-btn" data-back="1">${ICONS.ICON.back(null, c)}</button>
        <div class="page-title">今日盲盒</div>
        <button class="icon-btn" data-fav="${item.id}">
          ${ICONS.ICON.heart(c.ink, st.favs.includes(item.id) ? c.brand : 'none', c)}
        </button>
      </div>

      ${UI.thumb(item, 'result__img')}

      <div class="name-block">
        <div class="dish-name">${UI.esc(item.name)}</div>
        <div class="dish-sub">这次抽到它了 —— ${item.time} 分钟端上桌。</div>
      </div>

      <div class="meta-card">
        ${[[`${item.time} 分钟`, '耗时'],
           [item.diff, '难度'],
           [`${item.kcal} 千卡`, '热量'],
           [`${SCREENS.detail.curServe(st, item.id)} 人份`, '份量']]
          .map(([v, l]) => `<div class="meta-card__col">
            <div class="meta-card__v">${v}</div><div class="meta-card__l">${l}</div></div>`).join('')}
      </div>

      <div class="reason">${ICONS.ICON.spark(c)}<div class="reason__text">为什么抽到它：${RANDOM.reasonFor(item, st)}</div></div>
    </div>
    <div class="bottom">
      <div class="bottom__row">
        <button class="btn btn--ghost btn--w128" data-roll="1">${ICONS.ICON.refresh(c)}<span>换一道</span></button>
        <button class="btn btn--primary" style="flex:1 1 auto" data-open="${item.id}">
          ${ICONS.ICON.list(c)}<span>就它了 · 看做法</span>
        </button>
      </div>
    </div>
  </section>`;
  }

  window.SCREENS = window.SCREENS || {};
  window.SCREENS.result = { render };
})();
