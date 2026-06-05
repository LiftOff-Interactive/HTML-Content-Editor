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
- [ ] Widget inserts via slash command (`/tabs`) and toolbar dropdown
- [ ] Default state: 3 tabs with placeholder labels and content
- [ ] Edit modal allows: add tab, delete tab, reorder tabs (drag or up/down buttons), edit label, edit content (textarea)
- [ ] Minimum tabs: 2. Maximum: 8 (above 8 the tab bar wraps awkwardly).
- [ ] Clicking a tab in the editor switches the visible panel
- [ ] Active tab state is preserved in widget data
- [ ] Renders and is interactive in exported HTML with no external dependencies
- [ ] Tab content supports basic HTML (bold, italic, links, line breaks)
- [ ] Accessible: `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`

## Open Questions
- [ ] **Content richness**: Should tab content support only plain text, or can it include lists, links, and basic formatting? Suggest: a small textarea in the edit modal that accepts HTML for v1. A full rich text editor per tab panel would be complex.
- [ ] **Vertical tabs variant**: Some designs show tabs on the left instead of across the top. Out of scope for v1 — one layout only.
- [ ] **Tab overflow**: What happens on narrow screens if there are 6+ tabs and they don't fit in one row? Options: wrap to next line, scroll horizontally, show a "more" dropdown. Scroll is simplest for v1.
- [ ] **Edit UX for tab content**: A single modal with a selected-tab concept (click tab name on left, edit content on right) would work well. Avoid opening a separate modal per tab.
