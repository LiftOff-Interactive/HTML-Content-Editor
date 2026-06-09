# Stage 7 — Post-v1 Feature Additions

## Goal
Extend the v1.0.0 editor with three high-value authoring capabilities that were out of scope for the initial release: a round-trip HTML save format, full rich-text formatting inside widget modals, and first-class image handling (upload, preview, resize) in both the main editor and all widget image fields.

## Features

| File | Feature | Status |
|------|---------|--------|
| `feature-html-roundtrip.md` | Save/Load documents as re-editable HTML | Not started |
| `feature-rich-text-widgets.md` | Bold/italic/size/color/links/lists inside widget content fields | Not started |
| `feature-image-control.md` | Image upload, preview, and drag-to-resize in editor + widgets | ✅ Complete |

## Dependencies & Implementation Order

Implement in this order:

1. **Image control first** — self-contained; touches the image blot and widget modals independently of the others.
2. **Rich text in widgets second** — changes the widget data format (text fields → HTML strings) and bumps the save file version to `v2`. Must be done before anything else that depends on the new schema.
3. **HTML round-trip last** — builds on the final data shape; its save/load logic wraps the v2 JSON schema.

## Save Format Version
Stage 7 introduces a **v2** project schema. The v1 → v2 change: all widget text-content fields that were plain strings become HTML strings (e.g. `"Hello"` → `"<p>Hello</p>"`). The load function will auto-migrate v1 files by wrapping bare strings in `<p>` tags.

## Branch
Work on `stage-7-post-v1`. Merge to `main` when all three features are complete and human-verified.

## Done Criteria
- [x] Feature 1 (Image control) implemented and human-verified ✅
- [ ] Features 2 & 3 implemented and manually tested end-to-end
- [ ] Save format v2 loads correctly; v1 files migrate without data loss
- [ ] No external CDN calls added (all tooling stays self-hosted or already-loaded Quill)
- [ ] Exported HTML files still zero-dependency (image control must base64-encode uploads)
- [ ] Cross-browser smoke test: Chrome, Firefox, Edge
