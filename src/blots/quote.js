(function () {
  'use strict';

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildAttributionHtml(escapedName, escapedRole) {
    if (!escapedName && !escapedRole) return '';
    if (escapedName && escapedRole) return '— ' + escapedName + ', ' + escapedRole;
    return '— ' + (escapedName || escapedRole);
  }

  class QuoteBlot extends BaseWidgetBlot {
    static blotName          = 'quote';
    static tagName           = 'div';
    static widgetName        = 'quote';
    static widgetLabel       = 'Quote';
    static widgetIcon        = '"';
    static widgetDescription = 'A stylized pull quote or blockquote';
    static defaultData       = {
      _v: 2,
      style: 'pull',
      quote: 'The only way to do great work is to love what you do.',
      attribution: 'Steve Jobs',
      role: '',
      widgetAlign: 'left',
    };

    renderEditor(container, data) {
      const style    = data.style || 'pull';
      const attrHtml = buildAttributionHtml(esc(data.attribution), esc(data.role));

      container.innerHTML =
        '<blockquote class="quote-widget quote-widget--' + style + '">' +
          (style === 'pull'
            ? '<span class="quote-mark" aria-hidden="true">"</span>'
            : '') +
          '<div class="quote-text">' + (data.quote || '') + '</div>' +
          (attrHtml
            ? '<footer class="quote-attribution"><cite>' + attrHtml + '</cite></footer>'
            : '') +
        '</blockquote>';
    }

    renderExport(container, data) {
      const style  = data.style || 'pull';
      const root   = getComputedStyle(document.documentElement);

      const primary = root.getPropertyValue('--color-primary').trim()        || '#2563eb';
      const surface = root.getPropertyValue('--color-surface').trim()        || '#f8fafc';
      const text    = root.getPropertyValue('--color-text').trim()           || '#1e293b';
      const muted   = root.getPropertyValue('--color-text-muted').trim()     || '#64748b';
      const font    = root.getPropertyValue('--font-family-body').trim()     || 'Georgia, serif';
      const radius  = root.getPropertyValue('--widget-border-radius').trim() || '0.5rem';

      let blockStyle, markHtml, textStyle;

      if (style === 'pull') {
        blockStyle =
          'font-family:' + font + ';text-align:center;padding:24px 32px;margin:8px 0;';
        markHtml =
          '<span aria-hidden="true" style="display:block;font-size:56px;line-height:0.6;' +
          'color:' + primary + ';font-family:Georgia,serif;margin-bottom:12px;">"</span>';
        textStyle =
          'font-size:1.4em;line-height:1.5;color:' + text + ';font-style:italic;margin:0;';
      } else if (style === 'sidebar') {
        blockStyle =
          'font-family:' + font + ';padding:12px 16px 12px 20px;' +
          'border-left:4px solid ' + primary + ';margin:8px 0;';
        markHtml = '';
        textStyle = 'font-size:1em;color:' + text + ';line-height:1.6;margin:0;';
      } else {
        blockStyle =
          'font-family:' + font + ';background:' + surface + ';' +
          'border-radius:' + radius + ';padding:20px 24px;text-align:center;margin:8px 0;';
        markHtml = '';
        textStyle =
          'font-size:1.1em;color:' + primary + ';font-weight:600;line-height:1.5;margin:0;';
      }

      const attrStyle =
        'display:block;margin-top:' + (style === 'sidebar' ? '8px' : '14px') + ';' +
        'font-size:0.85em;font-style:italic;color:' + muted + ';';

      const attrHtml = buildAttributionHtml(esc(data.attribution), esc(data.role));

      container.innerHTML =
        '<blockquote style="' + blockStyle + '">' +
          markHtml +
          '<div style="' + textStyle + '">' + (data.quote || '') + '</div>' +
          (attrHtml
            ? '<footer><cite style="' + attrStyle + '">' + attrHtml + '</cite></footer>'
            : '') +
        '</blockquote>';
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
      dialog.setAttribute('aria-labelledby', 'quote-modal-title');

      // Header
      const header = document.createElement('div');
      header.className = 'widget-modal-header';
      const titleEl = document.createElement('span');
      titleEl.id = 'quote-modal-title';
      titleEl.textContent = 'Edit Quote';
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

      // Style select
      const styleRow = document.createElement('div');
      styleRow.className = 'widget-modal-field';
      const styleLabel = document.createElement('label');
      styleLabel.className = 'widget-modal-label';
      styleLabel.textContent = 'Style';
      const styleSelect = document.createElement('select');
      styleSelect.className = 'widget-modal-select';
      [
        { value: 'pull',      label: 'Pull — large centered quote' },
        { value: 'sidebar',   label: 'Sidebar — left-border accent' },
        { value: 'highlight', label: 'Highlight — colored background' },
      ].forEach(function (opt) {
        const o = document.createElement('option');
        o.value = opt.value;
        o.textContent = opt.label;
        if (opt.value === working.style) o.selected = true;
        styleSelect.appendChild(o);
      });
      styleSelect.addEventListener('change', function () { working.style = styleSelect.value; });
      styleRow.appendChild(styleLabel);
      styleRow.appendChild(styleSelect);

      // Quote rich text field
      const quoteRow = document.createElement('div');
      quoteRow.className = 'widget-modal-field';
      const quoteLabel = document.createElement('label');
      quoteLabel.className = 'widget-modal-label';
      quoteLabel.textContent = 'Quote text';
      const quoteMount = document.createElement('div');
      quoteRow.appendChild(quoteLabel);
      quoteRow.appendChild(quoteMount);

      // Attribution input
      const attrRow = document.createElement('div');
      attrRow.className = 'widget-modal-field';
      const attrLabel = document.createElement('label');
      attrLabel.className = 'widget-modal-label';
      attrLabel.textContent = 'Attribution (optional)';
      const attrInput = document.createElement('input');
      attrInput.className = 'widget-modal-input';
      attrInput.type = 'text';
      attrInput.value = working.attribution || '';
      attrInput.addEventListener('input', function () { working.attribution = attrInput.value; });
      attrRow.appendChild(attrLabel);
      attrRow.appendChild(attrInput);

      // Role input
      const roleRow = document.createElement('div');
      roleRow.className = 'widget-modal-field';
      const roleLabel = document.createElement('label');
      roleLabel.className = 'widget-modal-label';
      roleLabel.textContent = 'Role / title (optional)';
      const roleInput = document.createElement('input');
      roleInput.className = 'widget-modal-input';
      roleInput.type = 'text';
      roleInput.value = working.role || '';
      roleInput.addEventListener('input', function () { working.role = roleInput.value; });
      roleRow.appendChild(roleLabel);
      roleRow.appendChild(roleInput);

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

      body.appendChild(styleRow);
      body.appendChild(quoteRow);
      body.appendChild(attrRow);
      body.appendChild(roleRow);
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

      const quoteField = new RichTextField(quoteMount, working.quote || '');
      requestAnimationFrame(function () { attrInput.focus(); });

      // ── Close helpers ────────────────────────────────────────────────────
      const self = this;

      function close(save) {
        document.removeEventListener('keydown', onKeydown);
        working.quote = quoteField.getHtml();
        quoteField.destroy();
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

  WidgetRegistry.register(QuoteBlot);
})();
