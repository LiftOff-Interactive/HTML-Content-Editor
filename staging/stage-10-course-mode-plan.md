# Stage 10 — Course Mode: Plan (F7)

_Plan document only — no code. Written 2026-07-03 after F1–F6 landed. This
re-evaluates the abandoned course-mode design against the v3 foundation as it
actually exists now, rather than resuming the old branch (`stage-10-course-mode`,
kept only as reference — its execution quality is what triggered the v3 rebuild)._

## 1. What "course mode" means here

Today a project is ONE scrolling document exported to ONE self-contained HTML
file. Course mode adds **multi-screen** content: several ordered screens the
learner moves through (Next/Back), optionally with a menu, progress indicator,
and completion tracking — still exporting to a **single self-contained HTML file**
with **both export modes** (interactive JS, and no-JS/SharePoint-safe).

This is the long-term target named in the v3 kickoff §4 ("full multi-screen
courses"), explicitly deferred until the foundation landed. It has.

## 2. What the v3 foundation already gives us

The rebuild happened to build most of the primitives course mode needs:

- **Widget/blot architecture** (`BaseWidgetBlot`, registry, `renderExport` +
  `renderExportNoJS`) — a "screen" can be modeled as a container blot, or screens
  can be a document-level construct above the delta.
- **No-JS interaction patterns proven at export**: tabs (radio + `:checked`),
  accordion (`<details name>`), carousel (scroll-snap + `:target` anchor nav),
  knowledge-check (submit-gated grading). **Screen navigation in the no-JS export
  is the same class of problem** — CSS-only paging via `:target` + anchor links,
  or radio + `:checked`, both already shipped and regression-guarded.
- **Whole-document code view + reversible delta⇄HTML serialization**
  (`delta-html.js`) — a model for serializing structured document state.
- **Robust HTML import** (`html-import.js`) — importing a multi-page course from
  foreign HTML becomes reachable once screens exist to import INTO.
- **Document state store** (`doc-state.js`) — the natural home for course-level
  metadata (screen list, titles, settings), already persisted in the v3 payload.
- **Save format v3 with migration discipline** — course data becomes v4 with a
  v3→v4 migration; single-document v3 files load as a one-screen course.
- **The verification harness pattern** (`_test_harness.js` + per-feature
  `_*_tests.html`) and the **protected §3 baseline** — the guardrails that keep
  this from repeating the first v3 failure.

## 3. Two candidate architectures

### A. Screens as a document-level construct (recommended)
A course is an **ordered list of screens**, each screen its own Quill delta,
held in `HCEDocState` (or a new `HCECourse` store). The editor shows one screen
at a time with a screen navigator (add/reorder/delete/rename — the exact
interaction the tabs/carousel/accordion edit modals already implement). Export
walks every screen, emits each into a `<section data-screen>` and wires
navigation once at the document level.

- **Pros:** screens are peers (no nesting limits); the existing single-document
  editor is reused verbatim per screen; export/​import/​code-view extend cleanly;
  no-JS nav is one document-level concern, not per-widget.
- **Cons:** the editor gains a "current screen" mode above Quill; save format and
  every document-level consumer (title, export, code view, import) must become
  screen-aware.

### B. Screens as a container blot
A `course-screens` blot holds child screens inside the single delta.

- **Pros:** no changes to the document/save model; rides the existing blot
  export path.
- **Cons:** a blot containing independently-editable rich documents fights Quill's
  model (nested editors); reorder/navigation UX is cramped; no-JS paging inside a
  blot is awkward. **Not recommended** beyond a trivial "stepper" widget.

**Recommendation:** Architecture A. It matches how authors think about courses and
reuses the most proven code. Model a single document as a one-screen course so
there is exactly one code path.

## 4. No-JS navigation (the protected-contract-shaped question)

Screen paging must work in BOTH exports. Options, all CSS-only and already in the
codebase's vocabulary:

- **`:target` + anchor nav** (carousel already does this): each screen is
  `<section id="screen-3">`; Next/Back/menu are `<a href="#screen-3">`; the active
  screen shown via `:target` with a `:not(:has(:target))` default for screen 1.
  Progress = "you are on N" styled from the same `:target` state.
- **radio + `:checked`** (tabs/hotspot do this): one radio per screen, labels for
  nav. Survives without URL hashes; loses deep-linking.

Interactive (JS) export can layer smoother transitions and real progress/state on
top, but **must degrade to the CSS-only version** — same discipline as Stage 8.
A `_course_nav_tests.html` suite would prove paging works with zero
`<script>`/`on*`/`javascript:` and multi-course scoping holds (à la the current
no-JS suite's C-series).

## 5. Completion / progress (scope tiers)

- **Tier 1 (in-page only):** a progress indicator driven by `:target`/`:checked`
  state (no persistence). Fully no-JS. Ship first.
- **Tier 2 (JS export only):** `localStorage` remembers visited screens / quiz
  results within the learner's browser. Interactive export only; no-JS export
  shows the Tier-1 indicator. No backend (project rule: "Backend: None. Ever.").
- **Tier 3 (SCORM-lite), explicitly out of scope for a first pass:** SCORM/xAPI
  reporting to an LMS is a large surface (SCORM 1.2/2004 runtime API, packaging
  as a zip with imsmanifest.xml) and conflicts with "single self-contained HTML".
  If ever pursued, it is its own project with its own kickoff — not folded in.

## 6. Proposed feature order (each its own reviewed, checkpointed step)

1. **C1 — Screen model + navigator:** `HCECourse` store, per-screen deltas, editor
   screen switcher, v3→v4 migration (single doc = one screen). No export changes
   yet; prove the model round-trips through save/load and the code view.
2. **C2 — Multi-screen export, no-JS-first:** emit all screens + CSS-only paging in
   both modes; `_course_nav_tests.html`; keep the §3 single-document baseline
   byte-identical (a one-screen course must export exactly as a plain document
   does today — this is the protected-contract check for course mode).
3. **C3 — Course chrome:** screen menu/table-of-contents, Tier-1 progress
   indicator, per-screen titles feeding the menu.
4. **C4 — Import a multi-page course:** extend `html-import.js` to split an
   imported document into screens on a chosen boundary (e.g. `<h1>`/`<hr>`/
   `section`), reusing the F3 pipeline per screen.
5. **C5 — Tier-2 progress (JS export):** opt-in `localStorage` progress/quiz memory
   in the interactive export only.

## 7. Risks / open questions for the human

- **Editor UX for "current screen"** is the biggest unknown — a left rail of
  screens? a top screen-tab bar? Worth a quick design pass before C1.
- **Save-format churn:** v4 touches every document-level consumer. Do it once,
  carefully, with the migration test proving all older files still open.
- **§3 contract for one-screen courses:** must stay byte-identical to a plain
  document export, or the promise "your existing docs are unaffected" breaks.
- **Scope creep toward LMS/SCORM:** keep Tier 3 out unless the human explicitly
  scopes it as a separate project.

## Pointer

→ Course mode is **planned, not started**. Begin at C1 only on the human's go,
revisiting this plan (and the old course-mode branch strictly as reference) at
that time. Nothing here is committed to the product roadmap yet.
