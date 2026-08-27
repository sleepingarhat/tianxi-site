/* 天喜命局計分 · 第 1 層 */
(function (global) {
  'use strict';
  var WX_G = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
  var ZWX = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
  var SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  var KE = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' };
  var WX_CLS = { 木: 'mu', 火: 'huo', 土: 'tu', 金: 'jin', 水: 'shui' };
  var WEIGHT = { yearG: 10, monthG: 10, dayG: 10, hourG: 10, yearZ: 5, hourZ: 5, monthZ: 35, dayZ: 15 };
  var SANHE = [
    { name: '申子辰', wx: '水', zhi: ['申', '子', '辰'] },
    { name: '亥卯未', wx: '木', zhi: ['亥', '卯', '未'] },
    { name: '寅午戌', wx: '火', zhi: ['寅', '午', '戌'] },
    { name: '巳酉丑', wx: '金', zhi: ['巳', '酉', '丑'] }
  ];
  var TOMB = { 辰: 1, 戌: 1, 丑: 1, 未: 1 };
  var JI_WANG = { 土: '稼穣格', 木: '曲直格', 金: '從革格', 水: '潤下格', 火: '炎上格' };
  function relToDm(srcWx, dmWx) {
    if (!srcWx || !dmWx) return '';
    if (srcWx === dmWx) return '扶';
    if (SHENG[srcWx] === dmWx) return '生';
    if (KE[srcWx] === dmWx) return '克';
    if (SHENG[dmWx] === srcWx) return '泄';
    if (KE[dmWx] === srcWx) return '耗';
    return '';
  }
  function isSupport(rel) { return rel === '生' || rel === '扶'; }
  function detectSanhe(zhis) {
    var set = {}; zhis.forEach(function (z) { if (z) set[z] = 1; });
    var hits = [];
    SANHE.forEach(function (h) { if (h.zhi.every(function (z) { return set[z]; })) hits.push(h); });
    return hits;
  }
  function classify(score) {
    if (score < 15) return { ge: '極弱格', band: 'ji-ruo' };
    if (score > 85) return { ge: '極旺格', band: 'ji-wang' };
    if (score < 50) return { ge: '較弱格', band: 'ruo' };
    if (score > 50) return { ge: '較旺格', band: 'wang' };
    return { ge: '較弱／較旺交界', band: 'edge' };
  }
  function scoreMingJu(pillars, opt) {
    opt = opt || {};
    if (!pillars) return null;
    var y = pillars.year || '', mo = pillars.month || '', d = pillars.day || '', h = pillars.hour || '';
    var gans = [y.charAt(0), mo.charAt(0), d.charAt(0), h.charAt(0)];
    var zhis = [y.charAt(1), mo.charAt(1), d.charAt(1), h.charAt(1)];
    var dm = pillars.dayMaster || gans[2];
    var dmWx = pillars.dayMasterWx || WX_G[dm] || '';
    var dayNum = opt.day || opt.dayOfMonth || 15;
    var notes = [];
    var sanhe = detectSanhe(zhis);
    var heMap = {};
    sanhe.forEach(function (hh) { hh.zhi.forEach(function (z) { heMap[z] = hh.wx; }); notes.push('三合' + hh.name + '化' + hh.wx); });
    var tombs = zhis.filter(function (z) { return TOMB[z] && !heMap[z]; });
    if (tombs.length) notes.push(tombs.join('、') + '本氣作土計分；雜氣比例待「四季月五行特性」再拆');
    var slots = [
      { key: 'yearG', lab: '年干', glyph: gans[0], kind: 'gan' }, { key: 'monthG', lab: '月干', glyph: gans[1], kind: 'gan' },
      { key: 'dayG', lab: '日干', glyph: gans[2], kind: 'gan' }, { key: 'hourG', lab: '時干', glyph: gans[3], kind: 'gan' },
      { key: 'yearZ', lab: '年支', glyph: zhis[0], kind: 'zhi' }, { key: 'monthZ', lab: '月支', glyph: zhis[1], kind: 'zhi' },
      { key: 'dayZ', lab: '日支', glyph: zhis[2], kind: 'zhi' }, { key: 'hourZ', lab: '時支', glyph: zhis[3], kind: 'zhi' }
    ];
    var items = slots.map(function (s) {
      var wx, how = '';
      if (s.kind === 'gan') wx = WX_G[s.glyph] || '';
      else if (heMap[s.glyph]) { wx = heMap[s.glyph]; how = '三合'; }
      else { wx = ZWX[s.glyph] || ''; if (TOMB[s.glyph]) how = '本氣土'; }
      var rel = s.key === 'dayG' ? '扶' : relToDm(wx, dmWx);
      var abs = WEIGHT[s.key] || 0;
      var support = s.key === 'dayG' ? true : isSupport(rel);
      var signed = support ? abs : -abs;
      var state = (global.TXMarkSixEngine && global.TXMarkSixEngine.wangShuai) ? global.TXMarkSixEngine.wangShuai(wx, zhis[1]) : '';
      return { key: s.key, lab: s.lab, glyph: s.glyph, wx: wx, cls: WX_CLS[wx] || '', rel: rel, how: how, abs: abs, signed: signed, support: support, state: state };
    });
    var posSum = 0, negSum = 0;
    items.forEach(function (it) { if (it.support) posSum += it.abs; else negSum += it.abs; });
    var score = posSum;
    var cls = classify(score);
    if (score === 15 || score === 50 || score === 85) notes.push('得分恰為' + score + '，需詳析含雜氣之地支');
    var zhuan = cls.band === 'ji-wang' ? (JI_WANG[dmWx] || '') : null;
    return {
      layer: 1, ruleVersion: 'mingju-l1c-wuxing-ref',
      pillars: { year: y, month: mo, day: d, hour: h },
      dayMaster: dm, dayMasterWx: dmWx, dayOfMonth: dayNum,
      items: items, posSum: posSum, negSum: negSum, score: score,
      mingGe: cls.ge, band: cls.band, zhuanGe: zhuan,
      sanhe: sanhe.map(function (hh) { return hh.name + '→' + hh.wx; }),
      notes: notes, nextLayers: ['原局生克制化刑沖合害', '流年大運計分'],
      monthZhi: zhis[1],
      season: (global.TXMarkSixEngine && global.TXMarkSixEngine.seasonOf) ? global.TXMarkSixEngine.seasonOf(zhis[1]) : '',
      dmWangShuai: (global.TXMarkSixEngine && global.TXMarkSixEngine.wangShuai) ? global.TXMarkSixEngine.wangShuai(dmWx, zhis[1]) : ''
    };
  }
  function mingJuHTML(r) {
    if (!r) return '';
    var rows = r.items.map(function (it) {
      var sg = it.signed > 0 ? ('+' + it.signed) : String(it.signed);
      var c = it.support ? 'mj-plus' : 'mj-minus';
      return '<tr><td>' + it.lab + '</td><td class="wx-' + it.cls + '">' + it.glyph + '<i class="bz-shen">' + it.wx + (it.state || '') + '</i></td><td>' + it.rel + (it.how ? '<span class="mj-how">' + it.how + '</span>' : '') + '</td><td class="' + c + '">' + sg + '</td></tr>';
    }).join('');
    var geLine = '<b>' + r.mingGe + '</b>' + (r.zhuanGe ? ' · ' + r.zhuanGe : '');
    var note = (r.notes && r.notes.length) ? '<p class="yun-meta">' + r.notes.join(' · ') + '</p>' : '';
    var ref = (global.TXMarkSixEngine && global.TXMarkSixEngine.wuxingRefHTML) ? global.TXMarkSixEngine.wuxingRefHTML(r.monthZhi, r.dayMasterWx) : '';
    return '<div class="yun-wrap mj-wrap"><div class="m6-block-title">命局分析 · 第 1 層</div><p class="yun-meta">以日干 <span class="wx-' + (WX_CLS[r.dayMasterWx] || '') + '">' + r.dayMaster + r.dayMasterWx + '</span> 為核心 · 生扶為正、克泄耗為負 · 日干永取正分<br>得分（正分之和）<b class="mj-score">' + r.score + '</b>　' + geLine + '<br><span class="mj-hint">較弱 15–50 · 較旺 50–85 · 極弱 <15 · 極旺 >85</span></p><div style="overflow:auto"><table class="yun-table mj-table"><thead><tr><th>位置</th><th>字</th><th>對日干</th><th>分</th></tr></thead><tbody>' + rows + '</tbody></table></div>' + note + '<p class="yun-meta">下層未計：' + (r.nextLayers || []).join('、') + '</p></div>' + ref;
  }
  function install() {
    var E = global.TXMarkSixEngine || (global.TXMarkSixEngine = {});
    E.scoreMingJu = scoreMingJu; E.mingJuHTML = mingJuHTML; E.MINGJU_LAYER = 1;
  }
  install();
})(typeof window !== 'undefined' ? window : globalThis);
