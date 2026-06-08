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
- [x] Widget inserts via slash command (`/callout`) and toolbar dropdown — registry + slash command already wired
- [x] Edit modal has: type selector (4 options), title field, body textarea
- [x] Changes in the modal update the widget on "Save" click — via `updateData()`
- [x] "Cancel" closes without changes — modal resolves `null` on cancel
- [ ] Renders correctly in the editor with all 4 types visually distinct — **needs human verification**
- [ ] Renders correctly in exported HTML with inline styles (no external CSS dependency) — **needs human verification**
- [x] Colors use CSS custom properties in editor; resolved inline values in export — CSS classes in editor, `getComputedStyle` in export
- [x] Accessible: has `role="alert"` (danger) or `role="note"` (others) on the host element

## Open Questions (resolved)
- [x] Body: plain text for v1 — HTML-escaped before rendering
- [x] Icons: emoji (zero dependency) — ℹ️ / ⚠️ / ✅ / 🚨
- [x] Title: editable text field, not auto-populated from type
