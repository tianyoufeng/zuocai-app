/* ============================================================
   screens/steps.js — 烹饪步骤（进度 + 上一步/下一步，无步骤图）
   ============================================================ */
(function () {
  'use strict';

  function render(st) {
    const c = ICONS.colors();
    const item = DATA.summary(st.current);
    if (!item) return `<section class="screen" data-screen="steps">
      <div class="content"><div class="empty">数据加载中。</div></div></section>`;
    const steps = st.recipeSteps || [];
    const i = Math.min(Math.max(st.step, 0), Math.max(steps.length - 1, 0));
    const pct = steps.length ? Math.round((i + 1) / steps.length * 100) : 0;
    const last = steps.length && i === steps.length - 1;

    return `<section class="screen" data-screen="steps">
    <div class="content content--plain">
      <div class="nav">
        <button class="icon-btn" data-back="1">${ICONS.ICON.back(null, c)}</button>
        <div class="page-title">${UI.esc(item.name)} · 做法</div>
        <button class="icon-btn" data-share="1">${ICONS.ICON.share(c)}</button>
      </div>

      <div class="progress">
        <div class="progress__label">第 ${steps.length ? i + 1 : '-'} 步 / 共 ${steps.length} 步</div>
        <div class="progress__track"><div class="progress__fill" style="width:${pct}%"></div></div>
      </div>

      <div class="sec-head">
        <div class="sec-title">烹饪步骤</div>
        <div class="sec-note">共 ${steps.length} 步 · 约 ${item.time} 分钟</div>
      </div>

      <div class="steps" id="steps-list">${steps.length ? '' :
        '<div class="empty">步骤加载中…</div>'}</div>
    </div>
    <div class="bottom">
      <div class="bottom__row">
        <button class="btn btn--ghost btn--w128 ${i === 0 ? 'is-disabled' : ''}" data-step="-1">
          ${ICONS.ICON.arrowLeft(null, c)}<span>上一步</span>
        </button>
        <button class="btn btn--primary" style="flex:1 1 auto" data-step="1">
          ${ICONS.ICON.arrowRight(null, c)}
          <span>${last ? '做完收工' : (steps[i + 1] ? '下一步' : '请稍候')}</span>
        </button>
      </div>
    </div>
  </section>`;
  }

  function stepListHtml(steps, cur) {
    return steps.map((s, n) => `<div class="step ${n === cur ? 'is-cur' : ''}">
      <div class="step__no">${n + 1}</div>
      <div class="step__col">
        <div class="step__t">${UI.esc(s.t)}</div>
        <div class="step__d">${UI.esc(s.d)}</div>
      </div>
    </div>`).join('');
  }

  function hydrate(st) {
    const list = document.getElementById('steps-list');
    if (!list) return Promise.resolve();
    return DATA.get(st.current).then(r => {
      if (!list.isConnected) return;
      if (!r || !r.steps.length) {
        list.innerHTML = '<div class="empty">暂无步骤数据</div>';
        return;
      }
      st.recipeSteps = r.steps;
      list.innerHTML = stepListHtml(r.steps, st.step);
      /* 同步下一步按钮文案 */
      const btn = document.querySelector('[data-step="1"] span');
      if (btn) btn.textContent = st.step >= r.steps.length - 1 ? '做完收工' : '下一步';
    });
  }

  window.SCREENS = window.SCREENS || {};
  window.SCREENS.steps = { render, hydrate };
})();
