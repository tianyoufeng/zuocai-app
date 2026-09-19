/* ============================================================
   icons.js — 内联 SVG 图标（自 v1 移植，统一 24×24 坐标系）
   颜色常量 C 与 CSS 变量保持同值（SVG 属性里不能用 CSS 变量）；
   深色模式下 ink/mut/chev 需要用暗色值，由 setTheme() 在渲染前切换。
   ============================================================ */
(function () {
  'use strict';

  const C = {
    ink: '#1F1E1B', bg: '#F8F5F0', white: '#FFFFFF',
    mut: '#9A948A', t3: '#8C877E', chev: '#C4BDB2',
    brand: '#E8703A', brandDeep: '#C9552A', sage: '#5C7350',
    ph: '#A9A29A', tint: '#FDEDE3', warmTint: '#F3EDE3'
  };
  const DARK = {
    ink: '#F0EBE3', bg: '#1C1A17', white: '#FFFFFF',
    mut: '#7A746A', t3: '#8C867C', chev: '#57524A',
    brand: '#E8703A', brandDeep: '#F08A5C', sage: '#A3BD93',
    ph: '#6B655C', tint: '#3A2A1F', warmTint: '#2E2A25'
  };

  const svgV = (vb, w, h, inner) =>
    `<svg width="${w}" height="${h}" viewBox="${vb}" fill="none" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  const ic = (size, inner) => svgV('0 0 24 24', size, size, inner);

  const ICON = {
    /* 状态栏（仅桌面预览装饰用，真机隐藏） */
    signal: c => svgV('0 0 18 12', 18, 12, `<rect x="0" y="8" width="3" height="4" rx="1" fill="${c}"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="${c}"/><rect x="10" y="3" width="3" height="9" rx="1" fill="${c}"/><rect x="15" y="0" width="3" height="12" rx="1" fill="${c}"/>`),
    wifi: c => svgV('0 0 17 12', 17, 12, `<path d="M1 4.2C3.2 2.2 5.9 1 8.5 1C11.1 1 13.8 2.2 16 4.2" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/><path d="M4 7.2C5.3 6.1 6.8 5.5 8.5 5.5C10.2 5.5 11.7 6.1 13 7.2" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/><path d="M6.8 10C7.3 9.6 7.9 9.4 8.5 9.4C9.1 9.4 9.7 9.6 10.2 10" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`),
    battery: c => svgV('0 0 25 12', 25, 12, `<rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="${c}" stroke-opacity="0.35"/><rect x="2" y="2" width="15" height="8" rx="2" fill="${c}"/><path d="M23 4.2V7.8C23.9 7.5 24.5 6.9 24.5 6C24.5 5.1 23.9 4.5 23 4.2Z" fill="${c}" fill-opacity="0.4"/>`),

    back: (col, c) => ic(24, `<path d="M15.5 5L8.5 12L15.5 19" stroke="${col || c.ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`),
    heart: (col, fill, c) => ic(24, `<path d="M12 19.5C12 19.5 3.5 14.4 3.5 8.8C3.5 5.9 5.8 4 8.2 4C9.9 4 11.3 5 12 6.3C12.7 5 14.1 4 15.8 4C18.2 4 20.5 5.9 20.5 8.8C20.5 14.4 12 19.5 12 19.5Z" stroke="${col || c.ink}" stroke-width="1.8" stroke-linejoin="round" fill="${fill || 'none'}"/>`),
    star: (col, fill, c) => ic(24, `<path d="M12 3.5L14.6 9L20.5 9.8L16.2 13.9L17.3 19.7L12 16.9L6.7 19.7L7.8 13.9L3.5 9.8L9.4 9L12 3.5Z" stroke="${col || c.ink}" stroke-width="1.8" stroke-linejoin="round" fill="${fill || 'none'}"/>`),
    share: c => ic(24, `<path d="M6 13.5V19C6 19.6 6.4 20 7 20H17C17.6 20 18 19.6 18 19V13.5" stroke="${c.ink}" stroke-width="1.8" stroke-linecap="round"/><path d="M12 15.5V3.5" stroke="${c.ink}" stroke-width="1.8" stroke-linecap="round"/><path d="M8 7.5L12 3.5L16 7.5" stroke="${c.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`),
    dice: (col) => ic(24, `<rect x="3" y="3" width="18" height="18" rx="5" stroke="${col}" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.6" fill="${col}"/><circle cx="15.5" cy="15.5" r="1.6" fill="${col}"/><circle cx="15.5" cy="8.5" r="1.6" fill="${col}"/><circle cx="8.5" cy="15.5" r="1.6" fill="${col}"/>`),
    refresh: c => ic(24, `<path d="M20 12C20 16.4 16.4 20 12 20C7.6 20 4 16.4 4 12C4 7.6 7.6 4 12 4C14.8 4 17.2 5.4 18.6 7.5" stroke="${c.ink}" stroke-width="1.8" stroke-linecap="round"/><path d="M19 3.5V7.8H14.7" stroke="${c.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`),
    list: c => ic(24, `<path d="M8 6H20M8 12H20M8 18H20" stroke="${c.bg}" stroke-width="2" stroke-linecap="round"/><circle cx="4" cy="6" r="1.5" fill="${c.bg}"/><circle cx="4" cy="12" r="1.5" fill="${c.bg}"/><circle cx="4" cy="18" r="1.5" fill="${c.bg}"/>`),
    timer: c => ic(24, `<circle cx="12" cy="13" r="7.5" stroke="${c.bg}" stroke-width="1.8"/><path d="M12 9.5V13L14.5 14.6" stroke="${c.bg}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.5 2.5H14.5" stroke="${c.bg}" stroke-width="1.8" stroke-linecap="round"/>`),
    arrowLeft: (col, c) => ic(24, `<path d="M19 12H5" stroke="${col || c.ink}" stroke-width="2" stroke-linecap="round"/><path d="M11 6L5 12L11 18" stroke="${col || c.ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`),
    arrowRight: (col, c) => ic(24, `<path d="M5 12H19" stroke="${col || c.bg}" stroke-width="2" stroke-linecap="round"/><path d="M13 6L19 12L13 18" stroke="${col || c.bg}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`),
    search: c => ic(24, `<circle cx="10.5" cy="10.5" r="6.5" stroke="${c.t3}" stroke-width="1.8"/><path d="M15.5 15.5L20 20" stroke="${c.t3}" stroke-width="1.8" stroke-linecap="round"/>`),
    filter: c => ic(24, `<path d="M5 8H19M8 12H16M10.5 16H13.5" stroke="${c.ink}" stroke-width="1.8" stroke-linecap="round"/>`),
    gear: c => ic(24, `<circle cx="12" cy="12" r="3" stroke="${c.ink}" stroke-width="1.8"/><path d="M12 3.5V6.5M12 17.5V20.5M20.5 12H17.5M6.5 12H3.5M18 6L16 8M8 16L6 18M18 18L16 16M8 8L6 6" stroke="${c.ink}" stroke-width="1.8" stroke-linecap="round"/>`),
    spark: c => ic(24, `<circle cx="12" cy="12" r="4" stroke="${c.sage}" stroke-width="1.8"/><path d="M12 2.5V5M12 19V21.5M3.2 3.2L5 5M19 19L20.8 20.8M20.8 3.2L19 5M5 19L3.2 20.8" stroke="${c.sage}" stroke-width="1.8" stroke-linecap="round"/>`),
    user: (col, size, c) => ic(size || 24, `<circle cx="12" cy="8.5" r="3.8" stroke="${col || c.mut}" stroke-width="1.6"/><path d="M4.8 20.5C4.8 17 8 14.6 12 14.6C16 14.6 19.2 17 19.2 20.5" stroke="${col || c.mut}" stroke-width="1.6" stroke-linecap="round"/>`),
    /* 厨师头像（「我的」页 / 首页通用）：暖橙圆底 + 白色厨师帽 + 笑脸 */
    chef: (size, c) => svgV('0 0 48 48', size || '100%', size || '100%',
      `<circle cx="24" cy="24" r="24" fill="${c.tint}"/>` +
      `<circle cx="13.8" cy="32" r="2.2" fill="#EEC094"/>` +
      `<circle cx="34.2" cy="32" r="2.2" fill="#EEC094"/>` +
      `<circle cx="24" cy="31.4" r="10.4" fill="#F6CFA8"/>` +
      `<circle cx="16.6" cy="35" r="2.3" fill="#EFA98C" fill-opacity="0.42"/>` +
      `<circle cx="31.4" cy="35" r="2.3" fill="#EFA98C" fill-opacity="0.42"/>` +
      `<circle cx="20.2" cy="30.8" r="1.6" fill="#3A332C"/>` +
      `<circle cx="27.8" cy="30.8" r="1.6" fill="#3A332C"/>` +
      `<path d="M21 35.6C21.8 37.2 22.8 38 24 38C25.2 38 26.2 37.2 27 35.6" stroke="#3A332C" stroke-width="1.7" stroke-linecap="round" fill="none"/>` +
      `<circle cx="17.2" cy="15" r="5.7" fill="#FFFFFF"/>` +
      `<circle cx="24" cy="12.4" r="6.7" fill="#FFFFFF"/>` +
      `<circle cx="30.8" cy="15" r="5.7" fill="#FFFFFF"/>` +
      `<rect x="12.2" y="15" width="23.6" height="6.6" rx="3.3" fill="#FFFFFF"/>` +
      `<rect x="14.4" y="20.8" width="19.2" height="4.6" rx="2.3" fill="#EDE6DC"/>`
    ),
    chevron: c => ic(24, `<path d="M9 6L15 12L9 18" stroke="${c.chev}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`),
    plus: c => ic(24, `<path d="M12 5V19M5 12H19" stroke="${c.ink}" stroke-width="1.8" stroke-linecap="round"/>`),
    minus: (col, c) => ic(24, `<path d="M5 12H19" stroke="${col || (c && c.ink) || C.ink}" stroke-width="2" stroke-linecap="round"/>`),
    plusLine: (col, c) => ic(24, `<path d="M12 5V19M5 12H19" stroke="${col || (c && c.ink) || C.ink}" stroke-width="2" stroke-linecap="round"/>`),
    check: (col, c) => ic(24, `<path d="M5 12.8L9.6 17.4L19 8" stroke="${col || (c && c.bg) || C.bg}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`),
    trash: c => ic(24, `<path d="M4.5 6.5H19.5M9 6V4.5C9 3.9 9.4 3.5 10 3.5H14C14.6 3.5 15 3.9 15 4.5V6M6.5 6.5L7.3 19C7.35 19.6 7.8 20 8.4 20H15.6C16.2 20 16.65 19.6 16.7 19L17.5 6.5" stroke="${c.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`),

    /* 底部导航 */
    tabHome: (col) => ic(18, `<path d="M3 10.5L12 3.5L21 10.5V20C21 20.6 20.6 21 20 21H15V15.5H9V21H4C3.4 21 3 20.6 3 20V10.5Z" stroke="${col}" stroke-width="1.8" stroke-linejoin="round"/>`),
    tabBook: (col) => ic(18, `<path d="M4 4.5C4 3.7 4.7 3 5.5 3H19V21H5.5C4.7 21 4 20.3 4 19.5V4.5Z" stroke="${col}" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.5 3V21" stroke="${col}" stroke-width="1.8"/>`),
    tabClock: (col) => ic(18, `<circle cx="12" cy="12" r="8.5" stroke="${col}" stroke-width="1.8"/><path d="M12 7.5V12L15 13.8" stroke="${col}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`),
    tabUser: (col) => ic(18, `<circle cx="12" cy="8" r="3.8" stroke="${col}" stroke-width="1.8"/><path d="M4.5 20.5C4.5 16.9 7.9 14.5 12 14.5C16.1 14.5 19.5 16.9 19.5 20.5" stroke="${col}" stroke-width="1.8" stroke-linecap="round"/>`)
  };

  function colors() {
    const dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return dark ? DARK : C;
  }

  window.ICONS = { ICON, colors, C, DARK };
})();
