/*
 * Exact attribution of cross-field posterior dependence (Study I, linear-Gaussian
 * limit). Two players: operator coupling O and prior dependence P. Each of the four
 * coalitions is a posterior computed in closed form,
 *     C_post = C_p - C_p H^T (H C_p H^T + sigma^2 I)^{-1} H C_p,
 * and the change in a dependence functional is split with the Shapley value:
 *     phi_O = 1/2 [(v(O) - v(none)) + (v(OP) - v(P))],
 *     phi_P = 1/2 [(v(P) - v(none)) + (v(OP) - v(O))].
 * Functionals (as in the thesis): the mean signed pointwise correlation between the
 * fields, its unsigned version, and the mutual information of the full fields,
 * I = 1/2 (log det C_11 + log det C_22 - log det C).
 */
(function (root) {
  'use strict';

  const la = root.AE.linalg;
  const tb = root.AE.testbed;

  // Posterior covariance (dim x dim) for a prior covariance and an operator H.
  function posterior(Cp, dim, op, noiseVariance) {
    const m = op.rows;
    const W = la.matmulT(Cp, op.H, dim, dim, m);                 // C_p H^T   (dim x m)
    const S = la.matmul(op.H, W, m, dim, m);                     // H C_p H^T (m x m)
    for (let i = 0; i < m; i++) S[i * m + i] += noiseVariance;
    const L = la.cholesky(S, m);
    const Wt = new Float64Array(m * dim);
    for (let i = 0; i < dim; i++) for (let r = 0; r < m; r++) Wt[r * dim + i] = W[i * m + r];
    const Z = la.choleskySolve(L, Wt, m, dim);                   // S^{-1} H C_p (m x dim)
    const C = la.matmul(W, Z, dim, m, dim);
    for (let i = 0; i < dim * dim; i++) C[i] = Cp[i] - C[i];
    for (let i = 0; i < dim; i++) {                               // symmetrise
      for (let j = i + 1; j < dim; j++) { const v = 0.5 * (C[i * dim + j] + C[j * dim + i]); C[i * dim + j] = v; C[j * dim + i] = v; }
    }
    return C;
  }

  // rho(x) = corr(m_1(x), m_2(x)) for every pixel x.
  function pointwiseCorrelation(C, dim) {
    const n = dim / 2;
    const rho = new Float64Array(n);
    for (let x = 0; x < n; x++) rho[x] = C[x * dim + (n + x)] / Math.sqrt(C[x * dim + x] * C[(n + x) * dim + (n + x)]);
    return rho;
  }

  function mutualInformation(C, dim) {
    const n = dim / 2;
    const l11 = la.logdetFromCholesky(la.cholesky(la.block(C, dim, 0, 0, n), n), n);
    const l22 = la.logdetFromCholesky(la.cholesky(la.block(C, dim, n, n, n), n), n);
    const l = la.logdetFromCholesky(la.cholesky(C, dim), dim);
    return Math.max(0, 0.5 * (l11 + l22 - l));
  }

  function functionals(C, dim) {
    const rho = pointwiseCorrelation(C, dim);
    let signed = 0, unsigned = 0;
    for (let x = 0; x < rho.length; x++) { signed += rho[x]; unsigned += Math.abs(rho[x]); }
    return { signed: signed / rho.length, unsigned: unsigned / rho.length,
             mi: mutualInformation(C, dim), rho: rho };
  }

  function shapley(v) {
    return { O: 0.5 * ((v.O - v.none) + (v.OP - v.P)), P: 0.5 * ((v.P - v.none) + (v.OP - v.O)), total: v.OP - v.none };
  }

  // The four coalitions for one setting; withMI=false skips the (slower) log-dets.
  function attribute(setting, withMI) {
    const dep = tb.priorCovariance(setting.shared, { independent: false });
    const ind = tb.priorCovariance(setting.shared, { independent: true });
    const joint = tb.operatorMatrix(setting.kappa, setting.stride, true);
    const sep = tb.operatorMatrix(setting.kappa, setting.stride, false);
    const cells = {
      none: posterior(ind.C, ind.dim, sep, setting.noise),
      O: posterior(ind.C, ind.dim, joint, setting.noise),
      P: posterior(dep.C, dep.dim, sep, setting.noise),
      OP: posterior(dep.C, dep.dim, joint, setting.noise),
    };
    const out = { cells: {}, shares: {} };
    ['none', 'O', 'P', 'OP'].forEach(function (k) {
      const C = cells[k];
      const rho = pointwiseCorrelation(C, dep.dim);
      let s = 0, u = 0;
      for (let x = 0; x < rho.length; x++) { s += rho[x]; u += Math.abs(rho[x]); }
      out.cells[k] = { signed: s / rho.length, unsigned: u / rho.length, rho: rho,
                       mi: withMI === false ? NaN : mutualInformation(C, dep.dim) };
    });
    ['signed', 'unsigned', 'mi'].forEach(function (f) {
      out.shares[f] = shapley({ none: out.cells.none[f], O: out.cells.O[f], P: out.cells.P[f], OP: out.cells.OP[f] });
    });
    return out;
  }

  const api = { posterior: posterior, pointwiseCorrelation: pointwiseCorrelation, mutualInformation: mutualInformation,
                functionals: functionals, shapley: shapley, attribute: attribute };
  root.AE = root.AE || {};
  root.AE.attribution = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
