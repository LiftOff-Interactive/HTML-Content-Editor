(function () {
  'use strict';

  // ── Shared export-time sanitizer for RichTextField-sourced HTML ────────────
  //
  // Rich-text widget fields (callout body, tab/accordion/reveal content,
  // knowledge-check question/feedback/hint, quote, popover, toggle, …) store
  // Quill's raw root.innerHTML and are interpolated straight into exported
  // markup by each widget's renderExport / renderExportNoJS. Quill 2's
  // Link.sanitize covers the normal type/paste path, but the same field can also
  // be populated from code-view JSON, an imported HTML file, or a loaded project
  // file — so we sanitize again at export time as defense in depth. This upholds
  // the same contract the no-JS SharePoint export depends on: zero live
  // <script>, on* handler, or javascript:/vbscript: URL in the output.
  //
  // Prefers the canonical DOM sanitizer (html-import.js — loaded on the editor
  // page, and the strongest against parser-differential tricks); falls back to
  // a best-effort regex pass when that file isn't present (bare test harnesses,
  // partial script loads). The regex pass is strictly weaker than the DOM path
  // (a text denylist can't fully entity-decode); every page that ships exports
  // loads html-import.js, so the fallback is defense-in-depth only. For
  // already-safe HTML both paths are the identity function, so exports of
  // untampered documents stay byte-for-byte identical (protected §3 contract).
  //
  // Scheme neutralization covers the DOM path's full list (javascript/vbscript/
  // livescript/mocha + data:text/html) and the common entity spellings of ':'
  // (&colon; &#58; &#x3a;) so "javascript&colon;alert(1)" can't re-decode live.
  var SCHEME_COLON = '\\s*(?::|&colon;?|&#0*58;?|&#x0*3a;?)';
  var RX_BAD_SCHEME = new RegExp('(javascript|vbscript|livescript|mocha)' + SCHEME_COLON, 'gi');
  var RX_DATA_HTML  = new RegExp('data' + SCHEME_COLON + '\\s*text/html', 'gi');

  function sanitizeRichHtml(html) {
    if (!html) return '';
    if (window.HCEImport && window.HCEImport.sanitizeHtml) {
      return window.HCEImport.sanitizeHtml(html).html;
    }
    return String(html)
      .replace(/<(script|iframe|object|embed|meta|base|link|template|frame|frameset|applet)\b[\s\S]*?<\/\1\s*>/gi, '')
      .replace(/<(script|iframe|object|embed|meta|base|link|template|frame|frameset|applet)\b[^>]*>/gi, '')
      .replace(/[\s/]on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, ' ')
      .replace(/\bsrcdoc\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(RX_BAD_SCHEME, 'blocked:')
      .replace(RX_DATA_HTML, 'blocked:text/html');
  }

  window.HCESanitize = { rich: sanitizeRichHtml };

  const TOOLBAR = [
    ['bold', 'italic', 'underline', 'strike'],
    [{ size: ['small', false, 'large', 'huge'] }],
    [{ color: [] }],
    [{ align: [] }],
    ['link'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean'],
  ];

  class RichTextField {
    constructor(mountEl, initialHtml) {
      const container = document.createElement('div');
      mountEl.appendChild(container);
      this._quill = new Quill(container, {
        theme: 'snow',
        modules: { toolbar: TOOLBAR },
      });
      if (initialHtml) {
        this._quill.clipboard.dangerouslyPasteHTML(initialHtml);
      }
    }

    getHtml() {
      if (!this._quill) return '';
      const html = this._quill.root.innerHTML;
      // Quill's empty-state sentinel
      if (html === '<p><br></p>' || html === '') return '';
      return html;
    }

    focus() {
      if (this._quill) this._quill.focus();
    }

    destroy() {
      this._quill = null;
    }
  }

  window.RichTextField = RichTextField;
})();
