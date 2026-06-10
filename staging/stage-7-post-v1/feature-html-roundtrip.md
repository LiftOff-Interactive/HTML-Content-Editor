# Feature — HTML Round-Trip Save/Load

## What This Is
A new save format that produces a `.html` file which is both:
- **Viewable** in any browser as a normal rendered page (same output as Export)
- **Re-editable** — loadable back into the editor, preserving the full Quill delta and theme

This is separate from:
- The existing **Save JSON** button (machine-readable project file, not viewable)
- The existing **Export HTML** button (viewable but one-way — no editor round-trip)

The trick: embed the project data invisibly inside the exported HTML using a `<script>` tag that browsers ignore for rendering but the editor can read on load.

---

## How It Works

### Saving
1. Run the same export pipeline as the current Export button to generate the full rendered HTML string.
2. Before closing the `<head>`, inject:
   ```html
   <script type="application/json" id="hce-project-data">
   {"version":2,"content":{...QuillDelta...},"theme":{...}}
   </script>
   ```
3. Download the resulting `.html` file (filename from first H1, e.g. `my-course.html`).

### Loading
1. User clicks a new "Load HTML" button (or the existing Load button detects `.html` by file extension).
2. Read the file as text.
3. Parse the HTML string — find `<script id="hce-project-data">` and extract its text content.
4. JSON.parse the content → get `{ version, content, theme }`.
5. Feed into the existing load pipeline (same as loading a `.json` file). Apply version migration if needed.
6. Show an error toast if the tag is missing (i.e. the user tried to load a plain HTML file with no embedded data).

---

## UI Changes

### Header buttons
Add two new buttons next to the existing Save/Load JSON pair:

| Button | Label | Action |
|--------|-------|--------|
| New | `Save as HTML` | Runs export pipeline + embeds project JSON → downloads `.html` |
| New | `Load HTML` | Opens file picker filtered to `.html` → extracts embedded project data |

Alternatively: extend the existing **Save** button into a dropdown (Save JSON / Save HTML) and the existing **Load** button into a dropdown (Load JSON / Load HTML). This keeps the header from getting cluttered. Choose based on how the current header feels when running the app.

### Error states
- Load HTML file with no `hce-project-data` tag → toast: "This HTML file doesn't contain editor project data. Use Export to create viewable-only files."
- Load HTML file with v1 JSON inside → auto-migrate to v2, load normally.

---

## Implementation

### New file: `src/html-roundtrip.js`
Exports two functions:

```js
export function saveAsHtml(delta, theme, title) {
  // 1. Build export HTML (reuse buildExportHtml from export.js)
  // 2. Inject <script id="hce-project-data"> before </head>
  // 3. Trigger download of .html file
}

export function loadFromHtml(fileText) {
  // 1. Parse the HTML string (DOMParser or regex on the script tag)
  // 2. Extract and JSON.parse the project data
  // 3. Return { version, content, theme } or throw if tag missing
}
```

### Changes to `src/save-load.js`
- Import and wire up `saveAsHtml` and `loadFromHtml`
- Add the new Save as HTML / Load HTML buttons (or extend existing buttons into dropdowns)
- Reuse the existing version migration logic that already lives in the load path

### Changes to `src/export.js`
- Extract `buildExportHtml(delta, theme, title)` as a named export so `html-roundtrip.js` can call it without duplicating the pipeline

---

## Checklist
- [x] `export.js` — extract `buildExportHtml` as a named export
- [x] `src/html-roundtrip.js` — `saveAsHtml(delta, theme, title)`
- [x] `src/html-roundtrip.js` — `loadFromHtml(fileText)` with missing-tag error
- [x] `save-load.js` — wire Save as HTML button (dropdown: Save JSON / Save HTML)
- [x] `save-load.js` — wire Load HTML button (dropdown: Load JSON / Load HTML)
- [x] Version migration: v1 JSON embedded in HTML → auto-upgrade to v2
- [x] Error toast when HTML file has no embedded data
- [x] Manual test: save as HTML → open in browser (renders correctly) → load back into editor (delta restored, theme restored, tab title restored)
- [x] Exported `.html` is still zero-dependency (the embed adds no new dependencies)

---

## Open Questions
- [ ] Dropdown vs separate buttons for Save/Load — decide after eyeballing the header at runtime.
- [ ] Should "Save as HTML" also replace the file on subsequent saves (like a real save)? Or always download a new file? For now: always download (consistent with existing Save JSON behavior).
