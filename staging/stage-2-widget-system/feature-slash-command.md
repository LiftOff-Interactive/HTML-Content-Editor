# Feature — Slash Command

## What It Is
The `/` key interception that opens a command palette for inserting widgets. Type `/` anywhere in the editor → a dropdown appears with all registered widgets → type to filter → press Enter to insert.

## Acceptance Criteria
- [ ] Typing `/` at the start of a line or after a space opens the command palette
- [ ] The palette shows all registered widgets (name + icon + short description)
- [ ] Typing additional characters filters the list (substring match is fine)
- [ ] Pressing `↑`/`↓` navigates the list
- [ ] Pressing `Enter` inserts the selected widget and closes the palette
- [ ] Pressing `Escape` closes the palette without inserting
- [ ] Clicking a list item inserts that widget
- [ ] The `/` character that triggered the palette is removed when a widget is inserted
- [ ] The palette closes if the cursor moves away from the trigger position
- [ ] Palette is positioned near the cursor (not always top-left)

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
- [ ] **Trigger position**: Should `/` only trigger the palette at the start of an empty line (Rise behavior), or anywhere (Notion behavior)? Notion-style (anywhere) is more flexible and probably what users expect.
- [ ] **Empty line requirement**: If the user types `/` mid-sentence, should it still open the palette? Yes, but when a widget is inserted it will be on its own line (blots are block-level). Quill handles this automatically for embed blots.
- [ ] **Fuzzy vs. substring match**: Substring match is simpler and fine for ~20 widgets. If the list grows to 50+, consider a simple fuzzy matcher. Not needed for v1.
- [ ] **Keyboard trap**: While the palette is open, `↑`, `↓`, `Enter`, `Escape` must be intercepted before Quill sees them. Use `preventDefault()` carefully to avoid fighting Quill's own keyboard handling.
