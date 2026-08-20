const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const calls = [];
const window = { console };
const sandbox = {
  window,
  console,
  fetch(url) {
    calls.push(url);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        cutoffDate: '2026-07-15',
        styles: [{ horseId: 'horse_J080', code: 'leader', label: '放', sampleCount: 5 }],
      }),
    });
  },
};

vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, '..', 'assets', 'api.js'), 'utf8'),
  sandbox,
  { filename: 'assets/api.js' },
);

const api = window.TX_API;

assert.equal(api.canonicalHorseId('horse_J080'), 'horse_J080');
assert.equal(api.canonicalHorseId('J080'), '');
assert.equal(api.canonicalRaceId('race_2026-07-15_HV_1'), 'race_2026-07-15_HV_1');
assert.equal(api.canonicalRaceId('race_unknown'), '');
assert.equal(api.canonicalRaceId('race_2026-02-30_ST_2'), '');
assert.equal(
  api.horseHref('horse_J080', 'race_2026-07-15_HV_1'),
  '/horse/?id=horse_J080&raceId=race_2026-07-15_HV_1',
);
assert.equal(api.horseHref('horse_J080', 'race_unknown'), '/horse/?id=horse_J080');
assert.equal(api.horseHref('J080', 'race_2026-07-15_HV_1'), '');

assert.equal(api.finishTime(69.289999999999), '69.29');
assert.equal(api.finishTime(70), '70.00');
assert.equal(api.finishTime('1.10.32'), '70.32');
assert.equal(api.finishTime('1:10.32'), '70.32');
assert.equal(api.finishTime('1:10'), '70.00');
assert.equal(api.finishTime('WV-A'), '');
assert.equal(api.finishTime(null), '');

const badge = api.runningStyleBadge({
  horseId: 'horse_J080',
  code: 'leader',
  label: '放',
  sampleCount: 5,
});
assert.match(badge, />放<\/span>$/);
assert.match(badge, /樣本 5 場/);
assert.equal(api.runningStyleBadge({ code: 'leader', label: '領放', sampleCount: 5 }), '');

(async () => {
  const first = await api.runningStyles(
    ['horse_J080', 'J080', 'horse_J080'],
    { raceId: 'race_2026-07-15_HV_1' },
  );
  const second = await api.runningStyles(
    ['horse_J080'],
    { raceId: 'race_2026-07-15_HV_1' },
  );
  assert.equal(first.styles[0].label, '放');
  assert.equal(second.styles[0].code, 'leader');
  assert.equal(calls.length, 1, 'identical batch requests share the cache');
  assert.match(calls[0], /horseIds=horse_J080/);
  assert.match(calls[0], /raceId=race_2026-07-15_HV_1/);
  console.log('Task 19 frontend helper tests passed');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});