# Stage 1 — Foundation

## Goal
Get a working editor shell in the browser. By the end of this stage, Quill 2.0 is loaded, a user can type and format text, and a theme panel lets them set CSS custom properties that apply live to the document.

No widgets yet. Just a blank canvas that looks and feels like a real editor.

## Features in This Stage
- `feature-editor-shell.md` — Quill 2.0 setup, page layout, standard toolbar
- `feature-theme-panel.md` — CSS custom properties system, theme panel UI

## Definition of Done
- [ ] `index.html` opens in a browser with no server (file:// protocol works)
- [ ] Quill 2.0 editor is visible and accepts text input
- [ ] Standard toolbar works: bold, italic, underline, headings (H1–H3), bullet/numbered list
- [ ] Theme panel is accessible (sidebar or modal)
- [ ] Changing a color in the theme panel updates the document live via CSS vars
- [ ] The page looks intentional — not a default Quill demo. Basic shell styling applied.
- [ ] Source is organized in a `src/` directory with editor.js and theme.js at minimum
- [ ] No external CDN calls (Quill loaded from local files, not a CDN URL)

## Notes
- Check the existing `quill/` directory first — it may already contain a Quill build
- Start with Quill loaded from local files, not a CDN, since exported HTML must be self-contained
- Theme vars should be defined on `:root` in the main stylesheet from day one
