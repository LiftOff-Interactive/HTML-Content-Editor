# Feature — Carousel / Image Slider Widget

## What It Is
A horizontally scrolling set of slides, each containing an image and optional caption or text overlay. Common in eLearning for showcasing process steps visually, case study images, before/after comparisons, or product screenshots.

## Widget Data Schema
```json
{
  "_v": 1,
  "slides": [
    { "id": "slide-1", "imageData": "data:image/jpeg;base64,...", "altText": "Description", "caption": "Optional caption text" },
    { "id": "slide-2", "imageData": "data:image/jpeg;base64,...", "altText": "Description", "caption": "" }
  ],
  "autoplay": false,
  "showDots": true,
  "showArrows": true
}
```

Note: `imageData` stores the image as a base64 data URI immediately on upload — not a file path.

## Visual Design
- Full-width slide area with aspect ratio preserved (16:9 or 4:3 — use `aspect-ratio` CSS)
- Previous/Next arrows on the sides
- Dot indicators below (one dot per slide, active dot highlighted in `--color-primary`)
- Optional caption below the image
- Smooth slide transition (CSS transform translateX)

## Acceptance Criteria
- [x] Widget inserts via slash command (`/carousel`) and toolbar dropdown
- [x] Default state: 2 placeholder slides (no images — show an "upload image" prompt)
- [x] Edit modal: add/delete/reorder slides, upload image per slide (auto-converted to base64), edit caption and alt text per slide, toggle autoplay, dots, arrows
- [x] Image upload: `<input type="file" accept="image/*">` → reads as base64 via `FileReader`
- [x] Navigation (arrows, dots) works in editor
- [x] Navigation works in exported HTML with no external dependencies
- [x] If no images are uploaded, a placeholder is shown (not a broken image icon)
- [x] Accessible: arrows are `<button>` elements, images have `alt` attributes, dots have `aria-label`

## Image Handling Pattern (Used by All Image Widgets)
```js
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result) // "data:image/jpeg;base64,..."
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
```
Store the full data URI string in the widget data. This ensures images survive save/load and are automatically inlined in the export.

## Open Questions
- [x] **Aspect ratio**: 3-option picker (16:9 / 4:3 / 1:1) in the edit modal. Decided: fixed ratio with user choice.
- [x] **Max image size warning**: No canvas compression in v1. Existing >5MB export warning (from export engine) is sufficient for now.
- [x] **Text-only slides**: Implemented — slides with no image show the caption/text content centered in the slide area.
