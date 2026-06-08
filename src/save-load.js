(function () {
  'use strict';

  const SAVE_VERSION = 1;

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

          if (!payload || payload.version !== SAVE_VERSION) {
            showToast('Incompatible file — saved with a different version of Content Editor.');
            return;
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
