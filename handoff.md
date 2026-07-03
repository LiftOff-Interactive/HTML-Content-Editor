# Handoff — HTML Content Editor
_Last updated: 2026-07-02 · Current stage: **Stage 9 — v3 rebuild, F2 code view (code complete + 27/27 self-test + independent review; AWAITING HUMAN VERIFICATION before F3 starts). F1 human-approved.**_

## Goals
~~Get the project to a public v1 release on GitHub.~~ **Done.** v1.0.0 is live.
~~Stage 7 post-v1 features.~~ **Done.** v2.0.0 shipped — all three Stage 7 features complete.

Live URLs:
- GitHub Pages: https://frankyface.github.io/HTML-Content-Editor/
- v1.0.0 release: https://github.com/Frankyface/HTML-Content-Editor/releases/tag/v1.0.0
- v2.0.0 release: https://github.com/Frankyface/HTML-Content-Editor/releases/tag/v2.0.0

## Current State
All stages (1–8) complete. v2.0.0 + Stage 8 shipped; `main` = `origin/main` = `d9e0b96`.

**Stage 9 — v3 rebuild — IN PROGRESS on branch `stage-9-v3-rebuild`.**
Governing brief: `v3_kickoff_prompt.md` (§0 checkpoint discipline, §3 protected export
contract). Build order confirmed with the human and recorded in
`staging/stage-9-v3-rebuild/overview.md`: F1 modal fix → F2 code view → F3 HTML import →
F5 naming+clear → F6 five new widgets (scroll-snap = carousel option) → F4 styling
(chrome + opt-in presets) → F7 course-mode plan doc. Strict per-feature checkpoints.

- **Baselines captured** (`docs/baselines/`): byte-exact Stage 8 no-JS + JS export
  references with SHA-256 hashes and the JS-mode non-determinism caveat (random
  tabs/accordion ids + session-scoped car/kc counters — normalize before diffing).
- **F2 (WYSIWYG ⇄ HTML code view): code complete.** New `src/delta-html.js`
  (reversible delta⇄HTML: widget JSON script-islands, inert-template allowlist parser =
  sanitizer, verbatim whitespace model, refuse-don't-drop) + `src/code-view.js`
  (`</> Code` toggle, Apply/Discard, action disabling, beforeunload guard) +
  `_codeview_tests.html` (27 cases). Six-angle review fixed: whitespace/NBSP mutation,
  silent inline-run drops, `<!--<script` island escaping, link asymmetry (about:blank),
  checklist coercion, comment drops, re-entry/restore guards. All suites green; no-JS
  baseline byte-identical. **Next: human verifies, then F3** (start with the shared
  test-harness + parser-policy-hook follow-ups in the stage doc).
- **F1 (modal Save-button fix): ✅ complete, human-approved 2026-07-02.** New `_modal_tests.html` harness
  (10 widgets × 2 viewport heights, stuffed data, Save visibility + hit-testability).
  Initial run 15/20 — tabs/click-reveal/carousel/hotspot were the four modals Stage 7
  never fixed. Fixed with the accordion body pattern + header/footer flex-shrink:0 in
  main.css. Independent 8-angle review then caught hotspot's columns not scrolling
  (tall image unreachable, pin-marker coordinate mismatch under height-clamp) — fixed
  via scrollable imgArea + imgWrap marker frame (empirically verified exact alignment).
  Final: 20/20 modal suite, 27/27 no-JS suite, no-JS export SHA byte-identical to
  baseline, JS export normalized-identical. **Next: human verifies, then F2.**

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
→ Stage 9 (v3 rebuild) F2 is code-complete, self-tested and independently reviewed on
branch `stage-9-v3-rebuild`. Active feature file: `staging/stage-9-v3-rebuild/overview.md`.
→ Next: **human verifies F2** — click `</> Code` in the editor, edit text + a widget's
JSON, Apply; feed it junk HTML and see the refusal list; run `_codeview_tests.html`
(expect 27/27). Only after that checkpoint does F3 (raw HTML import) begin (kickoff §0).
