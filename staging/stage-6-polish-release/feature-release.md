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
- [ ] New document state: if the editor is empty, show a welcome message or placeholder prompt ("Start writing, or press / to insert a widget")
- [ ] Toolbar button tooltips (title attributes at minimum)
- [ ] Save/load: confirmation message after save ("Document saved")
- [ ] Export: loading indicator for large documents (base64 encoding can take a moment)
- [ ] Widget placeholders in editor: if a widget has no content yet (just inserted), show a clear "click to edit" prompt inside the blot
- [ ] Error handling: if a widget's data is malformed, show a "widget error" state rather than crashing
- [ ] Browser tab title reflects the document (use the first H1 or a default title)

## Cross-Browser Test Matrix
For each: editor loads, text editing works, all widgets insert, all widgets export correctly.
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest on macOS)
- [ ] Edge (latest)

## Release Steps
1. [ ] Final cross-browser pass
2. [ ] Create demo document with all 10 widgets
3. [ ] Export demo as `demo/demo-export.html` in the repo
4. [ ] Screenshot the editor with the demo content open
5. [ ] Screenshot the exported demo file in the browser
6. [ ] Write the README with those screenshots
7. [ ] Add MIT license (`LICENSE` file)
8. [ ] Create GitHub repository (see `help.md`)
9. [ ] Push all code to `main`
10. [ ] Enable GitHub Pages (see `help.md`)
11. [ ] Tag the release: `git tag v1.0.0` + `git push origin v1.0.0`
12. [ ] Create a GitHub Release from the tag with a changelog

## Open Questions
- [ ] **License**: MIT is the standard choice for a free open tool. Any reason to choose something else (GPL, Apache 2.0)? MIT unless there's a specific reason.
- [ ] **Contributing guide**: Should there be a `CONTRIBUTING.md` separate from the README? Separate file is cleaner for a public repo. Include a "how to add a widget" tutorial with a code template.
- [ ] **Issues template**: GitHub issue templates for bug reports and feature requests (new widget requests) would make the repo more welcoming to contributors. Worth adding before going public.
