# Export Baselines — protected contract reference (v3 kickoff §3)

**Current baseline: v3.1**, captured **2026-07-03** from `main` after the explicitly-scoped
"export align/link/strike" fix (the only intentional change ever made to this contract —
see [Baseline history](#baseline-history)). Superseded Stage 8 baseline archived in
`archive-stage8/` for reference; do not diff against it going forward.

## What these files are

Both files are `window.HCEExport.buildExportHtml(delta, 'No-JS Self Test', …)` output for
the exact delta `_nojs_selftest.html` builds: one of every widget with `defaultData`,
plus a second `tabs` and a second `accordion` (multi-instance scoping check).

| File | Mode | SHA-256 |
|------|------|---------|
| `stage9.1-baseline-nojs.html` | `{ noJs: true }` (Export for SharePoint) | `8792330fed7689725be6b73595dc7a06b6c68129fbd34f08965cedbc8310cb2f` |
| `stage9.1-baseline-js.html`   | default (Export HTML)                    | `a0948eeeb877a8b2307aade41ace9090d745f0836ad2e8fe38edc48eae7338e3` |

The **editor-page** no-JS hash (see environment caveat below) for the same delta is
`45aed5939bbe98e976d9545a0de156f750cffa0d874f79391135c9df4d2cf740` — used by suites that
mount `index.html` (`_widgets2_tests.html`, `_styling_tests.html`) instead of the bare
`_nojs_selftest.html` page.

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
different bytes on the two pages. **The primary baseline hashes above are only
reproducible from `_nojs_selftest.html`** — always run the absolute hash check there.
The editor-page hash is a second, separately-tracked constant (see above) for suites
that need to mount the full app; in-editor checks that can't use either fixed hash
should assert before/after invariance instead.

### JS-mode caveat — pre-existing non-determinism (found 2026-07-02, F1 check)

The JS-mode export was **never byte-stable**, so its hash will not reproduce. Two
Stage-8-era sources, both baked into the baseline file:

- Tabs and accordion generate a **random id per render** (`data-tabs-id="te6fua5"`,
  `data-accordion-id="ae3man1"` — random base36), referenced throughout each widget's
  scoped CSS/JS.
- Carousel and knowledge-check embed a **session-scoped instance counter**
  (`data-carousel="car1"`, `data-kc="kc1"` — `'car' + ++_instanceCount`), which
  advances with every export render in the same page session.

To diff JS-mode output against `stage9.1-baseline-js.html`, normalize both sides first:
map each `data-*-id="X"` id to `@ID<n>@` in first-appearance order (replacing every
occurrence of the id string), and replace `\b(car|aw|tw|fc|cr|hs|kc)\d+\b` with a
constant. After that normalization the outputs must be identical.

## Baseline history

### v3.1 — 2026-07-03 (current) — export align/link/strike fix

**Explicitly scoped and human-approved change.** Both export modes had always silently
dropped three text formats the editor toolbar/paste path can produce: paragraph/heading
**alignment** (a toolbar feature), **links**, and **strikethrough**. The F2 code view
(which round-trips these losslessly) made the gap externally visible — a document could
look correct in the code view yet lose formatting on export.

Fix, in `src/export.js`:
- `applyInlineFormats` gained `<s>` for `strike` and `<a href>` for `link`, gated by a
  `safeLinkHref` allowlist (mirrors `delta-html.js`'s parser-side check: https/mailto/
  tel/#/relative paths and Quill's own `about:blank` sanitize output; `javascript:` and
  protocol-relative `//` are refused — an unsafe link degrades to plain text, it is
  never dropped from the document, only its `href` is omitted).
- `flushLine` gained an `alignAttr` helper emitting `style="text-align:…"` on
  `p`/`h1`–`h3`/`li` for `center`/`right`/`justify` deltas.
- `buildExportCSS` gained base rules `s { text-decoration: line-through; }` and
  `a { color: <primary>; text-decoration: underline; … }` (stacks correctly under the
  F4 opt-in `--opt-link-color` override, which is appended after and wins on tie).

This is a genuine, intentional change to exported byte output for any document using
these formats — hence a new baseline rather than a byte-identical guarantee. Verified
before promoting: `_nojs_tests.html` stayed **27/27** (interaction suite is
format-agnostic — no regression), the fix was manually exercised for align/link/strike
in both export modes including a `javascript:` link neutralization check, and the new
hashes were captured via the same browser→localhost-receiver method as v1, with
on-disk SHA-256 verified equal to the in-browser digest.

**Superseded:** `archive-stage8/stage8-baseline-{nojs,js}.html` (SHA-256 no-JS:
`7c0a83639c07c71200b0a14f7e9707a0cfc8cdb78fb828412ec5a53fe7bb66fd`) — the original Stage
8 capture, valid from 2026-06-23 through the F1–F7 v3 rebuild (2026-07-02/03), during
which it correctly caught zero drift across five feature commits. Kept for history only;
do not diff new work against it.

### v1 — 2026-07-02 — Stage 8 (original)

Captured from commit `d9e0b96`, before any v3 rebuild work began. See archived file
header/git history for the original capture notes.
