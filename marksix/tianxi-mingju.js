/* 天喜命局計分 · 一字一太極 v2 */
(function (global) {
  'use strict';
  var WX_G = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
  var ZWX = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
  var SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  var KE = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' };
  var WX_CLS = { 木: 'mu', 火: 'huo', 土: 'tu', 金: 'jin', 水: 'shui' };
  var CANG = {
    子: ['癸'], 丑: ['己', '癸', '辛'], 寅: ['甲', '丙', '戊'], 卯: ['乙'],
    辰: ['戊', '乙', '癸'], 巳: ['丙', '戊', '庚'], 午: ['丁', '己'], 未: ['己', '丁', '乙'],
    申: ['庚', '壬', '戊'], 酉: ['辛'], 戌: ['戊', '辛', '丁'], 亥: ['壬', '甲']
  };
  var WUHE = { 甲己: '土', 己甲: '土', 乙庚: '金', 庚乙: '金', 丙辛: '水', 辛丙: '水', 丁壬: '木', 壬丁: '木', 戊癸: '火', 癸戊: '火' };
  var HUA_YUE = {
    土: ['辰', '戌', '丑', '未', '午'],
    金: ['申', '酉', '巳', '丑'],
    水: ['亥', '子', '申', '辰'],
    木: ['寅', '卯', '亥', '未'],
    火: ['巳', '午', '寅', '戌']
  };
  var SANHE = [
    { wx: '水', zhi: ['申', '子', '辰'] },
    { wx: '木', zhi: ['亥', '卯', '未'] },
    { wx: '火', zhi: ['寅', '午', '戌'] },
    { wx: '金', zhi: ['巳', '酉', '丑'] }
  ];
  var SANHUI = [
    { wx: '木', zhi: ['寅', '卯', '辰'] },
    { wx: '火', zhi: ['巳', '午', '未'] },
    { wx: '金', zhi: ['申', '酉', '戌'] },
    { wx: '水', zhi: ['亥', '子', '丑'] }
  ];
  var LIUHE = { 子丑: '土', 丑子: '土', 寅亥: '木', 亥寅: '木', 卯戌: '火', 戌卯: '火', 辰酉: '金', 酉辰: '金', 巳申: '水', 申巳: '水', 午未: '土', 未午: '土' };
  var LIUCHONG = { 子午: 1, 午子: 1, 丑未: 1, 未丑: 1, 寅申: 1, 申寅: 1, 卯酉: 1, 酉卯: 1, 辰戌: 1, 戌辰: 1, 巳亥: 1, 亥巳: 1 };
  var KU_CHONG = { 辰戌: 1, 戌辰: 1, 丑未: 1, 未丑: 1 };
  var KU = { 辰: 1, 戌: 1, 丑: 1, 未: 1 };
  var SLOTS = [
    { key: 'yearG', lab: '年干', kind: 'gan', pillar: 0 },
    { key: 'monthG', lab: '月干', kind: 'gan', pillar: 1 },
    { key: 'dayG', lab: '日干', kind: 'gan', pillar: 2 },
    { key: 'hourG', lab: '時干', kind: 'gan', pillar: 3 },
    { key: 'yearZ', lab: '年支', kind: 'zhi', pillar: 0 },
    { key: 'monthZ', lab: '月支', kind: 'zhi', pillar: 1 },
    { key: 'dayZ', lab: '日支', kind: 'zhi', pillar: 2 },
    { key: 'hourZ', lab: '時支', kind: 'zhi', pillar: 3 }
  ];
  function relTo(srcWx, tgtWx) {
    if (!srcWx || !tgtWx) return '';
    if (srcWx === tgtWx) return '扶';
    if (SHENG[srcWx] === tgtWx) return '生';
    if (KE[srcWx] === tgtWx) return '克';
    if (SHENG[tgtWx] === srcWx) return '洩';
    if (KE[tgtWx] === srcWx) return '耗';
    return '';
  }
  function distMul(a, b) { return Math.abs(a - b) >= 2 ? 0.5 : 1; }
  function hasAll(zhis, need) { return need.every(function (z) { return zhis.indexOf(z) >= 0; }); }
  function huaYueOk(huaWx, yueZhi, zhis) {
    if ((HUA_YUE[huaWx] || []).indexOf(yueZhi) >= 0) return true;
    var i;
    for (i = 0; i < SANHE.length; i++) if (SANHE[i].wx === huaWx && hasAll(zhis, SANHE[i].zhi)) return true;
    for (i = 0; i < SANHUI.length; i++) if (SANHUI[i].wx === huaWx && hasAll(zhis, SANHUI[i].zhi)) return true;
    return false;
  }
  function countGan(gans, g) {
    var n = 0, i; for (i = 0; i < gans.length; i++) if (gans[i] === g) n++; return n;
  }
  function buildChars(pillars) {
    var y = pillars.year || '', mo = pillars.month || '', d = pillars.day || '', h = pillars.hour || '';
    var gans = [y.charAt(0), mo.charAt(0), d.charAt(0), h.charAt(0)];
    var zhis = [y.charAt(1), mo.charAt(1), d.charAt(1), h.charAt(1)];
    return {
      year: y, month: mo, day: d, hour: h, gans: gans, zhis: zhis, glyphs: gans.concat(zhis),
      yueZhi: zhis[1], cangYue: CANG[zhis[1]] || [],
      kuChong: !!(zhis.indexOf('辰') >= 0 && zhis.indexOf('戌') >= 0) || !!(zhis.indexOf('丑') >= 0 && zhis.indexOf('未') >= 0)
    };
  }
  function canHuaStems(ctx, i, j) {
    if (SLOTS[i].kind !== 'gan' || SLOTS[j].kind !== 'gan') return null;
    var hua = WUHE[ctx.gans[SLOTS[i].pillar] + ctx.gans[SLOTS[j].pillar]];
    if (!hua) return null;
    if (Math.abs(SLOTS[i].pillar - SLOTS[j].pillar) !== 1) return null;
    var a = ctx.gans[SLOTS[i].pillar], b = ctx.gans[SLOTS[j].pillar];
    if (countGan(ctx.gans, a) > 1 || countGan(ctx.gans, b) > 1) return null;
    if (!huaYueOk(hua, ctx.yueZhi, ctx.zhis)) return null;
    return hua;
  }
  function wxOf(ctx, idx, asWx) {
    if (asWx) return asWx;
    var sl = SLOTS[idx], g = ctx.glyphs[idx];
    return sl.kind === 'gan' ? (WX_G[g] || '') : (ZWX[g] || '');
  }
  function scoreOne(ctx, center) {
    var cSl = SLOTS[center], cGlyph = ctx.glyphs[center], cWx = wxOf(ctx, center);
    var lines = [], notes = [], i;
    var self = 10;
    if (ctx.kuChong && cWx === '土' && KU[cGlyph]) { self = 30; notes.push('四庫沖太極土30'); }
    lines.push({ key: cSl.key, lab: cSl.lab, glyph: cGlyph, wx: cWx, cls: WX_CLS[cWx] || '', rel: '太極', how: '底分', raw: self, mul: 1, signed: self, support: true });
    for (i = 0; i < 8; i++) {
      if (i === center) continue;
      var sl = SLOTS[i], glyph = ctx.glyphs[i], hua = canHuaStems(ctx, center, i);
      var srcWx = wxOf(ctx, i, hua || null), rel = relTo(srcWx, cWx), how = [], unit = 0, heke = false;
      if (hua) {
        how.push('化' + hua);
        if (rel === '生' || rel === '扶') unit = 10;
        else if (rel === '克' || rel === '洩' || rel === '耗') unit = -10;
      } else if (sl.kind === 'gan' && cSl.kind === 'gan' && WUHE[glyph + cGlyph]) {
        heke = true; unit = -20; rel = '合克'; how.push('合克');
      } else if (sl.kind === 'zhi' && cSl.kind === 'zhi' && LIUCHONG[glyph + cGlyph] && srcWx !== cWx) {
        unit = -20; rel = '沖克'; how.push('沖克');
      } else if (rel === '生' || rel === '扶') unit = 10;
      else if (rel === '克' || rel === '洩' || rel === '耗') unit = -10;
      if (ctx.kuChong && srcWx === '土' && !hua) {
        if (rel === '生' || rel === '扶') { unit += 10; how.push('庫沖土+'); }
        else if (rel === '克' || rel === '耗' || rel === '合克') {
          if (rel === '克' || rel === '耗') unit = -20;
          how.push('庫沖土−');
        }
      }
      var mul = 1;
      if (sl.kind === 'zhi' && sl.pillar === 1) { mul *= 2; how.push('月令×2'); }
      if (sl.kind === 'gan' && ctx.cangYue.indexOf(glyph) >= 0) { mul *= 2; how.push('透干×2'); }
      var raw = unit * mul;
      var adjacentChong = false, zj;
      if (sl.kind === 'zhi') {
        for (zj = 4; zj < 8; zj++) {
          if (zj === i) continue;
          if (Math.abs(SLOTS[zj].pillar - sl.pillar) !== 1) continue;
          var og = ctx.glyphs[zj];
          if (LIUCHONG[glyph + og] && !KU_CHONG[glyph + og] && ZWX[glyph] !== ZWX[og]) adjacentChong = true;
        }
        if (adjacentChong && rel !== '沖克' && rel !== '合克') { raw = raw / 2; how.push('貼沖÷2'); }
      }
      var dmul = distMul(sl.pillar, cSl.pillar);
      if (dmul !== 1) how.push('隔柱×0.5');
      var signed = raw * dmul;
      lines.push({ key: sl.key, lab: sl.lab, glyph: glyph, wx: srcWx, cls: WX_CLS[srcWx] || '', rel: rel || '—', how: how.join(' '), raw: raw, mul: dmul, signed: signed, support: signed > 0 });
    }
    var net = 0; lines.forEach(function (ln) { net += ln.signed; });
    return { center: center, glyph: cGlyph, wx: cWx, lab: cSl.lab, net: net, lines: lines, notes: notes };
  }
  function monthRelToDm(yueZhi, dmWx) { return relTo(ZWX[yueZhi] || '', dmWx); }
  function classifyNet(net, yueZhi, dmWx) {
    var band, ge, resolved = null, edgeNote = '';
    if (net < -60) { band = 'ji-ruo'; ge = '極弱格'; }
    else if (net > 60) { band = 'ji-wang'; ge = '極旺格'; }
    else if (net < -12) { band = 'ruo'; ge = '較弱格'; }
    else if (net > 12) { band = 'wang'; ge = '較旺格'; }
    else {
      ge = '中和交界';
      var tiao = '';
      if ('亥子丑'.indexOf(yueZhi) >= 0) tiao = '火';
      else if ('巳午未'.indexOf(yueZhi) >= 0) tiao = '水';
      var mr = monthRelToDm(yueZhi, dmWx);
      if (mr === '生' || mr === '扶') { resolved = 'wang'; edgeNote = '交界 · 月令生扶 → 按較旺'; }
      else { resolved = 'ruo'; edgeNote = '交界 · 月令克洩耗 → 按較弱'; }
      if (tiao) edgeNote = '調候為急要' + tiao + ' · ' + edgeNote;
      band = resolved;
    }
    return { ge: ge, band: band, resolved: resolved, edgeNote: edgeNote, tiaohou: ('亥子丑'.indexOf(yueZhi) >= 0 ? '火' : ('巳午未'.indexOf(yueZhi) >= 0 ? '水' : '')) };
  }
  function scoreMingJu(pillars) {
    if (!pillars) return null;
    var ctx = buildChars(pillars);
    var dm = pillars.dayMaster || ctx.gans[2];
    var dmWx = pillars.dayMasterWx || WX_G[dm] || '';
    var rows = [], i; for (i = 0; i < 8; i++) rows.push(scoreOne(ctx, i));
    var dmRow = rows[2], cls = classifyNet(dmRow.net, ctx.yueZhi, dmWx);
    var items = dmRow.lines.map(function (ln) {
      return { key: ln.key, lab: ln.lab, glyph: ln.glyph, wx: ln.wx, cls: ln.cls, rel: ln.rel, how: ln.how, abs: Math.abs(ln.signed), signed: ln.signed, support: ln.support };
    });
    return {
      layer: 1, ruleVersion: 'mingju-taiji-v2',
      pillars: { year: ctx.year, month: ctx.month, day: ctx.day, hour: ctx.hour },
      dayMaster: dm, dayMasterWx: dmWx, items: items, matrix: rows,
      posSum: items.filter(function (it) { return it.signed > 0; }).reduce(function (a, b) { return a + b.signed; }, 0),
      negSum: items.filter(function (it) { return it.signed < 0; }).reduce(function (a, b) { return a + Math.abs(b.signed); }, 0),
      score: dmRow.net, net: dmRow.net, mingGe: cls.ge, band: cls.band, edgeNote: cls.edgeNote, tiaohou: cls.tiaohou,
      zhuanGe: cls.band === 'ji-wang' ? ({ 土: '稼穣格', 木: '曲直格', 金: '從革格', 水: '潤下格', 火: '炎上格' }[dmWx] || '') : null,
      monthZhi: ctx.yueZhi, notes: dmRow.notes.concat(cls.edgeNote ? [cls.edgeNote] : ''),
      season: (global.TXMarkSixEngine && global.TXMarkSixEngine.seasonOf) ? global.TXMarkSixEngine.seasonOf(ctx.yueZhi) : '',
      dmWangShuai: (global.TXMarkSixEngine && global.TXMarkSixEngine.wangShuai) ? global.TXMarkSixEngine.wangShuai(dmWx, ctx.yueZhi) : ''
    };
  }
  function mingJuHTML(r, opt) {
    if (!r) return '';
    opt = opt || {};
    var rows = r.items.map(function (it) {
      var sg = it.signed > 0 ? ('+' + it.signed) : String(it.signed);
      var c = it.signed > 0 ? 'mj-plus' : (it.signed < 0 ? 'mj-minus' : '');
      return '<tr><td>' + it.lab + '</td><td class="wx-' + it.cls + '">' + it.glyph + '<i class="bz-shen">' + it.wx + '</i></td><td>' + it.rel + (it.how ? '<span class="mj-how">' + it.how + '</span>' : '') + '</td><td class="' + c + '">' + sg + '</td></tr>';
    }).join('');
    var geLine = '<b>' + r.mingGe + '</b>' + (r.zhuanGe ? ' · ' + r.zhuanGe : '');
    var note = (r.notes && r.notes.length) ? '<p class="yun-meta">' + r.notes.join(' · ') + '</p>' : '';
    var mx = '';
    if (r.matrix && r.matrix.length) {
      mx = '<details class="mj-matrix"><summary>八字交叉力量表（一字一太極）</summary><div style="overflow:auto"><table class="yun-table mj-table"><thead><tr><th>太極</th><th>淨分</th></tr></thead><tbody>' +
        r.matrix.map(function (row) {
          return '<tr><td>' + row.lab + ' ' + row.glyph + '</td><td class="' + (row.net >= 0 ? 'mj-plus' : 'mj-minus') + '">' + (row.net > 0 ? '+' : '') + row.net + '</td></tr>';
        }).join('') + '</tbody></table></div></details>';
    }
    var ref = '';
    if (opt.refs && global.TXMarkSixEngine && global.TXMarkSixEngine.wuxingRefHTML) ref = global.TXMarkSixEngine.wuxingRefHTML(r.monthZhi, r.dayMasterWx);
    return '<div class="yun-wrap mj-wrap"><div class="m6-block-title">命局分析 · 一字一太極</div>' +
      '<p class="yun-meta">以日干 <span class="wx-' + (WX_CLS[r.dayMasterWx] || '') + '">' + r.dayMaster + r.dayMasterWx + '</span> 為太極 · 生扶＋10／克洩耗−10／合克−20 · 月令×2 · 透干×2 · 隔柱×0.5<br>淨分 <b class="mj-score">' + r.net + '</b>　' + geLine +
      '<br><span class="mj-hint">&lt;−60 從弱 · −60～−12 較弱 · −12～＋12 交界 · ＋12～＋60 較旺 · &gt;＋60 專旺</span></p>' +
      '<div style="overflow:auto"><table class="yun-table mj-table"><thead><tr><th>位置</th><th>字</th><th>對日干</th><th>分</th></tr></thead><tbody>' + rows + '</tbody></table></div>' + note + mx + '</div>' + ref;
  }
  function install() {
    var E = global.TXMarkSixEngine || (global.TXMarkSixEngine = {});
    E.scoreMingJu = scoreMingJu; E.mingJuHTML = mingJuHTML; E.MINGJU_LAYER = 1; E.relToWx = relTo;
  }
  install();
})(typeof window !== 'undefined' ? window : globalThis);
