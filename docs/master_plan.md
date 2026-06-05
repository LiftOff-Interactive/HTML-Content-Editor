# HTML Content Editor — Master Plan

_Written for a brand-new session with zero prior context. Read this and you'll know the whole project._

---

## Pitch

HTML Content Editor is a free, self-hosted WYSIWYG authoring tool for instructional designers and content owners. You build rich, interactive eLearning content directly in the browser. When you're done, you export a single, fully self-contained HTML file that deploys anywhere — web server, SharePoint, Confluence, email attachment, course portal. No subscription. No lock-in. No backend.

---

## Problem & Why

Tools like Articulate Rise and BrightSpace dominate eLearning content authoring, but they have two compounding problems:

1. **Price** — Articulate 360 costs ~$1,000+/year per seat. For freelancers, small teams, and organizations where only one or two people author content, this is hard to justify.
2. **Control** — These tools are intentionally opinionated. Branding, layout, interaction patterns, and export formats are constrained to what the platform allows. If you want something the tool doesn't support, you're stuck.

The result: instructional designers either overpay for features they don't need, or they compromise on what they can actually produce.

HTML Content Editor solves both. It's free, open-source, and outputs raw HTML — the most portable format on the web.

---

## Target Users & Use Cases

**Primary users:**
- Instructional designers at companies that have bought into Articulate/Rise/BrightSpace and want an escape hatch
- Freelance eLearning developers who can't justify per-seat pricing
- Content owners (subject-matter experts who author their own material) without technical HTML skills

**Top jobs to be done:**
1. Build a visually polished interactive page (tabs, accordions, flip cards) without writing HTML by hand
2. Export something that works in the LMS / intranet / SharePoint page without an IT ticket
3. Brand the output to match the organization's style guide

**The one feature they can't live without:**
The export. If the HTML file doesn't work perfectly as a standalone file, nothing else matters.

---

## v1 Scope

### In scope
- Quill 2.0 editor as the writing surface (text, headings, lists, bold/italic)
- Custom Blot system — each widget is a self-contained interactive element embedded inline
- Slash command ( `/` ) to insert widgets by name (fuzzy search)
- Toolbar dropdown as a secondary widget insertion point
- Theme panel: set CSS custom properties (colors, fonts, spacing) that apply across the whole document
- JSON project file: save (download) and load (upload) — no cloud, no backend
- Self-contained HTML export: one file, zero external dependencies, all assets base64-inlined
- **Tier 1 widgets**: Callout/Alert, Tabs, Accordion, Stylized Quote/Pull Quote, Timeline
- **Tier 2 widgets**: Flip Cards, Click & Reveal, Carousel/Image Slider, Hotspot, Knowledge Check
- GitHub Pages hosting of the editor itself
- Works as a locally-opened HTML file (no server needed)

### Explicitly out of v1
- SCORM / xAPI / any LMS communication protocol
- Backend, user accounts, or cloud storage of any kind
- Collaboration or multi-author workflows
- Monetization or paid tiers
- Tier 3 widgets (Scenario/branching, Image Comparison, Video Embed, Labeled Diagram, Expandable Table, Progress/Checklist, Stat/Number Highlight, Audio Player)
- Mobile authoring (export must work on mobile; the editor itself targets desktop browsers)
- Plugin / extension system for third-party widget developers

---

## Future Roadmap (6–12 Months Post-v1)

The only clear future direction is **more widgets**. The architecture should make adding a new widget feel like filling in a template, not re-engineering the system.

Tier 3 widgets (post-v1):
- Scenario / branching snippet
- Image comparison (before/after slider)
- Video embed (YouTube/Vimeo + local file)
- Labeled diagram (image + overlaid text labels)
- Expandable table (collapsible row categories)
- Progress / checklist (localStorage persistence)
- Stat / number highlight (animated counter)
- Audio player (styled HTML5 + transcript toggle)

Nothing in the current architecture should make adding these harder. The blot base class and widget registry pattern must stay extensible.

---

## Tech Stack & Key Decisions

| Decision | Choice | Why |
|---|---|---|
| Editor | Quill 2.0 | Framework-agnostic, clean Blot system for custom embeds, bundles to a single JS file for offline export |
| Language | Vanilla JS | No framework overhead, no dependency churn, works as a plain HTML file without a build step |
| Widgets | Custom Quill Blots | Self-contained nodes that own their HTML/CSS/JS, render identically in editor and export |
| Theming | CSS custom properties | Trivially injected into the export's `<style>` block at export time |
| Save format | JSON download/upload | Portable, explicit, works without a backend, versioned from day one |
| Export | Inline everything | Zero runtime dependencies — works in air-gapped environments, SharePoint, email |
| Hosting | GitHub Pages + local HTML | Free, no infrastructure, works offline |
| Backend | None | Deliberately excluded — simplicity is a feature |

---

## Architecture Sketch

```
index.html
├── <style> — CSS custom properties (theme vars) + global styles
├── Quill editor surface — the writing area
├── Toolbar — standard Quill tools + widget insertion dropdown
├── Theme panel — sidebar/modal, sets CSS vars live
├── Save/Load buttons — JSON download/upload
├── Export button — triggers the export engine
│
src/
├── editor.js          — Quill init, toolbar config
├── blots/
│   ├── base.js        — shared Blot base class all widgets extend
│   ├── callout.js
│   ├── tabs.js
│   └── ...            — one file per widget
├── registry.js        — widget registry (name, label, icon, defaultData)
├── slash-command.js   — intercepts '/' keypress, fuzzy-searches registry
├── theme.js           — reads/writes CSS custom properties, theme panel UI
├── save-load.js       — JSON serialize/deserialize Quill delta + widget data
└── export.js          — inlines CSS, JS, images; outputs single HTML file
```

**Key invariant:** Every widget blot must be 100% functional in both the editor context (editable) and the exported HTML (interactive, read-only). No widget may depend on Quill at runtime in the export.

---

## Staged Roadmap

| Stage | Goal | Headline Feature | Definition of Done |
|---|---|---|---|
| 1 — Foundation | Working editor shell | Quill 2.0 + theme panel | Editor loads, text works, theme vars update live |
| 2 — Widget System | Infrastructure for all widgets | Blot base class + slash command | `/callout` inserts a placeholder; toolbar shows widget list |
| 3 — Tier 1 Widgets | Five production-quality widgets | Callout, Tabs, Accordion, Quote, Timeline | All 5 render in editor and export correctly |
| 4 — Export Engine | Shippable HTML output | Single self-contained HTML, zero deps | Exported file opens in incognito with no network calls |
| 5 — Tier 2 Widgets | Five richer interactive widgets | Flip Cards, Click & Reveal, Carousel, Hotspot, Knowledge Check | All 5 render in editor and export correctly |
| 6 — Polish + Release | Public v1 | GitHub repo public + Pages live | Repo is public, Pages URL works, README is clear |

---

## Open Questions & Risks

### Open Questions
- **Widget edit UX**: When a user clicks an existing widget in the editor, how do they edit its content? Options: (a) inline contenteditable fields inside the blot, (b) a modal/panel that opens with the widget's data, (c) double-click to open edit mode. This is the biggest UX decision not yet made.
- **Image handling in widgets**: For widgets that contain images (Hotspot, Carousel), where do images come from? User uploads a file → it gets base64-encoded immediately? Or a URL input? Base64 immediately is simpler for the export story.
- **JSON schema versioning**: What's the migration strategy when the schema changes? Even a simple `version: 1` field and "warn if version mismatch" is better than nothing.
- **Quill delta vs. custom JSON**: Quill stores content as a Delta. For widgets, we'll store them as embed blots with data. We need to decide early how widget data is embedded in the delta so save/load is reliable.

### Risks
- **Quill 2.0 maturity**: Quill 2.0 was a long time in development. The Custom Blot API may have rough edges or sparse documentation. Budget extra time for this.
- **Export fidelity**: Making the exported HTML look and behave exactly like the editor view is the hardest engineering problem in this project. CSS scoping, JS isolation per widget, and font embedding all need careful testing.
- **File size**: A document with many image-heavy widgets (Carousel, Hotspot) will produce large exported HTML files when images are base64-encoded. This could make email delivery impractical for heavy content. Consider warning the user when export size exceeds a threshold.
- **Solo pace**: No deadline, but also no help. Scope creep is the main risk. The Tier 2 widgets are significantly more complex than Tier 1 — be honest when a widget needs to slip to post-v1.

---

## Glossary

| Term | Meaning |
|---|---|
| Blot | Quill's term for a custom content node. Every widget is a Blot. |
| Delta | Quill's JSON format for document content. The save format wraps this. |
| Widget | An interactive element (accordion, tabs, etc.) that lives in the editor as a Blot and in the export as self-contained HTML/JS. |
| Embed blot | A type of Quill Blot for non-text, atomic content — the right type for widgets. |
| Widget registry | A central map of all available widget types. The slash command and toolbar both read from it. |
| Theme vars | CSS custom properties (`--primary-color`, etc.) set by the theme panel and inlined at export. |
| Self-contained export | The exported HTML file has zero external dependencies — everything is inlined. |
| Tier 1 / 2 / 3 | Build priority groupings for widgets. Tier 1 = simplest, Tier 3 = most complex / post-v1. |
