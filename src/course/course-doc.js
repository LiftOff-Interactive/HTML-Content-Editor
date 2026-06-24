(function () {
  'use strict';

  // ── CourseDoc builder (course mode) ─────────────────────────────────────────
  // Parses an imported HTML file into a section tree (NOT a Quill delta): the body
  // (or <main>) is split into its direct element children; each becomes a section.
  // A section is either a 'matched-widget' (a detector recognized an interaction
  // pattern → real no-JS widget) or 'static' (sanitized HTML, look preserved via
  // captured styles). Convertible interactivity becomes SharePoint-safe widgets;
  // everything else is preserved verbatim. Nothing is dropped.
  //
  //   CourseDoc = { version, kind:'course', title, head:{styleText,fontLinks,metaLang},
  //                 sections:[SectionNode], theme, import:{report, scrollReveal} }
  //   SectionNode = { id, kind:'matched-widget'|'static', label, html?, widget? }

  function isWrapper(el) {
    return el && el.nodeType === 1 && /^(div|section|article|main)$/i.test(el.tagName);
  }
  function firstHeading(el) {
    var h = el.querySelector && el.querySelector('h1,h2,h3');
    return h ? (h.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) : '';
  }
  function sectionLabel(el) {
    return firstHeading(el) || (el.tagName ? el.tagName.toLowerCase() : 'section');
  }
  function hasDirectText(el) {
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n.nodeType === 3 && n.nodeValue && n.nodeValue.trim()) return true;
    }
    return false;
  }
  function containsConvertible(el) {
    return !!(el.querySelector && (el.querySelector('[role="tablist"]') || el.querySelector('details')));
  }

  var MAX_SECTION_DEPTH = 6;

  // Walk a parent's element children into sections. A child that a detector
  // recognizes becomes a matched-widget; a generic wrapper that *contains* a
  // convertible (and has no direct text of its own) is descended INTO so its
  // siblings are preserved as their own sections; everything else is kept as one
  // static section with its full outerHTML. Nothing is ever dropped.
  function sectionize(parent, sections, report, depth) {
    Array.prototype.slice.call(parent.children).forEach(function (child) {
      var det = window.HCEDetectors.detect(child);
      if (det) {
        var id = 'sec-' + (sections.length + 1);
        sections.push({ id: id, kind: 'matched-widget', label: det.note, widget: { blotName: det.blotName, data: det.data } });
        report.counts.widget++;
        report.items.push({ section: id, outcome: 'converted', as: det.blotName, note: det.note });
        return;
      }
      if (depth < MAX_SECTION_DEPTH && isWrapper(child) && child.children.length &&
          !hasDirectText(child) && containsConvertible(child)) {
        sectionize(child, sections, report, depth + 1);
        return;
      }
      var sid = 'sec-' + (sections.length + 1);
      sections.push({ id: sid, kind: 'static', label: sectionLabel(child), html: child.outerHTML });
      report.counts.static++;
      report.items.push({ section: sid, outcome: 'static', label: sectionLabel(child) });
    });
  }

  function buildCourseDoc(fileText) {
    var doc = new DOMParser().parseFromString(String(fileText || ''), 'text/html');

    // Capture script text BEFORE removal (for the scroll-reveal safety pass).
    var scriptText = '';
    doc.querySelectorAll('script').forEach(function (s) { scriptText += '\n' + (s.textContent || ''); });

    // Capture styles + flag external stylesheet links (never fetched).
    var styleText = '';
    doc.querySelectorAll('style').forEach(function (s) {
      if (s.textContent && s.textContent.trim()) styleText += '\n' + s.textContent;
      s.remove();
    });
    var fontLinks = [];
    doc.querySelectorAll('link[rel~="stylesheet"]').forEach(function (l) {
      var href = l.getAttribute('href'); if (href) fontLinks.push(href); l.remove();
    });

    var titleEl = doc.querySelector('title');
    var title = (titleEl && titleEl.textContent.trim()) || firstHeading(doc.body || doc.documentElement) || 'Imported course';
    var metaLang = (doc.documentElement && doc.documentElement.getAttribute('lang')) || '';

    // Sanitize the body once; section the sanitized tree.
    var bodyEl = doc.body || doc.documentElement;
    var holder = document.createElement('div');
    holder.innerHTML = window.HCESanitize ? window.HCESanitize.clean(bodyEl ? bodyEl.innerHTML : '') : (bodyEl ? bodyEl.innerHTML : '');

    var sections = [];
    var report = { items: [], counts: { widget: 0, static: 0 } };

    if (holder.children.length === 0 && holder.textContent && holder.textContent.trim()) {
      sections.push({ id: 'sec-1', kind: 'static', label: 'text',
        html: '<p>' + (window.HCEExport ? window.HCEExport.esc(holder.textContent.trim()) : holder.textContent.trim()) + '</p>' });
      report.counts.static++;
    } else {
      sectionize(holder, sections, report, 0);
    }

    // Scroll-reveal safety: force-reveal content the stripped JS would have shown.
    var sr = window.HCEDetectors.scrollRevealSafety(styleText, scriptText);
    if (sr.classes.length) report.scrollReveal = sr.classes;

    return {
      version: window.HCE_SAVE_VERSION || 3,
      kind: 'course',
      title: title,
      head: { styleText: styleText, fontLinks: fontLinks, metaLang: metaLang, scrollRevealCss: sr.css },
      sections: sections,
      theme: window.ThemePanel ? window.ThemePanel.getCurrentTheme() : {},
      import: { report: report },
    };
  }

  window.HCECourse = window.HCECourse || {};
  window.HCECourse.buildCourseDoc = buildCourseDoc;
})();
