# HTML Content Editor — Claude Session Rules

## Project One-Liner
A free, self-hosted WYSIWYG authoring tool that lets instructional designers build rich interactive eLearning content and export a single fully self-contained HTML file deployable anywhere.

## Read This First — Every Session
1. Read `handoff.md` before doing any work. It is the head of the linked list and tells you exactly where the project is.
2. Follow the pointer in `handoff.md` to the active stage folder and feature file.
3. Summarize your understanding back to the user in 3 bullets before touching any code.
4. Confirm "Next Up" items before starting work.

## Document Workflow — Linked List Model
- `handoff.md` = the HEAD. Always reflects current state. Update it every session.
- `staging/<stage>/` = the body. One folder per stage, one file per feature.
- `docs/master_plan.md` = the full vision. Update only when vision or roadmap genuinely changes.
- Never let `handoff.md`'s pointer fall out of sync with where work actually is.

## Tech Stack
- **Editor**: Quill 2.0 (Custom Blots for all widget types)
- **Language**: Vanilla JS — no framework
- **Styling**: CSS custom properties for theming
- **Save format**: JSON project file (download/upload, no backend)
- **Export**: Single self-contained HTML, all assets base64-inlined
- **Hosting**: GitHub Pages (editor) + local HTML file (offline use)
- **Backend**: None. Ever.

## Project Structure
```
project-root/
├── CLAUDE.md
├── handoff.md
├── new_session_prompt.md
├── help.md
├── docs/master_plan.md
├── staging/
│   ├── stage-1-foundation/
│   ├── stage-2-widget-system/
│   ├── stage-3-tier1-widgets/
│   ├── stage-4-export-engine/
│   ├── stage-5-tier2-widgets/
│   └── stage-6-polish-release/
├── src/                        (created during build)
├── .gitignore
└── README.md
```

## Coding Conventions
- Vanilla JS only — no React, Vue, Svelte, or any framework
- No external CDN calls in exported HTML — everything must be inlined at export time
- Each widget is a self-contained Quill Custom Blot — it owns its own HTML, CSS, and JS
- CSS custom properties (`--primary-color`, `--font-family`, etc.) for all theme values
- Widget registry pattern — all widgets register themselves; the slash command and toolbar read the registry
- JSON project schema must be versioned from day one (add a `version` field)
- Files: 200–400 lines typical, 800 max. Split early.
- Functions: < 50 lines. Split early.
- No hardcoded colors, sizes, or font names outside the theme system

## How to Run
**Development**: Serve over localhost — do NOT open `index.html` directly from the filesystem.
Chrome blocks certain Quill internals (clipboard module) when running from `file://`.

Quickest options (pick one):
```
# Python 3
python -m http.server 8080

# Node (no install needed)
npx serve .
```
Then open `http://localhost:8080` in Chrome.

Alternatively: VS Code **Live Server** extension → right-click `index.html` → Open with Live Server.

**Production**: `index.html` on GitHub Pages at the repo URL.

## Branching & Commit Conventions
- `main` — always shippable. Push only complete, working features.
- `stage-N-<name>` — one branch per stage. Merge to main when stage is done.
- Feature work happens on the stage branch. No separate feature branches needed (solo project).
- Commit format: `<type>: <description>` — types: feat, fix, refactor, docs, chore
- Example: `feat: add accordion blot with expand/collapse animation`

## Standing Command — "update all relevant files"
When the user says "update all relevant files":
1. Review what happened this session (what changed, decided, built, failed).
2. Update as needed:
   - `handoff.md` — always. Refresh every section.
   - `new_session_prompt.md` — if pointer or resume instructions changed.
   - `CLAUDE.md` — only if a rule, convention, or stack fact changed.
   - Active feature `.md` files — tick off done items, resolve open questions.
   - Stage `overview.md` files — if scope or done-criteria shifted.
   - `docs/master_plan.md` — only if vision or roadmap genuinely changed.
   - `help.md` — if new human to-dos appeared.
3. Keep linked-list integrity: `handoff.md` pointer must always match real current location.
4. Give a 3–5 line summary of what was updated and why.

## Widget Registry Pattern
Every widget must:
1. Extend the shared Blot base class
2. Self-register in the global widget registry on load
3. Declare: `{ name, label, icon, description, defaultData }`
4. Implement: `create(data)`, `value(node)`, `render()`, `edit()`

## Export Rules
At export time, the engine must:
- Inline all CSS into a `<style>` block
- Inline all JS into a `<script>` block
- Base64-encode all images, fonts, and media
- Resolve all CSS custom property values and inline them
- Output a single `.html` file with zero external dependencies
