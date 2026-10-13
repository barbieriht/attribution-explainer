'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const data = JSON.parse(read('assets/data/study1-results.json'));

test('the page data file carries exactly the imported JSON', () => {
  const js = read('assets/data/study1-results.js');
  const object = js.slice(js.indexOf('{'), js.lastIndexOf('}') + 1);
  assert.deepEqual(JSON.parse(object), data);
});

test('the confirmatory outcome is consistent with its own points', () => {
  const o = data.confirmatory.outcome;
  const points = data.confirmatory.points;
  assert.equal(points.length, 8);
  const worst = Math.max(...points.map((p) => p.magnitude_error));
  assert.ok(Math.abs(worst - o.metric2.max_error) < 1e-12);
  assert.equal(o.metric2.passes, worst <= o.metric2.tolerance);
  const passed = o.metric1.phi_O.passes && o.metric1.phi_P.passes && o.metric2.passes;
  assert.equal(o.outcome, passed ? 'SUPPORTED' : 'REFUTED');
});

test('F1 has a verdict and a full curve for every (s, N) setting', () => {
  const steps = new Set(data.f1.curves.map((c) => c.steps));
  for (const v of data.f1.verdicts) {
    const series = data.f1.curves.filter((c) => c.s === v.s && c.N === v.N);
    assert.equal(series.length, steps.size);
    for (const c of series) assert.ok(c.min <= c.mean && c.mean <= c.max);
  }
});

test('every [data-fill] hook in the pages is filled by results.js', () => {
  const src = read('assets/js/results.js');
  const block = src.slice(src.indexOf('const fills = {'), src.indexOf('};', src.indexOf('const fills = {')));
  const keys = new Set(Array.from(block.matchAll(/'([\w-]+)':/g), (m) => m[1]));
  for (const file of ['index.html', 'index.pt.html']) {
    for (const m of read(file).matchAll(/data-fill="([\w-]+)"/g)) assert.ok(keys.has(m[1]), `${file}: ${m[1]}`);
  }
});
