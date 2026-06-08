# Stage 5 — Tier 2 Widgets

## Goal
Build five more complex interactive widgets. These require richer edit UIs, more sophisticated interactions in the export, and in some cases image handling. The export engine from Stage 4 must be working before this stage begins.

## Widgets in This Stage (in build order)
1. `feature-flip-cards.md` — Cards that flip on click to reveal a back face
2. `feature-click-reveal.md` — Content hidden behind a click trigger
3. `feature-carousel.md` — Image/content slider with navigation
4. `feature-hotspot.md` — Image with clickable pin markers
5. `feature-knowledge-check.md` — Simple multiple choice / true-false question

## Definition of Done
- [x] All 5 widgets insert via slash command and toolbar dropdown
- [x] All 5 widgets have fully functional edit UIs
- [x] All 5 widgets render correctly in the editor
- [x] All 5 widgets are interactive in exported HTML with no external dependencies
- [x] All 5 widgets handle images correctly: user-uploaded images are base64-encoded immediately on upload and stored in the widget data (Knowledge Check is text-only — no images needed)
- [ ] Widget data survives a save/load cycle — needs full verification once Knowledge Check is human-verified

## Progress
- [x] Flip Cards ✓ human verified
- [x] Click & Reveal ✓ human verified
- [x] Carousel ✓ human verified
- [x] Hotspot ✓ human verified
- [ ] Knowledge Check — built, awaiting human verification

## Notes
- Image handling is new in this stage. Establish the pattern with Carousel first, then Hotspot reuses it.
- Knowledge Check is the most unique — it has "answer state" (correct/incorrect feedback). This state is ephemeral (resets on page reload) in the export. No grading or score tracking in v1.
- If any Tier 2 widget proves significantly more complex than expected, it may slip to Tier 3 / post-v1 rather than blocking the release.
