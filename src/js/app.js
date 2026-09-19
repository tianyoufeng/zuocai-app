/* ============================================================
   app.js — 应用编排：状态 / 路由 / 事件 / 启动
   ============================================================ */
(function () {
  'use strict';

  const DEFAULTS = {
    prefs: ['少油少盐'],
    avoid: [],
    history: [],
    favs: [],
    filter: '全部',
    cat: '全部',
    query: '',
    serve: 2,
    goal: 4,
    current: '',
    step: 0
  };
  const TAB_SCREENS = ['home', 'library', 'records', 'profile'];
  let stack = ['home'];
  let toastTimer = null;

  const APP = {
    state: Object.assign({}, DEFAULTS),

    save() { return DB.prefsSet({
      prefs: this.state.prefs, avoid: this.state.avoid, serve: this.state.serve,
      goal: this.state.goal, filter: this.state.filter, cat: this.state.cat
    }); },

    load() {
      return DB.ready().then(() => Promise.all([
        DB.prefsGet(), DB.historyGet(), DB.favList()
      ])).then(([prefs, history, favs]) => {
        const st = this.state;
        if (prefs && typeof prefs === 'object') {
          if (Array.isArray(prefs.prefs)) st.prefs = prefs.prefs.filter(p => RANDOM.PREFS.some(x => x.id === p));
          if (Array.isArray(prefs.avoid)) st.avoid = prefs.avoid.filter(x => typeof x === 'string');
          st.serve = clamp(prefs.serve, 1, 8, 2);
          st.goal = clamp(prefs.goal, 1, 14, 4);
          if (typeof prefs.filter === 'string' && RANDOM.TAG_FILTERS.includes(prefs.filter)) st.filter = prefs.filter;
          if (typeof prefs.cat === 'string') st.cat = prefs.cat;
        }
        st.history = (history || []).filter(h => h && typeof h.id === 'string' && typeof h.at === 'number' && DATA.summary(h.id));
        st.favs = (favs || []).map(f => f.id).filter(id => !!DATA.summary(id));
      });
    },

    /* ---------- 路由 ---------- */
    render(anim) {
      const name = stack[stack.length - 1];
      const mod = SCREENS[name];
      const app = document.getElementById('app');
      const st = this.state;

      /* 切屏前先关弹层 */
      SCREENS.profile.closeSheet();
      app.innerHTML = `<div class="toast" id="toast"></div>` + mod.render(st);

      const el = app.querySelector('.screen');
      el.classList.add('is-active');
      if (anim) el.classList.add(anim === 'pop' ? 'anim-pop' : 'anim-push');

      if (mod.hydrate) mod.hydrate(st).then(() => refreshDynamicIcons());
      if (mod.afterRender) mod.afterRender(st);
    },

    go(name, mode) {
      if (TAB_SCREENS.includes(name)) stack = [name];
      else stack.push(name);
      this.render(mode);
    },
    back() { if (stack.length > 1) { stack.pop(); this.render('pop'); } },

    toast(msg) {
      const el = document.getElementById('toast');
      if (!el) return;
      el.textContent = msg;
      el.classList.add('is-on');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => el.classList.remove('is-on'), 1900);
    }
  };

  function clamp(v, lo, hi, fb) { const n = Number(v); return n >= lo && n <= hi ? n : fb; }

  /* 收藏星/心在 hydrate 之后才知道状态，二次刷新这两个按钮（简化：整屏重绘） */
  function refreshDynamicIcons() { /* 预留：当前 hydrate 只填充容器，不动图标 */ }

  /* ---------- 事件委托 ---------- */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-roll],[data-open],[data-back],[data-tab],[data-filter],' +
      '[data-cat],[data-pref],[data-fav],[data-cook],[data-step],[data-serve],[data-goal],' +
      '[data-share],[data-reset-filter],[data-edit-avoid],[data-clear-history]');
    if (!t) return;
    const d = t.dataset;
    const st = APP.state;

    if (d.tab !== undefined) { st.query = ''; APP.go(d.tab); return; }
    if (d.back !== undefined) { APP.back(); return; }

    if (d.filter !== undefined) {
      st.filter = d.filter; APP.save();
      APP.render();
      if (RANDOM.pool(st).length === 0) APP.toast('这个筛选下暂时没有可抽的菜');
      return;
    }
    if (d.cat !== undefined) { st.cat = d.cat; APP.save(); APP.render(); return; }

    if (d.pref !== undefined) {
      const i = st.prefs.indexOf(d.pref);
      if (i === -1) st.prefs.push(d.pref); else st.prefs.splice(i, 1);
      APP.save(); APP.render(); return;
    }

    if (d.roll !== undefined) {
      const p = RANDOM.pick(st);
      if (!p) { APP.toast('当前筛选与忌口下没有可抽的菜，先放宽一点'); return; }
      st.current = p.id; st.step = 0; st.recipeSteps = [];
      if (stack[stack.length - 1] === 'result') APP.render();
      else APP.go('result', 'push');
      return;
    }

    if (d.open !== undefined) {
      st.current = d.open; st.step = 0; st.recipeSteps = [];
      if (stack[stack.length - 1] === 'detail') APP.render('push');
      else APP.go('detail', 'push');
      return;
    }

    if (d.fav !== undefined) {
      DB.toggleFav(d.fav).then(added => {
        const i = st.favs.indexOf(d.fav);
        if (added && i === -1) st.favs.push(d.fav);
        if (!added && i !== -1) st.favs.splice(i, 1);
        APP.toast(added ? '已收藏，去「记录」里能找到' : '已取消收藏');
        /* 就地翻转本按钮图标，避免整屏重绘打断滚动 */
        const c = ICONS.colors();
        const svgHolder = t;
        svgHolder.innerHTML = ICONS.ICON.star(c.ink, added ? c.brand : 'none', c);
      });
      return;
    }

    if (d.cook !== undefined) { st.step = 0; st.recipeSteps = []; APP.go('steps', 'push'); return; }

    if (d.step !== undefined) {
      const dir = Number(d.step);
      const steps = st.recipeSteps || [];
      const next = st.step + dir;
      if (next < 0) return;
      if (next >= steps.length) {
        const cur = st.current;
        DB.historyPush(cur).then(() => { st.history.push({ id: cur, at: Date.now() }); });
        APP.toast(`「${(DATA.summary(cur) || {}).name || ''}」已记入下厨记录`);
        st.step = 0; stack = ['home']; APP.render();
        return;
      }
      st.step = next; APP.render();
      /* 轻量更新进度与高亮，不整屏重绘 */
      const list = document.getElementById('steps-list');
      if (list && steps.length) {
        list.innerHTML = steps.map((s, n) => `<div class="step ${n === st.step ? 'is-cur' : ''}">
          <div class="step__no">${n + 1}</div>
          <div class="step__col"><div class="step__t">${UI.esc(s.t)}</div><div class="step__d">${UI.esc(s.d)}</div></div>
        </div>`).join('');
        const pct = Math.round((st.step + 1) / steps.length * 100);
        const fill = document.querySelector('.progress__fill');
        if (fill) fill.style.width = pct + '%';
        const label = document.querySelector('.progress__label');
        if (label) label.textContent = `第 ${st.step + 1} 步 / 共 ${steps.length} 步`;
        const prev = document.querySelector('[data-step="-1"]');
        if (prev) prev.classList.toggle('is-disabled', st.step === 0);
        const nextBtn = document.querySelector('[data-step="1"] span');
        if (nextBtn) nextBtn.textContent = st.step >= steps.length - 1 ? '做完收工' : '下一步';
      }
      return;
    }

    if (d.serve !== undefined) {
      st.serve = st.serve >= 6 ? 1 : st.serve + 1;
      APP.save(); APP.render();
      APP.toast(`食材用量已按 ${st.serve} 人份换算`);
      return;
    }
    if (d.goal !== undefined) {
      const opts = [3, 4, 5, 7];
      st.goal = opts[(opts.indexOf(st.goal) + 1) % opts.length];
      APP.save(); APP.render(); return;
    }
    if (d.share !== undefined) { APP.toast('菜谱都在本地，直接截图分享吧'); return; }
    if (d.resetFilter !== undefined) {
      st.filter = '全部'; st.cat = '全部'; st.query = '';
      APP.save(); APP.render(); APP.toast('已重置筛选与搜索'); return;
    }
    if (d.editAvoid !== undefined) { SCREENS.profile.openAvoidSheet(st); return; }
    if (d.clearHistory !== undefined) {
      if (confirm('确定清空全部下厨历史？')) {
        DB.historySet([]).then(() => { st.history = []; APP.render(); APP.toast('已清空'); });
      }
      return;
    }
  });

  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'Escape') APP.back();
  });

  /* ---------- 视口高度兜底（老 WebView 不支持 dvh） ---------- */
  function setVH() {
    document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px');
  }
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', setVH);
  setVH();

  /* ---------- 键盘（Capacitor 环境下 resize=body 由原生层处理） ---------- */
  function bindKeyboard() {
    if (!window.Capacitor || !window.Capacitor.Plugins || !window.Capacitor.Plugins.Keyboard) return;
    try {
      const kb = window.Capacitor.Plugins.Keyboard;
      if (kb.setResizeMode) kb.setResizeMode({ mode: 'body' });
      kb.addListener && kb.addListener('keyboardDidShow', info => {
        const el = document.activeElement;
        if (el && el.id === 'q') el.scrollIntoView({ block: 'nearest' });
      });
    } catch (err) { /* 忽略 */ }
  }

  /* ---------- 启动 ---------- */
  function boot() {
    APP.load()
      .catch(() => {})
      .then(() => {
        /* 未抽过菜时给 current 一个默认值（第一道菜） */
        if (!APP.state.current) {
          const first = DATA.allItems()[0];
          APP.state.current = first ? first.id : '';
        }
        bindKeyboard();
        APP.render();
        /* 预加载首页出现的分类，点击详情时零等待 */
        DATA.ensureCat('jiachangcai');
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.APP = APP;
})();
