'use strict';
const test = require('node:test');
const assert = require('node:assert');
const AE = require('./load.js');
const fixture = require('./fixtures/attribution.json');

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg}: ${a} vs ${b}`);

test('spectral modes match the thesis code', () => {
  const phi = AE.testbed.spectralModes(16, 16, fixture.modes.ell, 8);
  fixture.modes.first_column.forEach((v, p) => close(phi[p * 8 + 0], v, 1e-12, `mode 0, pixel ${p}`));
  fixture.modes.eighth_column.forEach((v, p) => close(phi[p * 8 + 7], v, 1e-12, `mode 7, pixel ${p}`));
});

for (const s of fixture.settings) {
  const label = `s=${s.shared} kappa=${s.kappa} noise=${s.noise} stride=${s.stride}`;
  test(`prior covariance matches (${label})`, () => {
    const C = AE.testbed.priorCovariance(s.shared).C;
    const idx = [[0, 0], [0, 256], [17, 300], [255, 511]];
    idx.forEach(([i, j], k) => close(C[i * 512 + j], s.prior_spot[k], 1e-12, `C[${i},${j}]`));
  });
  test(`four posteriors and Shapley shares match the thesis code (${label})`, () => {
    const out = AE.attribution.attribute({ shared: s.shared, kappa: s.kappa, noise: s.noise, stride: s.stride });
    for (const cell of ['none', 'O', 'P', 'OP']) {
      for (const f of ['signed', 'unsigned', 'mi']) close(out.cells[cell][f], s.cells[cell][f], 1e-8, `${cell} ${f}`);
    }
    for (const f of ['signed', 'unsigned', 'mi']) {
      close(out.shares[f].O, s.shares[f].O, 1e-8, `phi_O ${f}`);
      close(out.shares[f].P, s.shares[f].P, 1e-8, `phi_P ${f}`);
    }
  });
}

test('Shapley shares add up to the total', () => {
  const v = { none: 0.1, O: -0.3, P: 0.5, OP: 0.2 };
  const sh = AE.attribution.shapley(v);
  close(sh.O + sh.P, v.OP - v.none, 1e-15, 'efficiency');
});

test('cholesky solves an SPD system', () => {
  const A = new Float64Array([4, 2, 0.6, 2, 5, 1, 0.6, 1, 3]);
  const L = AE.linalg.cholesky(A, 3);
  const x = AE.linalg.choleskySolve(L, new Float64Array([1, 2, 3]), 3, 1);
  const back = AE.linalg.matmul(A, x, 3, 3, 1);
  [1, 2, 3].forEach((b, i) => close(back[i], b, 1e-12, `row ${i}`));
});
