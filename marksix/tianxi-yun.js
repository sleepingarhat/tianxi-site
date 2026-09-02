/* 第 2 層運氣 · 流運分（角色 + 引化 + 三合半合加分；不改原局淨分／喜用） */
(function (global) {
  'use strict';
  var WX_G = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
  var ZWX = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
  var SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  var KE = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' };
  var WX_CLS = { 木: 'mu', 火: 'huo', 土: 'tu', 金: 'jin', 水: 'shui' };
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
  var BANHE = {
    申子: '水', 子申: '水', 子辰: '水', 辰子: '水',
    亥卯: '木', 卯亥: '木', 卯未: '木', 未卯: '木',
    寅午: '火', 午寅: '火', 午戌: '火', 戌午: '火',
    巳酉: '金', 酉巳: '金', 酉丑: '金', 丑酉: '金'
  };
  var HUI_BIHE = {
    寅卯: 1, 卯寅: 1, 卯辰: 1, 辰卯: 1,
    巳午: 1, 午巳: 1, 午未: 1, 未午: 1,
    申酉: 1, 酉申: 1, 酉戌: 1, 戌酉: 1,
    亥子: 1, 子亥: 1, 子丑: 1, 丑子: 1
  };
  var LIUHE = { 子丑: '土', 丑子: '土', 寅亥: '木', 亥寅: '木', 卯戌: '火', 戌卯: '火', 辰酉: '金', 酉辰: '金', 巳申: '水', 申巳: '水', 午未: '土', 未午: '土' };
  var LIUCHONG = { 子午: 1, 午子: 1, 丑未: 1, 未丑: 1, 寅申: 1, 申寅: 1, 卯酉: 1, 酉卯: 1, 辰戌: 1, 戌辰: 1, 巳亥: 1, 亥巳: 1 };
  var ROLE_W = { yong: 1, xi: 1, ji: -1, chou: -1 };
  var ROLE_LAB = { yong: '用', xi: '喜', ji: '忌', chou: '仇' };
  function relTo(srcWx, tgtWx) {
    if (!srcWx || !tgtWx) return '';
    if (srcWx === tgtWx) return '扶';
    if (SHENG[srcWx] === tgtWx) return '生';
    if (KE[srcWx] === tgtWx) return '克';
    if (SHENG[tgtWx] === srcWx) return '洩';
    if (KE[tgtWx] === srcWx) return '耗';
    return '';
  }
  function hasAll(zhis, need) { return need.every(function (z) { return zhis.indexOf(z) >= 0; }); }
  function countOf(arr, x) { var n = 0, i; for (i = 0; i < arr.length; i++) if (arr[i] === x) n++; return n; }
  function huaGodOk(huaWx, yueZhi, allZhi) {
    if ((HUA_YUE[huaWx] || []).indexOf(yueZhi) >= 0) return '月令化神';
    var i;
    for (i = 0; i < SANHE.length; i++) if (SANHE[i].wx === huaWx && hasAll(allZhi, SANHE[i].zhi)) return '三合化神';
    for (i = 0; i < SANHUI.length; i++) if (SANHUI[i].wx === huaWx && hasAll(allZhi, SANHUI[i].zhi)) return '三會化神';
    return '';
  }
  function fullCombo(groups, allZhi) {
    var i; for (i = 0; i < groups.length; i++) if (hasAll(allZhi, groups[i].zhi)) return groups[i];
    return null;
  }
  function natalBanhe(yunZ, natalZ) {
    var hits = [], i;
    for (i = 0; i < natalZ.length; i++) {
      var z = natalZ[i];
      if (z && BANHE[yunZ + z]) hits.push({ z: z, wx: BANHE[yunZ + z] });
    }
    return hits;
  }
  function fangBihe(yunZ, others) {
    var hits = [], seen = {}, i, z;
    for (i = 0; i < others.length; i++) {
      z = others[i];
      if (!z || z === yunZ) continue;
      if (BANHE[yunZ + z]) continue;
      if (!HUI_BIHE[yunZ + z]) continue;
      if (ZWX[z] !== ZWX[yunZ]) continue;
      if (seen[z]) continue;
      seen[z] = 1; hits.push(z);
    }
    return hits;
  }
  function roleOf(wx, spec) {
    if (!spec || !wx) return '';
    if ((spec.yong || []).indexOf(wx) >= 0) return 'yong';
    if ((spec.xi || []).indexOf(wx) >= 0) return 'xi';
    if ((spec.ji || []).indexOf(wx) >= 0) return 'ji';
    if ((spec.chou || []).indexOf(wx) >= 0) return 'chou';
    return '';
  }
  function unitByRel(rel, heke, chong) {
    if (heke || rel === '合克') return -20;
    if (chong || rel === '沖克') return -20;
    if (rel === '生' || rel === '扶') return 10;
    if (rel === '克' || rel === '洩' || rel === '耗') return -10;
    return 0;
  }
  function scoreYun(mj, spec, yun) {
    if (!mj || !yun) return null;
    var p = mj.pillars || {};
    var natalG = [(p.year || '').charAt(0), (p.month || '').charAt(0), (p.day || '').charAt(0), (p.hour || '').charAt(0)];
    var natalZ = [(p.year || '').charAt(1), (p.month || '').charAt(1), (p.day || '').charAt(1), (p.hour || '').charAt(1)];
    var dm = mj.dayMaster || natalG[2];
    var dmWx = mj.dayMasterWx || WX_G[dm] || '';
    var yue = mj.monthZhi || natalZ[1];
    var dy = (yun.current_dayun && yun.current_dayun.ganzhi) || '';
    var ln = (yun.current_liunian && yun.current_liunian.ganzhi) || '';
    var dyG = dy.charAt(0), dyZ = dy.charAt(1);
    var lnG = ln.charAt(0), lnZ = ln.charAt(1);
    var allZ = natalZ.concat([dyZ, lnZ]).filter(Boolean);
    var allG = natalG.concat([dyG, lnG]).filter(Boolean);
    var notes = [];
    var actors = [
      { key: 'dyG', lab: '大運干', kind: 'gan', glyph: dyG },
      { key: 'dyZ', lab: '大運支', kind: 'zhi', glyph: dyZ },
      { key: 'lnG', lab: '流年干', kind: 'gan', glyph: lnG },
      { key: 'lnZ', lab: '流年支', kind: 'zhi', glyph: lnZ }
    ];
    actors.forEach(function (a) {
      if (!a.glyph) { a.wx = ''; a.rel = '—'; a.role = ''; a.how = ''; a.force = 0; a.luck = 0; a.bonus = 0; return; }
      var how = [];
      var wx = a.kind === 'gan' ? (WX_G[a.glyph] || '') : (ZWX[a.glyph] || '');
      var heke = false, chong = false, bonus = 0;
      if (a.kind === 'gan') {
        var pairWx = WUHE[a.glyph + dm] || WUHE[dm + a.glyph];
        if (pairWx) {
          var partner = null, gi;
          for (gi = 0; gi < natalG.length; gi++) { if (WUHE[a.glyph + natalG[gi]]) { partner = natalG[gi]; break; } }
          var congHuaOff = !!(WUHE[a.glyph + dm] || WUHE[dm + a.glyph]);
          var fight = countOf(allG, a.glyph) > 1 || (partner && countOf(allG, partner) > 1);
          var god = huaGodOk(pairWx, yue, allZ);
          if (congHuaOff) { heke = true; how.push('日主從化關→合而不化'); }
          else if (fight) { heke = true; how.push('爭合妒合→合而不化'); }
          else if (god) { wx = pairWx; how.push('引化' + pairWx + '（' + god + '·不隔位）'); notes.push(a.lab + '引化' + pairWx); }
          else { heke = true; how.push('合而不化'); }
        }
      } else {
        var huiFull = fullCombo(SANHUI, allZ);
        var heFull = fullCombo(SANHE, allZ);
        var comboFull = false;
        if (huiFull && huiFull.zhi.indexOf(a.glyph) >= 0) {
          wx = huiFull.wx; bonus += 20; comboFull = true;
          how.push('三會' + huiFull.wx + '+20'); notes.push(a.lab + '三會' + huiFull.wx);
        } else if (heFull && heFull.zhi.indexOf(a.glyph) >= 0) {
          wx = heFull.wx; bonus += 15; comboFull = true;
          how.push('三合' + heFull.wx + '+15'); notes.push(a.lab + '三合' + heFull.wx);
        }
        var ban = natalBanhe(a.glyph, natalZ);
        if (ban.length && !comboFull) {
          bonus += 10 * ban.length;
          var lab = ban.map(function (x) { return x.z + a.glyph; }).join('、');
          how.push(ban.length + '個' + ban[0].wx + '半合+' + (10 * ban.length) + '（' + lab + '）');
          notes.push(a.lab + ' ' + ban.length + '個' + ban[0].wx + '半合');
        }
        var peers = natalZ.concat([dyZ, lnZ]);
        var bi = fangBihe(a.glyph, peers);
        if (bi.length && !comboFull) {
          bonus += 10 * bi.length;
          how.push('比和' + ZWX[a.glyph] + '+' + (10 * bi.length) + '（會方' + bi.join('') + a.glyph + '同氣）');
          notes.push(a.lab + '比和' + bi.join('') + a.glyph + '（非半會）');
        }
        if (LIUCHONG[a.glyph + natalZ[2]] && ZWX[a.glyph] !== ZWX[natalZ[2]]) { chong = true; how.push('沖日支'); }
        else if (LIUHE[a.glyph + natalZ[2]]) { how.push('六合日支'); }
      }
      var rel = heke ? '合克' : (chong ? '沖克' : relTo(wx, dmWx));
      var force = unitByRel(rel, heke, chong);
      var role = roleOf(wx, spec);
      var rw = role ? ROLE_W[role] : 0;
      a.wx = wx; a.cls = WX_CLS[wx] || ''; a.rel = rel || '—'; a.role = role;
      a.roleLab = role ? ROLE_LAB[role] : '—'; a.how = how.join(' ');
      a.force = force; a.bonus = bonus; a.luck = (Math.abs(force) + bonus) * rw;
    });
    var forceNet = 0, luckNet = 0;
    actors.forEach(function (a) { forceNet += a.force || 0; luckNet += a.luck || 0; });
    forceNet = Math.round(forceNet * 10) / 10; luckNet = Math.round(luckNet * 10) / 10;
    var band = luckNet > 12 ? 'shun' : (luckNet < -12 ? 'ni' : 'ping');
    var label = band === 'shun' ? '運氣順' : (band === 'ni' ? '運氣逆' : '運氣平');
    return { layer: 2, ruleVersion: 'yun-liuyun-v2', dayun: dy, liunian: ln,
      liunianYear: yun.current_liunian && yun.current_liunian.year, actors: actors,
      forceNet: forceNet, luckNet: luckNet, liuYunNet: luckNet, band: band, label: label,
      notes: notes, natalLocked: true };
  }
  function yunScoreHTML(r) {
    if (!r) return '';
    var rows = (r.actors || []).map(function (a) {
      var sg = (a.luck > 0 ? '+' : '') + a.luck;
      var fg = (a.force > 0 ? '+' : '') + a.force;
      var c = a.luck > 0 ? 'mj-plus' : (a.luck < 0 ? 'mj-minus' : '');
      return '<tr><td>' + a.lab + '</td><td class="wx-' + (a.cls || '') + '">' + (a.glyph || '—') +
        '<i class="bz-shen">' + (a.wx || '') + '</i></td><td>' + (a.roleLab || '—') +
        '</td><td>' + a.rel + (a.how ? '<span class="mj-how">' + a.how + '</span>' : '') +
        '</td><td class="' + c + '">' + sg + '</td><td class="mj-hint">' + fg + '</td></tr>';
    }).join('');
    var note = (r.notes && r.notes.length) ? '<p class="yun-meta">' + r.notes.join(' · ') + '</p>' : '';
    return '<div class="yun-wrap yun-score"><div class="m6-block-title">第 2 層運氣（大運×流年）</div>' +
      '<p class="yun-meta">當運 <b>' + (r.dayun || '') + '</b> · 流年 <b>' + (r.liunianYear || '') + ' ' + (r.liunian || '') +
      '</b><br>流運分 <b class="mj-score">' + r.luckNet + '</b>　<b>' + r.label +
      '</b>　<span class="mj-hint">對日主力量 ' + r.forceNet + '</span>' +
      '<br><span class="mj-hint">用喜＋／忌仇− · 三合半合（含中神）每點＋10 · 會方比和＋10 · 巳午只算比和唔算半會 · 原局淨分鎖定</span></p>' +
      '<div style="overflow:auto"><table class="yun-table"><thead><tr><th>流運位</th><th>字</th><th>喜用</th><th>關係</th><th>流運分</th><th>力</th></tr></thead><tbody>' +
      rows + '</tbody></table></div>' + note + '</div>';
  }
  function install() {
    var E = global.TXMarkSixEngine || (global.TXMarkSixEngine = {});
    E.scoreYun = scoreYun; E.yunScoreHTML = yunScoreHTML; E.YUN_LAYER = 2;
  }
  install();
})(typeof window !== 'undefined' ? window : globalThis);
