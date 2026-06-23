# v3 Master Plan — HTML Content Editor

_Authoritative planning document synthesizing two design-research passes: the four **core-feature** briefs (F1–F4) and the four **course-mode** briefs (A1–A4). This is a planning doc — prose, tables, and short illustrative snippets only, no full implementations. Where the two passes disagree, the disagreement is named and reconciled explicitly (see §3.4 and §7)._

_Read alongside: `v3_kickoff_prompt.md` (locked decisions, verification mandate, build order), `handoff.md` (current real state), `CLAUDE.md` (conventions). Source of truth for current code: `src/save-load.js` (`SAVE_VERSION = 2`), `src/html-roundtrip.js` (`SAVE_VERSION = 2`, `EMBED_ID = 'hce-project-data'`, `NO_EMBED` throw at line 54), `src/export.js` (`deltaToHtml` line 35, `Object.create(Blot.prototype)` widget seam lines 99–108, `buildExportCSS` line 143, `buildExportHtml` line 255)._

---

## 1. Overview & v3 Reframing

v2.0.0 + Stage 8 shipped a **widget-authoring** tool: Quill 2 with 11 self-registering `BlockEmbed` "blot" widgets, a versioned JSON save format, and **two export paths** — interactive `Export HTML` and JavaScript-free `Export for SharePoint` (`renderExportNoJS(container, data, ctx)` per widget; verified zero `<script>`/`on*=`/`javascript:`). That no-JS output is the **contract v3 must preserve**.

v3 widens the product from *author widgets* to **author widgets AND open existing HTML, structurally edit it, and re-export it self-contained + SharePoint-safe (no-JS)** — without disturbing the existing authoring workflow. Concretely v3 adds four capabilities:

1. **F1** — fix the edit modals that hide the Save button (a shipped bug; fast win).
2. **F2** — a whole-document WYSIWYG ⇄ code (HTML source) toggle that round-trips losslessly, including widgets. This is the **serialization backbone** of import/course mode.
3. **F3** — import & structurally edit arbitrary HTML, phased: **Phase 1** robust raw import (`raw-html` blot + document-styles store + sanitize); **Phase 2** full course mode (dual-mode shell + import/inline pipeline + JS→no-JS conversion engine + structural editing + large-file handling).
4. **F4** — a styling pass across editor chrome AND produced HTML, plus a new "Showcase" theme preset.

The course-mode briefs (A1 dual-mode architecture, A2 import/sanitize/inline pipeline, A3 JS→no-JS conversion engine, A4 structural editing + large-file performance) are the **deep design for F3 Phase 2**.

**Honesty mandate (from the kickoff):** the multi-MB / full-course end is genuinely large and inherently best-effort. Phase it, verify each piece against the four real fixtures, and checkpoint with the human rather than over-claim.

---

## 2. Locked Product Decisions

Pulled verbatim-in-spirit from `v3_kickoff_prompt.md` §2 — **do not relitigate**:

- **HTML import:** robust **raw import first**; smart pattern→widget mapping is a **later phase**.
- **Code view:** **whole-document** source toggle (enhanced `<textarea>` first; vendored CodeMirror 6 is an optional later polish — the textarea contract is designed so CM6 is a drop-in replacement of the editing surface only).
- **Styling:** **both surfaces** — editor chrome AND widget/export output — plus a new **"Showcase"** preset alongside neutral/bold/soft.
- **Editing ambition:** **full structural editing** (add/remove/reorder sections).
- **File scale:** up to **full multi-screen courses** (hundreds of KB to multi-MB).
- **Imported files:** made **self-contained + SharePoint-safe** — strip external CDNs and JS, inline assets, convert interactivity to CSS-only where possible.

**Engineering constraints (non-negotiable):** vanilla JS, **no build step**; any new library must be **vendorable as a prebuilt file** (like `vendor/quill`); both export modes keep working and the no-JS export keeps emitting **zero** `<script>`/`on*=`/`javascript:`; **save format bumps to version 3** for any new persisted data with a v2→v3 migration in `src/save-load.js`; CSS custom properties only; files 200–400 lines typical / 800 max; functions < 50 lines.

---

## 3. Architecture

### 3.1 The dual-mode model

Today the app is **single-mode**: `editor.js` boots one global Quill on `#editor`; every feature (`save-load.js`, `html-roundtrip.js`, `export.js`) reaches into `window.contentEditor.quill`; the document **is** a Quill delta. That model cannot represent the four target files — arbitrary section trees with their own `<head>`/`<style>`/`<script>`, one of them 5.5MB.

The fix (A1) is a thin **mode layer** in a new `src/app-mode.js` (~200 lines):

| Concern | Detail |
|---|---|
| `window.HCEApp` | Holds `currentMode` (`'widgets' \| 'course'`) and a registry of mode objects. |
| Mode interface | `{ id, mount(rootEl), unmount(), getDocument(), setDocument(doc), getTitle(), exportSelfContained(opts) }`. |
| `'widgets'` mode | The **existing Quill setup wrapped unchanged** — still owns `#editor` and `window.contentEditor` (kept as a back-compat shim). No behavioral change to authoring. |
| `'course'` mode | A new object whose document is a parsed `CourseDoc`, edited through a 3-pane shell (outline + sandboxed preview iframe + per-section code view) rather than Quill. |
| Mode switch | Swaps which DOM subtree is visible and **repoints save/load/export at `HCEApp.currentMode`** instead of hard-coding `window.contentEditor`. This is the single most important decoupling refactor. |

**Shared between the two modes — and nothing else:**
- the **theme system** (`theme.js` / CSS custom properties),
- the **export contract** (self-contained, no-JS output via `buildExportHtml` / `renderExportNoJS`),
- the **header / save / load chrome**.

The **big reuse win:** imported interactions are *matched* to existing blots and re-emitted through the **same export.js seam** export already uses (`Object.create(Blot.prototype)` + `instance.renderExportNoJS(container, data, ctx)`, export.js lines 99–108). So course mode gets SharePoint-safe interactivity **for free** wherever a detector fires.

### 3.2 The `CourseDoc` / `SectionNode` representation

The course document is a parsed section/element tree plus captured head — **deliberately NOT a Quill delta** (the files have arbitrary nesting and their own CSS cascade; a 5.5MB file would produce a pathological delta; the editing model is structural — reorder/remove whole sections — which is an array op, not an inline-text op).

```
CourseDoc = {
  version: 3, kind: 'course',
  title,                                  // from <title> or first <h1>
  head: { styleText, fontLinks[], metaLang },  // captured <style> text + flagged external <link>/font deps
  sections: SectionNode[],                // ordered top-level structural blocks
  theme                                   // HCE theme snapshot, same shape as widgets mode
}

SectionNode = {
  id,                                     // stable uid 'sec-<n>' assigned at import
  kind,                                   // 'static' | 'matched-widget' | 'screen' | 'raw'
  label,                                  // outline label from first heading or role
  html,                                   // sanitized innerHTML for 'static'
  widget?: { blotName, data },            // for 'matched-widget' — feeds renderExportNoJS
  children?: SectionNode[]                // for 'screen' (M19) / nested — phase 2+
}
```

- **Sectioning rule for v3.0.0** is deliberately shallow: split `<body>` (or `<main>`) into its **direct element children**; each becomes one `SectionNode`. This matches soccer Tabs (`main > intro + tabs + notes`) and IRCC (`body > header + nav.toc + main sections`) cleanly. Deep recursion is later.
- `SectionNode.kind` is the **dispatch key** for both preview rendering and export. A `matched-widget` stores `{ blotName, data }` — the **same data shape** the blots' `defaultData`/`value()` use — so it flows through the unchanged export.js widget seam.

### 3.3 The save-format v3 discriminated union

v3 introduces a **discriminated union keyed on `kind`** so widgets-mode (delta) and course-mode (sections) coexist in one file format and one save/load path:

```
{ version: 3, kind: 'widgets', content: delta, theme }
{ version: 3, kind: 'course',  head, sections[], theme }
```

`src/save-load.js`:
- Bump `SAVE_VERSION` **2 → 3** (currently `= 2` at line 4). **`src/html-roundtrip.js` holds its own copy (`SAVE_VERSION = 2` at line 5) and must bump in lockstep** — ideally promote to a single shared `window.HCE_SAVE_VERSION` const so the two never drift (a named risk in F2/F3).
- Add `migrateV2toV3` alongside the existing `migrateV1toV2` (line 51). The migration is **a pure tag**: stamp `kind:'widgets'` onto existing payloads (`content`/`theme` untouched), set `version:3`. Existing v2 files load **byte-identically**.
- `applyPayload` (line 102) becomes a **router on `payload.kind`** (`'widgets'` → setContents on Quill; `'course'` → hand to the course mode). The chain becomes v1 → v2 → v3.

### 3.4 The shared export contract (reconciling the two passes)

The **load-bearing reuse seam** is export.js's widget renderer: a bare `Object.create(Blot.prototype)` instance with `ctx.uid` (`wx<n>`) as the only unique-id source, dispatched to `renderExportNoJS` (export.js lines 99–108). A1/A3 both call for **extracting this block into an exported helper** — `renderWidgetToHtml(blotName, data, ctx)` (A1) / the existing `renderExportNoJS` seam reused verbatim (A3) — so course/import code reuses it instead of duplicating. `deltaToHtml` keeps using the helper; `export-course.js` calls it for `matched-widget` sections.

> **Reconciliation — the discriminated-union `kind` values disagree across passes.** The course-architecture brief (A1) defines `kind:'course'` with a `sections[]` tree; the pipeline brief (A2) defines `kind:'imported-html'` with `{ scopeClass, css, html }`; the structural-editing brief (A4) uses a `mode:'authoring'|'structure'` discriminator with a node-tree `root` + `assets` map; the conversion brief (A3) keeps a delta and adds an optional `import:{...}` block.
>
> **Decision: adopt A1's `kind` discriminator as the canonical union — `{version:3, kind:'widgets'|'course', ...}` — exactly as the kickoff §3 prescribes.** A2's namespaced-scoped-HTML payload and A4's node-tree-plus-asset-map are **two competing internal representations of a `kind:'course'` section's body**, not separate top-level document kinds. They are reconciled as follows:
> - A2's `scopeClass` + namespaced `css` + sanitized `html` is the recommended representation for a **`kind:'static'` section's** `html`/captured-style (it solves "imported CSS must not clobber editor chrome" via selector-prefixing) — but A1's sandboxed-iframe-preview already solves that isolation problem more robustly for the **preview**, so CSS namespacing is needed only for the **export** path where there is no iframe.
> - A4's **asset map** (extract every `data:`/external `<img>` into `assets:{ref:{...}}`, store `srcRef` in the tree) is adopted as the **storage optimization for large files** (keeps the 5.5MB IRCC working tree at ~150KB, keeps undo snapshots cheap). It applies to `kind:'course'` docs regardless of section kind.
> - A4's `mode:'structure'` and A2's `kind:'imported-html'` are **renamed to `kind:'course'`** to converge on one union. A3's `import:{sourceName, conversionReport}` block is **kept as an optional field on the course doc**, surfacing what converted vs degraded.
>
> Net: **one** top-level union (`widgets` | `course`); inside a `course` doc, sections carry sanitized scoped HTML, large base64 lives in an asset map, and matched interactions carry `{blotName, data}`. This keeps `applyPayload` a two-way router and preserves the single-file, no-backend contract.

---

## 4. Per-Feature Plans (F1–F4)

### F1 — Fix: edit modals hide the Save button

**The precise "half-fixed" finding.** The generic `WidgetModal` (`src/ui/modal.js` + `.widget-modal-*` CSS in `main.css`) is already correct: dialog is a flex column with `max-height:calc(100vh-80px)` + `overflow:hidden`; `.widget-modal-body` has `flex:1;overflow-y:auto;min-height:0`. The bug lives only in the **bespoke `_openEditModal` methods** that build their own modal DOM with inline `body.style.cssText`. The codebase is **already half-fixed**:

| State | Widgets | Body layout |
|---|---|---|
| **Already correct** | accordion (line 310), flip-cards (383), knowledge-check (581), timeline (134) | `display:flex;flex:1;min-height:0;overflow:hidden;` |
| **Still broken** | **tabs (line 253)**, **carousel (439)**, **hotspot (369)**, **click-reveal (306)** | `display:flex;min-height:NNNpx;` — no `flex:1`, no `min-height:0`, no `overflow` |

Root cause: a flex item defaults to `min-height:auto` and refuses to shrink below its content's intrinsic height. A tall `RichTextField` makes intrinsic height exceed the dialog, and without `min-height:0` the body won't shrink — pushing the footer out under `overflow:hidden`.

**Approach.** Make every bespoke body a single bounded flex child (`flex:1;min-height:0;overflow:hidden`) so the inner scroll column(s) own scrolling and the footer stays pinned.

**Files to change (Part 1 — the actual fix, ~7 lines):**

| File:line | Change |
|---|---|
| `src/blots/tabs.js:253` | body → `display:flex;flex:1;min-height:0;overflow:hidden;` |
| `src/blots/tabs.js:277` | **rightCol lacks overflow** — append `min-height:0;overflow-y:auto;` (tabs is the only broken modal whose rich-text column lacks it) |
| `src/blots/carousel.js:439` | body → canonical layout (rightCol@482 + leftCol already have `overflow-y:auto`) |
| `src/blots/hotspot.js:369` | body → canonical layout; **verify the rightCol@378 RichTextField pin-editor scrolls** — add `min-height:0;overflow-y:auto` to that inner region if its content can exceed height |
| `src/blots/click-reveal.js:306` | body → canonical layout (rightCol@329 already has `overflow-y:auto`) |
| `src/styles/main.css` | **Hardening:** add `flex-shrink:0;` to `.widget-modal-header` (~line 394) and `.widget-modal-footer` (~line 465) so header/footer can never be squeezed |

Drop the per-body `min-height` (280/320/340/400px) entirely to match the 4 already-correct modals; if a floor is wanted put it on the **dialog**, never the body (which reintroduces the clip).

**Optional Part 2 — DRY refactor (recommended, low-risk, additive).** Add `WidgetModal.buildFrame({title, titleId, width, bodyLayout})` → `{overlay, dialog, header, body, footer, titleEl, closeBtn, cancelBtn, saveBtn}` to `src/ui/modal.js` (~80 lines). It builds the canonical header/body/footer and returns **parts only — wires NO close/keydown/save logic** (each bespoke modal keeps its own semantics: tabs validates `activeTab`, carousel destroys image fields, etc.). Refactor `open()` to consume it internally with no behavior change, then migrate all 8 bespoke modals one at a time (~160 lines of duplication removed). **`buildFrame` becomes the shared contract F2/F3 must consume for any new/extended modal**, so the clipping class of bug can never recur.

**Data-model / save-format impact:** **NONE.** F1 is pure layout. No `defaultData` changes, no new persisted fields, **no `SAVE_VERSION` change** — the v2→v3 bump is owned solely by F2/F3.

**Risks + mitigations:**

| Risk | Mitigation |
|---|---|
| Inner scroll column missing `overflow` re-clips content (tabs rightCol@277, possibly hotspot pin-editor) | Audit every inner column; tabs rightCol fix is in the plan; verify hotspot rightCol scrolls during testing |
| Part 2 changes per-blot close/save semantics | `buildFrame` returns DOM parts only; migrate one blot at a time, run the 11-widget round-trip after each |
| Export regression | F1 touches only edit-time modal DOM/CSS; `renderExport`/`renderExportNoJS` untouched — add an export round-trip check as a guard |

**Effort:** Part 1 ~30–45 min including full 11-widget verification (very low risk). Part 2 +2–4 hours. **Recommendation: ship Part 1 + CSS hardening for v3.0.0 immediately; schedule Part 2 as a reviewed follow-up.**

---

### F2 — Whole-document WYSIWYG ⇄ code toggle

**Approach.** A header `</> Edit HTML` / `Visual` button flips the whole document between Quill and an editable HTML source view (`<textarea>` first; CM6 later). A new `src/source-view.js` (`window.SourceView`, ~280 lines) owns a `'visual' | 'source'` state machine.

**The core problem:** Quill's clipboard rebuilds only formats it has matchers for; its defaults ignore widget nodes and would drop/flatten embeds on the way back. The editor DOM already carries `data-widget-type` + `data-widget-data` (JSON) on every node (`src/blots/base.js`). The solution is a **defined, reversible "Source HTML" dialect** with two node classes — **the shared F2/F3 contract**:

- **(a) EDITABLE content** — `p`, `h1`–`h3`, `ul`/`ol`/`li`, `strong`/`em`/`u`, `<img>` — exactly the vocabulary `deltaToHtml` already emits and the parser understands. Freely hand-editable. (An F3 imported raw-HTML block is class (a) verbatim.)
- **(b) OPAQUE widget placeholders** — each embed becomes ONE element the user must not hand-edit:
  ```html
  <div class="hce-widget" data-widget-type="callout"
       data-widget-data="BASE64_JSON" contenteditable="false">
    Callout · double-click in Visual mode to edit
  </div>
  ```
  `data-widget-data` is `base64(JSON.stringify(data))` (UTF-8-safe encode), **not raw JSON**, so inner quotes / `</script>` can never break the surrounding HTML or the textarea.

**Serialize (Visual → Source)** — `buildSourceHtml(delta)`: fork export.js's proven loop. The only divergence from `deltaToHtml` is the widget-embed branch (emit the opaque placeholder instead of `renderExport`). Achieved by the **same export.js refactor F4/A1 want**: extract the text/list/inline/image walker into a shared helper that takes a pluggable embed-renderer (`HCEExport.walkDelta`); export passes its renderer, source-view passes the placeholder renderer. Existing `deltaToHtml`/`buildExportHtml` output stays byte-identical.

**Parse (Source → Visual)** — `parseSourceToDelta(html)`:
1. **DOMPurify sanitize** — keep the editable vocabulary + the placeholder (`ADD_ATTR:['data-widget-type','data-widget-data','contenteditable']`, class allowlist); strip `<script>`, `on*`, `javascript:`, `style`/`iframe`/`object` (same threat surface Stage 8 cares about).
2. Register **one** Quill clipboard matcher at startup in `editor.js`: `quill.clipboard.addMatcher('div[data-widget-type]', fn)` — decode base64, validate `WidgetRegistry.get(type)`, return `new Delta().insert({[type]:data})`. This is the documented Quill 2 hook and the exact inverse of the placeholder emit. Defaults handle the editable vocabulary.
3. `delta = quill.clipboard.convert({ html: sanitizedSource })` — runs matchers **without mutating the editor**, enabling validate-before-commit.
4. Commit only on success: `quill.setContents(delta, Quill.sources.USER)`.

**Toggle/state:** entering source hides (does not destroy) `#editor`, fills a textarea with `buildSourceHtml(...)`, disables toolbar/slash/Save/Export and closes any open slash palette. Exiting runs the parse in try/catch — on **any** error (unknown widget type, bad base64, malformed HTML) it **refuses the switch**, keeps the user in source mode with text intact, and shows an inline banner naming the problem. **Never silently drops content.** Blank textarea → single empty paragraph.

**Files to change:**

| File | Change |
|---|---|
| `src/source-view.js` | **NEW** ~280 lines: state machine, `buildSourceHtml`, `parseSourceToDelta`, toggle UI, error banner, UTF-8-safe base64 helpers |
| `src/export.js` | Refactor to expose the shared `walkDelta` (pluggable embed renderer); existing signatures/output byte-identical |
| `src/editor.js` | ~15 lines: register the single clipboard matcher; expose hooks for SourceView to disable/enable slash + toolbar |
| `index.html` | Add `<script src="vendor/dompurify/dist/purify.min.js">` before `registry.js` and `src/source-view.js` after `save-load.js` |
| `vendor/dompurify/.../purify.min.js` | **NEW** vendored prebuilt (mirrors `vendor/quill` layout) |
| `src/save-load.js` + `src/html-roundtrip.js` | Bump `SAVE_VERSION` 2→3 **in lockstep**; add pass-through `migrateV2toV3` |
| `src/styles/main.css` | `#source-pane` / monospace textarea / error banner / `.hce-widget` muted dashed-border look |

**Data-model / save-format impact:** F2 itself persists **no new fields** (doc stays `{version, kind:'widgets', content, theme}`). The bump to 3 is required by the version-discipline rule and because v3.0.0 is the umbrella release; `migrateV2toV3` is a **pass-through** that only stamps `version:3` + `kind:'widgets'`. The transient Source dialect is **never persisted** — it exists only inside the textarea during a toggle.

**Risks + mitigations:**

| Risk | Mitigation |
|---|---|
| Quill defaults round-trip the editable vocabulary differently than `deltaToHtml` emits, causing visual≠source drift | Constrain `buildSourceHtml` to exactly the tag set Quill's defaults round-trip cleanly; **golden idempotence test**: `delta → buildSourceHtml → parseSourceToDelta → delta'` deep-equal, run twice |
| Unknown/lapsed `blotName` or bad base64 → silent embed loss | Matcher validates registry + `JSON.parse(atob(...))` in try/catch; throws a tagged error; parse aborts the toggle with a precise banner |
| DOMPurify strips a dialect-critical attr | Explicit `ADD_ATTR`; startup self-test sanitizes a known placeholder and asserts survival; pin the vendored version |
| F3 expects a different representation | F2 declares the single dialect and ships `buildSourceHtml`/`parseSourceToDelta`; **F3 consumes them**, not a parallel path |

**Effort:** Medium, ~2–3 focused sessions. Risk concentrates in getting serialize/parse provably idempotent against Quill's default matchers (gated by the golden round-trip test).

---

### F3 — Import & structurally edit arbitrary HTML (phased)

F3 is **two phases**. Phase 1 is a v3.0.0 foundation deliverable; Phase 2 is the v3.x course-mode arc detailed in §5.

#### F3 Phase 1 — robust raw import

**Approach:** **SANITIZE → WALK → WRAP.** `save-load.js loadHtmlProject` already throws `NO_EMBED` for foreign files (today a dead-end toast); that catch now calls `HCEImport.importArbitraryHtml(fileText)`, so any `.html` either round-trips (our export) or imports.

- **Sanitize** (`src/import/sanitize.js`, the security boundary): vendored DOMPurify keeps `class`/`id`/inline `style`/`data-*` and structural tags; `FORBID_TAGS:['script']`, `FORBID_ATTR` srcdoc, keep default `ALLOWED_URI_REGEXP` (blocks `javascript:`), `ALLOW_DATA_ATTR:true`, plus an `uponSanitizeAttribute` hook dropping any `on*` handler.
- **Walk** (`src/import/walk.js`): build a Delta **by hand**, NOT `dangerouslyPasteHTML` (which routes through clipboard matchers and **drops unknown tags**). `NODE_MAP` emits ops `deltaToHtml` already understands: `h1`–`h3` → `header n`; `p` → line; `ul`/`ol`/`li` → `list bullet`/`ordered`; `img` → resizable-image embed; `strong`/`em`/`u` → bold/italic/underline; `a` → built-in link. Everything else (`section`, `form`, `nav`, custom divs, CSS-only tabs/carousel, `details` in P1) → a **`raw-html` embed** holding sanitized `outerHTML`. Apply via `quill.setContents(delta, SILENT)`.
- **Document styles** (`src/doc-styles.js`, `window.DocStyles`): capture head `<style>` text + body style + `<link rel=stylesheet>` hrefs (**recorded and flagged, NOT fetched** — no-external-deps). `DocStyles.set` injects one `<style>` **scoped to `.ql-editor`** in the editor; `buildExportHtml` concatenates `DocStyles.getCss` after `buildExportCSS` for **both** modes.
- **`raw-html` blot** (`src/blots/raw-html.js`): `BlockEmbed extends BaseWidgetBlot`; `renderEditor` injects sanitized html; click opens the F2 code view seeded with html (textarea fallback if F2 absent); save **re-sanitizes** and `updateData`; `renderExport`/`renderExportNoJS` output `data.html` verbatim (already script-free, SharePoint-safe). Registered with Quill but **hidden from palettes** via `static widgetHidden = true` + filters in `slash-command.js` and `toolbar.js`.

**Policy:** sanitize **once at import**, store the sanitized HTML as canonical. Rendering untrusted HTML inside the editor (same origin as Save/Export/theme) is the real XSS surface — neutralize before any `innerHTML`. Sanitize-for-safety and prepare-for-no-JS-export are the **same operation**: the only loss is JS-driven interactivity (accepted in P1; recovered as widgets in P2).

**Data-model / save-format impact:** **v2 → v3.** New top-level `docStyles` field (`{ _v, headStyles[], linkRefs[], bodyClass, bodyStyle }`; omitted for docs that never imported). New `raw-html` blot data (`{ _v, html }`), stored like every widget. `migrateV2toV3` is purely additive (absent `docStyles` → empty store). Bump `SAVE_VERSION` in **both** `save-load.js` and `html-roundtrip.js`.

**Risks + mitigations:**

| Risk | Mitigation |
|---|---|
| XSS from imported third-party HTML | DOMPurify on every `innerHTML` path (walk capture, `renderEditor`, code-view save); forbid `script`/`on*`/`javascript:`; security-reviewer before commit |
| Imported global CSS restyles app chrome | `DocStyles` prefixes editor injection with `.ql-editor` scope; export emits unscoped |
| Lossy node→Delta mapping (headings in lists, tables) | Conservative `NODE_MAP`; any unmappable descendant → wrap whole block as `raw-html`, never drop; tables → `raw-html` in P1 |
| `setContents` rejects a malformed Delta (no trailing newline, embed at index 0) | Walker guarantees leading + terminating newlines; unit-test Delta shape |
| `SAVE_VERSION` drift across two files | Bump both in one commit; shared const |

**Effort:** Medium — ~6 new files (~1100–1400 LoC) + 6 small edits. ~3–4 focused days for P1 including tests. Hard parts: sanitize policy, CSS scope isolation, import/export op-vocabulary symmetry for stable round-trips.

---

### F4 — Styling pass (editor chrome + exports + "Showcase" preset)

**Approach.** Style direction: **"light soft-depth editorial"** — generous radii, layered low-opacity shadows, a gradient "atmosphere" header, pill controls, `system-ui` chrome font with the existing serif/sans content pairing kept intact. Invoke the `frontend-design` skill + web/design-quality rules. All via CSS custom properties, no build.

**The load-bearing architectural fact:** each widget's `renderExport`/`renderExportNoJS` reads tokens via `getComputedStyle().getPropertyValue()` with a hardcoded fallback and **inlines literal values**. New export-facing tokens only reach exports if those reads are added per blot. **A grep confirmed `--widget-shadow` is read in 0 places today** and the export radius fallback is `0.5rem` — so the showcase soft-depth look will **not** appear in exports unless shadow/radius reads are added per widget. This is the half-fix trap F4 must avoid.

**Separation of concerns (verified):**
- `main.css :root` = **chrome** tokens (not serialized, not user-editable) — retune freely.
- `theme-defaults.css :root` = **content** tokens (the 16 in `theme.js DEFAULT_THEME`) — user-editable, serialized into saves.
- `export.js buildExportCSS()` resolves a fixed subset of content tokens to literals; each widget independently re-reads tokens and inlines literals.

**Four deliverables:**

**(a) Extended token set (compatible).** Content tokens (added in **both** `theme-defaults.css :root` AND `theme.js DEFAULT_THEME` so they serialize and drive the panel): `--widget-border-radius` `0.5rem → 0.75rem`; `--widget-shadow` `→ 0 12px 30px rgba(0,0,0,.08)`; new `--widget-shadow-ring 0 0 0 1px rgba(0,0,0,.04)`. Chrome-only tokens (`main.css :root` only): `--radius-pill:999px`, `--radius-md`, `--radius-lg`, `--shadow-chrome`, `--shadow-chrome-sm`, `--header-gradient`, a `--space-1..6` scale layered atop the existing `--space-unit` multiplier.

**(b) "Showcase" preset.** A 4th entry in `theme.js PRESETS` + a 4th `<button data-preset="showcase">` in `index.html`. Light soft-depth editorial values (`--color-primary #4f46e5`, `--widget-border-radius 1.125rem` (18px), `--widget-shadow '0 12px 30px rgba(0,0,0,.08)'`, etc.). **Build via `Object.assign({}, DEFAULT_THEME, {overrides})`** (like `neutral`) so every serialized key is covered — `applyTheme` only sets keys present in the object.

**(c) Editor-chrome restyle.** `#app-header` gradient + soft seam; `.header-btn` pill radius + hover lift + focus-visible ring; `.header-btn--accent` gradient fill; `.theme-presets` → 2×2 grid + `.preset-btn` `.is-active` state (minimal JS in the theme click handler); `.widget-modal` `--radius-lg` + `--shadow-chrome` + pill Save; Quill toolbar rounded corners + `color-mix` hovers replacing hardcoded `#eef2ff`/`#e0e7ff` literals so they track the theme primary; unify dropdown/slash-palette radius + shadow. `color-mix`/gradients are **confined to chrome stylesheets** which never ship in exports.

**(d) Widget/export default polish.** The required, not optional, per-blot edits: in each `renderExport` add `const shadow = root.getPropertyValue('--widget-shadow').trim() || '0 12px 30px rgba(0,0,0,.08)'`, bump radius fallback `0.5rem → 0.75rem`, add `box-shadow:${shadow}` to the outermost card. Touch all **11 `renderExport`** (callout, tabs, accordion, quote, timeline, flip-cards, click-reveal, carousel, hotspot, knowledge-check, image) and the **7 `renderExportNoJS`** — **preserving the Stage-8 `!important` discipline** (state-change rules in the scoped `<style>` lose to inline base styles). Recommended: a tiny shared `HCEExport.readWidgetTokens()` helper to avoid 11× duplication.

**Files to change:** `theme-defaults.css`, `theme.js`, `index.html`, `main.css`, `editor.css`, `toolbar.css`, `slash-command.css`, `export.js`, and all 11 blot files (per the per-blot table above).

**Data-model / save-format impact for F4 alone:** **none.** `getCurrentTheme()` reduces over `Object.keys(DEFAULT_THEME)`, so any new token auto-serializes; `applyTheme` only sets present keys, so old v2 saves fall back to `:root` defaults gracefully. **Caveat:** because F1/F2/F3 trigger the umbrella v2→v3 bump, F4 must be **migration-aware** — the v2→v3 migration must supply each new theme token's default if absent, so a v2 file upgraded to v3 renders identically.

**Risks + mitigations:**

| Risk | Mitigation |
|---|---|
| Showcase shadow/radius never reaches exports (no blot reads `--widget-shadow`) | Treat the per-blot reads as **required**; verify by exporting one-of-every-widget and diffing inlined `box-shadow`/`border-radius` literals |
| Stage-8 no-JS regression if a polish edit relocates a state rule into the scoped `<style>` | **Only ADD static `box-shadow`/`border-radius` to inline base styles; never move `:checked`/`:has()` state rules**; re-run `_nojs_selftest.html`, confirm zero `<script>`/`on*`/`javascript:` |
| Bumped defaults change existing saved docs | Saved v2 files include an explicit theme object — deserialize wins over CSS defaults, so existing docs are unaffected; only brand-new/untuned docs adopt new defaults |
| 4 preset buttons overflow the 260px sidebar | Switch `.theme-presets` to `display:grid; repeat(2,1fr)` |

**Effort:** Medium, ~1.5–2.5 days. Chrome restyle is low-risk additive CSS; the real labor is Phase 4 (threading shadow/radius into all 11 `renderExport` / 7 `renderExportNoJS` without disturbing Stage-8 `!important`), verified per-widget via export grep + `_nojs_selftest.html`.

---

## 5. Course-Mode Deep-Dive (F3 Phase 2)

This is the synthesis of A1–A4. It builds on the F2 source dialect, the F3 Phase-1 sanitize/`raw-html` infrastructure, and the export seam.

### 5.1 Import / sanitize / inline pipeline (A2)

A fixed sequence of pure stages, orchestrated by `src/import/ingest-html.js`, invoked from an "Open HTML…" entry in the Load dropdown (the `NO_EMBED` branch):

1. **READ (size-aware):** `FileReader.readAsText`; gate on `file.size` — `<2MB` parse immediately; `2–8MB` show a "Large file — importing…" toast and yield via `setTimeout` (the existing `_runExport` pattern, export.js ~line 240); `>8MB` require explicit `confirm()`. **The 5.5MB IRCC file is in the 2–8MB band — never `Read`/log the raw string.**
2. **PARSE:** `new DOMParser().parseFromString(text, 'text/html')` — inert, scripts don't execute (same guarantee export.js relies on). Strip MSO/Office conditional-comment cruft (`<!--[if gte mso 9]>`, `xmlns:mso`, `mso:CustomDocumentProperties`) seen in IRCC (leaks SharePoint DocIds, safe to remove).
3. **DEPENDENCY TRIAGE** (`src/import/deps.js`): classify each external ref into KEEP / INLINE / VENDOR / QUARANTINE / DROP. **Remote JS is always QUARANTINE→DROP** (can never survive the no-JS contract). Remote CSS is INLINE-if-vendorable (Bootstrap) else DROP-with-warning. **Google Fonts → DROP, fall back to theme system fonts** (system-font stacks for v3.0.0; base64 `@font-face` inlining is later).
4. **INLINE/VENDOR** (`src/import/inline-assets.js`): for Bootstrap, substitute a vendored `vendor/bootstrap/bootstrap.min.css` (CSS only — the CDN JS bundle is **never** vendored) into a scoped `<style>`. Remote `<img>` → WARN-and-leave-as-is by default; opt-in `fetch→base64` (CORS-permitting). Base64 images already inline (M19's 6, IRCC's 24) kept verbatim; add a **de-dupe pass** (hash each `data:` URI).
5. **SANITIZE** (`src/import/sanitize.js`, vendored DOMPurify) — see §5.4.
6. **NAMESPACE STYLE** (`src/import/scope-css.js`): prefix every selector with a scope class (`.hce-imported-<n>`) so imported CSS can't restyle editor chrome; rewrite `*`/`html`/`body` to the scope root; **preserve `@media`/`@keyframes`/`@font-face`**. Use a **tolerant tokenizer, not a full CSS parser** (no-build constraint); on parse uncertainty fall back to whole-`<style>` containment. (Needed for the **export** path; the **preview** uses iframe isolation instead — see §5.3.)
7. **BUILD PAYLOAD + REPORT:** a per-file fidelity report (KEPT / CONVERTED / DROPPED / WARN with counts and reasons), reusing `src/ui/modal.js` for the summary panel.

### 5.2 The detector / converter engine (A3)

A **pluggable matcher pipeline** runs AFTER sanitization, BEFORE the file becomes editor content. Coordinator `src/import/interaction-matchers.js` holds an **ordered registry** (mirrors `registry.js`), walks the DOM once **most-specific-first** with a `WeakSet` of claimed nodes (prevents double-claiming), and emits one of three outcomes per match:

- **CONVERTED_WIDGET** `{kind:'widget', blotName, data}` — reuses an existing blot + its `renderExportNoJS`. **Highest fidelity.** Crucially, matchers emit the blot's **`defaultData`-shaped object**, not HTML — so a converted tab set is **indistinguishable from an author-built one** (editable, re-exportable, themeable).
- **CONVERTED_STATIC** `{kind:'static', html, note}` — interactivity flattened to readable static HTML (modal → inline section, tooltip → visible parenthetical, dropdown → static list).
- **DEGRADED** `{kind:'degraded', reason, recoveredHtml}` — couldn't safely convert; salvage visible content (force-reveal) and flag it.

A **ConversionReport** (`{items:[...], counts:{converted, static, degraded}}`) is surfaced post-import; every degraded/static item links to its location. **This honesty panel is non-negotiable.**

**Per-pattern conversion table:**

| Pattern | Source example | Outcome | No-JS replacement | Phase |
|---|---|---|---|---|
| **ARIA tabs** (`[role=tablist]`/`tab`/`tabpanel`) | soccer Tabs.html (exact match) | **Converts cleanly** | TabsBlot `renderExportNoJS` (radio + `:checked`, tabs.js:153) | **v3.0.0** |
| **`<details>` accordion** | (generic) | **Converts cleanly** | AccordionBlot `renderExportNoJS` (native `<details name>` single-open, accordion.js:166) | **v3.0.0** |
| **Bootstrap tabs** (`data-bs-toggle=tab`) | Interactive components.html | **Converts cleanly** | TabsBlot `renderExportNoJS` | v3.1 |
| **Bootstrap collapse/accordion** (`data-bs-toggle=collapse`) | Interactive components.html | **Converts cleanly** | AccordionBlot (`<details name>` exclusivity) | v3.1 |
| **Language toggle** (`setLang()` + `html[data-lang] .lang-*{display:none}`) | IRCC | **Converts cleanly** | radio + `:checked` switcher (same technique as tabs) | v3.1 |
| **Scroll-reveal** (`.X` opacity:0 + JS adds `.X.revealed`) | M19 `.stat-card` | **Degrades — but mandatory SAFETY pass** | force-visible (`opacity:1!important;transform:none!important`); content visible, animation gone | **v3.0.0** |
| **Bootstrap carousel** (`.carousel-item`, `data-bs-ride`) | Interactive components.html | **Degrades** | CarouselBlot `renderExportNoJS` (scroll-snap/`:target`, carousel.js:254); autoplay dropped | v3.1 |
| **Inline quiz** (`onclick=iqAnswer(this)` + `data-result`) | M19 (5 inline KCs) | **Degrades** | KnowledgeCheckBlot `renderExportNoJS` (radio-sibling `:checked` feedback, kc.js:382); scoring/chime dropped | v3.1 |
| **Multi-screen nav** (`.screen{display:none}/.active`, `goTo(n)`) | M19 (12 screens) | **Degrades** | v3.0.0 flattens to stacked visible sections; later → accordion (reliable) or radio step-machine (experimental); progress bar can't update no-JS | M19 = v3.x |
| **Modal / tooltip / dropdown** | Interactive components.html | **Degrades** | modal → inline section; tooltip → visible text; dropdown → static open list | v3.1 |
| **Bootstrap CDN dependence** (whole file needs external CSS+JS) | Interactive components.html | **Unsupported in v3.0.0** | detect CDN dependence at import and **WARN** the user this file class isn't yet fully supported | v3.x |
| **SCORM / WebAudio chime / clipboard copy / progress bar tracking** | M19 | **Unsupported** | inherently JS, no SharePoint-safe equivalent — salvage DOM, report "dropped: reason" | n/a |

**The single highest-risk degradation** is scroll-reveal: dropping JS alone leaves `.stat-card{opacity:0}` content **silently invisible**. The neutralizer is a **mandatory v3.0.0 safety pass** with a broad heuristic — scan carried CSS for any rule setting `opacity:0`/`transform`/`visibility:hidden` on a class that **also** appears in `classList.add()` string literals in the about-to-be-stripped script; **when in doubt, REVEAL**, and report every neutralized selector.

### 5.3 The 3-pane shell + large-file performance (A1 + A4)

`src/course/shell.js` + `course.css` render a 3-pane layout in `#course-root` (shown when `mode==='course'`):

1. **Outline panel (left):** renders `sections[]` as a list; each row has drag handle, label, kind badge, delete. **Reorder = an immutable array move on `sections[]`** (vanilla pointer-events + `splice`, then re-render preview). This is the **primary structural-editing affordance** and it **sidesteps `contenteditable`'s well-documented mis-nesting problems entirely** — we edit the model, not a live `contenteditable` tree. (v3.0.0 ships up/down buttons; native drag-drop reorder is v3.1.)
2. **Live preview (center):** an **`<iframe sandbox>` with `srcdoc`** = `head.styleText` + theme vars + each section's html/rendered-widget. **The iframe isolates imported CSS from the editor's own CSS** (non-negotiable: imported `<style>` would otherwise clobber the app shell). Off-screen sections get `content-visibility:auto; contain-intrinsic-size:auto 600px` (Baseline as of Sep 2025; ~7× initial-render win per web.dev) so the **5.5MB IRCC preview stays responsive**. `<img loading="lazy" decoding="async">` defers base64 decode — the single biggest freeze-avoidance lever for IRCC.
3. **Code view (right, optional):** a read-mostly view of the current section's sanitized HTML for power edits; edits re-sanitize on blur and write back to `section.html`. **Full-document raw code editing is NOT in v3.0.0** (it reintroduces the parse-everything problem).

**Large-file performance levers (no virtualization in v3.0.0):**
- Parse in a **detached DOMParser document** off the live DOM; never `document.write`/`innerHTML` on the app document.
- **Asset map:** extract every `data:`/external `<img>` into `assets:{ref:{mime,data,w,h,alt}}`; the working tree holds `srcRef` (shrinks the IRCC tree ~99% to ~150KB). Undo stores **patches + inverse-patches, never full-tree clones**. Re-inline base64 only at export.
- Mutate the iframe via **targeted `postMessage{op, nid, html}` patches to a single `data-hce-nid` node** — never re-render the whole 5.5MB document on a keystroke.
- Reuse the existing `>5MB` export warning (export.js ~line 292).

Tree operations are **pure immutable transforms** returning `{tree, patch}` (`moveNode`, `deleteSubtree`, `insertWidget`, `updateBlockHtml`, `swapImage`), per `coding-style.md`. In-place text editing reuses the **transient mini-Quill `RichTextField`** (`src/ui/rich-text-field.js`) on a single leaf — Quill is never the structural container, only a leaf-text editor.

### 5.4 Sanitization policy (the security boundary)

Both passes converge on **vendored DOMPurify** (cure53; `dist/purify.min.js`, single prebuilt UMD ~30–45KB, `window.DOMPurify`, loaded via plain `<script>` — satisfies the vendorable-prebuilt constraint). It runs on **every import section AND every export emission**. Recommended config (reconciling A2/A3/A4):

- Sanitize the **body FRAGMENT, not `WHOLE_DOCUMENT`** (capture `<style>` out-of-band and scope it ourselves in `scope-css.js`) — A2's recommendation, simpler and keeps style-scoping in our control.
- `FORBID_TAGS:['script']`; `ALLOW_DATA_ATTR:true` and explicitly `ADD_ATTR` the **detection attributes** (`data-bs-toggle`, `data-bs-target`, `role`, `aria-controls`, `data-result`, `data-feedback`, `data-tabs`) so matchers can read them — **strip those attrs only AFTER detection**, in the convert step (A3).
- `addHook('uponSanitizeAttribute')` to drop `on*` and `javascript:`/`data:text/html` in `href`/`src`; `addHook` on `<style>` to neutralize `javascript:`/`expression()` in CSS.
- **Preview iframe is `sandbox=""` (no `allow-scripts`)** so even residual markup cannot run.
- **Pin the vendored version**; snapshot-test the four files' sanitized output in an `_import_tests.html` harness mirroring `_nojs_tests.html`.

**Fonts for SharePoint:** drop external Google Fonts `<link>`; fall back to the theme system's system-font stacks for v3.0.0. Self-hosted/subset WOFF2 `@font-face` base64 inlining to recover Anton/Overpass exactly is a **later phase**.

---

## 6. Phasing

Per the kickoff build order and the A1/A4 briefs' own phasing. Each gate is governed by the §8 verification discipline; **the Stage-8 `_nojs_tests.html` 27-case suite stays green throughout** as the regression guard.

| Phase | Scope | Deliverables | Fixtures it must handle |
|---|---|---|---|
| **v3.0.0 — FOUNDATION** | F1 fix | Part 1 modal fix (4 bodies + tabs rightCol + `flex-shrink:0` hardening); optional Part 2 `buildFrame` | all 11 widget edit modals at 600/400px tall, 768px wide |
| | F4 styling | Tokens + Showcase preset + chrome restyle + per-blot export shadow/radius reads | editor + sample export at 320/768/1024/1440; old v2 file loads |
| | F2 code view | Whole-document toggle; reversible Source dialect; golden idempotence | one-of-every-widget round-trip |
| | F3 Phase 1 | `raw-html` blot + `DocStyles` store + sanitize + self-contained/no-JS export | all four fixtures at the raw/code level (no content loss, clean no-JS export) |
| | Course-mode foundation | Mode layer (`app-mode.js`) + v2→v3 migration; importer + sectioning; DOMPurify; 3-pane shell with outline **reorder/delete**; sandboxed `content-visibility` preview; `export-course.js`; **two detectors (ARIA tabs→TabsBlot, `<details>`→AccordionBlot)**; scroll-reveal **safety pass** | **soccer Tabs** (tabs convert), **IRCC** (static + 24 images, lang-toggle dropped, opens without freeze) — the **single-style, simple-JS** class |
| **v3.x — ARC** | M19 multi-screen | `SectionNode.kind:'screen'` + CSS-only screen switching (`:target`/radio); CSS progress bar; quiz → KnowledgeCheckBlot | **M19** (592KB, 12 `.screen`) |
| | Bootstrap rehydration | Vendor `bootstrap.min.css` subset + `data-bs-*` detectors (tabs/accordion/carousel/modal); CDN-dependence warning | **Interactive components.html** |
| | Deep structural editing | Insert/author new sections, cross-section drag-drop, per-section theme overrides, full raw-HTML code view | — |
| | Full performance hardening | Self-hosted WOFF2 fonts; opt-in remote-image `fetch→base64`; windowed virtualization **only if** a real file demands it | files beyond ~15MB |

Treat v3.0.0 (F1 → F4 → F2 → F3 Phase 1 → single-style course import) as the **genuinely achievable foundation**. Treat the rest as the **v3.x arc** — land pattern-by-pattern behind its own verification gate; **do not claim full multi-MB course editing is complete until verified against M19 and IRCC.**

---

## 7. Cross-Cutting Risks & Open Decisions

**Consolidated and deduplicated across all 8 briefs.**

### Risks

| # | Risk | Mitigation / status |
|---|---|---|
| R1 | **XSS from untrusted imported HTML** (same origin as Save/Export/theme) | DOMPurify on every `innerHTML` path AND every export emission; sandboxed (`no-allow-scripts`) preview iframe; sanitize-for-safety == prepare-for-no-JS-export; security-reviewer before commit |
| R2 | **Imported global CSS clobbers editor chrome** | Sandboxed iframe for preview; `.hce-imported-<n>` / `.ql-editor` selector scoping for export/editor injection; never inject imported `<style>` into the parent document |
| R3 | **5.5MB IRCC freezes the tab** | Detached DOMParser (one-shot, C++-fast); never `Read`/log the raw string; asset map keeps the working tree ~150KB; `content-visibility:auto` + `loading=lazy` defer layout AND base64 decode; `setTimeout`-yield size bands; reuse the `>5MB` toast |
| R4 | **`SAVE_VERSION` drifts** across `save-load.js` (line 4) and `html-roundtrip.js` (line 5) | Bump both in one commit; promote to a shared `window.HCE_SAVE_VERSION` const; round-trip-test v3 JSON and v3 HTML |
| R5 | **Stage-8 no-JS regression** (state rules moved into scoped `<style>` lose to inline base styles) | Only ADD static `box-shadow`/`border-radius`; never relocate `:checked`/`:has()` rules; keep all Stage-8 `!important` discipline; re-run `_nojs_selftest.html`; assert zero `<script>`/`on*`/`javascript:` |
| R6 | **F4 showcase look never reaches exports** (no blot reads `--widget-shadow` today) | Per-blot `getPropertyValue('--widget-shadow')` reads are **required, not optional**; verify by export-grepping inlined literals |
| R7 | **Mode-coupling regression** (save-load/export hard-reference `window.contentEditor.quill`) | Keep `window.contentEditor` as the widgets mode's back-compat handle; v2→v3 is a pure `kind:'widgets'` tag so every v2 file loads byte-identically; regression-test on `_nojs_tests.html` **before** touching course code |
| R8 | **Scroll-reveal silent content loss** (`opacity:0` content invisible after JS removal) | Mandatory v3.0.0 force-reveal safety pass with a broad heuristic; default-safe = REVEAL; report every neutralized selector |
| R9 | **Detector false-positives / lossy widget matches** | Conservative detectors (return `null` unless shape is exact); ship only the two high-confidence detectors in v3.0.0; matched sections are reversible to `static`/`raw`; lossy matches visible in preview before export |
| R10 | **CSS scope-prefixing mishandles exotic selectors** (`:has()`, comma attrs, `@keyframes` stops) | Tolerant tokenizer (not a full parser); special-case at-rules; whole-`<style>` containment fallback on uncertainty; fixture-test the four files' `<style>` blocks |
| R11 | **Multi-screen flatten heuristic mis-fires** | Detect structurally (a class set where exactly one has an `.active`/`.show` variant and the base rule hides it), not by literal name `screen`; surface every transform in the report as reversible; also neutralize the `[hidden]` attr (soccer's runtime `panel.hidden` mechanism) |
| R12 | **Quill's flat delta cannot represent nested structure** (the project-killing mistake) | Course mode is a **genuinely separate model + surface** (section/node tree, not delta); Quill reused only for leaf-text editing; the `kind` discriminator keeps the two cleanly separated |
| R13 | **Keyboard-a11y downgrade** (radio `:checked` tabs ≠ roving tabindex) | Document as a known best-effort tradeoff; radio approach is still keyboard-operable + screen-reader navigable; offer "keep original interactive JS" as a non-SharePoint export variant later |
| R14 | **Bootstrap CDN file silently breaks** (stripped CSS+JS → unstyled inert markup) | Honest per-document report ("required external Bootstrap; components will be unstyled/inert"); do NOT pretend auto-conversion works in v3.0.0; vendored CSS subset + `data-bs-*` detectors are v3.x |

### Open decisions (to ratify with the human)

- **Save-format union** — confirm the §3.4 reconciliation: one top-level `kind:'widgets'|'course'` union; A2's scoped-HTML and A4's node-tree-plus-asset-map are internal representations of a course section, not separate document kinds.
- **`buildFrame` adoption** (F1 Part 2) — land now or as a follow-up; confirm it returns parts only (no close wiring) and that F2/F3 consume it for any new modal.
- **Blockquote mapping** (F3) — add a `blockquote` line attr to `deltaToHtml` (recommended, round-trip fidelity) vs map to the existing quote widget (lossy for plain quotes).
- **Import entry point** — explicit "Open HTML…" item in the Load dropdown vs only the `NO_EMBED` fallback (recommend an explicit item + prompt at the `NO_EMBED` branch).
- **Import REPLACE vs insert-at-cursor** — recommend REPLACE, guarded by unsaved-changes status.
- **Outline panel placement** in course mode — hide the theme sidebar and show the outline there (imported files carry their own design; HCE theme only governs export wrappers).
- **Store original `sourceHtml`** alongside `{blotName, data}` for matched widgets so a bad detector match is losslessly revertible (recommend yes).
- **Preserve imported `<style>` vs re-theme** — likely preserve (soccer Tabs looks intentional; re-theming degrades it); layer HCE theme only on unstyled fallback sections.
- **Embed `CourseDoc` JSON** (`hce-project-data`) into course exports for re-editability (recommend yes, mirroring widgets round-trip).
- **M19 screen-nav default** — accordion (reliable, native a11y) vs sectioned single page vs experimental radio step-machine (recommend accordion default, step-machine opt-in/experimental).
- **IRCC bilingual** — collapse to one language vs preserve both via `:checked` toggle (the `@media print` rule already shows both → suggests retaining both).
- **`<iframe>`/`<video>`/`<audio>`/`<svg>` through sanitize** — proposal: allow svg/img/video/audio (no remote src), FORBID iframe (SharePoint strips it anyway).
- **Vendor Bootstrap CSS in v3.0.0** vs drop-with-warning — lean vendor (CSS-only asset, better first impression on the Bootstrap file).
- **Asset-map persistence** — inline base64 in the saved JSON for v3.0.0 (preserves single-file/no-backend contract; flag the size) vs a future zip/multi-file save.
- **DOMPurify version pin + provenance** — pick a version, commit the `dist` file, note provenance (no package manager in this repo today).

---

## 8. Verification

Per the **mandate already written in `v3_kickoff_prompt.md` §4** — apply to **every** feature before marking it done; no feature ships on red or unverified:

1. **Define success criteria** — explicit, measurable, in the feature's section.
2. **Enumerate verification cases** — concrete scenarios + inputs, the four real fixtures, multi-instance, accessibility, and **regression** (existing widgets + both export modes).
3. **Build/extend an automated browser self-test** in the `_nojs_tests.html` style: mount exports/UI in an **isolated iframe**; **await the real content load** (guard against the initial `about:blank` load event); **kill CSS transitions/animations before measuring** (`* { transition:none !important; animation:none !important }`) — both were real false-negative traps in Stage 8; emit a pass/fail matrix with an **evidence string** per case.
4. **Run it live** over localhost (`python -m http.server 8137 --directory "<project>"` or the preview `hce` config); capture a screenshot.
5. **Fix until 100% green** — first decide **harness bug vs. real bug** (Stage 8 surfaced both) and fix the right one.
6. **Report honestly** — the matrix + evidence + an explicit list of anything best-effort/degraded/unverifiable (real SharePoint rendering, multi-MB performance on low-end machines).
7. **Keep `_nojs_tests.html` green** throughout v3 — the no-JS regression guard; extend it as widgets/exports change.
8. Then update `handoff.md` + docs, and move to the next feature.

**Highest-value verification cases per feature:**

- **F1:** open each of the 4 fixed modals (tabs, carousel, hotspot, click-reveal), stuff every rich-text field with long content, at viewport ~600px and ~400px tall / 768px wide; assert the footer's bounding rect is fully within the viewport, the Save button is clickable (not covered), and the **body/inner column** is the scrolling element (not the page). Regression: the 4 already-correct modals, the 3 simple modals, JSON save/load (version stays correct), both export modes.
- **F2:** the **golden idempotence test** — a fixture Delta with one of every widget + h1–h3 + bold/italic/underline + nested lists + empty paragraphs; assert `delta === parseSourceToDelta(buildSourceHtml(delta))` deep-equal, run **twice** to catch second-pass drift. Widget-data byte-equality (include a knowledge-check with obfuscated answer and a carousel with a base64 image). Parse-error matrix: unknown `data-widget-type`, truncated base64, `<script>`, `on*`, unbalanced tags → toggle REFUSED, content preserved, banner names the issue, no partial `setContents`. Diff the no-JS export before vs after a round-trip.
- **F3 Phase 1:** import each of the four fixtures → assert no throw, **no silent content loss** (a fidelity report lists kept vs dropped), recognizable preview, round-trip export, and a **clean no-JS export** (zero `<script>`/`on*`/`javascript:`, no external CDN in self-contained mode). Migration: a real v2 JSON, a v2 Save-HTML, and a v1 file all migrate to v3 with widgets intact. Scope-leak: body/universal rules don't restyle app chrome but appear in the export.
- **F4:** Playwright/preview screenshots of editor + a representative export at **320/768/1024/1440**; switch every preset incl. Showcase (assert every `DEFAULT_THEME` key applied + active-preset highlight); load a pre-v3 project file and assert sane defaults; **export grep** for inlined `box-shadow`/`border-radius` literals on each widget card (proves deliverable (d) reached exports); re-run `_nojs_selftest.html` PASS banner; accessibility/contrast pass.
- **Course mode:** an `_import_tests.html` harness mirroring `_nojs_tests.html` over all four fixtures — **soccer Tabs** → no-JS tabs that actually switch; **IRCC** opens without freezing (deferred decode) and exports English-complete with 24 images; **M19** imports with **no invisible content** (scroll-reveal cards forced visible); **Bootstrap file** imports with an honest "unstyled/inert" report; reorder two sections and re-export successfully; the ConversionReport lists every converted/static/degraded item.

---

_End of v3 master plan. This document supersedes scattered per-brief notes for v3 planning; update `handoff.md`'s pointer when work begins, per `CLAUDE.md`._
