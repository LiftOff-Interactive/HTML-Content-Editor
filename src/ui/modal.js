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
   *   type = 'text' | 'textarea' | 'select'
   *   select fields also need: options — array of { value, label } objects
   *
   * Resolves with a shallow copy of the updated data object on Save,
   * or null if the user cancels (Escape, backdrop click, Cancel button).
   */
  function open({ title, fields, data }) {
    return new Promise(function (resolve) {
      const formData = Object.assign({}, data);

      // ── Overlay ──────────────────────────────────────────────────────────
      const overlay = document.createElement('div');
      overlay.className = 'widget-modal-overlay';

      // ── Dialog ───────────────────────────────────────────────────────────
      const dialog = document.createElement('div');
      dialog.className = 'widget-modal';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-labelledby', 'wm-title');

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
        const fieldId = 'wm-field-' + idx;
        const row = document.createElement('div');
        row.className = 'widget-modal-field';

        const label = document.createElement('label');
        label.className = 'widget-modal-label';
        label.setAttribute('for', fieldId);
        label.textContent = field.label;

        let input;
        if (field.type === 'textarea') {
          input = document.createElement('textarea');
          input.className = 'widget-modal-textarea';
          input.rows = 3;
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

        row.appendChild(label);
        row.appendChild(input);
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
      function close(result) {
        document.removeEventListener('keydown', onKeydown);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve(result);
      }

      function onKeydown(e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          close(null);
        }
        if (e.key === 'Enter' && document.activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          close(Object.assign({}, formData));
        }
      }

      closeBtn.addEventListener('click', function () { close(null); });
      cancelBtn.addEventListener('click', function () { close(null); });
      saveBtn.addEventListener('click', function () { close(Object.assign({}, formData)); });
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) close(null);
      });
      document.addEventListener('keydown', onKeydown);
    });
  }

  /**
   * WidgetModal.makeAlignRow(initialValue, onChange) → HTMLElement
   *
   * Returns a row of three toggle buttons (Left / Center / Right).
   * initialValue — 'left' | 'center' | 'right'  (defaults to 'left')
   * onChange(value) — called whenever the selection changes
   */
  function makeAlignRow(initialValue, onChange) {
    const row = document.createElement('div');
    row.className = 'widget-modal-align-row';

    var current = initialValue || 'left';
    var buttons = [];

    [
      { value: 'left',   label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right',  label: 'Right' },
    ].forEach(function (def) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'widget-modal-align-btn' + (def.value === current ? ' is-active' : '');
      btn.textContent = def.label;
      btn.dataset.alignValue = def.value;

      btn.addEventListener('click', function () {
        current = def.value;
        buttons.forEach(function (b) {
          b.classList.toggle('is-active', b.dataset.alignValue === current);
        });
        if (onChange) onChange(current);
      });

      buttons.push(btn);
      row.appendChild(btn);
    });

    return row;
  }

  window.WidgetModal = { open, makeAlignRow };
})();
