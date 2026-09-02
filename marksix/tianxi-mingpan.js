/* tianxi-mingpan-v1-js · 男女命 + 節氣分鐘起運 + 當運／流年（前端） */
(function (global) {
  'use strict';
  var GAN = '甲乙丙丁戊己庚辛壬癸';
  var ZHI = '子丑寅卯辰巳午未申酉戌亥';
  var WX_G = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
  var YANG_GAN = { 甲: 1, 丙: 1, 戊: 1, 庚: 1, 壬: 1 };
  var SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  var KE = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' };
  var SHEN_FULL = { 比: '比肩', 劫: '劫財', 食: '食神', 傷: '傷官', 才: '偏財', 財: '正財', 梟: '偏印', 印: '正印', 殺: '七殺', 官: '正官' };

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function parseSex(s) {
    var t = String(s || '').trim().toLowerCase();
    if (t === 'm' || t === 'male' || t === '男' || t === '1' || t === 'man') return 'male';
    if (t === 'f' || t === 'female' || t === '女' || t === '0' || t === 'woman') return 'female';
    return '';
  }
  function yearGzLichun(year) {
    var i = ((year - 1984) % 60 + 60) % 60;
    return GAN.charAt(i % 10) + ZHI.charAt(i % 12);
  }
  function tenGod(dm, gan) {
    if (!dm || !gan) return '';
    var w1 = WX_G[dm], w2 = WX_G[gan];
    if (!w1 || !w2) return '';
    var sameY = (!!YANG_GAN[dm]) === (!!YANG_GAN[gan]);
    if (w1 === w2) return sameY ? '比' : '劫';
    if (SHENG[w1] === w2) return sameY ? '食' : '傷';
    if (KE[w1] === w2) return sameY ? '才' : '財';
    if (SHENG[w2] === w1) return sameY ? '梟' : '印';
    if (KE[w2] === w1) return sameY ? '殺' : '官';
    return '';
  }
  function shiShen(dm, gan) { return SHEN_FULL[tenGod(dm, gan)] || ''; }
  function solarIso(s) {
    return s.getYear() + '-' + pad2(s.getMonth()) + '-' + pad2(s.getDay()) +
      'T' + pad2(s.getHour()) + ':' + pad2(s.getMinute()) + ':' + pad2(s.getSecond());
  }
  function parseIso(s) {
    var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    if (!m) return new Date(s);
    return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  }

  function buildYun(y, m, d, h, min, sex, at) {
    var sexN = parseSex(sex);
    if (!sexN) throw new Error('請選男命或女命');
    if (!global.Solar) throw new Error('需要 lunar-javascript');
    min = (min == null || min === '') ? 0 : +min;
    h = (h == null || h === '') ? 12 : +h;
    if (isNaN(h)) h = 12;
    if (isNaN(min)) min = 0;
    var clk = (global.TXMarkSixEngine && global.TXMarkSixEngine.resolveBaZiClock)
      ? global.TXMarkSixEngine.resolveBaZiClock(y, m, d, h, min)
      : { y: y, m: m, d: d, hour: h, minute: min };
    var solar = global.Solar.fromYmdHms(clk.y, clk.m, clk.d, clk.hour, clk.minute, 0);
    var lunar = solar.getLunar();
    var ec = lunar.getEightChar();
    if (ec && typeof ec.setSect === 'function') {
      try { ec.setSect(1); } catch (e) {}
    }
    var yun = ec.getYun(sexN === 'male' ? 1 : 0, 2);
    var forward = yun.isForward();
    var JIE_TRAD = { 惊蛰: '驚蟄', 谷雨: '穀雨', 小满: '小滿', 芒种: '芒種', 处暑: '處暑' };
    var jie = forward ? lunar.getNextJie() : lunar.getPrevJie();
    var jieName = JIE_TRAD[jie.getName()] || jie.getName();
    var qiyunSolar = yun.getStartSolar();
    var pillars = {
      year: ec.getYear(),
      month: ec.getMonth(),
      day: ec.getDay(),
      hour: ec.getTime(),
      dayMaster: ec.getDay().charAt(0),
      dayMasterWx: WX_G[ec.getDay().charAt(0)] || ''
    };
    if (global.TXMarkSixEngine && typeof global.TXMarkSixEngine.pillarsAt === 'function') {
      try {
        var zp = global.TXMarkSixEngine.pillarsAt(clk.y, clk.m, clk.d, clk.hour, clk.minute);
        if (zp && zp.hour) {
          pillars.year = zp.year || pillars.year;
          pillars.month = zp.month || pillars.month;
          pillars.day = zp.day || pillars.day;
          pillars.hour = zp.hour;
          pillars.dayMaster = zp.dayMaster || pillars.day.charAt(0);
          pillars.dayMasterWx = zp.dayMasterWx || WX_G[pillars.dayMaster] || '';
        }
      } catch (eZ) {}
    }
    var dm = pillars.dayMaster;
    var note = yun.getStartYear() + '年' + yun.getStartMonth() + '個月' +
      yun.getStartDay() + '日' + yun.getStartHour() + '時後起運';
    var atDate = at instanceof Date ? at : new Date();
    var n = 8;
    var rows = [];
    rows.push({
      index: 0,
      kind: '童限',
      ganzhi: pillars.month,
      shi_shen: shiShen(dm, pillars.month.charAt(0)),
      start_solar: solarIso(solar),
      end_solar: solarIso(qiyunSolar),
      xu_sui: '1–' + Math.max(1, qiyunSolar.getYear() - solar.getYear()) + '歲',
      current: false
    });
    for (var i = 1; i <= n; i++) {
      var st = qiyunSolar.nextYear((i - 1) * 10);
      var ed = qiyunSolar.nextYear(i * 10);
      var gz = (function () {
        var jia = [];
        for (var a = 0; a < 60; a++) jia.push(GAN.charAt(a % 10) + ZHI.charAt(a % 12));
        var idx = jia.indexOf(pillars.month);
        var step = forward ? i : -i;
        return jia[(idx + step + 60) % 60];
      })();
      var age0 = st.getYear() - solar.getYear() + 1;
      rows.push({
        index: i,
        kind: '大運',
        ganzhi: gz,
        shi_shen: shiShen(dm, gz.charAt(0)),
        start_solar: solarIso(st),
        end_solar: solarIso(ed),
        xu_sui: age0 + '–' + (age0 + 9) + '歲',
        current: false
      });
    }
    var current = rows[0];
    var hit = false;
    for (var r = 0; r < rows.length; r++) {
      var stD = parseIso(rows[r].start_solar);
      var edD = parseIso(rows[r].end_solar);
      if (stD <= atDate && atDate < edD) {
        current = rows[r];
        rows[r].current = true;
        hit = true;
        break;
      }
    }
    if (!hit) {
      current = rows[rows.length - 1];
      current.current = true;
    }
    var lnYear = atDate.getFullYear();
    var lnGz = yearGzLichun(lnYear);
    var lnStart = parseIso(current.start_solar).getFullYear();
    var lnEnd = parseIso(current.end_solar).getFullYear();
    var liunian = [];
    for (var yy = lnStart; yy <= lnEnd; yy++) {
      var g = yearGzLichun(yy);
      liunian.push({
        year: yy,
        ganzhi: g,
        shi_shen: shiShen(dm, g.charAt(0)),
        current: yy === lnYear
      });
    }
    return {
      engineId: 'tianxi-dayun-v2-js',
      sex: sexN,
      sexLabel: sexN === 'male' ? '男命' : '女命',
      pillars: pillars,
      day_master: { gan: dm, wx: pillars.dayMasterWx },
      forward: forward,
      direction: forward ? '順行' : '逆行',
      jie: { name: jieName, datetime: solarIso(jie.getSolar()) },
      qiyun: {
        years: yun.getStartYear(),
        months: yun.getStartMonth(),
        days: yun.getStartDay(),
        hours: yun.getStartHour()
      },
      qiyun_solar: solarIso(qiyunSolar),
      qiyun_note: note,
      at: atDate.getFullYear() + '-' + pad2(atDate.getMonth() + 1) + '-' + pad2(atDate.getDate()) +
        'T' + pad2(atDate.getHours()) + ':' + pad2(atDate.getMinutes()) + ':' + pad2(atDate.getSeconds()),
      current_dayun: {
        index: current.index,
        kind: current.kind,
        ganzhi: current.ganzhi,
        shi_shen: current.shi_shen,
        start_solar: current.start_solar,
        end_solar: current.end_solar,
        xu_sui: current.xu_sui
      },
      current_liunian: {
        year: lnYear,
        ganzhi: lnGz,
        shi_shen: shiShen(dm, lnGz.charAt(0))
      },
      rows: rows,
      liunian_in_current: liunian
    };
  }

  function install() {
    var E = global.TXMarkSixEngine || (global.TXMarkSixEngine = {});
    E.buildYun = buildYun;
    E.parseSex = parseSex;
    E.yearGzLichun = yearGzLichun;
    E.shiShen = shiShen;
  }
  install();
})(typeof window !== 'undefined' ? window : globalThis);
