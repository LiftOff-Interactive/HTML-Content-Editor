# Stage 9 — v3 Rebuild (branch: `stage-9-v3-rebuild`)

_Governing brief: `v3_kickoff_prompt.md` (read §0 and §3 first — checkpoint discipline and
the protected Stage 8 export contract). Started 2026-07-02._

## Confirmed build order (human-approved 2026-07-02)

The kickoff's F1–F4 plus the new 11-item facelift list, reconciled and confirmed via
structured questions. **One feature at a time; each needs self-test green + independent
review + human verification before the next starts.**

| # | Feature | Source | Status |
|---|---------|--------|--------|
| F1 | Modal Save-button fix (all widget edit modals) | kickoff | ✅ human-approved 2026-07-02 |
| F2 | Whole-document WYSIWYG ⇄ HTML code toggle | kickoff + item 1 | **Code complete + reviewed — AWAITING HUMAN VERIFY** |
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

## F2 — what was done (2026-07-02)

- **New `src/delta-html.js`** (`window.HCEDeltaHtml`): reversible delta ⇄ HTML.
  Widgets serialize as readable `<script type="application/hce-widget" data-widget="name">`
  JSON islands (dangerous `<` sequences emitted as `<` JSON escapes). The parser
  runs in an inert `<template>` (no head-hoisting, scripts never execute) with a strict
  allowlist — anything unrepresentable REFUSES with named reasons; nothing is silently
  dropped. Whitespace model: spaces/tabs/NBSP are content (verbatim round-trip);
  newline+indent runs are source formatting. One shared `safeLinkHref` keeps both
  directions symmetric (`about:blank` allowed — it's Quill's own sanitize output;
  protocol-relative `//` refused). `export.js` deliberately untouched (§3).
- **New `src/code-view.js`**: `</> Code` header toggle → monospace textarea; Apply
  parses (errors listed, view stays open, text intact), Discard confirms when dirty;
  Save/Load/Export/insert disabled (state-preserving) while open; re-entry guard;
  `beforeunload` prompt for unapplied edits.
- **New `_codeview_tests.html`**: 27 cases — full-fidelity round-trip with every widget
  + every supported format, code/widget-JSON edits reflecting back, 9 refusal cases
  (script/on*/javascript:/comments/protocol-relative/etc., each asserting no mutation),
  whitespace fidelity, island escaping, UI open/apply/error/cancelled-discard/discard,
  and §3 export invariance across a round-trip.
- **Independent 6-angle review** found and fixed: whitespace/NBSP mutation on unchanged
  apply; silent drop of element-only inline runs (`<a><img></a>`) and of the separating
  space between loose inline elements; the `<!--<script` double-escaped-state island
  bug; link scheme asymmetry stranding docs with pasted links; checklist deltas
  silently coerced; comments silently dropped; missing open() re-entry guard,
  beforeunload guard, and disable/restore state. Security angle verified the allowlist
  fail-closed against case-tricks, tab-smuggled schemes, SVG foreign content and
  template-inertness probes (one hardening applied: `//host` links refused).
- **Discoveries recorded in docs/baselines/README.md**: exports are page-sensitive
  (baseline hash only reproducible from `_nojs_selftest.html` — in-editor checks assert
  before/after invariance instead).
- **Known semantics** (documented, intentional): widget JSON is default-completed on
  apply (deleting a defaulted key resurrects it — same rule as JSON project load);
  widget rich-text fields are author-trusted HTML (same trust model as Load JSON).
- **Final state**: `_codeview_tests.html` 27/27 · `_nojs_tests.html` 27/27 · no-JS
  baseline byte-identical · `_modal_tests.html` 20/20.

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

From F2's independent review:

6. **Export align/link/strike gap (needs explicit human go — touches §3)**: both export
   modes silently drop alignment (toolbar feature!), links and strikethrough that the
   code view now round-trips faithfully. Fixing means changing protected export output —
   its own scoped task with baseline re-capture, never a side effect.
7. **Toast + esc() consolidation**: showToast has 3 drifted copies (export.js,
   save-load.js, code-view.js), the 4-replace HTML escaper has ~12 copies across
   src/. Consolidating touches §3-adjacent files → own re-verified commits.
8. **Shared `_test_harness.js`** for the three (soon four) `_*_tests.html` suites'
   duplicated chrome (addRow/poll/bustCaches/stableStringify) — do before F3's suite.
9. **F3 parser policy hook**: extend `codeToDelta` with a refusal-policy object
   (onUnknownElement/onUnknownAttribute/onUnsafeUrl, default = refuse) so F3's lenient
   import (wrap unknowns in a raw-html blot) extends the same sanitizer-parser instead
   of forking it.
10. **Quill popup containment in modals** (from F1, still open): link tooltip / pickers
    near the bottom of scrolling modal columns can extend past the visible edge — wire
    Quill's `bounds` option in RichTextField.

## New-widget checklist addition (for F6)

When adding a widget with an edit modal: add its STUFFERS entry (until follow-up 2
lands, the harness fails loudly without it) and re-run `_modal_tests.html` — must stay
100% — alongside the usual `_nojs_tests.html` + baseline hash check.

## Pointer

→ Next action: **human verifies F2** in the live editor — click `</> Code`, edit text
and a widget's JSON, Apply; try invalid HTML (see the reasons list); Discard; run
`_codeview_tests.html` (expect 27/27). Then approve to start F3 (robust raw HTML
import), beginning with follow-ups 8–9 as its first commits.
