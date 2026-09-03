// 天喜 TIANXI shared API client.
// All pages should use window.TX_API.* instead of calling fetch() directly,
// so the base URL + error handling stays in one place.
(function(){
  var BASE = 'https://tianxi-backend.tianxi-entertainment.workers.dev';

  function j(path) {
    return fetch(BASE + path, { credentials: 'omit' }).then(function(r){
      if (!r.ok) throw new Error('API ' + r.status + ' ' + path);
      return r.json();
    });
  }
  function jp(path, body) {
    return fetch(BASE + path, {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    }).then(function(r){
      return r.json().then(function(data){
        if (!r.ok) throw Object.assign(new Error(data.error || ('API '+r.status)), { status: r.status, data: data });
        return data;
      });
    });
  }

  function cleanTime(t) {
    if (!t) return null;
    if (typeof t !== 'string') t = String(t);
    if (t.indexOf('(') === 0 || t.indexOf(' ') !== -1) return null;
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) return t.slice(0,5);
    return null;
  }
  function countdown(startTime, refDate, meetingDate) {
    var ct = cleanTime(startTime);
    if (!ct) return '';
    var parts = ct.split(':');
    var hh = parseInt(parts[0],10), mm = parseInt(parts[1],10);
    var now = refDate || new Date();
    var md = meetingDate ? String(meetingDate).match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
    var tgt;
    if (md) { tgt = new Date(+md[1], +md[2]-1, +md[3], hh, mm, 0, 0); }
    else { tgt = new Date(now); tgt.setHours(hh, mm, 0, 0); }
    var diff = Math.floor((tgt - now) / 1000);
    if (diff < 0) return '已開跑';
    var p2 = function(x){ return (x<10?'0':'') + x; };
    if (diff >= 86400) {
      var dd = Math.floor(diff/86400);
      return dd + '日 ' + p2(Math.floor((diff%86400)/3600)) + ':' + p2(Math.floor((diff%3600)/60));
    }
    var h = Math.floor(diff/3600), m = Math.floor((diff%3600)/60), s = diff%60;
    return p2(h) + ':' + p2(m) + ':' + p2(s);
  }
  function fmtDateShort(iso) {
    if (!iso) return '';
    var m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return iso;
    return m[2] + '-' + m[3];
  }

  function silksUrl(code){
    if (!code) return '';
    return BASE + '/api/silks/' + encodeURIComponent(code) + '.gif';
  }

  var CN_WD = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
  function fmtMeetingDate(iso){
    if (!iso) return '';
    var m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return iso;
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    var wd = isNaN(d) ? '' : CN_WD[d.getUTCDay()];
    return m[3] + '/' + m[2] + '/' + m[1] + ' ' + wd;
  }

  function canonicalHorseId(value){
    var id = value == null ? '' : String(value).trim();
    return /^horse_[A-Za-z0-9][A-Za-z0-9_-]*$/.test(id) ? id : '';
  }
  function canonicalRaceId(value){
    var id = value == null ? '' : String(value).trim();
    var match = id.match(/^race_(\d{4})-(\d{2})-(\d{2})_(?:ST|HV)_\d+$/);
    if (!match) return '';
    var y = Number(match[1]), m = Number(match[2]), d = Number(match[3]);
    var date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? id : '';
  }
  function horseHref(horseId, raceId){
    var id = canonicalHorseId(horseId);
    if (!id) return '';
    var href = '/horse/?id=' + encodeURIComponent(id);
    var rid = canonicalRaceId(raceId);
    if (rid) href += '&raceId=' + encodeURIComponent(rid);
    return href;
  }
  function runningStyleBadge(entry){
    if (!entry || !entry.label || !/^(?:放|前|中|後)$/.test(String(entry.label))) return '';
    var count = Number(entry.sampleCount);
    var sample = isFinite(count) && count > 0 ? '，樣本 ' + count + ' 場' : '';
    return '<span class="tx-running-style tx-running-style--' + String(entry.code || '').replace(/[^a-z-]/g,'') +
      '" role="img" aria-label="跑法 ' + String(entry.label) + sample + '">' + String(entry.label) + '</span>';
  }
  var styleCache = {};
  function runningStyles(horseIds, context){
    context = context || {};
    var ids = (horseIds || []).map(canonicalHorseId).filter(Boolean).filter(function(id, i, a){ return a.indexOf(id) === i; }).sort();
    if (!ids.length) return Promise.resolve({ cutoffDate:'', styles:[] });
    var qs = 'horseIds=' + encodeURIComponent(ids.join(','));
    var raceId = canonicalRaceId(context.raceId);
    if (raceId) qs += '&raceId=' + encodeURIComponent(raceId);
    else if (/^\d{4}-\d{2}-\d{2}$/.test(String(context.beforeDate || ''))) {
      qs += '&beforeDate=' + encodeURIComponent(context.beforeDate);
    }
    var key = qs;
    if (!styleCache[key]) styleCache[key] = j('/api/horses/running-styles?' + qs).catch(function(error){
      if (window.console && console.warn) console.warn('[TX_API] running-styles unavailable', error);
      return { cutoffDate:'', styles:[] };
    });
    return styleCache[key];
  }
  function finishTime(value){
    if (value == null || value === '') return '';
    if (typeof value === 'number' && isFinite(value)) return value.toFixed(2);
    var text = String(value).trim();
    if (!text || /^(?:null|undefined|n\/a|na)$/i.test(text)) return '';
    if (/^\d+(?:\.\d+)?$/.test(text)) return Number(text).toFixed(2);
    var hk = text.match(/^(\d+)[.:](\d{2})[.:](\d{2})$/);
    if (hk) {
      var mins = Number(hk[1]), secs = Number(hk[2]), hundredths = Number(hk[3]);
      return isFinite(mins) && secs < 60 && hundredths < 100 ? (mins * 60 + secs + hundredths / 100).toFixed(2) : '';
    }
    var minute = text.match(/^(\d+):(\d{2})(?:\.(\d+))?$/);
    if (minute) {
      var wholeMins = Number(minute[1]), wholeSecs = Number(minute[2]);
      var fraction = minute[3] ? Number('0.' + minute[3]) : 0;
      return isFinite(wholeMins) && wholeSecs < 60
        ? (wholeMins * 60 + wholeSecs + fraction).toFixed(2) : '';
    }
    return '';
  }

  window.TX_API = {
    base: BASE,
    meetings:       function(q){ return j('/api/meetings' + (q || '')); },
    meeting:        function(date){ return j('/api/meetings/' + encodeURIComponent(date)); },
    race:           function(id){ return j('/api/races/' + encodeURIComponent(id)); },
    meetingsByMonth:function(ym){ return j('/api/meetings?month=' + encodeURIComponent(ym) + '&limit=100'); },
    smartCurrent:   function(){ return j('/api/meetings/smart/current'); },
    nextMeeting:    function(){ return j('/api/meetings/next'); },
    raceEntries:    function(id){ return j('/api/races/' + encodeURIComponent(id) + '/entries'); },
    horseDetail:    function(id){ return j('/api/horses/' + encodeURIComponent(id) + '/detail'); },
    silksUrl:       silksUrl,
    fmtMeetingDate: fmtMeetingDate,
    horses:           function(q){ return j('/api/horses' + (q || '')); },
    horse:            function(id){ return j('/api/horses/' + encodeURIComponent(id)); },
    horseResearch:    function(id, options){
      options = options || {};
      var qs = Object.keys(options).filter(function(k){ return options[k] != null && options[k] !== ''; })
        .map(function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(options[k]); }).join('&');
      return j('/api/horses/' + encodeURIComponent(id) + '/research' + (qs ? '?' + qs : ''));
    },
    horseForm:        function(id, lim){ return j('/api/horses/' + encodeURIComponent(id) + '/form?limit=' + (lim||10)); },
    horseSearch:      function(q){ return j('/api/horses/search/query?q=' + encodeURIComponent(q)); },
    horseLeaderboard: function(by, lim, status){ return j('/api/horses/leaderboard?by=' + encodeURIComponent(by||'elo') + '&limit=' + (lim||10) + '&status=' + encodeURIComponent(status||'all')); },
    jockeys:  function(){ return j('/api/jockeys'); },
    trainers: function(){ return j('/api/trainers'); },
    topPicks: function(raceId){
      var id = String(raceId || '');
      var m = id.match(/^race_(\d{4}-\d{2}-\d{2})_(?:ST|HV)_(\d+)$/);
      if (!m) return j('/api/analyze/top-picks?raceId=' + encodeURIComponent(raceId));
      var date = m[1], rn = Number(m[2]);
      var today = new Date().toISOString().slice(0, 10);
      if (date >= today) return j('/api/analyze/top-picks?raceId=' + encodeURIComponent(raceId));
      return j('/api/analyze/hit-rate?date=' + encodeURIComponent(date)).then(function(hr){
        var races = (hr && hr.races) || [];
        var race = null;
        for (var i = 0; i < races.length; i++) {
          if (Number(races[i].raceNumber) === rn) { race = races[i]; break; }
        }
        var top = race && race.predictedTop4;
        if (!top || !top.length) return j('/api/analyze/top-picks?raceId=' + encodeURIComponent(raceId));
        return {
          raceId: id,
          date: date,
          raceNumber: rn,
          frozen: true,
          freezeSource: 'prediction_log',
          picks: top.map(function(p, i){
            return {
              horseNumber: p.horseNumber,
              nameCh: p.nameCh,
              horseId: p.horseId,
              rank: p.rank || (i + 1),
              pWin: p.pWin,
              scoreSource: 'lgb',
              frozen: true
            };
          })
        };
      });
    },
    predictionAccuracy: function(days){ return j('/api/analyze/prediction-accuracy?days=' + (days||30)); },
    r5Comparison: function(days){ return j('/api/analyze/r5-comparison?days=' + (days||30)); },
    hitRate: function(date){ return j('/api/analyze/hit-rate?date=' + encodeURIComponent(date)); },
    predictionLock: function(date){ return j('/api/analyze/prediction-lock?date=' + encodeURIComponent(date)); },
    todayPicks: function(venue){ return j('/api/analyze/today-picks' + (venue ? '?venue=' + encodeURIComponent(venue) : '')); },
    analyze:  function(body){ return jp('/api/analyze', body); },
    explain:  function(raceId, horseId){ return j('/api/analyze/explain?raceId=' + encodeURIComponent(raceId) + '&horseId=' + encodeURIComponent(horseId)); },
    hitRateRollup: function(days){ return j('/api/analyze/hit-rate-rollup?days=' + (days||90)); },
    strategyPnl: function(q){ return j('/api/analyze/strategy-pnl' + (q || '')); },
    lounge: {
      chat: function(since, lim){
        var qs = [];
        if (since) qs.push('since=' + encodeURIComponent(since));
        if (lim)   qs.push('limit=' + lim);
        return j('/api/lounge/chat' + (qs.length ? '?' + qs.join('&') : ''));
      },
      send: function(body){ return jp('/api/lounge/chat', body); },
    },
    cleanTime: cleanTime,
    countdown: countdown,
    fmtDateShort: fmtDateShort,
    canonicalHorseId: canonicalHorseId,
    canonicalRaceId: canonicalRaceId,
    horseHref: horseHref,
    runningStyleBadge: runningStyleBadge,
    runningStyles: runningStyles,
    finishTime: finishTime,
  };
})();
