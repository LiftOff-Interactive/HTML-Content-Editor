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
- [x] Widget inserts via slash command (`/click` or `/reveal`) and toolbar dropdown
- [x] Default state: 2 items with placeholder trigger labels and content
- [x] Edit modal: add/delete/reorder items, edit trigger label, select trigger style, edit reveal content
- [x] Click to reveal works in editor
- [x] Click to reveal works in exported HTML with no external dependencies
- [x] Revealed state resets to hidden on page reload (no persistence — tracked only in DOM, not widget data)
- [x] Accessible: trigger is a `<button>`, uses `aria-expanded`, reveal panel has `aria-hidden`

## Open Questions
- [x] **One reveal at a time vs. multiple**: Multiple simultaneously — each item is independent.
- [x] **Content richness**: HTML accepted in content textarea; image insert button (FileReader → base64) available in modal.
- [x] **Animation**: Slide down via `max-height` + `opacity` transition. `prefers-reduced-motion` respected in both editor and export CSS.

## Implementation Notes
- `src/blots/click-reveal.js` — 490 lines
- Three trigger styles: `button` (filled primary), `label` (text underline), `card` (outlined panel)
- Arrow ▼ rotates 180° via CSS `.is-revealed .reveal-arrow { transform: rotate(180deg) }` — no JS needed for the arrow
- Export: inline `onclick` scoped via `data-reveal-item` / `data-reveal-content` attributes; `<style>` block for slide-down + arrow rotation + `prefers-reduced-motion`
- Max 12 items, min 1
- `revealed` state is NOT stored in widget data — ephemeral DOM-only state

## Status
✓ DONE — human verified 2026-06-05
