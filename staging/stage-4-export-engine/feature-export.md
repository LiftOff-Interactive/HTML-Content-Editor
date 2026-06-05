# Feature — Export Engine

## What It Is
The pipeline that converts the live Quill document into a single, fully self-contained HTML file with zero external dependencies.

## Export Pipeline Steps
1. **Serialize the Quill delta** — get the current document state
2. **Render the full document HTML** — walk the delta, render text content + call `renderExport()` on each widget blot
3. **Collect all CSS** — gather the main stylesheet + all widget-specific styles + resolved theme var values
4. **Resolve CSS custom properties** — replace all `var(--foo)` references with their computed values so the export doesn't depend on the `:root` vars being present
5. **Collect all JS** — gather the minimal widget interaction scripts (no Quill, no editor code)
6. **Inline images** — convert any `<img src="blob:...">` or `<img src="path/...">` to base64 data URIs
7. **Inline fonts** — if non-system fonts are used, fetch and base64-encode the WOFF2 files
8. **Assemble the output** — build the final HTML document with everything inlined
9. **Trigger download** — use a `Blob` + `<a download>` to trigger browser file save

## Output HTML Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document Title</title>
  <style>
    /* Reset + base styles */
    /* Theme values (resolved, no var() references) */
    /* Widget styles (all widgets, even unused ones — small enough) */
  </style>
</head>
<body>
  <main class="hce-content">
    <!-- Rendered document content -->
    <!-- Widget HTML from renderExport() for each blot -->
  </main>
  <script>
    /* Widget interaction scripts (tabs, accordions, etc.) */
    /* No Quill. No editor. Just the interactive runtime. */
  </script>
</body>
</html>
```

## Acceptance Criteria
- [ ] `src/export.js` contains the full pipeline
- [ ] Export button in the app header triggers the download
- [ ] Downloaded `.html` file passes the "no network" test (DevTools → Network tab → offline)
- [ ] Downloaded `.html` file passes the "incognito" test
- [ ] Text formatting (bold, italic, H1–H3, lists) renders correctly
- [ ] All Tier 1 widgets are interactive in the export
- [ ] CSS vars are resolved — open the file, inspect an element, no `var(--...)` values appear in computed styles
- [ ] If the document has a custom font selected, that font renders correctly offline
- [ ] Exported file size for a 5-widget, no-image document is under 300KB

## CSS Custom Property Resolution
This is the trickiest part. CSS custom properties cascade and can reference each other. Strategy:
```js
function resolveCSSVars(css) {
  const root = document.documentElement
  const style = getComputedStyle(root)
  return css.replace(/var\(--[\w-]+\)/g, match => {
    const name = match.slice(4, -1).trim()
    return style.getPropertyValue(name).trim() || match
  })
}
```
Run this on each collected CSS block before inlining.

## Font Handling Strategy
- If `--font-family-body` is a system font (system-ui, Arial, Georgia, etc.) → no embedding needed
- If it's a Google Font or custom font → fetch the WOFF2, base64-encode it, inline as a `@font-face` block
- For v1: support embedding one font family (body font). Heading font is often the same.

## Save/Load (JSON) — Separate from Export
The JSON save format is NOT the export. It's the project file:
```json
{
  "version": 1,
  "title": "Document Title",
  "theme": { "--color-primary": "#2563eb", "--font-family-body": "Inter" },
  "delta": { ... }
}
```
`src/save-load.js` handles this separately from `src/export.js`.

## Open Questions
- [ ] **Widget JS bundling**: Each widget has its own interaction script. Should these be bundled into one `<script>` block in the export, or kept as separate inline scripts? One block is cleaner. Bundle them by concatenating all widget runtime scripts.
- [ ] **Export filename**: Should the filename default to the document title, a timestamp, or always `export.html`? Default to a slugified document title with a timestamp fallback.
- [ ] **Image size warning**: If the exported file will be > 5MB (due to embedded images), should the user be warned before download? Yes — show a warning toast with the estimated file size.
- [ ] **Accessibility of the export**: The export should include `lang="en"` on `<html>`, proper heading hierarchy, and alt text on images. Should we enforce this or just encourage it? Enforce `lang` attribute; alt text is the user's responsibility.
- [ ] **iframe compatibility**: When the export is embedded in a Confluence/SharePoint iframe, some CSS resets from the parent page may affect it. Should the export use a CSS reset or Shadow DOM? CSS reset (`all: initial` on the content container) is the pragmatic choice.
