# v3.0.0 Kickoff Prompt (v2) — HTML Content Editor

_Paste-ready brief for a brand-new session that will build v3. Read it top to bottom before writing any code. This is a rewrite of a first attempt that was abandoned — §0 explains why. Do not skip §0; it is the whole point of this version of the prompt._

---

## 0. Why this is a rewrite — read this first

A first attempt at v3 was fully reverted. Not because any single feature was unfixable, but because **the execution quality on the early work was weak, and every subsequent feature kept building on top of that weak base instead of the problems getting caught and fixed.** Automated self-tests were written by the same process that wrote the code, reported green, and were trusted without independent scrutiny. By the time a human looked hard at the result, four features and a course-mode engine were stacked on a shaky foundation, and the only honest fix was to throw it all away and restart.

**This must not happen again. Concretely, that means:**

1. **One feature at a time, fully closed out, before the next begins.** Do not build F1 through F4 (or course mode) in one long autonomous run and report at the end. Finish F1. Stop. Get it reviewed and confirmed. Only then start F4 (or whatever is next).
2. **Self-tests are necessary, not sufficient.** A test suite written by the same effort that wrote the feature can share its blind spots. After the self-test is green, get an **independent review pass** — use the `code-reviewer` agent (or equivalent fresh-eyes review) against the actual diff, not against the feature's own description of itself. Treat CRITICAL/HIGH findings as blocking.
3. **Show the human real evidence, not a claim.** A checkpoint means a screenshot of the running app, the actual test-matrix output, or a concrete diff — not "F1 is done and verified." If something is best-effort or unverifiable, say so plainly; do not round up to "done."
4. **If a foundation feels shaky while building on it, stop and say so.** Do not paper over a weak base with more features. Flag it and get direction before continuing.
5. **The original Stage 8 SharePoint export is a frozen, protected contract** (see §3). It was good. It must come out of v3 exactly as good, unless a task explicitly says to change it — and if one does, that change gets its own explicit review, not a side effect of an unrelated styling pass.

If you (the session reading this) find yourself wanting to skip the review/checkpoint step "because the tests pass and it'll save time" — that instinct is exactly what caused the last rebuild. Don't.

---

## 1. Read first

1. `handoff.md` — current real state. As of this rewrite: **local `main` and `origin/main` are both at Stage 8** (JS-free SharePoint export, v2.0.0 + Stage 8, shipped). Nothing from a prior v3 attempt is merged anywhere you'll see by default.
2. `docs/master_plan.md` — the product vision.
3. `CLAUDE.md` — session rules and conventions.
4. The Stage-8 verification artifacts (still present, unmodified): `_nojs_tests.html` (27-case no-JS suite) and `_nojs_selftest.html`.
5. A prior design pass exists in git history only (branches `stage-9-v3-foundation`, `stage-10-course-mode`, tags `backup/main-before-revert-to-stage8`, `backup/stage-10-course-mode`) — **treat this as reference material to consult for ideas, not as a base to merge or trust.** Its execution quality is exactly what triggered this rewrite. If you look at it, re-implement and re-review anything you take from it; do not assume it is correct because it existed.

Then, per `CLAUDE.md`: summarize your understanding in 3 bullets and confirm the build order with the human **before** touching code.

---

## 2. What this project is (context)

A free, self-hosted, **vanilla-JS, no-build** WYSIWYG tool. Quill 2 with custom `BlockEmbed` "blots" (widgets), a versioned JSON save format (currently v2), and **two export paths**:
- **Export HTML** — interactive, includes per-widget JavaScript.
- **Export for SharePoint** — `renderExportNoJS(container, data, ctx)` per widget emits **HTML+CSS only** (radio/`:checked`, `<details>`, `:has()`, scroll-snap). Verified zero `<script>`/`on*=`/`javascript:`. **This is the feature the user explicitly said they liked. Protect it (§3).**

Current state: v2.0.0 + Stage 8 shipped, `main` and `origin/main` in sync at commit `d9e0b96` (or later if a fast-path fix landed since — check `handoff.md`).

---

## 3. The protected contract: Stage 8's SharePoint export

Before touching anything, **capture a baseline**: run `_nojs_tests.html` and `_nojs_selftest.html` against the current `src/export.js` + `src/blots/*.js`, and save the exported HTML output for a document containing one of every widget (this is what `_nojs_selftest.html` already builds). This is your reference.

**Rule for the rest of v3:** no change to any widget's `renderExportNoJS`, to `export.js`'s no-JS code path, or to the CSS tokens that path reads (`--widget-border-radius`, `--widget-shadow`, etc.) is allowed to alter the **visual appearance or behavior** of the no-JS export unless a task explicitly says so. If a later feature (e.g., a styling pass) wants to change how exported widgets look, that is a **separate, explicitly-scoped, explicitly-reviewed decision** — not a side effect of touching shared theme tokens. Default to additive: new presets, new opt-in tokens — not rewriting the baseline defaults every widget's no-JS export reads.

**Verification for every feature touching anything near export code:** re-run `_nojs_tests.html` (must stay 27/27) AND diff the exported HTML output byte-for-byte (or at minimum, screenshot-diff) against the baseline captured above. A green test count is not enough — confirm the actual output didn't drift.

---

## 4. v3 vision

Evolve the editor to also **open existing HTML, edit it structurally, and re-export it self-contained and SharePoint-safe (no-JS)** — without touching the protected export contract (§3) and without degrading the simple, working editor UI.

**Locked product decisions (do not relitigate):**
- HTML import: robust raw import first; smart pattern→widget mapping is a later phase.
- Code view: whole-document source toggle (enhanced `<textarea>` first; a vendored syntax-highlighting editor is an optional later polish).
- Styling: editor chrome may be polished, but **never at the cost of the protected export contract (§3)**.
- Editing ambition: full structural editing (add/remove/reorder sections) — eventually. Do not front-load this before F1–F2 are solid.
- File scale: full multi-screen courses are the long-term target, but **do not attempt this until the foundation (F1, F2, F3 Phase 1) is independently reviewed and confirmed solid.** Course mode is explicitly out of scope for the first pass at this rebuild unless the human says otherwise after seeing the foundation land well.

**Engineering constraints (non-negotiable):**
- Vanilla JS, no build step. Any new library must be vendorable as a prebuilt file.
- Both export modes keep working; the no-JS export keeps emitting zero `<script>`/`on*=`/`javascript:` **and matches the §3 baseline**.
- Save format bumps to version 3 for any new persisted data, with a v2→v3 migration in `src/save-load.js`; confirm old files still load.
- CSS custom properties only. Files 200–400 lines typical / 800 max. Functions < 50 lines.

---

## 5. The features

Build in this order. **Do not start feature N+1 until feature N has passed self-test, passed independent review, and been checkpointed with the human (§0).**

### F1 — Fix: edit modals hide the Save button
**What:** in some widgets the rich-text editor pushes the Save button out of reach — a tall body exceeds the dialog height and the dialog's `overflow:hidden` clips the footer.
**Where to look:** `src/ui/modal.js` (generic modal — check it first; it may already be correct) and each widget's bespoke `_openEditModal` (`src/blots/tabs.js`, `carousel.js`, `hotspot.js`, `click-reveal.js`, `accordion.js`, `flip-cards.js`, `knowledge-check.js`, `timeline.js`). Do not assume any of these are already fixed — verify each one directly by opening its modal and stuffing it with content; do not trust a description of prior work.
**Fix shape:** the modal body should be the single scroll region (`flex:1; min-height:0; overflow-y:auto` or delegate scroll to an inner column), header/footer `flex-shrink:0`, footer always visible regardless of body content height.
**Success:** in every widget with an edit modal, with maximum content and at viewport heights of ~600px and ~400px, Save and Cancel are always visible and clickable.
**Verification:** open each widget's edit modal for real (via a browser preview, not just reading code); stuff every rich-text/text field with long content; assert the footer's bounding box is inside the viewport and the Save button is hit-testable (e.g. `elementFromPoint`), at two viewport heights. This is a good candidate for the `_modal_tests.html`-style automated harness (mount `index.html` in an iframe, drive it, assert computed geometry) — build one if it doesn't exist.

### F2 — Whole-document WYSIWYG ⇄ code toggle
**What:** one control flips the entire document between the visual editor and an editable HTML source view, and back, losing nothing — including widgets.
**Approach:** define a reversible serialization. Widgets already carry `data-widget-type` + `data-widget-data` in the DOM (`src/blots/base.js`). Reuse (or extract, if it doesn't already exist as a shared function) the delta→HTML walk in `src/export.js` for one direction; write the HTML→delta parser for the other, rebuilding widget embeds from those attributes. Sanitize anything coming from the source view (a vendored DOMPurify or equivalent) before it re-enters the document. Handle invalid HTML on switch-back by refusing the toggle and telling the user why — never silently drop content.
**Success:** round-trip `delta → code → delta` preserves every widget's type+data and all text formatting; editing text in code reflects back visually; invalid HTML is reported without data loss; **both export modes still work identically after a round-trip, and `_nojs_tests.html` stays 27/27 with byte-identical no-JS output** (§3).
**Verification:** build a doc with one of every widget plus headings/lists/bold/links; toggle to code and back; assert delta equivalence; edit a text node in source, toggle back, assert the change applied; feed malformed HTML, assert graceful refusal; diff the no-JS export before vs. after the round-trip.

### F3 Phase 1 — Robust raw HTML import
**What:** load any HTML file without crashing or silently losing content. Map recognizable nodes (headings, paragraphs, lists, bold/italic/underline, links, images, blockquotes) to native content/blots. Wrap every unrecognized subtree in a new `raw-html` blot (rendered, editable via the F2 code view). Capture `<head>`/`<style>` into a document-styles store so the export pipeline can re-emit the imported look. Sanitize on the way in (strip `<script>`, `on*`, `javascript:`).
**Success:** importing any file throws nothing, drops no content (produce a simple kept-vs-dropped report), renders recognizably, and exports self-contained + no-JS-clean (zero script/on*/javascript:, no external CDN references).
**Verification:** use the four real fixtures already copied into `fixtures/` in this repo (a self-contained ARIA-tabs component, a Bootstrap-CDN component page, a 592KB multi-screen course, and a 5.5MB course with 24 embedded images). For each: import → no throw, no silent content loss, recognizable render, clean self-contained/no-JS export. Note the 5.5MB file's import time; it should not hard-freeze the UI — if it's slow, say so honestly rather than hiding it.

### F4 — Styling pass, editor chrome ONLY
**What:** improve the editor's own visual polish (header, sidebar, modals, toolbar). **Explicitly does NOT touch widget/export default styling or the tokens the no-JS export reads (§3).** If a "Showcase"-style preset is wanted for exported documents, it must be a genuinely new, opt-in preset — never a change to what existing exports look like by default.
**Success:** editor chrome looks intentional at 320/768/1024/1440; no change whatsoever to exported HTML output for a document that doesn't opt into a new preset (verify via the §3 diff); old v2 project files still load with sane defaults.
**Verification:** screenshots at all four breakpoints; re-run the §3 export-diff check and confirm zero delta; load a pre-v3 project file and confirm it renders correctly.

**Course mode (import Phase 2, structural editing, multi-screen courses) is deferred.** Do not start it until F1–F4 above are each independently reviewed, checkpointed, and confirmed solid by the human. When that time comes, this prompt should be revisited/extended — don't assume the old course-mode design work is still the right approach without re-evaluating it.

---

## 6. The verification discipline (REQUIRED for every feature, no exceptions)

1. **Write success criteria** for the feature — explicit, measurable.
2. **Enumerate verification cases** — concrete scenarios, edge cases, regression cases (existing widgets + both export modes), and the §3 export-diff check where relevant.
3. **Build or extend an automated browser self-test** (see `_nojs_tests.html` for the style): mount in an isolated iframe; **await the real content load**, not the initial `about:blank` load; **kill CSS transitions/animations before measuring** (`* { transition:none !important; animation:none !important }`) — both were real false-negative traps previously. Emit a pass/fail matrix with an evidence string per case.
4. **Run it live** over localhost in a real browser; capture a screenshot or concrete output.
5. **Fix until 100% green**, distinguishing harness bugs from real bugs.
6. **Get an independent review pass** on the actual diff (the `code-reviewer` agent or equivalent) before calling the feature done. This is the step that was skipped last time. Do not skip it now. Resolve CRITICAL/HIGH findings.
7. **Checkpoint with the human**: show the matrix, the screenshots, and an honest list of anything best-effort or unverified. Do not describe unverified work as done.
8. Only then update `handoff.md`, and only then start the next feature.

---

## 7. Fixtures & test assets

- `_nojs_tests.html`, `_nojs_selftest.html` — Stage 8's regression guard. Must stay green throughout.
- `fixtures/` — already contains the four import test files for F3 (check what's there before re-copying).
- Preview: `.claude/launch.json`, if present, defines a local server config; otherwise `python -m http.server` from the project root.

---

## 8. Definition of done for this rebuild

F1 fixed and verified with real browser evidence + independent review. F2 round-trips losslessly with the §3 export-diff proving zero drift. F3 Phase 1 imports all four fixtures with no content loss. F4 improves editor chrome with **provably zero** change to export output. Each landed one at a time, each reviewed, each checkpointed — not delivered as one big autonomous batch at the end.
