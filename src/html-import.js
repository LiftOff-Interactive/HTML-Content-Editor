/**
 * HCEImport — F3 robust raw HTML import (Phase 1: no smart widget mapping).
 *
 *   sanitizeHtml(html)  → { html, removed } — strip <script>, on* attributes,
 *                          neutralize javascript: URLs. Shared with RawHtmlBlot.
 *   importHtml(fileText)→ { delta, documentStyles, suggestedTitle, report }
 *
 * Policy (v3 kickoff F3): throw nothing, drop nothing silently. Recognizable
 * nodes map to native content/blots; every unrecognized subtree is wrapped in
 * a raw-html blot; <style> content is captured into the document-styles store
 * so exports re-emit the imported look. The report lists everything mapped,
 * wrapped, flattened, and removed.
 *
 * Unlike the code view's strict parser (src/delta-html.js — refuse-don't-drop
 * for OUR OWN serialization), this walker is deliberately lenient: foreign
 * files use whitespace as formatting (collapsed here) and contain markup we
 * flatten or wrap rather than refuse.
 */
(function () {
  'use strict';

  var CONTAINER_TAGS = { div: 1, main: 1, section: 1, article: 1, header: 1, footer: 1, aside: 1, nav: 1, figure: 1, center: 1, body: 1 };
  var INLINE_FORMAT = {
    strong: { bold: true }, b: { bold: true },
    em: { italic: true }, i: { italic: true },
    u: { underline: true },
    s: { strike: true }, strike: { strike: true }, del: { strike: true },
  };
  var INLINE_TRANSPARENT = { span: 1, font: 1, small: 1, big: 1, abbr: 1, mark: 1, code: 1, sub: 1, sup: 1, label: 1, time: 1, cite: 1, q: 1 };
  var SKIP_TAGS = { script: 1, style: 1, link: 1, meta: 1, title: 1, base: 1, noscript: 1, template: 1 };

  // ── Sanitizer (shared) ─────────────────────────────────────────────────────
  //
  // The import/raw-html trust boundary: files are third-party, and the no-JS
  // SharePoint export must contain zero live script/handler/redirect. So we
  // (a) delete executable/navigational ELEMENTS outright (denylisting only
  // attributes let iframe[srcdoc], object/embed[data], meta-refresh, and
  // <template>/<svg> internals through), and (b) neutralize dangerous URL
  // schemes after stripping control chars that browsers ignore in schemes.

  // Removed entirely (with content) — can execute, navigate, or embed active content.
  var DANGEROUS_TAGS = {
    script: 1, iframe: 1, frame: 1, frameset: 1, object: 1, embed: 1, applet: 1,
    meta: 1, base: 1, link: 1, noscript: 1, template: 1, portal: 1,
  };
  // URL-bearing attributes whose scheme we must vet.
  var URL_ATTRS = { href: 1, src: 1, 'xlink:href': 1, action: 1, formaction: 1, data: 1, poster: 1, background: 1, cite: 1 };

  function isDangerousUrl(value) {
    // Browsers strip ASCII whitespace and C0 controls from a URL scheme before
    // acting on it, so collapse them before testing (defeats "jav\tascript:").
    var v = String(value).replace(/[\u0000-\u0020]+/g, '').toLowerCase();
    return /^(javascript|vbscript|livescript|mocha):/.test(v) || /^data:text\/html/.test(v);
  }

  function sanitizeNode(rootNode, removed) {
    var toRemove = [];
    var walker = function (node) {
      if (node.nodeType !== 1) return;
      var tag = node.tagName.toLowerCase();
      if (DANGEROUS_TAGS[tag]) {
        toRemove.push(node);
        if (tag === 'script') removed.scripts++; else removed.elements++;
        return;
      }
      for (var i = node.attributes.length - 1; i >= 0; i--) {
        var attr = node.attributes[i];
        var name = attr.name.toLowerCase();
        if (/^on/.test(name) || name === 'srcdoc') {
          node.removeAttribute(attr.name);
          removed.onAttrs++;
        } else if (name === 'http-equiv') {
          node.removeAttribute(attr.name); // meta is dropped anyway; belt-and-braces
          removed.elements++;
        } else if (URL_ATTRS[name] && isDangerousUrl(attr.value)) {
          node.setAttribute(attr.name, '#');
          removed.jsUrls++;
        } else if (name === 'style' && /url\s*\(\s*['"]?\s*(javascript|vbscript):/i.test(attr.value)) {
          node.removeAttribute(attr.name);
          removed.jsUrls++;
        }
      }
      Array.prototype.forEach.call(node.childNodes, walker);
      // <template> is dropped above, but any other element could in principle
      // hold shadow/declarative content — childNodes covers the normal cases.
    };
    Array.prototype.forEach.call(rootNode.childNodes, walker);
    toRemove.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
  }

  function sanitizeHtml(html) {
    var removed = { scripts: 0, onAttrs: 0, jsUrls: 0, elements: 0 };
    var tpl = document.createElement('template');
    tpl.innerHTML = String(html || '');
    sanitizeNode(tpl.content, removed);
    return { html: tpl.innerHTML, removed: removed };
  }

  // Strip @import (pulls whole external stylesheets) from captured CSS and
  // report any remaining off-origin url() beacons — the export must be
  // self-contained (kickoff F3: "no external CDN references").
  function scrubCss(css, report) {
    var imports = css.match(/@import\b[^;]*;?/gi);
    if (imports) {
      report.notes.push(imports.length + ' @import rule(s) removed from captured CSS (external stylesheet).');
      css = css.replace(/@import\b[^;]*;?/gi, '');
    }
    if (/url\(\s*['"]?\s*https?:/i.test(css)) {
      report.notes.push('captured CSS references remote url() assets — the exported file will fetch them (not fully self-contained).');
    }
    return css;
  }

  // ── Import ─────────────────────────────────────────────────────────────────

  function importHtml(fileText) {
    var doc = new DOMParser().parseFromString(String(fileText || ''), 'text/html');
    var report = {
      mapped: {}, wrapped: {}, flattenedInline: 0,
      removed: { scripts: 0, onAttrs: 0, jsUrls: 0, elements: 0 },
      notes: [],
    };

    // Head scripts vanish with the head; count them for the report.
    report.removed.scripts += doc.head ? doc.head.querySelectorAll('script').length : 0;

    // Note external stylesheets BEFORE sanitize (it removes <link> elements),
    // and capture <style> text (sanitize leaves <style> alone).
    var externals = doc.querySelectorAll('link[rel="stylesheet"][href]');
    if (externals.length) {
      report.notes.push(externals.length + ' external stylesheet link(s) skipped (cannot inline remote CSS): ' +
        Array.prototype.map.call(externals, function (l) { return l.getAttribute('href'); }).join(', '));
    }
    var styleChunks = [];
    Array.prototype.forEach.call(doc.querySelectorAll('style'), function (styleEl) {
      styleChunks.push(styleEl.textContent);
      if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    });

    sanitizeNode(doc.body, report.removed);

    // @import stripped; export.js escapes '</' at the emission point (single
    // owner of that invariant, covering JSON-loaded payloads too).
    var documentStyles = scrubCss(styleChunks.join('\n'), report);

    var ops = [];
    var ctx = { ops: ops, report: report };

    walkChildrenAsBlocks(doc.body, ctx);

    if (!ops.length) ops.push({ insert: '\n' });
    report.mappedTotal = Object.keys(report.mapped).reduce(function (n, k) { return n + report.mapped[k]; }, 0);
    report.wrappedTotal = Object.keys(report.wrapped).reduce(function (n, k) { return n + report.wrapped[k]; }, 0);

    return {
      delta: { ops: ops },
      documentStyles: documentStyles,
      suggestedTitle: (doc.title || '').trim(),
      report: report,
    };
  }

  function count(bucket, key) { bucket[key] = (bucket[key] || 0) + 1; }

  // ── Block-level walk ───────────────────────────────────────────────────────

  function walkChildrenAsBlocks(el, ctx) {
    var inlineBuf = [];
    var flushInline = function () {
      if (!inlineBuf.length) return;
      var holder = document.createElement('p');
      inlineBuf.forEach(function (n) { holder.appendChild(n.cloneNode(true)); });
      inlineBuf = [];
      if (holder.textContent.trim() || holder.querySelector('img')) {
        emitTextBlock(holder, {}, ctx, 'p');
      }
    };

    Array.prototype.forEach.call(el.childNodes, function (node) {
      if (node.nodeType === 3) {
        if (node.nodeValue.trim()) inlineBuf.push(node);
        return;
      }
      if (node.nodeType !== 1) return; // comments dropped (foreign files; not authored content)
      var tag = node.tagName.toLowerCase();

      if (INLINE_FORMAT[tag] || INLINE_TRANSPARENT[tag] || tag === 'a' || tag === 'br') {
        inlineBuf.push(node);
        return;
      }
      flushInline();

      if (SKIP_TAGS[tag]) return;
      if (CONTAINER_TAGS[tag]) { walkChildrenAsBlocks(node, ctx); return; }
      handleBlock(node, tag, ctx);
    });
    flushInline();
  }

  function handleBlock(node, tag, ctx) {
    if (/^h[1-6]$/.test(tag)) {
      var level = parseInt(tag.charAt(1), 10);
      if (level > 3) ctx.report.notes.push('<' + tag + '> mapped to heading 3');
      emitTextBlock(node, { header: Math.min(level, 3) }, ctx, 'h' + Math.min(level, 3));
      return;
    }
    if (tag === 'p') { emitTextBlock(node, {}, ctx, 'p'); return; }
    if (tag === 'ul' || tag === 'ol') { emitList(node, tag, ctx); return; }
    if (tag === 'blockquote') {
      var inner = sanitizeHtml(node.innerHTML).html;
      ctx.ops.push({ insert: { quote: { _v: 1, style: 'pull', quote: inner, attribution: '', role: '' } } });
      count(ctx.report.mapped, 'blockquote→quote');
      return;
    }
    if (tag === 'img') { emitImage(node, ctx); return; }
    if (tag === 'hr') {
      ctx.ops.push({ insert: { 'raw-html': { _v: 1, html: '<hr>' } } });
      count(ctx.report.mapped, 'hr');
      return;
    }
    // Everything else: wrap the whole subtree so nothing is lost.
    ctx.ops.push({ insert: { 'raw-html': { _v: 1, html: node.outerHTML } } });
    count(ctx.report.wrapped, tag);
  }

  function emitList(listEl, tag, ctx) {
    var listType = tag === 'ol' ? 'ordered' : 'bullet';
    Array.prototype.forEach.call(listEl.childNodes, function (child) {
      if (child.nodeType === 3) {
        // Bare text directly inside a list: keep it as its own item.
        if (child.nodeValue.trim()) {
          ctx.ops.push({ insert: child.nodeValue.replace(/\s+/g, ' ').trim() });
          ctx.ops.push({ insert: '\n', attributes: { list: listType } });
          ctx.report.notes.push('stray text inside a list kept as an item');
        }
        return;
      }
      if (child.nodeType !== 1) return;
      var t = child.tagName.toLowerCase();
      if (t === 'ul' || t === 'ol') { // sibling nested list (no <li> wrapper)
        ctx.report.notes.push('nested list flattened to sequential items');
        emitList(child, t, ctx);
        return;
      }
      if (t !== 'li') { // anything else inside a list: wrap, never drop
        ctx.ops.push({ insert: { 'raw-html': { _v: 1, html: child.outerHTML } } });
        count(ctx.report.wrapped, tag + '>' + t);
        return;
      }
      // <li>: emit its own text (nested lists removed from a clone), then the
      // nested lists as sequential items so nothing is lost or duplicated.
      var nestedLists = Array.prototype.filter.call(child.querySelectorAll('ul, ol'), function (n) {
        var p = n.parentNode;
        while (p && p !== child) {
          if (/^(ul|ol)$/i.test(p.tagName || '')) return false;
          p = p.parentNode;
        }
        return true;
      });
      if (nestedLists.length) {
        ctx.report.notes.push('nested list flattened to sequential items');
        var clone = child.cloneNode(true);
        Array.prototype.forEach.call(clone.querySelectorAll('ul, ol'), function (n) {
          if (n.parentNode) n.parentNode.removeChild(n);
        });
        emitTextBlock(clone, { list: listType }, ctx, tag + '>li');
        nestedLists.forEach(function (n) { emitList(n, n.tagName.toLowerCase(), ctx); });
      } else {
        emitTextBlock(child, { list: listType }, ctx, tag + '>li');
      }
    });
  }

  function emitImage(imgEl, ctx) {
    var src = imgEl.getAttribute('src') || '';
    if (!src || src === '#') { ctx.report.notes.push('image without usable src skipped'); return; }
    if (!/^(https?:|data:image\/)/i.test(src)) {
      ctx.report.notes.push('image with relative path kept — may not resolve outside the original site: ' + src.slice(0, 60));
    }
    var width = parseInt(imgEl.getAttribute('width'), 10) ||
                parseInt((imgEl.getAttribute('style') || '').replace(/^.*width\s*:\s*(\d+)px.*$/i, '$1'), 10) || 480;
    ctx.ops.push({ insert: { 'resizable-image': { src: src, width: width, alt: imgEl.getAttribute('alt') || '' } } });
    count(ctx.report.mapped, 'img');
  }

  // Replaced/embedded inline elements that carry visible content but no text —
  // hoist them to their own raw-html block instead of flattening to nothing.
  var EMBEDDED_INLINE = { svg: 1, canvas: 1, video: 1, audio: 1, math: 1, picture: 1 };
  // Block-level tags that, when they appear inside a text block, need a space
  // boundary so their text doesn't fuse with the previous block's text.
  var BLOCKISH = { p: 1, div: 1, h1: 1, h2: 1, h3: 1, h4: 1, h5: 1, h6: 1, li: 1, section: 1, article: 1, header: 1, footer: 1, blockquote: 1, figure: 1, table: 1, tr: 1 };

  // ── Inline walk (lenient: unknown inline formatting flattens to text) ─────

  function emitTextBlock(el, blockAttrs, ctx, mapKey) {
    var segments = [];
    var lines = 0;

    function pushLine() {
      var emitted = false;
      segments.forEach(function (seg) {
        var text = seg.text.replace(/\s+/g, ' ');
        if (!text.trim() && !emitted && seg === segments[segments.length - 1]) return;
        if (!text) return;
        var op = { insert: text };
        if (Object.keys(seg.attrs).length) op.attributes = seg.attrs;
        ctx.ops.push(op);
        emitted = true;
      });
      var nl = { insert: '\n' };
      if (blockAttrs && Object.keys(blockAttrs).length) nl.attributes = Object.assign({}, blockAttrs);
      ctx.ops.push(nl);
      segments = [];
      lines++;
    }

    function walk(node, attrs) {
      if (node.nodeType === 3) {
        segments.push({ text: node.nodeValue, attrs: attrs });
        return;
      }
      if (node.nodeType !== 1) return;
      var tag = node.tagName.toLowerCase();
      if (tag === 'br') { pushLine(); return; }
      if (tag === 'img') { hoisted.push({ kind: 'img', node: node }); return; }
      if (EMBEDDED_INLINE[tag]) { hoisted.push({ kind: 'raw', node: node }); return; }
      if (INLINE_FORMAT[tag]) {
        var merged = Object.assign({}, attrs, INLINE_FORMAT[tag]);
        Array.prototype.forEach.call(node.childNodes, function (c) { walk(c, merged); });
        return;
      }
      if (tag === 'a') {
        var href = (node.getAttribute('href') || '').trim();
        var linked = /^(https?:|mailto:|tel:|#)/i.test(href) ? Object.assign({}, attrs, { link: href }) : attrs;
        if (linked === attrs && href) ctx.report.notes.push('link with unsupported target flattened to text: ' + href.slice(0, 50));
        Array.prototype.forEach.call(node.childNodes, function (c) { walk(c, linked); });
        return;
      }
      // Any other nested element: flatten to its text. Block-level ones get a
      // space boundary so 'one'+'two' from adjacent <p>s doesn't fuse to 'onetwo'.
      if (BLOCKISH[tag]) segments.push({ text: ' ', attrs: {} });
      ctx.report.flattenedInline++;
      Array.prototype.forEach.call(node.childNodes, function (c) { walk(c, attrs); });
      if (BLOCKISH[tag]) segments.push({ text: ' ', attrs: {} });
    }

    var hoisted = [];

    Array.prototype.forEach.call(el.childNodes, function (c) { walk(c, {}); });

    // Trim edges, then emit the final line (always at least one per block).
    if (segments.length) {
      segments[0].text = segments[0].text.replace(/^\s+/, '');
      segments[segments.length - 1].text = segments[segments.length - 1].text.replace(/\s+$/, '');
    }
    var hasText = segments.some(function (s) { return s.text.trim(); });
    if (hasText || (lines === 0 && !hoisted.length)) pushLine();

    hoisted.forEach(function (h) {
      if (h.kind === 'img') { emitImage(h.node, ctx); return; }
      ctx.ops.push({ insert: { 'raw-html': { _v: 1, html: h.node.outerHTML } } });
      count(ctx.report.wrapped, h.node.tagName.toLowerCase());
    });
    count(ctx.report.mapped, mapKey);
  }

  window.HCEImport = { importHtml: importHtml, sanitizeHtml: sanitizeHtml };
})();
