/* tianxi-geju-xiyong-v1 */
(function (global) {
  'use strict';
  var WX_G = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
  var WX_Z = {子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'};
  var ZHI_BEN_GAN = {子:'癸',丑:'己',寅:'甲',卯:'乙',辰:'戊',巳:'丙',午:'丁',未:'己',申:'庚',酉:'辛',戌:'戊',亥:'壬'};
  var CANG = {
    子:[['癸',1]], 丑:[['己',1],['癸',0.5],['辛',0.5]], 寅:[['甲',1],['丙',0.5],['戊',0.5]],
    卯:[['乙',1]], 辰:[['戊',1],['乙',0.5],['癸',0.5]], 巳:[['丙',1],['戊',0.5],['庚',0.5]],
    午:[['丁',1],['己',0.5]], 未:[['己',1],['丁',0.5],['乙',0.5]], 申:[['庚',1],['壬',0.5],['戊',0.5]],
    酉:[['辛',1]], 戌:[['戊',1],['辛',0.5],['丁',0.5]], 亥:[['壬',1],['甲',0.5]]
  };
  var LU = {甲:'寅',乙:'卯',丙:'巳',丁:'午',戊:'巳',己:'午',庚:'申',辛:'酉',壬:'亥',癸:'子'};
  var YANG_GAN = {甲:1,丙:1,戊:1,庚:1,壬:1};
  var SHENG = {木:'火',火:'土',土:'金',金:'水',水:'木'};
  var KE = {木:'土',土:'水',水:'火',火:'金',金:'木'};
  var YUE_GE = {
    比肩:'建禄格',劫財:'羊刃格',食神:'食神格',傷官:'傷官格',
    偏財:'偏財格',正財:'正財格',七殺:'七殺格',正官:'正官格',
    偏印:'偏印格',正印:'正印格'
  };
  var TABLE = {
    正官格:{yong:['官殺'],xi:['財','印'],ji:['食傷'],chou:['比劫']},
    七殺格:{yong:['官殺'],xi:['食傷','印'],ji:['財'],chou:[]},
    正財格:{yong:['財'],xi:['食傷','官殺'],ji:['比劫'],chou:[]},
    偏財格:{yong:['財'],xi:['食傷','官殺'],ji:['比劫'],chou:[]},
    正印格:{yong:['印'],xi:['官殺','比劫'],ji:['財'],chou:['食傷']},
    偏印格:{yong:['印'],xi:['官殺','比劫'],ji:['財'],chou:['食傷']},
    食神格:{yong:['食傷'],xi:['財','比劫'],ji:['印'],chou:['官殺']},
    傷官格:{yong:['食傷'],xi:['印','財'],ji:['官殺'],chou:[]},
    羊刃格:{yong:['官殺'],xi:['財','印'],ji:['食傷'],chou:[]},
    建禄格:{yong:['官殺','財'],xi:['食傷','印'],ji:['比劫'],chou:[]},
    從財格:{yong:['財'],xi:['食傷','官殺'],ji:['比劫','印'],chou:[]},
    從殺格:{yong:['官殺'],xi:['財'],ji:['食傷','印','比劫'],chou:[]},
    從兒格:{yong:['食傷'],xi:['財'],ji:['印','比劫'],chou:[]},
    從勢格:{yong:['食傷','財','官殺'],xi:[],ji:['印','比劫'],chou:[]},
    專旺格:{yong:['比劫','印'],xi:['食傷'],ji:['財','官殺'],chou:[]},
    扶抑身旺:{yong:['食傷','財'],xi:['官殺'],ji:['印'],chou:[]},
    扶抑身弱:{yong:['印','比劫'],xi:[],ji:['官殺'],chou:['財']}
  };
  var ZAQI = {辰:1,戌:1,丑:1,未:1};
  var ZAQI_CANG_ORDER = {辰:['戊','乙','癸'],戌:['戊','辛','丁'],丑:['己','癸','辛'],未:['己','丁','乙']};
  var ENGINE_ID = 'tianxi-geju-xiyong-v1';
  function shiShenOf(dm, gan) {
    if (!dm || !gan) return '';
    if (gan === dm) return '比肩';
    var w1 = WX_G[dm], w2 = WX_G[gan];
    if (!w1 || !w2) return '';
    var same = (!!YANG_GAN[dm]) === (!!YANG_GAN[gan]);
    if (w2 === w1) return same ? '比肩' : '劫財';
    if (SHENG[w1] === w2) return same ? '食神' : '傷官';
    if (KE[w1] === w2) return same ? '偏財' : '正財';
    if (KE[w2] === w1) return same ? '七殺' : '正官';
    if (SHENG[w2] === w1) return same ? '偏印' : '正印';
    return '';
  }
  function hasRoot(dmGan, zhi) {
    var dm = WX_G[dmGan];
    if (LU[dmGan] === zhi) return true;
    if (WX_Z[zhi] === dm) return true;
    var arr = CANG[zhi] || [];
    for (var i = 0; i < arr.length; i++) {
      if (WX_G[arr[i][0]] === dm && arr[i][1] >= 1) return true;
    }
    return false;
  }
  function rolesOf(dmWx) {
    var yin = '', guan = '';
    Object.keys(SHENG).forEach(function (k) { if (SHENG[k] === dmWx) yin = k; });
    Object.keys(KE).forEach(function (k) { if (KE[k] === dmWx) guan = k; });
    return {比劫: dmWx, 印: yin, 食傷: SHENG[dmWx], 財: KE[dmWx], 官殺: guan};
  }
  function expand(roles, keys) {
    var out = [];
    (keys || []).forEach(function (k) {
      var wx = roles[k] || k;
      if (wx && out.indexOf(wx) < 0) out.push(wx);
    });
    return out;
  }
  function uniq(xs) {
    var out = [];
    (xs || []).forEach(function (x) { if (x && out.indexOf(x) < 0) out.push(x); });
    return out;
  }
  function scoreWuxing(pillars) {
    var zhis = [pillars.year.charAt(1), pillars.month.charAt(1), pillars.day.charAt(1), pillars.hour.charAt(1)];
    var gans = [pillars.year.charAt(0), pillars.month.charAt(0), pillars.day.charAt(0), pillars.hour.charAt(0)];
    var score = {木:0,火:0,土:0,金:0,水:0};
    gans.forEach(function (g) { score[WX_G[g]] += 1; });
    zhis.forEach(function (z, i) {
      var w = i === 1 ? 2 : 1;
      score[WX_Z[z]] += w;
      (CANG[z] || []).forEach(function (pair) { score[WX_G[pair[0]]] += pair[1] * 0.5; });
    });
    var dmWx = WX_G[pillars.day.charAt(0)];
    var roles = rolesOf(dmWx);
    var partySelf = score[roles.比劫] + score[roles.印];
    var partyOther = score[roles.食傷] + score[roles.財] + score[roles.官殺];
    var ratio = (partySelf + 1e-6) / (partyOther + 1e-6);
    var dmGan = pillars.day.charAt(0);
    var rooted = zhis.some(function (z) { return hasRoot(dmGan, z); });
    var weak = false;
    zhis.forEach(function (z) {
      if (hasRoot(dmGan, z)) weak = true;
      (CANG[z] || []).forEach(function (pair) {
        if (WX_G[pair[0]] === WX_G[dmGan] && pair[1] >= 0.5) weak = true;
      });
    });
    return {
      score: {木:+score.木.toFixed(3),火:+score.火.toFixed(3),土:+score.土.toFixed(3),金:+score.金.toFixed(3),水:+score.水.toFixed(3)},
      party_self: +partySelf.toFixed(3), party_other: +partyOther.toFixed(3),
      ratio: +ratio.toFixed(3), rooted: rooted, rooted_weak: weak, roles: roles
    };
  }
  function monthPattern(dmGan, pillars) {
    var yueZhi = pillars.month.charAt(1);
    var notes = [];
    var gans = [pillars.year.charAt(0), pillars.month.charAt(0), pillars.hour.charAt(0)];
    var ss;
    if (ZAQI[yueZhi]) {
      var hidden = ZAQI_CANG_ORDER[yueZhi];
      var tou = hidden.filter(function (g) { return gans.indexOf(g) >= 0; });
      if (tou.length) {
        var pri = {正官:0,七殺:0,正財:1,偏財:1,正印:2,偏印:2,食神:3,傷官:3};
        var touSs = tou.map(function (g) { return [g, shiShenOf(dmGan, g)]; });
        touSs.sort(function (a, b) { return (pri[a[1]] != null ? pri[a[1]] : 9) - (pri[b[1]] != null ? pri[b[1]] : 9); });
        ss = touSs[0][1];
        notes.push('雜氣透' + touSs[0][0] + '取' + ss);
      } else {
        ss = shiShenOf(dmGan, ZHI_BEN_GAN[yueZhi]);
        notes.push('雜氣不透取本氣');
      }
    } else {
      ss = shiShenOf(dmGan, ZHI_BEN_GAN[yueZhi]);
    }
    return {ge: YUE_GE[ss] || ('正格(' + ss + ')'), ss: ss, notes: notes};
  }
  function detectCong(score) {
    if (score.rooted_weak || score.rooted) return null;
    if (score.ratio < 0.5) {
      var roles = score.roles, sc = score.score;
      var other = [['從兒格', sc[roles.食傷]], ['從財格', sc[roles.財]], ['從殺格', sc[roles.官殺]]];
      other.sort(function (a, b) { return b[1] - a[1]; });
      if (other[0][1] >= (other[1][1] + other[2][1]) * 0.8 && other[0][1] > 0) return other[0][0];
      return '從勢格';
    }
    if (score.ratio > 2.0) return '專旺格';
    return null;
  }
  function tiaohouNeed(yueZhi) {
    if ('亥子丑'.indexOf(yueZhi) >= 0) return '火';
    if ('巳午未'.indexOf(yueZhi) >= 0) return '水';
    return null;
  }
  function analyzeGeju(pillars) {
    if (!pillars || !pillars.day) throw new Error('缺四柱');
    var dmGan = pillars.day.charAt(0);
    var dmWx = WX_G[dmGan];
    var zhong = scoreWuxing(pillars);
    var notes = [];
    var status = '成';
    var cong = detectCong(zhong);
    var yue = monthPattern(dmGan, pillars);
    notes = notes.concat(yue.notes);
    var primary = cong ? cong : yue.ge;
    if (cong) notes.push('無根 ratio=' + zhong.ratio.toFixed(2) + ' → ' + cong);
    var key = TABLE[primary] ? primary : '扶抑身弱';
    if ((primary === '建禄格' || primary === '羊刃格') && zhong.ratio < 1) {
      key = '扶抑身弱'; notes.push('禄刃而身弱，改扶抑');
    }
    if (primary.indexOf('正格') === 0) key = zhong.ratio >= 1 ? '扶抑身旺' : '扶抑身弱';
    if (!TABLE[key]) {
      key = zhong.ratio >= 1.2 ? '扶抑身旺' : '扶抑身弱';
      primary = key; status = '不成改扶抑';
    }
    var pack = TABLE[key];
    var yong = expand(zhong.roles, pack.yong);
    var xi = expand(zhong.roles, pack.xi);
    var ji = expand(zhong.roles, pack.ji);
    var chou = expand(zhong.roles, pack.chou);
    var th = tiaohouNeed(pillars.month.charAt(1));
    var thUrgent = false;
    if (th) {
      thUrgent = (zhong.score[th] || 0) <= 0.3;
      if (cong) {
        if (ji.indexOf(th) < 0 && yong.indexOf(th) < 0) { xi.push(th); notes.push('調候入次喜，不逆從'); }
      } else if (thUrgent) {
        if (yong.indexOf(th) < 0) yong.unshift(th);
        notes.push('調候升主');
      } else if (yong.indexOf(th) < 0 && xi.indexOf(th) < 0) {
        xi.push(th);
      }
    }
    yong = uniq(yong); xi = uniq(xi); ji = uniq(ji); chou = uniq(chou);
    xi = xi.filter(function (x) { return yong.indexOf(x) < 0; });
    ji = ji.filter(function (x) { return yong.indexOf(x) < 0 && xi.indexOf(x) < 0; });
    chou = chou.filter(function (x) { return yong.indexOf(x) < 0 && xi.indexOf(x) < 0 && ji.indexOf(x) < 0; });
    return {
      engineId: ENGINE_ID,
      day_master: {gan: dmGan, wx: dmWx},
      zhong_gua: {score: zhong.score, party_self: zhong.party_self, party_other: zhong.party_other, ratio: zhong.ratio, rooted: zhong.rooted, rooted_weak: zhong.rooted_weak},
      pattern: {primary: primary, yue_ling: yue.ss, yue_ge: yue.ge, table_key: key, status: status},
      yong_shen: yong, xi_shen: xi, ji_shen: ji, chou_shen: chou,
      tiaohou: {need: th, urgent: thUrgent}, note: notes
    };
  }
  var E = global.TXMarkSixEngine || (global.TXMarkSixEngine = {});
  E.analyzeGeju = analyzeGeju;
  E.shiShenOf = shiShenOf;
})(typeof window !== 'undefined' ? window : globalThis);
