/*
 * Small dense linear algebra on row-major Float64Arrays, enough for the exact
 * posteriors of the testbed: products, a Cholesky factorization, triangular
 * solves and log-determinants. No dependencies; runs in the browser and in Node.
 */
(function (root) {
  'use strict';

  // A (n x k) times B (k x m) -> (n x m)
  function matmul(A, B, n, k, m) {
    const C = new Float64Array(n * m);
    for (let i = 0; i < n; i++) {
      const ci = i * m;
      for (let p = 0; p < k; p++) {
        const a = A[i * k + p];
        if (a === 0) continue;
        const bp = p * m;
        for (let j = 0; j < m; j++) C[ci + j] += a * B[bp + j];
      }
    }
    return C;
  }

  // A (n x k) times B^T, with B (m x k) -> (n x m)
  function matmulT(A, B, n, k, m) {
    const C = new Float64Array(n * m);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        let s = 0;
        for (let p = 0; p < k; p++) s += A[i * k + p] * B[j * k + p];
        C[i * m + j] = s;
      }
    }
    return C;
  }

  // In-place lower Cholesky of an SPD (n x n) matrix; returns L (upper part zeroed).
  function cholesky(A, n) {
    const L = new Float64Array(A);
    for (let j = 0; j < n; j++) {
      let d = L[j * n + j];
      for (let p = 0; p < j; p++) d -= L[j * n + p] * L[j * n + p];
      if (!(d > 0)) throw new Error('cholesky: matrix is not positive definite (pivot ' + j + ')');
      const ljj = Math.sqrt(d);
      L[j * n + j] = ljj;
      for (let i = j + 1; i < n; i++) {
        let s = L[i * n + j];
        for (let p = 0; p < j; p++) s -= L[i * n + p] * L[j * n + p];
        L[i * n + j] = s / ljj;
      }
      for (let p = j + 1; p < n; p++) L[j * n + p] = 0;
    }
    return L;
  }

  // Solve (L L^T) X = B for X, B (n x m), L from cholesky().
  function choleskySolve(L, B, n, m) {
    const X = new Float64Array(B);
    for (let c = 0; c < m; c++) {
      for (let i = 0; i < n; i++) {                       // forward: L y = b
        let s = X[i * m + c];
        for (let p = 0; p < i; p++) s -= L[i * n + p] * X[p * m + c];
        X[i * m + c] = s / L[i * n + i];
      }
      for (let i = n - 1; i >= 0; i--) {                  // backward: L^T x = y
        let s = X[i * m + c];
        for (let p = i + 1; p < n; p++) s -= L[p * n + i] * X[p * m + c];
        X[i * m + c] = s / L[i * n + i];
      }
    }
    return X;
  }

  function logdetFromCholesky(L, n) {
    let s = 0;
    for (let i = 0; i < n; i++) s += Math.log(L[i * n + i]);
    return 2 * s;
  }

  // Square sub-block rows/cols [r0, r0 + size) of an (n x n) matrix.
  function block(A, n, r0, c0, size) {
    const B = new Float64Array(size * size);
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) B[i * size + j] = A[(r0 + i) * n + (c0 + j)];
    }
    return B;
  }

  const api = { matmul: matmul, matmulT: matmulT, cholesky: cholesky, choleskySolve: choleskySolve,
                logdetFromCholesky: logdetFromCholesky, block: block };
  root.AE = root.AE || {};
  root.AE.linalg = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
