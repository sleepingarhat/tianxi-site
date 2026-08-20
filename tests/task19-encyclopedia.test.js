const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'encyclopedia', 'index.html'),
  'utf8',
);

const loadIndexStart = source.indexOf('function loadIndex(reset)');
const loadIndexEnd = source.indexOf('\n  function runSearch(', loadIndexStart);
assert.notEqual(loadIndexStart, -1, 'loadIndex exists');
assert.notEqual(loadIndexEnd, -1, 'loadIndex block can be isolated');

const loadIndex = source.slice(loadIndexStart, loadIndexEnd);
const hydrateAt = loadIndex.indexOf('var styleReady =');
const appendAt = loadIndex.indexOf("list.insertAdjacentHTML('beforeend'");
const offsetAt = loadIndex.indexOf('indexState.offset = requestOffset + rows.length');
const finallyAt = loadIndex.indexOf('.finally(function()');
const unlockAt = loadIndex.indexOf('indexState.loading = false', finallyAt);

assert.ok(hydrateAt >= 0, 'page hydration is awaited');
assert.ok(appendAt > hydrateAt, 'rows append only after style hydration');
assert.ok(offsetAt > appendAt, 'offset advances only after rows append');
assert.ok(finallyAt > offsetAt, 'request unlock happens after offset update');
assert.ok(unlockAt > finallyAt, 'rapid load-more remains locked until completion');

assert.match(source, /class="today-table"/, 'racecard renders as a table');
assert.match(source, /<th scope="col">檔<\/th>/, 'draw column is supported');
assert.match(source, /<th scope="col">負磅<\/th>/, 'declared weight column is supported');
assert.match(source, /data-race-id=/, 'race selector keeps canonical race context');

console.log('Encyclopedia racecard and pagination regression tests passed');