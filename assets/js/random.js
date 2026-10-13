/*
 * Seeded normal draws (mulberry32 + Box-Muller), so a demo can redraw the same
 * sample when only a display setting changes.
 */
(function (root) {
  'use strict';

  function rng(seed) {
    let a = seed >>> 0;
    function uniform() {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    let spare = null;
    function normal() {
      if (spare !== null) { const s = spare; spare = null; return s; }
      let u = 0;
      while (u === 0) u = uniform();
      const v = uniform();
      const r = Math.sqrt(-2 * Math.log(u));
      spare = r * Math.sin(2 * Math.PI * v);
      return r * Math.cos(2 * Math.PI * v);
    }
    return { uniform: uniform, normal: normal };
  }

  // x = L g for a lower-triangular L (n x n) and g ~ N(0, I).
  function drawGaussian(L, n, random) {
    const g = new Float64Array(n);
    for (let i = 0; i < n; i++) g[i] = random.normal();
    const x = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      let s = 0;
      const row = i * n;
      for (let j = 0; j <= i; j++) s += L[row + j] * g[j];
      x[i] = s;
    }
    return x;
  }

  const api = { rng: rng, drawGaussian: drawGaussian };
  root.AE = root.AE || {};
  root.AE.random = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
