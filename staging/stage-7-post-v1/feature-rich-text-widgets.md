# Feature — Rich Text Editing Inside Widgets

## What This Is
All widget edit modals currently use plain `<textarea>` or `<input>` elements for text content. This feature replaces them with embedded mini Quill editors, giving authors full formatting control (bold, italic, underline, font size, color, links, bullet lists, numbered lists) inside every widget.

---

## Approach: `RichTextField` Utility

Create a reusable `RichTextField` class (`src/ui/rich-text-field.js`) that wraps a minimal Quill instance. Every widget `edit()` method calls `new RichTextField(container, initialHtml)` instead of creating a `<textarea>`.

### Why embedded Quill (vs contenteditable toolbar):
- Quill is already loaded — zero additional payload
- Consistent paste handling (strips unwanted formatting from Word/web pastes)
- Delta → HTML serialization is built in
- Toolbar is already styled to match the main editor (Snow theme)

### Mini toolbar spec
```
Bold | Italic | Underline | Strike
Font Size (small / normal / large / huge)
Text Color
Link
Ordered List | Bullet List
Clear Formatting
```
No image insertion inside widget text fields (images have their own dedicated fields, handled in feature-image-control.md).

### `RichTextField` API
```js
class RichTextField {
  constructor(mountEl, initialHtml = '')  // creates Quill instance inside mountEl
  getHtml()                               // returns innerHTML of Quill root (trimmed)
  focus()
  destroy()                              // must be called when modal closes
}
```

Call `destroy()` in the modal's `onClose` / `onCancel` cleanup. Failing to destroy leaks Quill instances.

---

## Data Format Change → Save Format v2

### v1 (current)
Widget data fields are plain strings:
```json
{ "type": "info", "content": "Here is some important text." }
```

### v2 (new)
Widget text-content fields store HTML strings:
```json
{ "type": "info", "content": "<p>Here is some <strong>important</strong> text.</p>" }
```

### Backward-compat migration (v1 → v2)
In `save-load.js` (and in `html-roundtrip.js`), after detecting `version: 1`:
- Walk every op in the Quill delta
- For any widget embed whose text-content fields are plain strings (do not start with `<`), wrap them: `"Hello"` → `"<p>Hello</p>"`
- Bump version to `2` before loading

This is safe because `<p>plain text</p>` renders identically to `plain text` in the exported HTML.

---

## Per-Widget Field Breakdown

Mark each field as **rich** (gets a `RichTextField`) or **plain** (stays `<input>`, used as a label/title).

### Callout (`callout.js`)
| Field | Type |
|-------|------|
| Type selector (info/warning/success/danger) | plain — radio/select |
| Content body | **rich** |

### Quote (`quote.js`)
| Field | Type |
|-------|------|
| Style selector | plain |
| Quote text | **rich** |
| Attribution / cite | plain (inline label, rarely needs formatting) |

### Timeline (`timeline.js`)
Per item:
| Field | Type |
|-------|------|
| Date / label | plain |
| Title | plain |
| Description | **rich** |
| Icon | plain |

### Accordion (`accordion.js`)
Per item:
| Field | Type |
|-------|------|
| Header / title | plain (acts as a button label) |
| Content body | **rich** |

### Tabs (`tabs.js`)
Per tab:
| Field | Type |
|-------|------|
| Tab label | plain |
| Tab content | **rich** |

### Flip Cards (`flip-cards.js`)
Per card:
| Field | Type |
|-------|------|
| Front heading | plain |
| Front body | **rich** |
| Back heading | plain |
| Back body | **rich** |

### Click-Reveal (`click-reveal.js`)
| Field | Type |
|-------|------|
| Trigger label | plain (the button/link text, keep short) |
| Revealed content | **rich** |

### Carousel (`carousel.js`)
Per slide:
| Field | Type |
|-------|------|
| Slide title | plain |
| Slide caption / body | **rich** |
| Image | dedicated image field (see feature-image-control.md) |

### Hotspot (`hotspot.js`)
Per pin:
| Field | Type |
|-------|------|
| Pin label (short) | plain |
| Tooltip body | **rich** |

### Knowledge Check (`knowledge-check.js`)
| Field | Type |
|-------|------|
| Question text | **rich** |
| Option text (each) | plain (kept short, answer choices) |
| Per-option feedback | **rich** |
| Hint text | **rich** |

---

## Rendering in the Editor (`renderEditor`)

Each widget's `renderEditor` already sets `innerHTML` of its container. With rich text fields, the stored HTML is inserted directly — no change needed beyond updating the data shape read from `this.data`.

---

## Rendering in Export (`renderExport`)

Same as above — the stored HTML is already valid HTML. No escaping needed. The export engine inlines it as-is. Widget-level CSS already scopes styling correctly.

---

## Implementation Files

| File | Change |
|------|--------|
| `src/ui/rich-text-field.js` | **New** — `RichTextField` class |
| `src/blots/callout.js` | `edit()` — content textarea → `RichTextField` |
| `src/blots/quote.js` | `edit()` — quote text textarea → `RichTextField` |
| `src/blots/timeline.js` | `edit()` — per-item description → `RichTextField` |
| `src/blots/accordion.js` | `edit()` — per-item content → `RichTextField` |
| `src/blots/tabs.js` | `edit()` — per-tab content → `RichTextField` |
| `src/blots/flip-cards.js` | `edit()` — per-card front/back body → `RichTextField` |
| `src/blots/click-reveal.js` | `edit()` — revealed content → `RichTextField` |
| `src/blots/carousel.js` | `edit()` — per-slide caption → `RichTextField` |
| `src/blots/hotspot.js` | `edit()` — per-pin tooltip body → `RichTextField` |
| `src/blots/knowledge-check.js` | `edit()` — question, feedback, hint → `RichTextField` |
| `src/save-load.js` | v1 → v2 migration on load |
| `src/styles/main.css` | Scope mini Quill toolbar styles inside `.widget-modal` |

---

## Styling Notes
- The Snow theme toolbar will render inside the modal. It may need reduced padding/font-size to feel proportional.
- Add a `.widget-modal .ql-toolbar` rule in `main.css` to constrain height and font size.
- The Quill editor area inside a modal needs a min-height (e.g. `80px`) and a max-height with `overflow-y: auto` to avoid modals growing unbounded.
- For list-based widgets (timeline, accordion, etc.) that create Quill instances per item, init them lazily: create when an accordion item is expanded in the modal, destroy when collapsed or modal closes.

---

## Checklist
- [x] `src/ui/rich-text-field.js` — `RichTextField` class with constructor, `getHtml()`, `focus()`, `destroy()`
- [x] Modal CSS — scoped mini toolbar styles in `main.css`
- [x] `callout.js` — content → RichTextField
- [x] `quote.js` — quote text → RichTextField
- [x] `timeline.js` — description → RichTextField (per item)
- [x] `accordion.js` — content → RichTextField (per item)
- [x] `tabs.js` — tab content → RichTextField (per tab)
- [x] `flip-cards.js` — front body, back body → RichTextField (per card)
- [x] `click-reveal.js` — revealed content → RichTextField
- [x] `carousel.js` — caption → RichTextField (per slide)
- [x] `hotspot.js` — tooltip body → RichTextField (per pin)
- [x] `knowledge-check.js` — question, feedback, hint → RichTextField
- [x] `save-load.js` — v1 → v2 migration (wrap bare strings in `<p>`)
- [x] Save format version bumped to `2` on all new saves
- [x] Manual test: open a v1 save file → loads correctly with no data loss
- [x] Manual test: format text in every widget, export → formatting appears in exported HTML
- [x] Memory check: opening and closing modals multiple times doesn't leak Quill instances (verify with DevTools → Memory)

---

## Open Questions
- [ ] For the Knowledge Check option texts: they're short and used as answer labels. If authors abuse rich text there, layout may break. Consider keeping those as plain inputs and revisiting if users request it.
- [ ] Lazy init for list widgets (accordion, timeline, etc.) vs eager init — finalize during implementation based on actual modal complexity.
