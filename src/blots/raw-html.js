/**
 * RawHtmlBlot — a block of raw HTML. Two jobs:
 *   1. F3 import fallback: any subtree the importer can't map natively is
 *      wrapped in one of these, so nothing is ever dropped.
 *   2. Power-user block: insertable from the palette, editable as source.
 *
 * The stored HTML is sanitized at every render (defense in depth — data can
 * arrive via import, the edit modal, code-view JSON, or a loaded project file):
 * scripts removed, on* attributes removed, javascript: URLs neutralized.
 * That keeps both export modes clean, including the no-JS SharePoint path.
 */
(function () {
  'use strict';

  function sanitized(html) {
    if (window.HCEImport && window.HCEImport.sanitizeHtml) {
      return window.HCEImport.sanitizeHtml(html).html;
    }
    // Fallback only if html-import.js failed to load (importForeignHtml already
    // refuses import without HCEImport, so this is defense-in-depth for stored
    // raw-html blots under a partial script-load). Strip dangerous elements
    // whole and neutralize handler/scheme obfuscations the primary sanitizer
    // catches structurally.
    return String(html || '')
      .replace(/<(script|iframe|object|embed|meta|base|link|template|frame|frameset|applet)\b[\s\S]*?<\/\1\s*>/gi, '')
      .replace(/<(script|iframe|object|embed|meta|base|link|template|frame|frameset|applet)\b[^>]*>/gi, '')
      .replace(/[\s/]on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, ' ')
      .replace(/\bsrcdoc\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/(javascript|vbscript):/gi, 'blocked:');
  }

  class RawHtmlBlot extends BaseWidgetBlot {
    static blotName          = 'raw-html';
    static tagName           = 'div';
    static widgetName        = 'raw-html';
    static widgetLabel       = 'HTML Block';
    static widgetIcon        = '🧩';
    static widgetDescription = 'A block of raw HTML — imported content or hand-written markup';
    static defaultData       = { _v: 1, html: '<p>Raw HTML block — click to edit the markup.</p>' };

    renderEditor(container, data) {
      container.innerHTML =
        '<div class="raw-html-widget">' +
          '<span class="raw-html-badge" title="Raw HTML block — rendered as-is in exports">HTML</span>' +
          '<div class="raw-html-content">' + sanitized(data.html) + '</div>' +
        '</div>';
    }

    renderExport(container, data) {
      container.innerHTML = sanitized(data.html);
    }

    renderExportNoJS(container, data) {
      // sanitized() already guarantees no <script>/on*/javascript: anywhere.
      container.innerHTML = sanitized(data.html);
    }

    edit(data) {
      WidgetModal.open({
        title: 'Edit HTML Block',
        width: '640px',
        fields: [
          { key: 'html', label: 'HTML source', type: 'textarea', rows: 14, mono: true },
        ],
        data: data,
      }).then((newData) => {
        if (newData) this.updateData(Object.assign({}, data, newData));
      });
    }
  }

  WidgetRegistry.register(RawHtmlBlot);
})();
