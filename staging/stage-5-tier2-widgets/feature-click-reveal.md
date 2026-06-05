# Feature — Click & Reveal Widget

## What It Is
Content hidden behind a clickable trigger. The learner clicks a button, label, or image to reveal the answer, explanation, or additional content. Similar to flip cards but more flexible in layout — the reveal can be a text block, a list, or a rich content area below the trigger.

## Widget Data Schema
```json
{
  "_v": 1,
  "items": [
    {
      "id": "reveal-1",
      "triggerLabel": "Click to reveal the answer",
      "triggerStyle": "button",
      "content": "The answer is 42.",
      "revealed": false
    }
  ],
  "layout": "stacked"
}
```

**Trigger styles**: `button` (styled CTA), `label` (plain text link), `card` (full-width clickable panel)

## Visual Design
- Trigger: a styled button or clickable area with a clear affordance (icon, arrow, or "click to reveal" text)
- Revealed content: slides down or fades in below the trigger
- Trigger changes state after reveal (e.g., "Hide answer" label, different color)
- Multiple items stacked vertically

## Acceptance Criteria
- [ ] Widget inserts via slash command (`/reveal`) and toolbar dropdown
- [ ] Default state: 2 items with placeholder trigger labels and content
- [ ] Edit modal: add/delete/reorder items, edit trigger label, select trigger style, edit reveal content
- [ ] Click to reveal works in editor
- [ ] Click to reveal works in exported HTML with no external dependencies
- [ ] Revealed state resets to hidden on page reload (no persistence)
- [ ] Accessible: trigger is a `<button>`, uses `aria-expanded`, reveal panel has `aria-hidden`

## Open Questions
- [ ] **One reveal at a time vs. multiple**: Should revealing one item hide others (accordion-like), or can multiple items be revealed simultaneously? Suggest: multiple simultaneously — more learner-friendly.
- [ ] **Content richness**: Can the revealed content include lists, bold, italic, images? For v1, accept HTML in the content textarea. Images in reveal content would inherit the base64 pattern.
- [ ] **Animation**: Slide down (max-height) or fade in (opacity)? Slide down is more common and gives a clearer sense of "content appearing below." Use CSS transition.
