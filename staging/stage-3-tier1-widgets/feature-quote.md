# Feature — Stylized Quote / Pull Quote Widget

## What It Is
A visually distinct quotation block — larger than normal text, often with a large decorative quotation mark, optional attribution, and a styled background or border. Used in eLearning for expert quotes, key takeaways, and memorable statements.

## Widget Data Schema
```json
{
  "_v": 1,
  "style": "pull",
  "quote": "The only way to do great work is to love what you do.",
  "attribution": "Steve Jobs",
  "role": ""
}
```

**Style options**:
- `pull` — large centered text, oversized opening quotation mark
- `sidebar` — left-border accent, smaller, more compact
- `highlight` — colored background box with the quote text

## Visual Design
- Pull: large `font-size` (1.5–2×), centered, `--color-primary` decorative `"` character, attribution below in smaller italic
- Sidebar: left border (`--color-primary`), normal size, attribution below
- Highlight: `--color-surface` or `--color-primary` background, padding, rounded corners
- All styles should look intentional, not like a default blockquote

## Acceptance Criteria
- [x] Widget inserts via slash command (`/quote`) and toolbar dropdown
- [x] Edit modal: quote text (textarea), attribution (text field, optional), role (text field, optional, e.g. "CEO, Acme Corp"), style selector (3 options)
- [x] All 3 styles render correctly in editor and export
- [x] Quote text supports basic formatting (bold, italic) — store as HTML
- [x] Uses `<blockquote>` element in the export HTML (semantic)
- [x] Accessible: `<cite>` element wraps attribution
- [x] Renders correctly in exported HTML with no external dependencies

## Implementation Notes
- Decorative `"` mark is a literal `<span>` in the DOM (not `::before`) — works in both editor and export without needing a `<style>` block
- Pull/sidebar/highlight styles all use CSS classes in editor render, fully resolved inline styles in export
- `WidgetModal.open()` used (simple 4-field widget, no custom modal needed)
- Quote text stored as raw HTML and rendered with innerHTML; attribution/role are escaped plain text

## Open Questions (resolved)
- [x] Decorative quotation mark: literal `<span>` with `"` character — no `::before` needed
- [x] Character limit: none for v1 — no hard or soft limit implemented
- [x] Image avatar: out of scope for v1
