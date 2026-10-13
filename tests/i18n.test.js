'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const EN = read('index.html');
const PT = read('index.pt.html');

function all(html, pattern) {
  return Array.from(html.matchAll(pattern), (m) => m[1]);
}

// The two language versions must have the same structure: only text differs.
const STRUCTURE = {
  'element ids': / id="([^"]+)"/g,
  'data-role hooks': /data-role="([^"]+)"/g,
  'form control values': /<(?:option|input)[^>]* value="([^"]*)"/g,
  'presets': /data-preset="([^"]+)"/g,
  'scripts': /<script src="([^"]+)"/g,
  'stylesheets': /<link rel="stylesheet" href="([^"]+)"/g,
  'citations': /data-cite="([^"]+)"/g,
  'data-fill hooks': /data-fill="([^"]+)"/g,
  'in-page links': /href="(#[^"]*)"/g,
};

for (const [name, pattern] of Object.entries(STRUCTURE)) {
  test(`index.html and index.pt.html have the same ${name}`, () => {
    assert.deepEqual(all(PT, pattern), all(EN, pattern));
  });
}

test('each page declares its language and marks itself in the switch', () => {
  assert.match(EN, /<html lang="en">/);
  assert.match(PT, /<html lang="pt-BR">/);
  assert.match(EN, /href="index.html" hreflang="en" lang="en" aria-current="true"/);
  assert.match(PT, /href="index.pt.html" hreflang="pt-BR" lang="pt-BR" aria-current="true"/);
});

// Load i18n.js with a minimal document stub to read its string tables.
function strings() {
  globalThis.document = { documentElement: { lang: 'en' }, querySelectorAll: () => [] };
  delete require.cache[require.resolve('../assets/js/i18n.js')];
  require('../assets/js/i18n.js');
  return globalThis.AE.i18n.STRINGS;
}

test('runtime strings exist in both languages', () => {
  const S = strings();
  assert.deepEqual(Object.keys(S.pt).sort(), Object.keys(S.en).sort());
});

test('every t() key used by the demos is defined, with the same placeholders in both languages', () => {
  const S = strings();
  const dir = path.join(__dirname, '..', 'assets/js');
  const used = new Set();
  for (const file of fs.readdirSync(dir).filter((f) => f !== 'i18n.js')) {
    for (const m of fs.readFileSync(path.join(dir, file), 'utf8').matchAll(/\bt\('([\w.]+)'\s*[,)]/g)) used.add(m[1]);
  }
  assert.ok(used.size > 20);
  // Keys built at runtime: the outcomes the frozen analysis can write.
  ['REFUTED', 'SUPPORTED', 'INDETERMINATE'].forEach((o) => used.add('res.outcome.' + o));
  for (const key of used) assert.ok(key in S.en, `missing string: ${key}`);
  for (const key of Object.keys(S.en)) {
    const holes = (s) => Array.from(s.matchAll(/\{(\w+)\}/g), (m) => m[1]).sort();
    assert.deepEqual(holes(S.pt[key]), holes(S.en[key]), key);
  }
});
