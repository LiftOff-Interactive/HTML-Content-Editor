# Feature — Hotspot Widget

## What It Is
An image with clickable pin markers placed on specific areas. Clicking a pin reveals a tooltip or popup with text. Used in eLearning for labeled diagrams, anatomy images, equipment identification, and spatial learning.

## Widget Data Schema
```json
{
  "_v": 1,
  "imageData": "data:image/jpeg;base64,...",
  "altText": "Diagram of the human heart",
  "pins": [
    {
      "id": "pin-1",
      "x": 42.5,
      "y": 31.0,
      "label": "Left Ventricle",
      "content": "The left ventricle pumps oxygenated blood to the body."
    }
  ]
}
```

Note: `x` and `y` are percentages of the image dimensions (0–100), so pin positions scale correctly with responsive resizing.

## Visual Design
- Image renders at full container width
- Pins: small circular markers (pulsing animation optional) positioned absolutely over the image
- Clicking a pin: opens a tooltip or popover near the pin with the label and content
- Only one tooltip visible at a time (clicking another pin closes the current one)
- Pins are numbered or use a `+` icon

## Acceptance Criteria
- [ ] Widget inserts via slash command (`/hotspot`) and toolbar dropdown
- [ ] Edit modal: upload image (base64), add/edit/delete pins
- [ ] **Pin placement UI**: In the edit modal, the user clicks on the image to place a pin, then fills in the label and content for that pin
- [ ] Pins render correctly at the correct positions in the editor
- [ ] Clicking a pin shows its tooltip in the editor
- [ ] Clicking a pin shows its tooltip in exported HTML with no external dependencies
- [ ] Pin positions are percentage-based and scale correctly if the container is narrower or wider
- [ ] Accessible: pins are focusable, tooltip content is programmatically associated

## Pin Placement UI (Most Complex Part of This Widget)
In the edit modal:
1. Show the image full-width inside the modal
2. The image has `cursor: crosshair`
3. Click on the image → record `(event.offsetX / img.width * 100, event.offsetY / img.height * 100)` as the pin position
4. A small "new pin" form appears: enter label + content → "Add Pin" button saves it
5. Existing pins are shown as markers on the image; clicking one selects it for editing or deletion

## Open Questions
- [ ] **Tooltip vs. modal on pin click**: Tooltip near the pin is spatially intuitive but limited in content length. A centered modal allows richer content but loses spatial context. Recommend: tooltip for v1, with a max-width of 280px and overflow handling.
- [ ] **Pin pulsing animation**: A CSS pulsing ring around each pin improves discoverability. CSS-only, lightweight. Include in v1.
- [ ] **Multiple open at once**: Should multiple tooltips be visible at once? No — showing one at a time is less cluttered and easier to implement.
- [ ] **Pin numbers vs. icons**: Numbered pins (1, 2, 3...) make the spatial relationship explicit. Icon pins (`+`) are more decorative. Suggest numbered for v1.
