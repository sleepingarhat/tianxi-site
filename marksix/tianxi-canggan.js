/* 藏干比例（筆記）+ 人元司令分野（子平真诠评注，由节气起算，非阳历日号） */
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
  var RENYUAN = {
    寅: [{ wx: '土', days: 7, gan: '戊' }, { wx: '火', days: 7, gan: '丙' }, { wx: '木', days: 16, gan: '甲' }],
    卯: [{ wx: '木', days: 10, gan: '甲' }, { wx: '木', days: 20, gan: '乙' }],
    辰: [{ wx: '木', days: 9, gan: '乙' }, { wx: '水', days: 3, gan: '癸' }, { wx: '土', days: 18, gan: '戊' }],
    巳: [{ wx: '土', days: 5, gan: '戊' }, { wx: '金', days: 9, gan: '庚' }, { wx: '火', days: 16, gan: '丙' }],
    午: [{ wx: '火', days: 10, gan: '丙' }, { wx: '土', days: 9, gan: '己' }, { wx: '火', days: 11, gan: '丁' }],
    未: [{ wx: '火', days: 9, gan: '丁' }, { wx: '木', days: 3, gan: '乙' }, { wx: '土', days: 18, gan: '己' }],
    申: [{ wx: '土', days: 10, gan: '戊' }, { wx: '水', days: 3, gan: '壬' }, { wx: '金', days: 17, gan: '庚' }],
    酉: [{ wx: '金', days: 10, gan: '庚' }, { wx: '金', days: 20, gan: '辛' }],
    戌: [{ wx: '金', days: 9, gan: '辛' }, { wx: '火', days: 3, gan: '丁' }, { wx: '土', days: 18, gan: '戊' }],
    亥: [{ wx: '土', days: 7, gan: '戊' }, { wx: '木', days: 5, gan: '甲' }, { wx: '水', days: 18, gan: '壬' }],
    子: [{ wx: '水', days: 10, gan: '壬' }, { wx: '水', days: 20, gan: '癸' }],
    丑: [{ wx: '水', days: 9, gan: '癸' }, { wx: '金', days: 3, gan: '辛' }, { wx: '土', days: 18, gan: '己' }]
  };
  function cangHTML() {
    var order = '子丑寅卯辰巳午未申酉戌亥'.split('');
    var rows = order.map(function (z) {
      var parts = (CANG_PCT[z] || []).map(function (p) { return p[0] + p[1] + '%'; }).join(' ');
      return '<tr><td>' + z + '</td><td>' + (ZHI_KIND[z] || '') + '</td><td>' + parts + '</td></tr>';
    }).join('');
    return '<div class="yun-wrap"><div class="m6-block-title">地支藏干</div>' +
      '<p class="yun-meta">比例依筆記。人元司令分野按節氣起計日，不是陽曆 1–10 號。第 1 層仍用本氣土計四庫。</p>' +
      '<div style="overflow:auto"><table class="yun-table"><thead><tr><th>支</th><th>類</th><th>藏干</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }
  function install() {
    var E = global.TXMarkSixEngine || (global.TXMarkSixEngine = {});
    E.CANG_PCT = CANG_PCT;
    E.ZHI_KIND = ZHI_KIND;
    E.RENYUAN = RENYUAN;
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
