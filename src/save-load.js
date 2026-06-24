(function () {
  'use strict';

  // Shared with html-roundtrip.js via constants.js so the two never drift (R4).
  var SAVE_VERSION = window.HCE_SAVE_VERSION || 3;

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

  // v2 → v3: a pure tag. Stamp kind:'widgets' (existing files are widgets-mode);
  // content/theme are untouched, so v2 files load byte-identically. Also fill any
  // theme tokens added since the file was saved (e.g. --widget-shadow-ring) with
  // their current defaults so an upgraded v2 doc renders identically (F4 caveat).
  function migrateV2toV3(payload) {
    payload.kind = payload.kind || 'widgets';
    var DEFAULTS = window.ThemePanel && window.ThemePanel.DEFAULT_THEME;
    if (payload.theme && DEFAULTS) {
      // saved values win over defaults; absent keys adopt the current default.
      payload.theme = Object.assign({}, DEFAULTS, payload.theme);
    }
    payload.version = 3;
    return payload;
  }

  // ── Apply payload (shared by JSON and HTML load paths) ────────────────────
  // Router on payload.kind: 'widgets' → Quill delta; 'course' → course mode
  // (added in F3 Phase 2). Migration chain: v1 → v2 → v3.

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

    var kind = payload.kind || 'widgets';
    if (kind === 'course') {
      // Course-mode documents are loaded by F3 Phase 2; not available yet.
      if (window.HCECourse && typeof window.HCECourse.loadDocument === 'function') {
        window.HCECourse.loadDocument(payload);
        setStatus('');
        showToast('Course project loaded.');
        return;
      }
      showToast('This file uses course mode, which this version cannot open yet.');
      return;
    }

    var quill = window.contentEditor && window.contentEditor.quill;
    if (quill && payload.content) {
      quill.setContents(payload.content, Quill.sources.SILENT);
    }
    if (payload.theme && window.ThemePanel) {
      window.ThemePanel.deserialize(JSON.stringify(payload.theme));
    }
    // Imported document styles (F3): apply if present, otherwise clear any from a
    // previous import so a fresh load never inherits stale styles.
    if (window.DocStyles) {
      if (payload.docStyles) window.DocStyles.set(payload.docStyles);
      else window.DocStyles.clear();
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
      kind:    'widgets',
      content: quill.getContents(),
      theme:   window.ThemePanel ? window.ThemePanel.getCurrentTheme() : {},
    };
    var docStyles = window.DocStyles && window.DocStyles.get();
    if (docStyles) payload.docStyles = docStyles;

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
          applyPayload(payload);                       // our own round-trip file
        } catch (err) {
          if (err.message === 'NO_EMBED') {
            // Foreign HTML — import it (F3): sanitize, map recognized nodes, wrap
            // the rest as raw-html. Never throws away content.
            try {
              var imported = window.HCEImport.importArbitraryHtml(e.target.result);
              applyPayload(imported);
              var r = imported._report;
              if (r) {
                showToast('Imported HTML — ' + r.counts.recognized + ' block(s) recognized, ' +
                  r.counts.raw + ' kept as raw HTML' +
                  (imported.docStyles && imported.docStyles.linkRefs.length
                    ? '. ' + imported.docStyles.linkRefs.length + ' external stylesheet link(s) dropped (not fetched).'
                    : '.'));
              }
            } catch (e2) {
              showToast('Could not import this HTML file: ' + (e2 && e2.message));
            }
          } else {
            showToast('Could not load file — it may be corrupt or from an incompatible version.');
          }
        }
      };
      reader.readAsText(file);
    });

    input.click();
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

  window.HCESaveLoad = { saveProject, loadProject, applyPayload: applyPayload };
})();
