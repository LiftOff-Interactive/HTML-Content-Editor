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
      _v: 1,
      items: [
        { id: 'reveal-1', triggerLabel: 'What is the answer?',   triggerStyle: 'button', content: 'Your revealed content goes here.' },
        { id: 'reveal-2', triggerLabel: 'Click to learn more',   triggerStyle: 'button', content: 'Additional content appears here.' },
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
            '<button class="reveal-trigger ' + styleClass + '" ' +
                'type="button" aria-expanded="false">' +
              '<span class="reveal-trigger-label">' + esc(item.triggerLabel) + '</span>' +
              '<span class="reveal-arrow" aria-hidden="true">▼</span>' +
            '</button>' +
            '<div class="reveal-content" aria-hidden="true">' +
              item.content +
            '</div>' +
          '</div>';
      });

      container.innerHTML =
        '<div class="click-reveal-bar">' +
          '<span class="click-reveal-bar-label">💡 Click &amp; Reveal</span>' +
          '<button class="click-reveal-edit-btn" type="button">✎ Edit</button>' +
        '</div>' +
        '<div class="click-reveal-items">' +
          itemsHtml +
        '</div>';

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
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            btn.click();
          }
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
      const muted   = root.getPropertyValue('--color-text-muted').trim()     || '#64748b';
      const font    = root.getPropertyValue('--font-family-body').trim()     || 'Georgia, serif';
      const radius  = root.getPropertyValue('--widget-border-radius').trim() || '0.5rem';

      // Scoped via data-reveal-item — safe with multiple widgets on the same page
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
            'display:flex;align-items:center;justify-content:space-between;' +
            'width:100%;padding:12px 16px;' +
            'background:' + primary + ';color:#fff;' +
            'border:none;border-radius:' + radius + ';' +
            'font-family:' + font + ';font-size:15px;font-weight:600;' +
            'cursor:pointer;text-align:left;';
        } else if (style === 'label') {
          triggerStyle =
            'display:flex;align-items:center;justify-content:space-between;' +
            'width:100%;padding:10px 4px;' +
            'background:none;border:none;border-bottom:1px solid ' + border + ';' +
            'font-family:' + font + ';font-size:15px;' +
            'color:' + primary + ';text-decoration:underline;' +
            'cursor:pointer;text-align:left;';
        } else {
          // card
          triggerStyle =
            'display:flex;align-items:center;justify-content:space-between;' +
            'width:100%;padding:14px 16px;' +
            'background:' + surface + ';' +
            'border:1px solid ' + border + ';border-radius:' + radius + ';' +
            'font-family:' + font + ';font-size:15px;' +
            'color:' + text + ';' +
            'cursor:pointer;text-align:left;';
        }

        const arrowStyle =
          'display:inline-block;transition:transform 0.3s ease;' +
          'font-size:12px;margin-left:8px;flex-shrink:0;';

        const contentStyle =
          'max-height:0;overflow:hidden;opacity:0;' +
          'transition:max-height 0.35s ease,opacity 0.25s ease;' +
          'font-family:' + font + ';font-size:15px;color:' + text + ';';

        const contentInnerStyle = 'padding:12px 4px 4px;line-height:1.6;';

        itemsHtml +=
          '<div data-reveal-item style="margin-bottom:8px;">' +
            '<button ' +
                'aria-expanded="false" ' +
                'onclick="' + esc(onClickHandler) + '" ' +
                'onkeydown="' + onKeyHandler + '" ' +
                'style="' + triggerStyle + '">' +
              '<span>' + esc(item.triggerLabel) + '</span>' +
              '<span class="hce-cr-arrow" style="' + arrowStyle + '">▼</span>' +
            '</button>' +
            '<div data-reveal-content aria-hidden="true" ' +
                'class="hce-cr-content" ' +
                'style="' + contentStyle + '">' +
              '<div style="' + contentInnerStyle + '">' +
                item.content +
              '</div>' +
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
        '<div style="margin:8px 0;">' +
          itemsHtml +
        '</div>';
    }

    renderExportNoJS(container, data, ctx) {
      const uid = (ctx && ctx.uid) || ('cr' + Math.random().toString(36).slice(2, 7));

      const root    = getComputedStyle(document.documentElement);
      const primary = root.getPropertyValue('--color-primary').trim()        || '#2563eb';
      const border  = root.getPropertyValue('--color-border').trim()         || '#e2e8f0';
      const surface = root.getPropertyValue('--color-surface').trim()        || '#f8fafc';
      const text    = root.getPropertyValue('--color-text').trim()           || '#1e293b';
      const muted   = root.getPropertyValue('--color-text-muted').trim()     || '#64748b';
      const font    = root.getPropertyValue('--font-family-body').trim()     || 'Georgia, serif';
      const radius  = root.getPropertyValue('--widget-border-radius').trim() || '0.5rem';

      let itemsHtml = '';
      (data.items || []).forEach(function (item) {
        const style = item.triggerStyle || 'button';

        let triggerStyle = '';
        if (style === 'button') {
          triggerStyle =
            'display:flex;align-items:center;justify-content:space-between;' +
            'width:100%;padding:12px 16px;' +
            'background:' + primary + ';color:#fff;' +
            'border:none;border-radius:' + radius + ';' +
            'font-family:' + font + ';font-size:15px;font-weight:600;' +
            'cursor:pointer;text-align:left;';
        } else if (style === 'label') {
          triggerStyle =
            'display:flex;align-items:center;justify-content:space-between;' +
            'width:100%;padding:10px 4px;' +
            'background:none;border:none;border-bottom:1px solid ' + border + ';' +
            'font-family:' + font + ';font-size:15px;' +
            'color:' + primary + ';text-decoration:underline;' +
            'cursor:pointer;text-align:left;';
        } else {
          // card
          triggerStyle =
            'display:flex;align-items:center;justify-content:space-between;' +
            'width:100%;padding:14px 16px;' +
            'background:' + surface + ';' +
            'border:1px solid ' + border + ';border-radius:' + radius + ';' +
            'font-family:' + font + ';font-size:15px;' +
            'color:' + text + ';' +
            'cursor:pointer;text-align:left;';
        }

        const arrowStyle =
          'display:inline-block;transition:transform 0.3s ease;' +
          'font-size:12px;margin-left:8px;flex-shrink:0;';

        const contentStyle =
          'font-family:' + font + ';font-size:15px;color:' + text + ';';

        const contentInnerStyle = 'padding:12px 4px 4px;line-height:1.6;';

        // Native <details>/<summary>: independent (non-exclusive) items, no name group.
        // The summary is the visible clickable trigger; content lives inside the
        // <details> after the summary. Native semantics replace aria-expanded flips.
        itemsHtml +=
          '<details class="hce-cr-details" style="margin-bottom:8px;">' +
            '<summary style="' + triggerStyle + '">' +
              '<span>' + esc(item.triggerLabel) + '</span>' +
              '<span class="hce-cr-arrow" style="' + arrowStyle + '">&#9660;</span>' +
            '</summary>' +
            '<div class="hce-cr-content" style="' + contentStyle + '">' +
              '<div style="' + contentInnerStyle + '">' +
                item.content +
              '</div>' +
            '</div>' +
          '</details>';
      });

      container.innerHTML =
        '<div id="' + uid + '">' +
          '<style>' +
            '#' + uid + ' summary{list-style:none;}' +
            '#' + uid + ' summary::-webkit-details-marker{display:none;}' +
            '#' + uid + ' summary{outline:none;}' +
            '#' + uid + ' summary:focus-visible{outline:2px solid ' + primary + ';outline-offset:2px;}' +
            '#' + uid + ' details[open] .hce-cr-arrow{transform:rotate(180deg);}' +
            '@media(prefers-reduced-motion:reduce){#' + uid + ' .hce-cr-arrow{transition:none !important;}}' +
          '</style>' +
          '<div style="margin:8px 0;">' +
            itemsHtml +
          '</div>' +
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
      dialog.setAttribute('aria-labelledby', 'cr-edit-title');
      dialog.style.width = '620px';

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
      body.style.cssText = 'display:flex;flex:1;min-height:0;overflow:hidden;';

      const leftCol = document.createElement('div');
      leftCol.style.cssText =
        'width:160px;flex-shrink:0;border-right:1px solid var(--color-border);' +
        'display:flex;flex-direction:column;';

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
      rightCol.style.cssText =
        'flex:1;padding:16px;display:flex;flex-direction:column;gap:12px;overflow-y:auto;';

      body.appendChild(leftCol);
      body.appendChild(rightCol);

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

      function saveCurrentRichField() {
        if (currentRichField && currentRichFieldIdx >= 0 && currentRichFieldIdx < working.items.length) {
          working.items[currentRichFieldIdx].content = currentRichField.getHtml();
        }
        if (currentRichField) { currentRichField.destroy(); currentRichField = null; }
        currentRichFieldIdx = -1;
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
          labelSpan.style.cssText =
            'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
          labelSpan.textContent = item.triggerLabel || 'Item ' + (idx + 1);

          const upBtn   = makeReorderBtn('▲', isSelected);
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

          if (working.items.length > 1) {
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

        addItemBtn.disabled = working.items.length >= 12;
        addItemBtn.style.opacity = working.items.length >= 12 ? '0.4' : '1';
      }

      function renderRight() {
        saveCurrentRichField();
        rightCol.innerHTML = '';
        const item = working.items[selectedIdx];
        if (!item) return;

        // Trigger label
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

        // Trigger style
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

        // Reveal content
        const contentWrap = document.createElement('div');
        contentWrap.className = 'widget-modal-field';
        contentWrap.style.flex = '1';

        const contentLabel = document.createElement('label');
        contentLabel.className = 'widget-modal-label';
        contentLabel.textContent = 'Reveal content';

        const mount = document.createElement('div');
        currentRichField = new RichTextField(mount, item.content);
        currentRichFieldIdx = selectedIdx;

        contentWrap.appendChild(contentLabel);
        contentWrap.appendChild(mount);

        rightCol.appendChild(labelWrap);
        rightCol.appendChild(styleWrap);
        rightCol.appendChild(contentWrap);

        requestAnimationFrame(function () { labelInput.focus(); });
      }

      addItemBtn.addEventListener('click', function () {
        if (working.items.length >= 12) return;
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
        saveCurrentRichField();
        document.removeEventListener('keydown', onKey);
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
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) close(false);
      });
      document.addEventListener('keydown', onKey);

      renderItemList();
      renderRight();
    }
  }

  WidgetRegistry.register(ClickRevealBlot);
})();
