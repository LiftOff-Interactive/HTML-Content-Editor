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

  class ClickRevealBlot extends BaseWidgetBlot {
    static blotName          = 'click-reveal';
    static tagName           = 'div';
    static widgetName        = 'click-reveal';
    static widgetLabel       = 'Click & Reveal';
    static widgetIcon        = '💡';
    static widgetDescription = 'Content hidden behind a clickable trigger';
    static defaultData       = {
      _v: 2,
      widgetAlign: 'left',
      items: [
        { id: 'reveal-1', triggerLabel: 'What is the answer?', triggerStyle: 'button', content: 'Your revealed content goes here.' },
        { id: 'reveal-2', triggerLabel: 'Click to learn more',  triggerStyle: 'button', content: 'Additional content appears here.' },
      ],
    };

    attach() {
      super.attach();
      if (!this._uid) this._uid = 'cr' + (++_instanceCount);
    }

    renderEditor(container, data) {
      const self = this;

      let itemsHtml = '';
      data.items.forEach(function (item) {
        const styleClass = 'reveal-trigger--' + (item.triggerStyle || 'button');
        itemsHtml +=
          '<div class="reveal-item" data-reveal-id="' + esc(item.id) + '">' +
            '<button class="reveal-trigger ' + styleClass + '" type="button" aria-expanded="false">' +
              '<span class="reveal-trigger-label">' + esc(item.triggerLabel) + '</span>' +
              '<span class="reveal-arrow" aria-hidden="true">▼</span>' +
            '</button>' +
            '<div class="reveal-content" aria-hidden="true">' +
              '<div class="reveal-content-inner">' + item.content + '</div>' +
            '</div>' +
          '</div>';
      });

      container.innerHTML =
        '<div class="click-reveal-bar">' +
          '<span class="click-reveal-bar-label">💡 Click &amp; Reveal</span>' +
          '<button class="click-reveal-edit-btn" type="button">✎ Edit</button>' +
        '</div>' +
        '<div class="click-reveal-items">' + itemsHtml + '</div>';

      container.querySelectorAll('.reveal-trigger').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          const item = btn.closest('.reveal-item');
          const revealed = item.classList.toggle('is-revealed');
          btn.setAttribute('aria-expanded', revealed ? 'true' : 'false');
          const panel = item.querySelector('.reveal-content');
          panel.setAttribute('aria-hidden', revealed ? 'false' : 'true');
        });
        btn.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
        });
      });

      container.querySelector('.click-reveal-edit-btn').addEventListener('click', function (e) {
        e.stopPropagation();
        self.edit(self.constructor.value(self.domNode));
      });
    }

    renderExport(container, data) {
      const root    = getComputedStyle(document.documentElement);
      const primary = root.getPropertyValue('--color-primary').trim()        || '#2563eb';
      const border  = root.getPropertyValue('--color-border').trim()         || '#e2e8f0';
      const surface = root.getPropertyValue('--color-surface').trim()        || '#f8fafc';
      const text    = root.getPropertyValue('--color-text').trim()           || '#1e293b';
      const font    = root.getPropertyValue('--font-family-body').trim()     || 'Georgia, serif';
      const radius  = root.getPropertyValue('--widget-border-radius').trim() || '0.5rem';

      const onClickHandler =
        '(function(btn){' +
          'var item=btn.closest("[data-reveal-item]");' +
          'var revealed=item.classList.toggle("is-revealed");' +
          'btn.setAttribute("aria-expanded",revealed?"true":"false");' +
          'var panel=item.querySelector("[data-reveal-content]");' +
          'if(panel)panel.setAttribute("aria-hidden",revealed?"false":"true");' +
        '})(this)';

      const onKeyHandler =
        'if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();this.click()}';

      let itemsHtml = '';
      data.items.forEach(function (item) {
        const style = item.triggerStyle || 'button';

        let triggerStyle = '';
        if (style === 'button') {
          triggerStyle =
            'display:flex;align-items:center;justify-content:space-between;width:100%;padding:12px 16px;' +
            'background:' + primary + ';color:#fff;border:none;border-radius:' + radius + ';' +
            'font-family:' + font + ';font-size:15px;font-weight:600;cursor:pointer;text-align:left;';
        } else if (style === 'label') {
          triggerStyle =
            'display:flex;align-items:center;justify-content:space-between;width:100%;padding:10px 4px;' +
            'background:none;border:none;border-bottom:1px solid ' + border + ';font-family:' + font + ';' +
            'font-size:15px;color:' + primary + ';text-decoration:underline;cursor:pointer;text-align:left;';
        } else {
          triggerStyle =
            'display:flex;align-items:center;justify-content:space-between;width:100%;padding:14px 16px;' +
            'background:' + surface + ';border:1px solid ' + border + ';border-radius:' + radius + ';' +
            'font-family:' + font + ';font-size:15px;color:' + text + ';cursor:pointer;text-align:left;';
        }

        const arrowStyle = 'display:inline-block;transition:transform 0.3s ease;font-size:12px;margin-left:8px;flex-shrink:0;';
        const contentStyle = 'max-height:0;overflow:hidden;opacity:0;transition:max-height 0.35s ease,opacity 0.25s ease;font-family:' + font + ';font-size:15px;color:' + text + ';';
        const contentInnerStyle = 'padding:12px 4px 4px;line-height:1.6;';

        itemsHtml +=
          '<div data-reveal-item style="margin-bottom:8px;">' +
            '<button aria-expanded="false" ' +
                'onclick="' + esc(onClickHandler) + '" ' +
                'onkeydown="' + onKeyHandler + '" ' +
                'style="' + triggerStyle + '">' +
              '<span>' + esc(item.triggerLabel) + '</span>' +
              '<span class="hce-cr-arrow" style="' + arrowStyle + '">▼</span>' +
            '</button>' +
            '<div data-reveal-content aria-hidden="true" class="hce-cr-content" style="' + contentStyle + '">' +
              '<div style="' + contentInnerStyle + '">' + item.content + '</div>' +
            '</div>' +
          '</div>';
      });

      container.innerHTML =
        '<style>' +
          '.hce-cr-content{max-height:0;overflow:hidden;opacity:0;transition:max-height .35s ease,opacity .25s ease;}' +
          '[data-reveal-item].is-revealed .hce-cr-content{max-height:800px;opacity:1;}' +
          '[data-reveal-item].is-revealed .hce-cr-arrow{transform:rotate(180deg);}' +
          '@media(prefers-reduced-motion:reduce){.hce-cr-content,.hce-cr-arrow{transition:none !important;}}' +
        '</style>' +
        '<div style="margin:8px 0;">' + itemsHtml + '</div>';
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
      dialog.setAttribute('aria-labelledby', 'cr-edit-title');
      dialog.style.width = '580px';

      const header = document.createElement('div');
      header.className = 'widget-modal-header';
      const titleEl = document.createElement('span');
      titleEl.id = 'cr-edit-title';
      titleEl.textContent = 'Edit Click & Reveal';
      const closeX = document.createElement('button');
      closeX.className = 'widget-modal-close';
      closeX.type = 'button';
      closeX.setAttribute('aria-label', 'Close');
      closeX.innerHTML = '&times;';
      header.appendChild(titleEl);
      header.appendChild(closeX);

      const body = document.createElement('div');
      body.style.cssText = 'display:flex;min-height:320px;';

      const leftCol = document.createElement('div');
      leftCol.style.cssText =
        'width:160px;flex-shrink:0;border-right:1px solid var(--color-border);display:flex;flex-direction:column;';

      const itemListEl = document.createElement('div');
      itemListEl.style.cssText = 'flex:1;overflow-y:auto;';

      const addItemBtn = document.createElement('button');
      addItemBtn.type = 'button';
      addItemBtn.textContent = '+ Add Item';
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

      // Widget alignment section
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
            (isSelected ? 'background:var(--color-primary);color:#fff;' : 'color:var(--color-text);');

          const labelSpan = document.createElement('span');
          labelSpan.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
          labelSpan.textContent = item.triggerLabel || 'Item ' + (idx + 1);

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

          if (working.items.length > 1) {
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

        addItemBtn.disabled = working.items.length >= 12;
        addItemBtn.style.opacity = working.items.length >= 12 ? '0.4' : '1';
      }

      function renderRight() {
        rightCol.innerHTML = '';
        const item = working.items[selectedIdx];
        if (!item) return;

        const labelWrap = document.createElement('div');
        labelWrap.className = 'widget-modal-field';
        const labelLabel = document.createElement('label');
        labelLabel.className = 'widget-modal-label';
        labelLabel.textContent = 'Trigger label';
        const labelInput = document.createElement('input');
        labelInput.className = 'widget-modal-input';
        labelInput.type = 'text';
        labelInput.value = item.triggerLabel;
        labelInput.addEventListener('input', function () {
          working.items[selectedIdx].triggerLabel = labelInput.value;
          renderItemList();
        });
        labelWrap.appendChild(labelLabel);
        labelWrap.appendChild(labelInput);

        const styleWrap = document.createElement('div');
        styleWrap.className = 'widget-modal-field';
        const styleLabel = document.createElement('label');
        styleLabel.className = 'widget-modal-label';
        styleLabel.textContent = 'Trigger style';
        const styleSelect = document.createElement('select');
        styleSelect.className = 'widget-modal-input';
        [
          { value: 'button', label: 'Button (filled)' },
          { value: 'label',  label: 'Label (text link)' },
          { value: 'card',   label: 'Card (outlined panel)' },
        ].forEach(function (opt) {
          const el = document.createElement('option');
          el.value = opt.value;
          el.textContent = opt.label;
          el.selected = item.triggerStyle === opt.value;
          styleSelect.appendChild(el);
        });
        styleSelect.addEventListener('change', function () {
          working.items[selectedIdx].triggerStyle = styleSelect.value;
        });
        styleWrap.appendChild(styleLabel);
        styleWrap.appendChild(styleSelect);

        const contentWrap = document.createElement('div');
        contentWrap.className = 'widget-modal-field';
        const contentLabel = document.createElement('label');
        contentLabel.className = 'widget-modal-label';
        contentLabel.textContent = 'Reveal content';
        const contentMount = document.createElement('div');
        contentWrap.appendChild(contentLabel);
        contentWrap.appendChild(contentMount);

        rightCol.appendChild(labelWrap);
        rightCol.appendChild(styleWrap);
        rightCol.appendChild(contentWrap);

        contentField = new RichTextField(contentMount, item.content || '');
        requestAnimationFrame(function () { labelInput.focus(); });
      }

      addItemBtn.addEventListener('click', function () {
        if (working.items.length >= 12) return;
        flushRichFields();
        working.items.push({
          id: 'reveal-' + Date.now(),
          triggerLabel: 'New item',
          triggerStyle: 'button',
          content: '',
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

      closeX.addEventListener('click',   function () { close(false); });
      cancelBtn.addEventListener('click', function () { close(false); });
      saveBtn.addEventListener('click',   function () { close(true); });
      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(false); });
      document.addEventListener('keydown', onKey);

      renderItemList();
      renderRight();
    }
  }

  WidgetRegistry.register(ClickRevealBlot);
})();
