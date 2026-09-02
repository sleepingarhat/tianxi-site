/* 子時跨夜、日柱子夜換日
   夜子 23:00–23:59：日柱用當日（15日戊午 + 子時）
   早子 00:00–00:59：日柱用新日（16日己未 + 子時）
   兩邊時支都係子；時干跟當日日干五鼠遁（戊→壬子，己→甲子）
   修 hour||12：0 時唔可以當正午。 */
(function (global) {
  'use strict';
  var WX_G = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
  function resolveBaZiClock(y, m, d, hour, minute) {
    var h = (hour == null || hour === '') ? 12 : +hour;
    var min = (minute == null || minute === '') ? 0 : +minute;
    if (isNaN(h)) h = 12;
    if (isNaN(min)) min = 0;
    var zi = '';
    var note = '';
    if (h === 23) {
      zi = 'late';
      note = '夜子23:00–23:59 · 日柱用當日 · 時支子';
    } else if (h === 0) {
      zi = 'early';
      note = '早子00:00–00:59 · 日柱用新日（子夜已換日） · 時支子';
    }
    return { y: y, m: m, d: d, hour: h, minute: min, zi: zi, note: note };
  }
  function pillarsFromSolar(clk) {
    var Solar = global.Solar;
    if (!Solar) throw new Error('需要 lunar-javascript');
    var solar = Solar.fromYmdHms(clk.y, clk.m, clk.d, clk.hour, clk.minute, 0);
    var lunar = solar.getLunar();
    var ec = lunar.getEightChar();
    if (ec && typeof ec.setSect === 'function') {
      try { ec.setSect(1); } catch (e) {}
    }
    return {
      year: ec.getYear(), month: ec.getMonth(), day: ec.getDay(), hour: ec.getTime(),
      dayMaster: ec.getDay().charAt(0), dayMasterWx: WX_G[ec.getDay().charAt(0)] || '',
      ziKind: clk.zi, clockNote: clk.note
    };
  }
  function install() {
    var E = global.TXMarkSixEngine || (global.TXMarkSixEngine = {});
    E.resolveBaZiClock = resolveBaZiClock;
    if (!E.pillarsAt || !E.pillarsAt._zishiV2) {
      E.pillarsAt = function (y, m, d, hour, minute) {
        var fallbackMin = (minute != null && minute !== '') ? +minute : (hour === 21 ? 30 : 0);
        return pillarsFromSolar(resolveBaZiClock(y, m, d, hour, fallbackMin));
      };
      E.pillarsAt._zishiV2 = true;
      E.pillarsAt._zishi = true;
    }
    if (E.buildYun && !E.buildYun._zishiV2) {
      var origY = E.buildYun;
      E.buildYun = function (y, m, d, h, min, sex, at) {
        var clk = resolveBaZiClock(y, m, d, h, min || 0);
        return origY(clk.y, clk.m, clk.d, clk.hour, clk.minute, sex, at);
      };
      E.buildYun._zishiV2 = true;
      E.buildYun._zishi = true;
    }
    E._zishi = !!(E.pillarsAt && E.pillarsAt._zishiV2);
  }
  install();
  var n = 0;
  var t = setInterval(function () {
    n++; install();
    if ((global.TXMarkSixEngine && global.TXMarkSixEngine.pillarsAt && global.TXMarkSixEngine.pillarsAt._zishiV2) || n > 40) clearInterval(t);
  }, 50);
})(typeof window !== 'undefined' ? window : globalThis);
