(function(){
  var VENUE_NAME = { ST: '沙田', HV: '跑馬地' };
  var RANK_LABEL = ['冠軍','亞軍','季軍','殿軍'];
  var STYLE_MAP = {};
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&'+'amp;','<':'&'+'lt;','>':'&'+'gt;','"':'&'+'quot;',"'":'&#39;'}[c];
    });
  }
  function qs(name){
    var m = location.search.match(new RegExp('[?&]' + name + '=([^&]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }
  function isG1(race){
    var cls = (race.class || '').toString().trim().toUpperCase();
    if (cls === 'G1') return true;
    if (/^G[2-9]|^G1[0-9]/.test(cls)) return false;
    var t = (race.title || '').toString();
    return /(?:^|[^0-9A-Z])G1(?:$|[^0-9])|一級賽|Group\s*1\b/i.test(t);
  }
  function fmtPrize(p){
    if (p == null || p === '') return '';
    var n = Number(p);
    if (!isFinite(n)) return esc(p);
    if (n === 0) return '$0';
    if (n >= 1e8) return '$' + (n / 1e8).toFixed(2) + '億';
    if (n >= 1e4) return '$' + Math.round(n / 1e4) + '萬';
    return '$' + Math.round(n);
  }
  function sumPrize(races){
    var total = 0, has = false;
    races.forEach(function(r){
      if (r.prize == null || r.prize === '') return;
      var n = Number(r.prize);
      if (isFinite(n)){ total += n; has = true; }
    });
    return has ? total : null;
  }
  function pickTop4(horses){
    return (horses || [])
      .filter(function(h){ return h.finishingPosition != null && Number(h.finishingPosition) > 0; })
      .sort(function(a, b){ return Number(a.finishingPosition) - Number(b.finishingPosition); })
      .slice(0, 4);
  }
  function winnerTimeText(top){
    if (!top || !top.length) return '';
    var w = top[0];
    var ft = TX_API.finishTime(w.finishTimeSec != null ? w.finishTimeSec : w.finishTime);
    if (ft) return '頭馬時間 ' + esc(ft);
    return '';
  }
  function metaSubText(top, race){
    if (top && top.length){
      var w = top[0];
      if (w.jockeyCh) return '騎師 ' + esc(w.jockeyCh) + (w.trainerCh ? ' · 練 ' + esc(w.trainerCh) : '');
      if (w.winOdds) return '獨贏 ' + esc(w.winOdds);
    }
    if (race.going) return esc(race.going);
    return '';
  }
  function renderRaceCard(race){
    var top = pickTop4(race.horses);
    var g1 = isG1(race);
    var raceNo = race.raceNumber || race.race_number || '';
    var entryCount = (race.horses || []).length;
    var goingTxt = [race.track, race.course && (race.course + ' 賽道'), race.going].filter(Boolean).map(esc).join(' · ');
    var pods = '';
    for (var i = 0; i < top.length; i++){
      var h = top[i];
      pods += '<div class="pod__slot p' + (i + 1) + '">' +
        '<div class="pod__rank">' + RANK_LABEL[i] + '</div>' +
        (h.horseNumber != null ? '<div class="pod__no">' + esc(h.horseNumber) + '</div>' : '') +
        '<div class="pod__name">' + (function(){ var id=TX_API.canonicalHorseId(h && (h.horseId || h.horse_id || h.id)), label=esc(h && (h.nameCh || h.name) || '') + (STYLE_MAP[id] ? TX_API.runningStyleBadge(STYLE_MAP[id]) : ''), link=TX_API.horseHref(id, race.id); return link ? '<a href="' + link + '">' + label + '</a>' : label; }()) + '</div>' +
        (h.winOdds != null && h.winOdds !== '' ? '<div class="pod__odds">' + oddsDisp(h.winOdds) + '</div>' : '') +
      '</div>';
    }
    var titleParts = [race.class, race.distance && (race.distance + ' 米')].filter(Boolean);
    var titleTxt = titleParts.join(' ') + (race.title && !g1 ? ' · ' + race.title : '');
    return '<article class="rc" id="r' + esc(raceNo) + '">' +
      '<div class="rc__hd"><div>' +
        (g1 ? '<span class="rc__g1">★ G1 · ' + esc(race.title || '一級賽') + '</span>' : '') +
        '<div class="rc__no"><small>R' + esc(raceNo) + '</small>第 ' + esc(raceNo) + ' 場</div>' +
        '<div class="rc__title">' + esc(titleTxt || race.title || '') + '</div>' +
      '</div><div class="rc__meta">' +
        (goingTxt ? '<strong>' + goingTxt + '</strong>' : '') +
        esc(entryCount) + ' 匹' + (race.prize ? ' · ' + fmtPrize(race.prize) : '') +
      '</div></div>' +
      '<div class="pod">' + pods + '</div>' +
      '<div class="rc__time"><span>' + esc(winnerTimeText(top) || '結果待公布') + '</span><span>' + esc(metaSubText(top, race)) + '</span></div>' +
      '<div class="cmp cmp--load" id="cmp-' + esc(race.id || ('r' + raceNo)) + '">捲動載入模型預測對比…</div>' +
      '<div class="cov-slot" id="cov-r' + esc(raceNo) + '"></div>' +
    '</article>';
  }
  function renderMeeting(m){
    if (!m.__stylesReady) {
      var styleIds = [];
      (m.races || []).forEach(function(r){ (r.horses || []).forEach(function(h){ styleIds.push(h.horseId || h.horse_id || h.id); }); });
      m.__stylesReady = true;
      return TX_API.runningStyles(styleIds, { beforeDate: m.date }).then(function(sd){
        STYLE_MAP = {}; (sd.styles || []).forEach(function(x){ STYLE_MAP[x.horseId] = x; });
        renderMeeting(m);
      });
    }
    var slot = document.getElementById('day-slot');
    var races = m.races || [];
    var settled = races.filter(function(r){ return (r.horses || []).some(function(h){ return h.finishingPosition != null; }); });
    var g1s = races.filter(isG1);
    var prizeTotal = sumPrize(races);
    var venueName = m.venueName || VENUE_NAME[m.venue] || m.venue || '';
    var dateTxt = TX_API.fmtMeetingDate ? (TX_API.fmtMeetingDate(m.date) || m.date) : m.date;
    document.getElementById('ticker').innerHTML =
      '<strong>預測與賽果</strong> · ' + esc(dateTxt) + ' ' + esc(venueName) +
      (m.trackCondition ? ' · ' + esc(m.trackCondition) : '') +
      ' · 共 ' + races.length + ' 場 · 資料來源 HKJC';
    var html =
      '<div class="results-day">' +
        '<div class="results-day__date">' + esc(dateTxt) + ' ' + esc(venueName) + '</div>' +
        '<div class="results-day__meta">' +
          [m.trackCondition, (g1s.length ? 'G1×' + g1s.length : null), races.length + 'R'].filter(Boolean).map(esc).join(' · ') +
        '</div>' +
      '</div>' +
      '<div class="day-stats">' +
        '<div class="day-stats__card"><div class="day-stats__lbl">場次</div><div class="day-stats__val">' + races.length + '</div><div class="day-stats__sub">R1 – R' + races.length + '</div></div>' +
        '<div class="day-stats__card"><div class="day-stats__lbl">有賽果</div><div class="day-stats__val">' + settled.length + '</div><div class="day-stats__sub">含結果</div></div>' +
        '<div class="day-stats__card"><div class="day-stats__lbl">G1 頭牌</div><div class="day-stats__val">' + g1s.length + '</div>' + (g1s.length ? '<div class="day-stats__sub">' + g1s.map(function(r){ return 'R' + (r.raceNumber || r.race_number); }).join(' · ') + '</div>' : '') + '</div>' +
        (prizeTotal != null ? '<div class="day-stats__card"><div class="day-stats__lbl">獎金</div><div class="day-stats__val">' + fmtPrize(prizeTotal) + '</div><div class="day-stats__sub">HKD 合計</div></div>' : '') +
      '</div>' +
      '<div class="cmp-summary" id="cmp-summary"><span class="k">模型對賬</span> ' + (window.TX_ENGINE_MODE ? TX_ENGINE_MODE.badgeHtml(TX_ENGINE_MODE.edition({settled:true})) + ' 最終版凍結四揀 · ' : '') + '捲動各場以載入模型預測對比</div>' +
      '<div class="cov-summary" id="cov-summary" style="display:none"></div>' +
      races.map(renderRaceCard).join('');
    if (!settled.length){
      html += '<div class="results-empty"><strong>當日結果未公布</strong>HKJC 完整賽果公布後此頁自動更新。</div>';
    }
    slot.innerHTML = html;
    enrichPredictions(races);
    loadCoverage(m.date, races);
  }
  function byRankP(a, b){ return (a.rank || 99) - (b.rank || 99); }
  function predIsLgb(tp){
    return ((tp && tp.picks) || []).some(function(p){ return p.scoreSource === 'lgb'; });
  }
  function matchHorse(pick, race){
    var hs = race.horses || [];
    for (var i = 0; i < hs.length; i++){
      var h = hs[i];
      if ((h.horseNumber != null && String(h.horseNumber) === String(pick.horseNumber)) ||
          (pick.horseId && h.id && pick.horseId === h.id)) return h;
    }
    return null;
  }
  function finishOf(pick, race){
    var h = matchHorse(pick, race);
    if (!h) return null;
    var fp = h.finishingPosition;
    if (fp == null || fp === '') return null;
    var n = Number(fp);
    return isFinite(n) ? n : null;
  }
  function oddsOf(pick, race){
    var h = matchHorse(pick, race);
    return h ? h.winOdds : null;
  }
  function oddsTxt(o){
    if (o == null) return '';
    var s = typeof o === 'string' ? o.trim() : o;
    if (s === '') return '';
    var n = Number(s);
    if (isFinite(n)) return n > 0 ? (n % 1 === 0 ? String(n) : n.toFixed(1)) : '';
    return String(s);
  }
  function oddsDisp(o){
    var t = oddsTxt(o);
    return t ? '賠 ' + esc(t) : '';
  }
  function pctTxt(x){
    var n = Number(x);
    return isFinite(n) ? Math.round(n * 100) + '%' : '';
  }
  function resCls(fp){
    if (fp === 1) return 'is-win';
    if (fp != null && fp <= 3) return 'is-top3';
    return fp == null ? '' : 'is-out';
  }
  function resTxt(fp){
    if (fp == null) return '';
    if (fp === 1) return '冠軍';
    return '第 ' + fp;
  }
  function cmpHorseHtml(pick, race){
    if (!pick) return '';
    var matched = matchHorse(pick, race) || {};
    var id = TX_API.canonicalHorseId(
      pick.horseId || pick.horse_id || matched.horseId || matched.horse_id || matched.id
    );
    var label = esc(pick.nameCh || pick.nameEn || matched.nameCh || matched.name || '') +
      (STYLE_MAP[id] ? TX_API.runningStyleBadge(STYLE_MAP[id]) : '');
    var link = TX_API.horseHref(id, race.id);
    return link ? '<a href="' + link + '">' + label + '</a>' : label;
  }
  function renderCmp(race, tp){
    var picks = ((tp && tp.picks) || []).slice().sort(byRankP).slice(0, 4);
    if (!picks.length) return '<div class="cmp cmp--na">此場暫無模型預測</div>';
    var isLgb = predIsLgb(tp);
    var p1fp = finishOf(picks[0], race);
    var hit = p1fp === 1 ? '<span class="cmp__hit win">首選命中冠軍</span>'
            : (p1fp != null && p1fp <= 3 ? '<span class="cmp__hit top3">首選前三入位</span>'
            : '<span class="cmp__hit out">首選落空</span>');
    var rows = picks.map(function(p, i){
      var fp = finishOf(p, race);
      return '<div class="cmp__row ' + resCls(fp) + '">' +
        '<span class="cmp__rk">預測 ' + (i + 1) + '</span>' +
        '<span class="cmp__h">' + (p.horseNumber != null ? esc(p.horseNumber) + ' ' : '') + cmpHorseHtml(p, race) + '</span>' +
        (pctTxt(p.pWin) ? '<span class="cmp__pw">' + pctTxt(p.pWin) + '</span>' : '') +
        (oddsDisp(oddsOf(p, race)) ? '<span class="cmp__odds">' + oddsDisp(oddsOf(p, race)) + '</span>' : '') +
        (resTxt(fp) ? '<span class="cmp__res">' + esc(resTxt(fp)) + '</span>' : '') +
      '</div>';
    }).join('');
    return '<div class="cmp">' +
      '<div class="cmp__hd">' +
        '<span class="cmp__ttl">模型預測 · 賽果對比</span>' +
        '<span class="cmp__src' + (isLgb ? ' is-lgb' : '') + '">' + (window.TX_ENGINE_MODE ? TX_ENGINE_MODE.badgeHtml(TX_ENGINE_MODE.edition({settled:true})) + ' ' : '') + (isLgb ? '天喜集成 LGB' : '天喜 ELO+因子') + '</span>' +
      '</div>' +
      rows +
      '<div class="cmp__hd" style="margin-top:8px;margin-bottom:0">' +
        '<span class="cmp__rk">模型首選 ' + (picks[0].horseNumber != null ? esc(picks[0].horseNumber) + ' ' : '') + cmpHorseHtml(picks[0], race) + '</span>' + hit +
      '</div>' +
    '</div>';
  }
  function updateCmpSummary(races){
    var el = document.getElementById('cmp-summary');
    if (!el) return;
    var denom = 0, champ = 0, top3 = 0, lgb = 0, withTp = 0;
    races.forEach(function(race){
      var tp = race.__tp;
      var settled = (race.horses || []).some(function(h){ return h.finishingPosition != null; });
      if (!tp || !settled) return;
      var picks = ((tp.picks) || []).slice().sort(byRankP);
      if (!picks.length) return;
      withTp++;
      if (predIsLgb(tp)) lgb++;
      var fp = finishOf(picks[0], race);
      if (fp == null) return;
      denom++;
      if (fp === 1) champ++;
      if (fp <= 3) top3++;
    });
    var badge = window.TX_ENGINE_MODE ? TX_ENGINE_MODE.badgeHtml(TX_ENGINE_MODE.edition({settled:true})) + ' ' : '';
    if (!withTp){
      el.innerHTML = '<span class="k">模型對賬</span> ' + badge + '最終版凍結四揀 · 捲動各場以載入模型預測對比';
      return;
    }
    var srcTxt = lgb === withTp ? '集成 LGB' : (lgb === 0 ? 'ELO+因子' : ('LGB ' + lgb + '/' + withTp + ' 場'));
    el.innerHTML =
      '<span class="k">模型對賬</span>' + badge +
      '已比對 <strong>' + withTp + '</strong> 場' +
      '<span class="k">·</span>首選命中冠軍 <strong>' + champ + '/' + denom + '</strong>' +
      '<span class="k">·</span>首選前三入位 <strong>' + top3 + '/' + denom + '</strong>' +
      '<span class="k">·</span>來源 <strong>' + srcTxt + '</strong>';
  }
  function fetchTopWithRetry(raceId, tries){
    tries = tries || 3;
    return TX_API.topPicks(raceId).catch(function(e){
      if (tries <= 1) throw e;
      return new Promise(function(res){ setTimeout(res, 700); })
        .then(function(){ return fetchTopWithRetry(raceId, tries - 1); });
    });
  }
  var cmpQueue = [], cmpBusy = false;
  function pumpCmp(){
    if (cmpBusy) return;
    var job = cmpQueue.shift();
    if (!job) return;
    cmpBusy = true;
    var done = function(){ cmpBusy = false; pumpCmp(); };
    job().then(done, done);
  }
  function loadCmp(race, races){
    if (race.__loading || race.__tp) return;
    race.__loading = true;
    cmpQueue.push(function(){
      var anchorId = 'cmp-' + race.id;
      var node = document.getElementById(anchorId);
      if (node){ node.className = 'cmp cmp--load'; node.innerHTML = '<span data-tx-loader data-size="sm" data-label="載入模型預測對比…"></span>'; }
      return fetchTopWithRetry(race.id, 3).then(function(tp){
        race.__tp = tp;
        var n = document.getElementById(anchorId);
        if (n) n.outerHTML = renderCmp(race, tp);
      }).catch(function(){
        race.__loading = false;
        var n = document.getElementById(anchorId);
        if (n) n.outerHTML = '<div class="cmp cmp--na" id="' + anchorId + '">' +
          '<button type="button" class="cmp-retry" data-anchor="' + anchorId + '">模型預測載入失敗 · 點擊重試</button></div>';
      }).then(function(){ updateCmpSummary(races); });
    });
    pumpCmp();
  }
  function enrichPredictions(races){
    var slot = document.getElementById('day-slot');
    var byId = {};
    var pending = 0;
    races.forEach(function(race){
      var anchorId = 'cmp-' + (race.id || ('r' + (race.raceNumber || race.race_number)));
      var el = document.getElementById(anchorId);
      var settled = (race.horses || []).some(function(h){ return h.finishingPosition != null; });
      if (!settled){ if (el) el.outerHTML = ''; return; }
      if (!race.id){ if (el) el.outerHTML = '<div class="cmp cmp--na">此場暫無模型預測</div>'; return; }
      byId[anchorId] = race;
      pending++;
    });
    if (slot){ slot.__cmpById = byId; slot.__cmpRaces = races; }
    updateCmpSummary(races);
    if (!pending) return;
    if (slot && !slot.__cmpRetryBound){
      slot.__cmpRetryBound = true;
      slot.addEventListener('click', function(ev){
        var t = ev.target;
        var b = t && t.classList && t.classList.contains('cmp-retry') ? t : (t && t.closest ? t.closest('.cmp-retry') : null);
        if (!b) return;
        var map = slot.__cmpById || {};
        var rs = slot.__cmpRaces || [];
        var race = map[b.getAttribute('data-anchor')];
        if (race){ race.__loading = false; race.__tp = null; loadCmp(race, rs); }
      });
    }
    if (!('IntersectionObserver' in window)){
      var list = []; for (var k in byId) list.push(byId[k]);
      var i = 0;
      (function nx(){ if (i >= list.length) return; loadCmp(list[i++], races); setTimeout(nx, 1500); })();
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var race = byId[e.target.id];
        if (race) loadCmp(race, races);
      });
    }, { rootMargin: '300px 0px' });
    for (var key in byId){ var elx = document.getElementById(key); if (elx) io.observe(elx); }
  }
  function covOf(hr){
    var m4 = (hr.predictedTop4||[]).map(function(p){ return p.horseNumber; }).filter(function(v){ return v!=null&&v!==''; }).map(String);
    var a4 = (hr.actualTop4||[]).map(function(a){ return a.horseNumber; }).filter(function(v){ return v!=null&&v!==''; }).map(String);
    if (!m4.length || !a4.length) return null;
    var ms = {}; m4.forEach(function(x){ ms[x] = true; });
    if (Object.keys(ms).length !== 4) return null;
    var n = 0; a4.forEach(function(x){ if (ms[x]) n++; });
    return n;
  }
  function covBadge(cov){
    if (cov == null) return '';
    var cls = cov === 4 ? 'b4' : (cov === 3 ? 'b3' : '');
    var txt = cov === 4 ? '全中 4/4' : ('4 中 ' + cov);
    return '<span class="cov__badge ' + cls + '">' + txt + '</span>';
  }
  function renderCovBox(hr){
    var cov = covOf(hr);
    if (cov == null) return '';
    var head = '<div class="cov__hd"><span class="cov__ttl">四揀覆蓋</span>' + covBadge(cov) + '</div>';
    var bp = hr.boxPayouts || [];
    if (!bp.length){
      var note = (cov === 4) ? '派彩資料暫未提供' : '四揀未中任何複式組合';
      return '<div class="cov">' + head + '<div class="cov-note">' + esc(note) + '</div></div>';
    }
    var rows = bp.map(function(p){
      var gain = p.net >= 0 ? ('賺 $' + Number(p.net).toLocaleString()) : ('蝕 $' + Number(-p.net).toLocaleString());
      var cls = p.net >= 0 ? 'pos' : 'neg';
      return '<div class="cov-boxrow"><span class="cov-boxnm">' + esc(p.name) + '</span>' +
        '<span class="cov-boxstk">箱 ' + esc(p.units) + ' 注 $' + esc(p.cost) + '</span>' +
        '<span class="cov-boxpay">派 $' + Number(p.dividend).toLocaleString() + '</span>' +
        '<span class="cov-boxnet ' + cls + '">' + gain + '</span></div>';
    }).join('');
    return '<div class="cov">' + head + '<div class="cov-box">' + rows + '</div>' +
      '<div class="cov-note">買中嗰 4 隻打複式，一注 $10 起，本小利大。</div></div>';
  }
  function renderCovSummary(hrRaces){
    var el = document.getElementById('cov-summary');
    if (!el) return;
    var c4=0,c3=0,c2=0,eligible=0;
    (hrRaces||[]).forEach(function(hr){ var c=covOf(hr); if(c==null) return; eligible++; if(c===4)c4++; else if(c===3)c3++; else if(c===2)c2++; });
    if (!eligible){ el.style.display='none'; return; }
    el.style.display='';
    el.innerHTML =
      '<span class="ct">模型四揀覆蓋</span><span class="k">唔分名次</span>' +
      '<span class="cov-pill ok">全中 4/4 · <strong>' + c4 + '</strong> 場</span>' +
      '<span class="cov-pill">4 中 3 · ' + c3 + ' 場</span>' +
      '<span class="cov-pill">4 中 2 · ' + c2 + ' 場</span>' +
      '<span class="cov-pill mut">合資格 ' + eligible + ' 場</span>';
  }
  function loadCoverage(date, races){
    if (!date || !TX_API.hitRate) return;
    TX_API.hitRate(date).then(function(hr){
      var hrRaces = (hr && hr.races) || [];
      renderCovSummary(hrRaces);
      var byNo = {};
      hrRaces.forEach(function(r){ byNo[String(r.raceNumber)] = r; });
      races.forEach(function(race){
        var no = race.raceNumber || race.race_number;
        var slot = document.getElementById('cov-r' + no);
        if (!slot) return;
        var hrr = byNo[String(no)];
        slot.innerHTML = hrr ? renderCovBox(hrr) : '';
      });
    }).catch(function(){});
  }
  function showErr(msg){
    document.getElementById('day-slot').innerHTML =
      '<div class="results-err">' + esc(msg) + '</div>';
    document.getElementById('ticker').textContent = '預測與賽果 · 載入失敗';
  }
  function showEmpty(date){
    document.getElementById('day-slot').innerHTML =
      '<div class="results-empty"><strong>' + esc(date) + ' 並無賽事資料</strong>請以 <code>?date=YYYY-MM-DD</code> 指定其他賽事日，或返回 <a href="/schedule/" style="color:var(--ink);text-decoration:underline">賽程表</a> 選擇日期。</div>';
    document.getElementById('ticker').textContent = '預測與賽果 · ' + date + ' 並無資料';
  }
  function hasSettled(m){
    return !!(m && (m.races || []).some(function(r){
      return (r.horses || []).some(function(h){ return h.finishingPosition != null; });
    }));
  }
  function loadByDate(date){
    return TX_API.meeting(date).then(renderMeeting).catch(function(e){
      var msg = e && e.message ? e.message : '網絡錯誤';
      if (/404|找不到/.test(msg)) showEmpty(date);
      else showErr(msg);
    });
  }
  function todayISO(){
    var d = new Date();
    var y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + dd;
  }
  function pickLatestSettled(list){
    var today = todayISO();
    var past = (list || [])
      .filter(function(m){ return m && m.date && m.date <= today; })
      .sort(function(a, b){ return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0); })
      .slice(0, 6);
    if (!past.length) return Promise.resolve(null);
    var i = 0;
    function step(){
      if (i >= past.length) return null;
      var d = past[i++].date;
      return TX_API.meeting(d).then(function(m){
        if (hasSettled(m)) return m;
        return step();
      }).catch(function(){ return step(); });
    }
    return Promise.resolve(step());
  }
  function buildDatePicker(meetings, currentDate){
    var sel = document.getElementById('rdate');
    if (!sel) return;
    var today = todayISO();
    var seen = {};
    var opts = (meetings || []).filter(function(m){
      if (!m || !m.date || m.date > today || seen[m.date]) return false;
      seen[m.date] = 1; return true;
    }).sort(function(a, b){ return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0); });
    if (!opts.length){ sel.innerHTML = '<option>暫無賽日</option>'; sel.disabled = true; return; }
    var cur = currentDate || opts[0].date;
    sel.innerHTML = opts.map(function(m){
      var label = (TX_API.fmtMeetingDate ? TX_API.fmtMeetingDate(m.date) : m.date) + ' · ' + (VENUE_NAME[m.venue] || m.venue || '');
      return '<option value="' + esc(m.date) + '"' + (m.date === cur ? ' selected' : '') + '>' + esc(label) + '</option>';
    }).join('');
    sel.disabled = false;
    if (!sel._wired){
      sel._wired = true;
      sel.addEventListener('change', function(){
        var d = sel.value;
        if (!d) return;
        try { history.replaceState(null, '', '/results/?date=' + encodeURIComponent(d)); } catch (e) {}
        document.getElementById('day-slot').innerHTML = '<div class="tx-lemni-host" data-tx-loader data-size="lg" data-label="載入 ' + esc(d) + ' 預測與賽果…"></div>';
        if (window.scrollTo) window.scrollTo(0, 0);
        loadByDate(d);
      });
    }
  }
  function boot(){
    var date = qs('date');
    TX_API.meetings('?limit=80').then(function(resp){
      var list = (resp && (resp.meetings || resp.data)) || resp || [];
      list = Array.isArray(list) ? list : [];
      if (date){
        buildDatePicker(list, date);
        return loadByDate(date);
      }
      return pickLatestSettled(list).then(function(m){
        if (m){ buildDatePicker(list, m.date); renderMeeting(m); }
        else { buildDatePicker(list, null); showEmpty('近期已結束賽事'); }
      });
    }).catch(function(e){
      var msg = e && e.message ? e.message : '網絡錯誤';
      if (date){ loadByDate(date); return; }
      showErr(msg);
    });
  }
  boot();
})();
