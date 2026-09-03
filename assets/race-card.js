/* Tianxi per-race cards. Official HKJC pool names only. */
(function (w) {
  'use strict';
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pct(v) {
    if (v == null || v === '') return '—';
    var n = Number(v);
    if (!isFinite(n)) return '—';
    if (n <= 1) n = n * 100;
    return (Math.round(n * 10) / 10) + '%';
  }
  function nums(list, key) {
    key = key || 'horseNumber';
    return (list || []).map(function (p) { return p && p[key]; }).filter(function (x) { return x != null && x !== ''; });
  }
  function horseLine(p) {
    var no = p.horseNumber != null ? p.horseNumber : '';
    var nm = p.nameCh || p.nameEn || '—';
    var meta = [];
    if (p.draw != null) meta.push('檔' + p.draw);
    if (p.jockeyCh) meta.push(p.jockeyCh);
    return { no: no, nm: nm, meta: meta.join(' · '), pWin: p.pWin, pTop3: p.pTop3 };
  }
  function renderPre(race, ctx) {
    ctx = ctx || {};
    var picks = (race.picks || []).slice().sort(function (a, b) { return (a.rank || 99) - (b.rank || 99); }).slice(0, 4);
    var rows = picks.map(function (p, i) {
      var h = horseLine(p);
      return '<div class="txc__rk' + (i === 0 ? ' is-1' : '') + '">' + (i + 1) + '</div>' +
        '<div class="txc__no">' + esc(h.no) + '</div>' +
        '<div class="txc__nm">' + esc(h.nm) + (h.meta ? '<small>' + esc(h.meta) + '</small>' : '') + '</div>' +
        '<div class="txc__pct">' + esc(pct(h.pWin)) + '</div>';
    }).join('');
    var box4 = picks.map(function (p) { return p.horseNumber; }).filter(Boolean);
    return '<article class="txc txc--pre">' +
      '<div class="txc__kicker">TX-Oracle · 賽前預測卡</div>' +
      '<h2 class="txc__title">' + esc(ctx.dateLabel || '') + '　' + esc(ctx.venue || '') + '　第 ' + esc(race.raceNumber) + ' 場</h2>' +
      '<div class="txc__meta">' + [race.distance && (race.distance + '米'), race.class && ('第' + race.class + '班'), race.track, race.going].filter(Boolean).map(esc).join(' · ') + '</div>' +
      '<div class="txc__grid"><div class="hd"></div><div class="hd">馬號</div><div class="hd">模型排序</div><div class="hd">獨贏機率</div>' + rows + '</div>' +
      '<div class="txc__sec"><h3>單T箱 · 毋須順序</h3><div class="txc__chips">' + box4.slice(0, 4).map(function (n) { return '<span class="txc__chip">' + esc(n) + '</span>'; }).join('') + '</div>' +
      '<p class="txc__note">單T＝頭三名毋須順序。三重彩＝頭三名必須順序。兩彩池唔同。</p></div>' +
      '</article>';
  }
  function renderPost(race, ctx) {
    ctx = ctx || {};
    var pred = nums(race.predictedTop4 || (race.picks || []).slice(0, 4));
    var act4 = nums(race.actualTop4);
    var act3 = nums(race.actualTop3);
    var pset = {};
    pred.forEach(function (n) { pset[String(n)] = true; });
    var overlap4 = act4.filter(function (n) { return pset[String(n)]; }).length;
    var trio = act3.length === 3 && act3.every(function (n) { return pset[String(n)]; });
    var first4 = act4.length === 4 && act4.every(function (n) { return pset[String(n)]; });
    var win = act4[0] != null && String(act4[0]) === String(pred[0]);
    var pred2 = pred.slice(0, 2), act2 = act4.slice(0, 2);
    var quin = act2.length === 2 && pred2.slice().map(String).sort().join() === act2.map(String).sort().join();
    var qp = pred2.length === 2 && pred2.every(function (n) { return act3.map(String).indexOf(String(n)) >= 0; });
    function pool(name, hint, ok) {
      return '<div class="txc__pool' + (ok ? ' is-hit' : ' is-miss') + '"><b>' + esc(name) + '</b><span>' + (ok ? '中' : '唔中') + ' · ' + esc(hint) + '</span></div>';
    }
    return '<article class="txc txc--post">' +
      '<div class="txc__kicker">TX-Oracle · 預測與結果對賬卡</div>' +
      '<h2 class="txc__title">' + esc(ctx.dateLabel || '') + '　' + esc(ctx.venue || '') + '　第 ' + esc(race.raceNumber) + ' 場</h2>' +
      '<div class="txc__vs"><div class="txc__col"><h4>模型首四</h4><div class="txc__nums">' + esc(pred.join('　') || '—') + '</div></div>' +
      '<div class="txc__mid">重疊<br>' + overlap4 + '/4</div>' +
      '<div class="txc__col"><h4>實際頭四</h4><div class="txc__nums">' + esc(act4.join('　') || '—') + '</div></div></div>' +
      '<div class="txc__pools">' +
        pool('頭馬', '模型首選', win) +
        pool('位置Q', '首兩選入頭三', qp) +
        pool('連贏', '首兩選即頭兩 · 毋須順序', quin) +
        pool('單T', '首四入三隻頭三 · 毋須順序', trio) +
        pool('四連環', '首四即頭四 · 毋須順序', first4) +
      '</div>' +
      '<p class="txc__note">單T＝頭三毋須順序；三重彩＝頭三必須順序。本卡唔將模型箱當成三重彩注項。</p></article>';
  }
  w.TXRaceCard = { renderPre: renderPre, renderPost: renderPost, pct: pct };
})(window);
