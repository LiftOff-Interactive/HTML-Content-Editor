# Handoff — HTML Content Editor
_Last updated: 2026-06-23 · Current stage: **v3.0.0 foundation in progress on branch `stage-9-v3-foundation`. F1 (modal Save-button fix) ✅ done & verified (20/20 self-test green, 27/27 no-JS regression green). Next: F4 styling pass.**_

## Goals
~~Get the project to a public v1 release on GitHub.~~ **Done.** v1.0.0 is live.
~~Stage 7 post-v1 features.~~ **Done.** v2.0.0 shipped — all three Stage 7 features complete.

Live URLs:
- GitHub Pages: https://frankyface.github.io/HTML-Content-Editor/
- v1.0.0 release: https://github.com/Frankyface/HTML-Content-Editor/releases/tag/v1.0.0
- v2.0.0 release: https://github.com/Frankyface/HTML-Content-Editor/releases/tag/v2.0.0

## Current State
All stages (1–7) complete. v2.0.0 shipped on `main`. Stage 8 (no-JS export) shipped on `main` (`d9e0b96`).

**v3.0.0 FOUNDATION — in progress on branch `stage-9-v3-foundation`.** Build order: F1 → F4 → F2 → F3 Phase 1 → course-mode foundation, each behind the §4 verification gate.

**F1 — Fix: edit modals hide the Save button — ✅ DONE & VERIFIED.**
- Part 1 (the fix): brought the 4 broken bespoke modal bodies into the canonical bounded-flex layout `display:flex;flex:1;min-height:0;overflow:hidden;` (dropping the per-body `min-height:NNNpx`): `tabs.js:253`, `carousel.js:439`, `hotspot.js:369`, `click-reveal.js:306`. Added `min-height:0;overflow-y:auto;` to `tabs.js:277` rightCol (the only broken modal whose rich-text column lacked overflow). Matches the 4 already-correct modals (accordion/flip-cards/knowledge-check/timeline).
- Hardening: added `flex-shrink:0;` to `.widget-modal-header` and `.widget-modal-footer` in `main.css` so header/footer can never be squeezed.
- Part 2 (the `WidgetModal.buildFrame()` DRY refactor) is **deferred** to a reviewed follow-up (decided with the human), tracked as a future task. Part 1 fully resolves the user-visible bug.
- Verification: new `_modal_tests.html` self-test loads the real `index.html` in a height-controlled iframe (inner `100vh` = 600/400px), opens all 10 registry widgets' real edit modals, stuffs every rich-text/textarea/input field to overflow, and asserts (A) dialog within viewport, (B) footer within viewport & inside dialog, (C) Save button hit-tested via `elementFromPoint`, (D) overflow contained (`dialog.scrollHeight ≤ clientHeight`). **20/20 green** at 768×600 and 768×400. `_nojs_tests.html` still **27/27 green** (F1 didn't touch exports). Live editor boots with zero console errors.
- Harness-bug note: the first run failed (D) because the initial metric measured the *underlying editor app* scrolling behind the fixed modal (irrelevant) and flagged widgets whose modal content simply fit. Replaced D with the precise `dialog.scrollHeight ≤ clientHeight` containment check — the exact discriminator of the original bug.

**Stage 8 — No-JS / SharePoint export — shipped & pushed to `main` (commit `d9e0b96`).** v3.0.0 is now fully planned (see `v3_kickoff_prompt.md` + `docs/v3_master_plan.md`).
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
- 2026-06-23: **v3 F1 — modal Save-button fix.** Edited `src/blots/tabs.js` (body@253 + rightCol@277), `carousel.js` (body@439), `hotspot.js` (body@369), `click-reveal.js` (body@306) to the canonical bounded-flex body layout; added `flex-shrink:0` to `.widget-modal-header`/`.widget-modal-footer` in `main.css`. New `_modal_tests.html` browser self-test (20/20 green). New `.claude/launch.json` (`hce`/8137). Copied import fixtures to `fixtures/` (git-ignored). Started branch `stage-9-v3-foundation`.
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
→ Stage 8 (No-JS / SharePoint export) shipped & pushed to `main` (commit `d9e0b96`). Still worth doing once: human-verify the "Export for SharePoint" button against a real SharePoint Embed web part. Tried/Failed insight: scoped-`<style>` state rules must use `!important` to beat widgets' inline base styles.
→ **v3.0.0 foundation is building on branch `stage-9-v3-foundation`.** Reference docs: **`v3_kickoff_prompt.md`** (executable brief) and **`docs/v3_master_plan.md`** (446-line design spec). Build order F1 → F4 → F2 → F3 Phase 1 → course foundation, each behind the §4 verification gate; checkpoint with the human per gate.
→ **NEXT: F4 — styling pass** (editor chrome + exports + "Showcase" preset). The load-bearing trap (R6): no blot reads `--widget-shadow` today, so per-blot `getPropertyValue` reads in all 11 `renderExport` are **required**; preserve Stage-8 `!important` discipline in the 7 `renderExportNoJS` (R5). v2→v3 umbrella save bump is owned by F2/F3 (F4 alone changes no save format), but the migration must supply new theme-token defaults so upgraded v2 files render identically.
→ Test infra: `_modal_tests.html` (F1, 20/20), `_nojs_tests.html` (27/27 regression guard — keep green), `_nojs_selftest.html` (one-of-every-widget no-JS export banner — re-run for F4). Preview: `.claude/launch.json` config `hce` on port 8137 (created this session). Fixtures copied to `fixtures/` (git-ignored — large/local-only). Open decision still pending for later: F1 Part 2 `buildFrame` refactor (deferred follow-up).
