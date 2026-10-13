/*
 * Testbed (a) of Study I, written to match the thesis code exactly
 * (fwi_common.testbeds.linear_gaussian and fwi_common.bases; checked against it by
 * tests/attribution.test.js on a fixture the Python code produced).
 *
 * Fields. Two 16 x 16 fields. Field k = Phi_k [z_shared; z_k] + scatter * noise, with
 * Phi_k the leading `latentDim` modes of a squared-exponential spectrum (correlation
 * length ell_k) on one orthonormal DCT-II basis. The first round(s * latentDim) latent
 * coordinates are shared by both fields: s, the shared fraction, sets how dependent
 * the fields are in the prior.
 *
 * Operator. Each field is blurred (Gaussian, blurSigma cells) and subsampled every
 * `stride` cells (B). The data frames are orthonormal with cosine kappa between the
 * two fields' data subspaces, so the operator enters the posterior only through
 * G^T G = H^T H, with H = [[B, kappa B], [0, sqrt(1 - kappa^2) B]]. Observing each
 * field separately ("operator off") is H = [[B, 0], [0, B]].
 */
(function (root) {
  'use strict';

  const SHAPE = [16, 16];
  const DEFAULTS = { latentDim: 8, correlationLengths: [3, 4], scatter: 0.1, blurSigma: 1 };

  // Orthonormal 1-D DCT-II matrix D[k][n] = s_k cos(pi k (2n + 1) / (2N)).
  function dct1(N) {
    const D = new Float64Array(N * N);
    for (let k = 0; k < N; k++) {
      const s = k === 0 ? Math.sqrt(1 / N) : Math.sqrt(2 / N);
      for (let n = 0; n < N; n++) D[k * N + n] = s * Math.cos(Math.PI * k * (2 * n + 1) / (2 * N));
    }
    return D;
  }

  // Frequencies (i, j) ordered by radius, ties by i then j (numpy lexsort((ix, iy, radius))).
  function modeOrder(h, w) {
    const idx = [];
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) idx.push({ i: i, j: j, r: Math.hypot(i / (2 * h), j / (2 * w)) });
    }
    idx.sort(function (a, b) { return a.r - b.r || a.i - b.i || a.j - b.j; });
    return idx;
  }

  // (nPix x nModes) row-major: column m = basis vector of mode m times sqrt(lambda_m).
  function spectralModes(h, w, ell, nModes) {
    const Dh = dct1(h);
    const Dw = dct1(w);
    const order = modeOrder(h, w);
    const spec = order.map(function (o) { return Math.exp(-0.5 * ell * ell * Math.pow(2 * Math.PI * o.r, 2)); });
    const norm = (h * w) / spec.reduce(function (a, b) { return a + b; }, 0);
    const n = h * w;
    const Phi = new Float64Array(n * nModes);
    for (let m = 0; m < nModes; m++) {
      const o = order[m];
      const amp = Math.sqrt(spec[m] * norm);
      for (let a = 0; a < h; a++) {
        for (let b = 0; b < w; b++) Phi[(a * w + b) * nModes + m] = amp * Dh[o.i * h + a] * Dw[o.j * w + b];
      }
    }
    return Phi;
  }

  // Joint prior covariance (2n x 2n) = L L^T + scatter^2 I; with independent=true the
  // cross-field blocks are zeroed ("prior dependence off": every marginal kept).
  function priorCovariance(shared, opts) {
    const o = Object.assign({}, DEFAULTS, opts || {});
    const h = SHAPE[0], w = SHAPE[1], n = h * w, r = o.latentDim;
    const nShared = Math.round(shared * r);
    const nOwn = r - nShared;
    const cols = nShared + 2 * nOwn;
    const L = new Float64Array(2 * n * cols);
    for (let k = 0; k < 2; k++) {
      const Phi = spectralModes(h, w, o.correlationLengths[k], r);
      for (let p = 0; p < n; p++) {
        const row = (k * n + p) * cols;
        for (let m = 0; m < nShared; m++) L[row + m] = Phi[p * r + m];
        for (let m = 0; m < nOwn; m++) L[row + nShared + k * nOwn + m] = Phi[p * r + nShared + m];
      }
    }
    const C = root.AE.linalg.matmulT(L, L, 2 * n, cols, 2 * n);
    for (let i = 0; i < 2 * n; i++) C[i * 2 * n + i] += o.scatter * o.scatter;
    if (o.independent) {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) { C[i * 2 * n + (n + j)] = 0; C[(n + i) * 2 * n + j] = 0; }
      }
    }
    return { C: C, dim: 2 * n, n: n, nShared: nShared };
  }

  // Blur-and-subsample rows (nObs x nPix), each a normalised Gaussian kernel.
  function blurSubsample(stride, blurSigma) {
    const h = SHAPE[0], w = SHAPE[1];
    const centres = [];
    for (let a = 0; a < h; a++) for (let b = 0; b < w; b++) if (a % stride === 0 && b % stride === 0) centres.push([a, b]);
    const B = new Float64Array(centres.length * h * w);
    centres.forEach(function (c, row) {
      let sum = 0;
      for (let a = 0; a < h; a++) {
        for (let b = 0; b < w; b++) {
          const v = Math.exp(-0.5 * ((c[0] - a) * (c[0] - a) + (c[1] - b) * (c[1] - b)) / (blurSigma * blurSigma));
          B[row * h * w + a * w + b] = v;
          sum += v;
        }
      }
      for (let p = 0; p < h * w; p++) B[row * h * w + p] /= sum;
    });
    return { B: B, nObs: centres.length };
  }

  // H (2 nObs x 2 nPix) with H^T H equal to the operator's G^T G. coupled=false: separate observation.
  function operatorMatrix(kappa, stride, coupled, opts) {
    const o = Object.assign({}, DEFAULTS, opts || {});
    const n = SHAPE[0] * SHAPE[1];
    const bs = blurSubsample(stride, o.blurSigma);
    const m = bs.nObs;
    const H = new Float64Array(2 * m * 2 * n);
    const a = coupled ? kappa : 0;
    const c = coupled ? Math.sqrt(1 - kappa * kappa) : 1;
    for (let r = 0; r < m; r++) {
      for (let p = 0; p < n; p++) {
        const b = bs.B[r * n + p];
        H[r * 2 * n + p] = b;
        H[r * 2 * n + n + p] = a * b;
        H[(m + r) * 2 * n + n + p] = c * b;
      }
    }
    return { H: H, rows: 2 * m, cols: 2 * n, nObs: m };
  }

  const api = { SHAPE: SHAPE, DEFAULTS: DEFAULTS, dct1: dct1, modeOrder: modeOrder, spectralModes: spectralModes,
                priorCovariance: priorCovariance, blurSubsample: blurSubsample, operatorMatrix: operatorMatrix };
  root.AE = root.AE || {};
  root.AE.testbed = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
