# Stage 8 Export Baselines — protected contract reference (v3 kickoff §3)

Captured **2026-07-02** from commit `d9e0b96` (`main`, clean tree apart from untracked
`fixtures/` and `v3_kickoff_prompt.md`), before any v3 work began.

## What these files are

Both files are `window.HCEExport.buildExportHtml(delta, 'No-JS Self Test', …)` output for
the exact delta `_nojs_selftest.html` builds: one of every widget with `defaultData`,
plus a second `tabs` and a second `accordion` (multi-instance scoping check).

| File | Mode | SHA-256 |
|------|------|---------|
| `stage8-baseline-nojs.html` | `{ noJs: true }` (Export for SharePoint) | `7c0a83639c07c71200b0a14f7e9707a0cfc8cdb78fb828412ec5a53fe7bb66fd` |
| `stage8-baseline-js.html`   | default (Export HTML)                    | `2cd44c5396d755ba79d4766ea666018b6fb75becb683046bd49c9e5bae5c55c1` |

Bytes were POSTed directly from the live browser session to a localhost receiver
(no transcription), and the on-disk SHA-256 was verified equal to the in-browser
SHA-256 of the generated string. The no-JS string was also verified `===` to the
`window.__noJsHtml` the untouched `_nojs_selftest.html` harness produced.

Test state at capture time: `_nojs_tests.html` **27 / 27 passed**;
`_nojs_selftest.html` **PASS — zero JavaScript** (no `<script>` in body, no `on*=`,
no `javascript:`).

## How to re-check for drift

1. Serve the project root (`python -m http.server 8137 --directory .`).
2. Open `_nojs_selftest.html` **fresh (cache-busted)**, read `window.__noJsHtml`,
   hash it (SHA-256, UTF-8). The no-JS export is fully deterministic — the hash must
   match the table above byte-for-byte.
3. Rebuild the same delta and call `buildExportHtml(delta, 'No-JS Self Test')` for the
   JS-mode output.
4. Any no-JS hash change without an explicitly-scoped, explicitly-reviewed task
   authorizing it is a regression of the protected contract. Theme defaults, widget
   `renderExport`/`renderExportNoJS`, and `export.js` shared paths all feed these bytes.

### Environment caveat — exports are page-sensitive (found 2026-07-02, F2 check)

`buildExportHtml` reads theme variables from the **hosting page** via
`getComputedStyle` (e.g. timeline reads `--font-family-ui`). The editor page
(`index.html`, with `main.css` loaded) resolves some of these differently than the bare
`_nojs_selftest.html` page (only `theme-defaults.css`), so the same delta exports
different bytes on the two pages. **The baseline hashes above are only reproducible
from `_nojs_selftest.html`** — always run the absolute hash check there. In-editor
checks should assert before/after invariance instead of the absolute hash.

### JS-mode caveat — pre-existing non-determinism (found 2026-07-02, F1 check)

The JS-mode export was **never byte-stable**, so its hash will not reproduce. Two
Stage-8-era sources, both baked into the baseline file:

- Tabs and accordion generate a **random id per render** (`data-tabs-id="te6fua5"`,
  `data-accordion-id="ae3man1"` — random base36), referenced throughout each widget's
  scoped CSS/JS.
- Carousel and knowledge-check embed a **session-scoped instance counter**
  (`data-carousel="car1"`, `data-kc="kc1"` — `'car' + ++_instanceCount`), which
  advances with every export render in the same page session.

To diff JS-mode output against `stage8-baseline-js.html`, normalize both sides first:
map each `data-*-id="X"` id to `@ID<n>@` in first-appearance order (replacing every
occurrence of the id string), and replace `\b(car|aw|tw|fc|cr|hs|kc)\d+\b` with a
constant. After that normalization the outputs must be identical. Verified identical
for the F1 modal fix on 2026-07-02.
