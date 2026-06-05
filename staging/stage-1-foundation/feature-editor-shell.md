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
- [ ] `index.html` opens via `file://` in Chrome, Firefox, and Safari with no errors
- [ ] Quill editor is visible and accepts keyboard input
- [ ] Toolbar buttons work: bold, italic, underline, H1, H2, H3, bullet list, numbered list
- [ ] Page has a recognizable app shell — not a raw Quill demo
- [ ] All Quill assets (JS, CSS) are loaded from local paths, not CDN URLs
- [ ] `:root` in main CSS defines at least: `--primary-color`, `--secondary-color`, `--font-family`, `--font-size-base`, `--content-max-width`, `--space-unit`

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
- [ ] What max-width feels right for the content area? 800px? 860px? 960px? (Check what Rise and similar tools use — around 860px is common)
- [ ] Should the toolbar be top-fixed or floating? Top-fixed is simpler; floating (bubble) is more Word-like. Given this is a desktop tool for long-form content, top-fixed is probably better.
- [ ] Does the `quill/` directory already have a working Quill build? Need to inspect it first before downloading anything.
- [ ] Should the app shell have a left sidebar (for theme panel) or use a top/right slide-out panel? Left sidebar is more editor-like (VS Code, Notion pattern).
