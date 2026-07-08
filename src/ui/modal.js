(function () {
  'use strict';

  /**
   * WidgetModal.open(options) → Promise<object|null>
   *
   * options:
   *   title   {string}   dialog heading
   *   fields  {Array}    field descriptors — see below
   *   data    {object}   current widget data (pre-fills the form)
   *
   * Field descriptor:
   *   { key, label, type }
   *   type = 'text' | 'textarea' | 'select' | 'rich' | 'divider' | 'optcolor'
   *   select fields also need: options — array of { value, label } objects
   *   divider renders a section separator (no key); optcolor is a
   *   checkbox-enabled color override where '' means "inherit theme"
   *   (Stage 11 F4 — may carry a fallback hex for the disabled picker)
   *
   * Resolves with a shallow copy of the updated data object on Save,
   * or null if the user cancels (Escape, backdrop click, Cancel button).
   */
  function open({ title, fields, data, width }) {
    return new Promise(function (resolve) {
      const formData = Object.assign({}, data);
      const richInstances = {};

      // ── Overlay ──────────────────────────────────────────────────────────
      const overlay = document.createElement('div');
      overlay.className = 'widget-modal-overlay';

      // ── Dialog ───────────────────────────────────────────────────────────
      const dialog = document.createElement('div');
      dialog.className = 'widget-modal';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-labelledby', 'wm-title');
      if (width) dialog.style.width = width;

      // Header
      const header = document.createElement('div');
      header.className = 'widget-modal-header';
      const titleEl = document.createElement('span');
      titleEl.id = 'wm-title';
      titleEl.textContent = title;
      const closeBtn = document.createElement('button');
      closeBtn.className = 'widget-modal-close';
      closeBtn.type = 'button';
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.innerHTML = '&times;';
      header.appendChild(titleEl);
      header.appendChild(closeBtn);

      // Body
      const body = document.createElement('div');
      body.className = 'widget-modal-body';

      fields.forEach(function (field, idx) {
        // Section separator — no input, no key.
        if (field.type === 'divider') {
          const sep = document.createElement('div');
          sep.style.cssText =
            'border-top:1px solid var(--color-border);margin:14px 0 6px;padding-top:6px;' +
            'font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;' +
            'color:var(--color-text-muted);font-family:var(--font-family-ui);';
          sep.textContent = field.label || '';
          body.appendChild(sep);
          return;
        }

        // Checkbox-enabled color override; '' = inherit theme (Stage 11 F4).
        if (field.type === 'optcolor') {
          const row = document.createElement('label');
          row.className = 'widget-modal-field widget-modal-optcolor';
          row.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;';

          const enable = document.createElement('input');
          enable.type = 'checkbox';
          const picker = document.createElement('input');
          picker.type = 'color';
          picker.style.cssText = 'width:32px;height:22px;padding:0;border:1px solid var(--color-border);cursor:pointer;';
          const text = document.createElement('span');
          text.textContent = field.label;
          text.style.cssText = 'flex:1;font-size:12px;font-family:var(--font-family-ui);color:var(--color-text);';

          const current = String(data[field.key] || '').trim();
          enable.checked  = !!current;
          picker.disabled = !current;
          picker.value    = current || field.fallback || '#2563eb';
          formData[field.key] = current;

          enable.addEventListener('change', function () {
            picker.disabled = !enable.checked;
            formData[field.key] = enable.checked ? picker.value : '';
          });
          picker.addEventListener('input', function () {
            if (!picker.disabled) formData[field.key] = picker.value;
          });

          row.appendChild(enable);
          row.appendChild(text);
          row.appendChild(picker);
          body.appendChild(row);
          return;
        }

        const fieldId = 'wm-field-' + idx;
        const row = document.createElement('div');
        row.className = 'widget-modal-field';

        const label = document.createElement('label');
        label.className = 'widget-modal-label';
        label.setAttribute('for', fieldId);
        label.textContent = field.label;

        row.appendChild(label);

        if (field.type === 'rich') {
          const mount = document.createElement('div');
          const rf = new RichTextField(mount, data[field.key] || '');
          richInstances[field.key] = rf;
          row.appendChild(mount);
        } else {
          let input;
          if (field.type === 'textarea') {
            input = document.createElement('textarea');
            input.className = 'widget-modal-textarea' + (field.mono ? ' widget-modal-textarea--mono' : '');
            input.rows = field.rows || 3;
            input.value = data[field.key] || '';
          } else if (field.type === 'select') {
            input = document.createElement('select');
            input.className = 'widget-modal-select';
            (field.options || []).forEach(function (opt) {
              const option = document.createElement('option');
              option.value = opt.value;
              option.textContent = opt.label;
              if (opt.value === data[field.key]) option.selected = true;
              input.appendChild(option);
            });
          } else {
            input = document.createElement('input');
            input.className = 'widget-modal-input';
            input.type = field.type || 'text';
            input.value = data[field.key] || '';
          }
          input.id = fieldId;
          input.addEventListener('input', function () { formData[field.key] = input.value; });
          input.addEventListener('change', function () { formData[field.key] = input.value; });
          row.appendChild(input);
        }

        body.appendChild(row);
      });

      // Footer
      const footer = document.createElement('div');
      footer.className = 'widget-modal-footer';

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'widget-modal-btn widget-modal-btn--cancel';
      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Cancel';

      const saveBtn = document.createElement('button');
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

      // Focus the first field after paint
      requestAnimationFrame(function () {
        const first = dialog.querySelector('input, textarea, select');
        if (first) first.focus();
      });

      // ── Close helpers ─────────────────────────────────────────────────────
      function destroyRichFields() {
        Object.keys(richInstances).forEach(function (key) {
          richInstances[key].destroy();
        });
      }

      function close(result) {
        destroyRichFields();
        document.removeEventListener('keydown', onKeydown);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve(result);
      }

      function isRichEditorActive() {
        const el = document.activeElement;
        return el && el.classList.contains('ql-editor');
      }

      function onKeydown(e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          close(null);
        }
        const tag = document.activeElement ? document.activeElement.tagName : '';
        if (e.key === 'Enter' && tag !== 'TEXTAREA' && !isRichEditorActive()) {
          e.preventDefault();
          Object.keys(richInstances).forEach(function (key) {
            formData[key] = richInstances[key].getHtml();
          });
          close(Object.assign({}, formData));
        }
      }

      closeBtn.addEventListener('click', function () { close(null); });
      cancelBtn.addEventListener('click', function () { close(null); });
      saveBtn.addEventListener('click', function () {
        Object.keys(richInstances).forEach(function (key) {
          formData[key] = richInstances[key].getHtml();
        });
        close(Object.assign({}, formData));
      });
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) close(null);
      });
      document.addEventListener('keydown', onKeydown);
    });
  }

  window.WidgetModal = { open };
})();
