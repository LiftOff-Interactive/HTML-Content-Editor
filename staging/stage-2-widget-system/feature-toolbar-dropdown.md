# Feature — Toolbar Widget Dropdown

## What It Is
A secondary widget insertion point in the main Quill toolbar. A "Insert Widget" button opens a dropdown showing all registered widgets — the same list as the slash command, just accessed differently.

## Why It Exists
- Discoverability: new users may not know about the slash command
- Mouse-first users: some people prefer clicking to typing commands
- The toolbar is always visible; the slash command requires knowing the trigger

## Acceptance Criteria
- [x] Toolbar has an "Insert Widget" button (icon + label or icon only with tooltip)
- [x] Clicking it opens a dropdown listing all registered widgets (name + icon)
- [x] Clicking a widget in the dropdown inserts it at the current cursor position
- [x] Clicking outside the dropdown closes it without inserting
- [x] The dropdown shows the same widgets as the slash command (both read from the registry)
- [x] The button has a visible active/open state

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
- [x] **Toolbar placement**: Resolved — button lives in `.header-actions` in the app header (right side). Quill toolbar is for text formatting; widget insertion is app-level.
- [x] **Shared UI component**: Resolved — built independently (no shared component). Slash command and toolbar dropdown each render the list from the registry directly. Consolidation deferred; both stay in sync automatically since they both call `WidgetRegistry.getAll()`.
- [x] **Grouping**: Resolved — flat list for v1. Revisit when widget count grows beyond ~10.
