/*
 * "Two linked fields": draws a pair of fields from the testbed's prior for a
 * chosen shared fraction s, and plots field 2 against field 1 point by point.
 */
(function (root) {
  'use strict';

  const AE = root.AE;
  const N = AE.testbed.SHAPE[0];

  function mount(demo) {
    const sharedInput = demo.querySelector('[data-role="shared"]');
    const sharedOut = demo.querySelector('[data-role="shared-value"]');
    const readout = demo.querySelector('[data-role="readout"]');
    const scatter = demo.querySelector('[data-role="scatter"]');
    let seed = 1;
    let cache = { s: null };

    function prior(s) {
      if (cache.s !== s) {
        const pc = AE.testbed.priorCovariance(s);
        const rho = AE.attribution.pointwiseCorrelation(pc.C, pc.dim);
        let mean = 0;
        for (let i = 0; i < rho.length; i++) mean += rho[i];
        cache = { s: s, L: AE.linalg.cholesky(pc.C, pc.dim), dim: pc.dim, nShared: pc.nShared, rho: mean / rho.length };
      }
      return cache;
    }

    function drawScatter(x, n) {
      const svg = AE.svg, W = 260, H = 260, pad = 30;
      const root = svg.chart(scatter, W, H, AE.i18n.t('prior.scatterAria'));
      let m = 0;
      for (let i = 0; i < 2 * n; i++) m = Math.max(m, Math.abs(x[i]));
      const sx = svg.scale(-m, m, pad, W - 8), sy = svg.scale(-m, m, H - pad, 8);
      svg.el('line', { x1: sx(0), x2: sx(0), y1: 8, y2: H - pad, class: 'chart-zero' }, root);
      svg.el('line', { y1: sy(0), y2: sy(0), x1: pad, x2: W - 8, class: 'chart-zero' }, root);
      for (let p = 0; p < n; p++) svg.el('circle', { cx: sx(x[p]), cy: sy(x[n + p]), r: 2.4, class: 'dot' }, root);
      svg.text(root, (pad + W) / 2, H - 8, AE.i18n.t('prior.x'), { class: 'chart-label', 'text-anchor': 'middle' });
      svg.text(root, 12, (H - pad) / 2, AE.i18n.t('prior.y'), { class: 'chart-label', 'text-anchor': 'middle', transform: 'rotate(-90 12 ' + (H - pad) / 2 + ')' });
    }

    function render() {
      const s = Number(sharedInput.value);
      sharedOut.textContent = AE.i18n.num(s, 3, true);
      const p = prior(s);
      const x = AE.random.drawGaussian(p.L, p.dim, AE.random.rng(seed));
      const n = p.dim / 2;
      let m = 0;
      for (let i = 0; i < p.dim; i++) m = Math.max(m, Math.abs(x[i]));
      AE.colormap.paint(demo.querySelector('[data-role="field1"]'), x.subarray(0, n), N, m);
      AE.colormap.paint(demo.querySelector('[data-role="field2"]'), x.subarray(n), N, m);
      drawScatter(x, n);
      readout.textContent = AE.i18n.t('prior.readout', { k: p.nShared, r: AE.testbed.DEFAULTS.latentDim, rho: AE.i18n.num(p.rho, 2) });
    }

    sharedInput.addEventListener('input', render);
    demo.querySelector('[data-role="redraw"]').addEventListener('click', function () { seed += 1; render(); });
    render();
  }

  const demo = document.getElementById('prior-demo');
  if (demo) AE.sections.whenOpen(demo, function () { mount(demo); });
})(globalThis);
