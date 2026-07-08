# Contributing to HTML Content Editor

## Reporting Bugs

Open an issue at [github.com/LiftOff-Interactive/HTML-Content-Editor/issues](https://github.com/LiftOff-Interactive/HTML-Content-Editor/issues).

Include: what you did, what you expected, what happened, and the browser + OS.

## Suggesting Features

Open an issue with the label `enhancement`. Widget requests are especially welcome — describe the learning interaction the widget enables, not just the visual appearance.

---

## Adding a New Widget

Every widget is a self-contained Quill Custom Blot. Follow these four steps.

### Step 1 — Create the blot file

Create `src/blots/my-widget.js`. Use the template below.

### Step 2 — Register it

Add a `<script>` tag for your file in `index.html`, after the other blot files:

```html
<script src="src/blots/my-widget.js"></script>
```

That's it — the blot self-registers on load.

### Step 3 — Test in the editor

1. Serve locally (`python -m http.server 8080`)
2. Press `/` and type your widget name — it should appear in the palette
3. Insert it, click Edit, verify the modal works
4. Export to HTML and verify the exported widget is functional with zero JS errors

### Step 4 — Open a pull request

Target `main`. Describe what the widget does and include a short screencast or screenshot.

---

## Widget Code Template

```js
(function () {
  'use strict';

  // ─── Metadata ─────────────────────────────────────────────────────────────

  const BLOT_NAME    = 'my-widget';   // must be unique; kebab-case
  const TAG          = 'div';
  const CLASS_NAME   = 'hce-my-widget-blot';

  // ─── Default data ─────────────────────────────────────────────────────────

  const DEFAULTS = {
    title:   'My Widget',
    content: 'Default content here.',
  };

  // ─── Blot ─────────────────────────────────────────────────────────────────

  class MyWidgetBlot extends BaseWidgetBlot {

    // Required: metadata for the slash command and toolbar
    static blotName   = BLOT_NAME;
    static tagName    = TAG;
    static className  = CLASS_NAME;
    static widgetName = 'My Widget';                  // human label
    static widgetIcon = '🧩';                         // emoji shown in the palette
    static widgetDesc = 'One-sentence description.';  // shown in the palette

    // Default data used when the widget is first inserted
    static defaultData() {
      return { ...DEFAULTS };
    }

    // ── Editor render ────────────────────────────────────────────────────────
    // Called once when the blot is attached to the editor DOM.
    // Build the read-only preview the author sees while writing.

    renderEditor(container, data) {
      container.innerHTML = `
        <div class="my-widget-preview">
          <strong>${data.title}</strong>
          <p>${data.content}</p>
        </div>
      `;
    }

    // ── Edit modal ───────────────────────────────────────────────────────────
    // Called when the author clicks the Edit button.
    // Open a WidgetModal, collect input, return the new data object.
    // Must return a Promise that resolves to the updated data (or rejects to cancel).

    edit(currentData) {
      return WidgetModal.open({
        title: 'Edit My Widget',
        fields: [
          { type: 'text',     name: 'title',   label: 'Title',   value: currentData.title },
          { type: 'textarea', name: 'content', label: 'Content', value: currentData.content },
        ],
      });
    }

    // ── Export render ────────────────────────────────────────────────────────
    // Called during HTML export. Write fully self-contained HTML into `container`.
    // - No external resources (no CDN links, no src= pointing to localhost)
    // - All JS must be inline (IIFE or event handlers)
    // - All CSS must be inline styles or a <style> block written into container

    renderExport(container, data) {
      const style = `
        <style>
          .hce-my-widget { border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 16px; }
          .hce-my-widget h3 { margin: 0 0 8px; }
        </style>
      `;
      container.innerHTML = `
        ${style}
        <div class="hce-my-widget">
          <h3>${data.title}</h3>
          <p>${data.content}</p>
        </div>
      `;
    }
  }

  // ─── Register ─────────────────────────────────────────────────────────────
  // Self-registration — no manual wiring needed anywhere else.

  WidgetRegistry.register(MyWidgetBlot);

})();
```

---

## Key Contracts

| Rule | Why |
|------|-----|
| `renderExport` must be fully self-contained | The exported file has zero external dependencies |
| Never access `window.contentEditor` or Quill in `renderExport` | The export runs in a detached DOM container |
| `edit()` must return a Promise | The base class `await`s it and calls `updateData` on resolve |
| Set `static blotName` to a unique kebab-case string | Quill uses this as the delta embed key |
| Keep `renderEditor` and `renderExport` under 50 lines each | Split helpers out if they grow |

## Dev Tips

- `BaseWidgetBlot` in `src/blots/base.js` handles click-to-edit, the Edit button, `widget-updated` events, and error state — you only need to implement `renderEditor`, `renderExport`, and `edit`.
- `WidgetModal.open(config)` in `src/ui/modal.js` supports field types: `text`, `textarea`, `select`, `checkbox`, `image` (base64 upload).
- The accordion, flip-cards, and knowledge-check blots are good reference implementations for medium-complexity widgets.
- Always test your widget's exported HTML in a browser opened from `file://` — that's the deployment scenario most users will hit.
