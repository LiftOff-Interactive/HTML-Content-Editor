# Feature — Toolbar Widget Dropdown

## What It Is
A secondary widget insertion point in the main Quill toolbar. A "Insert Widget" button opens a dropdown showing all registered widgets — the same list as the slash command, just accessed differently.

## Why It Exists
- Discoverability: new users may not know about the slash command
- Mouse-first users: some people prefer clicking to typing commands
- The toolbar is always visible; the slash command requires knowing the trigger

## Acceptance Criteria
- [ ] Toolbar has an "Insert Widget" button (icon + label or icon only with tooltip)
- [ ] Clicking it opens a dropdown listing all registered widgets (name + icon)
- [ ] Clicking a widget in the dropdown inserts it at the current cursor position
- [ ] Clicking outside the dropdown closes it without inserting
- [ ] The dropdown shows the same widgets as the slash command (both read from the registry)
- [ ] The button has a visible active/open state

## Implementation Notes
- This is a custom Quill toolbar control — use Quill's custom toolbar format pattern or just add a custom button outside the Quill toolbar container and handle insertion manually
- The simpler approach: a button in the app header bar (not inside the Quill toolbar) that opens a modal/dropdown. This avoids fighting Quill's toolbar DOM.
- On widget selection: `quill.focus()` first to restore cursor, then `quill.insertEmbed(quill.getSelection().index, blotName, defaultData)`
- Reuse the same widget list UI component from the slash command — don't duplicate the rendering logic

## File Structure
```
src/
  toolbar.js         — toolbar button setup, dropdown logic
  styles/
    toolbar.css      — toolbar and dropdown styling
```

## Open Questions
- [ ] **Toolbar placement**: Should the widget button live inside the Quill toolbar HTML, or in the app's own header bar? Recommend: app header bar. Quill's toolbar is for text formatting; widget insertion is an app-level action.
- [ ] **Shared UI component**: The slash command palette and the toolbar dropdown show the same list. Should they share a single `WidgetPicker` component? Yes — extract to `src/widget-picker.js`. Avoids two different lists getting out of sync.
- [ ] **Grouping**: Should widgets be grouped in the dropdown (e.g., "Text", "Media", "Interactive", "Assessment")? Nice for discoverability when the list is long. Not essential for v1 with ~15 widgets.
