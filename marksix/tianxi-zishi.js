/* 24小時制排盤（鎖定）
   23:00–00:59＝子時
   日柱 00:00 換日（setSect=1，夜子日柱仍用當日）
   時干五鼠遁：夜子(23)用次日日干，早子(00)用當日日干
   例：1980-02-15 23:50 → 戊午日 甲子時
       1980-02-16 00:50 → 己未日 甲子時
   禁止 hour||12（0 時會變正午午時）。 */
(function (global) {
  'use strict';
  var GAN = '甲乙丙丁戊己庚辛壬癸';
  var ZHI = '子丑寅卯辰巳午未申酉戌亥';
  var WX_G = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
  var DUN0 = { 甲: 0, 己: 0, 乙: 2, 庚: 2, 丙: 4, 辛: 4, 丁: 6, 壬: 6, 戊: 8, 癸: 8 };

  function hourZhiIndex(h) {
    return Math.floor((h + 1) / 2) % 12;
  }
  function timeGz(dayGan, h) {
    var zi = hourZhiIndex(h);
    var start = DUN0[dayGan];
    if (start == null) start = 0;
    return GAN.charAt((start + zi) % 10) + ZHI.charAt(zi);
  }
  function addDays(y, m, d, n) {
    var dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + n);
    return { y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate() };
  }
  function dayGzAtNoon(y, m, d) {
    var Solar = global.Solar;
    var solar = Solar.fromYmdHms(y, m, d, 12, 0, 0);
    var ec = solar.getLunar().getEightChar();
    if (ec && typeof ec.setSect === 'function') {
      try { ec.setSect(1); } catch (e) {}
    }
    return ec.getDay();
  }
  function resolveBaZiClock(y, m, d, hour, minute) {
    var h = (hour == null || hour === '') ? 12 : +hour;
    var min = (minute == null || minute === '') ? 0 : +minute;
    if (isNaN(h)) h = 12;
    if (isNaN(min)) min = 0;
    var zi = (h === 23) ? 'late' : (h === 0 ? 'early' : '');
    return { y: y, m: m, d: d, hour: h, minute: min, zi: zi };
  }

  function pillarsFromClock(clk) {
    var Solar = global.Solar;
    if (!Solar) throw new Error('需要 lunar-javascript');
    var solar = Solar.fromYmdHms(clk.y, clk.m, clk.d, clk.hour, clk.minute, 0);
    var lunar = solar.getLunar();
    var ec = lunar.getEightChar();
    if (ec && typeof ec.setSect === 'function') {
      try { ec.setSect(1); } catch (e) {}
    }
    var dayGz = dayGzAtNoon(clk.y, clk.m, clk.d);
    var dunDay = dayGz;
    if (clk.hour === 23) {
      var nx = addDays(clk.y, clk.m, clk.d, 1);
      dunDay = dayGzAtNoon(nx.y, nx.m, nx.d);
    }
    var hourGz = timeGz(dunDay.charAt(0), clk.hour);
    var note = '';
    if (clk.hour === 23) {
      note = '24h 夜子23:00–23:59 · 日柱' + dayGz + '（當日）· 時柱' + hourGz + '（次日' + dunDay + '遁）';
    } else if (clk.hour === 0) {
      note = '24h 早子00:00–00:59 · 日柱' + dayGz + '（00:00已換日）· 時柱' + hourGz + '（當日遁）';
    }
    return {
      year: ec.getYear(),
      month: ec.getMonth(),
      day: dayGz,
      hour: hourGz,
      dayMaster: dayGz.charAt(0),
      dayMasterWx: WX_G[dayGz.charAt(0)] || '',
      ziKind: clk.zi,
      clockNote: note
    };
  }

  function applyPillars(dst, src) {
    if (!dst || !src) return dst;
    dst.year = src.year;
    dst.month = src.month;
    dst.day = src.day;
    dst.hour = src.hour;
    dst.dayMaster = src.dayMaster;
    dst.dayMasterWx = src.dayMasterWx;
    dst.ziKind = src.ziKind;
    dst.clockNote = src.clockNote;
    return dst;
  }

  function install() {
    var E = global.TXMarkSixEngine || (global.TXMarkSixEngine = {});
    E.resolveBaZiClock = resolveBaZiClock;
    E.timeGz = timeGz;
    E.hourZhiIndex = hourZhiIndex;
    E.pillarsAt = function (y, m, d, hour, minute) {
      var fallbackMin = (minute != null && minute !== '') ? +minute : (hour === 21 ? 30 : 0);
      return pillarsFromClock(resolveBaZiClock(y, m, d, hour, fallbackMin));
    };
    E.pillarsAt._zishiV4 = true;
    E.pillarsAt._zishiV3 = true;
    E.pillarsAt._zishi = true;
    if (E.buildYun && !E.buildYun._zishiV4) {
      var origY = E.buildYun;
      E.buildYun = function (y, m, d, h, min, sex, at) {
        var clk = resolveBaZiClock(y, m, d, h, min || 0);
        var pack = origY(clk.y, clk.m, clk.d, clk.hour, clk.minute, sex, at);
        var p = pillarsFromClock(clk);
        if (pack && pack.pillars) applyPillars(pack.pillars, p);
        if (pack && pack.day_master) {
          pack.day_master.gan = p.dayMaster;
          pack.day_master.wx = p.dayMasterWx;
        }
        return pack;
      };
      E.buildYun._zishiV4 = true;
      E.buildYun._zishiV3 = true;
      E.buildYun._zishi = true;
    }
    E._zishi = true;
  }
  install();
  var n = 0;
  var t = setInterval(function () {
    n++;
    install();
    if ((global.TXMarkSixEngine && global.TXMarkSixEngine.pillarsAt && global.TXMarkSixEngine.pillarsAt._zishiV4) || n > 40) {
      clearInterval(t);
    }
  }, 50);
})(typeof window !== 'undefined' ? window : globalThis);
