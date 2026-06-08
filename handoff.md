# Handoff — HTML Content Editor
_Last updated: 2026-06-07 · Current stage: Stage 6 — Polish + Release_

## Goals
Get the project to a public v1 release on GitHub. All 10 widgets are built and verified. UX polish pass is complete. What remains is the demo document, README, LICENSE, CONTRIBUTING.md, and the GitHub release steps.

## Current State
Stage 1–5 done. Stage 6 in progress — UX polish pass complete. On branch `stage-6-polish-release`.

What's built (all stages):
- `src/registry.js` — `register(BlotClass)`, `getAll()`, `get(blotName)`; calls `Quill.register` internally
- `src/blots/base.js` — `BaseWidgetBlot` extends `BlockEmbed`; data storage, `attach()` lifecycle, click-to-edit, `updateData()`, `widget-updated` event, **try/catch around `renderEditor` with `.widget-error` fallback**
- `src/blots/callout.js` — 4 types (info/warning/success/danger), emoji icons, ARIA roles ✓
- `src/blots/tabs.js` — interactive tab switching, two-column edit modal, image insert, self-contained export ✓
- `src/blots/accordion.js` — `<details>`/`<summary>`, CSS grid animation, `allowMultiple`, self-contained IIFE export ✓
- `src/blots/quote.js` — 3 styles (pull/sidebar/highlight), `<blockquote>`/`<cite>` semantics ✓
- `src/blots/timeline.js` — left-aligned vertical timeline, icon field, two-column edit modal ✓
- `src/blots/flip-cards.js` — 3D CSS flip, optional front image, 2/3/4 column grid ✓
- `src/blots/click-reveal.js` — 3 trigger styles, slide-down animation, `aria-expanded` ✓
- `src/blots/carousel.js` — prev/next, dot indicators, autoplay, 3 aspect ratios, per-slide image upload ✓
- `src/blots/hotspot.js` — percentage-based pin markers, pulsing ring, click-to-show tooltip ✓
- `src/blots/knowledge-check.js` — multiple-choice / true-false, per-option feedback, hint toggle, retry, base64-obfuscated answer ✓
- `src/editor.js` — Quill init, `widget-updated` handler, tab title from first H1, exposes `window.contentEditor.getDocumentTitle()`
- `src/ui/modal.js` — `WidgetModal.open()` promise-based modal
- `src/slash-command.js` — `/` palette, substring filter, keyboard nav
- `src/toolbar.js` — `ToolbarDropdown` with grid-plus icon
- `src/export.js` — `deltaToHtml`, `buildExportCSS`, loading state on button, per-widget error wrapping, title from H1, blob download
- `src/save-load.js` — Save/Load buttons, JSON project file (delta + theme), "Saved ✓" status confirmation, "unsaved" tracking
- `src/styles/main.css` — app shell + all widget CSS + `.header-btn--ghost`, `.save-status--saved`, `.widget-error`
- `src/styles/slash-command.css`, `src/styles/toolbar.css`, `src/styles/editor.css`, `src/styles/theme-defaults.css`

## Files I'm Working On
- All prior stages — DONE ✓
- `staging/stage-6-polish-release/feature-release.md` — UX polish complete ✓; demo + release steps remain

## Things I've Changed
- 2026-06-07: UX polish complete — save/load (`src/save-load.js`), tab title from H1, placeholder text update, export loading indicator, per-widget export error wrapping, widget error state in base blot, ghost button styles. All committed to `stage-6-polish-release`.
- 2026-06-07: Stage 5 complete — all 5 Tier 2 widgets human-verified. `stage-2-widget-system` merged to `main`. Stage 6 branch created.
- 2026-06-07: Fix — `KnowledgeCheckBlot` export: hardcoded `"Segoe UI"` broke `style="..."` attribute. Fixed by reading from `getComputedStyle`.
- 2026-06-07: Stage 5 Feature 5 — `KnowledgeCheckBlot`: multiple-choice / true-false, per-option feedback, hint, retry, base64-obfuscated answer, `<fieldset>`/`<legend>` ARIA.
- 2026-06-07: Stages 1–4 + Stage 5 Features 1–4 — all widgets, export engine complete.

## Tried But Failed
- **Hardcoded `"Segoe UI"` in export inline style** — double quotes inside a `style="..."` attribute silently truncate the attribute. Always read font-family from `getComputedStyle`. Fixed in `KnowledgeCheckBlot`.

## Next Up
**Remaining Stage 6 steps (from `feature-release.md`):**
1. Human-verify UX polish: open the editor, test Save/Load, confirm tab title updates from H1, confirm "Exporting…" state appears, confirm "Saved ✓" flash
2. Create a demo document with all 10 widgets visible and populated with real content
3. Export demo as `demo/demo-export.html`
4. Screenshot the editor with demo content open → save as `docs/screenshots/editor.png`
5. Screenshot the exported demo in the browser → save as `docs/screenshots/export.png`
6. Write `README.md` (description, screenshots, feature list, widget gallery, usage, how to run, how to contribute)
7. Add `LICENSE` (MIT)
8. Add `CONTRIBUTING.md` with "how to add a widget" code template
9. Create GitHub repository (see `help.md` — `gh repo create`)
10. Push `main` + `stage-6-polish-release` to GitHub, enable GitHub Pages
11. Merge `stage-6-polish-release` to `main`
12. Tag `v1.0.0` + create GitHub Release with changelog

## Architecture Notes (Stage 6 additions)
- `window.contentEditor.getDocumentTitle()` — parses the Quill delta for the first H1 text. Shared by tab title updates (editor.js), save filename (save-load.js), and export title/filename (export.js).
- Save file format: `{ version: 1, content: QuillDelta, theme: { '--color-primary': '#...', ... } }`. Version guard on load prevents silently loading incompatible files.
- Export loading state: `setTimeout(fn, 20)` yields to the browser so the button repaints to "Exporting…" before the synchronous delta→HTML work begins. Error toast on failure; button always restored in `finally`.
- Widget error state: `renderEditor` wrapped in try/catch in `attach()` and `updateData()`. Shows `.widget-error` panel if data is malformed; clicking still opens the edit modal.

## Pointer
→ Current stage folder: `staging/stage-6-polish-release/`
→ Active feature file: `staging/stage-6-polish-release/feature-release.md`
