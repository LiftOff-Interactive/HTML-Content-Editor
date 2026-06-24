(function () {
  'use strict';

  // ── Course-mode export ──────────────────────────────────────────────────────
  // Renders a CourseDoc to a single self-contained, JavaScript-free HTML file.
  // matched-widget sections flow through the SAME widget seam the widgets-mode
  // export uses (Object.create(Blot.prototype) + renderExportNoJS), so converted
  // tabs/accordions become radio/:checked/<details> interactivity with zero JS.
  // static sections emit their sanitized HTML; captured CSS (external-neutralized)
  // + the scroll-reveal safety overrides reproduce the imported look.

  function renderWidget(widget, seq) {
    var Blot = window.WidgetRegistry.get(widget.blotName);
    if (!Blot) return '';
    var container = document.createElement('div');
    var inst = Object.create(Blot.prototype);
    var ctx = { uid: 'cw' + seq, noJs: true };
    try {
      if (typeof inst.renderExportNoJS === 'function') inst.renderExportNoJS(container, widget.data, ctx);
      else inst.renderExport(container, widget.data, ctx);
    } catch (e) {
      container.innerHTML = '<div style="padding:1em;background:#fef2f2;border:1px solid #fecaca;' +
        'border-radius:0.5rem;color:#dc2626;">⚠ Section could not be rendered (' + widget.blotName + ')</div>';
    }
    return container.innerHTML;
  }

  function buildCourseHtml(courseDoc, opts) {
    opts = opts || {};
    var EX = window.HCEExport;
    var sections = (courseDoc && courseDoc.sections) || [];
    var seq = 0;

    var bodyHtml = sections.map(function (s) {
      if (s.kind === 'matched-widget' && s.widget) return renderWidget(s.widget, ++seq);
      return (s.html || '');               // static — already sanitized at build time
    }).join('\n');

    var head = courseDoc.head || {};
    var importedCss = window.DocStyles ? window.DocStyles.neutralizeExternal(head.styleText || '') : (head.styleText || '');
    var css = [
      EX.buildExportCSS(),
      importedCss ? '\n/* ── imported document styles ── */\n' + importedCss : '',
      head.scrollRevealCss ? '\n' + head.scrollRevealCss : '',
    ].join('\n');

    return [
      '<!DOCTYPE html>',
      '<html lang="' + (head.metaLang || 'en') + '">',
      '<head>',
      '  <meta charset="UTF-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  <title>' + EX.esc(courseDoc.title || 'Course') + '</title>',
      '  <style>',
      css,
      '  </style>',
      '</head>',
      '<body>',
      '  <main class="hce-content">',
      bodyHtml,
      '  </main>',
      '</body>',
      '</html>',
    ].join('\n');
  }

  window.HCECourse = window.HCECourse || {};
  window.HCECourse.buildCourseHtml = buildCourseHtml;
})();
