/*
 * A few lines of SVG building, enough for the bar and line charts on the page
 * (no chart library). Colours come from the theme tokens through CSS classes.
 */
(function (root) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, parent) {
    const node = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(node);
    return node;
  }

  function text(parent, x, y, content, attrs) {
    const node = el('text', Object.assign({ x: x, y: y }, attrs || {}), parent);
    node.textContent = content;
    return node;
  }

  function chart(container, width, height, label) {
    container.textContent = '';
    return el('svg', { viewBox: '0 0 ' + width + ' ' + height, class: 'chart', role: 'img', 'aria-label': label }, container);
  }

  // Linear scale [d0, d1] -> [r0, r1]
  function scale(d0, d1, r0, r1) {
    return function (v) { return r0 + (v - d0) / (d1 - d0) * (r1 - r0); };
  }

  root.AE = root.AE || {};
  root.AE.svg = { el: el, text: text, chart: chart, scale: scale };
})(globalThis);
