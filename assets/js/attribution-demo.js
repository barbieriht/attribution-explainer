/*
 * "Switch each source on and off": the four exact posteriors of the testbed for
 * the chosen operator and prior, their pointwise-correlation maps, and the
 * Shapley shares of the chosen dependence functional.
 */
(function (root) {
  'use strict';

  const AE = root.AE;
  const N = AE.testbed.SHAPE[0];
  const CELLS = ['none', 'O', 'P', 'OP'];
  const PRESETS = {
    strong: { kappa: 0, shared: 1, noise: '0.001', stride: '2' },
    weak: { kappa: 0, shared: 1, noise: '1', stride: '8' },
    tug: { kappa: 0.95, shared: 1, noise: '0.001', stride: '2' },
    confirmatory: { kappa: 0.25, shared: 0.25, noise: '0.1', stride: '4' },
  };

  function mount(demo) {
    const t = AE.i18n.t, num = AE.i18n.num;
    const q = function (role) { return demo.querySelector('[data-role="' + role + '"]'); };
    const inputs = { kappa: q('kappa'), shared: q('shared'), noise: q('noise'), stride: q('stride') };
    const status = q('status');
    const readout = q('readout');
    let last = null, lastKey = '', pending = false;

    function setting() {
      return { kappa: Number(inputs.kappa.value), shared: Number(inputs.shared.value),
               noise: Number(inputs.noise.value), stride: Number(inputs.stride.value) };
    }
    function functional() { return demo.querySelector('input[name="attr-functional"]:checked').value; }

    function drawShares(shares) {
      const svg = AE.svg, W = 520, H = 130, left = 120, right = 70;
      const rows = [['O', t('attr.phiO'), 'bar-o'], ['P', t('attr.phiP'), 'bar-p'], ['total', t('attr.total'), 'bar-total']];
      const m = Math.max(1e-9, Math.abs(shares.O), Math.abs(shares.P), Math.abs(shares.total));
      const sx = svg.scale(-m, m, left, W - right);
      const root = svg.chart(q('shares'), W, H, t('attr.sharesAria'));
      rows.forEach(function (r, i) {
        const y = 12 + i * 38, v = shares[r[0]];
        svg.text(root, left - 8, y + 18, r[1], { class: 'chart-label', 'text-anchor': 'end' });
        svg.el('rect', { x: Math.min(sx(0), sx(v)), y: y, width: Math.abs(sx(v) - sx(0)), height: 26, class: r[2] }, root);
        svg.text(root, v >= 0 ? sx(v) + 4 : sx(v) - 4, y + 18, num(v, 3), { class: 'chart-value', 'text-anchor': v >= 0 ? 'start' : 'end' });
      });
      svg.el('line', { x1: sx(0), x2: sx(0), y1: 4, y2: H - 4, class: 'chart-zero' }, root);
    }

    function render() {
      const s = setting();
      const f = functional();
      const key = [s.kappa, s.shared, s.noise, s.stride].join('|');
      q('kappa-value').textContent = num(s.kappa, 2, true);
      q('shared-value').textContent = num(s.shared, 3, true);
      if (key !== lastKey) {
        const t0 = performance.now();
        last = AE.attribution.attribute(s, true);
        const prior = AE.testbed.priorCovariance(s.shared);
        const rho = AE.attribution.pointwiseCorrelation(prior.C, prior.dim);
        let mean = 0;
        for (let i = 0; i < rho.length; i++) mean += rho[i];
        last.priorRho = mean / rho.length;
        last.ms = Math.round(performance.now() - t0);
        lastKey = key;
      }
      CELLS.forEach(function (c) {
        AE.colormap.paint(q('cell-' + c), last.cells[c].rho, N, 1);
        q('value-' + c).textContent = f === 'mi' ? t('attr.cellMI', { v: num(last.cells[c].mi, 3) })
          : t('attr.cellValue', { v: num(f === 'signed' ? last.cells[c].signed : last.cells[c].unsigned, 3) });
      });
      const sh = last.shares[f];
      drawShares(sh);
      const notes = [];
      if (s.shared > 0 && Math.abs(last.priorRho) > 1e-6) {
        notes.push(t('attr.survival', { prior: num(last.priorRho, 2), post: num(last.cells.P.signed, 3),
                                        pct: num(100 * last.cells.P.signed / last.priorRho, 1) }));
      }
      const signed = last.shares.signed;
      const opposing = signed.O * signed.P < 0 && Math.min(Math.abs(signed.O), Math.abs(signed.P)) > 1e-3;
      if (f === 'signed' && opposing) {
        notes.push(t('attr.oppose', { dirO: t(signed.O > 0 ? 'attr.up' : 'attr.down'), dirP: t(signed.P > 0 ? 'attr.up' : 'attr.down'),
                                      total: num(signed.total, 3) }));
      }
      if (f === 'mi' && sh.P < 0) notes.push(t('attr.miNegative'));
      if (f === 'unsigned' && opposing) notes.push(t('attr.unsigned'));
      readout.textContent = notes.join(' ');
      readout.classList.toggle('warning', (f === 'signed' && opposing && signed.total * signed.P < 0) || (f === 'mi' && sh.P < 0));
      status.textContent = t('attr.done', { ms: last.ms });
    }

    function schedule() {
      if (pending) return;
      pending = true;
      status.textContent = t('attr.computing');
      requestAnimationFrame(function () { requestAnimationFrame(function () { pending = false; render(); }); });
    }

    Object.keys(inputs).forEach(function (k) { inputs[k].addEventListener('input', schedule); });
    demo.querySelectorAll('input[name="attr-functional"]').forEach(function (r) { r.addEventListener('change', render); });
    demo.querySelectorAll('[data-preset]').forEach(function (b) {
      b.addEventListener('click', function () {
        const p = PRESETS[b.getAttribute('data-preset')];
        inputs.kappa.value = p.kappa; inputs.shared.value = p.shared; inputs.noise.value = p.noise; inputs.stride.value = p.stride;
        schedule();
      });
    });
    schedule();
  }

  const demo = document.getElementById('attribution-demo');
  if (demo) AE.sections.whenOpen(demo, function () { mount(demo); });
})(globalThis);
