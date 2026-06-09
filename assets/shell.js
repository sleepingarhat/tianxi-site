/* ================================================================
   天喜 TIANXI · Shell partial injector (2026-05-22)
   ----------------------------------------------------------------
   Single source of truth for brandbar + botnav across all pages.
   Replaces hand-copied markup that drifted across 13 pages
   (4 distinct botnav variants, 2 brandbar variants).

   Usage in page HTML:
     <body data-page="dashboard">   <!-- drives botnav active state -->
     <header class="brandbar" data-tx-shell="brandbar"></header>
     <nav class="botnav" data-tx-shell="botnav"></nav>
     <script src="/assets/shell.js" defer></script>

   Disclaimer is intentionally NOT injected — page content varies
   (lounge has community rules; predictor/schedule have variants;
   index/horse/race omit by design).
   ================================================================ */
(function () {
  'use strict';

  var BRANDBAR_HTML =
    '<a href="/" class="brand">' +
      '<span class="brand__glyph" aria-hidden="true">' +
        '<svg viewBox="0 0 40 40">' +
          '<defs>' +
            '<linearGradient id="txBrandGrad" x1="0" y1="0" x2="1" y2="1">' +
              '<stop offset="0%" stop-color="#00843D"/>' +
              '<stop offset="50%" stop-color="#8B5A2B"/>' +
              '<stop offset="100%" stop-color="#C8102E"/>' +
            '</linearGradient>' +
          '</defs>' +
          '<rect x="1" y="1" width="38" height="38" rx="7" fill="url(#txBrandGrad)" stroke="#D4A11E" stroke-width="0.8"/>' +
          '<text x="20" y="28" font-family="Noto Serif TC, serif" font-size="24" font-weight="900" fill="#F5D77A" text-anchor="middle">喜</text>' +
        '</svg>' +
      '</span>' +
      '<span class="brand__word">天喜 TIANXI<small>ENTERTAINMENT</small></span>' +
    '</a>' +
    '<div></div>' +
    '<div class="brandbar__actions">' +
      '<a href="/track-record/" data-page="track-record" style="font-family:var(--font-display);font-weight:700;font-size:12px;color:var(--ink-soft);text-decoration:none;align-self:center;margin-right:2px;white-space:nowrap">戰績</a>' +
      '<a href="/membership/" class="brandbar__upgrade" data-page="membership">升級 Pro</a>' +
      '<button type="button" class="theme-toggle" data-tx-theme-toggle aria-pressed="false" aria-label="切換至深色模式" title="切換深／淺色">' +
        '<svg class="theme-toggle__sun" viewBox="0 0 24 24" aria-hidden="true">' +
          '<circle cx="12" cy="12" r="4.2"/>' +
          '<g stroke-linecap="round">' +
            '<line x1="12" y1="2" x2="12" y2="4.5"/><line x1="12" y1="19.5" x2="12" y2="22"/>' +
            '<line x1="2" y1="12" x2="4.5" y2="12"/><line x1="19.5" y1="12" x2="22" y2="12"/>' +
            '<line x1="4.9" y1="4.9" x2="6.7" y2="6.7"/><line x1="17.3" y1="17.3" x2="19.1" y2="19.1"/>' +
            '<line x1="4.9" y1="19.1" x2="6.7" y2="17.3"/><line x1="17.3" y1="6.7" x2="19.1" y2="4.9"/>' +
          '</g>' +
        '</svg>' +
        '<svg class="theme-toggle__moon" viewBox="0 0 24 24" aria-hidden="true">' +
          '<path d="M20 14.5A8 8 0 0 1 9.5 4a1 1 0 0 0-1.3-1.3 10 10 0 1 0 13.1 13.1 1 1 0 0 0-1.3-1.3z"/>' +
        '</svg>' +
      '</button>' +
    '</div>';

  // Alias map: pages that should highlight a different botnav slot
  // (e.g. /combo/ and /pool-odds/ are sub-tools under "選馬"/predictor).
  // Source: union of the per-page inline maps removed 2026-05-22.
  var PAGE_ALIAS = {
    'combo': 'predictor',
    'pool-odds': 'predictor',
    'value-heatmap': 'predictor',
    'flow': 'predictor',
    'watchlist': 'predictor',
    'live': 'predictor',
    'login': null,
    '404': null,
    'home': null,
    'race': null,
    'horse': null,
    'results': null,
    'track-record': null
  };

  // Each entry: [href, page-key, label, svgInner]
  var BOTNAV_ITEMS = [
    ['/dashboard/', 'dashboard', '儀表板',
      '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>'],
    ['/predictor/', 'predictor', '選馬',
      '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>'],
    ['/schedule/', 'schedule', '日程',
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>'],
    ['/encyclopedia/', 'encyclopedia', '百科',
      '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14A2.5 2.5 0 0 0 6.5 22H20v-5"/>'],
    ['/lounge/', 'lounge', '聊天室',
      '<path d="M21 12a8 8 0 1 1-3.5-6.6L21 4v5h-5"/>']
  ];

  function renderBotnav(activePage) {
    return BOTNAV_ITEMS.map(function (it) {
      var active = it[1] === activePage ? ' is-active' : '';
      var aria = active ? ' aria-current="page"' : '';
      return '<a href="' + it[0] + '" class="botnav__item' + active + '" data-page="' + it[1] + '"' + aria + '>' +
             '<svg class="botnav__icon" viewBox="0 0 24 24">' + it[3] + '</svg>' +
             it[2] +
             '</a>';
    }).join('');
  }

  function mount() {
    var raw = (document.body && document.body.dataset && document.body.dataset.page) || '';
    // Apply alias map: undefined → use raw key, defined → use alias (may be null = no highlight)
    var activePage = Object.prototype.hasOwnProperty.call(PAGE_ALIAS, raw) ? (PAGE_ALIAS[raw] || '') : raw;
    var bb = document.querySelector('[data-tx-shell="brandbar"]');
    if (bb && !bb.dataset.txShellMounted) {
      bb.innerHTML = BRANDBAR_HTML;
      bb.dataset.txShellMounted = '1';
    }
    var bn = document.querySelector('[data-tx-shell="botnav"]');
    if (bn && !bn.dataset.txShellMounted) {
      bn.innerHTML = renderBotnav(activePage);
      bn.dataset.txShellMounted = '1';
    }
    // Fire event so any page-level JS waiting on theme-toggle button can bind
    try {
      document.dispatchEvent(new CustomEvent('tx:shellready', { detail: { activePage: activePage } }));
    } catch (e) { /* no-op */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
})();
