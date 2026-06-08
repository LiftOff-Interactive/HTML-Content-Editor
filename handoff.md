# Handoff — HTML Content Editor
_Last updated: 2026-06-07 · Current stage: Stage 6 — Polish + Release_

## Goals
Get the project to a public v1 release on GitHub. All 10 widgets are built and verified. This stage is about fit and finish: UX polish, README, demo document, cross-browser testing, and pushing the repo public with GitHub Pages live.

## Current State
Stage 1 done. Stage 2 done. Stage 3 done. Stage 4 done. Stage 5 done — all 5 Tier 2 widgets built and human-verified. `stage-2-widget-system` branch merged to `main`. Now on `stage-6-polish-release` branch.

What's built (all stages):
- `src/registry.js` — `register(BlotClass)`, `getAll()`, `get(blotName)`; calls `Quill.register` internally
- `src/blots/base.js` — `BaseWidgetBlot` extends `BlockEmbed`; handles data storage (`data-widget-data` JSON attr), `static value()`, `attach()` lifecycle, click-to-edit, `updateData()`, fires `widget-updated` event
- `src/blots/callout.js` — 4 types (info/warning/success/danger), emoji icons, ARIA roles ✓
- `src/blots/tabs.js` — interactive tab switching, two-column edit modal, image insert, self-contained export ✓
- `src/blots/accordion.js` — `<details>`/`<summary>`, CSS grid animation, `allowMultiple`, self-contained IIFE export ✓
- `src/blots/quote.js` — 3 styles (pull/sidebar/highlight), `<blockquote>`/`<cite>` semantics ✓
- `src/blots/timeline.js` — left-aligned vertical timeline, icon field, two-column edit modal ✓
- `src/blots/flip-cards.js` — 3D CSS flip, optional front image, 2/3/4 column grid ✓
- `src/blots/click-reveal.js` — 3 trigger styles, slide-down animation, `aria-expanded` ✓
- `src/blots/carousel.js` — prev/next, dot indicators, autoplay, 3 aspect ratios, per-slide image upload ✓
- `src/blots/hotspot.js` — percentage-based pin markers, pulsing ring, click-to-show tooltip, crosshair click-to-place UI ✓
- `src/blots/knowledge-check.js` — multiple-choice / true-false, per-option feedback, hint toggle, retry, base64-obfuscated correct answer in export ✓
- `src/editor.js` — Quill init, listens for `widget-updated`
- `src/ui/modal.js` — `WidgetModal.open()` promise-based modal
- `src/slash-command.js` — `/` palette, substring filter, keyboard nav
- `src/toolbar.js` — `ToolbarDropdown` with grid-plus icon
- `src/export.js` — `deltaToHtml`, `buildExportCSS`, blob download
- `src/styles/main.css` — app shell + all widget CSS
- `src/styles/slash-command.css`, `src/styles/toolbar.css`, `src/styles/editor.css`, `src/styles/theme-defaults.css`

## Files I'm Working On
- `staging/stage-2-widget-system/feature-blot-base-class.md` — DONE ✓
- `staging/stage-2-widget-system/feature-slash-command.md` — DONE ✓
- `staging/stage-2-widget-system/feature-toolbar-dropdown.md` — DONE ✓
- `staging/stage-3-tier1-widgets/feature-callout.md` — DONE ✓
- `staging/stage-3-tier1-widgets/feature-tabs.md` — DONE ✓
- `staging/stage-3-tier1-widgets/feature-accordion.md` — DONE ✓
- `staging/stage-3-tier1-widgets/feature-quote.md` — DONE ✓
- `staging/stage-3-tier1-widgets/feature-timeline.md` — DONE ✓
- `staging/stage-4-export-engine/feature-export.md` — DONE ✓
- `staging/stage-5-tier2-widgets/feature-flip-cards.md` — DONE ✓
- `staging/stage-5-tier2-widgets/feature-click-reveal.md` — DONE ✓
- `staging/stage-5-tier2-widgets/feature-carousel.md` — DONE ✓
- `staging/stage-5-tier2-widgets/feature-hotspot.md` — DONE ✓
- `staging/stage-5-tier2-widgets/feature-knowledge-check.md` — DONE ✓
- `staging/stage-6-polish-release/feature-release.md` — IN PROGRESS

## Things I've Changed
- 2026-06-07: Stage 5 complete — all 5 Tier 2 widgets human-verified. `stage-2-widget-system` merged to `main`. Stage 6 branch created.
- 2026-06-07: Fix — `KnowledgeCheckBlot` export: hardcoded `"Segoe UI"` broke `style="..."` attribute, silently dropping `display:none`. Fixed by reading `--font-family-ui` via `getComputedStyle`.
- 2026-06-07: Stage 5 Feature 5 — `KnowledgeCheckBlot`: multiple-choice / true-false, per-option feedback, hint, retry, base64-obfuscated correct answer, `<fieldset>`/`<legend>` ARIA, two-column edit modal.
- 2026-06-07: Stage 5 Feature 4 — `HotspotBlot`: image + percentage-based pins, pulsing ring, tooltip, crosshair click-to-place.
- 2026-06-07: Stage 5 Feature 3 — `CarouselBlot`: image/content slider, prev/next, dots, autoplay, aspect ratio, per-slide image upload.
- 2026-06-05: Stage 5 Feature 2 — `ClickRevealBlot`: 3 trigger styles, slide-down animation, ARIA.
- 2026-06-05: Stage 5 Feature 1 — `FlipCardsBlot`: 3D flip, optional front image, 2/3/4 column grid.
- 2026-06-05: Stage 4 — Export engine (`src/export.js`): `deltaToHtml`, `buildExportCSS`, blob download, >5MB toast.
- 2026-06-05: Stages 1–3 complete — editor shell, widget system infrastructure, all 5 Tier 1 widgets.

## Tried But Failed
- **Hardcoded `"Segoe UI"` in export inline style** — double quotes inside a `style="..."` attribute silently truncate the attribute. Always read font-family from `getComputedStyle` or use single-quoted font names. Fixed in `KnowledgeCheckBlot`.

## Next Up
**Stage 6 work order (from `feature-release.md`):**
1. UX polish pass:
   - Empty editor state placeholder ("Start writing, or press / to insert a widget")
   - Toolbar button tooltips (`title` attributes)
   - Save confirmation toast ("Document saved")
   - Export loading indicator for large documents
   - Browser tab title from first H1
   - Widget error state for malformed data
2. Create a demo document with all 10 widgets visible
3. Export demo as `demo/demo-export.html`
4. Screenshot editor and exported demo for README
5. Write `README.md` (description, screenshots, feature list, usage, widget gallery, how to run, contribute)
6. Add `LICENSE` (MIT)
7. Add `CONTRIBUTING.md` with "how to add a widget" tutorial
8. Create GitHub repository (public) — see `help.md`
9. Push `main` to GitHub, enable GitHub Pages
10. Tag `v1.0.0` + create GitHub Release with changelog

## Architecture Notes
(See previous stage sections in git history — no new architectural patterns in Stage 6.)

## Pointer
→ Current stage folder: `staging/stage-6-polish-release/`
→ Active feature file: `staging/stage-6-polish-release/feature-release.md`
