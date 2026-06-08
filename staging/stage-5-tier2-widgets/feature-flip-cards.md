# Feature — Flip Cards Widget

## What It Is
A set of cards that flip on click to reveal a back face. Classic eLearning widget for vocabulary, term-definition pairs, question-answer reveal, and concept matching.

## Widget Data Schema
```json
{
  "_v": 1,
  "cards": [
    { "id": "card-1", "front": "What is HTML?", "back": "HyperText Markup Language — the structure of web pages." },
    { "id": "card-2", "front": "What is CSS?", "back": "Cascading Style Sheets — controls the presentation and layout." }
  ],
  "layout": "grid",
  "columns": 3
}
```

## Visual Design
- Cards in a responsive grid (2–4 columns)
- Front face: question/term, styled with `--color-primary` accent
- Back face: answer/definition, different background color
- 3D flip animation using CSS `transform: rotateY(180deg)` + `perspective` + `backface-visibility: hidden`
- Card height: fixed (e.g., 200px) so the grid stays uniform

## Acceptance Criteria
- [x] Widget inserts via slash command (`/flip`) and toolbar dropdown
- [x] Default state: 4 cards with placeholder front/back content
- [x] Edit modal: add/delete/reorder cards, edit front and back text per card, set column count (2/3/4)
- [x] Flip animation works in editor
- [x] Flip animation works in exported HTML using pure CSS + a tiny JS click handler
- [x] "Flip All" / "Reset All" buttons — deferred to post-v1 as planned
- [x] Accessible: flip is triggered by click AND keyboard (Enter/Space on focused card)
- [x] Card has `aria-label` describing its state (front/back), updated dynamically on flip

## Open Questions
- [x] **Images on card faces**: Included in v1. Optional `frontImage` (base64 DataURL) stored per card. Upload/replace/remove in modal. Displayed above front text with max-height 80px.
- [x] **Fixed vs. auto height**: Fixed 200px with `overflow-y: auto` on both faces. Back face scrollable if content overflows.
- [x] **Mobile behavior**: No special changes needed — click/tap both trigger the flip via the onclick handler.

## Implementation Notes
- `src/blots/flip-cards.js` — 522 lines
- Schema updated: `frontImage: null` added per card; `layout` field dropped (always grid)
- Editor: "✎ Edit" bar button opens modal (stopPropagation); card clicks flip (stopPropagation); base-class domNode click still reachable in empty areas
- Export: inline `onclick` + `onkeydown`; scoped `<style>` for `.hce-fc-card.is-revealed .hce-fc-inner` transition; `prefers-reduced-motion` handled in both editor and export CSS
- Max 12 cards, min 2

## Status
✓ DONE — human verified 2026-06-05
