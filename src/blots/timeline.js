(function () {
  'use strict';

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  class TimelineBlot extends BaseWidgetBlot {
    static blotName          = 'timeline';
    static tagName           = 'div';
    static widgetName        = 'timeline';
    static widgetLabel       = 'Timeline';
    static widgetIcon        = '↓';
    static widgetDescription = 'A linear sequence of events or steps';
    static defaultData       = {
      _v: 2,
      widgetAlign: 'left',
      items: [
        { id: 'step-1', date: 'Step 1', title: 'Define the Problem',   content: 'Description of the first step.',  icon: '1' },
        { id: 'step-2', date: 'Step 2', title: 'Research Solutions',   content: 'Description of the second step.', icon: '2' },
        { id: 'step-3', date: 'Step 3', title: 'Implement',            content: 'Description of the third step.',  icon: '3' },
      ],
    };

    renderEditor(container, data) {
      let html = '<div class="timeline-widget">';
      data.items.forEach(function (item, i) {
        const isLast = i === data.items.length - 1;
        html +=
          '<div class="timeline-item">' +
            '<div class="timeline-dot">' + esc(item.icon || String(i + 1)) + '</div>' +
            (!isLast ? '<div class="timeline-line"></div>' : '') +
            (item.date    ? '<div class="timeline-date">'    + esc(item.date)    + '</div>' : '') +
            (item.title   ? '<div class="timeline-title">'   + esc(item.title)   + '</div>' : '') +
            (item.content ? '<div class="timeline-content">' + item.content      + '</div>' : '') +
          '</div>';
      });
      html += '</div>';
      container.innerHTML = html;
    }

    renderExport(container, data) {
      const root    = getComputedStyle(document.documentElement);
      const primary = root.getPropertyValue('--color-primary').trim()    || '#2563eb';
      const border  = root.getPropertyValue('--color-border').trim()     || '#e2e8f0';
      const text    = root.getPropertyValue('--color-text').trim()       || '#1e293b';
      const muted   = root.getPropertyValue('--color-text-muted').trim() || '#64748b';
      const font    = root.getPropertyValue('--font-family-body').trim() || 'Georgia, serif';
      const uiFont  = root.getPropertyValue('--font-family-ui').trim()   || 'system-ui, sans-serif';

      const dotStyle =
        'position:absolute;left:0;top:4px;width:28px;height:28px;border-radius:50%;' +
        'background:' + primary + ';display:flex;align-items:center;justify-content:center;' +
        'color:#fff;font-size:11px;font-weight:700;font-family:' + uiFont + ';';

      const lineStyle =
        'position:absolute;left:13px;top:32px;bottom:0;width:2px;background:' + border + ';';

      let items = '';
      data.items.forEach(function (item, i) {
        const isLast = i === data.items.length - 1;
        items +=
          '<li style="position:relative;padding-left:54px;padding-bottom:' + (isLast ? '0' : '24px') + ';">' +
            '<div style="' + dotStyle + '">' + esc(item.icon || String(i + 1)) + '</div>' +
            (!isLast ? '<div style="' + lineStyle + '"></div>' : '') +
            (item.date  ? '<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:' + primary + ';font-family:' + uiFont + ';margin-bottom:2px;">' + esc(item.date) + '</div>' : '') +
            (item.title ? '<div style="font-size:14px;font-weight:600;color:' + text + ';font-family:' + font + ';margin-bottom:4px;">' + esc(item.title) + '</div>' : '') +
            (item.content ? '<div style="font-size:13px;color:' + muted + ';font-family:' + font + ';line-height:1.6;">' + item.content + '</div>' : '') +
          '</li>';
      });

      container.innerHTML =
        '<ol style="list-style:none;padding:8px 0;margin:0;">' + items + '</ol>';
    }

    edit(data) {
      this._openEditModal(data);
    }

    _openEditModal(data) {
      const self = this;
      const working = JSON.parse(JSON.stringify(data));
      if (!working.widgetAlign) working.widgetAlign = 'left';
      let selectedIdx = 0;
      let contentField = null;   // active lazy RichTextField

      function flushRichFields() {
        if (contentField) {
          working.items[selectedIdx].content = contentField.getHtml();
          contentField.destroy();
          contentField = null;
        }
      }

      const overlay = document.createElement('div');
      overlay.className = 'widget-modal-overlay';

      const dialog = document.createElement('div');
      dialog.className = 'widget-modal';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-labelledby', 'timeline-edit-title');
      dialog.style.width = '580px';

      // Header
      const header = document.createElement('div');
      header.className = 'widget-modal-header';
      const titleEl = document.createElement('span');
      titleEl.id = 'timeline-edit-title';
      titleEl.textContent = 'Edit Timeline';
      const closeX = document.createElement('button');
      closeX.className = 'widget-modal-close';
      closeX.type = 'button';
      closeX.setAttribute('aria-label', 'Close');
      closeX.innerHTML = '&times;';
      header.appendChild(titleEl);
      header.appendChild(closeX);

      // Two-column body
      const body = document.createElement('div');
      body.style.cssText = 'display:flex;min-height:300px;';

      const leftCol = document.createElement('div');
      leftCol.style.cssText =
        'width:160px;flex-shrink:0;border-right:1px solid var(--color-border);display:flex;flex-direction:column;';

      const itemListEl = document.createElement('div');
      itemListEl.style.cssText = 'flex:1;overflow-y:auto;';

      const addItemBtn = document.createElement('button');
      addItemBtn.type = 'button';
      addItemBtn.textContent = '+ Add Step';
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

      // Widget alignment — spans full width below the two-column area
      const alignSection = document.createElement('div');
      alignSection.style.cssText =
        'padding:10px 16px;border-top:1px solid var(--color-border);display:flex;flex-direction:column;gap:6px;';
      const alignLabel = document.createElement('label');
      alignLabel.className = 'widget-modal-label';
      alignLabel.textContent = 'Widget Alignment';
      alignSection.appendChild(alignLabel);
      alignSection.appendChild(WidgetModal.makeAlignRow(working.widgetAlign, function (v) {
        working.widgetAlign = v;
      }));

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
      dialog.appendChild(alignSection);
      dialog.appendChild(footer);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      function makeReorderBtn(symbol, isSelected) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = symbol;
        btn.style.cssText =
          'background:none;border:none;cursor:pointer;font-size:9px;padding:0 1px;line-height:1;' +
          'color:' + (isSelected ? 'rgba(255,255,255,0.75)' : 'var(--color-text-muted)') + ';';
        return btn;
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
          labelSpan.textContent = item.title || item.date || 'Step ' + (idx + 1);

          const upBtn   = makeReorderBtn('▲', isSelected);
          const downBtn = makeReorderBtn('▼', isSelected);

          upBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (idx === 0) return;
            flushRichFields();
            working.items.splice(idx - 1, 0, working.items.splice(idx, 1)[0]);
            selectedIdx = idx - 1;
            renderItemList();
            renderRight();
          });
          downBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (idx === working.items.length - 1) return;
            flushRichFields();
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
              flushRichFields();
              working.items.splice(idx, 1);
              if (selectedIdx >= working.items.length) selectedIdx = working.items.length - 1;
              renderItemList();
              renderRight();
            });
            row.appendChild(delBtn);
          }

          row.addEventListener('click', function () {
            if (idx === selectedIdx) return;
            flushRichFields();
            selectedIdx = idx;
            renderItemList();
            renderRight();
          });
          itemListEl.appendChild(row);
        });

        addItemBtn.disabled = working.items.length >= 8;
        addItemBtn.style.opacity = working.items.length >= 8 ? '0.4' : '1';
      }

      function makeField(labelText, el) {
        const wrap = document.createElement('div');
        wrap.className = 'widget-modal-field';
        const lbl = document.createElement('label');
        lbl.className = 'widget-modal-label';
        lbl.textContent = labelText;
        wrap.appendChild(lbl);
        wrap.appendChild(el);
        return wrap;
      }

      function renderRight() {
        rightCol.innerHTML = '';
        const item = working.items[selectedIdx];
        if (!item) return;

        const topRow = document.createElement('div');
        topRow.style.cssText = 'display:flex;gap:10px;';

        const iconInput = document.createElement('input');
        iconInput.className = 'widget-modal-input';
        iconInput.type = 'text';
        iconInput.maxLength = 2;
        iconInput.value = item.icon;
        iconInput.style.cssText = 'width:52px;text-align:center;';
        iconInput.addEventListener('input', function () {
          working.items[selectedIdx].icon = iconInput.value;
        });

        const dateInput = document.createElement('input');
        dateInput.className = 'widget-modal-input';
        dateInput.type = 'text';
        dateInput.value = item.date;
        dateInput.style.flex = '1';
        dateInput.addEventListener('input', function () {
          working.items[selectedIdx].date = dateInput.value;
          renderItemList();
        });

        const iconWrap = document.createElement('div');
        iconWrap.className = 'widget-modal-field';
        const iconLbl = document.createElement('label');
        iconLbl.className = 'widget-modal-label';
        iconLbl.textContent = 'Icon';
        iconWrap.appendChild(iconLbl);
        iconWrap.appendChild(iconInput);

        const dateWrap = document.createElement('div');
        dateWrap.className = 'widget-modal-field';
        dateWrap.style.flex = '1';
        const dateLbl = document.createElement('label');
        dateLbl.className = 'widget-modal-label';
        dateLbl.textContent = 'Date / label';
        dateWrap.appendChild(dateLbl);
        dateWrap.appendChild(dateInput);

        topRow.appendChild(iconWrap);
        topRow.appendChild(dateWrap);

        const titleInput = document.createElement('input');
        titleInput.className = 'widget-modal-input';
        titleInput.type = 'text';
        titleInput.value = item.title;
        titleInput.addEventListener('input', function () {
          working.items[selectedIdx].title = titleInput.value;
          renderItemList();
        });

        // Rich text content field
        const contentMount = document.createElement('div');
        const contentWrap = document.createElement('div');
        contentWrap.className = 'widget-modal-field';
        const contentLbl = document.createElement('label');
        contentLbl.className = 'widget-modal-label';
        contentLbl.textContent = 'Content';
        contentWrap.appendChild(contentLbl);
        contentWrap.appendChild(contentMount);

        rightCol.appendChild(topRow);
        rightCol.appendChild(makeField('Title', titleInput));
        rightCol.appendChild(contentWrap);

        contentField = new RichTextField(contentMount, item.content || '');
        requestAnimationFrame(function () { titleInput.focus(); });
      }

      addItemBtn.addEventListener('click', function () {
        if (working.items.length >= 8) return;
        flushRichFields();
        const n = working.items.length + 1;
        working.items.push({
          id: 'step-' + Date.now(),
          date: 'Step ' + n,
          title: 'New Step',
          content: '',
          icon: String(n),
        });
        selectedIdx = working.items.length - 1;
        renderItemList();
        renderRight();
      });

      function close(save) {
        document.removeEventListener('keydown', onKey);
        flushRichFields();
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

  WidgetRegistry.register(TimelineBlot);
})();
