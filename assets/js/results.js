/*
 * The study's registered results (assets/data/study1-results.js, written by
 * scripts/import_results.py): numbers quoted in the prose ([data-fill]), the
 * confirmatory magnitude chart and the F1 training curves.
 */
(function (root) {
  'use strict';

  const AE = root.AE;
  const R = root.AE_RESULTS;
  if (!R) return;
  const t = AE.i18n.t, num = AE.i18n.num;

  function pct(v) { return num(100 * v, 100 * v < 1 ? 2 : 1); }
  function range(values) {
    return pct(Math.min.apply(null, values)) + '–' + pct(Math.max.apply(null, values)) + '%';
  }

  const points = R.confirmatory.points.slice().sort(function (a, b) {
    return a.s - b.s || a.kappa - b.kappa || Number(b.informative) - Number(a.informative);
  });
  const weak = function (x) { return x.s < 0.5; };
  const fills = {
    'grid-coupled': String(R.exact_grid.coupled_cells),
    'grid-opposing': String(R.exact_grid.coupled_cells_opposing),
    'grid-mi-cells': String(R.exact_grid.mi_cells_with_s),
    'grid-mi-negative': String(R.exact_grid.mi_negative_prior_share),
    'regime-priors': String(R.confirmatory.regime.priors),
    'regime-inside': String(R.confirmatory.regime.inside),
    'mag-weak': range(points.filter(weak).map(function (p) { return p.magnitude_error; })),
    'mag-strong': range(points.filter(function (p) { return !weak(p); }).map(function (p) { return p.magnitude_error; })),
    'loss-weak': range(R.prior_loss.filter(weak).map(function (p) { return p.deficit; })),
    'loss-strong': range(R.prior_loss.filter(function (p) { return !weak(p); }).map(function (p) { return p.deficit; })),
  };
  document.querySelectorAll('[data-fill]').forEach(function (node) {
    const v = fills[node.getAttribute('data-fill')];
    if (v !== undefined) node.textContent = v;
  });

  function magnitudeChart(container) {
    const svg = AE.svg, W = 640, H = 280, left = 46, bottom = 44, top = 16;
    const tol = R.confirmatory.outcome.metric2.tolerance;
    const max = Math.max(0.16, Math.max.apply(null, points.map(function (p) { return p.magnitude_error; })) * 1.08);
    const sy = svg.scale(0, max, H - bottom, top);
    const step = (W - left - 10) / points.length;
    const root = svg.chart(container, W, H, t('res.magAria'));
    for (let v = 0; v <= max + 1e-9; v += 0.05) {
      svg.el('line', { x1: left, x2: W - 10, y1: sy(v), y2: sy(v), class: 'chart-gridline' }, root);
      svg.text(root, left - 6, sy(v) + 4, num(100 * v, 0) + '%', { class: 'chart-tick', 'text-anchor': 'end' });
    }
    points.forEach(function (p, i) {
      const x = left + i * step + 0.18 * step, w = 0.64 * step;
      svg.el('rect', { x: x, y: sy(p.magnitude_error), width: w, height: sy(0) - sy(p.magnitude_error), class: weak(p) ? 'bar-weak' : 'bar-strong' }, root);
      svg.text(root, x + w / 2, sy(p.magnitude_error) - 4, pct(p.magnitude_error), { class: 'chart-value', 'text-anchor': 'middle' });
      svg.text(root, x + w / 2, H - bottom + 16, t('res.point', { kappa: num(p.kappa, 2) }), { class: 'chart-tick', 'text-anchor': 'middle' });
      svg.text(root, x + w / 2, H - bottom + 31, t(p.informative ? 'res.informative' : 'res.lowinfo'), { class: 'chart-tick', 'text-anchor': 'middle' });
    });
    svg.el('line', { x1: left, x2: W - 10, y1: sy(tol), y2: sy(tol), class: 'tolerance' }, root);
    const free = points.findIndex(function (p) { return p.magnitude_error < tol / 4; });
    const tx = free >= 0 ? left + (free + 0.5) * step : W - 12;
    svg.text(root, tx, sy(tol) - 6, t('res.tol', { tol: num(100 * tol, 1) }), { class: 'chart-label', 'text-anchor': free >= 0 ? 'middle' : 'end' });
    svg.el('line', { x1: left, x2: W - 10, y1: sy(0), y2: sy(0), class: 'chart-axisline' }, root);
  }

  function verdict(node) {
    const o = R.confirmatory.outcome;
    node.textContent = t('res.verdict', {
      tauO: num(o.metric1.phi_O.tau, 3), tauP: num(o.metric1.phi_P.tau, 3),
      attO: num(o.metric1.phi_O.attainable, 3), attP: num(o.metric1.phi_P.attainable, 3),
      maxErr: pct(o.metric2.max_error), tol: num(100 * o.metric2.tolerance, 1),
      rank: t(o.metric1.phi_O.passes && o.metric1.phi_P.passes ? 'res.pass' : 'res.fail'),
      mag: t(o.metric2.passes ? 'res.pass' : 'res.fail'), outcome: t('res.outcome.' + o.outcome),
    });
    node.classList.toggle('warning', o.outcome !== 'SUPPORTED');
  }

  function curvesChart(container, legend) {
    const svg = AE.svg, W = 640, H = 320, left = 50, right = 34, top = 16, bottom = 52;
    const curves = R.f1.curves;
    const steps = Array.from(new Set(curves.map(function (c) { return c.steps; }))).sort(function (a, b) { return a - b; });
    const lx = function (s) { return Math.log(s); };
    const sx = svg.scale(lx(steps[0]), lx(steps[steps.length - 1]), left, W - right);
    const ymax = Math.ceil(100 * Math.max.apply(null, curves.map(function (c) { return c.max; })) / 5) * 5 / 100;
    const sy = svg.scale(0, ymax, H - bottom, top);
    const root = svg.chart(container, W, H, t('f1.aria'));
    for (let v = 0; v <= ymax + 1e-9; v += 0.05) {
      svg.el('line', { x1: left, x2: W - right, y1: sy(v), y2: sy(v), class: 'chart-gridline' }, root);
      svg.text(root, left - 6, sy(v) + 4, num(100 * v, 0) + '%', { class: 'chart-tick', 'text-anchor': 'end' });
    }
    steps.forEach(function (s) {
      svg.text(root, sx(lx(s)), H - bottom + 18, t('f1.thousand', { n: num(s / 1000, 0) }), { class: 'chart-tick', 'text-anchor': 'middle' });
    });
    svg.text(root, (left + W - right) / 2, H - 8, t('f1.x'), { class: 'chart-label', 'text-anchor': 'middle' });
    const main = 20000;
    svg.el('line', { x1: sx(lx(main)), x2: sx(lx(main)), y1: top, y2: H - bottom, class: 'chart-axisline', 'stroke-dasharray': '3 3' }, root);
    svg.text(root, sx(lx(main)) + 6, top + 12, t('f1.main'), { class: 'chart-label' });
    legend.textContent = '';
    R.f1.verdicts.forEach(function (v) {
      const series = curves.filter(function (c) { return c.s === v.s && c.N === v.N; }).sort(function (a, b) { return a.steps - b.steps; });
      const cls = (v.s < 0.5 ? 'weak' : 'strong');
      const upper = series.map(function (c) { return sx(lx(c.steps)) + ',' + sy(c.max); });
      const lower = series.slice().reverse().map(function (c) { return sx(lx(c.steps)) + ',' + sy(c.min); });
      svg.el('polygon', { points: upper.concat(lower).join(' '), class: 'band ' + cls }, root);
      svg.el('polyline', { points: series.map(function (c) { return sx(lx(c.steps)) + ',' + sy(c.mean); }).join(' '),
                           class: 'curve ' + cls + (v.N < 4096 ? ' dashed' : '') }, root);
      const li = document.createElement('li');
      li.className = cls + (v.N < 4096 ? ' dashed' : '');
      li.textContent = t('f1.series', { s: num(v.s, 2), N: v.N }) + ': ' +
        (v.verdict.indexOf('supported') >= 0 ? t('f1.verdictE') : t('f1.verdictI', { up: v.seeds_up, n: v.seeds }));
      legend.appendChild(li);
    });
  }

  function mountWhenOpen(id, fn) {
    const node = document.getElementById(id);
    if (node) AE.sections.whenOpen(node, function () { fn(node); });
  }
  mountWhenOpen('result-chart', function (node) {
    magnitudeChart(node.querySelector('[data-role="magnitude"]'));
    verdict(node.querySelector('[data-role="verdict"]'));
  });
  mountWhenOpen('f1-chart', function (node) {
    curvesChart(node.querySelector('[data-role="curves"]'), node.querySelector('[data-role="legend"]'));
  });
})(globalThis);
