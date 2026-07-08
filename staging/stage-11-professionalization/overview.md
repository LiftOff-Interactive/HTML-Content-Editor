# Stage 11 — Professionalization (audit implementation)

_Started 2026-07-07. Implements the July 2026 full audit's findings so every audit
scorecard category reads strong: editor completeness, accessibility, per-widget
styling, LMS interop, engineering process._

## Governing rules (carried over from v3 kickoff §3)

- **Protected contract:** the no-JS export of the reference delta must stay
  byte-identical for documents that use no new feature. Every Stage 11 feature is
  **opt-in or additive** on the export path. Intentional JS-mode export changes
  (which have no absolute hash — see `docs/baselines/README.md`) are listed
  per-feature below and re-verified via the normalized diff.
- Every feature ships with automated verification in the `_*_tests.html` suite
  pattern, and the full pre-existing suite set must stay green:
  `_modal_tests` 30 · `_codeview_tests` 27 · `_import_tests` 15 · `_widgets2_tests`
  22 · `_styling_tests` 13 · `_nojs_tests` 27 · `_export_format_tests` 21 ·
  `_nojs_selftest` baseline hash.
- Independent review: each feature cluster is reviewed/tested by a separate
  Sonnet agent session before being marked done.

## Features, success criteria, and verification

### F1 — Toolbar completeness (link, strikethrough)
**Change:** add `link` and `strike` to the Quill toolbar (`src/editor.js`).
Both formats are already fully supported by `export.js` (baseline v3.1),
`delta-html.js`, and the import pipeline — this only exposes them.
**Scope decision:** blockquote/H4–H6 are deliberately excluded — blockquote is
covered by the Quote widget, and heading depth expansion would ripple through
export, code view, and import contracts for marginal value. Documented here so
the decision is visible.
**Success:** toolbar renders both controls; a linked + struck text run survives
editor → export (both modes) → code view → re-apply unchanged.
**Verification:** `_stage11_tests.html` T1.x; `_codeview_tests` and
`_export_format_tests` stay green. Export contract: **no change** (formats
already in baseline v3.1).

### F2 — Autosave (localStorage draft + restore + beforeunload)
**Change:** new `src/autosave.js`. Debounced (2s) write of the full v3 save
payload to `localStorage['hce.autosave.v1']` on text/theme/title change; on boot,
if a draft exists, a restore bar offers Restore / Discard; `beforeunload` warns
when unsaved changes exist. Quota overflow (base64-image-heavy docs) degrades
gracefully: warn once, keep editing.
**Success:** close tab with unsaved content → reopen → one click restores
content, theme, title, document styles. No draft → no prompt. Discard clears.
**Verification:** `_stage11_tests.html` T2.x (payload write, restore round-trip,
quota-failure path). Export contract: **no change**.

### F3 — WCAG fixes (image alt UI · carousel pause · tabs keyboard nav)
**Changes:**
- `ResizableImageBlot` gets a click-to-edit modal (alt text + width) via the
  existing `WidgetModal` + `widget-updated` sync (WCAG 1.1.1).
- Carousel JS export: when `autoplay` is on, render a Pause/Play button,
  suspend on hover/focus, and skip autoplay under `prefers-reduced-motion`
  (WCAG 2.2.2). No-JS export never autoplays — unaffected.
- Tabs JS export: `ArrowLeft/ArrowRight/Home/End` keyboard navigation on the
  tablist (WCAG 2.1.1 / APG tabs pattern).
**Success:** any inserted image's alt is settable and round-trips through
save/export; autoplaying carousels are always pausable; exported tabs are
arrow-navigable.
**Verification:** `_stage11_tests.html` T3.x. Export contract: no-JS hash
**unchanged** (autoplay defaults off; tabs/carousel changes are JS-mode only —
intentional JS-mode change, re-checked via normalized diff).

### F4 — Per-widget styling (opt-in per-instance overrides)
**Change:** shared infrastructure + first five widgets (callout, tabs,
accordion, quote, timeline).
- `WidgetModal` gains `divider` and `optcolor` field types (checkbox-enabled
  color override — same interaction as the theme panel's opt rows).
- Widget data gains an optional `style` object (e.g. `{ accent: '', background: '' }`);
  absent/empty keys mean "inherit theme" — **unset overrides must export
  byte-identically to today**.
- Both export modes and the editor preview honor the overrides (editor via
  per-instance CSS custom properties consumed by `main.css`).
**Success:** an author can recolor one callout/tab-group/accordion/quote/timeline
without touching the global theme; documents that never touch style controls
export byte-identically.
**Verification:** `_stage11_tests.html` T4.x, including the invariance check:
reference delta with no overrides → editor-page no-JS hash still
`45aed5939bbe…`. Save format: **stays v3** (additive optional key inside
widget data, ignored harmlessly by older loads).

### F5 — SCORM 1.2 export (LMS interop with score reporting)
**Change:** new `src/scorm.js` (+ `src/zip.js`, a dependency-free STORE-method
zip writer with CRC-32). New "Export SCORM 1.2" action. Package =
`imsmanifest.xml` (SCORM 1.2, single SCO) + `index.html` (the standard JS
export with an injected SCORM runtime: API discovery up the frame chain,
`LMSInitialize`, completion on load, score/status from Knowledge Checks,
`LMSCommit`/`LMSFinish` on unload).
- Knowledge Check JS-export submit handler additionally calls a guarded
  `window.HCETrack.record(...)` hook (no-op outside SCORM export) — an
  intentional, documented JS-mode export change.
**Success:** exported `.zip` contains a schema-valid manifest whose resource
href launches; in a mock-LMS harness (parent `window.API`), opening the SCO
initializes, answering all KCs sets `cmi.core.score.raw` and
`cmi.core.lesson_status` (`passed`/`failed`≥/<70, or `completed` when no KCs).
**Verification:** new `_scorm_tests.html` (zip structure parse, manifest XML
assertions, iframe mock-API interaction test). No-JS contract: **unchanged**.

### F6 — Engineering (CI, headless tests, repo hygiene)
**Change:** `package.json` + `scripts/run-tests.mjs` (Node http server +
Playwright headless Chromium, opens every `_*_tests.html`, polls the summary,
exits non-zero on any failure) + `.github/workflows/tests.yml`; README repo
links fixed (`Frankyface` → `LiftOff-Interactive`); `SECURITY.md`;
`CHANGELOG.md`.
**Success:** `npm test` runs the entire suite set headlessly and fails loudly;
CI runs it on push/PR.
**Verification:** local `npm test` run passes with all suites green.

## Verification states (the definition of "done" for the stage)

1. `npm test` green across **all** suites, old and new.
2. `_nojs_selftest.html` baseline hash byte-identical (`8792330f…`).
3. Editor-page invariance hash (`45aed593…`) intact with style controls untouched.
4. Independent Sonnet agent review of each feature cluster's diff + a final
   whole-stage review, with findings fixed or explicitly dispositioned.
5. `handoff.md` pointer updated; this file records per-feature outcomes.

## Feature log

- **2026-07-07 — F1–F5 built, self-tested, committed** (commits 6a171af…c0a8112).
  - F1 ✅ toolbar link + strike (`editor.js`); blockquote/H4–H6 excluded per plan.
  - F2 ✅ `src/autosave.js`; design delta from plan: the `beforeunload` warning
    fires only when the synchronous flush FAILED (quota/unavailable) — if the
    draft persisted, leaving is safe and a warning would be noise.
  - F3 ✅ image alt/width modal (`image.js` + `editor.js` delegation, resize-
    click suppression); carousel pause + reduced-motion + hover/focus suspend
    (autoplay-gated, so default exports unchanged); tabs Arrow/Home/End nav +
    aria-controls/labelledby (JS mode only).
  - F4 ✅ `src/ui/style-controls.js` + modal `divider`/`optcolor` field types;
    five widgets wired in editor preview + both export modes. Hardening: 
    override values from project JSON pass a SAFE_COLOR allowlist at the
    single `resolve()` chokepoint (they bypass CSSOM, unlike theme vars —
    injection regression tests in `_stage11_tests.html`).
  - F5 ✅ `src/zip.js` + `src/scorm.js` + guarded `HCETrack` hook in
    `knowledge-check.js` (first-attempt-wins). Mock-LMS verified: incomplete →
    passed/failed transitions, % score, completed for no-KC documents.
  - F6 ✅ `npm test` headless runner (11 suites), GitHub Actions, README →
    LiftOff-Interactive, SECURITY.md, CHANGELOG.md, `_config.yml` excludes.
  - **Gotcha (repeat of stage-9 lesson):** the blot-loading suite pages
    (`_nojs_*`, `_rich_sanitize`, `_import`, `_export_format`) keep their own
    script lists — adding a blot dependency (`style-controls.js`) without
    updating them made all five styled widgets render error boxes in those
    pages and "drifted" the bare-page baseline. Script lists must mirror
    `index.html`.
  - **Verification state:** `npm test` → **11/11 suites green, 288 cases**,
    `_nojs_selftest` baseline **byte-identical** (`8792330f…`), editor-page
    invariance hash intact. Independent Sonnet review/QA agents: see below.
