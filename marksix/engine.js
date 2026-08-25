/* tianxi marksix — bazi + qimen chaibu-v3 · 起局 blog/407 */
(function (global) {
  'use strict';
  var GAN = '甲乙丙丁戊己庚辛壬癸';
  var ZHI = '子丑寅卯辰巳午未申酉戌亥';
  var YI_ORDER = '戊己庚辛壬癸丁丙乙'.split('');
  var SAN_QI = { 乙: 1, 丙: 1, 丁: 1 };
  var WX_G = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
  var WX_TAILS = { 水: [1, 6], 火: [2, 7], 木: [3, 8], 金: [4, 9], 土: [0, 5] };
  var YANG_JU = {
    冬至: [1, 7, 4], 小寒: [2, 8, 5], 大寒: [3, 9, 6], 立春: [8, 5, 2], 雨水: [9, 6, 3],
    驚蟄: [1, 7, 4], 惊蛰: [1, 7, 4], 春分: [3, 9, 6], 清明: [4, 1, 7], 穀雨: [5, 2, 8], 谷雨: [5, 2, 8],
    立夏: [4, 1, 7], 小滿: [5, 2, 8], 小满: [5, 2, 8], 芒種: [6, 3, 9], 芒种: [6, 3, 9]
  };
  var YIN_JU = {
    夏至: [9, 3, 6], 小暑: [8, 2, 5], 大暑: [7, 1, 4], 立秋: [2, 5, 8], 處暑: [1, 4, 7], 处暑: [1, 4, 7],
    白露: [9, 3, 6], 秋分: [7, 1, 4], 寒露: [6, 9, 3], 霜降: [5, 8, 2], 立冬: [6, 9, 3], 小雪: [5, 8, 2], 大雪: [4, 7, 1]
  };
  var FU_ZHI_YUAN = { 子: 0, 午: 0, 卯: 0, 酉: 0, 寅: 1, 申: 1, 巳: 1, 亥: 1, 辰: 2, 戌: 2, 丑: 2, 未: 2 };
  var PALACE_XIAN = { 1: 6, 2: 8, 3: 4, 4: 5, 5: 5, 6: 1, 7: 2, 8: 7, 9: 3 };
  var PALACE_TAILS = {
    1: [1, 6, 8], 8: [4, 5, 0, 7, 8], 3: [3, 8, 4], 4: [3, 8, 4, 5, 2],
    9: [2, 7, 9, 3, 1], 2: [5, 0, 2, 8], 7: [4, 9, 2, 7, 6], 6: [4, 9, 6, 7, 1], 5: [5, 0]
  };
  var FAN_HONG = {
    甲: 9, 己: 9, 子: 9, 午: 9, 乙: 8, 庚: 8, 丑: 8, 未: 8,
    丙: 7, 辛: 7, 寅: 7, 申: 7, 丁: 6, 壬: 6, 卯: 6, 酉: 6,
    戊: 5, 癸: 5, 辰: 5, 戌: 5, 巳: 4, 亥: 4
  };
  var DRAW_W = { hour: 4, day: 3, month: 2, year: 1.5, day_master_wx: 1 };
  var PERSONAL_W = { day: 3, hour: 2.5, month: 2, year: 1.5, day_master_wx: 1 };

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
  function pillarsAt(y, m, d, hour) {
    var Solar = global.Solar;
    if (!Solar) throw new Error('需要 lunar-javascript');
    var solar = Solar.fromYmdHms(y, m, d, hour, hour === 21 ? 30 : 0, 0);
    var ec = solar.getLunar().getEightChar();
    return { year: ec.getYear(), month: ec.getMonth(), day: ec.getDay(), hour: ec.getTime(), dayMaster: ec.getDay().charAt(0), dayMasterWx: WX_G[ec.getDay().charAt(0)] || '' };
  }
  function mapGz(gz, weight, scores) {
    if (!gz || gz.length < 2) return;
    var gi = GAN.indexOf(gz.charAt(0)) + 1, zi = ZHI.indexOf(gz.charAt(1)) + 1;
    if (gi < 1 || zi < 1) return;
    var bases = [gi, zi, gi + zi, Math.abs(gi * zi), (gi * 6 + zi) % 49 + 1], cands = {};
    bases.forEach(function (base) {
      var n = ((base - 1) % 49) + 1; cands[n] = 1; cands[((n + 8) % 49) + 1] = 1; cands[((n + 23) % 49) + 1] = 1;
    });
    Object.keys(cands).forEach(function (k) { scores[+k] = (scores[+k] || 0) + weight; });
  }
  function mapWx(wx, weight, scores) {
    var tails = WX_TAILS[wx] || [];
    for (var n = 1; n <= 49; n++) {
      var t = n % 10;
      if (tails.indexOf(t) >= 0 || (t === 0 && tails.indexOf(0) >= 0)) scores[n] = (scores[n] || 0) + weight;
    }
  }
  function scoreChart(pillars, weights, scores) {
    ['year', 'month', 'day', 'hour'].forEach(function (k) { if (weights[k]) mapGz(pillars[k], weights[k], scores); });
    if (weights.day_master_wx) mapWx(pillars.dayMasterWx || WX_G[pillars.day.charAt(0)], weights.day_master_wx, scores);
  }
  function pureBazi(y, m, d) {
    var pillars = pillarsAt(y, m, d, 21), scores = {};
    scoreChart(pillars, DRAW_W, scores);
    return { mode: 'pure_bazi', pillars: pillars, method: { anchor: '攪珠日 21:30 HKT', weights: '時4 日3 月2 年1.5 + 日主河圖1', pick: '五段目標各3' }, numbers: pick15(scores) };
  }
  function personalBazi(py, pm, pd, ph, dy, dm, dd) {
    var personal = pillarsAt(py, pm, pd, ph), draw = pillarsAt(dy, dm, dd, 21), scores = {};
    scoreChart(draw, DRAW_W, scores); scoreChart(personal, PERSONAL_W, scores);
    return { mode: 'bazi_personal_x_draw', personal_pillars: personal, draw_pillars: draw, numbers: pick15(scores) };
  }

  function jieqiAround(y, m, d) {
    var solar = global.Solar.fromYmd(y, m, d);
    var lunar = solar.getLunar();
    var prev = lunar.getPrevJieQi(true);
    var jqSolar = prev.getSolar();
    var jieStart = new Date(jqSolar.getYear(), jqSolar.getMonth() - 1, jqSolar.getDay());
    var yang = true, scan = lunar;
    try {
      for (var i = 0; i < 24; i++) {
        var p = scan.getPrevJieQi(true), nm = p.getName();
        if (nm === '冬至') { yang = true; break; }
        if (nm === '夏至') { yang = false; break; }
        scan = p.getSolar().getLunar();
      }
    } catch (e) {}
    return { name: prev.getName(), jieStart: jieStart, yang: yang };
  }
  function fuTou(y, m, d) {
    for (var back = 0; back < 15; back++) {
      var dt = new Date(y, m - 1, d - back);
      var p = pillarsAt(dt.getFullYear(), dt.getMonth() + 1, dt.getDate(), 12);
      if (p.day.charAt(0) === '甲' || p.day.charAt(0) === '己')
        return { date: new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()), gz: p.day };
    }
    return { date: new Date(y, m - 1, d), gz: '' };
  }
  function resolveKey(name, table) {
    if (table[name]) return name;
    var keys = Object.keys(table);
    for (var i = 0; i < keys.length; i++) if (keys[i].charAt(0) === name.charAt(0)) return keys[i];
    return keys[0];
  }
  function yuanJu(y, m, d) {
    var jq = jieqiAround(y, m, d);
    var yang = jq.yang, table = yang ? YANG_JU : YIN_JU;
    var key = resolveKey(jq.name, table);
    var ft = fuTou(y, m, d);
    var zhi = ft.gz.charAt(1);
    var yi = FU_ZHI_YUAN[zhi] != null ? FU_ZHI_YUAN[zhi] : 0;
    var chao = ft.date < jq.jieStart;
    return {
      yang: yang, ju: table[key][yi], yuan: ['上元', '中元', '下元'][yi],
      meta: {
        jie: jq.name, ju_key: key, fu_tou_gz: ft.gz,
        jie_qi: chao ? '超神' : '接氣或正授',
        method: 'chaibu', rule: 'qimen-chaibu-v3', source: 'qimenpai.com/blog/407'
      }
    };
  }
  function arrangeDi(yang, ju) {
    var path = [1, 8, 3, 4, 9, 2, 7, 6], startIdx = path.indexOf(ju);
    if (ju === 5) startIdx = path.indexOf(2); if (startIdx < 0) startIdx = 0;
    var di = {};
    for (var i = 0; i < YI_ORDER.length; i++) {
      var palace = yang ? path[(startIdx + i) % 8] : path[(startIdx - i + 80) % 8];
      di[palace] = YI_ORDER[i];
    }
    di[5] = di[2] || '戊'; return di;
  }
  function xunShouYi(dayGz) {
    var gi = GAN.indexOf(dayGz.charAt(0)), zi = ZHI.indexOf(dayGz.charAt(1)), idx = 0;
    for (var i = 0; i < 60; i++) if (i % 10 === gi && i % 12 === zi) { idx = i; break; }
    return '戊己庚辛壬癸'.charAt(Math.floor(idx / 10));
  }
  function castQimen(y, m, d, hour) {
    var pillars = pillarsAt(y, m, d, hour), yj = yuanJu(y, m, d), di = arrangeDi(yj.yang, yj.ju);
    var yi0 = xunShouYi(pillars.day), origin = 5;
    Object.keys(di).forEach(function (pk) { var p = +pk; if (di[p] === yi0 && p !== 5) origin = p; });
    var hg = pillars.hour.charAt(0);
    var target = hg === '甲' ? yi0 : (YI_ORDER.indexOf(hg) >= 0 ? hg : yi0);
    var zf = origin, sgp = 5;
    Object.keys(di).forEach(function (pk) {
      var p = +pk;
      if (di[p] === target && p !== 5) { zf = p; sgp = p; }
    });
    return { yang: yj.yang, ju: yj.ju, yuan: yj.yuan, pillars: pillars, di_pan: di, zhi_fu_palace: zf, zhi_fu_origin: origin, shi_gan_palace: sgp, meta: yj.meta };
  }
  function norm49(x) { x = Math.abs(x) || 1; return ((x - 1) % 49) + 1; }
  function digitExpand(digit) {
    var d = digit % 10; if (d === 0) d = 10;
    var out = [];
    for (var k = 0; k < 5; k++) { var n = d + k * 10; if (n >= 1 && n <= 49) out.push(n); }
    return out;
  }
  function tailsToNums(tails) {
    var out = [];
    for (var n = 1; n <= 49; n++) {
      var t = n % 10;
      if (tails.indexOf(t) >= 0 || (t === 0 && tails.indexOf(0) >= 0)) out.push(n);
    }
    return out;
  }
  function add(scores, nums, w) {
    nums.forEach(function (n) { if (n >= 1 && n <= 49) scores[n] = (scores[n] || 0) + w; });
  }
  function extractScores(pan, scale) {
    scale = scale || 1;
    var scores = {}, sgp = pan.shi_gan_palace, di = pan.di_pan;
    var hg = pan.pillars.hour.charAt(0), hz = pan.pillars.hour.charAt(1);
    var dg = pan.pillars.day.charAt(0), dz = pan.pillars.day.charAt(1);
    for (var i = 1; i <= 49; i++) scores[i] = 0;
    add(scores, tailsToNums(PALACE_TAILS[sgp] || [1, 6]), 4 * scale);
    add(scores, tailsToNums(PALACE_TAILS[pan.zhi_fu_palace] || []), 2.5 * scale);
    [[hg, 3.5], [hz, 3], [dg, 2.5], [dz, 2]].forEach(function (pair) {
      var fh = FAN_HONG[pair[0]];
      if (fh) add(scores, digitExpand(fh), pair[1] * scale);
    });
    Object.keys(di).forEach(function (pk) {
      var palace = +pk; if (palace === 5) return;
      var gan = di[palace], fh = FAN_HONG[gan];
      if (!fh) return;
      var w = 1.2;
      if (palace === sgp) w = 3;
      else if (palace === pan.zhi_fu_palace) w = 2.5;
      else if (SAN_QI[gan]) w = 1.8;
      add(scores, digitExpand(fh), w * scale);
      add(scores, [norm49(palace + fh)], 1.5 * scale);
      add(scores, [norm49((PALACE_XIAN[palace] || 5) + fh)], 1.2 * scale);
    });
    var ht = sgp, xt = PALACE_XIAN[sgp] || 5;
    [ht, xt, ht + xt, pan.ju, pan.ju + ht, pan.zhi_fu_palace, pan.zhi_fu_origin].forEach(function (v) {
      add(scores, digitExpand(v), 1.5 * scale);
      add(scores, [norm49(v), norm49(v + 10), norm49(v + 20)], 0.8 * scale);
    });
    ['year', 'month'].forEach(function (k) {
      var gz = pan.pillars[k] || '';
      if (gz.length >= 2) {
        [gz.charAt(0), gz.charAt(1)].forEach(function (ch) {
          var fh = FAN_HONG[ch]; if (fh) add(scores, digitExpand(fh), (k === 'month' ? 1.2 : 1) * scale);
        });
      }
    });
    return scores;
  }
  function pureQimen(y, m, d) {
    var pan = castQimen(y, m, d, 21);
    return {
      mode: 'pure_qimen', pan: pan,
      method: {
        dingju: '拆補 · blog/407：符頭地支定元 + 當日節氣口訣定局（不置閏）',
        extract: '時乾落宮字尾 + 範洪五行數 + 宮先後天',
        refs: 'qimenpai.com/blog/407 · /719 · /28 · /31',
        pick: '五段×3'
      },
      numbers: pick15(extractScores(pan, 1))
    };
  }
  function personalQimen(py, pm, pd, ph, dy, dm, dd) {
    var personal = castQimen(py, pm, pd, ph), draw = castQimen(dy, dm, dd, 21), scores = {};
    var a = extractScores(draw, 1), b = extractScores(personal, 0.75);
    for (var i = 1; i <= 49; i++) scores[i] = (a[i] || 0) + (b[i] || 0);
    return { mode: 'qimen_personal_x_draw', personal: personal, draw: draw, numbers: pick15(scores) };
  }
  function scorePred(pred, numbers, special) {
    var set = {}; pred.forEach(function (n) { set[n] = 1; });
    var hit = []; (numbers || []).forEach(function (n) { if (set[n]) hit.push(n); });
    var s = hit.length, spHit = special != null && set[special];
    if (spHit) s += 0.5;
    return { score: s, hit_zheng: hit, hit_special: !!spHit };
  }

  global.TXMarkSixEngine = {
    pureBazi: pureBazi, pureQimen: pureQimen, personalBazi: personalBazi, personalQimen: personalQimen,
    pillarsAt: pillarsAt, castQimen: castQimen, scorePred: scorePred,
    ruleVersion: 'bazi + qimen-chaibu-v3 (blog/407起局 + 719/28/31取數)'
  };
})(typeof window !== 'undefined' ? window : globalThis);
