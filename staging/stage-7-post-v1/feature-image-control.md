# Feature — Image Control (Upload, Preview, Resize)

## What This Is
Two related sub-features:

1. **Main editor images** — Authors can insert images directly into the Quill document body (via toolbar button or drag-and-drop). Images show a preview in the editor and can be resized by dragging a handle.
2. **Widget image fields** — Image fields in carousel, flip cards, and hotspot replace the bare URL text input with a file-picker + URL-input combo, show a live preview in the modal, and support drag-to-resize in the editor after the modal is saved.

Both sub-features store images as base64-encoded data URIs so the exported HTML remains fully self-contained with zero external dependencies.

---

## Sub-Feature 1: Main Editor Images

### User flow
1. Click the **Insert Image** button in the Quill toolbar (or drag an image file into the editor).
2. A file picker opens → user selects an image file.
3. FileReader encodes it as base64 → inserted at cursor as a custom `ResizableImageBlot`.
4. The image renders in the editor with a **resize handle** in the bottom-right corner.
5. Dragging the handle scales the image width (height scales proportionally via `height: auto`).
6. The width is stored in the blot's value and serialised in the delta.

### Custom Blot: `ResizableImageBlot`

**File:** `src/blots/image.js`

Extends `BlockEmbed` (block-level, like our other widgets) rather than overriding Quill's default inline Image blot. This avoids patching Quill internals and keeps the resize chrome outside the contenteditable flow.

```
Structure rendered in the editor:
<div class="hce-image-wrapper" contenteditable="false">
  <img src="data:image/..." style="width: 480px;" alt="">
  <div class="hce-image-resize-handle"></div>
</div>
```

**Blot value shape:**
```json
{ "src": "data:image/png;base64,...", "width": 480, "alt": "" }
```

**`create(value)`** — builds the wrapper div, img, and handle; attaches the resize mouse listener.
**`value(node)`** — reads `src`, `width` from the img, returns the value object.

### Resize interaction
- `mousedown` on `.hce-image-resize-handle` → record start X + start width.
- `mousemove` on `document` → `newWidth = startWidth + (e.clientX - startX)`, clamp to min 60px.
- Apply `img.style.width = newWidth + 'px'`.
- `mouseup` on `document` → clean up listeners; trigger a Quill `text-change` event so the delta is updated.

### Toolbar button
Add a camera/image icon button to the Quill toolbar config in `src/editor.js`:
```js
toolbar: [...existingButtons, ['image']]
```
Override Quill's default image handler:
```js
quill.getModule('toolbar').addHandler('image', () => {
  openImagePicker().then(base64 => {
    const range = quill.getSelection(true);
    quill.insertEmbed(range.index, 'resizable-image', { src: base64, width: 480, alt: '' });
  });
});
```

`openImagePicker()` — creates a hidden `<input type="file" accept="image/*">`, clicks it, returns a Promise that resolves with the base64 data URI via FileReader.

### Drag-and-drop into editor
Listen for `drop` on the Quill container. If `event.dataTransfer.files[0]` is an image, encode it and insert a `ResizableImageBlot` at the drop point. Prevent Quill's default drop handling for files.

### Export
In `export.js`, the `ResizableImageBlot` value is serialised as:
```html
<div class="hce-image-wrapper" style="display:block;">
  <img src="data:image/png;base64,..." style="width:480px;max-width:100%;height:auto;" alt="">
</div>
```
`max-width: 100%` ensures it doesn't overflow on narrow screens. The resize handle div is excluded from the export HTML.

---

## Sub-Feature 2: Widget Image Fields

### Widgets affected
| Widget | Image fields |
|--------|-------------|
| `carousel.js` | Per-slide background image |
| `flip-cards.js` | Optional front-face image per card |
| `hotspot.js` | Background image for the hotspot container |

### Current state
All three use a plain `<input type="text">` for a URL. No preview. No upload.

### New edit modal image field

Replace the URL text input with a compound field:

```
[ Choose file ] or [ Paste URL ___________________ ]

┌──────────────────────────────┐
│                              │  ← live preview (hidden until src set)
│        [image preview]       │
│                              │
└──────────────────────────────┘
         ↙ resize handle
```

**File picker path:** user clicks "Choose file" → file picker (accept="image/*") → FileReader → base64 → stored in the field.

**URL path:** user pastes a URL → `<img>` attempts to load it → on `load` event, show preview. On export, the URL is used as-is (not base64'd). If the author wants zero-dependency export, they should use the file picker.

**Stored value:** a single `src` string — either `data:...` (base64) or an `https://...` URL. The modal doesn't distinguish; the export engine uses whatever is stored.

### Drag-to-resize in widget image fields

Inside the edit modal, the preview image has a resize handle identical to the main editor's. Dragging it updates the `width` value that gets stored alongside `src`:

**Widget image value shape (v2):**
```json
{ "src": "data:image/png;base64,...", "width": "100%" }
```
Width can be `"100%"` (default, full container), a pixel value like `"320px"`, or a percentage like `"60%"`.

The resize handle in the modal adjusts the preview image width. On save, the width is written into the widget data and applied to the `<img>` in both `renderEditor` and `renderExport`.

### `ImageUploadField` utility

**File:** `src/ui/image-upload-field.js`

Reusable class used by all three widget modals:

```js
class ImageUploadField {
  constructor(mountEl, initialValue = { src: '', width: '100%' })
  getValue()   // returns { src, width }
  destroy()    // removes listeners
}
```

`mountEl` is an empty container div inside the modal where the compound field renders itself.

---

## Styling

### Main editor resize handle
```css
.hce-image-wrapper {
  position: relative;
  display: inline-block;
  line-height: 0;
}
.hce-image-wrapper img {
  display: block;
  height: auto;
}
.hce-image-resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 14px;
  height: 14px;
  background: var(--color-primary);
  cursor: se-resize;
  border-radius: 2px 0 0 0;
  opacity: 0;
  transition: opacity 0.15s;
}
.hce-image-wrapper:hover .hce-image-resize-handle,
.hce-image-wrapper.is-resizing .hce-image-resize-handle {
  opacity: 1;
}
```

### Modal image field
```css
.image-upload-field__preview {
  max-width: 100%;
  height: auto;
  display: block;
  margin-top: 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}
.image-upload-field__resize-handle {
  /* same as above */
}
```

---

## Implementation Files

| File | Change |
|------|--------|
| `src/blots/image.js` | **New** — `ResizableImageBlot` (BlockEmbed + resize handle) |
| `src/ui/image-upload-field.js` | **New** — `ImageUploadField` compound field (picker + URL + preview + resize) |
| `src/editor.js` | Add image toolbar button, override default image handler, add drag-drop listener |
| `src/blots/carousel.js` | `edit()` — replace URL input with `ImageUploadField`; `renderEditor`/`renderExport` — apply stored width |
| `src/blots/flip-cards.js` | Same as carousel |
| `src/blots/hotspot.js` | Same as carousel |
| `src/export.js` | Serialise `ResizableImageBlot` with `max-width:100%` safety rule |
| `src/styles/main.css` | Resize handle CSS, image wrapper CSS, modal image field CSS |

---

## Checklist

### Main editor images
- [x] `src/blots/image.js` — `ResizableImageBlot` (create, value, renderEditor output)
- [x] `src/blots/image.js` — resize mouse interaction (mousedown/mousemove/mouseup on document)
- [x] `src/editor.js` — register `ResizableImageBlot` with Quill
- [x] `src/editor.js` — toolbar image button + handler (openImagePicker → FileReader → insertEmbed)
- [x] `src/editor.js` — drag-and-drop image into editor (capture-phase listener prevents Quill double-insert)
- [x] `src/export.js` — serialise ResizableImageBlot to clean HTML with max-width safety
- [x] Main editor CSS — wrapper, handle, hover reveal

### Widget image fields
- [x] `src/ui/image-upload-field.js` — `ImageUploadField` class (file picker, URL input, preview, resize handle)
- [x] `carousel.js` — replace URL input with `ImageUploadField`; apply `width` in render/export
- [x] `flip-cards.js` — same; stores `frontImageWidth` per card
- [x] `hotspot.js` — URL input + "or" span added to image controls; alt text moved to separate row; URL warning badge
- [x] Modal CSS for image upload field (shared `.hce-image-wrapper` / `.hce-image-resize-handle`)

### Cross-cutting
- [x] Manual test: insert image in main editor → resize → export → image correct size in exported HTML
- [x] Manual test: drag image file into editor → inserts correctly (single image, no double-insert)
- [x] Manual test: widget image — upload file → preview shows → save → widget renders with image → export → image in file (base64)
- [x] Manual test: widget image — paste URL → preview shows → URL warning badge appears → save → export uses URL
- [x] Manual test: resize widget image in modal → width stored → reflected in editor and export
- [x] Exported HTML has no broken image references (all base64 or valid URLs)
- [x] Large image files (>2MB): encode without browser hang (FileReader is async, safe)

### Bug fixes applied post-testing
- Drag-and-drop into editor inserted two images — fixed by using capture-phase event listeners (`addEventListener('drop', fn, true)`) so Quill's clipboard module never sees the file drop event.
- Resize handle positioned at container edge rather than image corner — fixed by keeping `wrapper.style.width` in sync with `img.style.width` in both `image.js` and `image-upload-field.js`.
- Carousel image width not reflected after save — fixed by applying `slide.imageWidth` as inline style in `renderEditor` and `renderExport`.

---

## Open Questions
- [ ] Should pasting a URL in the widget image field auto-proxy through base64 (fetch → convert) to guarantee zero-dependency export? Decision: **No** — too complex and breaks CORS on most URLs. Instead, show a warning badge on the field when a URL is detected: "URL images require an internet connection in the exported file."
- [ ] Alt text field for accessibility — add a simple plain `<input>` for alt text below the image upload field in both main editor (on click) and widget modals.
