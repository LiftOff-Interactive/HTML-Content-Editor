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

  class TabsBlot extends BaseWidgetBlot {
    static blotName          = 'tabs';
    static tagName           = 'div';
    static widgetName        = 'tabs';
    static widgetLabel       = 'Tabs';
    static widgetIcon        = '📑';
    static widgetDescription = 'Tabbed content panels';
    static defaultData       = {
      _v: 2,
      widgetAlign: 'left',
      tabs: [
        { id: 'tab-1', label: 'Tab 1', content: '' },
        { id: 'tab-2', label: 'Tab 2', content: '' },
        { id: 'tab-3', label: 'Tab 3', content: '' },
      ],
      activeTab: 'tab-1',
    };

    attach() {
      super.attach();
      if (!this._uid) this._uid = 'tw' + (++_instanceCount);
    }

    renderEditor(container, data) {
      const uid = this._uid || 'tw0';
      const activeId = data.activeTab || data.tabs[0].id;

      let tabBtns = '';
      let panels  = '';

      data.tabs.forEach(function (tab, i) {
        const isActive = tab.id === activeId;
        const panelId  = uid + '-p' + i;
        tabBtns +=
          '<button class="tab-btn' + (isActive ? ' tab-btn--active' : '') + '" ' +
            'role="tab" aria-selected="' + isActive + '" ' +
            'aria-controls="' + panelId + '" ' +
            'data-tab-id="' + esc(tab.id) + '">' +
            esc(tab.label) +
          '</button>';
        panels +=
          '<div class="tab-panel' + (isActive ? ' tab-panel--active' : '') + '" ' +
            'role="tabpanel" id="' + panelId + '">' +
            tab.content +
          '</div>';
      });

      container.innerHTML =
        '<div class="tabs-widget">' +
          '<div class="tabs-bar" role="tablist">' + tabBtns + '</div>' +
          '<div class="tabs-panels">' + panels + '</div>' +
        '</div>';

      const self = this;
      container.querySelectorAll('.tab-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          self.updateData(Object.assign({}, data, { activeTab: btn.dataset.tabId }));
        });
      });
    }

    renderExport(container, data) {
      const uid = 'te' + Math.random().toString(36).slice(2, 7);
      const activeId = data.activeTab || data.tabs[0].id;
      const root = getComputedStyle(document.documentElement);

      const primary  = root.getPropertyValue('--color-primary').trim()        || '#2563eb';
      const border   = root.getPropertyValue('--color-border').trim()         || '#e2e8f0';
      const surface  = root.getPropertyValue('--color-surface').trim()        || '#f8fafc';
      const text     = root.getPropertyValue('--color-text').trim()           || '#1e293b';
      const muted    = root.getPropertyValue('--color-text-muted').trim()     || '#64748b';
      const font     = root.getPropertyValue('--font-family-body').trim()     || 'Georgia, serif';
      const radius   = root.getPropertyValue('--widget-border-radius').trim() || '0.5rem';

      const onclick =
        '(function(btn){' +
          'var g=btn.closest("[data-tabs-id]");' +
          'var id=btn.dataset.tabId;' +
          'g.querySelectorAll("[role=tab]").forEach(function(b){' +
            'var a=b.dataset.tabId===id;' +
            'b.setAttribute("aria-selected",a);' +
            'b.style.borderBottomColor=a?"' + primary + '":"transparent";' +
            'b.style.color=a?"' + primary + '":"' + muted + '";' +
            'b.style.fontWeight=a?"600":"400";' +
          '});' +
          'g.querySelectorAll("[role=tabpanel]").forEach(function(p){' +
            'p.style.display=p.dataset.tabId===id?"block":"none";' +
          '});' +
        '})(this)';

      let tabBtns   = '';
      let tabPanels = '';

      data.tabs.forEach(function (tab) {
        const isActive = tab.id === activeId;
        const btnStyle =
          'padding:8px 16px;border:none;' +
          'border-bottom:2px solid ' + (isActive ? primary : 'transparent') + ';' +
          'background:none;cursor:pointer;' +
          'font-family:' + font + ';font-size:14px;' +
          'font-weight:' + (isActive ? '600' : '400') + ';' +
          'color:' + (isActive ? primary : muted) + ';white-space:nowrap;';
        tabBtns +=
          '<button role="tab" aria-selected="' + isActive + '" ' +
            'data-tab-id="' + esc(tab.id) + '" ' +
            'onclick="' + esc(onclick) + '" ' +
            'style="' + btnStyle + '">' +
            esc(tab.label) +
          '</button>';
        tabPanels +=
          '<div role="tabpanel" data-tab-id="' + esc(tab.id) + '" ' +
            'style="padding:16px;font-family:' + font + ';color:' + text + ';' +
              'display:' + (isActive ? 'block' : 'none') + ';">' +
            tab.content +
          '</div>';
      });

      container.innerHTML =
        '<div data-tabs-id="' + uid + '" style="border:1px solid ' + border + ';border-radius:' + radius + ';overflow:hidden;margin:8px 0;">' +
          '<div role="tablist" style="display:flex;border-bottom:1px solid ' + border + ';background:' + surface + ';overflow-x:auto;">' +
            tabBtns +
          '</div>' +
          '<div>' + tabPanels + '</div>' +
        '</div>';
    }

    edit(data) {
      this._openEditModal(data);
    }

    _openEditModal(data) {
      const self = this;
      const working = JSON.parse(JSON.stringify(data));
      if (!working.widgetAlign) working.widgetAlign = 'left';
      let selectedIdx = 0;
      let contentField = null;

      function flushRichFields() {
        if (contentField) {
          working.tabs[selectedIdx].content = contentField.getHtml();
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
      dialog.setAttribute('aria-labelledby', 'tabs-edit-title');
      dialog.style.width = '580px';

      // Header
      const header = document.createElement('div');
      header.className = 'widget-modal-header';
      const titleEl = document.createElement('span');
      titleEl.id = 'tabs-edit-title';
      titleEl.textContent = 'Edit Tabs';
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

      const tabListEl = document.createElement('div');
      tabListEl.style.cssText = 'flex:1;overflow-y:auto;';

      const addTabBtn = document.createElement('button');
      addTabBtn.type = 'button';
      addTabBtn.textContent = '+ Add Tab';
      addTabBtn.style.cssText =
        'padding:8px 10px;font-size:12px;font-family:var(--font-family-ui);' +
        'border:none;border-top:1px solid var(--color-border);' +
        'background:transparent;cursor:pointer;color:var(--color-primary);text-align:left;';

      leftCol.appendChild(tabListEl);
      leftCol.appendChild(addTabBtn);

      const rightCol = document.createElement('div');
      rightCol.style.cssText = 'flex:1;padding:16px;display:flex;flex-direction:column;gap:12px;overflow-y:auto;';

      body.appendChild(leftCol);
      body.appendChild(rightCol);

      // Widget alignment — full-width section
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

      function renderTabList() {
        tabListEl.innerHTML = '';
        working.tabs.forEach(function (tab, idx) {
          const isSelected = idx === selectedIdx;
          const item = document.createElement('div');
          item.style.cssText =
            'display:flex;align-items:center;padding:7px 10px;cursor:pointer;' +
            'font-size:12px;font-family:var(--font-family-ui);gap:2px;' +
            (isSelected ? 'background:var(--color-primary);color:#fff;' : 'color:var(--color-text);');

          const labelSpan = document.createElement('span');
          labelSpan.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
          labelSpan.textContent = tab.label || 'Tab ' + (idx + 1);

          const upBtn   = makeReorderBtn('▲', isSelected);
          const downBtn = makeReorderBtn('▼', isSelected);

          upBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (idx === 0) return;
            flushRichFields();
            working.tabs.splice(idx - 1, 0, working.tabs.splice(idx, 1)[0]);
            selectedIdx = idx - 1;
            renderTabList();
            renderRight();
          });
          downBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (idx === working.tabs.length - 1) return;
            flushRichFields();
            working.tabs.splice(idx + 1, 0, working.tabs.splice(idx, 1)[0]);
            selectedIdx = idx + 1;
            renderTabList();
            renderRight();
          });

          item.appendChild(labelSpan);
          item.appendChild(upBtn);
          item.appendChild(downBtn);

          if (working.tabs.length > 2) {
            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.textContent = '✕';
            delBtn.style.cssText =
              'background:none;border:none;cursor:pointer;font-size:10px;padding:0 2px;' +
              'color:' + (isSelected ? 'rgba(255,255,255,0.75)' : 'var(--color-text-muted)') + ';';
            delBtn.addEventListener('click', function (e) {
              e.stopPropagation();
              flushRichFields();
              working.tabs.splice(idx, 1);
              if (selectedIdx >= working.tabs.length) selectedIdx = working.tabs.length - 1;
              renderTabList();
              renderRight();
            });
            item.appendChild(delBtn);
          }

          item.addEventListener('click', function () {
            if (idx === selectedIdx) return;
            flushRichFields();
            selectedIdx = idx;
            renderTabList();
            renderRight();
          });
          tabListEl.appendChild(item);
        });

        addTabBtn.disabled = working.tabs.length >= 8;
        addTabBtn.style.opacity = working.tabs.length >= 8 ? '0.4' : '1';
      }

      function renderRight() {
        rightCol.innerHTML = '';
        const tab = working.tabs[selectedIdx];
        if (!tab) return;

        const labelWrap = document.createElement('div');
        labelWrap.className = 'widget-modal-field';
        const labelLabel = document.createElement('label');
        labelLabel.className = 'widget-modal-label';
        labelLabel.textContent = 'Tab label';
        const labelInput = document.createElement('input');
        labelInput.className = 'widget-modal-input';
        labelInput.type = 'text';
        labelInput.value = tab.label;
        labelInput.addEventListener('input', function () {
          working.tabs[selectedIdx].label = labelInput.value;
          renderTabList();
        });
        labelWrap.appendChild(labelLabel);
        labelWrap.appendChild(labelInput);

        const contentWrap = document.createElement('div');
        contentWrap.className = 'widget-modal-field';
        const contentLabel = document.createElement('label');
        contentLabel.className = 'widget-modal-label';
        contentLabel.textContent = 'Content';
        const contentMount = document.createElement('div');
        contentWrap.appendChild(contentLabel);
        contentWrap.appendChild(contentMount);

        rightCol.appendChild(labelWrap);
        rightCol.appendChild(contentWrap);

        contentField = new RichTextField(contentMount, tab.content || '');
        requestAnimationFrame(function () { labelInput.focus(); });
      }

      addTabBtn.addEventListener('click', function () {
        if (working.tabs.length >= 8) return;
        flushRichFields();
        working.tabs.push({ id: 'tab-' + Date.now(), label: 'New Tab', content: '' });
        selectedIdx = working.tabs.length - 1;
        renderTabList();
        renderRight();
      });

      function close(save) {
        document.removeEventListener('keydown', onKey);
        flushRichFields();
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (!save) return;
        const ids = working.tabs.map(function (t) { return t.id; });
        if (!ids.includes(working.activeTab)) working.activeTab = working.tabs[0].id;
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

      renderTabList();
      renderRight();
    }
  }

  WidgetRegistry.register(TabsBlot);
})();
