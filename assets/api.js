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

  // ---------- shared UI helpers ----------
  function cleanTime(t) {
    if (!t) return null;
    // reject malformed values (sectional splits, empty, etc.)
    if (typeof t !== 'string') t = String(t);
    if (t.indexOf('(') === 0 || t.indexOf(' ') !== -1) return null;
    // accept HH:MM or HH:MM:SS
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) return t.slice(0,5);
    return null;
  }
  function countdown(startTime, refDate, meetingDate) {
    // startTime: 'HH:MM' HK time. refDate: optional Date (now).
    // meetingDate: optional 'YYYY-MM-DD' of the race day — REQUIRED to count down
    // to a future race day; without it the target wrongly defaults to today.
    var ct = cleanTime(startTime);
    if (!ct) return '——:——:——';
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

  // silks url helper — prefers backend proxy, falls back to direct HKJC
  function silksUrl(code){
    if (!code) return '';
    return BASE + '/api/silks/' + encodeURIComponent(code) + '.gif';
  }

  // format date "29/04/2026 星期三" (Phase B · HKJC-style)
  var CN_WD = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
  function fmtMeetingDate(iso){
    if (!iso) return '';
    var m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return iso;
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    var wd = isNaN(d) ? '' : CN_WD[d.getUTCDay()];
    return m[3] + '/' + m[2] + '/' + m[1] + ' ' + wd;
  }

  window.TX_API = {
    base: BASE,
    // meetings + races
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
    // horses
    horses:           function(q){ return j('/api/horses' + (q || '')); },
    horse:            function(id){ return j('/api/horses/' + encodeURIComponent(id)); },
    horseForm:        function(id, lim){ return j('/api/horses/' + encodeURIComponent(id) + '/form?limit=' + (lim||10)); },
    horseSearch:      function(q){ return j('/api/horses/search/query?q=' + encodeURIComponent(q)); },
    horseLeaderboard: function(by, lim, status){ return j('/api/horses/leaderboard?by=' + encodeURIComponent(by||'elo') + '&limit=' + (lim||10) + '&status=' + encodeURIComponent(status||'all')); },
    // jockeys / trainers
    jockeys:  function(){ return j('/api/jockeys'); },
    trainers: function(){ return j('/api/trainers'); },
    // analyze
    topPicks: function(raceId){ return j('/api/analyze/top-picks?raceId=' + encodeURIComponent(raceId)); },
    hitRate: function(date){ return j('/api/analyze/hit-rate?date=' + encodeURIComponent(date)); },
    todayPicks: function(venue){ return j('/api/analyze/today-picks' + (venue ? '?venue=' + encodeURIComponent(venue) : '')); },
    analyze:  function(body){ return jp('/api/analyze', body); },
    factors:  function(){ return j('/api/analyze/factors'); },
    explain:  function(raceId, horseId){ return j('/api/analyze/explain?raceId=' + encodeURIComponent(raceId) + '&horseId=' + encodeURIComponent(horseId)); },
    hitRateRollup: function(days){ return j('/api/analyze/hit-rate-rollup?days=' + (days||90)); },
    strategyPnl: function(q){ return j('/api/analyze/strategy-pnl' + (q || '')); },
    // shared helpers
    cleanTime: cleanTime,
    countdown: countdown,
    fmtDateShort: fmtDateShort,
  };
})();
