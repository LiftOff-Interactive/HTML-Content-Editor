# v3.0.0 Kickoff Prompt — HTML Content Editor

_Paste-ready brief for a brand-new session that will build the entirety of v3. Read it top to bottom before writing any code._

---

## 0. Read first (in this order)

1. `handoff.md` — the head of the linked list; current real state.
2. `docs/master_plan.md` — the product vision.
3. `CLAUDE.md` — session rules and conventions.
4. The **v3 design doc** (authoritative implementation detail, consolidating the full design research for all features + course mode): `docs/v3_master_plan.md`. If it is missing, this kickoff prompt is self-contained enough to proceed — but prefer the design doc when present.
5. The Stage-8 verification artifacts you will reuse: `_nojs_tests.html` (27-case no-JS suite) and `_nojs_selftest.html`.

Then, per `CLAUDE.md`: summarize your understanding in 3 bullets and confirm the build order with the human **before** touching code.

---

## 1. What this project is (context)

A free, self-hosted, **vanilla-JS, no-build** WYSIWYG tool. Quill 2 with custom `BlockEmbed` "blots" (widgets), a versioned JSON save format, and a **single self-contained HTML export**. As of v2.0.0 + "Stage 8" it has 11 widgets and **two export paths**:
- **Export HTML** — interactive, includes per-widget JavaScript.
- **Export for SharePoint** — `renderExportNoJS(container, data, ctx)` per widget emits **HTML+CSS only** (radio/`:checked`, `<details>`, `:has()`, scroll-snap). Verified zero `<script>`/`on*=`/`javascript:`. **This is the output contract v3 must preserve.**

Current state: v2.0.0 + Stage 8 are shipped and pushed to `main`.

---

## 2. v3 vision

Evolve the editor from a widget-authoring tool into one that can **open existing HTML, edit it structurally, and re-export it self-contained and SharePoint-safe (no-JS)** — without losing the widget-authoring workflow.

**Locked product decisions (do not relitigate):**
- HTML import: **robust raw import first, smart pattern→widget mapping in a later phase.**
- Code view: **whole-document source toggle** (enhanced `<textarea>` first; vendored CodeMirror is an optional later polish).
- Styling: **both surfaces** — polish the editor chrome AND the widget/export output, plus a new "Showcase" theme preset.
- Editing ambition: **full structural editing** (add/remove/reorder sections).
- File scale: **up to full multi-screen courses** (hundreds of KB to multi-MB).
- Imported files: **made self-contained + SharePoint-safe** (strip external CDNs and JS, inline assets, convert interactivity to CSS-only where possible).

**Honesty mandate:** the multi-MB / full-course end of this is genuinely large and inherently best-effort. Phase it, verify each piece, and **checkpoint with the human** rather than over-claiming. The dual-mode architecture (Quill widget mode + a new HTML/Course mode) is described in the v3 design docs — follow it.

---

## 3. The features — each with Success Criteria + Verification + Self-test

> **Non-negotiable for every feature below:** it is not "done" until (a) its written success criteria are met, (b) its verification cases pass in an **automated browser self-test you wrote/extended**, run live, and (c) a human can see it working. See §4 for the exact discipline.

### F1 — Fix: edit modals hide the Save button
**What:** in several widgets the rich-text editor pushes the Save button out of reach. The generic modal (`src/ui/modal.js`) is correct, and the bug is **half-fixed already** — 4 bespoke `_openEditModal` modals (**accordion, flip-cards, knowledge-check, timeline**) already use the correct `flex:1;min-height:0;overflow` body. Still broken (set `min-height:NNNpx` with no `flex:1/min-height:0/overflow`, so the body can't shrink and the footer is clipped by the dialog's `overflow:hidden`): **`tabs`** (body line 253; its rightCol at line 277 also lacks `overflow`), **`carousel`** (439), **`hotspot`** (369), **`click-reveal`** (306).
**Approach:** bring those 4 broken bodies in line with the 4 correct ones (`display:flex;flex:1;min-height:0;overflow:hidden;`, delegating scroll to the inner columns; drop the body `min-height`), and harden `main.css` by adding `flex-shrink:0` to `.widget-modal-header`/`.widget-modal-footer`. Then extract a shared `WidgetModal.buildFrame()` helper into `src/ui/modal.js` so all 8 bespoke modals + the generic `open()` share one provably-correct layout and it can't silently drift again. Part-1 (the 4 fixes) alone fully resolves the user-visible bug; the refactor is the durable guard.
**Success:** in **all 11 widgets'** edit modals, with maximum content and at small viewport heights, Save and Cancel are always visible and clickable; only the body scrolls; modal never exceeds the viewport.
**Verification cases:** open each widget's edit modal; stuff every rich-text field with long content; test at viewport heights ~600px and ~400px and width 768px; assert the footer's bounding rect is fully within the viewport and the Save button is clickable (not covered); assert the body is the scrolling element.

### F2 — Whole-document WYSIWYG ↔ code toggle
**What:** one control flips the entire document between the visual editor and an editable HTML source view, and back, **losing nothing — including widgets.**
**Approach:** define a **reversible serialization**. Widgets already carry `data-widget-type` + `data-widget-data` in the DOM (`src/blots/base.js`); reuse `src/export.js` `deltaToHtml` for serialize and write the HTML→delta parser that rebuilds widget embeds from those attributes. Handle dirty state and invalid-HTML-on-switch-back gracefully (surface an error, never silently drop content). This is the **backbone of import/course mode** — coordinate its contract with F3.
**Success:** round-trip `delta → code → delta` preserves every widget's type+data and all text formatting; editing text in code reflects back in the visual view; invalid HTML is reported without data loss; **both export modes still work after a round-trip**, and the Stage-8 no-JS suite stays green.
**Verification cases:** build a doc containing one of every widget plus headings/lists/bold/links; toggle to code and back; assert delta equivalence (widget data byte-equal, text preserved); edit a text node in source, toggle back, assert the change applied; feed deliberately malformed HTML and assert graceful handling; diff the no-JS export before vs after a round-trip.

### F3 — Import & structurally edit arbitrary HTML (phased)
**Phase 1 — robust raw import.** Load **any** HTML file: map recognizable nodes (h1–h3, p, ul/ol/li, strong/em/u, a, img, blockquote) to native content/blots; wrap every unrecognized subtree in a **new `raw-html` BlockEmbed blot** (rendered, editable via the F2 code view); capture `<head>`/`<style>` into a **document-styles store**; sanitize active content (strip `<script>`, `on*`, `javascript:`); the export pipeline re-emits the kept styles so the imported look survives.
**Phase 2 — course mode (dual-mode + structural editing + JS→no-JS conversion).** Per the v3 design docs: a new HTML/Course mode (code view + live preview + structure/outline panel), an import/sanitize/dependency-inlining pipeline, a **best-effort JS→no-JS conversion engine** (detect ARIA-tabs/Bootstrap/`.screen` patterns → rebuild as the editor's no-JS widgets), structural add/remove/reorder, and large-file performance handling.
**Success (Phase 1):** importing any file throws nothing and **drops no content** (a fidelity report lists kept vs. dropped); the file renders recognizably in preview; export round-trips the look; **SharePoint/no-JS export removes external CDN refs + JS** and contains zero `<script>`/`on*=`/`javascript:`. **Success (Phase 2):** detected patterns become editable, converted interactions work no-JS in the export, structural edits persist, and the user is shown what converted vs. degraded.
**Verification cases (use the four real fixtures in `C:/Users/Cam/Downloads/`):** `soccer Tabs.html` (self-contained ARIA tabs + JS), `Interactive components (1).html` (Bootstrap CDN), `M19-claude-code-for-elearning.html` (592KB multi-screen course), `IRCC_…TOC_v2 (4).html` (5.5MB, 24 base64 images). For each: import → assert no throw, no silent content loss, recognizable preview, round-trip export, and a clean no-JS export (zero script/on*/javascript:, no external CDN in self-contained mode). Performance: IRCC imports within a stated budget or warns; the UI never hard-freezes. Phase 2 functional: soccer tabs → no-JS tabs that actually switch; Bootstrap accordion/tabs → working no-JS; M19 `.screen` nav → a working no-JS step pattern; reorder two sections and re-export successfully.

### F4 — Styling pass (editor UI + exports), via the `frontend-design` skill
**What:** raise visual quality toward the reference showcase aesthetic (radius ~18px, soft shadow `0 12px 30px rgba(0,0,0,.08)`, gradient header, pill buttons, refined tokens) across **both** the editor chrome and the produced HTML; add a "Showcase" theme preset alongside neutral/bold/soft.
**Approach:** **invoke the `frontend-design` skill** and the project's web/design-quality guidance; extend `src/styles/theme-defaults.css` tokens compatibly; restyle header/sidebar/modals/toolbar in `src/styles/`; polish widget/export defaults. Keep everything as CSS custom properties, no-build.
**Success:** editor and a sample export look intentionally designed (hierarchy, depth, designed hover/focus states) at 320/768/1024/1440; the new preset works; **existing presets unchanged and old v2 projects still load** (provide migration defaults for any new tokens); no Core-Web-Vitals regression.
**Verification cases:** Playwright/preview screenshots of the editor and a representative export at all four breakpoints; switch every preset incl. Showcase; load a pre-v3 project file and assert it renders with sane defaults; run an accessibility/contrast pass; design-quality checklist.

---

## 4. The verification discipline (REQUIRED for every feature)

This is the methodology proven on Stage 8. **Apply it to each feature before marking it done.** No feature ships on red or unverified.

1. **Write Success Criteria** — explicit, measurable statements of "correct," in the feature's design doc/section.
2. **Enumerate Verification Cases** — concrete scenarios and inputs, including edge cases, the four real fixture files, multi-instance, accessibility (keyboard focus, labels), and **regression** (existing widgets + both export modes).
3. **Build/extend an automated browser self-test** in the style of `_nojs_tests.html`:
   - Mount exports/UI in an **isolated iframe**; assert against computed DOM/styles.
   - **Await the real content load** (guard against the initial `about:blank` load event) and **kill CSS transitions/animations** before measuring (`* { transition:none !important; animation:none !important }`) — both were real false-negative traps in Stage 8.
   - Emit a pass/fail matrix with an **evidence string** per case.
4. **Run it live** over localhost (`python -m http.server 8137 --directory "<project>"`, or the preview `launch.json` config named `hce`) in a real browser; capture a screenshot.
5. **Fix until 100% green.** When a case fails, first decide **harness bug vs. real bug** (Stage 8 surfaced both) and fix the right one.
6. **Report honestly** — the matrix + evidence, and an explicit list of anything best-effort/degraded/unverifiable (e.g., real SharePoint rendering, multi-MB performance on low-end machines). Never describe unverified work as done.
7. **Keep `_nojs_tests.html` green** throughout v3 — it is the no-JS regression guard. Extend it as widgets/exports change.
8. Only then update `handoff.md` + the relevant docs, and move to the next feature.

---

## 5. Engineering constraints & conventions

- **Vanilla JS, no build step.** Code loads as plain `<script>` tags in `index.html`. Any new library must be **vendorable as a prebuilt file** (like `vendor/quill`).
- **Both export modes must keep working**, and the no-JS export must keep emitting zero `<script>`/`on*=`/`javascript:`.
- **Save format → bump to version 3** for any new persisted data (the `raw-html` blot, the document-styles store, course-mode docs). Provide a **v2→v3 migration** in `src/save-load.js` and confirm old files still load.
- **Blot pattern**: self-registering Quill `BlockEmbed`; declare `{ name, label, icon, description, defaultData }`; implement `renderEditor`, `renderExport`, `renderExportNoJS`, `edit`.
- **Theming**: CSS custom properties only.
- Files 200–400 lines typical, **800 max**; functions < 50 lines. Split early.
- Commit style `<type>: <description>` (attribution disabled). Branch per stage; merge to `main` when a stage is done and verified.

---

## 6. Recommended build order (each gated by §4 verification)

1. **F1 modal fix** — fast, self-contained win; ship + verify first.
2. **F4 design tokens + Showcase preset + chrome restyle** — low risk, improves everything visible during later work.
3. **F2 whole-document code view** — backbone; get the reversible serialization rock-solid (it underpins F3).
4. **F3 Phase 1 raw import** — `raw-html` blot + document-styles store + sanitize + self-contained/no-JS export; verify against all four fixtures at the raw/code level.
5. **F3 Phase 2 course mode** — dual-mode shell, import pipeline hardening, JS→no-JS conversion (start with soccer-tabs and Bootstrap-tabs/accordion), structural outline editing, large-file performance. Land pattern-by-pattern, verifying each, checkpointing with the human.

Treat 1–4 as the **v3.0.0 foundation** (genuinely achievable). Treat 5 as the **v3.x arc**; do not claim full multi-MB course editing is complete until it is verified against M19 and IRCC.

---

## 7. Test assets & fixtures

- `_nojs_tests.html` — 27-case no-JS verification suite. **Must stay 100% green** (regression guard); extend it for new no-JS behavior.
- `_nojs_selftest.html` — renders one of every widget's no-JS export in an iframe with a PASS/FAIL banner.
- Import fixtures (in `C:/Users/Cam/Downloads/`): `soccer Tabs.html`, `Interactive components (1).html`, `M19-claude-code-for-elearning.html`, `IRCC_Mandatory_Training_Roadmap_Bilingual_Accessible_TOC_v2 (4).html`. Copy them into a `fixtures/` folder in the repo so the test harness can load them deterministically.
- Preview: `.claude/launch.json` already defines a server config named `hce` on port 8137.

---

## 8. Definition of Done

**v3.0.0 (foundation):** F1 fixed & verified across all 11 widgets; F4 styling + Showcase preset shipped with old-project compatibility; F2 code view round-trips losslessly; F3 Phase 1 imports all four fixtures with no content loss and clean self-contained/no-JS export — each backed by a green self-test, with the Stage-8 suite still green, docs + handoff updated, and the human able to see it.

**v3.x (course mode):** dual-mode shell; import pipeline; JS→no-JS conversion for the shipped patterns (with a converts/degrades report); structural editing; large-file handling — each landed pattern-by-pattern behind its own verification gate, honestly reported.
