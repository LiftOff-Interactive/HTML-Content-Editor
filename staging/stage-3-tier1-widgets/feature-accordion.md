# Feature — Accordion Widget

## What It Is
A list of expandable/collapsible panels. Each panel has a clickable header that reveals its content. Standard eLearning widget for FAQs, step-by-step breakdowns, and reference content the learner explores at their own pace.

## Widget Data Schema
```json
{
  "_v": 1,
  "allowMultiple": false,
  "items": [
    { "id": "item-1", "header": "What is this?", "content": "Expanded content here.", "open": false },
    { "id": "item-2", "header": "How does it work?", "content": "More content here.", "open": false }
  ]
}
```

**allowMultiple**: if `true`, multiple panels can be open at once. If `false`, opening one closes the others (standard accordion behavior).

## Visual Design
- Each item: a header bar (full-width, clickable) + a content panel below it
- Header: label text on left, chevron icon on right (rotates on expand)
- Content panel: animates open/close (max-height transition)
- Border between items; subtle background on header
- Uses `--color-primary` for the active state

## Acceptance Criteria
- [x] Widget inserts via slash command (`/accordion`) and toolbar dropdown
- [x] Default state: 3 items with placeholder headers and content
- [x] Edit modal: toggle `allowMultiple`, add/delete/reorder items, edit header and content per item
- [x] Image insert in content: "📷 Insert image" button reads a local file, base64-encodes it, and inserts an `<img>` tag at the cursor position in the content textarea
- [ ] Expand/collapse works in the editor — **needs human verification**
- [ ] Expand/collapse works in exported HTML with no external JS — **needs human verification**
- [x] Animation is smooth (CSS grid-template-rows transition) in both editor and export
- [x] Accessible: uses `<details>`/`<summary>` HTML elements
- [ ] Chevron rotates 180° on open — **needs human verification**

## Implementation Note
Used `<details>`/`<summary>` with CSS `grid-template-rows: 0fr → 1fr` transition for smooth animation (overrides browser UA `display:none`). `allowMultiple: false` handled by a self-contained IIFE script block in the export, same pattern as the Tabs widget.

## Open Questions (resolved)
- [x] `<details>`/`<summary>` approach chosen — small IIFE handles close-others in export
- [x] Content: HTML textarea for v1, same as Tabs
- [x] Icon customization: out of scope for v1
- [ ] **Content richness**: Same question as Tabs — plain text or HTML in content areas? Suggest same answer: accept HTML in the textarea for v1.
- [ ] **Icon customization**: Should users be able to pick a custom icon per item (e.g., a numbered circle for process steps)? Out of scope for v1 — use chevron only.
