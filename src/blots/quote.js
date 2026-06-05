/**
 * QuoteBlot — Pull Quote widget
 *
 * A stylized blockquote for testimonials, pull quotes, or key statements.
 * Data: just a quote text and an optional attribution line — the simplest
 * possible widget to verify that the slash command, insert, and edit modal
 * all work end-to-end.
 */

(function () {
  'use strict';

  class QuoteBlot extends BaseWidgetBlot {
    static blotName          = 'quote';
    static tagName           = 'div';
    static widgetName        = 'quote';
    static widgetLabel       = 'Quote';
    static widgetIcon        = '❝';
    static widgetDescription = 'A stylized pull quote or testimonial';
    static defaultData       = { _v: 1, text: 'Enter your quote here.', attribution: '' };

    renderEditor(container, data) {
      container.innerHTML = `
        <div class="quote-blot" style="
          position: relative;
          padding: 1.5rem 1.5rem 1.25rem 2rem;
          border-left: 4px solid var(--color-primary, #6366f1);
          background: var(--color-surface, #f8fafc);
          border-radius: var(--widget-border-radius, 0.5rem);
          cursor: pointer;
          user-select: none;
        ">
          <div style="
            font-size: 3rem;
            line-height: 1;
            color: var(--color-primary, #6366f1);
            opacity: 0.3;
            font-family: Georgia, serif;
            margin-bottom: -0.5rem;
            pointer-events: none;
          ">❝</div>
          <p style="
            margin: 0.5rem 0 0;
            font-size: 1.15rem;
            font-style: italic;
            line-height: 1.6;
            color: var(--color-text, #1e293b);
          ">${_escapeHtml(data.text)}</p>
          ${data.attribution ? `
            <p style="
              margin: 0.75rem 0 0;
              font-size: 0.875rem;
              color: var(--color-text-muted, #64748b);
              font-style: normal;
            ">— ${_escapeHtml(data.attribution)}</p>
          ` : ''}
          <span style="
            position: absolute;
            top: 0.5rem;
            right: 0.75rem;
            font-size: 0.7rem;
            color: #94a3b8;
            pointer-events: none;
          ">Click to edit</span>
        </div>`;
    }

    renderExport(container, data) {
      container.innerHTML = `
        <style>
          .quote-export {
            position: relative;
            padding: 1.5rem 1.5rem 1.25rem 2rem;
            border-left: 4px solid #6366f1;
            background: #f8fafc;
            border-radius: 0.5rem;
            margin: 1.5rem 0;
          }
          .quote-export__mark {
            display: block;
            font-size: 3rem;
            line-height: 1;
            color: #6366f1;
            opacity: 0.3;
            font-family: Georgia, serif;
            margin-bottom: -0.5rem;
          }
          .quote-export__text {
            margin: 0.5rem 0 0;
            font-size: 1.15rem;
            font-style: italic;
            line-height: 1.6;
          }
          .quote-export__attribution {
            margin: 0.75rem 0 0;
            font-size: 0.875rem;
            opacity: 0.65;
          }
        </style>
        <div class="quote-export">
          <span class="quote-export__mark">❝</span>
          <p class="quote-export__text">${_escapeHtml(data.text)}</p>
          ${data.attribution ? `<p class="quote-export__attribution">— ${_escapeHtml(data.attribution)}</p>` : ''}
        </div>`;
    }
  }

  function _escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  Quill.register('formats/quote', QuoteBlot);
  window.WidgetRegistry.register(QuoteBlot);
})();
