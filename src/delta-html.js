/**
 * HCEDeltaHtml — reversible Quill-delta ⇄ HTML source conversion for the
 * whole-document code view (F2).
 *
 *   deltaToCode(delta)  → string   (throws HCECodeError with .reasons[])
 *   codeToDelta(code)   → delta    (throws HCECodeError with .reasons[])
 *
 * Design contract:
 * - Widgets serialize as readable JSON islands:
 *     <script type="application/hce-widget" data-widget="tabs">{ ... }</script>
 *   Script elements are raw-text, so the JSON (including HTML strings inside
 *   it) stays human-readable. "</script>" inside the JSON is escaped as
 *   "<\/script>" — JSON.parse round-trips that identically.
 * - The parser is a strict allowlist walker: only known elements/attributes
 *   ever reach the delta, unknown ones REFUSE the conversion with a named
 *   reason. That makes the parser itself the sanitizer — no on*= attribute is
 *   ever read, script tags are only accepted as hce-widget JSON data, and
 *   URLs are scheme-checked.
 * - Never silently drop content in either direction (v3 kickoff F2 rule):
 *   anything unrepresentable throws instead.
 * - export.js is deliberately NOT reused or modified: its delta walk emits
 *   presentational widget markup and feeds the protected Stage 8 export
 *   contract (see docs/baselines/). This module owns the semantic form.
 */
(function () {
  'use strict';

  var WIDGET_MIME = 'application/hce-widget';

  // ── Errors ─────────────────────────────────────────────────────────────────

  function codeError(reasons) {
    var err = new Error('HCE code view conversion failed: ' + reasons.join('; '));
    err.name = 'HCECodeError';
    err.reasons = reasons;
    return err;
  }

  // ── Escaping ───────────────────────────────────────────────────────────────

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Serializer: delta → code ───────────────────────────────────────────────

  var INLINE_TAGS = { bold: 'strong', italic: 'em', underline: 'u', strike: 's' };
  var ALIGN_VALUES = { center: true, right: true, justify: true };

  // One shared predicate keeps serializer and parser symmetric: everything the
  // serializer emits, the parser accepts back (reversibility), and vice versa.
  // 'about:blank' is allowed because Quill's own Link.sanitize rewrites pasted
  // unsafe links to it — refusing it would strand documents on unchanged apply.
  function safeLinkHref(url) {
    var u = String(url).trim();
    if (u === 'about:blank') return true;
    if (/^(https?:|mailto:|tel:|#|\.)/i.test(u)) return true;
    if (/^\/(?!\/)/.test(u)) return true; // single leading slash — '//' (protocol-relative) is refused
    return false;
  }

  function inlineHtml(text, attrs, reasons) {
    var html = esc(text);
    if (!attrs) return html;
    Object.keys(attrs).forEach(function (key) {
      if (INLINE_TAGS[key]) {
        if (attrs[key]) html = '<' + INLINE_TAGS[key] + '>' + html + '</' + INLINE_TAGS[key] + '>';
      } else if (key === 'link') {
        if (safeLinkHref(attrs.link)) {
          html = '<a href="' + esc(attrs.link) + '">' + html + '</a>';
        } else {
          reasons.push('link "' + String(attrs.link).slice(0, 40) + '" cannot be represented — fix or remove it in the visual view');
        }
      } else {
        reasons.push('unsupported text formatting "' + key + '" — edit it in the visual view');
      }
    });
    return html;
  }

  function lineAttrsInfo(attrs, reasons) {
    var info = { tag: 'p', list: null, align: null };
    if (!attrs) return info;
    Object.keys(attrs).forEach(function (key) {
      if (key === 'header') {
        if (attrs.header >= 1 && attrs.header <= 3) info.tag = 'h' + attrs.header;
        else reasons.push('unsupported heading level ' + attrs.header);
      } else if (key === 'list') {
        if (attrs.list === 'ordered') info.list = 'ol';
        else if (attrs.list === 'bullet') info.list = 'ul';
        else reasons.push('unsupported list type "' + attrs.list + '" — edit it in the visual view');
      } else if (key === 'align') {
        if (ALIGN_VALUES[attrs.align]) info.align = attrs.align;
        else reasons.push('unsupported alignment "' + attrs.align + '"');
      } else {
        reasons.push('unsupported block formatting "' + key + '" — edit it in the visual view');
      }
    });
    return info;
  }

  function widgetIsland(blotName, data) {
    // Escape any '<' that begins '<script', '</script', or '<!--' as <.
    // JSON.parse restores the exact original string, and the HTML script-data
    // tokenizer can no longer see sequences that would end the island early or
    // enter the double-escaped state ('<!--' + '<script' swallows '</script>').
    var json = JSON.stringify(data, null, 2).replace(/<(?=\/?script|!--)/gi, '\\u003c');
    return '<script type="' + WIDGET_MIME + '" data-widget="' + esc(blotName) + '">\n' +
      json + '\n</' + 'script>';
  }

  function deltaToCode(delta) {
    var ops = (delta && delta.ops) || [];
    var reasons = [];
    var blocks = [];
    var lineBuffer = '';
    var currentList = null; // 'ol' | 'ul'

    function closeList() {
      if (currentList) { blocks.push('</' + currentList + '>'); currentList = null; }
    }

    function flushLine(attrs) {
      var info = lineAttrsInfo(attrs, reasons);
      var style = info.align ? ' style="text-align:' + info.align + '"' : '';
      var inner = lineBuffer || '<br>';
      lineBuffer = '';

      if (info.list) {
        if (currentList !== info.list) { closeList(); currentList = info.list; blocks.push('<' + info.list + '>'); }
        blocks.push('  <li' + style + '>' + inner + '</li>');
        return;
      }
      closeList();
      blocks.push('<' + info.tag + style + '>' + inner + '</' + info.tag + '>');
    }

    ops.forEach(function (op) {
      if (op.insert && typeof op.insert === 'object') {
        closeList();
        var blotName = Object.keys(op.insert)[0];
        var data = op.insert[blotName];
        if (blotName === 'resizable-image') {
          blocks.push('<img src="' + esc(data.src || '') + '" alt="' + esc(data.alt || '') +
                      '" width="' + (parseInt(data.width, 10) || 480) + '">');
        } else if (window.WidgetRegistry && window.WidgetRegistry.get(blotName)) {
          blocks.push(widgetIsland(blotName, data));
        } else {
          reasons.push('unknown widget type "' + blotName + '"');
        }
        return;
      }
      if (typeof op.insert !== 'string') return;

      var parts = op.insert.split('\n');
      for (var i = 0; i < parts.length; i++) {
        if (parts[i]) lineBuffer += inlineHtml(parts[i], op.attributes, reasons);
        if (i < parts.length - 1) flushLine(op.attributes);
      }
    });
    closeList();
    if (lineBuffer) flushLine(null); // defensive: dangling text without terminating \n

    if (reasons.length) throw codeError(dedup(reasons));
    return blocks.join('\n') + '\n';
  }

  // ── Parser: code → delta ───────────────────────────────────────────────────

  var INLINE_PARSE = {
    strong: { bold: true }, b: { bold: true },
    em: { italic: true }, i: { italic: true },
    u: { underline: true },
    s: { strike: true }, strike: { strike: true },
  };
  var BLOCK_TAGS = { p: true, h1: true, h2: true, h3: true };

  function dedup(list) {
    return list.filter(function (v, i) { return list.indexOf(v) === i; });
  }

  function safeImgSrc(url) {
    return /^(https?:|data:image\/|\/|\.)/i.test(String(url).trim());
  }

  // Parse a style attribute allowing only text-align. Returns align or null.
  function parseStyle(el, reasons) {
    var style = el.getAttribute('style');
    if (!style) return null;
    var align = null;
    var clean = style.split(';').every(function (decl) {
      if (!decl.trim()) return true;
      var m = decl.match(/^\s*text-align\s*:\s*(center|right|justify|left)\s*$/i);
      if (!m) return false;
      if (m[1].toLowerCase() !== 'left') align = m[1].toLowerCase();
      return true;
    });
    if (!clean) reasons.push('unsupported style on <' + el.tagName.toLowerCase() + '> — only text-align is allowed');
    return align;
  }

  function checkAttrs(el, allowed, reasons) {
    Array.prototype.forEach.call(el.attributes, function (attr) {
      if (allowed.indexOf(attr.name.toLowerCase()) === -1) {
        reasons.push('unsupported attribute "' + attr.name + '" on <' + el.tagName.toLowerCase() + '>');
      }
    });
  }

  function codeToDelta(code) {
    // Parse inside an inert <template>: unlike DOMParser('text/html'), template
    // content has no head/body insertion modes, so a leading hce-widget script
    // is NOT hoisted out of position (and scripts stay inert — never executed).
    var tpl = document.createElement('template');
    tpl.innerHTML = String(code);
    var root = tpl.content;
    var reasons = [];
    var ops = [];

    // Whitespace model: spaces, tabs and NBSP are CONTENT and round-trip
    // verbatim; newline runs (plus their surrounding indentation) are source
    // FORMATTING. Each newline run was collapsed to a single NUL placeholder
    // when the text node was read (the HTML parser never yields raw NULs, so
    // the marker is unambiguous). Placeholders at the line edges are stripped;
    // interior ones become single spaces (a hand-wrapped paragraph reads as
    // normal spaces).
    function pushLine(segments, blockAttrs) {
      while (segments.length && !segments[0].text.replace(/^\u0000+/, '')) segments.shift();
      if (segments.length) segments[0].text = segments[0].text.replace(/^\u0000+/, '');
      while (segments.length && !segments[segments.length - 1].text.replace(/\u0000+$/, '')) segments.pop();
      if (segments.length) {
        var last = segments[segments.length - 1];
        last.text = last.text.replace(/\u0000+$/, '');
      }
      segments.forEach(function (seg) {
        var text = seg.text.replace(/\u0000+/g, ' ');
        if (!text) return;
        var op = { insert: text };
        if (Object.keys(seg.attrs).length) op.attributes = seg.attrs;
        ops.push(op);
      });
      var nl = { insert: '\n' };
      if (blockAttrs && Object.keys(blockAttrs).length) nl.attributes = blockAttrs;
      ops.push(nl);
    }

    // Walk inline content of one block element. br flushes an intermediate line.
    function parseBlockContents(el, blockAttrs) {
      var segments = [];
      var emitted = 0;

      function walk(node, attrs) {
        if (node.nodeType === 3) { // text — newline runs become NUL placeholders (see pushLine)
          var text = node.nodeValue.replace(/[ \t\f]*(?:\r\n?|\n)[ \t\f]*/g, '\u0000');
          if (text) segments.push({ text: text, attrs: attrs });
          return;
        }
        if (node.nodeType === 8) {
          reasons.push('HTML comments are not supported — remove them before applying');
          return;
        }
        if (node.nodeType !== 1) return;
        var tag = node.tagName.toLowerCase();
        if (tag === 'br') {
          pushLine(segments, blockAttrs);
          segments = [];
          emitted++;
          return;
        }
        if (INLINE_PARSE[tag]) {
          checkAttrs(node, [], reasons);
          var merged = Object.assign({}, attrs, INLINE_PARSE[tag]);
          Array.prototype.forEach.call(node.childNodes, function (child) { walk(child, merged); });
          return;
        }
        if (tag === 'a') {
          checkAttrs(node, ['href'], reasons);
          var href = node.getAttribute('href') || '';
          if (!safeLinkHref(href)) {
            reasons.push('link "' + href.slice(0, 40) + '" uses a disallowed scheme (http/https/mailto/tel only)');
            return;
          }
          var withLink = Object.assign({}, attrs, { link: href });
          Array.prototype.forEach.call(node.childNodes, function (child) { walk(child, withLink); });
          return;
        }
        reasons.push('unsupported element <' + tag + '> inside a text block');
      }

      Array.prototype.forEach.call(el.childNodes, function (child) { walk(child, {}); });
      var hasPending = segments.some(function (s) { return s.text.replace(/\u0000+/g, '') !== ''; });
      if (hasPending || emitted === 0) pushLine(segments, blockAttrs);
    }

    function parseList(listEl) {
      var listType = listEl.tagName.toLowerCase() === 'ol' ? 'ordered' : 'bullet';
      checkAttrs(listEl, [], reasons);
      Array.prototype.forEach.call(listEl.childNodes, function (child) {
        if (child.nodeType === 3) {
          if (child.nodeValue.trim()) reasons.push('stray text inside a list — put it in an <li>');
          return;
        }
        if (child.nodeType !== 1) return;
        if (child.tagName.toLowerCase() !== 'li') {
          reasons.push('unsupported element <' + child.tagName.toLowerCase() + '> inside a list');
          return;
        }
        if (child.querySelector('ul, ol')) {
          reasons.push('nested lists are not supported yet — flatten them or edit in the visual view');
          return;
        }
        checkAttrs(child, ['style'], reasons);
        var attrs = { list: listType };
        var align = parseStyle(child, reasons);
        if (align) attrs.align = align;
        parseBlockContents(child, attrs);
      });
    }

    function parseWidgetIsland(el) {
      checkAttrs(el, ['type', 'data-widget'], reasons);
      var name = el.getAttribute('data-widget') || '';
      if (!(window.WidgetRegistry && window.WidgetRegistry.get(name))) {
        reasons.push('unknown widget type "' + name + '" in an hce-widget block');
        return;
      }
      var data;
      try {
        data = JSON.parse(el.textContent);
      } catch (err) {
        reasons.push('widget "' + name + '" has invalid JSON: ' + err.message);
        return;
      }
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        reasons.push('widget "' + name + '" JSON must be an object');
        return;
      }
      var embed = {};
      embed[name] = data;
      ops.push({ insert: embed });
    }

    function parseImg(el) {
      checkAttrs(el, ['src', 'alt', 'width'], reasons);
      var src = el.getAttribute('src') || '';
      if (!safeImgSrc(src)) {
        reasons.push('image src "' + src.slice(0, 40) + '" uses a disallowed scheme (http/https/data:image only)');
        return;
      }
      ops.push({ insert: { 'resizable-image': {
        src: src,
        width: parseInt(el.getAttribute('width'), 10) || 480,
        alt: el.getAttribute('alt') || '',
      } } });
    }

    // Top level: block elements, widget islands, images; loose inline content
    // is folded into implicit paragraphs rather than dropped.
    var inlineRun = [];
    function flushInlineRun() {
      if (!inlineRun.length) return;
      var holder = document.createElement('p');
      // Clone: appending the live nodes would mutate root.childNodes while the
      // top-level loop iterates it.
      inlineRun.forEach(function (n) { holder.appendChild(n.cloneNode(true)); });
      inlineRun = [];
      // Element-only runs (e.g. <a><img></a>) must still be walked so their
      // unsupported content refuses LOUDLY instead of vanishing.
      if (holder.textContent.trim() || holder.firstElementChild) parseBlockContents(holder, {});
    }

    Array.prototype.forEach.call(root.childNodes, function (node) {
      if (node.nodeType === 3) {
        // Whitespace between loose inline elements is content-significant
        // ("<strong>a</strong> <em>b</em>"), so keep it once a run has started.
        if (node.nodeValue.trim() || inlineRun.length) inlineRun.push(node);
        return;
      }
      if (node.nodeType === 8) {
        reasons.push('HTML comments are not supported — remove them before applying');
        return;
      }
      if (node.nodeType !== 1) return;
      var tag = node.tagName.toLowerCase();

      if (INLINE_PARSE[tag] || tag === 'a') { inlineRun.push(node); return; }
      flushInlineRun();

      if (BLOCK_TAGS[tag]) {
        checkAttrs(node, ['style'], reasons);
        var attrs = {};
        if (tag !== 'p') attrs.header = parseInt(tag.charAt(1), 10);
        var align = parseStyle(node, reasons);
        if (align) attrs.align = align;
        parseBlockContents(node, attrs);
      } else if (tag === 'ul' || tag === 'ol') {
        parseList(node);
      } else if (tag === 'img') {
        parseImg(node);
      } else if (tag === 'script') {
        if (node.getAttribute('type') === WIDGET_MIME) parseWidgetIsland(node);
        else reasons.push('script elements are not allowed (only hce-widget data blocks)');
      } else {
        reasons.push('unsupported element <' + tag + '>');
      }
    });
    flushInlineRun();

    if (reasons.length) throw codeError(dedup(reasons));
    if (!ops.length) ops.push({ insert: '\n' });
    return { ops: ops };
  }

  window.HCEDeltaHtml = { deltaToCode: deltaToCode, codeToDelta: codeToDelta };
})();
