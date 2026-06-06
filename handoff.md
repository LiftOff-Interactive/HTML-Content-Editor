# Handoff — HTML Content Editor
_Last updated: 2026-06-05 · Current stage: Stage 5 — Tier 2 Widgets_

## Goals
Build the five Tier 2 widgets (Flip Cards, Click Reveal, Carousel, Hotspot, Knowledge Check). The export engine from Stage 4 is complete and working, so each new widget can be built and immediately verified in both the editor and exported HTML.

## Current State
Stage 1 done. Stage 2 done. Stage 3 done — all 5 Tier 1 widgets built and human-verified. Stage 4 done — export engine built and human-verified working.

What's built (Stage 2 + Stage 3):
- `src/registry.js` — `register(BlotClass)`, `getAll()`, `get(blotName)`; calls `Quill.register` internally
- `src/blots/base.js` — `BaseWidgetBlot` extends `BlockEmbed`; handles data storage (`data-widget-data` JSON attr), `static value()`, `attach()` lifecycle, click-to-edit, `updateData()`, fires `widget-updated` event
- `src/blots/callout.js` — `CalloutBlot`; 4 types (info/warning/success/danger), emoji icons, CSS-class editor render, inline-style export render with CSS var resolution, HTML escaping, ARIA roles ✓ human verified
- `src/blots/tabs.js` — `TabsBlot`; interactive tab switching in editor (stopPropagation), two-column edit modal (tab list + ▲▼ reorder + delete + add, min 2 / max 8), self-contained onclick export; image insert (FileReader → base64 DataURL → `<img>` at cursor) ✓ human verified
- `src/blots/accordion.js` — `AccordionBlot`; `<details>`/`<summary>` with CSS grid-template-rows animation, chevron 180° rotation, `allowMultiple` toggle, two-column edit modal (▲▼ reorder, min 2 / max 8), self-contained IIFE export for close-others behavior; image insert ✓ human verified
- `src/blots/quote.js` — `QuoteBlot`; 3 styles (pull/sidebar/highlight), decorative `"` span, `<blockquote>`/`<cite>` semantics, `WidgetModal.open()` edit modal (4 fields), quote stored as HTML ✓ human verified
- `src/blots/timeline.js` — `TimelineBlot`; left-aligned vertical timeline, circle dot + connecting line, icon field (1–2 chars, accepts emoji), two-column edit modal (▲▼ reorder, min 2 / max 8); editor uses `<div>` tags (Quill snow CSS overrides `li` padding), export uses `<ol>/<li>` ✓ human verified
- `src/editor.js` — listens for `widget-updated` and re-inserts the blot to keep the Quill delta in sync
- `src/ui/modal.js` — `WidgetModal.open({ title, fields, data })` returns a Promise; used by simple widgets; complex widgets build their own modal with `createElement`
- `src/slash-command.js` — typing `/` opens a floating palette, substring filter, ↑/↓/Enter/Esc keyboard nav, click-to-insert, positions near cursor via `quill.getBounds()`
- `src/toolbar.js` — `ToolbarDropdown`; grid-plus icon button in `.header-actions`, scrollable dropdown, insert-at-cursor, close-on-outside-click, Escape support
- `src/styles/main.css` — app shell + all widget CSS (callout, tabs, accordion, quote, timeline, modal); CSS custom properties throughout
- `src/styles/slash-command.css`, `src/styles/toolbar.css`, `src/styles/editor.css`, `src/styles/theme-defaults.css`

Architecture notes:
- All widget data stored as `{ _v: 1, ...fields }` JSON on `data-widget-data` — survives delta serialization
- Two render modes per widget: `renderEditor` (CSS classes, custom properties) and `renderExport` (fully inline styles, resolves vars via `getComputedStyle` at export time)
- Simple widgets use `WidgetModal.open()`; complex widgets (tabs, accordion, timeline) build their own modal UI with `document.createElement`
- Tab switching uses `e.stopPropagation()` so tab bar clicks don't bubble to the base-class click-to-edit handler
- Export interactivity (tabs, accordion) uses self-contained IIFEs scoped by unique ID — no global functions, safe for multiple instances per page
- Quill's snow CSS overrides `padding-left` on `<li>` elements — timeline editor render uses `<div>` tags instead of `<ol>/<li>` to avoid this
- `prompt()` is blocked by VS Code Live Server — `WidgetModal` is the edit UI for all widgets
- Quill's `text-change` event fires before the selection updates — use delta parsing (not `getSelection()`) to detect slash command trigger
- Toolbar button lives in `.header-actions` (app header right side); dropdown is `position: fixed`, appended to `document.body`

## Files I'm Working On
- `staging/stage-2-widget-system/feature-blot-base-class.md` — DONE ✓ (human verified)
- `staging/stage-2-widget-system/feature-slash-command.md` — DONE ✓ (human verified)
- `staging/stage-2-widget-system/feature-toolbar-dropdown.md` — DONE ✓ (human verified)
- `staging/stage-3-tier1-widgets/feature-callout.md` — DONE ✓ (human verified)
- `staging/stage-3-tier1-widgets/feature-tabs.md` — DONE ✓ (human verified)
- `staging/stage-3-tier1-widgets/feature-accordion.md` — DONE ✓ (human verified)
- `staging/stage-3-tier1-widgets/feature-quote.md` — DONE ✓ (human verified)
- `staging/stage-3-tier1-widgets/feature-timeline.md` — DONE ✓ (human verified)
- `staging/stage-4-export-engine/feature-export.md` — DONE ✓ (human verified)

## Things I've Changed
- 2026-06-05: Stage 4 — Export engine (`src/export.js`): `deltaToHtml` walks Quill ops and renders text/headings/lists/widgets; `buildExportCSS` reads theme vars via getComputedStyle (no var() refs); blob download with slugified filename; >5MB size toast. "Export HTML" button added to app header. Button styles added to `main.css`.
- 2026-06-05: Stage 3 Feature 5 — `TimelineBlot` (`src/blots/timeline.js`): left-aligned vertical timeline, circle dots + connecting lines, icon field, two-column edit modal; timeline CSS added to `main.css`; wired into `index.html`. Editor render uses `<div>` tags (not `<ol>/<li>`) to avoid Quill snow CSS overriding padding-left on li elements.
- 2026-06-05: Stage 3 Feature 4 — `QuoteBlot` (`src/blots/quote.js`): 3 styles (pull/sidebar/highlight), decorative quote mark span, blockquote/cite semantics; quote CSS added to `main.css`; wired into `index.html`
- 2026-06-05: Added image insert to tabs modal — same FileReader/base64 pattern as accordion
- 2026-06-05: Stage 3 Feature 3 (v2) — added image insert to accordion modal
- 2026-06-05: Stage 3 Feature 3 — `AccordionBlot`: `<details>`/`<summary>`, CSS grid animation, chevron rotation, `allowMultiple`, two-column modal, self-contained export IIFE
- 2026-06-05: Stage 3 Feature 2 — `TabsBlot`: interactive tab switching, two-column edit modal, self-contained onclick export
- 2026-06-05: Stage 3 Feature 1 — expanded `CalloutBlot` with `renderExport`, HTML escaping, ARIA roles
- 2026-06-05: Stage 2 complete ✓ — registry, base blot, WidgetModal, slash command, toolbar all human-verified
- 2026-06-05: Stage 1 complete ✓ — editor shell, theme panel

## Tried But Failed
_Nothing yet._

## Next Up
1. Read `staging/stage-5-tier2-widgets/overview.md` and the first feature file `feature-flip-cards.md`
2. Build `FlipCardsBlot` — cards that flip on click to reveal a back face
3. Verify in editor and in exported HTML before moving to the next widget

## Architecture Notes (Stage 4 additions)
- `src/export.js` — export pipeline. `window.HCEExport.exportHtml()` is the entry point.
- `deltaToHtml(delta)` processes Quill ops: text ops accumulate into `lineBuffer`, flushed at each `\n` as `<p>/<h1-3>/<li>`; widget embed ops call `renderExport()` on a detached div (scripts don't execute in detached context but are preserved in the string for the downloaded file).
- `buildExportCSS()` reads all theme vars via `getComputedStyle` — zero `var(--...)` refs in output.
- Widget interactivity in exports: tabs use self-contained inline `onclick` attrs; accordion uses an inline IIFE `<script>` scoped by unique ID. No global JS needed.

## Pointer
→ Current stage folder: `staging/stage-5-tier2-widgets/`
→ Active feature file: `staging/stage-5-tier2-widgets/feature-flip-cards.md`
