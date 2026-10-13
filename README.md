# Attribution Explainer

**Live: https://barbieriht.github.io/attribution-explainer/** · [Português](https://barbieriht.github.io/attribution-explainer/index.pt.html)

An interactive, in-browser explainer of Study I of the author's PhD: when
several physical fields are inferred together, where does the dependence
between them in the posterior come from — the measurement operator or the
prior? The exact posteriors behind the demos are computed live in the
browser; there is no backend, no build step and no network request at
runtime. Built as part of ongoing PhD research in AI at the University of
São Paulo (USP). English: `index.html`; Portuguese: `index.pt.html`.

## What is inside

- **Two linked fields.** Draw pairs of fields from the testbed's prior and
  watch them tie together as the shared fraction `s` grows.
- **Three suspects.** Operator, prior and network; switching each one off;
  the Shapley value that splits the dependence fairly.
- **The exact case.** The study's linear-Gaussian testbed (two 16 × 16 fields,
  blur-and-subsample operator with coupling κ). Four exact posteriors per
  setting, their pointwise-correlation maps and the operator and prior shares,
  for the signed correlation, its unsigned version and the mutual information.
- **Checking the instrument.** Repeated estimates from samples against the
  exact value, for an exact sampler and for one that shrinks the cross-field
  covariance: more samples do not remove a bias.
- **The test of H1, the result, and why it failed.** The pre-registered
  confirmatory test, its magnitude errors, and the follow-up F1 training
  curves, drawn from the study's registered results.

## How the page is organized

A single page with collapsible sections; each demo starts when its section is
opened. The header has an EN/PT switch that keeps the current section and a
light/dark theme toggle. The two languages are two files kept side by side:
edit the prose in both and keep their structure identical (tests compare ids,
controls, scripts, citations and data hooks). Strings produced by the demos at
runtime live in `assets/js/i18n.js`.

## Run locally

Open `index.html` in a browser; nothing needs to be installed. Or serve the
folder:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Tests

```sh
node --test
```

Node 18+ and no dependencies. The tests check the browser's exact attribution
against fixtures produced by the thesis code (`fwi_common`) to 1e-8, the
sampler's random draws, the results data, citation resolution, and the parity
of the two language versions.

## Content pipeline

No number and no reference on the page is typed by hand.

```sh
# Fixtures for the attribution tests, from the thesis package fwi_common
python3 scripts/make_fixture.py /path/to/FWI > tests/fixtures/attribution.json

# Study I's registered results -> assets/data/study1-results.{json,js}
python3 scripts/import_results.py /path/to/FWI

# Citation labels and the References section, from the thesis bibliography
python3 scripts/build_page.py /path/to/FWI/overleaf-projects/proposal/references.bib
```

- `import_results.py` reads the confirmatory analysis outputs, the prior-level
  deficit and the F1 reading from the thesis repository's `results/`. Numbers in
  the prose are `<span data-fill="…">` hooks that `assets/js/results.js` fills
  from that data.
- `build_page.py` copies bibliographic fields only. An entry whose bib notes
  mark it `% VERIFY` or `SECONDARY` is flagged with a dagger on the page.

## Developed with Claude Code

This repository was developed with the assistance of
[Claude Code](https://claude.com/claude-code), Anthropic's AI coding agent,
under the author's direction and review. Commits made with its help carry a
`Co-Authored-By: Claude` trailer.

## Credits

- The theme, layout, collapsible sections and language/theme switches follow
  the author's [FWI Explainer](https://github.com/barbieriht/fwi-explainer).
- No figure, table or text is reproduced from any paper; every visual is
  computed from the equations or from the author's own experiments.

## Third-party code

Vendored in `assets/vendor/` with its license:

- [KaTeX](https://katex.org) v0.16.47 — MIT

## License

MIT — see [LICENSE](LICENSE).
