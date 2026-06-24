(function () {
  'use strict';

  // ── Document-styles store ───────────────────────────────────────────────────
  // Holds the <style> text captured from an imported HTML file plus flagged
  // external <link> deps. In the EDITOR the captured CSS is injected scoped to
  // `.ql-editor` so it can't restyle the app chrome (R2). In the EXPORT it is
  // emitted UNSCOPED (a standalone file has no chrome to clobber). External CSS
  // links are recorded-and-flagged, never fetched (no-external-deps), so the
  // self-contained / no-JS export carries zero external references.

  var EDITOR_STYLE_ID = 'hce-doc-styles';
  var SCOPE = '.ql-editor';

  function empty() {
    return { _v: 1, headStyles: [], linkRefs: [], bodyClass: '', bodyStyle: '' };
  }
  var _store = empty();

  // ── Neutralize external-fetch channels in captured CSS (security) ───────────
  // Captured <style> text is NOT run through DOMPurify, so @import and remote
  // url() would otherwise survive into the editor AND the "self-contained" export
  // (a privacy/external-dependency channel). Strip @import/@charset entirely and
  // drop any non-data: url() (keeps inline data: URIs). Relative url() is left as-is
  // (resolves within the export, no remote fetch).
  function neutralizeExternal(css) {
    css = String(css || '');
    css = css.replace(/@import\b[^;]*;/gi, '');
    css = css.replace(/@charset\b[^;]*;/gi, '');
    css = css.replace(/url\(\s*(['"]?)([^'")]*)\1\s*\)/gi, function (m, q, u) {
      var v = (u || '').trim();
      if (v === '' || /^data:/i.test(v) || /^#/.test(v)) return m;        // inline / fragment OK
      if (/^(https?:)?\/\//i.test(v) || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(v)) return 'none'; // remote/protocol → drop
      return m;                                                            // relative → keep
    });
    return css;
  }

  // ── Tolerant CSS scoper (regex/brace-depth, not a full parser) ──────────────
  function splitTopLevel(css) {
    var rules = [], i = 0, n = css.length;
    while (i < n) {
      while (i < n && /\s/.test(css[i])) i++;
      if (i >= n) break;

      if (css[i] === '@') {
        var j = i + 1, kw = '';
        while (j < n && /[a-zA-Z-]/.test(css[j])) { kw += css[j]; j++; }
        var k = j;
        while (k < n && css[k] !== '{' && css[k] !== ';') k++;
        if (k >= n || css[k] === ';') {                       // @import / @charset
          rules.push({ atKeyword: kw.toLowerCase(), raw: css.slice(i, (k < n ? k + 1 : n)) });
          i = (k < n ? k + 1 : n);
          continue;
        }
        var prelude = css.slice(i + 1, k);
        var depth = 0, m = k;
        for (; m < n; m++) { if (css[m] === '{') depth++; else if (css[m] === '}') { depth--; if (depth === 0) { m++; break; } } }
        rules.push({ atKeyword: kw.toLowerCase(), prelude: prelude.trim(), body: css.slice(k + 1, m - 1), raw: css.slice(i, m) });
        i = m;
        continue;
      }

      var b = css.indexOf('{', i);
      if (b === -1) break;
      var sel = css.slice(i, b);
      var d2 = 0, p = b;
      for (; p < n; p++) { if (css[p] === '{') d2++; else if (css[p] === '}') { d2--; if (d2 === 0) { p++; break; } } }
      rules.push({ sel: sel.trim(), body: css.slice(b + 1, p - 1) });
      i = p;
    }
    return rules;
  }

  function scopeSelector(sel, scope) {
    sel = sel.trim();
    if (!sel) return scope;
    // Root-ish selectors collapse onto the scope element itself.
    if (/^(html|body|:root|\*)\b/.test(sel)) {
      return sel.replace(/^(html|body|:root|\*)/, scope);
    }
    return scope + ' ' + sel;
  }

  function scopeCss(css, scope) {
    css = String(css || '').replace(/\/\*[\s\S]*?\*\//g, '');
    var rules = splitTopLevel(css);
    return rules.map(function (r) {
      if (r.atKeyword) {
        if (r.atKeyword === 'media' || r.atKeyword === 'supports') {
          return '@' + r.atKeyword + ' ' + r.prelude + ' {' + scopeCss(r.body, scope) + '}';
        }
        return r.raw;                            // keyframes/font-face/page/import/charset → verbatim
      }
      var sels = r.sel.split(',').map(function (s) { return scopeSelector(s, scope); });
      return sels.join(', ') + ' {' + r.body + '}';
    }).join('\n');
  }

  function injectIntoEditor() {
    var existing = document.getElementById(EDITOR_STYLE_ID);
    if (existing) existing.remove();
    if (!_store.headStyles.length) return;
    var scoped;
    try {
      scoped = _store.headStyles.map(function (c) { return scopeCss(neutralizeExternal(c), SCOPE); }).join('\n');
    } catch (e) {
      // Tolerant fallback: if scoping a block fails, skip editor injection rather
      // than risk clobbering the app chrome. Export still emits the raw CSS.
      console.warn('[DocStyles] scope failed; skipping editor injection', e);
      return;
    }
    var el = document.createElement('style');
    el.id = EDITOR_STYLE_ID;
    el.textContent = scoped;
    document.head.appendChild(el);
  }

  function set(store) {
    _store = Object.assign(empty(), store || {});
    if (!Array.isArray(_store.headStyles)) _store.headStyles = [];
    if (!Array.isArray(_store.linkRefs)) _store.linkRefs = [];
    injectIntoEditor();
  }

  function get() {
    var has = _store.headStyles.length || _store.linkRefs.length || _store.bodyClass || _store.bodyStyle;
    return has ? JSON.parse(JSON.stringify(_store)) : null;
  }

  // Unscoped, external-fetch-neutralized CSS for the self-contained export.
  function getCss() { return neutralizeExternal(_store.headStyles.join('\n')); }

  function getLinkRefs() { return _store.linkRefs.slice(); }

  function clear() { set(empty()); }

  window.DocStyles = {
    set: set, get: get, getCss: getCss, getLinkRefs: getLinkRefs, clear: clear,
    scopeCss: scopeCss, neutralizeExternal: neutralizeExternal,
  };
})();
