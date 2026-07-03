# Handoff — HTML Content Editor
_Last updated: 2026-07-03 · Current stage: **Stage 9 — v3 rebuild COMPLETE (F1–F7 all built, self-tested, independently reviewed, committed on `stage-9-v3-rebuild`). Not yet merged to main or pushed.**_

## Goals
~~Get the project to a public v1 release on GitHub.~~ **Done.** v1.0.0 is live.
~~Stage 7 post-v1 features.~~ **Done.** v2.0.0 shipped — all three Stage 7 features complete.

Live URLs:
- GitHub Pages: https://frankyface.github.io/HTML-Content-Editor/
- v1.0.0 release: https://github.com/Frankyface/HTML-Content-Editor/releases/tag/v1.0.0
- v2.0.0 release: https://github.com/Frankyface/HTML-Content-Editor/releases/tag/v2.0.0

## Current State
All stages (1–8) complete. v2.0.0 + Stage 8 shipped; `main` = `origin/main` = `d9e0b96`.

**Stage 9 — v3 rebuild — COMPLETE on branch `stage-9-v3-rebuild` (5 commits, 0ed0ae0→f3feec4).**
Governing brief: `v3_kickoff_prompt.md` (§3 protected export contract). Full build order
and per-feature records in `staging/stage-9-v3-rebuild/overview.md`. Per-feature HUMAN
checkpoints were removed by the human after F2 ("implement all without stopping"); the
rest of the discipline (self-tests, independent agent review, §3 baseline checks,
per-feature commits) was kept. The only thing still gated on the human is any change to
the §3 contract itself (the export align/link/strike gap — parked, see follow-ups).

- **Baselines** (`docs/baselines/`): byte-exact Stage 8 references + hashes, JS-mode
  non-determinism caveat, and the export page-sensitivity caveat (bare-page hash
  7c0a8363… only reproducible from `_nojs_selftest.html`; editor-page hash 91fc4124…).
- **F1 (modal Save fix) ✅** — accordion body pattern in the 4 broken modals + header/
  footer flex-shrink:0; hotspot rework (scrollable imgArea + imgWrap marker frame).
  `_modal_tests.html` 30/30 (now incl. raw-html + 4 new widgets).
- **F2 (code view) ✅** — `src/delta-html.js` (reversible delta⇄HTML, inert-template
  allowlist parser = sanitizer, verbatim whitespace, refuse-don't-drop) + `code-view.js`.
  `_codeview_tests.html` 27/27.
- **F3 (raw HTML import) ✅** — `src/html-import.js` (element-level sanitizer denylist for
  script/iframe/object/embed/meta/…, control-char-safe scheme vetting, @import strip;
  lenient walker mapping known nodes + wrapping unknowns) + `raw-html.js` blot. Load HTML
  auto-imports foreign files with a kept/dropped report. `_import_tests.html` 15/15
  (incl. the 4 real fixtures 7KB–5.5MB).
- **F5 (naming + clear) ✅** — `doc-title.js` + `doc-state.js`: header title input
  (H1 fallback), New button clears content+title+styles+theme behind a confirm.
- **F6 (5 new widgets) ✅** — toggle-reveal, popover (native), editable-box, progress-
  meter, + scroll-snap option on carousel. All CSS-only, JS-free both export modes.
  `_widgets2_tests.html` 22/22.
- **F4 (document styling) ✅** — 4 pro presets + 4 opt-in controls, conditional export
  emission so default stays §3 byte-identical. `_styling_tests.html` 13/13.
- **F7 (course-mode plan) ✅** — `staging/stage-10-course-mode-plan.md`, no code.
- **Save format v3**: adds `title` + `documentStyles`; v1→v2→v3 migration chain.
- **Shared `_test_harness.js`** extracted for the new suites.
- **Every suite green + frozen no-JS baseline byte-identical after all features.**

**REMAINING FOR THE HUMAN (needs an explicit decision — touches §3):**
Both export modes silently drop alignment/link/strike formatting that the code view now
round-trips. Fixing changes protected export output, so it needs its own scoped task with
baseline re-capture. Full follow-up list in the stage overview. Also: not merged to
`main` or pushed to origin yet — awaiting your go.

**Stage 8 — No-JS / SharePoint export — ✅ complete, committed as `d9e0b96`.**
The user deploys exports into SharePoint via the **Embed web part**, which strips `<script>`, `on*` handlers, and `javascript:` URLs — so the standard `Export HTML` widgets break there. Stage 8 adds a second **"Export for SharePoint"** button (`#export-sharepoint-btn`) that renders every widget JavaScript-free.
- Engine: `src/export.js` `deltaToHtml(delta, opts)` / `buildExportHtml(delta, title, opts)` take `{ noJs }`; in no-JS mode each widget embed is rendered via `renderExportNoJS(container, data, ctx)` (fallback to `renderExport`). `ctx.uid` (`wx<n>`, per-export counter) is the only unique-id source — export instances are bare `Object.create(prototype)`, so `this._uid` is undefined.
- 7 interactive blots got `renderExportNoJS`: tabs (radio+`:checked`), accordion (native `<details>`, single-open via `<details name>`), flip-cards (checkbox+`:checked`+`:has()`), click-reveal (`<details>`), carousel (scroll-snap + anchor nav), hotspot (radio+`:checked`+`:has()` + close-label), knowledge-check (radio+`:checked`+`:has()` submit-gate). The 4 static widgets (callout, quote, timeline, resizable-image) fall back to `renderExport` (already JS-free).
- **Gotcha fixed:** state-change CSS rules in the scoped `<style>` lose to inline base styles (inline beats a stylesheet selector). KC grading colors/feedback-reveal and hotspot tooltip-reveal needed `!important`; carousel dot highlight too.
- Verified in a real browser via `_nojs_selftest.html` (one of every widget, exported no-JS, rendered in an iframe): zero `<script>`/`on*`/`javascript:`; tabs/accordion/flip/hotspot/KC/carousel all interact correctly; multi-instance scoping holds (two tabs + two accordions, no cross-talk). Live editor boots clean with the new button.
- **Remaining:** human clicks the real "Export for SharePoint" button in the editor, drops the file into an actual SharePoint Embed web part, confirms it renders/interacts. Then commit Stage 8.

**Stage 7 Feature 1 — Image Control — ✅ Complete and human-verified.**
**Stage 7 Feature 2 — Rich Text in Widgets — ✅ Complete and human-verified.**
**Stage 7 Feature 3 — HTML Round-Trip Save/Load — ✅ Complete and human-verified.**

What's built (all stages):
- `src/registry.js` — `register(BlotClass)`, `getAll()`, `get(blotName)`; calls `Quill.register` internally
- `src/blots/base.js` — `BaseWidgetBlot` extends `BlockEmbed`; data storage, `attach()` lifecycle, `updateData()`, `widget-updated` event, try/catch `renderEditor` with `.widget-error` fallback. Click-to-edit now uses delegated listener in `editor.js` (not per-blot in `attach()`).
- `src/blots/callout.js` — 4 types, emoji icons, ARIA roles, rich text body ✓
- `src/blots/tabs.js` — tab switching, two-column edit modal, rich text per tab ✓
- `src/blots/accordion.js` — `<details>`/`<summary>`, CSS grid animation, `allowMultiple`, rich text per panel ✓
- `src/blots/quote.js` — 3 styles, `<blockquote>`/`<cite>` semantics, rich text quote ✓
- `src/blots/timeline.js` — vertical timeline, icon field, rich text description ✓
- `src/blots/flip-cards.js` — 3D CSS flip, ImageUploadField, rich text front/back body ✓
- `src/blots/click-reveal.js` — 3 trigger styles, slide-down animation, `aria-expanded`, rich text content ✓
- `src/blots/carousel.js` — prev/next, dots, autoplay, ImageUploadField per slide, rich text caption ✓
- `src/blots/hotspot.js` — percentage-based pins, pulsing ring, rich text tooltip body ✓
- `src/blots/knowledge-check.js` — multiple-choice / true-false, rich text question/feedback/hint, base64-obfuscated answer ✓
- `src/blots/image.js` — `ResizableImageBlot` (drag-to-resize, fires `widget-updated` on mouseup) ✓
- `src/ui/image-upload-field.js` — `ImageUploadField` (file picker + URL + preview + resize + warning badge) ✓
- `src/ui/rich-text-field.js` — `RichTextField` (mini Quill instance, `getHtml()`, `focus()`, `destroy()`) ✓
- `src/editor.js` — Quill init, delegated widget click handler, `widget-updated` sync, drag-drop images, tab title from H1
- `src/ui/modal.js` — `WidgetModal.open()` promise-based modal
- `src/slash-command.js` — `/` palette, substring filter, keyboard nav
- `src/toolbar.js` — `ToolbarDropdown` with grid-plus icon
- `src/export.js` — `deltaToHtml`, `buildExportCSS`, `buildExportHtml` (named export), loading state, per-widget error wrapping
- `src/html-roundtrip.js` — `saveAsHtml()` (export + embed JSON), `loadFromHtml()` (DOMParser extraction)
- `src/save-load.js` — Save/Load dropdowns (JSON + HTML), `applyPayload()` shared load path, v1→v2 migration, "Saved ✓" confirmation
- `src/styles/main.css` — app shell + all widget CSS + dropdown styles + modal max-height constraint

## Things I've Changed
- 2026-07-03: Stage 9 F3+F5+F6 (commit 8fc5532) then F4+F7 (commit f3feec4).
  New files: `src/html-import.js`, `src/blots/raw-html.js`, `src/doc-state.js`,
  `src/doc-title.js`, `src/blots/{toggle-reveal,popover,editable-box,progress-meter}.js`,
  `_test_harness.js`, `_import_tests.html`, `_widgets2_tests.html`, `_styling_tests.html`,
  `staging/stage-10-course-mode-plan.md`, `fixtures/*` (4 import fixtures committed).
  Edited: save-load (v3 payload + import fallback + report), html-roundtrip (v3),
  export.js (conditional imported-styles block + F4 opt-in append), theme.js (presets +
  opt controls + deserialize merge), editor.js (title preference), carousel.js (navStyle),
  modal.js (rows/mono/width), index.html, main.css, editor.css. Gotchas: never emit a
  literal NUL to source (git binary) — use the ` ` escape; DOMParser hoists a leading
  `<script>` island to head — parse in an inert `<template>`; export is page-sensitive
  (baseline hash only reproducible from `_nojs_selftest.html`); escape every `</` when
  re-emitting captured CSS or a `</style>`/`</head>` breaks the file/roundtrip; import
  needs ELEMENT-level sanitization (denylist iframe/object/embed/meta), not just
  attribute stripping.
- 2026-07-02 (later): Stage 9 F2 — code view. New files: `src/delta-html.js`,
  `src/code-view.js`, `_codeview_tests.html`. Edited: `index.html` (2 script tags),
  `src/styles/main.css` (#code-view styles + `--font-family-mono` + danger tokens),
  `docs/baselines/README.md` (page-sensitivity caveat), stage-9 overview (F2 record +
  follow-ups 6–10). Tried/Failed: never put literal NUL chars in source (git treats the
  file as binary) — the parser's newline placeholder uses the `\u0000` ESCAPE; a
  leading `<script>` island gets hoisted to `<head>` by DOMParser — parse with an inert
  `<template>` instead.
- 2026-07-02: Stage 9 kickoff + F1. New: `docs/baselines/` (protected-contract export
  references + README), `_modal_tests.html` (modal geometry suite),
  `staging/stage-9-v3-rebuild/overview.md` (confirmed roadmap + F1 record + named
  follow-ups). Edited: modal body pattern in tabs/click-reveal/carousel/hotspot,
  hotspot modal scroll + pin coordinate frame (imgWrap), guard comments at all 8 modal
  body sites, `.widget-modal-header/-footer { flex-shrink:0 }` in main.css. Gotchas
  learned: browser memory-cache served stale blot JS to the test iframe (harness now
  cache-busts itself); rAF never fires in hidden tabs (never await it bare); the JS-mode
  export was never byte-stable (see baselines README).
- 2026-06-23: Stage 8 — No-JS / SharePoint export. New files: `staging/stage-8-nojs-export/overview.md`, `_nojs_selftest.html` (root-level browser QA harness — open over localhost, exports one of every widget no-JS into an iframe with PASS/FAIL banner). Edited `src/export.js` (no-JS mode + ctx + `#export-sharepoint-btn` wiring + `exportHtmlNoJs`), `index.html` (new button), and added `renderExportNoJS` to tabs/accordion/flip-cards/click-reveal/carousel/hotspot/knowledge-check. Per-widget conversions were drafted by a parallel agent workflow against the Tabs reference, then fixed (the `!important` inline-override bug) and browser-verified.
- 2026-06-09: Stage 7 Features 2 & 3 complete + bug fixes. Shipped as v2.0.0.
  - Feature 2: `src/ui/rich-text-field.js` (new), rich text in all 11 widgets, v1→v2 migration in save-load.js.
  - Feature 3: `src/html-roundtrip.js` (new), Save/Load dropdowns (JSON+HTML), `buildExportHtml` extracted from export.js.
  - Bug fix: widget click delegation moved to `editor.js` — fixes "can't edit after load" (loaded blots were unreachable via per-blot `attach()` listeners in Quill 2's reconcile pass).
  - Bug fix: modal overflow — all two-column modals (accordion, timeline, flip-cards, knowledge-check) got `flex:1;min-height:0` on body; `.widget-modal` got `max-height:calc(100vh - 80px)`.
  - Bug fix: HTML roundtrip `</script>` tag was emitted as `<\/script>`, causing blank pages. Fixed + added `</script>` escape in JSON payload.
- 2026-06-09: Stage 7 Feature 1 complete — Image Control.
- 2026-06-07: UX polish complete — save/load, tab title, placeholder, export loading, widget error state.
- 2026-06-07: Stage 5 complete — all 5 Tier 2 widgets human-verified. Stage 6 merged to main.

## Tried But Failed
- **`<\\/script>` in JS string** — produces `<\/script>` in HTML output; the HTML parser never finds the closing tag and swallows the entire body. Always use `'</script>'` as the literal string, and escape `</script>` in JSON content with `.replace(/<\/script>/gi, '<\\/script>')`.
- **Per-blot click handler in `attach()`** — works for freshly inserted blots but not for blots loaded via `quill.setContents()` in Quill 2 (likely due to node replacement during the SILENT reconcile pass). Fix: event delegation on `editorEl` using `e.target.closest('[data-widget-type]')` + `Quill.find()`.
- **Hardcoded `"Segoe UI"` in export inline style** — double quotes inside a `style="..."` attribute silently truncate the attribute. Always read font-family from `getComputedStyle`.
- **Bubble-phase drop handler for drag-and-drop images** — fix: capture-phase listener.
- **`position:absolute` resize handle at container edge** — fix: sync `wrapper.style.width` to `img.style.width`.

## Architecture Notes
- **Save format v2**: all widget text-content fields store HTML strings (`<p>...</p>`). v1 files auto-migrate on load by wrapping bare strings in `<p>` tags.
- **HTML round-trip**: `saveAsHtml()` runs the full export pipeline then injects `<script type="application/json" id="hce-project-data">` before `</head>`. `loadFromHtml()` uses `DOMParser` to find the tag and `JSON.parse` its `textContent`.
- **Widget click delegation**: single listener on `editorEl` handles all widget clicks. `Quill.find(widgetNode)` retrieves the live blot instance, immune to post-load node reconciliation.
- `ResizableImageBlot` registered directly with `Quill.register(...)`, excluded from `WidgetRegistry`, special-cased in `export.js`.
- `buildExportHtml(delta, title)` is a named export on `window.HCEExport`, shared by the Export HTML button and the HTML round-trip save.
- `window.contentEditor.getDocumentTitle()` shared by tab title (editor.js), save filename (save-load.js), and export title (export.js).

## Pointer
→ Stage 9 (v3 rebuild) is COMPLETE on branch `stage-9-v3-rebuild` — F1–F7 built,
self-tested, independently reviewed, committed. Active feature file:
`staging/stage-9-v3-rebuild/overview.md`; course-mode plan in
`staging/stage-10-course-mode-plan.md`.
→ Next (human decisions): (1) try it in the live editor and confirm it feels right;
(2) approve merge of `stage-9-v3-rebuild` → `main` + push (not done yet); (3) decide on
the parked §3 follow-up (export align/link/strike gap) and the other named follow-ups in
the stage overview; (4) approve starting course mode (C1) when ready.
→ Test suites (run over localhost): `_modal_tests.html` 30/30 · `_codeview_tests.html`
27/27 · `_import_tests.html` 15/15 · `_widgets2_tests.html` 22/22 · `_styling_tests.html`
13/13 · `_nojs_tests.html` 27/27 · `_nojs_selftest.html` baseline byte-identical.
