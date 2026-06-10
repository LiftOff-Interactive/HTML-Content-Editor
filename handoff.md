# Handoff — HTML Content Editor
_Last updated: 2026-06-09 · Current stage: **Stage 7 — Post-v1 Features (all complete)**_

## Goals
~~Get the project to a public v1 release on GitHub.~~ **Done.** v1.0.0 is live.
~~Stage 7 post-v1 features.~~ **Done.** v2.0.0 shipped — all three Stage 7 features complete.

Live URLs:
- GitHub Pages: https://frankyface.github.io/HTML-Content-Editor/
- v1.0.0 release: https://github.com/Frankyface/HTML-Content-Editor/releases/tag/v1.0.0
- v2.0.0 release: https://github.com/Frankyface/HTML-Content-Editor/releases/tag/v2.0.0

## Current State
All stages (1–7) complete. v2.0.0 shipped on `main`.

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
→ Stage 7 complete. All features shipped as v2.0.0.
→ No active feature file — start a new session by defining Stage 8 scope.
