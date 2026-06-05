# Feature — Editor Shell

## What It Is
The main HTML page that hosts the Quill 2.0 editor. This is the skeleton of the entire application — every other feature builds on top of it.

## What It Includes
- `index.html` — the root page
- Quill 2.0 loaded from local files (not a CDN)
- The editor container (`#editor`) where Quill renders
- A basic toolbar with standard formatting options
- A minimal shell UI: header bar, editor area, sidebar placeholder
- Base CSS with `:root` theme variables defined as stubs

## Acceptance Criteria
- [ ] `index.html` opens via `file://` in Chrome, Firefox, and Safari with no errors — **NEEDS HUMAN TEST**
- [ ] Quill editor is visible and accepts keyboard input — **NEEDS HUMAN TEST**
- [ ] Toolbar buttons work: bold, italic, underline, H1, H2, H3, bullet list, numbered list — **NEEDS HUMAN TEST**
- [x] Page has a recognizable app shell — not a raw Quill demo
- [x] All Quill assets (JS, CSS) are loaded from local paths, not CDN URLs — served from `vendor/quill/dist/`
- [x] `:root` in main CSS defines at least: `--primary-color`, `--secondary-color`, `--font-family`, `--font-size-base`, `--content-max-width`, `--space-unit`

## File Structure to Create
```
index.html
src/
  editor.js          — Quill init and toolbar configuration
  styles/
    main.css         — global styles + CSS custom property definitions
    editor.css       — editor-specific overrides
```

## Implementation Notes
- Use Quill's `snow` theme as a starting point, then override with custom CSS
- The editor area should have a max-width (e.g., `--content-max-width: 860px`) and be centered — this is what the exported HTML will use too
- Keep `editor.js` simple at this stage: just Quill initialization and toolbar config
- Don't add save/load/export buttons yet — those come in later stages

## Open Questions
- [x] What max-width feels right for the content area? → **860px** (`--content-max-width: 860px`)
- [x] Should the toolbar be top-fixed or floating? → **Sticky top-fixed** (`position: sticky; top: var(--header-height)`)
- [x] Does the `quill/` directory already have a working Quill build? → **No** — it's the full source repo. Pre-built UMD files extracted from npm into `vendor/quill/dist/`.
- [x] Should the app shell have a left sidebar or slide-out panel? → **Left sidebar** (placeholder now, controls in next feature)
