# Feature — Callout / Alert Box Widget

## What It Is
A highlighted notice box with an icon, optional title, and body text. Common in eLearning for tips, warnings, notes, and important information. The simplest widget — ideal for proving the full blot pipeline.

## Widget Data Schema
```json
{
  "_v": 1,
  "type": "info",
  "title": "Note",
  "body": "This is important information the learner should notice."
}
```

**Type options**: `info`, `warning`, `success`, `danger`
Each type has a different icon and accent color derived from the theme.

## Visual Design
- Left border accent (4px, colored by type)
- Icon (ℹ️ / ⚠️ / ✅ / ❌ or SVG icons)
- Optional bold title line
- Body text (supports basic HTML: bold, italic, links)
- Background: light tint of the type's color or `--color-surface`

## Acceptance Criteria
- [ ] Widget inserts via slash command (`/callout`) and toolbar dropdown
- [ ] Edit modal has: type selector (4 options), title field, body textarea
- [ ] Changes in the modal update the widget on "Save" click
- [ ] "Cancel" closes without changes
- [ ] Renders correctly in the editor with all 4 types visually distinct
- [ ] Renders correctly in exported HTML with inline styles (no external CSS dependency)
- [ ] Colors use CSS custom properties in editor; resolved inline values in export
- [ ] Accessible: has `role="alert"` or `role="note"` as appropriate

## Open Questions
- [ ] Should the body support rich text (bold, italic, links) or plain text only? Rich text is more useful but adds complexity to the edit UI. Suggest: plain text for v1, rich text in a later pass.
- [ ] Should the icon be an emoji (zero dependency, works everywhere) or an SVG icon set? SVG looks better but requires an icon library or hand-coding each. Suggest: emoji for v1 as they inline naturally.
- [ ] Should the user be able to customize the label text (e.g., "Pro Tip" instead of "Note")? Yes — make the title field editable rather than auto-populated from type.
