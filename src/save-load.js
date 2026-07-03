(function () {
  'use strict';

  var SAVE_VERSION = 3;

  // ── Toast ─────────────────────────────────────────────────────────────────

  function showToast(msg) {
    var toast = document.createElement('div');
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
    var el = document.getElementById('save-status');
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

  // ── Migration ─────────────────────────────────────────────────────────────

  function toHtml(str) {
    if (!str) return '';
    if (str.trimStart().startsWith('<')) return str;
    return '<p>' + str + '</p>';
  }

  function migrateV1toV2(payload) {
    if (!payload || !payload.content || !Array.isArray(payload.content.ops)) return payload;
    payload.content.ops.forEach(function (op) {
      var val = op.insert;
      if (!val || typeof val !== 'object') return;

      if (val.accordion && Array.isArray(val.accordion.items)) {
        val.accordion.items.forEach(function (item) { item.content = toHtml(item.content); });
      }
      if (val.tabs && Array.isArray(val.tabs.tabs)) {
        val.tabs.tabs.forEach(function (tab) { tab.content = toHtml(tab.content); });
      }
      if (val.timeline && Array.isArray(val.timeline.items)) {
        val.timeline.items.forEach(function (item) { item.content = toHtml(item.content); });
      }
      if (val['click-reveal'] && Array.isArray(val['click-reveal'].items)) {
        val['click-reveal'].items.forEach(function (item) { item.content = toHtml(item.content); });
      }
      if (val.carousel && Array.isArray(val.carousel.slides)) {
        val.carousel.slides.forEach(function (slide) { slide.textContent = toHtml(slide.textContent); });
      }
      if (val.hotspot && Array.isArray(val.hotspot.pins)) {
        val.hotspot.pins.forEach(function (pin) { pin.content = toHtml(pin.content); });
      }
      if (val['flip-cards'] && Array.isArray(val['flip-cards'].cards)) {
        val['flip-cards'].cards.forEach(function (card) {
          if (!('frontBody' in card)) card.frontBody = '';
          if (!('backBody' in card)) card.backBody = '';
        });
      }
      if (val['knowledge-check']) {
        var kc = val['knowledge-check'];
        kc.question = toHtml(kc.question);
        kc.hint     = toHtml(kc.hint);
        if (Array.isArray(kc.options)) {
          kc.options.forEach(function (opt) { opt.feedback = toHtml(opt.feedback); });
        }
      }
      if (val.callout) {
        val.callout.body = toHtml(val.callout.body);
      }
      if (val.quote) {
        val.quote.text = toHtml(val.quote.text);
      }
    });
    payload.version = 2;
    return payload;
  }

  // v3 adds document-level state outside the delta: explicit title (F5) and
  // captured document styles from HTML import (F3). Both default to ''.
  function migrateV2toV3(payload) {
    if (typeof payload.title !== 'string') payload.title = '';
    if (typeof payload.documentStyles !== 'string') payload.documentStyles = '';
    payload.version = 3;
    return payload;
  }

  // ── Apply payload (shared by JSON and HTML load paths) ────────────────────

  function applyPayload(payload) {
    if (!payload || !payload.version) {
      showToast('Incompatible file — saved with a different version of Content Editor.');
      return;
    }
    if (payload.version === 1) migrateV1toV2(payload);
    if (payload.version === 2) migrateV2toV3(payload);
    if (payload.version !== SAVE_VERSION) {
      showToast('Incompatible file — saved with a different version of Content Editor.');
      return;
    }

    var quill = window.contentEditor && window.contentEditor.quill;
    if (quill && payload.content) {
      quill.setContents(payload.content, Quill.sources.SILENT);
    }
    if (payload.theme && window.ThemePanel) {
      window.ThemePanel.deserialize(JSON.stringify(payload.theme));
    }
    if (window.HCEDocState) {
      window.HCEDocState.setTitle(payload.title || '');
      window.HCEDocState.setDocumentStyles(payload.documentStyles || '');
    }

    setStatus('');
    showToast('Project loaded.');
  }

  // ── Save JSON ─────────────────────────────────────────────────────────────

  function saveProject() {
    var quill = window.contentEditor && window.contentEditor.quill;
    if (!quill) return;

    var rawTitle = (window.contentEditor.getDocumentTitle && window.contentEditor.getDocumentTitle()) || '';
    var slug = rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'project';

    var payload = {
      version: SAVE_VERSION,
      title:   window.HCEDocState ? window.HCEDocState.getTitle() : '',
      documentStyles: window.HCEDocState ? window.HCEDocState.getDocumentStyles() : '',
      content: quill.getContents(),
      theme:   window.ThemePanel ? window.ThemePanel.getCurrentTheme() : {},
    };

    var json = JSON.stringify(payload, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = slug + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSavedConfirmation();
  }

  // ── Save HTML ─────────────────────────────────────────────────────────────

  function saveProjectAsHtml() {
    window.HCERoundtrip.saveAsHtml();
    showSavedConfirmation();
  }

  // ── Load JSON ─────────────────────────────────────────────────────────────

  function loadProject() {
    var input  = document.createElement('input');
    input.type   = 'file';
    input.accept = '.json,application/json';

    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;

      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          var payload = JSON.parse(e.target.result);
          applyPayload(payload);
        } catch (err) {
          showToast('Could not load file — it may be corrupt or from an incompatible version.');
        }
      };
      reader.readAsText(file);
    });

    input.click();
  }

  // ── Load HTML ─────────────────────────────────────────────────────────────

  function loadHtmlProject() {
    var input  = document.createElement('input');
    input.type   = 'file';
    input.accept = '.html,text/html';

    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;

      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          var payload = window.HCERoundtrip.loadFromHtml(e.target.result);
          applyPayload(payload);
        } catch (err) {
          if (err.message === 'NO_EMBED') {
            // Foreign HTML — no embedded project data. Import it natively (F3):
            // map what's recognizable, wrap the rest in raw-html blocks.
            importForeignHtml(e.target.result);
          } else {
            showToast('Could not load file — it may be corrupt or from an incompatible version.');
          }
        }
      };
      reader.readAsText(file);
    });

    input.click();
  }

  // ── Native HTML import (F3) ───────────────────────────────────────────────

  function importForeignHtml(fileText) {
    var quill = window.contentEditor && window.contentEditor.quill;
    if (!quill || !window.HCEImport) return;

    var result;
    try {
      result = window.HCEImport.importHtml(fileText);
    } catch (err) {
      showToast('Import failed: ' + err.message);
      return;
    }

    quill.setContents(result.delta, Quill.sources.SILENT);
    if (window.HCEDocState) {
      window.HCEDocState.setDocumentStyles(result.documentStyles || '');
      if (result.suggestedTitle) window.HCEDocState.setTitle(result.suggestedTitle);
    }
    setStatus('unsaved');
    showImportReport(result.report);
  }

  // Kept-vs-dropped report, per kickoff F3: the user must see what mapped,
  // what got wrapped as raw HTML, and what was removed for safety.
  function showImportReport(report) {
    var overlay = document.createElement('div');
    overlay.className = 'widget-modal-overlay';
    var dialog = document.createElement('div');
    dialog.className = 'widget-modal';
    dialog.setAttribute('role', 'dialog');
    dialog.style.width = '520px';

    function section(title, lines) {
      if (!lines.length) return '';
      return '<div style="margin-top:10px;"><strong style="font-size:12px;">' + title + '</strong>' +
        '<ul style="margin:4px 0 0;padding-left:18px;font-size:12px;color:var(--color-text-muted);">' +
        lines.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul></div>';
    }
    function bucketLines(bucket) {
      return Object.keys(bucket).map(function (k) { return esc(k) + ' × ' + bucket[k]; });
    }
    function esc(s) {
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    var removed = report.removed || {};
    var removedLines = [];
    if (removed.scripts) removedLines.push('scripts removed × ' + removed.scripts);
    if (removed.elements) removedLines.push('active/embed elements removed (iframe, object, meta refresh, …) × ' + removed.elements);
    if (removed.onAttrs) removedLines.push('on* / srcdoc attributes removed × ' + removed.onAttrs);
    if (removed.jsUrls) removedLines.push('dangerous URLs neutralized × ' + removed.jsUrls);

    dialog.innerHTML =
      '<div class="widget-modal-header"><span>Imported as editable content</span></div>' +
      '<div class="widget-modal-body" style="font-family:var(--font-family-ui);">' +
        '<div style="font-size:13px;">Mapped <strong>' + (report.mappedTotal || 0) + '</strong> blocks to native content' +
        (report.wrappedTotal ? ', wrapped <strong>' + report.wrappedTotal + '</strong> in editable HTML blocks' : '') +
        (report.flattenedInline ? ', flattened ' + report.flattenedInline + ' inline element(s) to text' : '') + '.</div>' +
        section('Mapped', bucketLines(report.mapped || {})) +
        section('Wrapped as HTML blocks', bucketLines(report.wrapped || {})) +
        section('Removed for safety', removedLines) +
        section('Notes', (report.notes || []).slice(0, 8).map(esc)) +
      '</div>' +
      '<div class="widget-modal-footer"></div>';

    var okBtn = document.createElement('button');
    okBtn.className = 'widget-modal-btn widget-modal-btn--save';
    okBtn.type = 'button';
    okBtn.textContent = 'OK';
    okBtn.addEventListener('click', function () { document.body.removeChild(overlay); });
    dialog.querySelector('.widget-modal-footer').appendChild(okBtn);

    overlay.appendChild(dialog);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) document.body.removeChild(overlay); });
    document.body.appendChild(overlay);
  }

  // ── Track unsaved changes ─────────────────────────────────────────────────

  function trackChanges() {
    var quill = window.contentEditor && window.contentEditor.quill;
    if (!quill) return;
    quill.on('text-change', function (delta, oldDelta, source) {
      if (source === Quill.sources.USER && !_statusTimer) {
        setStatus('unsaved');
      }
    });
  }

  // ── Dropdown builder ──────────────────────────────────────────────────────

  function buildDropdown(id, label, items) {
    var wrapper    = document.createElement('div');
    wrapper.className = 'header-dropdown';

    var btn       = document.createElement('button');
    btn.className = 'header-btn header-btn--ghost header-btn--has-arrow';
    btn.id        = id;
    btn.innerHTML = label + ' <span class="header-btn-arrow" aria-hidden="true">&#9662;</span>';

    var menu         = document.createElement('div');
    menu.className   = 'header-dropdown-menu';
    menu.setAttribute('role', 'menu');

    items.forEach(function (item) {
      var menuItem         = document.createElement('button');
      menuItem.className   = 'header-dropdown-item';
      menuItem.textContent = item.label;
      menuItem.setAttribute('role', 'menuitem');
      menuItem.addEventListener('click', function () {
        menu.classList.remove('is-open');
        item.action();
      });
      menu.appendChild(menuItem);
    });

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = menu.classList.contains('is-open');
      document.querySelectorAll('.header-dropdown-menu.is-open').forEach(function (m) {
        m.classList.remove('is-open');
      });
      if (!isOpen) menu.classList.add('is-open');
    });

    wrapper.appendChild(btn);
    wrapper.appendChild(menu);
    return wrapper;
  }

  // Close all dropdowns when clicking outside
  document.addEventListener('click', function () {
    document.querySelectorAll('.header-dropdown-menu.is-open').forEach(function (m) {
      m.classList.remove('is-open');
    });
  });

  // ── Build header buttons ──────────────────────────────────────────────────

  function buildButtons() {
    var headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    var saveDropdown = buildDropdown('save-btn', 'Save', [
      { label: 'Save JSON',  action: saveProject },
      { label: 'Save HTML',  action: saveProjectAsHtml },
    ]);

    var loadDropdown = buildDropdown('load-btn', 'Load', [
      { label: 'Load JSON',  action: loadProject },
      { label: 'Load HTML',  action: loadHtmlProject },
    ]);

    var anchor = document.getElementById('save-status') || document.getElementById('export-btn');
    if (anchor) {
      headerActions.insertBefore(loadDropdown, anchor);
      headerActions.insertBefore(saveDropdown, loadDropdown);
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    buildButtons();
    setTimeout(trackChanges, 200);
  });

  window.HCESaveLoad = { saveProject, loadProject, importForeignHtml, applyPayload };
})();
