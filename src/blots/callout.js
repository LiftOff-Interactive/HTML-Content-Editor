(function () {
  'use strict';

  const TYPE_CONFIG = {
    info:    { icon: 'ℹ️',  borderColor: '#2563eb', bgColor: '#eff6ff', role: 'note'  },
    warning: { icon: '⚠️',  borderColor: '#f59e0b', bgColor: '#fffbeb', role: 'note'  },
    success: { icon: '✅',  borderColor: '#16a34a', bgColor: '#f0fdf4', role: 'note'  },
    danger:  { icon: '🚨',  borderColor: '#dc2626', bgColor: '#fef2f2', role: 'alert' },
  };

  function escape(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  class CalloutBlot extends BaseWidgetBlot {
    static blotName          = 'callout';
    static tagName           = 'div';
    static widgetName        = 'callout';
    static widgetLabel       = 'Callout';
    static widgetIcon        = '⚠️';
    static widgetDescription = 'A highlighted alert or notice box';
    static defaultData       = { _v: 2, type: 'info', title: 'Note', body: '', widgetAlign: 'left' };

    renderEditor(container, data) {
      const cfg = TYPE_CONFIG[data.type] || TYPE_CONFIG.info;
      container.setAttribute('role', cfg.role);
      container.innerHTML =
        '<div class="callout-preview callout-preview--' + data.type + '">' +
          '<span class="callout-preview-icon">' + cfg.icon + '</span>' +
          '<div class="callout-preview-body">' +
            (data.title ? '<strong>' + escape(data.title) + '</strong>' : '') +
            (data.body  ? '<div>'    + data.body           + '</div>'   : '') +
          '</div>' +
        '</div>';
    }

    renderExport(container, data) {
      const cfg  = TYPE_CONFIG[data.type] || TYPE_CONFIG.info;
      const root = getComputedStyle(document.documentElement);

      const borderColor = {
        info:    root.getPropertyValue('--color-primary').trim() || cfg.borderColor,
        warning: root.getPropertyValue('--color-accent').trim()  || cfg.borderColor,
        success: cfg.borderColor,
        danger:  cfg.borderColor,
      }[data.type] || cfg.borderColor;

      const fontFamily = root.getPropertyValue('--font-family-body').trim() || 'Georgia, serif';
      const textColor  = root.getPropertyValue('--color-text').trim()       || '#1e293b';
      const mutedColor = root.getPropertyValue('--color-text-muted').trim() || '#64748b';
      const radius     = root.getPropertyValue('--widget-border-radius').trim() || '0.5rem';

      const titleHtml = data.title
        ? '<strong style="display:block;font-size:14px;font-weight:600;color:' + textColor + ';margin-bottom:4px;">' + escape(data.title) + '</strong>'
        : '';
      const bodyHtml = data.body
        ? '<div style="font-size:14px;color:' + mutedColor + ';margin:0;line-height:1.6;">' + data.body + '</div>'
        : '';

      container.setAttribute('role', cfg.role);
      container.innerHTML =
        '<div style="' +
          'display:flex;align-items:flex-start;gap:10px;' +
          'padding:12px 16px;' +
          'border-left:4px solid ' + borderColor + ';' +
          'background:' + cfg.bgColor + ';' +
          'border-radius:' + radius + ';' +
          'font-family:' + fontFamily + ';' +
          'margin:8px 0;' +
        '">' +
          '<span style="font-size:16px;line-height:1;flex-shrink:0;margin-top:2px;">' + cfg.icon + '</span>' +
          '<div>' + titleHtml + bodyHtml + '</div>' +
        '</div>';
    }

    edit(data) {
      const working = Object.assign({}, data);

      // ── Build overlay ──────────────────────────────────────────────────────
      const overlay = document.createElement('div');
      overlay.className = 'widget-modal-overlay';

      const dialog = document.createElement('div');
      dialog.className = 'widget-modal';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-labelledby', 'callout-modal-title');

      // Header
      const header = document.createElement('div');
      header.className = 'widget-modal-header';
      const titleEl = document.createElement('span');
      titleEl.id = 'callout-modal-title';
      titleEl.textContent = 'Edit Callout';
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

      // Type select
      const typeRow = document.createElement('div');
      typeRow.className = 'widget-modal-field';
      const typeLabel = document.createElement('label');
      typeLabel.className = 'widget-modal-label';
      typeLabel.textContent = 'Type';
      const typeSelect = document.createElement('select');
      typeSelect.className = 'widget-modal-select';
      [
        { value: 'info',    label: 'ℹ️  Info' },
        { value: 'warning', label: '⚠️  Warning' },
        { value: 'success', label: '✅  Success' },
        { value: 'danger',  label: '🚨  Danger' },
      ].forEach(function (opt) {
        const o = document.createElement('option');
        o.value = opt.value;
        o.textContent = opt.label;
        if (opt.value === working.type) o.selected = true;
        typeSelect.appendChild(o);
      });
      typeSelect.addEventListener('change', function () { working.type = typeSelect.value; });
      typeRow.appendChild(typeLabel);
      typeRow.appendChild(typeSelect);

      // Title input
      const titleRow = document.createElement('div');
      titleRow.className = 'widget-modal-field';
      const titleLabel = document.createElement('label');
      titleLabel.className = 'widget-modal-label';
      titleLabel.textContent = 'Title';
      const titleInput = document.createElement('input');
      titleInput.className = 'widget-modal-input';
      titleInput.type = 'text';
      titleInput.value = working.title || '';
      titleInput.addEventListener('input', function () { working.title = titleInput.value; });
      titleRow.appendChild(titleLabel);
      titleRow.appendChild(titleInput);

      // Body rich text field
      const bodyRow = document.createElement('div');
      bodyRow.className = 'widget-modal-field';
      const bodyLabel = document.createElement('label');
      bodyLabel.className = 'widget-modal-label';
      bodyLabel.textContent = 'Body';
      const bodyMount = document.createElement('div');
      bodyRow.appendChild(bodyLabel);
      bodyRow.appendChild(bodyMount);

      // Widget alignment row
      const alignRow = document.createElement('div');
      alignRow.className = 'widget-modal-field';
      const alignLabel = document.createElement('label');
      alignLabel.className = 'widget-modal-label';
      alignLabel.textContent = 'Widget Alignment';
      alignRow.appendChild(alignLabel);
      alignRow.appendChild(WidgetModal.makeAlignRow(working.widgetAlign || 'left', function (v) {
        working.widgetAlign = v;
      }));

      body.appendChild(typeRow);
      body.appendChild(titleRow);
      body.appendChild(bodyRow);
      body.appendChild(alignRow);

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

      // Init RichTextField after mount so Quill has a real DOM parent
      const bodyField = new RichTextField(bodyMount, working.body || '');
      requestAnimationFrame(function () { titleInput.focus(); });

      // ── Close helpers ────────────────────────────────────────────────────
      const self = this;

      function close(save) {
        document.removeEventListener('keydown', onKeydown);
        working.body = bodyField.getHtml();
        bodyField.destroy();
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (save) self.updateData(Object.assign({}, data, working));
      }

      function onKeydown(e) {
        if (e.key === 'Escape') { e.preventDefault(); close(false); }
      }

      closeBtn.addEventListener('click', function () { close(false); });
      cancelBtn.addEventListener('click', function () { close(false); });
      saveBtn.addEventListener('click', function () { close(true); });
      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(false); });
      document.addEventListener('keydown', onKeydown);
    }
  }

  WidgetRegistry.register(CalloutBlot);
})();
