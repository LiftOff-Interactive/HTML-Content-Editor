# Feature — Blot Base Class ✓ DONE

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
- [x] `src/blots/base.js` is written and well-commented
- [x] The base class handles the Quill BlockEmbed registration boilerplate
- [x] Widget data stored as JSON in `data-widget-data` attribute on the root node
- [x] `static value(node)` reads the attribute back — how Quill serializes the delta
- [x] The base class attaches a click listener in `attach()` that calls `edit(data)`
- [x] `src/registry.js` has `register(BlotClass)`, `getAll()`, and `get(blotName)` functions; calls `Quill.register` internally
- [x] `CalloutBlot` stub proves the pattern end-to-end (renders preview, modal-based edit — human verified ✓)

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
- [x] **Edit UI pattern**: Using `prompt()` for Stage 2. Real modal dialog planned for Stage 3 when widget content gets complex.
- [x] **Quill 2.0 Blot API**: Uses `BlockEmbed` (`blots/block/embed`). API is compatible. `attach()` lifecycle used for rendering and click wiring.
- [x] **Export render isolation**: Each widget's `renderExport` is responsible for self-contained output. Decided: yes, per-widget `<style>` blocks in export.
- [x] **Data versioning in blots**: `_v: 1` included in `defaultData` for all widgets from day one.
