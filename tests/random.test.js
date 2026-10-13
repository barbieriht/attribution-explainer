'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const AE = require('./load.js');
require('../assets/js/random.js');

test('seeded draws repeat exactly', () => {
  const a = AE.random.rng(5), b = AE.random.rng(5);
  for (let i = 0; i < 100; i++) assert.equal(a.normal(), b.normal());
});

test('drawGaussian reproduces the covariance it is given', () => {
  // C = [[1, 0.6], [0.6, 2]]
  const L = AE.linalg.cholesky(new Float64Array([1, 0.6, 0.6, 2]), 2);
  const r = AE.random.rng(1);
  const n = 40000;
  let s11 = 0, s12 = 0, s22 = 0;
  for (let k = 0; k < n; k++) {
    const x = AE.random.drawGaussian(L, 2, r);
    s11 += x[0] * x[0]; s12 += x[0] * x[1]; s22 += x[1] * x[1];
  }
  assert.ok(Math.abs(s11 / n - 1) < 0.03);
  assert.ok(Math.abs(s12 / n - 0.6) < 0.03);
  assert.ok(Math.abs(s22 / n - 2) < 0.06);
});
