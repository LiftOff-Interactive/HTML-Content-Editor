(function () {
  'use strict';

  // ── raw-html blot ───────────────────────────────────────────────────────────
  // Holds a sanitized HTML subtree that the importer could not map to a native
  // blot (section, table, figure, custom divs, …). Registered with Quill so the
  // delta + export know it, but HIDDEN from the slash/toolbar palettes
  // (static widgetHidden = true) — it only ever appears via HTML import.
  //
  // The stored html is ALWAYS sanitized (at import, and again on edit-save), so
  // renderEditor / renderExport / renderExportNoJS can emit it verbatim — it is
  // already script-free and SharePoint-safe.

  class RawHtmlBlot extends window.BaseWidgetBlot {
    static blotName          = 'raw-html';
    static tagName           = 'div';
    static widgetName        = 'raw-html';
    static widgetLabel       = 'Raw HTML';
    static widgetIcon        = '〈〉';
    static widgetDescription = 'Imported HTML block';
    static widgetHidden      = true;                 // never shown in palettes
    static defaultData       = { _v: 1, html: '' };

    // Defense-in-depth: always sanitize before any innerHTML. data.html is
    // sanitized at import and on edit-save, but a hand-crafted/tampered save file
    // could carry unsanitized html — re-sanitizing on every render closes that.
    _safe(html) {
      html = (html == null) ? '' : String(html);
      // Fail CLOSED: if the sanitizer module somehow failed to load, drop the
      // content rather than render/export it unsanitized.
      if (!window.HCESanitize) return '';
      return window.HCESanitize.clean(html);
    }

    renderEditor(container, data) {
      var html = this._safe(data && data.html);
      container.innerHTML =
        '<div class="raw-html-bar">' +
          '<span class="raw-html-bar-label">〈〉 Imported HTML</span>' +
          '<button class="raw-html-edit-btn" type="button">✎ Edit HTML</button>' +
        '</div>' +
        '<div class="raw-html-body">' + (html || '<em class="raw-html-empty">Empty HTML block</em>') + '</div>';

      var self = this;
      var btn = container.querySelector('.raw-html-edit-btn');
      if (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          self.edit(self.constructor.value(self.domNode));
        });
      }
    }

    // Export: sanitize again so the output is script-free even if the project
    // file was tampered with. Both modes emit the same static (no-JS) HTML.
    renderExport(container, data) {
      container.innerHTML = this._safe(data && data.html);
    }
    renderExportNoJS(container, data) {
      container.innerHTML = this._safe(data && data.html);
    }

    edit(data) {
      this._openEditModal(data || {});
    }

    // A focused HTML code editor using the canonical (F1-correct) modal layout:
    // dialog is a bounded flex column; the body flexes + scrolls; footer pinned.
    _openEditModal(data) {
      var self = this;
      var current = (data && data.html) || '';

      var overlay = document.createElement('div');
      overlay.className = 'widget-modal-overlay';

      var dialog = document.createElement('div');
      dialog.className = 'widget-modal';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.style.width = '720px';

      var header = document.createElement('div');
      header.className = 'widget-modal-header';
      var titleEl = document.createElement('span');
      titleEl.textContent = 'Edit imported HTML';
      var closeX = document.createElement('button');
      closeX.className = 'widget-modal-close';
      closeX.type = 'button';
      closeX.setAttribute('aria-label', 'Close');
      closeX.innerHTML = '&times;';
      header.appendChild(titleEl);
      header.appendChild(closeX);

      var body = document.createElement('div');
      body.style.cssText = 'display:flex;flex:1;min-height:0;overflow:hidden;padding:16px;';
      var textarea = document.createElement('textarea');
      textarea.className = 'raw-html-editor';
      textarea.spellcheck = false;
      textarea.value = current;
      textarea.setAttribute('aria-label', 'HTML source');
      body.appendChild(textarea);

      var footer = document.createElement('div');
      footer.className = 'widget-modal-footer';
      var cancelBtn = document.createElement('button');
      cancelBtn.className = 'widget-modal-btn widget-modal-btn--cancel';
      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Cancel';
      var saveBtn = document.createElement('button');
      saveBtn.className = 'widget-modal-btn widget-modal-btn--save';
      saveBtn.type = 'button';
      saveBtn.textContent = 'Save';
      footer.appendChild(cancelBtn);
      footer.appendChild(saveBtn);

      dialog.appendChild(header);
      dialog.appendChild(body);
      dialog.appendChild(footer);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      textarea.focus();

      function close() {
        document.removeEventListener('keydown', onKey);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }
      function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); close(); } }

      closeX.addEventListener('click', close);
      cancelBtn.addEventListener('click', close);
      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
      document.addEventListener('keydown', onKey);
      saveBtn.addEventListener('click', function () {
        // Re-sanitize on every save (fail-closed) — the user may paste active content.
        self.updateData({ _v: 1, html: self._safe(textarea.value) });
        close();
      });
    }
  }

  window.WidgetRegistry.register(RawHtmlBlot);
  window.RawHtmlBlot = RawHtmlBlot;
})();
