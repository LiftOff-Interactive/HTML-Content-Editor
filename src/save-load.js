(function () {
  'use strict';

  const SAVE_VERSION = 2;

  // ── v1 → v2 migration ────────────────────────────────────────────────────

  function wrapHtml(str) {
    if (!str) return '';
    if (/^\s*</.test(str)) return str;
    return '<p>' + str + '</p>';
  }

  function migrateV1toV2(payload) {
    var ops = (payload.content && payload.content.ops) || [];
    ops.forEach(function (op) {
      if (!op.insert || typeof op.insert !== 'object') return;

      if (op.insert.callout) {
        var d = op.insert.callout;
        if (!d.widgetAlign) d.widgetAlign = 'left';
        d.body = wrapHtml(d.body);
        d._v = 2;
      }
      if (op.insert.quote) {
        var d = op.insert.quote;
        if (!d.widgetAlign) d.widgetAlign = 'left';
        d.quote = wrapHtml(d.quote);
        d._v = 2;
      }
      if (op.insert.timeline) {
        var d = op.insert.timeline;
        if (!d.widgetAlign) d.widgetAlign = 'left';
        if (d.items) d.items.forEach(function (item) { item.content = wrapHtml(item.content); });
        d._v = 2;
      }
      if (op.insert.accordion) {
        var d = op.insert.accordion;
        if (!d.widgetAlign) d.widgetAlign = 'left';
        if (d.items) d.items.forEach(function (item) { item.content = wrapHtml(item.content); });
        d._v = 2;
      }
      if (op.insert.tabs) {
        var d = op.insert.tabs;
        if (!d.widgetAlign) d.widgetAlign = 'left';
        if (d.tabs) d.tabs.forEach(function (tab) { tab.content = wrapHtml(tab.content); });
        d._v = 2;
      }
      if (op.insert['flip-cards']) {
        var d = op.insert['flip-cards'];
        if (!d.widgetAlign) d.widgetAlign = 'left';
        if (d.cards) d.cards.forEach(function (card) {
          if (!card.frontBody) card.frontBody = '';
          card.back = wrapHtml(card.back);
        });
        d._v = 2;
      }
      if (op.insert['click-reveal']) {
        var d = op.insert['click-reveal'];
        if (!d.widgetAlign) d.widgetAlign = 'left';
        if (d.items) d.items.forEach(function (item) { item.content = wrapHtml(item.content); });
        d._v = 2;
      }
      if (op.insert.carousel) {
        var d = op.insert.carousel;
        if (!d.widgetAlign) d.widgetAlign = 'left';
        if (d.slides) d.slides.forEach(function (slide) {
          slide.textContent = wrapHtml(slide.textContent);
        });
        d._v = 2;
      }
      if (op.insert.hotspot) {
        var d = op.insert.hotspot;
        if (!d.widgetAlign) d.widgetAlign = 'left';
        if (d.pins) d.pins.forEach(function (pin) { pin.content = wrapHtml(pin.content); });
        d._v = 2;
      }
      if (op.insert['knowledge-check']) {
        var d = op.insert['knowledge-check'];
        if (!d.widgetAlign) d.widgetAlign = 'left';
        d.question = wrapHtml(d.question);
        if (d.hint) d.hint = wrapHtml(d.hint);
        if (d.options) d.options.forEach(function (opt) {
          opt.feedback = wrapHtml(opt.feedback);
        });
        d._v = 2;
      }
    });
    payload.version = 2;
    return payload;
  }

  // ── Toast ─────────────────────────────────────────────────────────────────

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
    }, 4000);
  }

  // ── Status span ───────────────────────────────────────────────────────────

  var _statusTimer = null;

  function setStatus(text, highlight) {
    const el = document.getElementById('save-status');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('save-status--saved', !!highlight);
  }

  function showSavedConfirmation() {
    if (_statusTimer) clearTimeout(_statusTimer);
    setStatus('Saved ✓', true);
    _statusTimer = setTimeout(function () {
      setStatus('');
      _statusTimer = null;
    }, 3000);
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  function saveProject() {
    const quill = window.contentEditor && window.contentEditor.quill;
    if (!quill) return;

    const rawTitle = (window.contentEditor.getDocumentTitle && window.contentEditor.getDocumentTitle()) || '';
    const slug = rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'project';

    const payload = {
      version: SAVE_VERSION,
      content: quill.getContents(),
      theme:   window.ThemePanel ? window.ThemePanel.getCurrentTheme() : {},
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = slug + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSavedConfirmation();
  }

  // ── Load ──────────────────────────────────────────────────────────────────

  function loadProject() {
    const input  = document.createElement('input');
    input.type   = 'file';
    input.accept = '.json,application/json';

    input.addEventListener('change', function () {
      const file = input.files && input.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const payload = JSON.parse(e.target.result);

          if (!payload || (payload.version !== 1 && payload.version !== 2)) {
            showToast('Incompatible file — saved with a different version of Content Editor.');
            return;
          }
          if (payload.version === 1) {
            payload = migrateV1toV2(payload);
          }

          const quill = window.contentEditor && window.contentEditor.quill;
          if (quill && payload.content) {
            quill.setContents(payload.content, Quill.sources.SILENT);
          }

          if (payload.theme && window.ThemePanel) {
            window.ThemePanel.deserialize(JSON.stringify(payload.theme));
          }

          setStatus('');
          showToast('Project loaded.');
        } catch (err) {
          showToast('Could not load file — it may be corrupt or from an incompatible version.');
        }
      };
      reader.readAsText(file);
    });

    input.click();
  }

  // ── Track unsaved changes ─────────────────────────────────────────────────

  function trackChanges() {
    const quill = window.contentEditor && window.contentEditor.quill;
    if (!quill) return;
    quill.on('text-change', function (delta, oldDelta, source) {
      // Only mark unsaved from user edits and only when not showing "Saved ✓"
      if (source === Quill.sources.USER && !_statusTimer) {
        setStatus('unsaved');
      }
    });
  }

  // ── Build header buttons ──────────────────────────────────────────────────

  function buildButtons() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    const saveBtn       = document.createElement('button');
    saveBtn.className   = 'header-btn header-btn--ghost';
    saveBtn.id          = 'save-btn';
    saveBtn.textContent = 'Save';
    saveBtn.title       = 'Save project as JSON file';
    saveBtn.addEventListener('click', saveProject);

    const loadBtn       = document.createElement('button');
    loadBtn.className   = 'header-btn header-btn--ghost';
    loadBtn.id          = 'load-btn';
    loadBtn.textContent = 'Load';
    loadBtn.title       = 'Load project from JSON file';
    loadBtn.addEventListener('click', loadProject);

    // Insert [Save] [Load] before the status span (which sits before Export HTML)
    const anchor = document.getElementById('save-status') || document.getElementById('export-btn');
    if (anchor) {
      headerActions.insertBefore(loadBtn, anchor);
      headerActions.insertBefore(saveBtn, loadBtn);
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    buildButtons();
    // Wait a tick so contentEditor and Quill are fully initialized
    setTimeout(trackChanges, 200);
  });

  window.HCESaveLoad = { saveProject, loadProject };
})();
