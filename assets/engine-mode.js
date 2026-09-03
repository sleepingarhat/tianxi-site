// 天喜公開預測運作模式（前端共用文案 + 初版／最終版標籤）
(function () {
  var RULES = [
    '公開四擇只有一套帳：已完場一律讀 prediction_log／hit-rate，唔用 live 重算。',
    '鎖係全日跟第一場。規格：第一場開跑前 1.5 小時鎖死整日四擇；鎖前可刷新，稱為初版。',
    '出卡跟鎖：T−1.5h 鎖完先出卡，目標 T−1h 發佈最終版（分場卡／Telegram）。',
    '而家程式已落地嘅鎖點：該賽日第一場賽果入庫後凍結。T−1.5h 鎖同 T−1h 出卡係已批規格，下季開鑼前接入開跑鐘。',
    '命中率、賽果頁、監控、賽後卡必須顯示同一套最終版；live LGB 只留研究路徑。'
  ];

  function edition(opts) {
    opts = opts || {};
    if (opts.settled || opts.frozen) {
      return {
        key: 'final',
        label: '最終版',
        note: opts.settled
          ? '已完場凍結 · 與 hit-rate／卡同一套'
          : '已鎖 · 不再跟 live 重算'
      };
    }
    return {
      key: 'draft',
      label: '初版',
      note: '未鎖 · 刷新有機會改四擇'
    };
  }

  function badgeHtml(ed) {
    if (!ed) return '';
    var cls = ed.key === 'final' ? 'is-final' : 'is-draft';
    return '<span class="tx-ed ' + cls + '" title="' + String(ed.note || '').replace(/"/g, '&quot;') + '">' +
      ed.label + '</span>';
  }

  function rulesListHtml() {
    return '<ol class="tx-ed-rules">' + RULES.map(function (r) {
      return '<li>' + r + '</li>';
    }).join('') + '</ol>';
  }

  function bannerHtml(ed) {
    ed = ed || edition({});
    return '<div class="tx-ed-banner">' +
      badgeHtml(ed) +
      '<span class="tx-ed-banner__note">' + String(ed.note || '') +
      ' · <a href="/engine/">引擎規則</a></span></div>';
  }

  function injectCss() {
    if (document.getElementById('tx-ed-css')) return;
    var s = document.createElement('style');
    s.id = 'tx-ed-css';
    s.textContent =
      '.tx-ed{display:inline-block;font-family:var(--font-mono,ui-monospace,monospace);font-weight:800;font-size:10px;letter-spacing:.08em;padding:2px 8px;border-radius:99px;border:1px solid var(--rule,#ccc);vertical-align:middle}' +
      '.tx-ed.is-final{color:#2E2108;border-color:#A07A1F;background:linear-gradient(180deg,#FFF4C2,#EBC964)}' +
      '.tx-ed.is-draft{color:var(--ink-mute,#666);background:transparent}' +
      '.tx-ed-rules{margin:8px 0 0;padding-left:18px;font-size:13px;line-height:1.7;color:var(--ink-soft,#444)}' +
      '.tx-ed-rules li{margin-bottom:6px}' +
      '.tx-ed-banner{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 0;font-size:12px;color:var(--ink-mute,#666)}' +
      '.tx-ed-banner__note a{color:var(--brown,#5C3A1E);font-weight:700;text-decoration:none}';
    document.head.appendChild(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectCss);
  } else {
    injectCss();
  }

  window.TX_ENGINE_MODE = {
    rules: RULES,
    edition: edition,
    badgeHtml: badgeHtml,
    rulesListHtml: rulesListHtml,
    bannerHtml: bannerHtml,
    injectCss: injectCss
  };
})();
