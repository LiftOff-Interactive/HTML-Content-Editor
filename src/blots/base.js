/**
 * BaseWidgetBlot — the shared Quill BlockEmbed all widgets extend.
 *
 * Subclass contract:
 *   Static fields (required):
 *     blotName        {string}  unique Quill format name, e.g. 'callout'
 *     tagName         {string}  host element tag, usually 'div'
 *     widgetName      {string}  machine name matching blotName
 *     widgetLabel     {string}  human label shown in palettes, e.g. 'Callout'
 *     widgetIcon      {string}  emoji or short string icon
 *     widgetDescription {string} one-line description for the command palette
 *     defaultData     {object}  plain object with sensible defaults for new instances
 *
 *   Instance methods to override:
 *     renderEditor(container, data)  — populate container for the in-editor view
 *     renderExport(container, data)  — populate container for the exported HTML view
 *                                      (must be fully self-contained: no external deps)
 *     edit(data)                     — open edit UI; call this.updateData(newData) when done
 */
(function () {
  'use strict';

  const BlockEmbed = Quill.import('blots/block/embed');

  class BaseWidgetBlot extends BlockEmbed {
    static blotName = 'widget-base';
    static tagName  = 'div';

    // ── Quill lifecycle ────────────────────────────────────────────────────

    static create(data) {
      const node = super.create();
      const merged = Object.assign({}, this.defaultData || {}, data || {});
      node.setAttribute('data-widget-data', JSON.stringify(merged));
      node.setAttribute('data-widget-type', this.blotName);
      node.setAttribute('contenteditable', 'false');
      node.classList.add('widget-blot', 'widget-blot--' + this.blotName);
      return node;
    }

    static value(node) {
      try {
        return JSON.parse(node.getAttribute('data-widget-data') || 'null') || {};
      } catch {
        return {};
      }
    }

    // attach() fires once after Quill mounts the node into the document.
    attach() {
      super.attach();
      if (this._ready) return;
      this._ready = true;

      const data = this.constructor.value(this.domNode);
      this.renderEditor(this.domNode, data);

      this.domNode.addEventListener('click', () => {
        this.edit(this.constructor.value(this.domNode));
      });
    }

    // ── Public API used by edit() after the user saves changes ─────────────

    // Persist new data back to the DOM and re-render the editor view.
    // Also fires a custom event so editor.js can keep the Quill delta in sync.
    updateData(newData) {
      this.domNode.setAttribute('data-widget-data', JSON.stringify(newData));
      this.domNode.innerHTML = '';
      this.renderEditor(this.domNode, newData);

      this.domNode.dispatchEvent(new CustomEvent('widget-updated', {
        bubbles: true,
        detail: { blot: this, data: newData },
      }));
    }

    // ── Methods subclasses override ────────────────────────────────────────

    renderEditor(container, data) {
      const icon  = this.constructor.widgetIcon  || '□';
      const label = this.constructor.widgetLabel || 'Widget';
      container.innerHTML =
        '<div class="widget-placeholder">' +
          '<span class="widget-placeholder-icon">' + icon + '</span>' +
          '<span class="widget-placeholder-label">' + label + '</span>' +
        '</div>';
    }

    renderExport(container, data) {
      container.innerHTML = '';
    }

    edit(data) {
      alert('Edit: ' + (this.constructor.widgetLabel || 'Widget'));
    }
  }

  window.BaseWidgetBlot = BaseWidgetBlot;
})();
