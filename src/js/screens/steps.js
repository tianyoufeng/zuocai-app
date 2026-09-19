/* ============================================================
   screens/steps.js — 开始做菜（一页到底）
   v3.0：进入即整页铺开全部步骤与细节，无需逐步点「下一步」；
        顶部粘性进度随滚动推进并显示「第 N 步 / 共 M 步」，
        底部一键「做完收工」记入下厨记录。
   ============================================================ */
(function () {
  'use strict';

  /* 备料清单（一页到底时方便边做边对照） */
  function ingBrief(ings, serve) {
    if (!ings || !ings.length) return '';
    return `<div class="ing-brief__head">备料 · ${serve} 人份</div>
      <div class="ing-brief__list">${ings.map(([n, v]) => `<span class="ing-brief__item">
        ${UI.esc(n)} <b>${UI.esc(RANDOM.scaledAmount(v, serve))}</b></span>`).join('')}</div>`;
  }

  function render(st) {
    const c = ICONS.colors();
    const item = DATA.summary(st.current);
    if (!item) return `<section class="screen" data-screen="steps">
      <div class="content"><div class="empty">数据加载中。</div></div></section>`;
    const serve = SCREENS.detail.curServe(st, item.id);
    const fav = st.favs.includes(item.id);

    return `<section class="screen" data-screen="steps">
    <div class="content content--plain" id="cook-scroll">
      <div class="nav">
        <button class="icon-btn" data-back="1">${ICONS.ICON.back(null, c)}</button>
        <div class="page-title">${UI.esc(item.name)}</div>
        <button class="icon-btn" data-share="1">${ICONS.ICON.share(c)}</button>
      </div>

      <div class="cook-head">
        <div class="cook-head__t">开始做菜</div>
        <div class="cook-head__m">${item.time} 分钟 · ${item.diff} · ${serve} 人份 · 约 ${item.kcal} 千卡</div>
        <div class="cook-head__n">全部步骤都在这一页，从上往下做就行。</div>
      </div>

      <div class="stepbar">
        <div class="stepbar__track"><div class="stepbar__fill" id="stepbar-fill" style="width:0%"></div></div>
        <div class="stepbar__label" id="stepbar-label">步骤加载中…</div>
      </div>

      <div class="ing-brief" id="ing-brief"></div>
      <div class="cook-tips" id="cook-tips"></div>

      <div class="sec-head">
        <div class="sec-title">烹饪步骤</div>
        <div class="sec-note">共 <span id="step-total">-</span> 步</div>
      </div>

      <div class="steps steps--full" id="steps-list">
        <div class="empty">步骤加载中…</div>
      </div>

      <div class="cook-foot">照这个做，大约 ${item.time} 分钟就能上桌。</div>
    </div>
    <div class="bottom">
      <div class="bottom__row">
        <button class="btn btn--ghost" style="flex:0 0 3.5rem;padding:0" data-fav="${item.id}">
          ${ICONS.ICON.star(c.ink, fav ? c.brand : 'none', c)}
        </button>
        <button class="btn btn--primary" style="flex:1 1 auto" data-finish="1">
          ${ICONS.ICON.check('#FFFFFF', c)}<span>做完收工 · 记入记录</span>
        </button>
      </div>
    </div>
  </section>`;
  }

  function stepListHtml(steps) {
    return steps.map((s, n) => `<div class="step">
      <div class="step__no">${n + 1}</div>
      <div class="step__col">
        <div class="step__t">${UI.esc(s.t)}</div>
        <div class="step__d">${UI.esc(s.d)}</div>
      </div>
    </div>`).join('');
  }

  /* 滚动进度：填充条 + 「第 N 步 / 共 M 步」随滚动更新 */
  function bindScroll(total) {
    const sc = document.getElementById('cook-scroll');
    const fill = document.getElementById('stepbar-fill');
    const label = document.getElementById('stepbar-label');
    if (!sc) return;
    const list = document.getElementById('steps-list');
    const nodes = list ? list.querySelectorAll('.step') : [];

    const onScroll = () => {
      const max = sc.scrollHeight - sc.clientHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, sc.scrollTop / max)) : 1;
      if (fill) fill.style.width = Math.round(p * 100) + '%';
      if (label) {
        let cur = 1;
        const scTop = sc.getBoundingClientRect().top;
        const line = sc.clientHeight * 0.5;
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].getBoundingClientRect().top - scTop <= line) cur = i + 1;
        }
        /* 滚到底一定落在最后一步（内容短的菜谱也能走完） */
        if (p >= 0.985) cur = total;
        label.textContent = `第 ${cur} 步 / 共 ${total} 步`;
      }
    };
    sc.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function hydrate(st) {
    const list = document.getElementById('steps-list');
    if (!list) return Promise.resolve();
    return DATA.get(st.current).then(r => {
      if (!list.isConnected) return;
      if (!r || !r.steps || !r.steps.length) {
        list.innerHTML = '<div class="empty">暂无步骤数据</div>';
        return;
      }
      st.recipeSteps = r.steps;
      st.step = 0;
      list.innerHTML = stepListHtml(r.steps);

      const total = document.getElementById('step-total');
      if (total) total.textContent = String(r.steps.length);

      const brief = document.getElementById('ing-brief');
      if (brief) brief.innerHTML = ingBrief(r.ings, SCREENS.detail.curServe(st, st.current));

      /* v3.1：下锅前先看这几条（选购数据懒加载，晚到就晚填） */
      const pre = document.getElementById('cook-tips');
      if (pre) {
        DATA.picksOf(st.current).then(p => {
          if (!pre.isConnected || !p || !p.tips || !p.tips.length) return;
          pre.innerHTML = '<div class="cook-tips__head">下锅前先看这几条</div>' +
            p.tips.map(t => `<div class="cook-tips__item">${UI.esc(t)}</div>`).join('');
        });
      }

      bindScroll(r.steps.length);
    });
  }

  window.SCREENS = window.SCREENS || {};
  window.SCREENS.steps = { render, hydrate };
})();
