/* Tianxi race cards. */
(function (w) {
  'use strict';
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function nums(list, key) {
    key = key || 'horseNumber';
    return (list || []).map(function (p) { return p && p[key]; }).filter(function (x) { return x != null && x !== ''; }).map(String);
  }
  function styleLabel(p) {
    var s = p.runningStyle || p.styleLabel || p.style || '';
    if (s && /[放前中後]/.test(String(s))) return String(s).charAt(0);
    return '';
  }
  function horseMeta(p) {
    var bits = [];
    if (p.jockeyCh || p.jockey) bits.push(p.jockeyCh || p.jockey);
    if (p.trainerCh || p.trainer) bits.push(p.trainerCh || p.trainer);
    if (p.draw != null && p.draw !== '') bits.push('檔' + p.draw);
    var wt = p.actualWeight || p.declaredWeight || p.weight;
    if (wt != null && wt !== '') bits.push(String(wt).replace(/磅$/, '') + '磅');
    var st = styleLabel(p);
    if (st) bits.push(st);
    return bits.join(' · ');
  }
  function goldNums(list, hitSet) {
    return (list || []).map(function (n) {
      var on = hitSet && hitSet[String(n)];
      return '<span class="txc__n' + (on ? ' is-hit' : '') + '">' + esc(n) + '</span>';
    }).join('');
  }
  function money(v) {
    var n = Number(v);
    if (!isFinite(n) || n <= 0) return '';
    return '$' + n.toLocaleString('en-HK', { minimumFractionDigits: n % 1 ? 1 : 0, maximumFractionDigits: 1 });
  }
  function payoutMap(race) {
    var m = {}, raw = race.boxPayouts || race.dividends || race.payouts || [];
    if (Array.isArray(raw)) {
      raw.forEach(function (row) {
        var k = String(row.pool || row.name || row.code || '').toUpperCase();
        var amt = row.dividend || row.amount || row.payout || row.win;
        if (k && amt != null) m[k] = amt;
      });
    } else if (raw && typeof raw === 'object') {
      Object.keys(raw).forEach(function (k) { m[String(k).toUpperCase()] = raw[k]; });
    }
    return m;
  }
  function renderPre(race, ctx) {
    ctx = ctx || {};
    var picks = (race.picks || []).slice().sort(function (a, b) { return (a.rank || 99) - (b.rank || 99); }).slice(0, 4);
    var rows = picks.map(function (p, i) {
      var meta = horseMeta(p);
      return '<div class="txc__rk' + (i === 0 ? ' is-1' : '') + '">' + (i + 1) + '</div>' +
        '<div class="txc__no">' + esc(p.horseNumber) + '</div>' +
        '<div class="txc__nm">' + esc(p.nameCh || p.nameEn || '—') +
        (meta ? '<small>' + esc(meta) + '</small>' : '') + '</div>';
    }).join('');
    return '<article class="txc txc--pre">' +
      '<div class="txc__kicker">TX-ORACLE天喜引擎 · 賽前預測</div>' +
      '<h2 class="txc__title">' + esc(ctx.dateLabel || '') + '　' + esc(ctx.venue || '') + '　第 ' + esc(race.raceNumber) + ' 場</h2>' +
      '<div class="txc__meta">' + [race.distance && (race.distance + '米'), race.class && ('第' + race.class + '班'), race.track, race.going].filter(Boolean).map(esc).join(' · ') + '</div>' +
      '<div class="txc__grid txc__grid--pre">' + rows + '</div></article>';
  }
  function renderPost(race, ctx) {
    ctx = ctx || {};
    var pred = nums(race.predictedTop4 || (race.picks || []).slice(0, 4));
    var act4 = nums(race.actualTop4);
    var act3 = nums(race.actualTop3);
    var pset = {}; pred.forEach(function (n) { pset[String(n)] = true; });
    var both = {}; act4.forEach(function (n) { if (pset[String(n)]) both[String(n)] = true; });
    var hitn = Object.keys(both).length;
    var trio = act3.length === 3 && act3.every(function (n) { return pset[String(n)]; });
    var first4 = act4.length === 4 && act4.every(function (n) { return pset[String(n)]; });
    var win = act4[0] != null && String(act4[0]) === String(pred[0]);
    var pred2 = pred.slice(0, 2), act2 = act4.slice(0, 2);
    var quin = act2.length === 2 && pred2.slice().sort().join() === act2.slice().sort().join();
    var qp = pred2.length === 2 && pred2.every(function (n) { return act3.indexOf(String(n)) >= 0; });
    var pay = payoutMap(race);
    var winDiv = pay.WIN || pay['獨贏'];
    if (!winDiv && win && race.actualTop4 && race.actualTop4[0] && race.actualTop4[0].winOdds) winDiv = Number(race.actualTop4[0].winOdds) * 10;
    var hits = [];
    if (win) hits.push({ name: '頭馬', pay: winDiv });
    if (qp) hits.push({ name: '位置Q', pay: pay.QP || pay.PQ || pay.PLACEQ || pay['位置Q'] });
    if (quin) hits.push({ name: '連贏', pay: pay.QUINELLA || pay.QIN || pay['連贏'] });
    if (trio) hits.push({ name: '單T', pay: pay.TRIO || pay['單T'] });
    if (first4) hits.push({ name: '四連環', pay: pay.FF || pay.FIRST4 || pay['四連環'] });
    var hitHtml = hits.map(function (h) {
      var payTxt = money(h.pay);
      return '<div class="txc__hit"><span class="txc__hit-pool">' + esc(h.name) + '</span><span class="txc__hit-ok">命中</span>' +
        (payTxt ? '<span class="txc__hit-pay">' + esc(payTxt) + '</span><span class="txc__hit-unit">$10一注</span>' : '') + '</div>';
    }).join('');
    return '<article class="txc txc--post">' +
      '<div class="txc__kicker">TX-ORACLE天喜引擎 · 預測與賽果比對</div>' +
      '<h2 class="txc__title">' + esc(ctx.dateLabel || '') + '　' + esc(ctx.venue || '') + '　第 ' + esc(race.raceNumber) + ' 場</h2>' +
      '<div class="txc__vs"><div class="txc__col"><h4>模型首四</h4><div class="txc__nums">' + goldNums(pred, both) + '</div></div>' +
      '<div class="txc__mid">命中<br>' + hitn + '/4</div>' +
      '<div class="txc__col"><h4>賽果頭四</h4><div class="txc__nums">' + goldNums(act4, both) + '</div></div></div>' +
      (hitHtml ? '<div class="txc__hits">' + hitHtml + '</div>' : '') + '</article>';
  }
  w.TXRaceCard = { renderPre: renderPre, renderPost: renderPost };
})(window);
