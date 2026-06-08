# Feature — Timeline Widget

## What It Is
A linear sequence of events or steps, displayed vertically with connectors between items. Common in eLearning for historical sequences, process flows, and project phases.

## Widget Data Schema
```json
{
  "_v": 1,
  "layout": "vertical",
  "items": [
    { "id": "step-1", "date": "Step 1", "title": "Define the Problem", "content": "Description here.", "icon": "1" },
    { "id": "step-2", "date": "Step 2", "title": "Research Solutions", "content": "Description here.", "icon": "2" },
    { "id": "step-3", "date": "Step 3", "title": "Implement", "content": "Description here.", "icon": "3" }
  ]
}
```

Note: `date` is a label field — it can hold a year, a step number, a month, anything. Not a date type.

## Visual Design
- Vertical line down the center or left side
- Each item: a dot/circle on the line, date label on one side, title + content on the other
- Alternating left/right layout (zigzag) is visually interesting but adds complexity — left-aligned is simpler and works better for step sequences
- For v1: left-aligned layout (dot on left, content to the right)
- Circle can contain a number, an icon, or just a colored dot

## Acceptance Criteria
- [x] Widget inserts via slash command (`/timeline`) and toolbar dropdown
- [x] Default state: 3 items with placeholder content
- [x] Edit modal: add/delete/reorder items, edit date label, title, content per item
- [x] The vertical connecting line renders correctly
- [x] Renders correctly in exported HTML with inline styles, no external deps
- [x] Content areas support basic HTML (bold, italic, links)
- [x] Accessible: uses a semantic list structure (`<ol>` for steps in export; `<div>` in editor — see note)

## Implementation Notes
- Editor render uses `<div>` tags (not `<ol>/<li>`) — Quill's snow CSS forcibly overrides `padding-left` on `li` elements, breaking the dot-to-text spacing
- Export render uses `<ol>/<li>` with `list-style:none` for correct semantics in the exported file
- Connecting line is a `position:absolute` div inside each item, hidden on the last item
- Icon field is free-text (max 2 chars in modal), accepts numbers or emoji
- Connector line uses `--color-border`; dot uses `--color-primary`
- Two-column edit modal (same pattern as Accordion/Tabs): step list left, edit panel right; min 2 / max 8 items

## Open Questions (resolved)
- [x] Horizontal variant: out of scope for v1 — vertical only
- [x] Click to expand: out of scope for v1 — all content visible by default
- [x] Icon field: free-text 1–2 char field, accepts emoji
- [x] Connector style: solid line using `--color-border`
