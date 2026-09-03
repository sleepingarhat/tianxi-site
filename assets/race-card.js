/* Tianxi race cards — product voice, no pool tutorials. */
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
    if (s && /^(?:\u653e|\u524d|\u4e2d|\u5f8c)/.test(String(s))) return String(s).charAt(0);
    return '';
  }
  function horseMeta(p) {
    var bits = [];
    if (p.jockeyCh || p.jockey) bits.push(p.jockeyCh || p.jockey);
    if (p.trainerCh || p.trainer) bits.push(p.trainerCh || p.trainer);
    if (p.draw != null && p.draw !== '') bits.push('\u6a94' + p.draw);
    var wt = p.actualWeight || p.declaredWeight || p.weight;
    if (wt != null && wt !== '') bits.push(String(wt).replace(/\u78c5$/, '') + '\u78c5');
    var st = styleLabel(p);
    if (st) bits.push(st);
    return bits.join(' \u00b7 ');
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
        '<div class="txc__nm">' + esc(p.nameCh || p.nameEn || '\u2014') +
        (meta ? '<small>' + esc(meta) + '</small>' : '') + '</div>';
    }).join('');
    return '<article class="txc txc--pre">' +
      '<div class="txc__kicker">TX-ORACLE\u5929\u559c\u5f15\u64ce \u00b7 \u8cfd\u524d\u9810\u6e2c</div>' +
      '<h2 class="txc__title">' + esc(ctx.dateLabel || '') + '\u3000' + esc(ctx.venue || '') + '\u3000\u7b2c ' + esc(race.raceNumber) + ' \u5834</h2>' +
      '<div class="txc__meta">' + [race.distance && (race.distance + '\u7c73'), race.class && ('\u7b2c' + race.class + '\u73ed'), race.track, race.going].filter(Boolean).map(esc).join(' \u00b7 ') + '</div>' +
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
    var winDiv = pay.WIN || pay['\u7368\u8d0f'];
    if (!winDiv && win && race.actualTop4 && race.actualTop4[0] && race.actualTop4[0].winOdds) winDiv = Number(race.actualTop4[0].winOdds) * 10;
    var hits = [];
    if (win) hits.push({ name: '\u982d\u99ac', pay: winDiv });
    if (qp) hits.push({ name: '\u4f4d\u7f6eQ', pay: pay.QP || pay.PQ || pay.PLACEQ || pay['\u4f4d\u7f6eQ'] });
    if (quin) hits.push({ name: '\u9023\u8d0f', pay: pay.QUINELLA || pay.QIN || pay['\u9023\u8d0f'] });
    if (trio) hits.push({ name: '\u55aeT', pay: pay.TRIO || pay['\u55aeT'] });
    if (first4) hits.push({ name: '\u56db\u9023\u74b0', pay: pay.FF || pay.FIRST4 || pay['\u56db\u9023\u74b0'] });
    var hitHtml = hits.map(function (h) {
      var payTxt = money(h.pay);
      return '<div class="txc__hit"><span class="txc__hit-pool">' + esc(h.name) + '</span><span class="txc__hit-ok">\u547d\u4e2d</span>' +
        (payTxt ? '<span class="txc__hit-pay">' + esc(payTxt) + '</span><span class="txc__hit-unit">$10\u4e00\u6ce8</span>' : '') + '</div>';
    }).join('');
    return '<article class="txc txc--post">' +
      '<div class="txc__kicker">TX-ORACLE\u5929\u559c\u5f15\u64ce \u00b7 \u9810\u6e2c\u8207\u8cfd\u679c\u6bd4\u5c0d</div>' +
      '<h2 class="txc__title">' + esc(ctx.dateLabel || '') + '\u3000' + esc(ctx.venue || '') + '\u3000\u7b2c ' + esc(race.raceNumber) + ' \u5834</h2>' +
      '<div class="txc__vs"><div class="txc__col"><h4>\u6a21\u578b\u9996\u56db</h4><div class="txc__nums">' + goldNums(pred, both) + '</div></div>' +
      '<div class="txc__mid">\u547d\u4e2d<br>' + hitn + '/4</div>' +
      '<div class="txc__col"><h4>\u8cfd\u679c\u982d\u56db</h4><div class="txc__nums">' + goldNums(act4, both) + '</div></div></div>' +
      (hitHtml ? '<div class="txc__hits">' + hitHtml + '</div>' : '') + '</article>';
  }
  w.TXRaceCard = { renderPre: renderPre, renderPost: renderPost };
})(window);
