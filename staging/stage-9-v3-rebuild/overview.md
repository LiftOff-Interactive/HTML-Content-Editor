# Stage 9 — v3 Rebuild (branch: `stage-9-v3-rebuild`)

_Governing brief: `v3_kickoff_prompt.md` (read §0 and §3 first — checkpoint discipline and
the protected Stage 8 export contract). Started 2026-07-02._

## Confirmed build order (human-approved 2026-07-02)

The kickoff's F1–F4 plus the new 11-item facelift list, reconciled and confirmed via
structured questions. **One feature at a time; each needs self-test green + independent
review + human verification before the next starts.**

| # | Feature | Source | Status |
|---|---------|--------|--------|
| F1 | Modal Save-button fix (all widget edit modals) | kickoff | **Code complete + reviewed — AWAITING HUMAN VERIFY** |
| F2 | Whole-document WYSIWYG ⇄ HTML code toggle | kickoff + item 1 | not started |
| F3 | Robust raw HTML import (native import of foreign HTML) | kickoff + item 2 | not started |
| F5 | Document naming (header title field) + full Clear/New button | items 6 + 3 | not started |
| F6 | New widgets: toggle/conditional content, native popover, editable-content box, progress/meter; scroll-snap as an option on the existing carousel | items 7–11 | not started |
| F4 | Styling pass: editor chrome + new opt-in document presets (protected contract untouched) | kickoff + item 4 | not started |
| F7 | Course mode — **plan document only** for now | item 5 | not started |

Decisions locked by the human: scroll-snap = option on existing carousel (not a new
widget); Clear button wipes everything (content + name + theme) behind a confirm;
checkpoint cadence = strict, every feature.

## Protected-contract baselines

`docs/baselines/` — byte-exact Stage 8 export references + SHA-256 hashes + the JS-mode
non-determinism caveat (random tabs/accordion ids, session-scoped car/kc counters).
Re-check after every feature. no-JS hash must match byte-for-byte.

## F1 — what was done (2026-07-02)

- **Harness first**: `_modal_tests.html` (project root) mounts the real editor in an
  iframe, opens all 10 widgets' edit modals with every field stuffed to maximum + list
  items ×6, and asserts the Save button is inside the viewport AND hit-testable
  (`elementFromPoint`) at 600px and 400px viewport heights. Cache-busts all editor
  resources before mounting (a stale memory-cache run produced false pre-fix geometry
  once — never trust a non-busted run). Survives hidden tabs (no bare rAF waits), waits
  for image decode before measuring, reports fatal errors into the matrix, and drives
  each modal's own close path (Cancel → × → Escape) before force-removing.
- **Initial run: 15/20.** Failures: tabs @600 (mini-Quill painted over Save), tabs /
  click-reveal / carousel / hotspot @400 (dialog taller than viewport). Exactly the four
  modals Stage 7 never fixed.
- **Fix**: body div → `display:flex;flex:1;min-height:0;overflow:hidden;` (the proven
  accordion pattern) in the four broken modals; tabs rightCol got `overflow-y:auto`;
  main.css got `.widget-modal-header/.widget-modal-footer { flex-shrink:0 }`.
- **Independent review (8-angle + verify)** found the fix incomplete for hotspot:
  columns didn't scroll, so tall images were unreachable and pin markers (positioned
  against flex-sized `imgArea`) misaligned with click coordinates under height-clamping.
  Fixed: image area is now the scroll container, markers live on an `imgWrap` that
  shrink-wraps the image exactly (empirically verified: marker centers 233/1079 ==
  expected 233/1079; bottom pin reachable by scroll at a 400px viewport); pin form got
  its own scroll path with a 72px pin-list floor.
- All 8 modal-body sites carry a load-bearing comment so `min-height:0` never gets
  "simplified" away.
- **Final state**: `_modal_tests.html` 20/20 · `_nojs_tests.html` 27/27 · no-JS export
  SHA byte-identical to baseline · JS export normalized-identical.

## Named follow-ups (from F1's independent review — schedule before/with F6 widgets)

1. **Shared modal skeleton**: extract the ~40-line overlay/dialog/header/footer/body
   construction (8 near-identical copies) into a shared helper, and/or a
   `.widget-modal-columns` class in main.css so the geometry contract lives in one
   place. Do this BEFORE building the 5 new widgets, or each will clone the skeleton again.
2. **Harness stuffers**: derive stuffed data from each widget's `defaultData`
   (auto-covers new widgets) instead of the hand-written STUFFERS map.
3. **Quill popup containment**: link tooltip / picker dropdowns near the bottom of a
   scrolling modal column can extend past the visible edge — wire Quill's `bounds`
   option in RichTextField.
4. **List UX**: after "+ Add item/tab/slide", scroll the new row into view.
5. **Known trade-off**: without the old min-height floors, dialogs are content-sized and
   re-center when content changes (e.g. switching between image and text-only carousel
   slides). Same behavior the four Stage-7 modals already shipped. Human to judge at
   verification.

## New-widget checklist addition (for F6)

When adding a widget with an edit modal: add its STUFFERS entry (until follow-up 2
lands, the harness fails loudly without it) and re-run `_modal_tests.html` — must stay
100% — alongside the usual `_nojs_tests.html` + baseline hash check.

## Pointer

→ Next action: **human verifies F1** in the live editor (open `_modal_tests.html` over
localhost for the matrix; try tabs/carousel/hotspot edit modals in a short window;
hotspot with a tall image). Then commit is already on `stage-9-v3-rebuild`; approve to
start F2.
