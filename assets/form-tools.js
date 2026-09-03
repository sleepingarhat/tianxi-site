/* Form helpers: last-400m finishing-speed % and Instant Expert rows. */
(function (w) {
  'use strict';
  function toSec(v) {
    if (v == null || v === '') return null;
    if (typeof v === 'number' && isFinite(v)) return v;
    var t = String(v).trim();
    if (/^\d+(?:\.\d+)?$/.test(t)) return Number(t);
    var hk = t.match(/^(\d+)[.:](\d{2})[.:](\d{2})$/);
    if (hk) return Number(hk[1]) * 60 + Number(hk[2]) + Number(hk[3]) / 100;
    var m = t.match(/^(\d+):(\d{2})(?:\.(\d+))?$/);
    if (m) return Number(m[1]) * 60 + Number(m[2]) + (m[3] ? Number('0.' + m[3]) : 0);
    return null;
  }
  function finishingSpeedPct(overall, lastSection, raceDistM, lastM) {
    var T = toSec(overall), S = toSec(lastSection);
    var D = Number(raceDistM), L = Number(lastM == null ? 400 : lastM);
    if (!T || !S || !D || !L || S <= 0 || T <= 0) return null;
    return Math.round((100 * L * T) / (S * D) * 10) / 10;
  }
  function lastSectionTime(sectionals) {
    if (!Array.isArray(sectionals) || !sectionals.length) return null;
    var last = sectionals[sectionals.length - 1];
    return last && (last.sectionTime || last.time || last.split);
  }
  function fspLabel(form) {
    var fsp = finishingSpeedPct(
      form.finishTimeSec != null ? form.finishTimeSec : form.finishTime,
      lastSectionTime(form.sectionals),
      form.distance,
      400
    );
    return fsp == null ? '' : fsp.toFixed(1) + '%';
  }
  function bucket(forms, pred) {
    var hits = 0, n = 0;
    (forms || []).forEach(function (f) {
      if (!pred(f)) return;
      n += 1;
      if (Number(f.position) > 0 && Number(f.position) <= 3) hits += 1;
    });
    return n ? (hits + '/' + n) : '—';
  }
  function expertRow(horse, forms, ctx) {
    ctx = ctx || {};
    return {
      name: horse.nameCh || horse.nameEn || '',
      no: horse.horseNumber,
      course: bucket(forms, function (f) { return !ctx.venue || String(f.venue || '').indexOf(ctx.venue) >= 0 || f.venueCode === ctx.venue; }),
      trip: bucket(forms, function (f) { return !ctx.distance || Number(f.distance) === Number(ctx.distance); }),
      going: bucket(forms, function (f) { return !ctx.going || String(f.going || '').indexOf(ctx.going) >= 0; }),
      last3: (forms || []).slice(0, 3).map(function (f) { return f.position || '—'; }).join('-')
    };
  }
  w.TXFormTools = { finishingSpeedPct: finishingSpeedPct, fspLabel: fspLabel, expertRow: expertRow, lastSectionTime: lastSectionTime };
})(window);
