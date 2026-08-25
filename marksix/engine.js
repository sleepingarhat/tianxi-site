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
  var CANG_GAN = {
    子:['癸'], 丑:['己','癸','辛'], 寅:['甲','丙','戊'], 卯:['乙'],
    辰:['戊','乙','癸'], 巳:['丙','戊','庚'], 午:['丁','己'], 未:['己','丁','乙'],
    申:['庚','壬','戊'], 酉:['辛'], 戌:['戊','辛','丁'], 亥:['壬','甲']
  };
  var YANG_GAN = { 甲:1, 丙:1, 戊:1, 庚:1, 壬:1 };
  var WX_CLS = { 木:'mu', 火:'huo', 土:'tu', 金:'jin', 水:'shui' };
  var SHENG = { 木:'火', 火:'土', 土:'金', 金:'水', 水:'木' };
  var KE = { 木:'土', 火:'金', 土:'水', 金:'木', 水:'火' };
  var ZWX = { 子:'水', 丑:'土', 寅:'木', 卯:'木', 辰:'土', 巳:'火', 午:'火', 未:'土', 申:'金', 酉:'金', 戌:'土', 亥:'水' };

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
  function enrichPillars(p) {
    if (!p) return null;
    var dm = p.dayMaster || (p.day && p.day.charAt(0)) || '';
    var order = [
      { key: 'hour', lab: '時' },
      { key: 'day', lab: '日' },
      { key: 'month', lab: '月' },
      { key: 'year', lab: '年' }
    ];
    var cols = order.map(function (o) {
      var gz = p[o.key] || '';
      var g = gz.charAt(0), z = gz.charAt(1);
      var gwx = WX_G[g] || '', zwx = ZWX[z] || '';
      var cang = (CANG_GAN[z] || []).map(function (cg) {
        return { gan: cg, wx: WX_G[cg] || '', cls: WX_CLS[WX_G[cg]] || '', shen: tenGod(dm, cg) };
      });
      return {
        lab: o.lab, key: o.key, gz: gz,
        gan: g, ganWx: gwx, ganCls: WX_CLS[gwx] || '', ganShen: tenGod(dm, g),
        zhi: z, zhiWx: zwx, zhiCls: WX_CLS[zwx] || '',
        zhiShen: cang.length ? cang[0].shen : '',
        cang: cang
      };
    });
    return { dayMaster: dm, dayMasterWx: p.dayMasterWx || WX_G[dm] || '', cols: cols, raw: p };
  }

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
    if (!global.Solar) throw new Error('lunar-javascript not loaded');
    var solar = global.Solar.fromYmdHms(y, m, d, hour || 12, 0, 0);
    var lunar = solar.getLunar();
    var ec = lunar.getEightChar();
    return { year: ec.getYear(), month: ec.getMonth(), day: ec.getDay(), hour: ec.getTime(), dayMaster: ec.getDay().charAt(0), dayMasterWx: WX_G[ec.getDay().charAt(0)] || '' };
  }
  function mapGz(gz, weight, scores) {
    if (!gz || gz.length < 2) return;
    var g = gz.charAt(0), z = gz.charAt(1);
    var tailsG = WX_TAILS[WX_G[g]] || [], tailsZ = WX_TAILS[ZWX[z] || WX_G[z]] || [];
    for (var n = 1; n <= 49; n++) {
      var t = n % 10;
      if (tailsG.indexOf(t) >= 0 || tailsZ.indexOf(t) >= 0 || (t === 0 && (tailsG.indexOf(0) >= 0 || tailsZ.indexOf(0) >= 0)))
        scores[n] = (scores[n] || 0) + weight;
    }
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
    var ft = fuTou(y, m, d);
    var zhi = (ft.gz || '').charAt(1);
    var yuanIdx = FU_ZHI_YUAN[zhi] != null ? FU_ZHI_YUAN[zhi] : 0;
    var yuanNames = ['上元', '中元', '下元'];
    var table = jq.yang ? YANG_JU : YIN_JU;
    var key = resolveKey(jq.name, table);
    var juList = table[key] || [1, 7, 4];
    var ju = juList[yuanIdx] || juList[0];
    return { yang: jq.yang, ju: ju, yuan: yuanNames[yuanIdx], meta: { jie: jq.name, fu_tou_gz: ft.gz, method: '拆補·blog/407' } };
  }
  function arrangeDi(yang, ju) {
    var di = {};
    var order = yang ? [1, 8, 3, 4, 9, 2, 7, 6] : [9, 2, 7, 6, 1, 8, 3, 4];
    var start = order.indexOf(ju);
    if (start < 0) start = 0;
    for (var i = 0; i < 8; i++) {
      var palace = order[(start + i) % 8];
      di[palace] = YI_ORDER[i];
    }
    di[5] = '戊';
    return di;
  }
  function xunShouYi(dayGz) {
    var g = dayGz.charAt(0), z = dayGz.charAt(1);
    var gi = GAN.indexOf(g), zi = ZHI.indexOf(z);
    var diff = (zi - gi + 12) % 12;
    var xunStartZ = ZHI.charAt((zi - diff + 12) % 12);
    var map = { 子: '戊', 戌: '己', 申: '庚', 午: '辛', 辰: '壬', 寅: '癸' };
    return map[xunStartZ] || '戊';
  }
  function findPalace(di, gan) {
    for (var p = 1; p <= 9; p++) if (di[p] === gan) return p;
    return 5;
  }
  function castQimen(y, m, d, hour) {
    var pillars = pillarsAt(y, m, d, hour), yj = yuanJu(y, m, d), di = arrangeDi(yj.yang, yj.ju);
    var yi0 = xunShouYi(pillars.day), origin = 5;
    var zf = findPalace(di, yi0);
    var hg = pillars.hour.charAt(0);
    var sgp = findPalace(di, hg);
    return { yang: yj.yang, ju: yj.ju, yuan: yj.yuan, pillars: pillars, di_pan: di, zhi_fu_palace: zf, zhi_fu_origin: origin, shi_gan_palace: sgp, meta: yj.meta };
  }
  function digitExpand(fh) {
    var out = [];
    for (var n = 1; n <= 49; n++) if (n % 10 === fh || (fh === 0 && n % 10 === 0)) out.push(n);
    return out;
  }
  function add(scores, nums, w) {
    (nums || []).forEach(function (n) { if (n >= 1 && n <= 49) scores[n] = (scores[n] || 0) + w; });
  }
  function extractScores(pan, scale) {
    var scores = {}, di = pan.di_pan || {};
    var hg = pan.pillars.hour.charAt(0), hz = pan.pillars.hour.charAt(1);
    var dg = pan.pillars.day.charAt(0), dz = pan.pillars.day.charAt(1);
    var sgp = pan.shi_gan_palace || 5;
    var tails = PALACE_TAILS[sgp] || [];
    tails.forEach(function (t) {
      for (var n = 1; n <= 49; n++) if (n % 10 === t || (t === 0 && n % 10 === 0)) scores[n] = (scores[n] || 0) + 1.5 * scale;
    });
    var xian = PALACE_XIAN[sgp];
    if (xian) (PALACE_TAILS[xian] || []).forEach(function (t) {
      for (var n = 1; n <= 49; n++) if (n % 10 === t || (t === 0 && n % 10 === 0)) scores[n] = (scores[n] || 0) + 0.8 * scale;
    });
    [hg, hz, dg, dz].forEach(function (ch) {
      var fh = FAN_HONG[ch]; if (fh != null) add(scores, digitExpand(fh === 0 ? 0 : fh), 1.2 * scale);
    });
    ['year', 'month', 'day', 'hour'].forEach(function (k) {
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
    pillarsAt: pillarsAt, enrichPillars: enrichPillars, tenGod: tenGod, castQimen: castQimen, scorePred: scorePred,
    ruleVersion: 'bazi + qimen-chaibu-v3 (blog/407起局 + 719/28/31取數)'
  };
})(typeof window !== 'undefined' ? window : globalThis);
