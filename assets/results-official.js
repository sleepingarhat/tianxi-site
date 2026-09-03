(function () {
  if (!window.TX_API || typeof TX_API.hitRate !== 'function') return;
  var orig = TX_API.topPicks.bind(TX_API);
  var cache = {};
  TX_API.topPicks = function (raceId) {
    var id = String(raceId || '');
    var m = id.match(/^race_(\d{4}-\d{2}-\d{2})_(?:ST|HV)_(\d+)$/);
    if (!m) return orig(raceId);
    var date = m[1];
    var rn = Number(m[2]);
    var today = new Date().toISOString().slice(0, 10);
    if (date >= today) return orig(raceId);
    if (!cache[date]) cache[date] = TX_API.hitRate(date);
    return cache[date].then(function (hr) {
      var races = (hr && hr.races) || [];
      var race = null;
      for (var i = 0; i < races.length; i++) {
        if (Number(races[i].raceNumber) === rn) { race = races[i]; break; }
      }
      var top = race && race.predictedTop4;
      if (!top || !top.length) return orig(raceId);
      return {
        raceId: id,
        date: date,
        raceNumber: rn,
        frozen: true,
        freezeSource: 'prediction_log',
        picks: top.map(function (p, i) {
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
    }).catch(function () { return orig(raceId); });
  };
})();
