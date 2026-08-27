/* 天喜五行表（筆記校正：陰金干用辛不用申；循環相生） */
(function (global) {
  'use strict';
  var WX_GAN = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
  var WX_ZHI = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
  var YY_GAN = { 甲: '陽', 乙: '陰', 丙: '陽', 丁: '陰', 戊: '陽', 己: '陰', 庚: '陽', 辛: '陰', 壬: '陽', 癸: '陰' };
  var YY_ZHI = { 寅: '陽', 卯: '陰', 午: '陽', 巳: '陰', 辰: '陽', 戌: '陽', 丑: '陰', 未: '陰', 申: '陽', 酉: '陰', 子: '陽', 亥: '陰' };
  var SEASON_ZHI = { 寅: '春', 卯: '春', 巳: '夏', 午: '夏', 申: '秋', 酉: '秋', 亥: '冬', 子: '冬', 辰: '四季', 戌: '四季', 丑: '四季', 未: '四季' };
  var WANGSHUAI = {
    春: { 木: '旺', 火: '相', 土: '死', 金: '囚', 水: '休' },
    夏: { 木: '休', 火: '旺', 土: '相', 金: '死', 水: '囚' },
    四季: { 木: '囚', 火: '休', 土: '旺', 金: '相', 水: '死' },
    秋: { 木: '死', 火: '囚', 土: '休', 金: '旺', 水: '相' },
    冬: { 木: '相', 火: '死', 土: '囚', 金: '休', 水: '旺' }
  };
  var SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  var KE = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' };
  var WX_MEAN = { 木: '生發、成長、舒展；仁慈、正直', 火: '炎熱、向上、發散；熱情、急躁', 土: '長養、化育、承載；誠信、包容', 金: '肅殺、收縮、堅固；義氣、剛正', 水: '寒涼、向下、凝聚；理智、冷靜' };
  var CORRECTIONS = ['筆記陰金天干誤寫「申」，系統用「辛」（申屬地支陽金）', '筆記「循還相生」作「循環相生」'];
  function seasonOf(zhi) { return SEASON_ZHI[zhi] || ''; }
  function wangShuai(wx, zhiOrSeason) {
    var s = WANGSHUAI[zhiOrSeason] ? zhiOrSeason : seasonOf(zhiOrSeason);
    return (WANGSHUAI[s] && WANGSHUAI[s][wx]) || '';
  }
  function verifyWangShuai() {
    var ok = true, bad = [];
    Object.keys(WANGSHUAI).forEach(function (s) {
      var row = WANGSHUAI[s], wangWx;
      Object.keys(row).forEach(function (wx) { if (row[wx] === '旺') wangWx = wx; });
      var expect = { 旺: wangWx, 相: SHENG[wangWx], 死: KE[wangWx], 休: null, 囚: null };
      Object.keys(SHENG).forEach(function (wx) { if (SHENG[wx] === wangWx) expect.休 = wx; });
      Object.keys(KE).forEach(function (wx) { if (KE[wx] === wangWx) expect.囚 = wx; });
      Object.keys(expect).forEach(function (st) {
        var got = null;
        Object.keys(row).forEach(function (wx) { if (row[wx] === st) got = wx; });
        if (got !== expect[st]) { ok = false; bad.push(s + st + ' expect ' + expect[st] + ' got ' + got); }
      });
    });
    return { ok: ok, bad: bad };
  }
  function wuxingRefHTML(monthZhi, dmWx) {
    var season = seasonOf(monthZhi);
    var dmState = wangShuai(dmWx, season);
    var rows = ['春', '夏', '四季', '秋', '冬'].map(function (s) {
      var mark = s === season ? ' class="now"' : '';
      var cells = ['木', '火', '土', '金', '水'].map(function (wx) { return '<td>' + WANGSHUAI[s][wx] + '</td>'; }).join('');
      return '<tr' + mark + '><td>' + s + '</td>' + cells + '</tr>';
    }).join('');
    var chk = verifyWangShuai();
    return '<div class="yun-wrap wx-ref"><div class="m6-block-title">五行四季旺衰</div><p class="yun-meta">月令' + (monthZhi || '—') + (season ? '（' + season + '）' : '') + (dmWx ? ' · 日干' + dmWx + (dmState || '') : '') + '<br>旺＝當令 · 相＝旺所生 · 休＝生旺者 · 囚＝克旺者 · 死＝旺所克</p><div style="overflow:auto"><table class="yun-table"><thead><tr><th></th><th>木</th><th>火</th><th>土</th><th>金</th><th>水</th></tr></thead><tbody>' + rows + '</tbody></table></div><p class="yun-meta">天干 甲乙木 · 丙丁火 · 戊己土 · 庚辛金 · 壬癸水<br>地支 寅卯木 · 巳午火 · 辰戌丑未土 · 申酉金 · 亥子水<br>生：木→火→土→金→水→木　克：木→土→水→火→金→木<br>' + CORRECTIONS.join(' · ') + (chk.ok ? '' : '<br>表校驗失敗：' + chk.bad.join('；')) + '</p></div>';
  }
  function install() {
    var E = global.TXMarkSixEngine || (global.TXMarkSixEngine = {});
    E.WX_GAN = WX_GAN; E.WX_ZHI = WX_ZHI; E.YY_GAN = YY_GAN; E.YY_ZHI = YY_ZHI;
    E.SEASON_ZHI = SEASON_ZHI; E.WANGSHUAI = WANGSHUAI; E.WX_SHENG = SHENG; E.WX_KE = KE;
    E.WX_MEAN = WX_MEAN; E.WX_CORRECTIONS = CORRECTIONS;
    E.seasonOf = seasonOf; E.wangShuai = wangShuai; E.verifyWangShuai = verifyWangShuai; E.wuxingRefHTML = wuxingRefHTML;
  }
  install();
})(typeof window !== 'undefined' ? window : globalThis);
