(function () {
  'use strict';

  let _instanceCount = 0;

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  class AccordionBlot extends BaseWidgetBlot {
    static blotName          = 'accordion';
    static tagName           = 'div';
    static widgetName        = 'accordion';
    static widgetLabel       = 'Accordion';
    static widgetIcon        = '📂';
    static widgetDescription = 'Expandable/collapsible content panels';
    static defaultData       = {
      _v: 1,
      allowMultiple: false,
      items: [
        { id: 'item-1', header: 'Panel 1', content: '', open: false },
        { id: 'item-2', header: 'Panel 2', content: '', open: false },
        { id: 'item-3', header: 'Panel 3', content: '', open: false },
      ],
    };

    attach() {
      super.attach();
      if (!this._uid) this._uid = 'aw' + (++_instanceCount);
    }

    renderEditor(container, data) {
      let html = '<div class="accordion-widget">';
      data.items.forEach(function (item) {
        html +=
          '<details class="accordion-item"' + (item.open ? ' open' : '') +
            ' data-item-id="' + esc(item.id) + '">' +
            '<summary class="accordion-summary">' +
              '<span class="accordion-header-text">' + esc(item.header) + '</span>' +
              '<span class="accordion-chevron" aria-hidden="true">&#9660;</span>' +
            '</summary>' +
            '<div class="accordion-body">' +
              '<div class="accordion-body-inner">' + window.HCESanitize.rich(item.content) + '</div>' +
            '</div>' +
          '</details>';
      });
      html += '</div>';
      container.innerHTML = html;

      // Stop clicks on the summary from bubbling to the base-class click-to-edit handler
      container.querySelectorAll('.accordion-summary').forEach(function (summary) {
        summary.addEventListener('click', function (e) { e.stopPropagation(); });
      });

      // For allowMultiple: false, close other panels when one opens
      if (!data.allowMultiple) {
        container.querySelectorAll('.accordion-item').forEach(function (details) {
          details.addEventListener('toggle', function (e) {
            e.stopPropagation();
            if (!details.open) return;
            container.querySelectorAll('.accordion-item').forEach(function (other) {
              if (other !== details) other.open = false;
            });
          });
        });
      } else {
        container.querySelectorAll('.accordion-item').forEach(function (details) {
          details.addEventListener('toggle', function (e) { e.stopPropagation(); });
        });
      }
    }

    renderExport(container, data) {
      const uid  = 'ae' + Math.random().toString(36).slice(2, 7);
      const root = getComputedStyle(document.documentElement);

      const primary = root.getPropertyValue('--color-primary').trim()        || '#2563eb';
      const border  = root.getPropertyValue('--color-border').trim()         || '#e2e8f0';
      const surface = root.getPropertyValue('--color-surface').trim()        || '#f8fafc';
      const text    = root.getPropertyValue('--color-text').trim()           || '#1e293b';
      const muted   = root.getPropertyValue('--color-text-muted').trim()     || '#64748b';
      const font    = root.getPropertyValue('--font-family-body').trim()     || 'Georgia, serif';
      const radius  = root.getPropertyValue('--widget-border-radius').trim() || '0.5rem';

      // Scoped animation CSS for this accordion instance
      const styles =
        '<style>' +
          '[data-accordion-id="' + uid + '"] .acc-body{' +
            'display:grid;grid-template-rows:0fr;' +
            'transition:grid-template-rows 0.25s ease;' +
          '}' +
          '[data-accordion-id="' + uid + '"] details[open]>.acc-body{' +
            'grid-template-rows:1fr;' +
          '}' +
          '[data-accordion-id="' + uid + '"] .acc-inner{overflow:hidden;}' +
          '[data-accordion-id="' + uid + '"] .acc-chevron{' +
            'display:inline-block;font-size:10px;' +
            'color:' + muted + ';' +
            'transition:transform 0.25s ease,color 0.25s ease;' +
          '}' +
          '[data-accordion-id="' + uid + '"] details[open] .acc-chevron{' +
            'transform:rotate(180deg);color:' + primary + ';' +
          '}' +
          '[data-accordion-id="' + uid + '"] summary{list-style:none;}' +
          '[data-accordion-id="' + uid + '"] summary::-webkit-details-marker{display:none;}' +
        '</style>';

      const sumStyle =
        'display:flex;justify-content:space-between;align-items:center;' +
        'padding:12px 16px;cursor:pointer;user-select:none;list-style:none;' +
        'background:' + surface + ';' +
        'font-family:' + font + ';font-size:14px;font-weight:600;color:' + text + ';';

      const innerStyle =
        'padding:12px 16px;font-family:' + font + ';font-size:14px;' +
        'color:' + muted + ';line-height:1.6;';

      let items = '';
      data.items.forEach(function (item, i) {
        items +=
          '<details' + (item.open ? ' open' : '') + ' style="' +
            'border-top:' + (i === 0 ? '0' : '1px solid ' + border) + ';' +
          '">' +
            '<summary style="' + sumStyle + '">' +
              '<span>' + esc(item.header) + '</span>' +
              '<span class="acc-chevron">&#9660;</span>' +
            '</summary>' +
            '<div class="acc-body">' +
              '<div class="acc-inner" style="' + innerStyle + '">' + window.HCESanitize.rich(item.content) + '</div>' +
            '</div>' +
          '</details>';
      });

      // Script to enforce single-open behavior when allowMultiple is false
      let script = '';
      if (!data.allowMultiple) {
        script =
          '<script>(function(){' +
            'var g=document.querySelector(\'[data-accordion-id="' + uid + '"]\');' +
            'if(!g)return;' +
            'g.querySelectorAll(\'details\').forEach(function(d){' +
              'd.addEventListener(\'toggle\',function(){' +
                'if(!d.open)return;' +
                'g.querySelectorAll(\'details\').forEach(function(o){if(o!==d)o.open=false;});' +
              '});' +
            '});' +
          '})();<\/script>';
      }

      container.innerHTML =
        styles +
        '<div data-accordion-id="' + uid + '" style="' +
          'border:1px solid ' + border + ';' +
          'border-radius:' + radius + ';' +
          'overflow:hidden;margin:8px 0;' +
        '">' +
          items +
        '</div>' +
        script;
    }

    renderExportNoJS(container, data, ctx) {
      const uid  = (ctx && ctx.uid) || ('ae' + Math.random().toString(36).slice(2, 7));
      const root = getComputedStyle(document.documentElement);

      const primary = root.getPropertyValue('--color-primary').trim()        || '#2563eb';
      const border  = root.getPropertyValue('--color-border').trim()         || '#e2e8f0';
      const surface = root.getPropertyValue('--color-surface').trim()        || '#f8fafc';
      const text    = root.getPropertyValue('--color-text').trim()           || '#1e293b';
      const muted   = root.getPropertyValue('--color-text-muted').trim()     || '#64748b';
      const font    = root.getPropertyValue('--font-family-body').trim()     || 'Georgia, serif';
      const radius  = root.getPropertyValue('--widget-border-radius').trim() || '0.5rem';

      // Scoped animation CSS for this accordion instance
      const styles =
        '<style>' +
          '#' + uid + ' .acc-body{' +
            'display:grid;grid-template-rows:0fr;' +
            'transition:grid-template-rows 0.25s ease;' +
          '}' +
          '#' + uid + ' details[open]>.acc-body{' +
            'grid-template-rows:1fr;' +
          '}' +
          '#' + uid + ' .acc-inner{overflow:hidden;}' +
          '#' + uid + ' .acc-chevron{' +
            'display:inline-block;font-size:10px;' +
            'color:' + muted + ';' +
            'transition:transform 0.25s ease,color 0.25s ease;' +
          '}' +
          '#' + uid + ' details[open] .acc-chevron{' +
            'transform:rotate(180deg);color:' + primary + ';' +
          '}' +
          '#' + uid + ' summary{list-style:none;}' +
          '#' + uid + ' summary::-webkit-details-marker{display:none;}' +
        '</style>';

      const sumStyle =
        'display:flex;justify-content:space-between;align-items:center;' +
        'padding:12px 16px;cursor:pointer;user-select:none;list-style:none;' +
        'background:' + surface + ';' +
        'font-family:' + font + ';font-size:14px;font-weight:600;color:' + text + ';';

      const innerStyle =
        'padding:12px 16px;font-family:' + font + ';font-size:14px;' +
        'color:' + muted + ';line-height:1.6;';

      // In single-open mode, the browser enforces exclusivity natively via the
      // shared name attribute (native exclusive-accordion). Only the FIRST open
      // item keeps its open attribute so the initial state is valid.
      const single = !data.allowMultiple;
      const nameAttr = single ? (' name="acc-' + uid + '"') : '';
      let firstOpenUsed = false;

      let items = '';
      data.items.forEach(function (item, i) {
        let openAttr = '';
        if (item.open) {
          if (!single) {
            openAttr = ' open';
          } else if (!firstOpenUsed) {
            openAttr = ' open';
            firstOpenUsed = true;
          }
        }
        items +=
          '<details' + nameAttr + openAttr + ' style="' +
            'border-top:' + (i === 0 ? '0' : '1px solid ' + border) + ';' +
          '">' +
            '<summary style="' + sumStyle + '">' +
              '<span>' + esc(item.header) + '</span>' +
              '<span class="acc-chevron">&#9660;</span>' +
            '</summary>' +
            '<div class="acc-body">' +
              '<div class="acc-inner" style="' + innerStyle + '">' + window.HCESanitize.rich(item.content) + '</div>' +
            '</div>' +
          '</details>';
      });

      container.innerHTML =
        styles +
        '<div id="' + uid + '" data-accordion-id="' + uid + '" style="' +
          'border:1px solid ' + border + ';' +
          'border-radius:' + radius + ';' +
          'overflow:hidden;margin:8px 0;' +
        '">' +
          items +
        '</div>';
    }

    edit(data) {
      this._openEditModal(data);
    }

    _openEditModal(data) {
      const self = this;
      const working = JSON.parse(JSON.stringify(data));
      let selectedIdx = 0;
      let currentRichField = null;
      let currentRichFieldIdx = -1;

      const overlay = document.createElement('div');
      overlay.className = 'widget-modal-overlay';

      const dialog = document.createElement('div');
      dialog.className = 'widget-modal';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-labelledby', 'accordion-edit-title');
      dialog.style.width = '580px';

      // Header
      const header = document.createElement('div');
      header.className = 'widget-modal-header';
      const titleEl = document.createElement('span');
      titleEl.id = 'accordion-edit-title';
      titleEl.textContent = 'Edit Accordion';
      const closeX = document.createElement('button');
      closeX.className = 'widget-modal-close';
      closeX.type = 'button';
      closeX.setAttribute('aria-label', 'Close');
      closeX.innerHTML = '&times;';
      header.appendChild(titleEl);
      header.appendChild(closeX);

      // Options bar — allowMultiple toggle
      const optionsBar = document.createElement('div');
      optionsBar.style.cssText =
        'padding:10px 16px;border-bottom:1px solid var(--color-border);' +
        'display:flex;align-items:center;';
      const multiLabel = document.createElement('label');
      multiLabel.style.cssText =
        'display:flex;align-items:center;gap:6px;font-size:13px;' +
        'font-family:var(--font-family-ui);color:var(--color-text);cursor:pointer;';
      const multiCheck = document.createElement('input');
      multiCheck.type = 'checkbox';
      multiCheck.checked = working.allowMultiple;
      multiCheck.addEventListener('change', function () {
        working.allowMultiple = multiCheck.checked;
      });
      multiLabel.appendChild(multiCheck);
      multiLabel.appendChild(document.createTextNode('Allow multiple panels open at once'));
      optionsBar.appendChild(multiLabel);

      // Two-column body. flex:1 + min-height:0 is load-bearing: it lets the body
      // shrink inside the dialog's max-height so the footer is never pushed out.
      const body = document.createElement('div');
      body.style.cssText = 'display:flex;flex:1;min-height:0;overflow:hidden;';

      const leftCol = document.createElement('div');
      leftCol.style.cssText =
        'width:160px;flex-shrink:0;border-right:1px solid var(--color-border);' +
        'display:flex;flex-direction:column;';

      const itemListEl = document.createElement('div');
      itemListEl.style.cssText = 'flex:1;overflow-y:auto;';

      const addItemBtn = document.createElement('button');
      addItemBtn.type = 'button';
      addItemBtn.textContent = '+ Add Panel';
      addItemBtn.style.cssText =
        'padding:8px 10px;font-size:12px;font-family:var(--font-family-ui);' +
        'border:none;border-top:1px solid var(--color-border);' +
        'background:transparent;cursor:pointer;color:var(--color-primary);text-align:left;';

      leftCol.appendChild(itemListEl);
      leftCol.appendChild(addItemBtn);

      const rightCol = document.createElement('div');
      rightCol.style.cssText = 'flex:1;padding:16px;display:flex;flex-direction:column;gap:12px;overflow-y:auto;';

      body.appendChild(leftCol);
      body.appendChild(rightCol);

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
      dialog.appendChild(optionsBar);
      dialog.appendChild(body);
      dialog.appendChild(footer);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      function saveCurrentRichField() {
        if (currentRichField && currentRichFieldIdx >= 0 && currentRichFieldIdx < working.items.length) {
          working.items[currentRichFieldIdx].content = currentRichField.getHtml();
        }
        if (currentRichField) { currentRichField.destroy(); currentRichField = null; }
        currentRichFieldIdx = -1;
      }

      function renderItemList() {
        itemListEl.innerHTML = '';
        working.items.forEach(function (item, idx) {
          const isSelected = idx === selectedIdx;
          const row = document.createElement('div');
          row.style.cssText =
            'display:flex;align-items:center;padding:7px 10px;cursor:pointer;' +
            'font-size:12px;font-family:var(--font-family-ui);gap:2px;' +
            (isSelected
              ? 'background:var(--color-primary);color:#fff;'
              : 'color:var(--color-text);');

          const labelSpan = document.createElement('span');
          labelSpan.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
          labelSpan.textContent = item.header || 'Panel ' + (idx + 1);

          const upBtn = makeReorderBtn('▲', isSelected);
          const downBtn = makeReorderBtn('▼', isSelected);

          upBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (idx === 0) return;
            working.items.splice(idx - 1, 0, working.items.splice(idx, 1)[0]);
            selectedIdx = idx - 1;
            renderItemList();
            renderRight();
          });
          downBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (idx === working.items.length - 1) return;
            working.items.splice(idx + 1, 0, working.items.splice(idx, 1)[0]);
            selectedIdx = idx + 1;
            renderItemList();
            renderRight();
          });

          row.appendChild(labelSpan);
          row.appendChild(upBtn);
          row.appendChild(downBtn);

          if (working.items.length > 2) {
            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.textContent = '✕';
            delBtn.style.cssText =
              'background:none;border:none;cursor:pointer;font-size:10px;padding:0 2px;' +
              'color:' + (isSelected ? 'rgba(255,255,255,0.75)' : 'var(--color-text-muted)') + ';';
            delBtn.addEventListener('click', function (e) {
              e.stopPropagation();
              working.items.splice(idx, 1);
              if (selectedIdx >= working.items.length) selectedIdx = working.items.length - 1;
              renderItemList();
              renderRight();
            });
            row.appendChild(delBtn);
          }

          row.addEventListener('click', function () {
            selectedIdx = idx;
            renderItemList();
            renderRight();
          });
          itemListEl.appendChild(row);
        });

        addItemBtn.disabled = working.items.length >= 8;
        addItemBtn.style.opacity = working.items.length >= 8 ? '0.4' : '1';
      }

      function makeReorderBtn(symbol, isSelected) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = symbol;
        btn.style.cssText =
          'background:none;border:none;cursor:pointer;font-size:9px;padding:0 1px;line-height:1;' +
          'color:' + (isSelected ? 'rgba(255,255,255,0.75)' : 'var(--color-text-muted)') + ';';
        return btn;
      }

      function renderRight() {
        saveCurrentRichField();
        rightCol.innerHTML = '';
        const item = working.items[selectedIdx];
        if (!item) return;

        const headerWrap = document.createElement('div');
        headerWrap.className = 'widget-modal-field';
        const headerLabel = document.createElement('label');
        headerLabel.className = 'widget-modal-label';
        headerLabel.textContent = 'Panel header';
        const headerInput = document.createElement('input');
        headerInput.className = 'widget-modal-input';
        headerInput.type = 'text';
        headerInput.value = item.header;
        headerInput.addEventListener('input', function () {
          working.items[selectedIdx].header = headerInput.value;
          renderItemList();
        });
        headerWrap.appendChild(headerLabel);
        headerWrap.appendChild(headerInput);

        const contentWrap = document.createElement('div');
        contentWrap.className = 'widget-modal-field';
        contentWrap.style.flex = '1';

        const contentLabel = document.createElement('label');
        contentLabel.className = 'widget-modal-label';
        contentLabel.textContent = 'Content';

        const mount = document.createElement('div');
        currentRichField = new RichTextField(mount, item.content);
        currentRichFieldIdx = selectedIdx;

        contentWrap.appendChild(contentLabel);
        contentWrap.appendChild(mount);

        rightCol.appendChild(headerWrap);
        rightCol.appendChild(contentWrap);
        requestAnimationFrame(function () { headerInput.focus(); });
      }

      addItemBtn.addEventListener('click', function () {
        if (working.items.length >= 8) return;
        working.items.push({ id: 'item-' + Date.now(), header: 'New Panel', content: '', open: false });
        selectedIdx = working.items.length - 1;
        renderItemList();
        renderRight();
      });

      function close(save) {
        saveCurrentRichField();
        document.removeEventListener('keydown', onKey);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (!save) return;
        self.updateData(working);
      }

      function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); close(false); }
      }

      closeX.addEventListener('click', function () { close(false); });
      cancelBtn.addEventListener('click', function () { close(false); });
      saveBtn.addEventListener('click', function () { close(true); });
      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(false); });
      document.addEventListener('keydown', onKey);

      renderItemList();
      renderRight();
    }
  }

  WidgetRegistry.register(AccordionBlot);
})();
