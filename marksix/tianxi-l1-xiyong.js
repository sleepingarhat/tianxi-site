/* 第 1 層喜用規格
 * 極弱<15 從弱：順克泄耗，忌生扶
 * 較弱 15–50 扶抑身弱：用印、喜比劫，忌官殺食傷，仇財
 * 較旺 50–85 扶抑身旺：用食傷財、喜官殺，忌印，仇比劫
 * 極旺>85 專旺順洩：用食傷、喜印比，忌財，仇官殺
 */
(function (global) {
  'use strict';
  var SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  var KE = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' };
  var BAND_KEY = { 'ji-ruo': 'ji-ruo', ruo: 'ruo', wang: 'wang', 'ji-wang': 'ji-wang', edge: 'edge' };
  var SPEC = {
    'ji-ruo': { name: '從弱', yong: ['食傷', '財', '官殺'], xi: [], ji: ['印', '比劫'], chou: [] },
    ruo: { name: '扶抑身弱', yong: ['印'], xi: ['比劫'], ji: ['官殺', '食傷'], chou: ['財'] },
    wang: { name: '扶抑身旺', yong: ['食傷', '財'], xi: ['官殺'], ji: ['印'], chou: ['比劫'] },
    'ji-wang': { name: '專旺順洩', yong: ['食傷'], xi: ['印', '比劫'], ji: ['財'], chou: ['官殺'] },
    edge: { name: '交界兩可', yong: ['印', '食傷'], xi: ['比劫', '財'], ji: ['官殺'], chou: [] }
  };
  var ZHUAN = { 木: '曲直格', 火: '炎上格', 土: '稼穣格', 金: '從革格', 水: '潤下格' };
  function rolesOf(dmWx) {
    var yin = '', guan = '';
    Object.keys(SHENG).forEach(function (k) { if (SHENG[k] === dmWx) yin = k; });
    Object.keys(KE).forEach(function (k) { if (KE[k] === dmWx) guan = k; });
    return { 比劫: dmWx, 印: yin, 食傷: SHENG[dmWx], 財: KE[dmWx], 官殺: guan };
  }
  function expand(roles, keys) {
    var out = [];
    (keys || []).forEach(function (k) {
      var wx = roles[k];
      if (wx && out.indexOf(wx) < 0) out.push(wx);
    });
    return out;
  }
  function specFor(dmWx, band) {
    var key = BAND_KEY[band] || 'ruo';
    var pack = SPEC[key];
    var roles = rolesOf(dmWx);
    return {
      ruleVersion: 'mingju-l1-xiyong-v1',
      band: key,
      method: pack.name,
      zhuanGe: key === 'ji-wang' ? (ZHUAN[dmWx] || '') : '',
      roles: roles,
      yong: expand(roles, pack.yong),
      xi: expand(roles, pack.xi),
      ji: expand(roles, pack.ji),
      chou: expand(roles, pack.chou)
    };
  }
  function allMatrix() {
    var dms = ['木', '火', '土', '金', '水'];
    var bands = ['ji-ruo', 'ruo', 'wang', 'ji-wang'];
    var rows = [];
    dms.forEach(function (wx) {
      bands.forEach(function (b) {
        var s = specFor(wx, b);
        rows.push({ dmWx: wx, band: b, method: s.method, zhuanGe: s.zhuanGe, yong: s.yong, xi: s.xi, ji: s.ji, chou: s.chou });
      });
    });
    return rows;
  }
  function xiyongHTML(s, dm, dmWx) {
    if (!s) return '';
    function cell(xs) { return xs.length ? xs.join('、') : '—'; }
    return '<div class="yun-wrap"><div class="m6-block-title">第 1 層喜用</div>' +
      '<p class="yun-meta">日主' + (dm || '') + (dmWx || '') + ' · ' + s.method + (s.zhuanGe ? ' · ' + s.zhuanGe : '') +
      '<br>用神 <b>' + cell(s.yong) + '</b> · 喜神 ' + cell(s.xi) +
      ' · 忌神 ' + cell(s.ji) + ' · 仇神 ' + cell(s.chou) + '</p></div>';
  }
  function install() {
    var E = global.TXMarkSixEngine || (global.TXMarkSixEngine = {});
    E.l1XiyongSpec = specFor;
    E.l1XiyongMatrix = allMatrix;
    E.l1XiyongHTML = xiyongHTML;
  }
  install();
})(typeof window !== 'undefined' ? window : globalThis);
