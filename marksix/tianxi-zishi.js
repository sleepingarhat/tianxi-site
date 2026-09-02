/* 早子／夜子：23:00–翌日00:59 同一日柱同時柱。修 hour||12 把 0 時當成正午。 */
(function (global) {
  'use strict';
  function resolveBaZiClock(y, m, d, hour, minute) {
    var h = (hour == null || hour === '') ? 12 : +hour;
    var min = (minute == null || minute === '') ? 0 : +minute;
    if (isNaN(h)) h = 12;
    if (isNaN(min)) min = 0;
    if (h === 0) {
      var dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() - 1);
      return {
        y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate(),
        hour: 23, minute: min, zi: 'early',
        note: '早子00:00–00:59＝前日夜子（日柱不換日）'
      };
    }
    return {
      y: y, m: m, d: d, hour: h, minute: min,
      zi: h === 23 ? 'late' : '',
      note: h === 23 ? '夜子23:00–23:59' : ''
    };
  }
  function install() {
    var E = global.TXMarkSixEngine || (global.TXMarkSixEngine = {});
    E.resolveBaZiClock = resolveBaZiClock;
    if (E.pillarsAt && !E.pillarsAt._zishi) {
      var origP = E.pillarsAt;
      E.pillarsAt = function (y, m, d, hour, minute) {
        var fallbackMin = (minute != null && minute !== '') ? +minute : (hour === 21 ? 30 : 0);
        var clk = resolveBaZiClock(y, m, d, hour, fallbackMin);
        var r = origP(clk.y, clk.m, clk.d, clk.hour, clk.minute);
        if (r) { r.ziKind = clk.zi; r.clockNote = clk.note; }
        return r;
      };
      E.pillarsAt._zishi = true;
    }
    if (E.buildYun && !E.buildYun._zishi) {
      var origY = E.buildYun;
      E.buildYun = function (y, m, d, h, min, sex, at) {
        var clk = resolveBaZiClock(y, m, d, h, min || 0);
        return origY(clk.y, clk.m, clk.d, clk.hour, clk.minute, sex, at);
      };
      E.buildYun._zishi = true;
    }
    E._zishi = !!(E.pillarsAt && E.pillarsAt._zishi);
  }
  install();
  var n = 0;
  var t = setInterval(function () {
    n++;
    install();
    if ((global.TXMarkSixEngine && global.TXMarkSixEngine.pillarsAt && global.TXMarkSixEngine.pillarsAt._zishi &&
      global.TXMarkSixEngine.buildYun && global.TXMarkSixEngine.buildYun._zishi) || n > 40) {
      clearInterval(t);
    }
  }, 50);
})(typeof window !== 'undefined' ? window : globalThis);
