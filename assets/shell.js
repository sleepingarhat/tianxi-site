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
   (marksix adds a past-results note; predictor/schedule have variants;
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
    'pool-odds': 'predictor',
    'value-heatmap': 'predictor',
    'flow': 'predictor',
    'watchlist': 'predictor',
    'live': 'predictor',
    'manual': 'engine',
    'dev-log': 'engine',
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
    ['/engine/', 'engine', '引擎',
      '<path d="M3 12h4l3 8 4-16 3 8h4"/>'],
    ['/marksix/', 'marksix', '六合彩',
      '<circle cx="12" cy="12" r="8.5"/><circle cx="9.2" cy="9.2" r="2.2"/>']
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

/* ================================================================
   天喜 TIANXI · Lemniscate Bloom loader (shared, 2026-06-25)
   ----------------------------------------------------------------
   Bernoulli-lemniscate particle bloom — the single loading/waiting
   indicator used across EVERY page. One requestAnimationFrame loop
   drives all live instances; hosts removed from the DOM are reaped.
   Markup-driven: any element with [data-tx-loader] is upgraded
   (initial scan + MutationObserver), so pages emit only a
   placeholder div — no per-page JS wiring. Also exposes
   window.TXLoader.{mount,html,scan} for imperative use.

     a = 25.0 + 10.8s
     x(t) = 50 + a cos t / (1 + sin^2 t)
     y(t) = 50 + a sin t cos t / (1 + sin^2 t)
   ================================================================ */
(function () {
  'use strict';
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var CFG = {
    particleCount: 62, trailSpan: 0.68, durationMs: 3500,
    pulseDurationMs: 2800, lemniscateA: 25, lemniscateBoost: 10.8
  };
  var reduce = false;
  try {
    reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) { reduce = false; }

  function point(progress, detailScale) {
    var t = progress * Math.PI * 2;
    var scale = CFG.lemniscateA + detailScale * CFG.lemniscateBoost;
    var s = Math.sin(t);
    var denom = 1 + s * s;
    return {
      x: 50 + (scale * Math.cos(t)) / denom,
      y: 50 + (scale * s * Math.cos(t)) / denom
    };
  }
  function norm(p) { return ((p % 1) + 1) % 1; }
  function esc(v) {
    return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var instances = [];

  function build(host) {
    for (var q = instances.length - 1; q >= 0; q--) {
      if (instances[q].host === host) instances.splice(q, 1);
    }
    var label = host.getAttribute('data-label') || '';
    var size = host.getAttribute('data-size') || '';
    host.classList.add('tx-lemni-host');
    if (size) host.classList.add('tx-lemni-host--' + size);
    host.setAttribute('data-tx-init', '1');
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    host.setAttribute('aria-busy', 'true');
    if (label) host.setAttribute('aria-label', label);

    var wrap = document.createElement('div');
    wrap.className = 'tx-lemni' + (size ? ' tx-lemni--' + size : '');

    var fig = document.createElement('div');
    fig.className = 'tx-lemni__fig';
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('aria-hidden', 'true');
    var g = document.createElementNS(SVG_NS, 'g');
    svg.appendChild(g);
    fig.appendChild(svg);
    wrap.appendChild(fig);

    var particles = [];
    if (reduce) {
      var path = document.createElementNS(SVG_NS, 'path');
      var d = '';
      for (var n = 0; n <= 240; n++) {
        var sp = point(n / 240, 1);
        d += (n === 0 ? 'M' : 'L') + ' ' + sp.x.toFixed(2) + ' ' + sp.y.toFixed(2) + ' ';
      }
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'currentColor');
      path.setAttribute('stroke-width', '4.7');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('opacity', '0.42');
      g.appendChild(path);
    } else {
      for (var i = 0; i < CFG.particleCount; i++) {
        var c = document.createElementNS(SVG_NS, 'circle');
        c.setAttribute('fill', 'currentColor');
        g.appendChild(c);
        particles.push(c);
      }
    }

    if (label) {
      var lab = document.createElement('div');
      lab.className = 'tx-lemni__label';
      lab.textContent = label;
      wrap.appendChild(lab);
    }

    host.innerHTML = '';
    host.appendChild(wrap);
    if (!reduce) { instances.push({ g: g, particles: particles }); kick(); }
  }

  var running = false;
  function frame(now) {
    var pulse = (now % CFG.pulseDurationMs) / CFG.pulseDurationMs;
    var detailScale = 0.52 + ((Math.sin(pulse * Math.PI * 2 + 0.55) + 1) / 2) * 0.48;
    var progress = (now % CFG.durationMs) / CFG.durationMs;
    for (var k = instances.length - 1; k >= 0; k--) {
      var inst = instances[k];
      if (!inst.g.isConnected) { instances.splice(k, 1); continue; }
      var ps = inst.particles;
      for (var i = 0; i < ps.length; i++) {
        var tailOffset = i / (CFG.particleCount - 1);
        var pt = point(norm(progress - tailOffset * CFG.trailSpan), detailScale);
        var fade = Math.pow(1 - tailOffset, 0.56);
        var node = ps[i];
        node.setAttribute('cx', pt.x.toFixed(2));
        node.setAttribute('cy', pt.y.toFixed(2));
        node.setAttribute('r', (0.9 + fade * 2.7).toFixed(2));
        node.setAttribute('opacity', (0.04 + fade * 0.96).toFixed(3));
      }
    }
    if (!instances.length) { running = false; return; }
    requestAnimationFrame(frame);
  }
  function kick() {
    if (running || reduce || !instances.length) return;
    running = true;
    requestAnimationFrame(frame);
  }

  function upgrade(el) {
    if (!el || el.getAttribute('data-tx-init')) return;
    build(el);
  }
  function scan(root) {
    var list = (root || document).querySelectorAll('[data-tx-loader]:not([data-tx-init])');
    for (var i = 0; i < list.length; i++) upgrade(list[i]);
  }
  function mount(el, opts) {
    if (!el) return null;
    opts = opts || {};
    el.setAttribute('data-tx-loader', '');
    if (opts.label != null) el.setAttribute('data-label', opts.label);
    if (opts.size) el.setAttribute('data-size', opts.size);
    el.removeAttribute('data-tx-init');
    build(el);
    return el;
  }
  function html(label, size) {
    return '<div class="tx-lemni-host' + (size ? ' tx-lemni-host--' + esc(size) : '') +
      '" data-tx-loader' +
      (label ? ' data-label="' + esc(label) + '"' : '') +
      (size ? ' data-size="' + esc(size) + '"' : '') + '></div>';
  }
  window.TXLoader = { mount: mount, html: html, scan: scan };

  function init() {
    scan(document);
    try {
      var mo = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var an = muts[i].addedNodes;
          for (var j = 0; j < an.length; j++) {
            var nd = an[j];
            if (nd.nodeType !== 1) continue;
            if (nd.hasAttribute && nd.hasAttribute('data-tx-loader') && !nd.getAttribute('data-tx-init')) upgrade(nd);
            if (nd.querySelectorAll) scan(nd);
          }
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    } catch (e) { /* no-op */ }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
