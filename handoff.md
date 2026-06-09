# Handoff — HTML Content Editor
_Last updated: 2026-06-09 · Current stage: **Stage 7 — Post-v1 Features**_

## Goals
~~Get the project to a public v1 release on GitHub.~~ **Done.** v1.0.0 is live at https://github.com/Frankyface/HTML-Content-Editor/releases/tag/v1.0.0 with GitHub Pages at https://frankyface.github.io/HTML-Content-Editor/

## Current State
Stages 1–6 done and shipped as v1.0.0. Stage 7 in progress on `main`.

**Stage 7 Feature 1 — Image Control — ✅ Complete and human-verified.**

What's built (all stages):
- `src/registry.js` — `register(BlotClass)`, `getAll()`, `get(blotName)`; calls `Quill.register` internally
- `src/blots/base.js` — `BaseWidgetBlot` extends `BlockEmbed`; data storage, `attach()` lifecycle, click-to-edit, `updateData()`, `widget-updated` event, **try/catch around `renderEditor` with `.widget-error` fallback**
- `src/blots/callout.js` — 4 types (info/warning/success/danger), emoji icons, ARIA roles ✓
- `src/blots/tabs.js` — interactive tab switching, two-column edit modal, image insert, self-contained export ✓
- `src/blots/accordion.js` — `<details>`/`<summary>`, CSS grid animation, `allowMultiple`, self-contained IIFE export ✓
- `src/blots/quote.js` — 3 styles (pull/sidebar/highlight), `<blockquote>`/`<cite>` semantics ✓
- `src/blots/timeline.js` — left-aligned vertical timeline, icon field, two-column edit modal ✓
- `src/blots/flip-cards.js` — 3D CSS flip, ImageUploadField for front image (file + URL + preview + resize), `frontImageWidth` stored per card, 2/3/4 column grid ✓
- `src/blots/click-reveal.js` — 3 trigger styles, slide-down animation, `aria-expanded` ✓
- `src/blots/carousel.js` — prev/next, dot indicators, autoplay, per-slide ImageUploadField (file + URL + preview + resize), `imageWidth` stored per slide, applied in editor and export ✓
- `src/blots/hotspot.js` — percentage-based pin markers, pulsing ring, click-to-show tooltip; image controls support file upload + URL paste with warning badge ✓
- `src/blots/knowledge-check.js` — multiple-choice / true-false, per-option feedback, hint toggle, retry, base64-obfuscated answer ✓
- `src/blots/image.js` — **NEW** `ResizableImageBlot` (BlockEmbed, drag-to-resize handle, fires `widget-updated` on mouseup, direct Quill registration bypasses widget palette) ✓
- `src/ui/image-upload-field.js` — **NEW** `ImageUploadField` reusable compound field (file picker + URL input + live preview + resize handle + URL warning badge, `destroy()` lifecycle) ✓
- `src/editor.js` — Quill init, `widget-updated` handler, tab title from first H1, image toolbar button (capture-phase drop handler prevents Quill double-insert), `window.contentEditor.getDocumentTitle()`
- `src/ui/modal.js` — `WidgetModal.open()` promise-based modal
- `src/slash-command.js` — `/` palette, substring filter, keyboard nav
- `src/toolbar.js` — `ToolbarDropdown` with grid-plus icon
- `src/export.js` — `deltaToHtml`, `buildExportCSS`, loading state on button, per-widget error wrapping, `resizable-image` special-case before WidgetRegistry path, title from H1, blob download
- `src/save-load.js` — Save/Load buttons, JSON project file (delta + theme), "Saved ✓" status confirmation, "unsaved" tracking
- `src/styles/main.css` — app shell + all widget CSS + `.hce-image-wrapper`, `.hce-image-resize-handle` (hover + is-resizing reveal)

## Files I'm Working On
- `staging/stage-7-post-v1/feature-image-control.md` — **DONE ✓** all checklist items complete, human-verified
- `staging/stage-7-post-v1/feature-rich-text-widgets.md` — **NEXT** (not yet started)

## Things I've Changed
- 2026-06-09: Stage 7 Feature 1 complete — Image Control. New files: `src/blots/image.js` (ResizableImageBlot), `src/ui/image-upload-field.js` (ImageUploadField). Modified: `src/editor.js`, `src/export.js`, `src/blots/carousel.js`, `src/blots/flip-cards.js`, `src/blots/hotspot.js`, `src/styles/main.css`, `index.html`.
- 2026-06-09: Bug fixes post human-testing: capture-phase drop handler (double-image), wrapper width sync (handle misalignment), carousel renderEditor applies imageWidth.
- 2026-06-07: UX polish complete — save/load (`src/save-load.js`), tab title from H1, placeholder text update, export loading indicator, per-widget export error wrapping, widget error state in base blot, ghost button styles.
- 2026-06-07: Stage 5 complete — all 5 Tier 2 widgets human-verified. Stage 6 merged to main.
- 2026-06-07: Fix — `KnowledgeCheckBlot` export: hardcoded `"Segoe UI"` broke `style="..."` attribute. Fixed by reading from `getComputedStyle`.

## Tried But Failed
- **Hardcoded `"Segoe UI"` in export inline style** — double quotes inside a `style="..."` attribute silently truncate the attribute. Always read font-family from `getComputedStyle`. Fixed in `KnowledgeCheckBlot`.
- **Bubble-phase drop handler for drag-and-drop images** — Quill's clipboard module on `.ql-editor` also handles file drops, causing two images to be inserted. Fix: use capture-phase (`addEventListener('drop', fn, true)`) so our handler fires first and `stopPropagation()` prevents Quill from seeing the event.
- **`position:absolute` resize handle at container edge** — the blot's outer `div` is block-level (100% wide by default), so `right:0` places the handle at the editor's right edge. Fix: keep `wrapper.style.width` explicitly synced to `img.style.width` at create time and during every resize frame.

## Next Up
**Stage 7 Feature 2 — Rich Text in Widgets** (`staging/stage-7-post-v1/feature-rich-text-widgets.md`)

This bumps the save file to **v2**: all widget text-content fields that were plain strings become HTML strings. The load function must auto-migrate v1 files.

Read `feature-rich-text-widgets.md` fully before planning any implementation — it touches every widget modal and changes the data schema.

## Architecture Notes
- `ResizableImageBlot` is registered directly with `Quill.register('formats/resizable-image', ...)` and deliberately excluded from `WidgetRegistry` so it never appears in the `/` palette or toolbar widget list.
- `export.js` handles `resizable-image` as a special case before the `WidgetRegistry.get(blotName)` lookup.
- `ImageUploadField` exposes `getValue()` → `{src, width}` and `destroy()`. Carousel and flip-cards use a `saveCurrentImgField()` pattern to flush the active field before switching items and on modal close, preventing data loss on fast navigation.
- Wrapper width sync: both `ResizableImageBlot` (editor) and `ImageUploadField` (modal preview) keep `wrapper.style.width === img.style.width` so the resize handle always sits at the image's bottom-right corner, not the block container's edge.
- `window.contentEditor.getDocumentTitle()` — parses the Quill delta for the first H1 text. Shared by tab title updates (editor.js), save filename (save-load.js), and export title/filename (export.js).
- Save file format: `{ version: 1, content: QuillDelta, theme: { '--color-primary': '#...', ... } }`. Version guard on load prevents silently loading incompatible files.

## Pointer
→ Current stage folder: `staging/stage-7-post-v1/`
→ Active feature file: `staging/stage-7-post-v1/feature-rich-text-widgets.md` (start here)
