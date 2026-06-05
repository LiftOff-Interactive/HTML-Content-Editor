# Feature — Blot Base Class

## What It Is
The shared Quill Custom Blot pattern that every widget extends. This is the most architecturally important file in the project. Getting it right means every future widget is easy to add. Getting it wrong means refactoring everything.

## What It Defines
Every widget blot must implement:
- `static create(data)` — given widget data, returns the root DOM node
- `static value(node)` — given the root DOM node, returns the widget data (inverse of create)
- `renderEditor(container, data)` — renders the editable version in the editor
- `renderExport(container, data)` — renders the self-contained interactive version for export
- Static metadata: `blotName`, `tagName`, `widgetName`, `widgetLabel`, `widgetIcon`, `widgetDescription`, `defaultData`

## Acceptance Criteria
- [ ] `src/blots/base.js` is written and well-commented (this is worth documenting clearly)
- [ ] The base class handles the Quill embed registration boilerplate
- [ ] The base class stores widget data in a `data-widget` attribute as JSON on the root node
- [ ] `static value(node)` reliably reads that data back (this is how Quill serializes the delta)
- [ ] The base class dispatches a click event to open edit UI
- [ ] `src/registry.js` has a `register(BlotClass)` function and a `getAll()` function
- [ ] One stub widget (`CalloutBlot` with hardcoded placeholder content) proves the pattern works

## Conceptual API
```js
class WidgetBlot extends BaseWidgetBlot {
  static blotName = 'callout'
  static tagName = 'div'
  static widgetName = 'callout'
  static widgetLabel = 'Callout'
  static widgetIcon = '⚠️'
  static widgetDescription = 'A highlighted alert or notice box'
  static defaultData = { type: 'info', title: '', body: '' }

  static create(data) { /* returns DOM node */ }
  static value(node) { /* returns data object */ }
  renderEditor(container, data) { /* editable version */ }
  renderExport(container, data) { /* standalone interactive version */ }
}

registry.register(CalloutBlot)
```

## Key Design Decisions to Nail
- **Data storage**: Store widget data as `JSON.stringify(data)` in a `data-widget-data` attribute on the root element. This survives Quill's delta serialization and makes `value()` trivial.
- **Two render modes**: The editor render can assume Quill and `src/` JS are loaded. The export render must produce completely standalone HTML — all styles inline or in a `<style>` block, all behavior in inline `<script>` blocks with no external deps.
- **Edit trigger**: A click on the blot should open an edit panel/modal. The base class handles the click listener; subclasses provide the edit UI.

## Open Questions
- [ ] **Edit UI pattern**: When a user clicks a widget to edit it, what opens? Options:
  - (a) A modal dialog with form fields for the widget's data
  - (b) A slide-in side panel
  - (c) Inline contenteditable fields inside the blot itself
  - Recommendation: Modal for v1 — simplest to implement consistently across all widgets, avoids contenteditable conflicts with Quill
- [ ] **Quill 2.0 Blot API**: Has the Blot API changed significantly from Quill 1.x? Need to verify with Quill 2.0 docs before implementing. The `Embed` blot type is likely the right base.
- [ ] **Export render isolation**: Should each widget's export HTML include its own `<style>` block? Yes — each widget should be self-contained in the export so they don't interfere with each other or the page.
- [ ] **Data versioning in blots**: Should widget data include a schema version field? Suggest yes: `{ _v: 1, type: 'info', title: '', body: '' }`. This enables future migrations.
