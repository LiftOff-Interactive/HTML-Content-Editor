# Stage 4 — Export Engine

## Goal
Build the engine that converts the Quill document into a single, fully self-contained HTML file. This is the most technically complex piece of the project and the most important: if the export doesn't work perfectly, nothing else matters.

## Features in This Stage
- `feature-export.md` — the full export pipeline

## Definition of Done
- [ ] An "Export HTML" button is visible in the app header
- [ ] Clicking it prompts the user to download a `.html` file
- [ ] The exported file opens in a browser with no internet connection and renders correctly
- [ ] The exported file opened in incognito mode (no extensions, no cached assets) renders correctly
- [ ] All text formatting (bold, italic, headings, lists) is preserved
- [ ] All Tier 1 widgets (Callout, Tabs, Accordion, Quote, Timeline) are fully interactive in the export
- [ ] All widget interactions work without Quill or any editor JS present
- [ ] CSS custom property values are resolved and inlined (not left as `var(--color-primary)`)
- [ ] The exported file has no `<link>` tags pointing to external CSS
- [ ] The exported file has no `<script src="">` tags pointing to external JS
- [ ] Images, if any exist in the document, are base64-inlined
- [ ] The exported file is valid HTML5 (passes basic validation)

## Notes
- This stage can run parallel to Stage 3 (Tier 1 widgets) if needed — but full integration testing requires at least one working widget
- Test the export in: Chrome, Firefox, Safari, Edge
- Test embedding the export in an `<iframe>` on another HTML page (simulates SharePoint/Confluence embedding)
- File size test: a typical 5-widget document with no images should be under 200KB
