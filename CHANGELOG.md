# Changelog

## Unreleased — Stage 11 "Professionalization"

Implements the July 2026 audit roadmap. Full success/verification criteria in
`staging/stage-11-professionalization/overview.md`.

### Added
- **SCORM 1.2 export** (`Export SCORM` button): dependency-free client-side
  `.zip` (STORE + CRC-32), SCORM 1.2 `imsmanifest.xml` (single SCO, mastery
  score 70), and an injected runtime that finds the LMS API, reports
  `cmi.core.score.raw` from Knowledge Checks (first attempt wins), and sets
  `lesson_status` passed/failed — or `completed` for documents without
  assessment. New suite: `_scorm_tests.html`.
- **Per-widget style overrides**: callout, tabs, accordion, quote, and
  timeline gain per-instance Accent / Background color controls in their edit
  dialogs, honored by the editor preview and both export modes. Unset
  overrides export byte-identically to before (§3-safe, opt-in keys
  `styleAccent` / `styleBg` in widget data).
- **Autosave**: debounced localStorage draft of the full project; restore bar
  on reopen; leave-page warning only when the draft could not be persisted
  (quota). Inert inside iframes so test suites can't clobber a real draft.
- **Toolbar**: link and strikethrough buttons (formats the export/code-view
  contract already supported).
- **Accessibility (WCAG fixes)**: click-to-edit alt text + width modal on
  plain images (1.1.1); pause/play control, hover/focus suspension, and
  `prefers-reduced-motion` respect on autoplaying carousels (2.2.2);
  ArrowLeft/Right/Home/End navigation and full `aria-controls` /
  `aria-labelledby` wiring on exported tabs (2.1.1).
- **CI**: `npm test` runs every `_*_tests.html` suite headlessly (Playwright)
  plus the no-JS baseline hash check; GitHub Actions workflow on push/PR.
- `SECURITY.md`, this changelog, new suite `_stage11_tests.html`.

### Changed
- README links now point at `LiftOff-Interactive` (previously a personal fork)
  and document the new features.
- JS-mode export markup for tabs (ARIA ids + keydown handler), autoplaying
  carousels (pause button + guarded interval), and Knowledge Checks (guarded
  `HCETrack` hook) — intentional, documented JS-mode changes; the protected
  no-JS baseline is unchanged and re-verified byte-identical.

## v3.0.0 — 2026-07-03

See `docs/release_notes_v3.0.0.md`.
