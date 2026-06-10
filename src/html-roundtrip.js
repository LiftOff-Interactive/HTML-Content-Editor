(function () {
  'use strict';

  var EMBED_ID     = 'hce-project-data';
  var SAVE_VERSION = 2;

  // ── Save as HTML ──────────────────────────────────────────────────────────
  // Builds the same viewable export as Export HTML, then embeds the full
  // project JSON inside a <script type="application/json"> tag so the file
  // can be loaded back into the editor later.

  function saveAsHtml() {
    var editor = window.contentEditor;
    if (!editor || !editor.quill) return;

    var delta = editor.quill.getContents();
    var title = (editor.getDocumentTitle && editor.getDocumentTitle()) || 'Document';
    var theme = window.ThemePanel ? window.ThemePanel.getCurrentTheme() : {};

    var payload    = { version: SAVE_VERSION, content: delta, theme: theme };
    // Escape any </script> in the JSON so the HTML parser doesn't close the tag early.
    // JSON allows \/ as an escape for /, so JSON.parse round-trips it correctly.
    var projectJson = JSON.stringify(payload).replace(/<\/script>/gi, '<\\/script>');

    var baseHtml = window.HCEExport.buildExportHtml(delta, title);

    // Inject the embed script before </head> so it doesn't affect rendering.
    var embedTag =
      '<script type="application/json" id="' + EMBED_ID + '">\n' +
      projectJson + '\n' +
      '</script>';
    var html = baseHtml.replace('</head>', embedTag + '\n</head>');

    var slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'project';
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

  window.HCERoundtrip = { saveAsHtml: saveAsHtml, loadFromHtml: loadFromHtml };
})();
