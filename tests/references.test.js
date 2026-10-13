'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

for (const file of ['index.html', 'index.pt.html']) {
  const html = read(file);
  const bibliography = html.split('<!-- references:start -->')[1].split('<!-- references:end -->')[0];
  const listed = Array.from(bibliography.matchAll(/<li id="([\w-]+)">/g), (m) => m[1]);
  const cited = new Set(Array.from(html.matchAll(/data-cite="([\w-]+)"/g), (m) => m[1]));

  test(`${file}: every citation resolves to a bibliography entry, and every entry is cited`, () => {
    assert.ok(cited.size > 0);
    assert.deepEqual([...cited].sort(), [...listed].sort());
  });

  test(`${file}: citation links point at their own entry`, () => {
    for (const m of html.matchAll(/<a class="cite" href="#([\w-]+)" data-cite="([\w-]+)">/g)) assert.equal(m[1], m[2]);
  });
}

test('citation labels are the same in both languages (generated from the bibliography)', () => {
  const labels = (html) => Array.from(html.matchAll(/data-cite="[\w-]+">([^<]*)</g), (m) => m[1]);
  assert.deepEqual(labels(read('index.pt.html')), labels(read('index.html')));
});
