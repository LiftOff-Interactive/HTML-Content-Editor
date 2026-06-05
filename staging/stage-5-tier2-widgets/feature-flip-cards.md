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
- [ ] Widget inserts via slash command (`/flipcards`) and toolbar dropdown
- [ ] Default state: 4 cards with placeholder front/back content
- [ ] Edit modal: add/delete/reorder cards, edit front and back text per card, set column count (2/3/4)
- [ ] Flip animation works in editor
- [ ] Flip animation works in exported HTML using pure CSS + a tiny JS click handler
- [ ] "Flip All" / "Reset All" buttons are optional but nice — out of scope for v1
- [ ] Accessible: flip is triggered by click AND keyboard (Enter/Space on focused card)
- [ ] Card has `aria-label` describing its state (front/back)

## Open Questions
- [ ] **Images on card faces**: Should cards support an image on the front face (very common pattern)? Add to the schema as optional `frontImage` (base64). Include in v1 if straightforward, otherwise post-v1.
- [ ] **Fixed vs. auto height**: Fixed height keeps the grid uniform but truncates long text. Auto height makes the grid ragged. Suggest: fixed height with a scrollable overflow on the back face.
- [ ] **Mobile behavior**: On touch devices, "flip" on tap is natural. Does the current flip behavior work well on mobile? Test after export. No special changes likely needed.
