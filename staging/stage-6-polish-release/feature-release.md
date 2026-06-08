# Feature — Polish & v1 Release

## README Requirements
The `README.md` must contain:
- [ ] Project name + one-sentence description
- [ ] Screenshot or GIF of the editor in use (essential for GitHub discoverability)
- [ ] Screenshot of an exported page showing widgets
- [ ] Feature list (bullet points, what it does)
- [ ] "How to use" section: open index.html, write content, insert widgets, export
- [ ] Widget gallery (list all 10 supported widgets)
- [ ] "How to run locally" (literally: download the repo, open index.html)
- [ ] "How to contribute" (add a new widget: extend BaseWidgetBlot, register in registry)
- [ ] License badge
- [ ] Link to live GitHub Pages demo

## UX Polish Checklist
- [x] New document state: editor shows placeholder "Start writing, or press / to insert a widget"
- [x] Toolbar button tooltips — `title` attributes on Save, Load, Export HTML, and Insert Widget buttons
- [x] Save/load: Save and Load buttons in header; "Saved ✓" confirmation flashes green for 3s; "unsaved" state tracked after user edits
- [x] Export: button shows "Exporting…" + disabled during export; restores on completion; error toast on failure
- [x] Widget placeholders in editor: base class default `renderEditor` already shows icon + label placeholder for unimplemented blots
- [x] Error handling: `renderEditor` wrapped in try/catch in `attach()` and `updateData()`; shows `.widget-error` red panel on malformed data; click still opens edit modal
- [x] Browser tab title reflects the document — updates live from the first H1; falls back to "Content Editor"

## Cross-Browser Test Matrix
For each: editor loads, text editing works, all widgets insert, all widgets export correctly.
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest on macOS)
- [ ] Edge (latest)

## Release Steps
1. [x] Human-verify UX polish in browser (Save/Load, tab title, export loading state, "Saved ✓" flash)
2. [x] Create demo document with all 10 widgets populated with real content
3. [x] Export demo as `demo/demo-export.html` in the repo
4. [x] Screenshot the editor with the demo content open → `docs/screenshots/editor.png`
5. [x] Screenshot the exported demo file in the browser → `docs/screenshots/export.png`
6. [x] Write the README with those screenshots
7. [x] Add MIT license (`LICENSE` file)
8. [x] Add `CONTRIBUTING.md` with "how to add a widget" tutorial and code template
9. [x] Create GitHub repository — https://github.com/Frankyface/HTML-Content-Editor
10. [x] Push all code to `main`
11. [x] Enable GitHub Pages — https://frankyface.github.io/HTML-Content-Editor/
12. [x] Tag the release: `git tag v1.0.0` + `git push origin v1.0.0`
13. [x] Create a GitHub Release from the tag with a changelog — https://github.com/Frankyface/HTML-Content-Editor/releases/tag/v1.0.0

## Open Questions
- [x] **License**: MIT — no reason to choose otherwise.
- [ ] **Contributing guide**: Separate `CONTRIBUTING.md` with a "how to add a widget" code template. Include the 4-step pattern: extend `BaseWidgetBlot`, implement `renderEditor` + `renderExport` + `edit`, set static metadata fields, call `WidgetRegistry.register(MyBlot)`.
- [ ] **Issues template**: GitHub issue templates for bug reports and feature requests (new widget requests). Worth adding before going public.

## Save/Load File Format (implemented)
```json
{
  "version": 1,
  "content": { "ops": [...] },
  "theme": {
    "--color-primary": "#2563eb",
    "--font-family-body": "Georgia, 'Times New Roman', serif"
  }
}
```
Filename is slugified from the first H1 (e.g. `my-course.json`). Version `1` guard on load — mismatches show a toast rather than silently loading corrupt data.
