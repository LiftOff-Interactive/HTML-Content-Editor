(function () {
  'use strict';

  // ── Import sanitizer — the security boundary (R1) ───────────────────────────
  // Imported HTML is rendered inside the editor (same origin as Save/Export/theme),
  // so it MUST be neutralized before any innerHTML. Unlike the F2 source dialect
  // (which keeps only a tiny vocabulary), the import sanitizer keeps structural
  // tags + class/id/style/data-* so the imported LOOK survives — while stripping
  // all active content. Sanitize-for-safety and prepare-for-no-JS-export are the
  // same operation: the only thing lost is JS-driven interactivity (recovered as
  // widgets in F3 Phase 2).

  var CONFIG = {
    WHOLE_DOCUMENT: false,                       // we hand it a body fragment
    FORBID_TAGS: ['script', 'noscript', 'template', 'base', 'meta', 'object', 'embed'],
    FORBID_ATTR: ['srcdoc'],
    ALLOW_DATA_ATTR: true,                        // keep data-* (detection attrs in P2)
    ADD_ATTR: ['target'],
    // DOMPurify strips on*-handlers and javascript:/data:text/html URLs by default;
    // the hook below is belt-and-suspenders and documents the intent.
  };

  var _hooked = false;
  function ensureHook() {
    if (_hooked || !window.DOMPurify) return;
    window.DOMPurify.addHook('uponSanitizeAttribute', function (node, data) {
      var name = (data.attrName || '').toLowerCase();
      if (name.indexOf('on') === 0) { data.keepAttr = false; return; }   // on*= handlers
      if (name === 'href' || name === 'src' || name === 'xlink:href') {
        var v = (data.attrValue || '').replace(/\s+/g, '').toLowerCase();
        if (v.indexOf('javascript:') === 0 || v.indexOf('data:text/html') === 0 ||
            v.indexOf('vbscript:') === 0) {
          data.keepAttr = false;
        }
      }
    });
    _hooked = true;
  }

  // Sanitize a fragment of HTML → safe HTML string (no script/on*/javascript:).
  function clean(html) {
    if (!window.DOMPurify) throw new Error('DOMPurify not loaded — cannot sanitize import');
    ensureHook();
    return window.DOMPurify.sanitize(String(html == null ? '' : html), CONFIG);
  }

  window.HCESanitize = { clean: clean, CONFIG: CONFIG };
})();
