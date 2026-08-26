/* tianxi-xiyong-pick-v1 */
(function (global) {
  'use strict';
  var RULE = 'tianxi-xiyong-pick-v1';
  var WX_G = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
  var WX_Z = {子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'};
  var WX_TAILS = {水:[1,6],火:[2,7],木:[3,8],金:[4,9],土:[0,5]};
  var DRAW_W = {hour:4, day:3, month:2, year:1.5, day_master_wx:1};
  var PERSONAL_W = {day:3, hour:2.5, month:2, year:1.5, day_master_wx:1};
  var B_W = {用:2.5, 喜:1.2, 忌:-1.2, 仇:-2.0};
  var TIAOHOU_EXTRA = 0.8;
  var C_W = {用:[2.0,1.2], 喜:[1.0,0.6], 忌:[-1.0,-0.6], 仇:[-1.8,-1.0]};
  var D_W = {用:[1.4,0.8], 喜:[0.7,0.4], 忌:[-0.7,-0.4], 仇:[-1.2,-0.7]};
  var E_W = {
    hour:{用:[1.6,1.0],喜:[0.8,0.5],忌:[-0.8,-0.5],仇:[-1.4,-0.9]},
    day:{用:[1.2,0.8],喜:[0.6,0.4],忌:[-0.6,-0.4],仇:[-1.1,-0.7]},
    month:{用:[0.6,0.4],喜:[0.3,0.2],忌:[-0.3,-0.2],仇:[-0.6,-0.4]},
    year:{用:[0.4,0.3],喜:[0.2,0.15],忌:[-0.2,-0.15],仇:[-0.4,-0.25]}
  };
  function band(n) { return n <= 9 ? 0 : n <= 19 ? 1 : n <= 29 ? 2 : n <= 39 ? 3 : 4; }
  function pick15(scores) {
    var by = [[], [], [], [], []];
    Object.keys(scores).forEach(function (k) {
      var n = +k; if (n >= 1 && n <= 49) by[band(n)].push([n, scores[n]]);
    });
    by.forEach(function (b) { b.sort(function (a, c) { return c[1] - a[1] || a[0] - c[0]; }); });
    var chosen = [], set = {};
    for (var i = 0; i < 5; i++) by[i].slice(0, 3).forEach(function (x) { chosen.push(x[0]); set[x[0]] = 1; });
    var remain = [];
    for (var bi = 0; bi < 5; bi++) by[bi].forEach(function (x) { if (!set[x[0]]) remain.push(x); });
    remain.sort(function (a, c) { return c[1] - a[1] || a[0] - c[0]; });
    for (var r = 0; r < remain.length && chosen.length < 15; r++) chosen.push(remain[r][0]);
    for (var n = 1; n <= 49 && chosen.length < 15; n++) if (chosen.indexOf(n) < 0) chosen.push(n);
    return chosen.slice(0, 15).sort(function (a, b) { return a - b; });
  }
  function mapWx(wx, weight, scores) {
    if (!wx || !weight) return;
    var tails = WX_TAILS[wx] || [];
    for (var n = 1; n <= 49; n++) {
      var t = n % 10;
      if (tails.indexOf(t) >= 0 || (t === 0 && tails.indexOf(0) >= 0)) scores[n] = (scores[n] || 0) + weight;
    }
  }
  function mapGz(gz, weight, scores) {
    if (!gz || gz.length < 2) return;
    mapWx(WX_G[gz.charAt(0)], weight, scores);
    mapWx(WX_Z[gz.charAt(1)], weight, scores);
  }
  function scoreChart(pillars, weights, scores) {
    ['year', 'month', 'day', 'hour'].forEach(function (k) { if (weights[k]) mapGz(pillars[k], weights[k], scores); });
    if (weights.day_master_wx) mapWx(pillars.dayMasterWx || WX_G[pillars.day.charAt(0)], weights.day_master_wx, scores);
  }
  function roleOf(wx, bags) {
    if (!wx) return null;
    if (bags.用.indexOf(wx) >= 0) return '用';
    if (bags.喜.indexOf(wx) >= 0) return '喜';
    if (bags.忌.indexOf(wx) >= 0) return '忌';
    if (bags.仇.indexOf(wx) >= 0) return '仇';
    return null;
  }
  function applyGzRoles(scores, gz, table, bags) {
    var ganWx = gz ? WX_G[gz.charAt(0)] : null;
    var zhiWx = gz && gz.length > 1 ? WX_Z[gz.charAt(1)] : null;
    var rg = roleOf(ganWx, bags), rz = roleOf(zhiWx, bags);
    if (rg && ganWx) mapWx(ganWx, table[rg][0], scores);
    if (rz && zhiWx) mapWx(zhiWx, table[rz][1], scores);
    return {gan_wx: ganWx, zhi_wx: zhiWx, gan_role: rg, zhi_role: rz};
  }
  function xiyongPick(py, pm, pd, ph, pmin, sex, dy, dm, dd) {
    var E = global.TXMarkSixEngine;
    if (!E || !E.pillarsAt) throw new Error('缺四柱引擎');
    if (!E.analyzeGeju) throw new Error('缺格局引擎');
    if (!E.buildYun) throw new Error('缺大運引擎');
    if (!sex) throw new Error('喜用取號需要男命或女命');
    var personal = E.pillarsAt(py, pm, pd, ph, pmin || 0);
    var draw = E.pillarsAt(dy, dm, dd, 21, 30);
    var ge = E.analyzeGeju({year: personal.year, month: personal.month, day: personal.day, hour: personal.hour});
    var at = new Date(dy, dm - 1, dd, 21, 30, 0);
    var yun = E.buildYun(py, pm, pd, ph, pmin || 0, sex, at);
    var bags = {用: (ge.yong_shen || []).slice(), 喜: (ge.xi_shen || []).slice(), 忌: (ge.ji_shen || []).slice(), 仇: (ge.chou_shen || []).slice()};
    var scores = {};
    scoreChart(draw, DRAW_W, scores);
    scoreChart(personal, PERSONAL_W, scores);
    ['用', '喜', '忌', '仇'].forEach(function (role) {
      (bags[role] || []).forEach(function (wx) { mapWx(wx, B_W[role], scores); });
    });
    if (ge.tiaohou && ge.tiaohou.urgent && ge.tiaohou.need) mapWx(ge.tiaohou.need, TIAOHOU_EXTRA, scores);
    var cur = yun.current_dayun || {};
    var ln = yun.current_liunian || {};
    var cTag = applyGzRoles(scores, cur.ganzhi, C_W, bags);
    var dTag = applyGzRoles(scores, ln.ganzhi, D_W, bags);
    var eTags = {};
    ['hour', 'day', 'month', 'year'].forEach(function (k) { eTags[k] = applyGzRoles(scores, draw[k], E_W[k], bags); });
    var interact = [];
    if (cTag.gan_role === '用' && dTag.gan_role === '用') { mapWx(cTag.gan_wx, 0.8, scores); interact.push('當運用×流年用'); }
    else if (cTag.gan_role === '用' && dTag.gan_role === '忌') { mapWx(cTag.gan_wx, -0.5, scores); interact.push('當運用×流年忌'); }
    else if (cTag.gan_role === '忌' && dTag.gan_role === '用') { mapWx(dTag.gan_wx, 0.3, scores); interact.push('當運忌×流年用'); }
    if (cTag.gan_role === '仇' && dTag.gan_role === '仇') { mapWx(cTag.gan_wx, -0.8, scores); interact.push('當運仇×流年仇'); }
    return {
      ruleVersion: RULE, mode: 'xiyong_personal_x_draw',
      personal_pillars: personal, draw_pillars: draw, pattern: ge.pattern,
      yong_shen: ge.yong_shen, xi_shen: ge.xi_shen, ji_shen: ge.ji_shen, chou_shen: ge.chou_shen, tiaohou: ge.tiaohou,
      current_dayun: Object.assign({ganzhi: cur.ganzhi, shi_shen: cur.shi_shen}, cTag),
      current_liunian: Object.assign({year: ln.year, ganzhi: ln.ganzhi, shi_shen: ln.shi_shen}, dTag),
      draw_roles: eTags, interact: interact, numbers: pick15(scores)
    };
  }
  var E = global.TXMarkSixEngine || (global.TXMarkSixEngine = {});
  E.xiyongPick = xiyongPick;
  E.ruleVersion = (E.ruleVersion ? E.ruleVersion + ' + ' : '') + RULE;
})(typeof window !== 'undefined' ? window : globalThis);
