/**
 * DocTitle (F5) — explicit document naming + New/Clear.
 *
 * A header input holds the document's name (persisted in the v3 payload via
 * HCEDocState). When empty, everything falls back to the first H1 exactly as
 * before — window.contentEditor.getDocumentTitle() implements the preference.
 * The New button wipes document, name, imported styles and theme (confirmed).
 */
(function () {
  'use strict';

  var input = null;

  function syncFromState() {
    if (!input) return;
    // Don't write back into the field the user is actively typing in — the
    // stored title is trimmed, so echoing it mid-type would eat trailing spaces.
    if (document.activeElement !== input) {
      var t = window.HCEDocState.getTitle();
      if (input.value !== t) input.value = t;
    }
    updateTabTitle();
  }

  function updateTabTitle() {
    var editor = window.contentEditor;
    var t = editor && editor.getDocumentTitle ? editor.getDocumentTitle() : '';
    document.title = t ? t + ' — Content Editor' : 'Content Editor';
  }

  function buildTitleInput() {
    input = document.createElement('input');
    input.id = 'doc-title-input';
    input.className = 'doc-title-input';
    input.type = 'text';
    input.maxLength = 120;
    input.placeholder = 'Untitled document';
    input.setAttribute('aria-label', 'Document name');
    input.addEventListener('input', function () {
      window.HCEDocState.setTitle(input.value.trim());
    });

    var header = document.getElementById('app-header');
    var actions = document.querySelector('.header-actions');
    if (header && actions) header.insertBefore(input, actions);
  }

  function clearProject() {
    var ok = window.confirm(
      'Start a new project?\n\nThis clears the document, its name, imported styles, ' +
      'and theme settings. Unsaved changes will be lost.'
    );
    if (!ok) return;

    var quill = window.contentEditor && window.contentEditor.quill;
    if (quill) quill.setText('', Quill.sources.SILENT);
    window.HCEDocState.reset();
    if (window.ThemePanel) {
      window.ThemePanel.deserialize(JSON.stringify(window.ThemePanel.DEFAULT_THEME));
    }
    var status = document.getElementById('save-status');
    if (status) { status.textContent = ''; status.classList.remove('save-status--saved'); }
    updateTabTitle();
  }

  function buildNewButton() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'header-btn header-btn--ghost';
    btn.id = 'new-project-btn';
    btn.textContent = 'New';
    btn.setAttribute('title', 'Start a new empty project (clears document, name, and theme)');
    btn.addEventListener('click', clearProject);

    var actions = document.querySelector('.header-actions');
    if (actions) actions.insertBefore(btn, actions.firstChild);
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildTitleInput();
    buildNewButton();
    syncFromState();
  });

  // Loading a project / importing HTML sets the title through HCEDocState —
  // keep the input and browser tab in sync.
  document.addEventListener('hce-docstate-changed', syncFromState);

  window.HCEDocTitle = { clearProject: clearProject, syncFromState: syncFromState };
})();
