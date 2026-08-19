/* ================================================================
   天喜 TIANXI · Theme controller (2026-04-29 constitutional)
   ----------------------------------------------------------------
   Responsibilities
   1. No-flash theme init — must be the FIRST script in <head>
      (before any stylesheet paint) so data-theme is set synchronously.
   2. Three-state localStorage key `tx-theme` ∈ {'light','dark','auto'}
      default = 'auto' (follow prefers-color-scheme)
   3. Circular-expansion toggle animation (no external deps) —
      inspired by @magicui/animated-theme-toggler, pure CSS clip-path.
   ================================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'tx-theme';
  var VALID = ['light', 'dark', 'auto'];

  function getStored() {
    try {
      var v = window.localStorage.getItem(STORAGE_KEY);
      return VALID.indexOf(v) >= 0 ? v : 'auto';
    } catch (e) { return 'auto'; }
  }

  function systemPref() {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (e) { return 'light'; }
  }

  function resolve(setting) {
    return setting === 'auto' ? systemPref() : setting;
  }

  function apply(setting) {
    var effective = resolve(setting);
    var root = document.documentElement;
    if (effective === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    root.setAttribute('data-theme-setting', setting);
  }

  /* ---- sync bootstrap (runs immediately) ---- */
  apply(getStored());

  /* ---- react to system changes when setting=auto ---- */
  try {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function () { if (getStored() === 'auto') apply('auto'); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  } catch (e) { /* no-op */ }

  /* ---- expose controller ---- */
  var Tx = {
    get: getStored,
    resolve: function () { return resolve(getStored()); },
    set: function (v) {
      if (VALID.indexOf(v) < 0) return;
      try { window.localStorage.setItem(STORAGE_KEY, v); } catch (e) { /* ignore */ }
      apply(v);
      document.dispatchEvent(new CustomEvent('tx:themechange', {
        detail: { setting: v, effective: resolve(v) }
      }));
    },
    cycle: function () {
      /* light → dark → auto → light */
      var order = { light: 'dark', dark: 'auto', auto: 'light' };
      this.set(order[getStored()] || 'light');
    },
    /* Animated toggle (circular expansion from a click origin).
       Usage: TxTheme.toggleAnimated(ev) from a button click handler. */
    toggleAnimated: function (evt) {
      var next = resolve(getStored()) === 'dark' ? 'light' : 'dark';
      var el = evt && evt.currentTarget;
      if (!el || !document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.set(next);
        return;
      }
      /* View Transitions API — browsers that support it get smooth circular wipe */
      var rect = el.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var maxR = Math.hypot(
        Math.max(cx, window.innerWidth - cx),
        Math.max(cy, window.innerHeight - cy)
      );
      /* inject one-shot keyframes */
      var styleId = 'tx-theme-vt-style';
      var existing = document.getElementById(styleId);
      if (existing) existing.remove();
      var s = document.createElement('style');
      s.id = styleId;
      s.textContent =
        '::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal;}' +
        '::view-transition-new(root){' +
          'animation:tx-clip 520ms cubic-bezier(.2,.6,.2,1);' +
        '}' +
        '::view-transition-old(root){animation:none;}' +
        '@keyframes tx-clip{' +
          'from{clip-path:circle(0 at ' + cx + 'px ' + cy + 'px);}' +
          'to{clip-path:circle(' + maxR + 'px at ' + cx + 'px ' + cy + 'px);}' +
        '}';
      document.head.appendChild(s);
      var self = this;
      var t = document.startViewTransition(function () { self.set(next); });
      if (t && t.finished && t.finished.then) {
        t.finished.then(function () { s.remove(); }, function () { s.remove(); });
      }
    }
  };
  window.TxTheme = Tx;

  /* ---- wire up any [data-tx-theme-toggle] buttons after DOM/shell ready ---- */
  function reflectToggles(effective) {
    var buttons = document.querySelectorAll('[data-tx-theme-toggle]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', String(effective === 'dark'));
      buttons[i].setAttribute('aria-label', effective === 'dark' ? '切換至淺色模式' : '切換至深色模式');
    }
  }
  function wireToggles() {
    var buttons = document.querySelectorAll('[data-tx-theme-toggle]');
    for (var i = 0; i < buttons.length; i++) {
      (function (btn) {
        if (btn.dataset.txWired) return;
        btn.dataset.txWired = '1';
        btn.addEventListener('click', function (e) { Tx.toggleAnimated(e); });
      })(buttons[i]);
    }
    reflectToggles(resolve(getStored()));
  }
  document.addEventListener('tx:themechange', function (e) {
    reflectToggles(e && e.detail ? e.detail.effective : resolve(getStored()));
  });
  /* shell.js injects its toggle after theme.js has registered DOMContentLoaded. */
  document.addEventListener('tx:shellready', wireToggles);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireToggles);
  } else {
    wireToggles();
  }
})();
