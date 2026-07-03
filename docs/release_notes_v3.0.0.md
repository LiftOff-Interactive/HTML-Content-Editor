# HTML Content Editor v3.0.0

The biggest release yet: a JavaScript-free **Export for SharePoint** mode, five new widgets, raw HTML import, a full WYSIWYG ⇄ HTML code view, document styling presets, and a security hardening pass — all still a single self-contained HTML export with zero external dependencies.

## ✨ New: Export for SharePoint (JavaScript-free mode)

SharePoint's Embed web part strips `<script>`, `on*` handlers, and `javascript:` URLs, which broke the standard export's interactive widgets. The new **Export for SharePoint** button renders every widget with pure HTML + CSS — no JavaScript anywhere in the file:

- **Tabs** — radio buttons + `:checked`
- **Accordion** — native `<details>`/`<summary>` (single-open via `<details name>`)
- **Flip cards** — checkbox + `:checked` + `:has()`
- **Click-to-reveal** — native `<details>`
- **Carousel** — CSS scroll-snap + anchor navigation
- **Hotspot** — radio-driven tooltip reveal with close control
- **Knowledge check** — radio + submit-gate grading, all in CSS

Multiple instances of the same widget on one page stay fully independent.

## 🧩 Five new widgets

- **Toggle Reveal** — show/hide content behind a styled switch
- **Popover** — inline term definitions using the native Popover API
- **Editable Box** — a free-form styled container you can type into directly
- **Progress Meter** — visual progress/completion indicator
- **Carousel scroll-snap option** — new navigation style for the existing carousel

All five are CSS-only and work in both export modes.

## 📥 Raw HTML import

Load any HTML file — including pages authored elsewhere — straight into the editor:

- Element-level sanitizer strips scripts, iframes, embeds, and other unsafe markup on the way in
- Known elements map onto native editor content; unknown-but-safe markup is preserved in a Raw HTML block
- Import report tells you exactly what was kept and what was dropped
- Tested against real-world fixtures from 7 KB to 5.5 MB

## 💻 Code view

Toggle the whole document between WYSIWYG and raw HTML and edit either way:

- Fully reversible conversion — round-trips preserve your content exactly
- Inert-template parser doubles as a sanitizer
- Invalid edits are refused with an explanation instead of silently dropping content

## 🎨 Document styling

- **4 professional presets** to restyle an entire document in one click
- **4 opt-in style controls** for finer control
- Default styling is untouched — existing exports remain byte-identical

## 📝 Document naming & New document

- Name your document from the header (falls back to the first H1); the name drives the browser tab, save filename, and export title
- **New** button clears content, title, styles, and theme behind a confirmation

## 📤 Export formatting fixes

Both export modes now emit **text alignment**, **links** (URL-scheme-vetted), and **strikethrough**, which were previously silently dropped from exported files.

## 🔒 Security hardening

- Rich-text widget fields are sanitized at **export time** (defense-in-depth): no `<script>`, `on*` handler, or `javascript:`/`vbscript:` URL can survive into an exported file, even via a tampered project file or imported HTML
- The same sanitization now applies to **in-editor widget previews**, closing a self-XSS path where a malicious imported file could run script inside the authoring app
- HTML import and code view each sanitize independently, so every path content can enter the document is covered

## 🛠 Fixes & internals

- **Widget edit modals** keep the Save button visible and clickable at any viewport height (tabs, click-reveal, carousel, hotspot); hotspot modal got a scrollable image area with a correct pin coordinate frame
- **Save format v3** — adds document title + styling; v1 and v2 project files migrate automatically on load
- Protected export contract with byte-exact baselines (`docs/baselines/`) guards against export regressions
- Seven browser-run regression suites (150+ checks) now cover modals, code view, import, widgets, styling, export formatting, and the no-JS export

## Upgrading

Nothing to do — open the editor and go. Old `.json` project files (v1/v2) load and migrate automatically. Previously exported HTML files are unaffected.
