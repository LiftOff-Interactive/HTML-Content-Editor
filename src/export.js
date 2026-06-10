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

  function applyInlineFormats(text, attrs) {
    let html = esc(text);
    if (!attrs) return html;
    if (attrs.bold)      html = '<strong>' + html + '</strong>';
    if (attrs.italic)    html = '<em>' + html + '</em>';
    if (attrs.underline) html = '<u>' + html + '</u>';
    return html;
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

  function deltaToHtml(delta) {
    const ops = (delta && delta.ops) || [];
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

      const list = attrs && attrs.list;
      if (list) {
        openList(list === 'ordered' ? 'ordered' : 'bullet');
        html += '<li>' + (inner || '') + '</li>';
        return;
      }

      closeList();

      const align = attrs && attrs.align;
      const style = align ? ' style="text-align:' + align + ';"' : '';

      if (attrs && attrs.header === 1) { html += '<h1' + style + '>' + (inner || '') + '</h1>'; return; }
      if (attrs && attrs.header === 2) { html += '<h2' + style + '>' + (inner || '') + '</h2>'; return; }
      if (attrs && attrs.header === 3) { html += '<h3' + style + '>' + (inner || '') + '</h3>'; return; }

      html += inner ? '<p' + style + '>' + inner + '</p>' : '<p><br></p>';
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
          try {
            instance.renderExport(container, data);
          } catch (err) {
            console.warn('[HCEExport] renderExport failed for', blotName, err);
            container.innerHTML =
              '<div style="padding:1em;background:#fef2f2;border:1px solid #fecaca;' +
              'border-radius:0.5rem;color:#dc2626;font-family:system-ui,sans-serif;' +
              'font-size:0.875rem;">⚠ Widget could not be exported (' + blotName + ')</div>';
          }
          const align = (data && data.widgetAlign) || 'left';
          if (align === 'center' || align === 'right') {
            html +=
              '<div style="text-align:' + align + ';">' +
                container.innerHTML +
              '</div>';
          } else {
            html += container.innerHTML;
          }
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

    return [
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
      'ul, ol { padding-left: 1.75em; margin: 0.75em 0; }',
      'li { margin: 0.25em 0; }',
      'img { max-width: 100%; height: auto; }',
    ].join('\n');
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

  function exportHtml() {
    const btn = document.getElementById('export-btn');
    if (btn) {
      btn.disabled    = true;
      btn.textContent = 'Exporting…';
    }

    // Yield to the browser so the button state repaints before synchronous work.
    setTimeout(function () {
      try {
        _runExport();
      } catch (err) {
        showToast('Export failed — check the console for details.');
        console.error('[HCEExport]', err);
      } finally {
        if (btn) {
          btn.disabled    = false;
          btn.textContent = 'Export HTML';
        }
      }
    }, 20);
  }

  function _runExport() {
    const editor = window.contentEditor;
    if (!editor || !editor.quill) {
      console.error('[HCEExport] contentEditor not ready');
      return;
    }

    const delta    = editor.quill.getContents();
    const bodyHtml = deltaToHtml(delta);
    const css      = buildExportCSS();
    const title    = (editor.getDocumentTitle && editor.getDocumentTitle()) || 'Exported Document';

    const html = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="UTF-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  <title>' + esc(title) + '</title>',
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

    const sizeBytes = new Blob([html]).size;
    if (sizeBytes > 5 * 1024 * 1024) {
      showToast(
        'Large export: ' + (sizeBytes / (1024 * 1024)).toFixed(1) +
        ' MB — mainly due to embedded images. Download will proceed.'
      );
    }

    triggerDownload(html, slugify(title));
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('export-btn');
    if (btn) btn.addEventListener('click', exportHtml);
  });

  window.HCEExport = { exportHtml };
})();
