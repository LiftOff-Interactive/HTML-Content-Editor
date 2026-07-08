(function () {
  'use strict';

  var EMBED_ID     = 'hce-project-data';
  var SAVE_VERSION = 3;

  // ── Save as HTML ──────────────────────────────────────────────────────────
  // Builds the same viewable export as Export HTML, then embeds the full
  // project JSON inside a <script type="application/json"> tag so the file
  // can be loaded back into the editor later.

  // Builds the round-tripped HTML string (export + embedded project JSON)
  // without any download side effect, so it's directly testable. Returns
  // null if the editor isn't ready.
  function buildEmbeddedHtml() {
    var editor = window.contentEditor;
    if (!editor || !editor.quill) return null;

    var delta = editor.quill.getContents();
    var title = (editor.getDocumentTitle && editor.getDocumentTitle()) || 'Document';
    var theme = window.ThemePanel ? window.ThemePanel.getCurrentTheme() : {};

    var payload    = {
      version: SAVE_VERSION,
      title:   window.HCEDocState ? window.HCEDocState.getTitle() : '',
      documentStyles: window.HCEDocState ? window.HCEDocState.getDocumentStyles() : '',
      content: delta,
      theme:   theme,
    };
    // Escape any </script> in the JSON so the HTML parser doesn't close the tag early.
    // JSON allows \/ as an escape for /, so JSON.parse round-trips it correctly.
    var projectJson = JSON.stringify(payload).replace(/<\/script>/gi, '<\\/script>');

    var baseHtml = window.HCEExport.buildExportHtml(delta, title);

    // Inject the embed script before </head> so it doesn't affect rendering.
    //
    // This is a first-occurrence replace, which is safe here — unlike
    // src/scorm.js's runtime splice (which must anchor on the LAST </body>).
    // The difference is which side of the boundary attacker-reachable
    // content lives on: </head> is the CLOSING tag of a section built
    // entirely from trusted/escaped content (fixed markup, esc()-escaped
    // title, theme CSS drawn only from color-input hex values and fixed
    // <select> options, and documentStyles with every "</" escaped to "<\/").
    // Widget content — including a raw-html block's own <style> tag, which
    // can legitimately contain literal "</head>"/"<body"/"</body>" text
    // inside a CSS comment — only ever appears in bodyHtml, which export.js
    // always emits strictly AFTER </head>. A first-occurrence search can
    // therefore never land on spoofed text: the real tag is always the
    // earliest match. (Verified with a raw-html widget containing exactly
    // that spoof — see the "html round-trip survives a spoofed </head>"
    // regression in _stage11_tests.html.)
    var embedTag =
      '<script type="application/json" id="' + EMBED_ID + '">\n' +
      projectJson + '\n' +
      '</script>';
    return baseHtml.replace('</head>', embedTag + '\n</head>');
  }

  function saveAsHtml() {
    var editor = window.contentEditor;
    if (!editor || !editor.quill) return;

    var html  = buildEmbeddedHtml();
    var title = (editor.getDocumentTitle && editor.getDocumentTitle()) || 'Document';
    var slug  = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'project';
    var blob = new Blob([html], { type: 'text/html' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = slug + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Load from HTML ────────────────────────────────────────────────────────
  // Parses the file text, finds the embedded project JSON tag, and returns
  // the parsed payload. Throws with message 'NO_EMBED' if the tag is absent.

  function loadFromHtml(fileText) {
    var parser = new DOMParser();
    var doc    = parser.parseFromString(fileText, 'text/html');
    var el     = doc.getElementById(EMBED_ID);
    if (!el) throw new Error('NO_EMBED');
    return JSON.parse(el.textContent);
  }

  window.HCERoundtrip = { saveAsHtml: saveAsHtml, loadFromHtml: loadFromHtml, buildEmbeddedHtml: buildEmbeddedHtml };
})();
