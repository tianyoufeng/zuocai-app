/* ============================================================
   screens/records.js — 记录页（收藏 + 下厨历史）
   收藏数据在 IndexedDB，异步 hydrate。
   ============================================================ */
(function () {
  'use strict';

  function render(st) {
    const list = st.history.slice().reverse();
    return `<section class="screen" data-screen="records">
    <div class="content">
      <div class="page-title">记录</div>

      <div class="sec-head">
        <div class="sec-title">我的收藏</div>
        <div class="sec-note"><span id="fav-count">…</span> 道</div>
      </div>
      <div id="fav-strip"><div class="recent__empty">收藏加载中…</div></div>

      <div class="sec-head">
        <div class="sec-title">下厨历史</div>
        <div class="sec-note">共 ${list.length} 次</div>
      </div>
      ${list.length
        ? `<div class="list">${list.map(h => {
            const d = DATA.summary(h.id);
            if (!d) return '';
            const dd = RANDOM.daysSince(h.at);
            return `<button class="hrow" data-open="${d.id}">
              ${UI.thumb(d, 'hrow__thumb')}
              <div class="hrow__col">
                <div class="hrow__n">${UI.esc(d.name)}</div>
                <div class="hrow__m">${dd === 0 ? '今天' : dd + ' 天前'} · ${d.time} 分钟</div>
              </div>
              ${ICONS.ICON.chevron(ICONS.colors())}
            </button>`;
          }).join('')}</div>`
        : `<div class="recent__empty">还没有下厨记录。回首页抽一道开做吧。</div>`}

      <button class="btn btn--ghost btn--lg" data-clear-history="1">
        ${ICONS.ICON.trash(ICONS.colors())}<span>清空下厨历史</span>
      </button>
    </div>
    ${UI.tabBar('records')}
  </section>`;
  }

  function hydrate(st) {
    const strip = document.getElementById('fav-strip');
    const count = document.getElementById('fav-count');
    if (!strip && !count) return Promise.resolve();
    return DB.favList().then(favs => {
      st.favs = favs.map(f => f.id);
      if (count) count.textContent = String(favs.length);
      if (!strip) return;
      strip.innerHTML = favs.length
        ? `<div class="strip">${favs.map(f => {
            const d = DATA.summary(f.id);
            return d ? `<div class="strip__item" data-open="${d.id}">
              ${UI.thumb(d, 'strip__thumb')}<div class="strip__name">${UI.esc(d.name)}</div>
            </div>` : '';
          }).join('')}</div>`
        : `<div class="recent__empty">还没有收藏。在详情页点星标，就会出现在这里。</div>`;
    });
  }

  window.SCREENS = window.SCREENS || {};
  window.SCREENS.records = { render, hydrate };
})();
