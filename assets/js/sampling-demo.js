/*
 * "The instrument can be off too": estimates the posterior's mean pointwise
 * correlation from S samples, R times, for an exact sampler and for one whose
 * cross-field covariance is shrunk by a bias b, i.e. it samples
 * (1 - b) C + b blockdiag(C). Setting fixed at a confirmatory point
 * (kappa 0.25, s 0.75, noise variance 0.1, stride 4).
 */
(function (root) {
  'use strict';

  const AE = root.AE;
  const SETTING = { kappa: 0.25, shared: 0.75, noise: 0.1, stride: 4 };
  const REPEATS = 24;

  function meanRho(C, dim) {
    const rho = AE.attribution.pointwiseCorrelation(C, dim);
    let m = 0;
    for (let i = 0; i < rho.length; i++) m += rho[i];
    return m / rho.length;
  }

  // Mean over points of the sample correlation between the fields, from S draws.
  function estimate(L, dim, S, random) {
    const n = dim / 2;
    const sx = new Float64Array(n), sy = new Float64Array(n), sxx = new Float64Array(n), syy = new Float64Array(n), sxy = new Float64Array(n);
    for (let k = 0; k < S; k++) {
      const x = AE.random.drawGaussian(L, dim, random);
      for (let p = 0; p < n; p++) {
        const a = x[p], b = x[n + p];
        sx[p] += a; sy[p] += b; sxx[p] += a * a; syy[p] += b * b; sxy[p] += a * b;
      }
    }
    let m = 0;
    for (let p = 0; p < n; p++) {
      const cxy = sxy[p] - sx[p] * sy[p] / S, cxx = sxx[p] - sx[p] * sx[p] / S, cyy = syy[p] - sy[p] * sy[p] / S;
      m += cxy / Math.sqrt(cxx * cyy);
    }
    return m / n;
  }

  function mount(demo) {
    const t = AE.i18n.t, num = AE.i18n.num;
    const q = function (role) { return demo.querySelector('[data-role="' + role + '"]'); };
    const tb = AE.testbed;
    const prior = tb.priorCovariance(SETTING.shared);
    const C = AE.attribution.posterior(prior.C, prior.dim, tb.operatorMatrix(SETTING.kappa, SETTING.stride, true), SETTING.noise);
    const dim = prior.dim, n = dim / 2;
    const exact = meanRho(C, dim);
    const factors = {};
    let seed = 7;

    function factor(b) {
      if (!factors[b]) {
        const Cb = new Float64Array(C);
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) { Cb[i * dim + n + j] *= 1 - b; Cb[(n + i) * dim + j] *= 1 - b; }
        }
        factors[b] = { L: AE.linalg.cholesky(Cb, dim), target: meanRho(Cb, dim) };
      }
      return factors[b];
    }

    function draw(estimates, target) {
      const svg = AE.svg, W = 560, H = 150, pad = 24;
      const lo = Math.min(exact, target, Math.min.apply(null, estimates)), hi = Math.max(exact, target, Math.max.apply(null, estimates));
      const span = Math.max(hi - lo, 0.02);
      const sx = svg.scale(lo - 0.1 * span, hi + 0.1 * span, pad, W - pad);
      const root = svg.chart(q('chart'), W, H, t('samp.aria'));
      svg.el('line', { x1: pad, x2: W - pad, y1: H - 34, y2: H - 34, class: 'chart-axisline' }, root);
      [lo, (lo + hi) / 2, hi].forEach(function (v) {
        svg.text(root, sx(v), H - 18, num(v, 3), { class: 'chart-tick', 'text-anchor': 'middle' });
      });
      svg.text(root, W / 2, H - 2, t('samp.x'), { class: 'chart-label', 'text-anchor': 'middle' });
      const random = AE.random.rng(99);
      estimates.forEach(function (e) {
        svg.el('circle', { cx: sx(e), cy: 30 + random.uniform() * (H - 74), r: 4, class: 'dot' }, root);
      });
      svg.el('line', { x1: sx(exact), x2: sx(exact), y1: 14, y2: H - 34, class: 'marker-exact' }, root);
      svg.text(root, sx(exact), 12, t('samp.exact'), { class: 'chart-label', 'text-anchor': 'middle' });
      if (Math.abs(target - exact) > 1e-9) {
        svg.el('line', { x1: sx(target), x2: sx(target), y1: 24, y2: H - 34, class: 'marker-biased' }, root);
        svg.text(root, sx(target), 22, t('samp.biasedTarget'), { class: 'chart-label biased', 'text-anchor': target < exact ? 'end' : 'start' });
      }
    }

    function render() {
      const S = Number(q('samples').value), b = Number(q('bias').value);
      q('bias-value').textContent = num(b, 2, true);
      const f = factor(b);
      const random = AE.random.rng(seed);
      const estimates = [];
      for (let r = 0; r < REPEATS; r++) estimates.push(estimate(f.L, dim, S, random));
      const mean = estimates.reduce(function (a, v) { return a + v; }, 0) / REPEATS;
      const sd = Math.sqrt(estimates.reduce(function (a, v) { return a + (v - mean) * (v - mean); }, 0) / (REPEATS - 1));
      draw(estimates, f.target);
      let text = t('samp.readout', { R: REPEATS, S: S, mean: num(mean, 3), exact: num(exact, 3), sd: num(sd, 3) });
      if (b > 0) text += t('samp.biasNote', { gap: num(f.target - exact, 3) });
      q('readout').textContent = text;
      q('readout').classList.toggle('warning', b > 0);
    }

    function schedule() {
      q('readout').textContent = t('samp.computing');
      requestAnimationFrame(function () { requestAnimationFrame(render); });
    }

    q('samples').addEventListener('change', schedule);
    q('bias').addEventListener('change', schedule);
    q('bias').addEventListener('input', function () { q('bias-value').textContent = num(Number(q('bias').value), 2, true); });
    q('redraw').addEventListener('click', function () { seed += 1; schedule(); });
    schedule();
  }

  const demo = document.getElementById('sampling-demo');
  if (demo) AE.sections.whenOpen(demo, function () { mount(demo); });
})(globalThis);
