# Feature — Tabs Widget

## What It Is
A tabbed content panel where each tab shows different content. Classic eLearning widget for organizing related information into sections the learner clicks through.

## Widget Data Schema
```json
{
  "_v": 1,
  "tabs": [
    { "id": "tab-1", "label": "Overview", "content": "Tab one content here." },
    { "id": "tab-2", "label": "Details", "content": "Tab two content here." },
    { "id": "tab-3", "label": "Resources", "content": "Tab three content here." }
  ],
  "activeTab": "tab-1"
}
```

## Visual Design
- Horizontal tab bar across the top
- Active tab has a bottom border or background fill in `--color-primary`
- Content area below the tab bar switches on click
- Smooth transition (opacity or slide) between panels is a nice touch but not required for v1

## Acceptance Criteria
- [x] Widget inserts via slash command (`/tabs`) and toolbar dropdown — registry wired
- [x] Default state: 3 tabs with placeholder labels and content
- [x] Edit modal: add tab (max 8), delete tab (min 2), reorder via ▲▼, edit label, edit content
- [x] Minimum 2 / Maximum 8 tabs enforced in the modal
- [x] Clicking a tab in the editor switches the visible panel — **human verified ✓**
- [x] Active tab state preserved in widget data via `updateData`
- [x] Renders and is interactive in exported HTML — **human verified ✓**
- [x] Tab content stored as raw HTML (textarea input, no escaping of content)
- [x] Accessible: `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`

## Open Questions (resolved)
- [x] Content: HTML textarea for v1 (user types markup directly)
- [x] Vertical tabs: out of scope for v1
- [x] Tab overflow: horizontal scroll (`overflow-x:auto` on tab bar)
- [x] Edit UX: two-column modal — tab list left, label + content right

## Deferred Enhancements
- **Image inserts in tab content** — ✅ implemented. "📷 Insert image" button in the edit modal reads a local file via `FileReader`, base64-encodes it, and inserts an `<img>` tag at the cursor position in the content textarea.
