/* 月令佔盤 p% · 令黨=月支+月令透干 */
(function (global) {
  'use strict';
  var CANG = {
    子: ['癸'], 丑: ['己', '癸', '辛'], 寅: ['甲', '丙', '戊'], 卯: ['乙'],
    辰: ['戊', '乙', '癸'], 巳: ['丙', '戊', '庚'], 午: ['丁', '己'], 未: ['己', '丁', '乙'],
    申: ['庚', '壬', '戊'], 酉: ['辛'], 戌: ['戊', '辛', '丁'], 亥: ['壬', '甲']
  };
  var LIUHE = { 子丑: 1, 丑子: 1, 寅亥: 1, 亥寅: 1, 卯戌: 1, 戌卯: 1, 辰酉: 1, 酉辰: 1, 巳申: 1, 申巳: 1, 午未: 1, 未午: 1 };
  var LIUCHONG = { 子午: 1, 午子: 1, 丑未: 1, 未丑: 1, 寅申: 1, 申寅: 1, 卯酉: 1, 酉卯: 1, 辰戌: 1, 戌辰: 1, 巳亥: 1, 亥巳: 1 };
  var SANHE = [['申', '子', '辰'], ['亥', '卯', '未'], ['寅', '午', '戌'], ['巳', '酉', '丑']];
  var SANHUI = [['寅', '卯', '辰'], ['巳', '午', '未'], ['申', '酉', '戌'], ['亥', '子', '丑']];
  function hasAll(zhis, need) {
    return need.every(function (z) { return zhis.indexOf(z) >= 0; });
  }
  function monthPct(zhis) {
    var yue = zhis[1], p = 50, note = '月令基準50%', i;
    var hui = false, he = false, liu = false, chong = false;
    for (i = 0; i < SANHUI.length; i++) if (SANHUI[i].indexOf(yue) >= 0 && hasAll(zhis, SANHUI[i])) hui = true;
    for (i = 0; i < SANHE.length; i++) if (SANHE[i].indexOf(yue) >= 0 && hasAll(zhis, SANHE[i])) he = true;
    for (i = 0; i < zhis.length; i++) {
      if (zhis[i] && LIUHE[yue + zhis[i]]) liu = true;
      if (zhis[i] && LIUCHONG[yue + zhis[i]]) chong = true;
    }
    if (hui) { p = 70; note = '月令三會70%'; }
    else if (he) { p = 65; note = '月令三合65%'; }
    else if (liu) { p = 40; note = chong ? '月令會合解沖40%' : '月令六合40%'; }
    else if (chong) { p = 30; note = '月令被沖30%'; }
    return { p: p, note: note };
  }
  function isLing(it, yueZhi) {
    if (it.rel === '太極') return false;
    if (it.key === 'monthZ') return true;
    if (!it.key || it.key.charAt(it.key.length - 1) !== 'G') return false;
    return (CANG[yueZhi] || []).indexOf(it.glyph) >= 0;
  }
  function rescale(items, p) {
    var a = 0, b = 0;
    items.forEach(function (it) {
      if (isLing(it, items._yue)) a += Math.abs(it.signed);
      else b += Math.abs(it.signed);
    });
    var tot = a + b;
    if (tot <= 0) return items;
    var r = a / tot;
    var kL = r > 0 ? p / r : 1;
    var kR = (1 - r) > 0 ? (1 - p) / (1 - r) : 1;
    items.forEach(function (it) {
      var k = isLing(it, items._yue) ? kL : kR;
      it.signed = Math.round(it.signed * k * 10) / 10;
      it.abs = Math.abs(it.signed);
      it.support = it.signed > 0;
    });
    return items;
  }
  function classify(net, yueZhi, dmWx) {
    var E = global.TXMarkSixEngine;
    var rel = (E && E.relToWx) ? E.relToWx(({ 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' }[yueZhi] || ''), dmWx) : '';
    if (net < -60) return { ge: '極弱格', band: 'ji-ruo' };
    if (net > 60) return { ge: '極旺格', band: 'ji-wang' };
    if (net < -12) return { ge: '較弱格', band: 'ruo' };
    if (net > 12) return { ge: '較旺格', band: 'wang' };
    var wang = rel === '生' || rel === '扶';
    return { ge: '中和交界', band: wang ? 'wang' : 'ruo', edgeNote: wang ? '交界 · 月令生扶 → 按較旺' : '交界 · 月令克洩耗 → 按較弱' };
  }
  function install() {
    var E = global.TXMarkSixEngine || (global.TXMarkSixEngine = {});
    if (E._ling50) return;
    var orig = E.scoreMingJu;
    if (!orig) return;
    E.scoreMingJu = function (pillars) {
      var r = orig(pillars);
      if (!r || !r.items) return r;
      var zhis = [r.pillars.year.charAt(1), r.pillars.month.charAt(1), r.pillars.day.charAt(1), r.pillars.hour.charAt(1)];
      var mp = monthPct(zhis);
      r.items._yue = zhis[1];
      rescale(r.items, mp.p / 100);
      r.net = 0;
      r.items.forEach(function (it) { r.net += it.signed; });
      r.net = Math.round(r.net * 10) / 10;
      r.score = r.net;
      var cls = classify(r.net, zhis[1], r.dayMasterWx);
      r.mingGe = cls.ge;
      r.band = cls.band;
      if (cls.edgeNote) r.edgeNote = cls.edgeNote;
      r.lingPct = mp.p;
      r.lingNote = mp.note;
      r.ruleVersion = 'mingju-taiji-v2-ling50';
      r.notes = (r.notes || []).concat([mp.note]);
      if (r.matrix) {
        r.matrix.forEach(function (row) {
          if (!row.lines) return;
          row.lines._yue = zhis[1];
          rescale(row.lines, mp.p / 100);
          row.net = 0;
          row.lines.forEach(function (ln) { row.net += ln.signed; });
          row.net = Math.round(row.net * 10) / 10;
        });
      }
      return r;
    };
    var html = E.mingJuHTML;
    if (html) {
      E.mingJuHTML = function (r, opt) {
        var s = html(r, opt);
        if (!r || r.lingPct == null) return s;
        return s.replace('月令×2 · 透干×2 · 隔柱×0.5', '透干×2 · 隔柱×0.5 · 月令佔盤' + r.lingPct + '%');
      };
    }
    E._ling50 = true;
  }
  install();
})(typeof window !== 'undefined' ? window : globalThis);
