/* ============================================================
   random.js — 加权随机抽菜 + 忌口过滤（自 v1 移植，适配 manifest 结构）
   依赖：DATA（manifest 摘要）、APP.state（prefs/avoid/filter/history）
   ============================================================ */
(function () {
  'use strict';

  const PREFS = [
    { id: '微辣',     flavor: '辣' },
    { id: '少油少盐', flavor: '清淡' },
    { id: '重口',     flavor: '重口' },
    { id: '偏甜',     flavor: '甜' },
    { id: '不吃香菜', avoid: '香菜' }
  ];
  const AVOID_SUGGEST = ['香菜', '动物内脏', '苦瓜', '芹菜', '肥肉'];
  const TAG_FILTERS = ['全部', '20 分钟快手', '下饭硬菜', '清淡少油'];
  const CATS_ALL = '全部';

  function avoidList(st) {
    const a = (st.avoid || []).slice();
    if ((st.prefs || []).includes('不吃香菜') && !a.includes('香菜')) a.push('香菜');
    return a;
  }

  /* 忌口命中：摘要里的 ings 是食材名数组 */
  function hitAvoid(item, av) {
    return av.some(x => item.ings.some(n => n.indexOf(x) !== -1));
  }

  function skippedCount(st) {
    const av = avoidList(st);
    return DATA.allItems().filter(d => hitAvoid(d, av)).length;
  }

  /* 抽菜候选池（ignoreFilter=true 时只按忌口过滤） */
  function pool(st, ignoreFilter) {
    const av = avoidList(st);
    return DATA.allItems().filter(d => {
      if (hitAvoid(d, av)) return false;
      if (!ignoreFilter && st.filter && st.filter !== '全部') {
        if (st.filter === '20 分钟快手' && d.time > 20) return false;
        if (st.filter === '下饭硬菜' && !d.tags.includes('下饭')) return false;
        if (st.filter === '清淡少油' && !d.tags.includes('清淡')) return false;
      }
      return true;
    });
  }

  /* 加权随机：口味偏好 +2、最近 3 次没做过 +1 */
  function pick(st) {
    const p = pool(st);
    if (!p.length) return null;
    const flavors = PREFS.filter(x => (st.prefs || []).includes(x.id) && x.flavor).map(x => x.flavor);
    const recent = (st.history || []).slice(-3).map(h => h.id);
    const weighted = [];
    p.forEach(d => {
      let w = 1;
      if (d.tags.some(t => flavors.includes(t))) w += 2;
      if (!recent.includes(d.id)) w += 1;
      for (let i = 0; i < w; i++) weighted.push(d);
    });
    return weighted[Math.floor(Math.random() * weighted.length)];
  }

  function daysSince(ts) { return Math.floor((Date.now() - ts) / 864e5); }

  /* 抽中理由文案（自 v1 移植微调） */
  function reasonFor(item, st) {
    const out = [];
    const flavors = PREFS.filter(x => (st.prefs || []).includes(x.id) && x.flavor).map(x => x.flavor);
    const hit = item.tags.find(t => flavors.includes(t));
    if (hit) {
      const label = (PREFS.find(p => p.flavor === hit) || {}).id;
      out.push(`你选了「${label}」，这道正好对口`);
    }
    const last = (st.history || []).filter(h => h.id === item.id).sort((a, b) => b.at - a.at)[0];
    if (!last) out.push(`${item.name} 你还没做过，正好解锁一道新的`);
    else {
      const dd = daysSince(last.at);
      if (dd >= 7) out.push(`上次做 ${item.name} 已经是 ${dd} 天前，该复刻一次了`);
    }
    const h = new Date().getHours();
    if (h < 10) out.push(`现在才 ${h} 点多，${item.time} 分钟的 ${item.name} 完全来得及`);
    else if (h >= 17) out.push(`${h} 点多了，${item.time} 分钟的 ${item.name} 正好赶得上晚饭`);
    if (!out.length) out.push(`最近 ${Math.min((st.history || []).length, 3)} 次都没重复，给你换个新花样`);
    const skipped = skippedCount(st);
    const tail = skipped ? `；已按忌口跳过 ${skipped} 道` : '';
    return out.slice(0, 2).join('；') + tail + '。';
  }

  /* 份数换算（BASE_SERVE = 2 基准，自 v1 移植） */
  const BASE_SERVE = 2;
  function scaledAmount(raw, serve) {
    const f = (serve || 2) / BASE_SERVE;
    const m = /^([\d.]+)(.*)$/.exec(String(raw).trim());
    if (!m || f === 1) return raw;
    const n = parseFloat(m[1]) * f;
    const nice = n >= 10 ? Math.round(n) : Math.round(n * 10) / 10;
    return `${nice}${m[2]}`;
  }

  window.RANDOM = { PREFS, AVOID_SUGGEST, TAG_FILTERS, CATS_ALL, avoidList, skippedCount,
                    pool, pick, reasonFor, daysSince, scaledAmount, BASE_SERVE };
})();
