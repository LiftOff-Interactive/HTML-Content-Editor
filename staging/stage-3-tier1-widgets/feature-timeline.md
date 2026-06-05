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
- [ ] Widget inserts via slash command (`/timeline`) and toolbar dropdown
- [ ] Default state: 3 items with placeholder content
- [ ] Edit modal: add/delete/reorder items, edit date label, title, content per item
- [ ] The vertical connecting line renders correctly
- [ ] Renders correctly in exported HTML with inline styles, no external deps
- [ ] Content areas support basic HTML (bold, italic, links)
- [ ] Accessible: uses a semantic list structure (`<ol>` for steps, `<ul>` for events)

## Open Questions
- [ ] **Horizontal timeline variant**: A horizontal scrolling timeline is visually interesting for date-based content but tricky on mobile. Out of scope for v1 — vertical only.
- [ ] **Click to expand**: Should clicking a timeline item expand its content (like an accordion)? Adds interactivity but increases complexity. Out of scope for v1 — show all content by default.
- [ ] **Icon field**: The schema has an `icon` field that defaults to the step number. Should users be able to enter an emoji here? Yes — keep it as a free-text field (1–2 characters) that renders inside the circle.
- [ ] **Connector style**: Solid line, dashed line, or dotted? Solid is simplest and clearest. Allow it to pick up `--color-primary` or use `--color-border`.
