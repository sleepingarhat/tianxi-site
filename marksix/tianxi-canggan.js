/* 藏干比例 */
(function (global) {
  'use strict';
  var CANG_PCT = {
    子: [['癸', 100]],
    丑: [['己', 60], ['癸', 30], ['辛', 10]],
    寅: [['甲', 60], ['丙', 20], ['戊', 20]],
    卯: [['乙', 100]],
    辰: [['戊', 60], ['乙', 30], ['癸', 10]],
    巳: [['丙', 60], ['庚', 20], ['戊', 20]],
    午: [['丁', 60], ['己', 40]],
    未: [['己', 60], ['丁', 30], ['乙', 10]],
    申: [['庚', 60], ['壬', 20], ['戊', 20]],
    酉: [['辛', 100]],
    戌: [['戊', 60], ['辛', 30], ['丁', 10]],
    亥: [['壬', 60], ['甲', 20], ['戊', 20]]
  };
  var ZHI_KIND = {
    子: '四旺', 午: '四旺', 卯: '四旺', 酉: '四旺',
    寅: '四生', 申: '四生', 巳: '四生', 亥: '四生',
    辰: '四庫', 戌: '四庫', 丑: '四庫', 未: '四庫'
  };
  function cangHTML() {
    var order = '子丑寅卯辰巳午未申酉戌亥'.split('');
    var rows = order.map(function (z) {
      var parts = (CANG_PCT[z] || []).map(function (p) { return p[0] + p[1] + '%'; }).join(' ');
      return '<tr><td>' + z + '</td><td>' + (ZHI_KIND[z] || '') + '</td><td>' + parts + '</td></tr>';
    }).join('');
    return '<div class="yun-wrap"><div class="m6-block-title">地支藏干</div>' +
      '<div style="overflow:auto"><table class="yun-table"><thead><tr><th>支</th><th>類</th><th>藏干</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }
  function install() {
    var E = global.TXMarkSixEngine || (global.TXMarkSixEngine = {});
    E.CANG_PCT = CANG_PCT;
    E.ZHI_KIND = ZHI_KIND;
    E.cangHTML = cangHTML;
    var old = E.wuxingRefHTML;
    if (old) {
      E.wuxingRefHTML = function (monthZhi, dmWx) {
        return old(monthZhi, dmWx) + cangHTML();
      };
    }
  }
  install();
})(typeof window !== 'undefined' ? window : globalThis);
