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
- [ ] Widget inserts via slash command (`/quote`) and toolbar dropdown
- [ ] Edit modal: quote text (textarea), attribution (text field, optional), role (text field, optional, e.g. "CEO, Acme Corp"), style selector (3 options)
- [ ] All 3 styles render correctly in editor and export
- [ ] Quote text supports basic formatting (bold, italic) — store as HTML
- [ ] Uses `<blockquote>` element in the export HTML (semantic)
- [ ] Accessible: `<cite>` element wraps attribution
- [ ] Renders correctly in exported HTML with no external dependencies

## Open Questions
- [ ] **Decorative quotation mark**: Should it be a CSS `::before` pseudo-element or a literal `"` character in the HTML? CSS pseudo-element is cleaner but requires the styles to be present. In export, inline styles handle this — use `::before` in the inlined `<style>` block.
- [ ] **Character limit**: Should there be a character limit on the quote to prevent absurdly long pull quotes? A soft warning (e.g., "Pull quotes work best under 200 characters") is more helpful than a hard limit.
- [ ] **Image avatar for attribution**: Some pull quote designs include a small circular photo next to the attribution. Out of scope for v1.
