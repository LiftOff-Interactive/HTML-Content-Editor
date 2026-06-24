(function () {
  'use strict';

  // ── HTML import: SANITIZE → WALK → WRAP ─────────────────────────────────────
  // Loads ANY .html file: recognized nodes map to native content/blots; every
  // unrecognized subtree is wrapped in a `raw-html` blot (never dropped). Head
  // <style> is captured into DocStyles; external <link> stylesheets are flagged
  // (not fetched). A fidelity report lists what was recognized vs raw-wrapped.
  //
  // The Delta is built BY HAND (not dangerouslyPasteHTML, which routes through
  // clipboard matchers and silently drops unknown tags).

  var INLINE_OK = { strong: 'bold', b: 'bold', em: 'italic', i: 'italic', u: 'underline' };

  function getDelta() { return Quill.import('delta'); }

  // Convert a block element's inline children to Quill text ops.
  // Returns { ops, clean }: clean=false if ANY non-trivial element is hit — the
  // caller then wraps the whole block as raw-html (lossless, no mangling).
  function inlineOps(node, baseAttrs) {
    var ops = [];
    var clean = true;
    baseAttrs = baseAttrs || {};

    function walk(n, attrs) {
      var kids = n.childNodes;
      for (var i = 0; i < kids.length; i++) {
        var c = kids[i];
        if (c.nodeType === 3) {                       // text node
          if (c.nodeValue) ops.push({ insert: c.nodeValue, attributes: Object.keys(attrs).length ? Object.assign({}, attrs) : undefined });
          continue;
        }
        if (c.nodeType !== 1) continue;               // comments etc. → ignore
        var tag = c.tagName.toLowerCase();
        if (INLINE_OK[tag]) {
          var na = Object.assign({}, attrs);
          na[INLINE_OK[tag]] = true;
          walk(c, na);
        } else if (tag === 'a' && c.getAttribute('href')) {
          var la = Object.assign({}, attrs, { link: c.getAttribute('href') });
          walk(c, la);
        } else {
          clean = false;                              // span/br/img/code/nested block → bail
        }
        if (!clean) return;
      }
    }

    walk(node, baseAttrs);
    // normalize undefined attributes away
    ops.forEach(function (o) { if (o.attributes === undefined) delete o.attributes; });
    return { ops: ops, clean: clean };
  }

  function pushInline(delta, ops) {
    ops.forEach(function (o) { delta.insert(o.insert, o.attributes); });
  }

  function rawHtml(delta, el, report) {
    delta.insert({ 'raw-html': { _v: 1, html: el.outerHTML } });
    report.counts.raw++;
    report.dropped.push(el.tagName.toLowerCase());     // "dropped" from native mapping → preserved as raw
  }

  // Map one top-level block element into the delta.
  function mapBlock(delta, el, report) {
    var tag = el.tagName.toLowerCase();

    if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'p') {
      var io = inlineOps(el);
      if (!io.clean) { rawHtml(delta, el, report); return; }
      pushInline(delta, io.ops);
      var attrs = (tag === 'p') ? {} : { header: Number(tag.charAt(1)) };
      delta.insert('\n', Object.keys(attrs).length ? attrs : undefined);
      report.counts.recognized++;
      report.kept.push(tag);
      return;
    }

    if (tag === 'ul' || tag === 'ol') {
      var listType = (tag === 'ol') ? 'ordered' : 'bullet';
      var items = el.children;
      // Only map if every direct child is a clean <li>; else preserve the whole list.
      var allClean = true, prepared = [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].tagName.toLowerCase() !== 'li') { allClean = false; break; }
        var lo = inlineOps(items[i]);
        if (!lo.clean) { allClean = false; break; }
        prepared.push(lo.ops);
      }
      if (!allClean || prepared.length === 0) { rawHtml(delta, el, report); return; }
      prepared.forEach(function (ops) {
        pushInline(delta, ops);
        delta.insert('\n', { list: listType });
      });
      report.counts.recognized++;
      report.kept.push(tag);
      return;
    }

    if (tag === 'img' && el.getAttribute('src')) {
      var w = parseInt(el.getAttribute('width'), 10);
      var src = el.getAttribute('src');
      if (window.HCEExport && window.HCEExport.safeUrl) src = window.HCEExport.safeUrl(src);
      delta.insert({ 'resizable-image': {
        src: src,
        alt: el.getAttribute('alt') || '',
        width: isNaN(w) ? 480 : w,
      } });
      report.counts.recognized++;
      report.kept.push('img');
      return;
    }

    // section, div, table, figure, blockquote, nav, form-leftovers, custom → raw-html
    rawHtml(delta, el, report);
  }

  function ensureTrailingNewline(delta) {
    var ops = delta.ops || [];
    var last = ops[ops.length - 1];
    if (!last || typeof last.insert !== 'string' || !/\n$/.test(last.insert)) {
      delta.insert('\n');
    }
  }

  // Returns a v3 widgets-mode payload { version, kind, content, theme, docStyles, _report }.
  function importArbitraryHtml(fileText) {
    var doc = new DOMParser().parseFromString(String(fileText || ''), 'text/html');

    // Capture all <style> (head + body) into DocStyles, then remove them.
    var headStyles = [];
    doc.querySelectorAll('style').forEach(function (s) {
      if (s.textContent && s.textContent.trim()) headStyles.push(s.textContent);
      s.remove();
    });
    // Flag external stylesheet links (recorded, NOT fetched), then remove.
    var linkRefs = [];
    doc.querySelectorAll('link[rel~="stylesheet"]').forEach(function (l) {
      var href = l.getAttribute('href');
      if (href) linkRefs.push(href);
      l.remove();
    });

    var bodyClass = (doc.body && doc.body.getAttribute('class')) || '';
    var bodyStyle = (doc.body && doc.body.getAttribute('style')) || '';
    var root = doc.body || doc.documentElement;

    // Sanitize the body fragment ONCE; the resulting tree is canonical+safe.
    var cleanHtml = window.HCESanitize.clean(root ? root.innerHTML : '');
    var holder = document.createElement('div');
    holder.innerHTML = cleanHtml;

    var delta = new (getDelta())();
    var report = { kept: [], dropped: [], counts: { recognized: 0, raw: 0, textBlocks: 0 } };

    // Walk the sanitized body's direct children.
    var children = holder.children;
    if (children.length === 0 && holder.textContent && holder.textContent.trim()) {
      // Bare text with no element wrapper → one paragraph.
      delta.insert(holder.textContent);
      delta.insert('\n');
      report.counts.textBlocks++;
    } else {
      for (var i = 0; i < children.length; i++) mapBlock(delta, children[i], report);
    }
    ensureTrailingNewline(delta);

    var docStyles = {
      _v: 1,
      headStyles: headStyles,
      linkRefs: linkRefs,
      bodyClass: bodyClass,
      bodyStyle: bodyStyle,
    };

    return {
      version: window.HCE_SAVE_VERSION || 3,
      kind: 'widgets',
      content: { ops: delta.ops },
      theme: window.ThemePanel ? window.ThemePanel.getCurrentTheme() : {},
      docStyles: docStyles,
      _report: report,
    };
  }

  window.HCEImport = {
    importArbitraryHtml: importArbitraryHtml,
    inlineOps: inlineOps,        // exposed for tests
  };
})();
