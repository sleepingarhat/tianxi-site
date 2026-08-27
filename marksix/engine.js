/* tianxi marksix — bazi + qimen chaibu-v3 · hetu-luoshu-v1 */
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
    驚蟬: [1, 7, 4], 惊蛰: [1, 7, 4], 春分: [3, 9, 6], 清明: [4, 1, 7], 穀雨: [5, 2, 8], 谷雨: [5, 2, 8],
    立夏: [4, 1, 7], 小滿: [5, 2, 8], 小满: [5, 2, 8], 芒種: [6, 3, 9], 芒种: [6, 3, 9]
  };
  var YIN_JU = {
    夏至: [9, 3, 6], 小暑: [8, 2, 5], 大暑: [7, 1, 4], 立秋: [2, 5, 8], 處暑: [1, 4, 7], 处暑: [1, 4, 7],
    白露: [9, 3, 6], 秋分: [7, 1, 4], 寒露: [6, 9, 3], 霜降: [5, 8, 2], 立冬: [6, 9, 3], 小雪: [5, 8, 2], 大雪: [4, 7, 1]
  };
  var FU_ZHI_YUAN = { 子: 0, 午: 0, 卯: 0, 酉: 0, 寅: 1, 申: 1, 巳: 1, 亥: 1, 辰: 2, 戌: 2, 丑: 2, 未: 2 };
  var PALACE_XIAN = { 1: 6, 2: 8, 3: 4, 4: 5, 5: 5, 6: 1, 7: 2, 8: 7, 9: 3 };
  var FAN_HONG = {
    甲: 9, 己: 9, 子: 9, 午: 9, 乙: 8, 庚: 8, 丑: 8, 未: 8,
    丙: 7, 辛: 7, 寅: 7, 申: 7, 丁: 6, 壬: 6, 卯: 6, 酉: 6,
    戊: 5, 癸: 5, 辰: 5, 戌: 5, 巳: 4, 亥: 4
  };
  var LUO_SHU_WX = { 1: '水', 2: '土', 3: '木', 4: '木', 5: '土', 6: '金', 7: '金', 8: '土', 9: '火' };
  var DRAW_W = { hour: 4, day: 3, month: 2, year: 1.5 };
  var PERSONAL_W = { day: 3, hour: 2.5, month: 2, year: 1.5 };
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
    var order = [{ key: 'hour', lab: '時' }, { key: 'day', lab: '日' }, { key: 'month', lab: '月' }, { key: 'year', lab: '年' }];
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
  function pillarsAt(y, m, d, hour, minute) {
    var Solar = global.Solar;
    if (!Solar) throw new Error('需要 lunar-javascript');
    var min = minute != null ? minute : (hour === 21 ? 30 : 0);
    var solar = Solar.fromYmdHms(y, m, d, hour || 12, min, 0);
    var ec = solar.getLunar().getEightChar();
    return { year: ec.getYear(), month: ec.getMonth(), day: ec.getDay(), hour: ec.getTime(), dayMaster: ec.getDay().charAt(0), dayMasterWx: WX_G[ec.getDay().charAt(0)] || '' };
  }
  function luoshuPalace(n) { var p = n % 9; return p === 0 ? 9 : p; }
  function mapHetuLuoshu(wx, weight, scores) {
    if (!wx || !weight) return;
    var tails = WX_TAILS[wx] || [];
    for (var n = 1; n <= 49; n++) {
      var t = n % 10;
      if (tails.indexOf(t) >= 0 || (t === 0 && tails.indexOf(0) >= 0)) scores[n] = (scores[n] || 0) + weight;
      if (LUO_SHU_WX[luoshuPalace(n)] === wx) scores[n] = (scores[n] || 0) + weight;
    }
  }
  function scoreChart(pillars, weights, scores) {
    ['year', 'month', 'day', 'hour'].forEach(function (k) {
      if (!weights[k] || !pillars[k]) return;
      var gz = pillars[k];
      mapHetuLuoshu(WX_G[gz.charAt(0)], weights[k], scores);
      mapHetuLuoshu(ZWX[gz.charAt(1)], weights[k], scores);
    });
  }
  function pureBazi(y, m, d) {
    var pillars = pillarsAt(y, m, d, 21), scores = {};
    scoreChart(pillars, DRAW_W, scores);
    return { mode: 'pure_bazi', pillars: pillars, method: { anchor: '攪珠日 21:30 HKT', map: '河圖尾數＋洛書九宮五行', weights: '時4 日3 月2 年1.5', pick: '五段各03' }, numbers: pick15(scores) };
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
      meta: { jie: jq.name, ju_key: key, fu_tou_gz: ft.gz, jie_qi: chao ? '超神' : '接氣或正授', method: 'chaibu', rule: 'qimen-chaibu-v3', source: 'qimenpai.com/blog/407' }
    };
  }
  function arrangeDi(yang, ju) {
    var start = ju >= 1 && ju <= 9 ? ju : 1, di = {};
    for (var i = 0; i < 9; i++) {
      var palace = yang ? ((start - 1 + i) % 9 + 1) : ((start - 1 - i + 9) % 9 + 1);
      di[palace] = YI_ORDER[i];
    }
    return di;
  }
  function findPalace(di, gan) {
    var hit = 5;
    Object.keys(di || {}).forEach(function (pk) { if (di[+pk] === gan) hit = +pk; });
    return hit;
  }
  function jiGong(yang) { return yang ? 2 : 8; }
  function ringPalace(p, yang) { return p === 5 ? jiGong(yang) : p; }
  function starHomeOf(star) {
    if (star === '禽芮') return 2;
    var hit = 0;
    Object.keys(STAR_HOME).forEach(function (pk) { if (STAR_HOME[+pk] === star) hit = +pk; });
    return hit;
  }
  function stemsWithStars(di, stars) {
    var tian = {};
    for (var p = 1; p <= 9; p++) {
      if (p === 5) { tian[5] = (di && di[5]) || ''; continue; }
      var star = (stars && stars[p]) || '';
      var home = starHomeOf(star);
      if (!home) { tian[p] = (di && di[p]) || ''; continue; }
      var stem = (di && di[home]) || '';
      if (star === '禽芮' || star === '天芮') {
        var mid = (di && di[5]) || '';
        if (mid && mid !== stem) stem = stem + mid;
      }
      tian[p] = stem;
    }
    return tian;
  }
  var RING = [1, 8, 3, 4, 9, 2, 7, 6];
  var STAR_HOME = { 1: '天蓬', 2: '天芮', 3: '天沖', 4: '天輔', 5: '天禽', 6: '天心', 7: '天柱', 8: '天任', 9: '天英' };
  var DOOR_HOME = { 1: '休門', 2: '死門', 3: '傷門', 4: '杜門', 5: '', 6: '開門', 7: '驚門', 8: '生門', 9: '景門' };
  var GONG_NAME = { 1: '坎', 2: '坤', 3: '震', 4: '巽', 5: '中', 6: '乾', 7: '兌', 8: '艮', 9: '離' };
  var GODS_YANG = ['值符', '騰蛇', '太陰', '六合', '白虎', '玄武', '九地', '九天'];
  var GODS_YIN = ['值符', '九天', '九地', '玄武', '白虎', '六合', '太陰', '騰蛇'];
  var XUN_KONG = { 戊: '戌亥', 己: '申酉', 庚: '午未', 辛: '辰巳', 壬: '寅卯', 癸: '子丑' };
  function ringIdx(p) { return RING.indexOf(p); }
  function rotateRing(origin, target) {
    var io = ringIdx(origin), it = ringIdx(target);
    if (io < 0) io = 0;
    if (it < 0) it = 0;
    return (it - io + 8) % 8;
  }
  function applyRot(map8, origin, target) {
    var off = rotateRing(origin, target), out = {};
    for (var i = 0; i < 8; i++) out[RING[(i + off) % 8]] = map8[RING[i]];
    return out;
  }
  function hourXun(hourGz) {
    var gi = GAN.indexOf(hourGz.charAt(0)), zi = ZHI.indexOf(hourGz.charAt(1)), idx = 0;
    for (var i = 0; i < 60; i++) if (i % 10 === gi && i % 12 === zi) { idx = i; break; }
    var yi = '戊己庚辛壬癸'.charAt(Math.floor(idx / 10));
    var headZ = ZHI.charAt(Math.floor(idx / 10) * 10 % 12);
    return { yi: yi, name: '甲' + headZ + yi, kong: XUN_KONG[yi] || '', ganPos: gi + 1 };
  }
  function flyZhiShi(origin, steps, yang) {
    var seq = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    var i = seq.indexOf(origin);
    if (i < 0) i = 0;
    var n = ((steps % 9) + 9) % 9;
    if (n === 0) n = 9;
    var idx = yang ? (i + n - 1) % 9 : (i - (n - 1) % 9 + 9) % 9;
    var p = seq[idx];
    if (p === 5) return yang ? 2 : 8;
    return p;
  }
  function buildZhuanPan(di, tian, yang, origin, target, zhiShiPalace) {
    var homeStar = {}, homeDoor = {};
    for (var i = 0; i < 8; i++) {
      var p = RING[i];
      homeStar[p] = STAR_HOME[p];
      homeDoor[p] = DOOR_HOME[p];
    }
    var o = ringPalace(origin, yang), t = ringPalace(target, yang), zsp = ringPalace(zhiShiPalace, yang);
    var stars = applyRot(homeStar, o, t);
    var doors = applyRot(homeDoor, o, zsp);
    stars[5] = '';
    doors[5] = '';
    var ruiPalace = jiGong(yang);
    Object.keys(stars).forEach(function (pk) { if (stars[+pk] === '天芮') ruiPalace = +pk; });
    if (ruiPalace !== 5) stars[ruiPalace] = '禽芮';
    tian = stemsWithStars(di, stars);
    var gods = {}, godList = yang ? GODS_YANG : GODS_YIN;
    var ti = ringIdx(t);
    if (ti < 0) ti = 0;
    for (var g = 0; g < 8; g++) gods[RING[(ti + g) % 8]] = godList[g];
    gods[5] = '';
    var palaces = {};
    for (var n = 1; n <= 9; n++) {
      palaces[n] = {
        id: n, name: GONG_NAME[n],
        di: (di && di[n]) || '', tian: (tian && tian[n]) || '',
        star: stars[n] || '', door: doors[n] || '', god: gods[n] || ''
      };
    }
    return palaces;
  }
  function castQimen(y, m, d, hour) {
    var pillars = pillarsAt(y, m, d, hour), yj = yuanJu(y, m, d), di = arrangeDi(yj.yang, yj.ju);
    var xun = hourXun(pillars.hour);
    var yi0 = xun.yi;
    var originRaw = findPalace(di, yi0);
    var origin = ringPalace(originRaw, yj.yang);
    var hg = pillars.hour.charAt(0);
    var targetGan = hg === '甲' ? yi0 : (YI_ORDER.indexOf(hg) >= 0 ? hg : yi0);
    var targetRaw = findPalace(di, targetGan);
    var zf = ringPalace(targetRaw, yj.yang);
    var sgp = zf;
    var zs = flyZhiShi(originRaw, xun.ganPos, yj.yang);
    var tian = {};
    var palaces = buildZhuanPan(di, tian, yj.yang, originRaw, targetRaw, zs);
    return {
      yang: yj.yang, ju: yj.ju, yuan: yj.yuan, pillars: pillars, di_pan: di,
      tian_pan: (function () { var t = {}; for (var i = 1; i <= 9; i++) t[i] = palaces[i].tian; return t; })(),
      palaces: palaces,
      zhi_fu_palace: zf, zhi_fu_origin: origin, shi_gan_palace: sgp,
      zhi_fu_star: STAR_HOME[originRaw] || '天禽',
      zhi_shi_palace: zs, zhi_shi_door: DOOR_HOME[originRaw] || '死門',
      xun_shou: xun.name, xun_shou_yi: yi0, kong_wang: xun.kong,
      method_pan: '時家 · 拆補 · 轉盤', meta: yj.meta
    };
  }
  function qimenBoardHTML(pan, title) {
    if (!pan) return '';
    var order = [4, 9, 2, 3, 5, 7, 8, 1, 6];
    var zf = pan.zhi_fu_palace, zs = pan.zhi_shi_palace, sg = pan.shi_gan_palace;
    var cells = order.map(function (n) {
      var c = (pan.palaces && pan.palaces[n]) || { id: n, name: GONG_NAME[n], di: (pan.di_pan || {})[n] || '', tian: '', star: '', door: '', god: '' };
      var cls = 'qm-cell';
      if (n === zf) cls += ' zf';
      if (n === zs) cls += ' zs';
      if (n === sg) cls += ' sg';
      if (n === 5) cls += ' mid';
      return '<div class="'+cls+'">'+'<div class="qm-god">'+(c.god || '')+'</div>'+'<div class="qm-star">'+(c.star || '')+'</div>'+'<div class="qm-door">'+(c.door || '')+'</div>'+'<div class="qm-tian">'+(c.tian || '')+'</div>'+'<div class="qm-di">'+(c.di || '')+'</div>'+'<div class="qm-gong">'+c.name+n+'</div>'+'</div>';
    }).join('');
    return '<style id="qm-css">.qm-wrap{margin:8px 0 14px}.qm-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;border:1px solid var(--rule,#ddd);border-radius:12px;padding:6px;background:var(--paper-2,#f6f4ee)}.qm-cell{position:relative;min-height:92px;border:1px solid var(--rule,#ddd);border-radius:8px;background:var(--paper,#fff);padding:5px 4px 16px;display:flex;flex-direction:column;align-items:center;gap:1px;text-align:center}.qm-cell.mid{background:var(--paper-3,#efece3)}.qm-cell.zf{box-shadow:inset 0 0 0 1.5px var(--gold,#c9a227)}.qm-cell.zs{background:color-mix(in srgb,var(--gold,#c9a227) 12%,var(--paper,#fff))}.qm-god{font-size:10px;font-weight:700;min-height:1.2em}.qm-star,.qm-door{font-size:12px;font-weight:800;line-height:1.2}.qm-tian{font-size:18px;font-weight:900;line-height:1.15;margin-top:2px}.qm-di{font-size:12px;font-weight:700;opacity:.7}.qm-gong{position:absolute;right:5px;bottom:3px;font-size:9px;opacity:.45}.qm-legend{display:flex;flex-wrap:wrap;gap:8px;font-size:10px;opacity:.7;margin-top:6px}</style>'+
      '<div class="qm-wrap">'+'<div class="bz-title"><b>'+title+'</b> · 時家拆補轉盤</div>'+
      '<p class="yun-meta">'+(pan.yang ? '陽' : '陰')+'遁'+pan.ju+'局 '+pan.yuan+' · 旬首 '+(pan.xun_shou || '')+' · 空亡 '+(pan.kong_wang || '')+
      '<br>值符 '+(pan.zhi_fu_star || '')+'→宮'+zf+' · 值使 '+(pan.zhi_shi_door || '')+'→宮'+zs+' · 時乾宮'+sg+
      (pan.pillars ? '<br>'+pan.pillars.year+' '+pan.pillars.month+' '+pan.pillars.day+' '+pan.pillars.hour : '')+
      (pan.meta ? '<br>節氣 '+pan.meta.jie+(pan.meta.fu_tou_gz ? ' 符頭'+pan.meta.fu_tou_gz : '')+' · 拆補' : '')+'</p>'+
      '<div class="qm-grid">'+cells+'</div>'+
      '<div class="qm-legend"><span class="zf">值符宮</span><span class="zs">值使宮</span><span class="sg">時乾宮</span>　上神／星／門／天盤／地盤</div></div>';
  }
  function digitExpand(digit) {
    var d = digit % 10; if (d === 0) d = 10;
    var out = [];
    for (var k = 0; k < 5; k++) { var n = d + k * 10; if (n >= 1 && n <= 49) out.push(n); }
    return out;
  }
  function add(scores, nums, w) {
    nums.forEach(function (n) { if (n >= 1 && n <= 49) scores[n] = (scores[n] || 0) + w; });
  }
  function extractScores(pan, scale) {
    scale = scale || 1;
    var scores = {}, sgp = pan.shi_gan_palace;
    var hg = pan.pillars.hour.charAt(0), hz = pan.pillars.hour.charAt(1);
    var dg = pan.pillars.day.charAt(0), dz = pan.pillars.day.charAt(1);
    function addPalace(p, w) {
      if (!p) return;
      add(scores, digitExpand(p), w * scale);
      add(scores, digitExpand(PALACE_XIAN[p] || p), w * 0.8 * scale);
      mapHetuLuoshu(LUO_SHU_WX[p] || '', w * scale, scores);
    }
    addPalace(sgp, 4);
    addPalace(pan.zhi_fu_palace, 2.5);
    addPalace(pan.zhi_shi_palace, 2);
    [[hg, 3.5], [hz, 3], [dg, 2.5], [dz, 2]].forEach(function (pair) {
      var ch = pair[0], w = pair[1] * scale;
      var fh = FAN_HONG[ch];
      if (fh) add(scores, digitExpand(fh), w);
      mapHetuLuoshu(WX_G[ch] || ZWX[ch] || '', w * 0.6, scores);
    });
    return scores;
  }
  function pureQimen(y, m, d) {
    var pan = castQimen(y, m, d, 21);
    return { mode: 'pure_qimen', pan: pan, method: { dingju: '拆補', extract: '時乾／值符／值使宮數＋先天＋範洪＋河圖洛書', pick: '五段×3' }, numbers: pick15(extractScores(pan, 1)) };
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
    pillarsAt: pillarsAt, enrichPillars: enrichPillars, tenGod: tenGod,
    castQimen: castQimen, scorePred: scorePred, qimenBoardHTML: qimenBoardHTML,
    ruleVersion: 'hetu-luoshu-v1 + qimen-chaibu'
  };
})(typeof window !== 'undefined' ? window : globalThis);
