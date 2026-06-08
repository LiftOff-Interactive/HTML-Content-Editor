# Feature — Slash Command

## What It Is
The `/` key interception that opens a command palette for inserting widgets. Type `/` anywhere in the editor → a dropdown appears with all registered widgets → type to filter → press Enter to insert.

## Acceptance Criteria
- [x] Typing `/` at the start of a line or after a space opens the command palette
- [x] The palette shows all registered widgets (name + icon + short description)
- [x] Typing additional characters filters the list (substring match is fine)
- [x] Pressing `↑`/`↓` navigates the list
- [x] Pressing `Enter` inserts the selected widget and closes the palette
- [x] Pressing `Escape` closes the palette without inserting
- [x] Clicking a list item inserts that widget
- [x] The `/` character that triggered the palette is removed when a widget is inserted
- [x] The palette closes if the cursor moves away from the trigger position
- [x] Palette is positioned near the cursor (not always top-left)

## Implementation Notes
- Listen for Quill's `text-change` event; detect when the last character typed is `/`
- Store the cursor position at the time `/` was typed — this is the insertion point
- Use a floating `<div>` for the palette, positioned with `getBoundingClientRect()` from the editor's current cursor bounds (Quill provides `getBounds(index)` for this)
- On insert: delete the `/` character, then call `quill.insertEmbed(index, blotName, defaultData)`
- Keep the palette DOM element in `src/slash-command.js` — don't reach into the editor DOM

## File Structure
```
src/
  slash-command.js   — all slash command logic self-contained here
  styles/
    slash-command.css — palette styling
```

## Open Questions
- [x] **Trigger position**: Notion-style — triggers anywhere, not just start of line.
- [x] **Empty line requirement**: Triggers mid-sentence too; block-level blots handle their own line placement.
- [x] **Fuzzy vs. substring match**: Substring match for v1. Revisit if widget count exceeds ~20.
- [x] **Keyboard trap**: Use `preventDefault()` on `↑`, `↓`, `Enter`, `Escape` while palette is open; restore normal handling on close.
