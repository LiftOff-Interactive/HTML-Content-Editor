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
- [ ] Widget inserts via slash command (`/accordion`) and toolbar dropdown
- [ ] Default state: 3 items with placeholder headers and content
- [ ] Edit modal: toggle `allowMultiple`, add/delete/reorder items, edit header and content per item
- [ ] Expand/collapse works in the editor
- [ ] Expand/collapse works in exported HTML with no external JS
- [ ] Animation is smooth (CSS max-height transition) in both editor and export
- [ ] Accessible: uses `<details>`/`<summary>` HTML elements OR implements full ARIA (`aria-expanded`, `aria-controls`, `role="region"`)
- [ ] Chevron rotates 180° on open

## Implementation Note
Using native `<details>`/`<summary>` is the simplest approach for export — no JS required, accessibility is built in, animation just needs a CSS trick. The trade-off: `allowMultiple: false` (close-others behavior) requires a tiny JS snippet even in export. That's fine — it's a small self-contained script block.

## Open Questions
- [ ] **`<details>`/`<summary>` vs. custom JS**: Native elements are simpler and more accessible. Custom JS gives more animation control. Recommend: `<details>`/`<summary>` with a small script block for the "close others" behavior when `allowMultiple` is false.
- [ ] **Content richness**: Same question as Tabs — plain text or HTML in content areas? Suggest same answer: accept HTML in the textarea for v1.
- [ ] **Icon customization**: Should users be able to pick a custom icon per item (e.g., a numbered circle for process steps)? Out of scope for v1 — use chevron only.
