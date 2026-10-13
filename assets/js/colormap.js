/*
 * Colour for the 16 x 16 maps. Diverging: blue for negative, orange for positive,
 * a light neutral at zero. Fixed colours (not theme tokens) so a value reads the
 * same in both themes; the legend bar in explainer.css uses the same stops.
 */
(function (root) {
  'use strict';

  const STOPS = [[33, 102, 172], [146, 197, 222], [242, 240, 235], [244, 165, 96], [179, 88, 6]];

  // v in [-1, 1] -> [r, g, b]
  function diverging(v) {
    const x = Math.max(-1, Math.min(1, v));
    const f = (x + 1) / 2 * (STOPS.length - 1);
    const i = Math.min(STOPS.length - 2, Math.floor(f));
    const r = f - i;
    return [0, 1, 2].map(function (c) { return Math.round(STOPS[i][c] + r * (STOPS[i + 1][c] - STOPS[i][c])); });
  }

  // Paint an (n x n) map onto a canvas, one canvas pixel per cell (CSS scales it up).
  function paint(canvas, values, n, scale) {
    canvas.width = n; canvas.height = n;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(n, n);
    for (let p = 0; p < n * n; p++) {
      const c = diverging(values[p] / scale);
      img.data[4 * p] = c[0]; img.data[4 * p + 1] = c[1]; img.data[4 * p + 2] = c[2]; img.data[4 * p + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  const api = { STOPS: STOPS, diverging: diverging, paint: paint };
  root.AE = root.AE || {};
  root.AE.colormap = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
