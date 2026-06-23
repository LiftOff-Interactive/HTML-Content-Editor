# Stage 8 — No-JavaScript / SharePoint-Safe Export

_Started 2026-06-23._

## Goal

Add a second export path — **"Export for SharePoint"** — that produces a self-contained HTML file in which **every widget is interactive using only HTML + CSS, with zero JavaScript**. This deploys cleanly into SharePoint's Embed web part, which strips `<script>`, `on*` handlers, and `javascript:` URLs (the reason the standard `Export HTML` widgets break there).

The existing `Export HTML` (JS) path is untouched.

## Why

The user authors in the editor and deploys to SharePoint via the **Embed web part** (renders a self-contained file in an iframe — so `<style>` blocks, `:has()`, `:checked`, `<details>`, scroll-snap, `<details name>` are all available). Modern Edge/Chromium is the runtime, so modern CSS is safe to rely on.

## Architecture

- **Per-widget method:** each interactive blot implements `renderExportNoJS(container, data, ctx)`. The export engine (`src/export.js` → `deltaToHtml`) calls it when `opts.noJs` is set, falling back to `renderExport` when a widget has no no-JS variant.
- **`ctx.uid` is the only identity source.** In export the blot is a bare `Object.create(Blot.prototype)`, so `this._uid` (set in `attach()`) is undefined. Every element `id`, radio `name`, and CSS selector is built from `ctx.uid` (e.g. `wx3`), guaranteeing uniqueness across all instances in one file.
- **Scoped styles:** the widget root gets `id=ctx.uid`; one `<style>` block per instance; every selector prefixed with `#<uid>` so instances never cross-style.
- **Accessibility:** hidden form inputs that drive state use clip/opacity hiding (never `display:none`) so keyboard focus + arrow/Space/Enter still work. `:target` is avoided (hijacks page scroll) except for carousel in-scroller anchors.
- **New UI:** `#export-sharepoint-btn` in the header → `HCEExport.exportHtml({ noJs: true })`; downloads `<title>-sharepoint.html`.

## Per-widget conversion

| Widget | No-JS technique | Status |
|---|---|---|
| Callout | already static — fallback to `renderExport` | no work |
| Quote | already static | no work |
| Timeline | already static | no work |
| Image (resizable-image) | already static (special-cased in export.js) | no work |
| Tabs | radio + `:checked` + `<label>` (reference impl) | ✅ done |
| Accordion | `<details>`; single-open uses `<details name>` | ✅ done |
| Click & Reveal | `<details>`/`<summary>` | ✅ done |
| Flip Cards | checkbox + `:checked` (sticky click-flip) | ✅ done |
| Hotspot | radio + `:checked` + close-label dismiss | ✅ done |
| Carousel | scroll-snap + anchor nav | ✅ done |
| Knowledge Check | radio + `:checked` + `:has()` submit-gate | ✅ done |

## Accepted tradeoffs (signed off by user)

- **Knowledge Check** keeps live grading, but the correct answer is encoded in markup (a `data-correct` hook) → visible in page source. The JS version only base64-obfuscated it, so this is not a real downgrade. "Submit" lock is cosmetic; Retry is omitted in the no-JS variant.
- **Carousel** loses autoplay and infinite looping (becomes bounded); gains native touch-swipe. Dot active-state via `:has()` on modern browsers.

## Definition of Done

- [x] All 7 interactive widgets have `renderExportNoJS`; 4 static widgets fall back correctly.
- [x] No-JS export output contains zero `<script>`, zero `on*=` handlers, zero `javascript:`. _(verified via `_nojs_selftest.html`)_
- [x] Multiple instances of the same widget on one page work independently (unique `ctx.uid` scoping). _(two tabs + two accordions, no cross-talk)_
- [x] Visual output matches the JS export. _(screenshots: hotspot tooltip, KC green/red grading)_
- [x] Interactions verified in a real browser: tabs switch, accordion opens, flip rotates, hotspot tooltip/dismiss, KC grade+feedback+lock, carousel scroll-snap + active dot.
- [ ] **Human verification pending:** click the real "Export for SharePoint" button → drop the file into an actual SharePoint Embed web part → confirm it renders & interacts. Then commit Stage 8.

## Implementation notes / gotchas

- **`!important` on state overrides:** widgets set base `border`/`background`/`display` as **inline** `style=""`. A scoped `<style>` rule cannot override an inline declaration without `!important`. Knowledge-check grading colors + feedback reveal, hotspot tooltip reveal, and carousel dot highlight all needed it. (Tabs/accordion/click-reveal/flip were unaffected — their state targets had no conflicting inline value.)
- **Transition false-negatives when testing:** options/cards have `transition:…`, so reading `getComputedStyle` immediately after a simulated click returns the *pre-transition* value. Re-read after the transition settles.
- **QA harness:** `_nojs_selftest.html` at the project root builds a delta with one of every widget, runs the no-JS export, renders it in an iframe, and shows a PASS/FAIL banner asserting the body is script-free. Serve over localhost (`python -m http.server`) and open it. Re-run after any widget change.
