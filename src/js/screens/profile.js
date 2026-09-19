/* ============================================================
   screens/profile.js — 我的口味（统计 / 偏好 / 忌口 / 设置）
   忌口编辑用底部弹层（sheet），含建议项与自定义输入。
   ============================================================ */
(function () {
  'use strict';

  function render(st) {
    const c = ICONS.colors();
    const total = DATA.allItems().length;
    const week = (st.history || []).filter(h => h.at >= Date.now() - 6 * 864e5).length;
    const av = RANDOM.avoidList(st);
    return `<section class="screen" data-screen="profile">
    <div class="content">
      <div class="page-title">我的口味</div>

      <div class="profile">
        <div class="profile__av">${ICONS.ICON.chef(null, c)}</div>
        <div class="profile__col">
          <div class="profile__name">小厨日记</div>
          <div class="profile__sub">收录 ${total} 道菜 · 数据只保存在这台设备上</div>
        </div>
      </div>

      <div class="stats">
        <div class="stats__col">
          <div class="stats__v">${st.history.length}</div>
          <div class="stats__l">累计做过</div>
        </div>
        <div class="stats__col">
          <div class="stats__v is-brand">${week}</div>
          <div class="stats__l">本周下厨</div>
        </div>
        <div class="stats__col">
          <div class="stats__v"><span id="fav-count">…</span></div>
          <div class="stats__l">已收藏</div>
        </div>
      </div>

      <div class="sec-head">
        <div class="sec-title">口味偏好</div>
        <div class="sec-note">用于随机结果加权</div>
      </div>
      <div class="chips chips--wrap">
        ${RANDOM.PREFS.map(p => `<button class="chip chip--pref ${st.prefs.includes(p.id) ? 'is-on' : ''}"
          data-pref="${p.id}">${p.id}</button>`).join('')}
      </div>

      <div class="sec-head">
        <div class="sec-title">忌口食材</div>
        <div class="sec-note">抽菜时自动跳过</div>
      </div>
      <div class="card card--pad" style="display:flex;flex-direction:column;gap:0.375rem;width:100%">
        <div class="avoid-text">${UI.esc(st.avoid.join(' · ') || '暂未设置')}</div>
        <div class="avoid-note">含以上食材的菜谱不会出现在随机结果里，当前影响 ${RANDOM.skippedCount(st)} 道。</div>
        <button class="row" data-edit-avoid="1" style="width:auto;align-self:flex-start;margin-top:0.25rem">
          <span class="row__v" style="color:var(--brand-deep)">编辑忌口 →</span>
        </button>
      </div>

      <div class="sec-head">
        <div class="sec-title">下厨设置</div>
        <div class="sec-note">只保存在本机</div>
      </div>
      <div class="rows-card">
        <button class="row" data-serve="1">
          <span class="row__n">默认份量</span>
          <span class="row__v">${st.serve} 人份</span>
        </button>
        <button class="row" data-goal="1">
          <span class="row__n">本周目标</span>
          <span class="row__v">${st.goal} 次</span>
        </button>
      </div>
    </div>
    ${UI.tabBar('profile')}
  </section>`;
  }

  function hydrate(st) {
    const el = document.getElementById('fav-count');
    if (!el) return Promise.resolve();
    return DB.favList().then(favs => {
      st.favs = favs.map(f => f.id);
      el.textContent = String(favs.length);
    });
  }

  /* 忌口编辑弹层 */
  function openAvoidSheet(st) {
    closeSheet();
    const mask = document.createElement('div');
    mask.className = 'sheet-mask';
    mask.id = 'sheet-mask';
    mask.innerHTML = `<div class="sheet">
      <div class="sheet__title">忌口食材</div>
      <div class="sheet__chips">
        ${RANDOM.AVOID_SUGGEST.map(a => `<button class="chip chip--pref ${st.avoid.includes(a) ? 'is-on' : ''}"
          data-avoid-chip="${a}">${a}</button>`).join('')}
      </div>
      <input class="sheet__input" id="avoid-input" type="text" placeholder="自定义忌口，回车添加，如「花生」">
      <div class="sheet__note">当前忌口：${UI.esc(st.avoid.join(' · ') || '无')}（点击下方标签可移除）</div>
      <div class="bottom__row">
        <button class="btn btn--ghost btn--w128" data-sheet-close="1"><span>关闭</span></button>
        <button class="btn btn--primary" style="flex:1 1 auto" data-sheet-save="1"><span>保存</span></button>
      </div>
    </div>`;
    mask.addEventListener('click', e => {
      if (e.target === mask) closeSheet();
      const chip = e.target.closest('[data-avoid-chip]');
      if (chip) {
        const a = chip.dataset.avoidChip;
        const i = st.avoid.indexOf(a);
        if (i === -1) st.avoid.push(a); else st.avoid.splice(i, 1);
        chip.classList.toggle('is-on');
        mask.querySelector('.sheet__note').textContent =
          `当前忌口：${st.avoid.join(' · ') || '无'}（点击上方标签可切换）`;
        return;
      }
      if (e.target.closest('[data-sheet-close]')) { closeSheet(); APP.render(); return; }
      if (e.target.closest('[data-sheet-save]')) {
        APP.save(); closeSheet(); APP.render();
        APP.toast(st.avoid.length ? `忌口已保存，影响 ${RANDOM.skippedCount(st)} 道菜` : '忌口已清空');
        return;
      }
    });
    mask.querySelector('#avoid-input').addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const v = e.target.value.trim().slice(0, 12);
      if (v && !st.avoid.includes(v)) st.avoid.push(v);
      e.target.value = '';
      mask.querySelector('.sheet__note').textContent =
        `当前忌口：${st.avoid.join(' · ') || '无'}（保存后生效）`;
    });
    document.getElementById('app').appendChild(mask);
  }
  function closeSheet() {
    const m = document.getElementById('sheet-mask');
    if (m) m.remove();
  }

  window.SCREENS = window.SCREENS || {};
  window.SCREENS.profile = { render, hydrate, openAvoidSheet, closeSheet };
})();
