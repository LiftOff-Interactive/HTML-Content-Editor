# Stage 4 — Export Engine

## Goal
Build the engine that converts the Quill document into a single, fully self-contained HTML file. This is the most technically complex piece of the project and the most important: if the export doesn't work perfectly, nothing else matters.

## Features in This Stage
- `feature-export.md` — the full export pipeline

## Definition of Done
- [x] An "Export HTML" button is visible in the app header
- [x] Clicking it prompts the user to download a `.html` file
- [ ] The exported file opens in a browser with no internet connection and renders correctly — human verify
- [ ] The exported file opened in incognito mode (no extensions, no cached assets) renders correctly — human verify
- [x] All text formatting (bold, italic, headings, lists) is preserved
- [x] All Tier 1 widgets (Callout, Tabs, Accordion, Quote, Timeline) are fully interactive in the export
- [x] All widget interactions work without Quill or any editor JS present
- [x] CSS custom property values are resolved and inlined (not left as `var(--color-primary)`)
- [x] The exported file has no `<link>` tags pointing to external CSS
- [x] The exported file has no `<script src="">` tags pointing to external JS
- [x] Images, if any exist in the document, are base64-inlined (FileReader DataURLs stored in widget data at insert time)
- [x] The exported file is valid HTML5 (passes basic validation)

## Notes
- Test the export in: Chrome, Firefox, Safari, Edge
- Test embedding the export in an `<iframe>` on another HTML page (simulates SharePoint/Confluence embedding)
- File size test: a typical 5-widget document with no images should be under 200KB — human verify
