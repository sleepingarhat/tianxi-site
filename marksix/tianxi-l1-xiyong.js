/* 第 1 層喜用規格 */
(function (global) {
  'use strict';
  var SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  var KE = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' };
  var WX_CLS = { 木: 'mu', 火: 'huo', 土: 'tu', 金: 'jin', 水: 'shui' };
  var ROLE_W = { yong: 1, xi: 1, ji: -1, chou: -1 };
  var BANDS = [
    { key: 'ji-ruo', lab: '極弱格', range: '<15', name: '從弱' },
    { key: 'ruo', lab: '較弱格', range: '15–50', name: '扶抑身弱' },
    { key: 'wang', lab: '較旺格', range: '50–85', name: '扶抑身旺' },
    { key: 'ji-wang', lab: '極旺格', range: '>85', name: '專旺順洩' }
  ];
  var SPEC = {
    'ji-ruo': { name: '從弱', yong: ['食傷', '財', '官殺'], xi: [], ji: ['印', '比劫'], chou: [] },
    ruo: { name: '扶抑身弱', yong: ['印'], xi: ['比劫'], ji: ['官殺', '食傷'], chou: ['財'] },
    wang: { name: '扶抑身旺', yong: ['食傷', '財'], xi: ['官殺'], ji: ['印'], chou: ['比劫'] },
    'ji-wang': { name: '專旺順洩', yong: ['食傷'], xi: ['印', '比劫'], ji: ['財'], chou: ['官殺'] },
    edge: { name: '交界兩可', yong: ['印', '食傷'], xi: ['比劫', '財'], ji: ['官殺'], chou: [] }
  };
  var ZHUAN = { 木: '曲直格', 火: '炎上格', 土: '稼穣格', 金: '從革格', 水: '潤下格' };
  var DM_LAB = { 木: '甲乙木', 火: '丙丁火', 土: '戊己土', 金: '庚辛金', 水: '壬癸水' };
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
  function paint(xs) {
    if (!xs || !xs.length) return '—';
    return xs.map(function (w) {
      return '<span class="wx-' + (WX_CLS[w] || '') + '">' + w + '</span>';
    }).join('');
  }
  function specFor(dmWx, band) {
    var key = SPEC[band] ? band : 'ruo';
    var pack = SPEC[key];
    var roles = rolesOf(dmWx);
    return {
      ruleVersion: 'mingju-l1-xiyong-v1b',
      band: key,
      method: pack.name,
      zhuanGe: key === 'ji-wang' ? (ZHUAN[dmWx] || '') : '',
      roles: roles,
      yong: expand(roles, pack.yong),
      xi: expand(roles, pack.xi),
      ji: expand(roles, pack.ji),
      chou: expand(roles, pack.chou),
      weight: ROLE_W
    };
  }
  function xiyongHTML(s, dm, dmWx) {
    if (!s) return '';
    return '<div class="yun-wrap xy-now"><div class="m6-block-title">第 1 層喜用（本局）</div>' +
      '<p class="yun-meta">日主 <span class="wx-' + (WX_CLS[dmWx] || '') + '">' + (dm || '') + (dmWx || '') + '</span> · ' +
      s.method + (s.zhuanGe ? ' · ' + s.zhuanGe : '') + '</p>' +
      '<div style="overflow:auto"><table class="yun-table"><thead><tr><th>用神</th><th>喜神</th><th>忌神</th><th>仇神</th></tr></thead>' +
      '<tbody><tr><td>' + paint(s.yong) + '</td><td>' + paint(s.xi) + '</td><td>' + paint(s.ji) + '</td><td>' + paint(s.chou) + '</td></tr></tbody></table></div></div>';
  }
  function matrixHTML(curWx, curBand) {
    var rows = ['木', '火', '土', '金', '水'].map(function (wx) {
      var cells = BANDS.map(function (b) {
        var s = specFor(wx, b.key);
        var on = (wx === curWx && b.key === curBand) ? ' class="now"' : '';
        var extra = s.zhuanGe ? '<div class="mj-hint">' + s.zhuanGe + '</div>' : '';
        return '<td' + on + '><div>用 ' + paint(s.yong) + '</div><div>喜 ' + paint(s.xi) +
          '</div><div>忌 ' + paint(s.ji) + '</div><div>仇 ' + paint(s.chou) + '</div>' + extra + '</td>';
      }).join('');
      return '<tr><td class="wx-' + (WX_CLS[wx] || '') + '">' + DM_LAB[wx] + '</td>' + cells + '</tr>';
    }).join('');
    var head = BANDS.map(function (b) {
      return '<th>' + b.lab + '<div class="mj-hint">' + b.range + ' · ' + b.name + '</div></th>';
    }).join('');
    return '<div class="yun-wrap xy-matrix"><div class="m6-block-title">第 1 層喜用規格</div>' +
      '<p class="yun-meta">極弱從弱：只分順（用）／逆（忌），五行分盡故無喜無仇　較弱：印主比輔　較旺：洩耗為主　極旺：專旺順洩</p>' +
      '<div style="overflow:auto"><table class="yun-table xy-table"><thead><tr><th>日主</th>' + head + '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }
  function install() {
    var E = global.TXMarkSixEngine || (global.TXMarkSixEngine = {});
    E.l1XiyongSpec = specFor;
    E.l1XiyongHTML = xiyongHTML;
    E.l1XiyongMatrixHTML = matrixHTML;
    E.L1_ROLE_W = ROLE_W;
  }
  install();
})(typeof window !== 'undefined' ? window : globalThis);
