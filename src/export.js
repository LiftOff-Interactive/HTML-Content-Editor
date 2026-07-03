(function () {
  'use strict';

  // ── HTML escaping ─────────────────────────────────────────────────────────

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Inline format application ─────────────────────────────────────────────

  // Allowlist scheme check for exported <a href> — mirrors delta-html.js's
  // safeLinkHref (kept as a separate copy: export.js loads before
  // delta-html.js and must not depend on it). 'about:blank' is included
  // because Quill's own Link.sanitize rewrites pasted unsafe links to it.
  function safeLinkHref(url) {
    const u = String(url).trim();
    if (u === 'about:blank') return true;
    if (/^(https?:|mailto:|tel:|#|\.)/i.test(u)) return true;
    if (/^\/(?!\/)/.test(u)) return true; // single leading slash; '//' (protocol-relative) refused
    return false;
  }

  function applyInlineFormats(text, attrs) {
    let html = esc(text);
    if (!attrs) return html;
    if (attrs.bold)      html = '<strong>' + html + '</strong>';
    if (attrs.italic)    html = '<em>' + html + '</em>';
    if (attrs.underline) html = '<u>' + html + '</u>';
    if (attrs.strike)    html = '<s>' + html + '</s>';
    if (attrs.link && safeLinkHref(attrs.link)) {
      html = '<a href="' + esc(attrs.link) + '">' + html + '</a>';
    }
    return html;
  }

  // ── Block-level alignment ───────────────────────────────────────────────

  const ALIGN_VALUES = { center: true, right: true, justify: true };

  function alignAttr(attrs) {
    return (attrs && ALIGN_VALUES[attrs.align]) ? ' style="text-align:' + attrs.align + '"' : '';
  }

  // ── Delta → HTML ──────────────────────────────────────────────────────────
  //
  // Quill delta ops:
  //   { insert: "text", attributes?: { bold, italic, underline, header, list } }
  //   { insert: { blotName: data } }   ← widget embed
  //
  // Line-level attrs (header, list) live on the terminating \n op.
  // Inline attrs (bold, italic, underline) live on text ops.
  // The two never mix on the same op in a well-formed Quill delta.

  function deltaToHtml(delta, opts) {
    const ops  = (delta && delta.ops) || [];
    const noJs = !!(opts && opts.noJs);
    let widgetSeq   = 0;
    let html        = '';
    let lineBuffer  = '';
    let currentList = null;

    function openList(type) {
      if (currentList === type) return;
      if (currentList) html += currentList === 'ordered' ? '</ol>' : '</ul>';
      currentList = type;
      html += type === 'ordered' ? '<ol>' : '<ul>';
    }

    function closeList() {
      if (!currentList) return;
      html += currentList === 'ordered' ? '</ol>' : '</ul>';
      currentList = null;
    }

    function flushLine(attrs) {
      const inner = lineBuffer;
      lineBuffer = '';
      const align = alignAttr(attrs);

      const list = attrs && attrs.list;
      if (list) {
        openList(list === 'ordered' ? 'ordered' : 'bullet');
        html += '<li' + align + '>' + (inner || '') + '</li>';
        return;
      }

      closeList();

      if (attrs && attrs.header === 1) { html += '<h1' + align + '>' + (inner || '') + '</h1>'; return; }
      if (attrs && attrs.header === 2) { html += '<h2' + align + '>' + (inner || '') + '</h2>'; return; }
      if (attrs && attrs.header === 3) { html += '<h3' + align + '>' + (inner || '') + '</h3>'; return; }

      html += inner ? '<p' + align + '>' + inner + '</p>' : '<p><br></p>';
    }

    for (const op of ops) {

      // Widget embed — renderExport on a detached container (scripts don't execute)
      if (typeof op.insert === 'object' && op.insert !== null) {
        const blotName = Object.keys(op.insert)[0];
        const data     = op.insert[blotName];
        closeList();

        // ResizableImageBlot is registered directly with Quill, not WidgetRegistry.
        if (blotName === 'resizable-image') {
          html +=
            '<div style="display:block;margin:8px 0;">' +
              '<img src="' + esc(data.src || '') + '" ' +
                  'alt="' + esc(data.alt || '') + '" ' +
                  'style="width:' + (data.width || 480) + 'px;max-width:100%;height:auto;display:block;">' +
            '</div>';
          lineBuffer = '';
          continue;
        }

        const Blot = WidgetRegistry.get(blotName);
        if (Blot) {
          const container = document.createElement('div');
          const instance  = Object.create(Blot.prototype);
          // ctx.uid is the ONLY identity source in export — the instance is a
          // bare prototype object, so this._uid (set in attach()) is unavailable.
          const ctx       = { uid: 'wx' + (++widgetSeq), noJs: noJs };
          const useNoJs   = noJs && typeof instance.renderExportNoJS === 'function';
          try {
            if (useNoJs) {
              instance.renderExportNoJS(container, data, ctx);
            } else {
              instance.renderExport(container, data, ctx);
            }
          } catch (err) {
            console.warn('[HCEExport] render failed for', blotName, err);
            container.innerHTML =
              '<div style="padding:1em;background:#fef2f2;border:1px solid #fecaca;' +
              'border-radius:0.5rem;color:#dc2626;font-family:system-ui,sans-serif;' +
              'font-size:0.875rem;">⚠ Widget could not be exported (' + blotName + ')</div>';
          }
          html += container.innerHTML;
        }
        lineBuffer = '';
        continue;
      }

      if (typeof op.insert !== 'string') continue;

      const text  = op.insert;
      const attrs = op.attributes || null;
      const parts = text.split('\n');

      for (let j = 0; j < parts.length; j++) {
        if (parts[j]) lineBuffer += applyInlineFormats(parts[j], attrs);
        if (j < parts.length - 1) flushLine(attrs);
      }
    }

    closeList();
    return html;
  }

  // ── Export CSS ────────────────────────────────────────────────────────────
  // Reads all theme vars from the live document via getComputedStyle so the
  // exported file reflects whatever the user configured — no var() references.

  function buildExportCSS() {
    const cs = getComputedStyle(document.documentElement);
    function get(v) { return cs.getPropertyValue(v).trim(); }

    const fontBody    = get('--font-family-body')    || 'Georgia, serif';
    const fontHeading = get('--font-family-heading') || 'system-ui, sans-serif';
    const fontSize    = get('--font-size-base')      || '1rem';
    const lineHeight  = get('--line-height-base')    || '1.6';
    const maxWidth    = get('--content-max-width')   || '860px';
    const colorBg     = get('--color-background')    || '#ffffff';
    const colorText   = get('--color-text')          || '#1e293b';
    const colorPrimary = get('--color-primary')      || '#2563eb';

    const base = [
      '*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }',
      'html { scroll-behavior: smooth; }',
      'body {',
      '  font-family: ' + fontBody + ';',
      '  font-size: ' + fontSize + ';',
      '  line-height: ' + lineHeight + ';',
      '  color: ' + colorText + ';',
      '  background: ' + colorBg + ';',
      '  padding: 2rem 1rem;',
      '}',
      '.hce-content {',
      '  max-width: ' + maxWidth + ';',
      '  margin: 0 auto;',
      '}',
      'h1, h2, h3 {',
      '  font-family: ' + fontHeading + ';',
      '  color: ' + colorText + ';',
      '  line-height: 1.25;',
      '  margin: 1.5em 0 0.5em;',
      '}',
      'h1 { font-size: 2em; }',
      'h2 { font-size: 1.5em; }',
      'h3 { font-size: 1.25em; }',
      'p { margin: 0.75em 0; }',
      'p:first-child { margin-top: 0; }',
      'strong { font-weight: 700; }',
      'em { font-style: italic; }',
      'u { text-decoration: underline; }',
      's { text-decoration: line-through; }',
      'a { color: ' + colorPrimary + '; text-decoration: underline; text-underline-offset: 2px; }',
      'ul, ol { padding-left: 1.75em; margin: 0.75em 0; }',
      'li { margin: 0.25em 0; }',
      'img { max-width: 100%; height: auto; }',
    ];

    appendOptInRules(base, get);
    return base.join('\n');
  }

  // F4 opt-in document styling: append override rules ONLY when the control is
  // set. Every appended rule comes AFTER the base (later wins), and when all opt
  // vars are empty this adds nothing — so a document that opts into nothing
  // exports byte-identically to the Stage 8 baseline (§3, docs/baselines/).
  function appendOptInRules(base, get) {
    const headingColor  = get('--opt-heading-color');
    const linkColor     = get('--opt-link-color');
    const paraMargin    = get('--opt-paragraph-margin');
    const headingMargin = get('--opt-heading-margin');
    if (headingColor)  base.push('h1, h2, h3 { color: ' + headingColor + '; }');
    if (headingMargin) base.push('h1, h2, h3 { margin: ' + headingMargin + '; }');
    if (paraMargin)    base.push('p { margin: ' + paraMargin + ' 0; }', 'p:first-child { margin-top: 0; }');
    if (linkColor)     base.push('a { color: ' + linkColor + '; }');
  }

  // ── Download helpers ──────────────────────────────────────────────────────

  function slugify(text) {
    const slug = String(text)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return (slug || 'export') + '.html';
  }

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.style.cssText =
      'position:fixed;bottom:20px;right:20px;z-index:9999;' +
      'background:#1e293b;color:#fff;padding:12px 16px;' +
      'border-radius:6px;font-size:13px;' +
      'font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;' +
      'box-shadow:0 4px 12px rgba(0,0,0,0.2);max-width:300px;line-height:1.4;';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 6000);
  }

  function triggerDownload(html, filename) {
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Main export pipeline ──────────────────────────────────────────────────

  function exportHtml(opts) {
    opts = opts || {};
    const btnId = opts.noJs ? 'export-sharepoint-btn' : 'export-btn';
    const label = opts.noJs ? 'Export for SharePoint' : 'Export HTML';
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.disabled    = true;
      btn.textContent = 'Exporting…';
    }

    // Yield to the browser so the button state repaints before synchronous work.
    setTimeout(function () {
      try {
        _runExport(opts);
      } catch (err) {
        showToast('Export failed — check the console for details.');
        console.error('[HCEExport]', err);
      } finally {
        if (btn) {
          btn.disabled    = false;
          btn.textContent = label;
        }
      }
    }, 20);
  }

  function buildExportHtml(delta, title, opts) {
    const bodyHtml = deltaToHtml(delta, opts);
    const css      = buildExportCSS();

    const lines = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="UTF-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  <title>' + esc(title) + '</title>',
      '  <style>',
      css,
      '  </style>',
    ];

    // Styles captured from an imported HTML document (F3). Emitted ONLY when
    // present so non-imported documents' export output stays byte-identical
    // to the Stage 8 baseline (docs/baselines/ — protected contract).
    // Escape EVERY '</' at the emission point ('<\/' is an escaped '/' in
    // CSS, visually identical): documentStyles can arrive from a loaded JSON
    // payload, not just our own import capture, and an unescaped '</style>'
    // would end the style element early and let a '<script>' go LIVE — while
    // a '</head>' would hijack html-roundtrip's replace('</head>') injection.
    const docStyles = ((window.HCEDocState && window.HCEDocState.getDocumentStyles()) || '')
      .replace(/<\//g, '<\\/');
    if (docStyles) {
      lines.push('  <style data-hce-imported-styles>');
      lines.push(docStyles);
      lines.push('  </style>');
    }

    lines.push(
      '</head>',
      '<body>',
      '  <main class="hce-content">',
      bodyHtml,
      '  </main>',
      '</body>',
      '</html>'
    );
    return lines.join('\n');
  }

  function _runExport(opts) {
    opts = opts || {};
    const editor = window.contentEditor;
    if (!editor || !editor.quill) {
      console.error('[HCEExport] contentEditor not ready');
      return;
    }

    const delta = editor.quill.getContents();
    const title = (editor.getDocumentTitle && editor.getDocumentTitle()) || 'Exported Document';
    const html  = buildExportHtml(delta, title, opts);

    const sizeBytes = new Blob([html]).size;
    if (sizeBytes > 5 * 1024 * 1024) {
      showToast(
        'Large export: ' + (sizeBytes / (1024 * 1024)).toFixed(1) +
        ' MB — mainly due to embedded images. Download will proceed.'
      );
    }

    const filename = opts.noJs
      ? slugify(title).replace(/\.html$/, '') + '-sharepoint.html'
      : slugify(title);
    triggerDownload(html, filename);
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('export-btn');
    if (btn) btn.addEventListener('click', function () { exportHtml(); });

    var sbtn = document.getElementById('export-sharepoint-btn');
    if (sbtn) sbtn.addEventListener('click', function () { exportHtml({ noJs: true }); });
  });

  window.HCEExport = {
    exportHtml: exportHtml,
    exportHtmlNoJs: function () { exportHtml({ noJs: true }); },
    buildExportHtml: buildExportHtml,
  };
})();
