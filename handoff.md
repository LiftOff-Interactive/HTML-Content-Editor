# Handoff — HTML Content Editor
_Last updated: 2026-06-05 · Current stage: Stage 3 — Tier 1 Widgets (Feature 1 of 5)_

## Goals
Build the five core content widgets. Each widget must render in the editor, support modal editing, and render correctly in a fully self-contained exported HTML file.

## Current State
Stage 1 done. Stage 2 done — all 3 features human-verified. Ready to begin Stage 3.

What's built (Stage 2):
- `src/registry.js` — `register(BlotClass)`, `getAll()`, `get(blotName)`; calls `Quill.register` internally
- `src/blots/base.js` — `BaseWidgetBlot` extends `BlockEmbed`; handles data storage (`data-widget-data` JSON attr), `static value()`, `attach()` lifecycle, click-to-edit, `updateData()`, and fires `widget-updated` event
- `src/blots/callout.js` — `CalloutBlot` stub (Stage 2 proof-of-concept); Stage 3 will expand this into the full widget with `renderExport`
- `src/editor.js` — listens for `widget-updated` and re-inserts the blot to keep the Quill delta in sync
- `src/ui/modal.js` — `WidgetModal.open({ title, fields, data })` returns a Promise; used by all widget `edit()` methods
- `src/slash-command.js` — typing `/` opens a floating palette, substring filter, ↑/↓/Enter/Esc keyboard nav, click-to-insert, positions near cursor via `quill.getBounds()`
- `src/styles/slash-command.css` — palette styling via CSS custom properties
- `src/toolbar.js` — `ToolbarDropdown`; grid-plus icon button in `.header-actions`, scrollable dropdown listing all registered widgets, insert-at-cursor, close-on-outside-click, Escape support
- `src/styles/toolbar.css` — toolbar button and dropdown styling via CSS custom properties
- Theme panel: live preview removed (user request); presets, color pickers, typography and layout controls, reset button all intact

Architecture notes:
- All widget data stored as `{ _v: 1, ...fields }` JSON on `data-widget-data` — survives delta serialization
- Two render modes per widget: `renderEditor` (in-editor) and `renderExport` (standalone, no external deps)
- `prompt()` is blocked by VS Code Live Server — `WidgetModal` is the edit UI for all widgets
- Quill's `text-change` event fires before the selection updates — use delta parsing (not `getSelection()`) to detect the slash command trigger
- Toolbar button lives in `.header-actions` (app header right side); dropdown is `position: fixed`, appended to `document.body`

## Files I'm Working On
- `staging/stage-2-widget-system/feature-blot-base-class.md` — DONE ✓ (human verified)
- `staging/stage-2-widget-system/feature-slash-command.md` — DONE ✓ (human verified)
- `staging/stage-2-widget-system/feature-toolbar-dropdown.md` — DONE ✓ (human verified)
- `staging/stage-3-tier1-widgets/feature-callout.md` — NEXT

## Things I've Changed
- 2026-06-05: Completed project planning interview, confirmed vision and roadmap
- 2026-06-05: Scaffolded all documentation and staging files
- 2026-06-05: Initialized git repository
- 2026-06-05: Discovered `quill/` is a source repo; extracted pre-built dist to `vendor/quill/dist/`
- 2026-06-05: Built editor shell — `index.html`, `src/editor.js`, `src/styles/main.css`, `src/styles/editor.css`
- 2026-06-05: Human-verified editor shell in browser ✓
- 2026-06-05: Built theme panel — `src/theme.js`, `src/styles/theme-defaults.css`, 3 presets, all controls
- 2026-06-05: Removed live preview from theme panel (user request)
- 2026-06-05: Built Stage 2 Feature 1 — `src/registry.js`, `src/blots/base.js`, `src/blots/callout.js`
- 2026-06-05: Replaced prompt() with WidgetModal — `src/ui/modal.js` (prompt blocked by Live Server)
- 2026-06-05: Stage 2 Feature 1 human-verified ✓ — registry, blot base class, CalloutBlot, modal all passing
- 2026-06-05: Built Stage 2 Feature 2 — `src/slash-command.js`, `src/styles/slash-command.css`
- 2026-06-05: Fixed slash command open trigger — Quill's `text-change` returns stale selection; switched to delta parsing
- 2026-06-05: Stage 2 Feature 2 human-verified ✓ — slash command palette, filter, keyboard nav, insert all passing
- 2026-06-05: Built Stage 2 Feature 3 — `src/toolbar.js`, `src/styles/toolbar.css`; icon button, scrollable dropdown, insert-at-cursor
- 2026-06-05: Stage 2 Feature 3 human-verified ✓ — toolbar button, dropdown, close-on-outside-click, Escape, insert all passing
- 2026-06-05: Stage 2 complete ✓

## Tried But Failed
_Nothing yet._

## Next Up
1. Merge `stage-2-widget-system` branch to `main` (human action — stage is done and verified)
2. Build `feature-callout` (Stage 3, Feature 1) — expand the existing CalloutBlot stub into the full widget with `renderExport` and inline styles

## Pointer
→ Current stage folder: `staging/stage-3-tier1-widgets/`
→ Active feature file: `staging/stage-3-tier1-widgets/feature-callout.md`
