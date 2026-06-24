(function () {
  'use strict';

  // ── Interaction detector / converter engine (course mode, A3) ───────────────
  // Pure functions that inspect a sanitized DOM element and, if it matches a
  // known interaction pattern, return the EXISTING blot's defaultData-shaped
  // object so a converted widget is indistinguishable from an author-built one
  // and flows through the same renderExportNoJS seam (SharePoint-safe, zero JS).
  //
  // Conservative by design (R9): return null unless the shape is an exact match.
  // v3.x foundation ships the two high-confidence detectors: ARIA tabs and
  // <details> accordion. Each returns:
  //   { kind:'widget', blotName, data, note }   — highest fidelity
  //   | null                                     — no match (caller keeps it static)

  function clean(html) {
    return window.HCESanitize ? window.HCESanitize.clean(html == null ? '' : html) : (html || '');
  }
  function txt(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function byId(root, id) {
    if (!id) return null;
    try { return root.querySelector('#' + (window.CSS && CSS.escape ? CSS.escape(id) : id)); }
    catch (e) { return root.querySelector('[id="' + id + '"]'); }
  }

  // ── ARIA tabs → TabsBlot ────────────────────────────────────────────────────
  function detectTabs(el) {
    if (!el.querySelector) return null;
    var tablist = el.querySelector('[role="tablist"]');
    if (!tablist) return null;
    var tabs = Array.prototype.slice.call(el.querySelectorAll('[role="tab"]'));
    var panels = Array.prototype.slice.call(el.querySelectorAll('[role="tabpanel"]'));
    if (tabs.length < 2 || panels.length === 0) return null;

    // Dedicated-container purity (R9): el must contain NOTHING beyond the tabs.
    // Strip the tablist(s) + tabpanels (+ sr-only hints) from a clone; if any
    // meaningful text remains, el is a broad wrapper that also holds other content
    // (intro/notes) and converting it would swallow that — so refuse. Sectionize
    // then descends past this wrapper to the tight tabs container.
    var probe = el.cloneNode(true);
    probe.querySelectorAll('[role="tablist"],[role="tabpanel"],.sr-only,.visually-hidden,.screen-reader')
      .forEach(function (n) { n.remove(); });
    if ((probe.textContent || '').replace(/\s+/g, ' ').trim()) return null;

    var items = [], activeIdx = 0;
    tabs.forEach(function (tab, i) {
      var panel = byId(el, tab.getAttribute('aria-controls')) || panels[i] || null;
      items.push({
        id: 'tab-' + (i + 1),
        label: txt(tab) || ('Tab ' + (i + 1)),
        content: panel ? clean(panel.innerHTML) : '',
      });
      if (tab.getAttribute('aria-selected') === 'true') activeIdx = i;
    });
    return { kind: 'widget', blotName: 'tabs', note: 'ARIA tabs',
      data: { _v: 1, tabs: items, activeTab: 'tab-' + (activeIdx + 1) } };
  }

  // ── <details> accordion → AccordionBlot ─────────────────────────────────────
  function detailsToItem(d, i) {
    var summary = d.querySelector('summary');
    var clone = d.cloneNode(true);
    var s = clone.querySelector('summary');
    if (s) s.remove();
    return {
      id: 'item-' + (i + 1),
      header: summary ? txt(summary) : ('Section ' + (i + 1)),
      content: clean(clone.innerHTML),
      open: d.hasAttribute('open'),
    };
  }

  function detectAccordion(el) {
    var detailsList;
    if (el.tagName === 'DETAILS') {
      detailsList = [el];
    } else {
      var kids = Array.prototype.slice.call(el.children);
      var det = kids.filter(function (k) { return k.tagName === 'DETAILS'; });
      // Pure accordion wrapper only: every direct child is a <details>.
      if (det.length === 0 || det.length !== kids.length) return null;
      detailsList = det;
    }
    var items = detailsList.map(detailsToItem);
    var names = detailsList.map(function (d) { return d.getAttribute('name'); }).filter(Boolean);
    var single = names.length === detailsList.length && new Set(names).size === 1;
    return { kind: 'widget', blotName: 'accordion', note: '<details> accordion',
      data: { _v: 1, allowMultiple: !single, items: items } };
  }

  var DETECTORS = [
    { name: 'aria-tabs', fn: detectTabs },
    { name: 'details-accordion', fn: detectAccordion },
  ];

  // Most-specific-first; first match wins. Never throws.
  function detect(el) {
    if (!el || el.nodeType !== 1) return null;
    for (var i = 0; i < DETECTORS.length; i++) {
      var r = null;
      try { r = DETECTORS[i].fn(el); } catch (e) { r = null; }
      if (r) return r;
    }
    return null;
  }

  // ── Scroll-reveal safety pass (R8) ──────────────────────────────────────────
  // JS-driven reveal (element starts opacity:0/visibility:hidden; a script adds a
  // class to reveal it) leaves content PERMANENTLY INVISIBLE once the JS is
  // stripped. Cross-reference CSS hiding-rules with classList.add() literals from
  // the about-to-be-removed scripts; force-reveal any class that matches. Default
  // safe = REVEAL; returns override CSS + the list of neutralized classes.
  function scrollRevealSafety(styleText, scriptText) {
    styleText = String(styleText || '');
    scriptText = String(scriptText || '');
    var hidden = {};
    var ruleRe = /([^{}]+)\{([^{}]*)\}/g, m;
    while ((m = ruleRe.exec(styleText))) {
      var body = m[2];
      if (/opacity\s*:\s*0(\D|$)/.test(body) || /visibility\s*:\s*hidden/.test(body)) {
        var cRe = /\.([A-Za-z0-9_-]+)/g, cm;
        while ((cm = cRe.exec(m[1]))) hidden[cm[1]] = true;
      }
    }
    var added = {};
    var aRe = /classList\.(?:add|toggle)\(\s*['"]([^'"]+)['"]/g, am;
    while ((am = aRe.exec(scriptText))) {
      am[1].split(/\s+/).forEach(function (c) { if (c) added[c] = true; });
    }
    var neutralize = Object.keys(hidden).filter(function (c) { return added[c]; });
    if (!neutralize.length) return { css: '', classes: [] };
    var css = neutralize.map(function (c) {
      return '.' + c + '{opacity:1 !important;visibility:visible !important;transform:none !important;}';
    }).join('\n');
    return { css: '/* scroll-reveal safety — forced visible (revealing JS removed) */\n' + css, classes: neutralize };
  }

  window.HCEDetectors = {
    detect: detect,
    detectTabs: detectTabs,
    detectAccordion: detectAccordion,
    scrollRevealSafety: scrollRevealSafety,
  };
})();
