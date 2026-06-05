# Stage 2 — Widget System

## Goal
Build the infrastructure that all widgets share. By the end of this stage, no widget content exists yet — but the plumbing is complete. A developer (or future Claude session) can add a new widget by creating one file that extends the base class and self-registers. The slash command and toolbar both work.

## Features in This Stage
- `feature-blot-base-class.md` — the shared Quill Custom Blot all widgets extend
- `feature-slash-command.md` — `/` keypress interception, fuzzy search, widget insertion
- `feature-toolbar-dropdown.md` — secondary widget insertion point in the toolbar

## Definition of Done
- [ ] `src/blots/base.js` exists and is well-documented — the template all widget authors follow
- [ ] `src/registry.js` exists — a map of all registered widgets
- [ ] Typing `/` in the editor opens a command palette with a list of widget names
- [ ] Fuzzy-searching the palette filters the list
- [ ] Pressing Enter or clicking a result inserts a placeholder blot for that widget
- [ ] The toolbar has a "Insert Widget" dropdown that shows the same list
- [ ] At least one stub widget (e.g., a "Callout" placeholder with no real UI) proves the system works end to end
- [ ] Clicking a blot in the editor opens some form of edit UI (even a simple `prompt()` at this stage)

## Notes
- The blot base class is the most important design decision in the whole project. Get it right before building any real widget.
- The widget registry pattern decouples the insertion system from the widget implementations — this is what makes adding new widgets easy.
- Fuzzy search for the slash command can be a simple substring match at this stage; it doesn't need to be Fuse.js-level smart.
