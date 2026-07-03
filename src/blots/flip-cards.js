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

  class FlipCardsBlot extends BaseWidgetBlot {
    static blotName          = 'flip-cards';
    static tagName           = 'div';
    static widgetName        = 'flip-cards';
    static widgetLabel       = 'Flip Cards';
    static widgetIcon        = '🃏';
    static widgetDescription = 'Cards that flip on click to reveal a back face';
    static defaultData       = {
      _v: 1,
      cards: [
        { id: 'card-1', front: 'What is HTML?',       frontBody: '', back: 'HyperText Markup Language — the structure of web pages.',    backBody: '', frontImage: null, frontImageWidth: '100%' },
        { id: 'card-2', front: 'What is CSS?',        frontBody: '', back: 'Cascading Style Sheets — controls presentation and layout.', backBody: '', frontImage: null, frontImageWidth: '100%' },
        { id: 'card-3', front: 'What is JavaScript?', frontBody: '', back: 'A scripting language that adds interactivity to web pages.', backBody: '', frontImage: null, frontImageWidth: '100%' },
        { id: 'card-4', front: 'What is a Blot?',     frontBody: '', back: 'A Quill content node — the building block of the editor.',  backBody: '', frontImage: null, frontImageWidth: '100%' },
      ],
      columns: 3,
    };

    attach() {
      super.attach();
      if (!this._uid) this._uid = 'fc' + (++_instanceCount);
    }

    renderEditor(container, data) {
      const cols = data.columns || 3;
      const self = this;

      let cardsHtml = '';
      data.cards.forEach(function (card) {
        let imgHtml = '';
        if (card.frontImage) {
          const w = card.frontImageWidth && card.frontImageWidth !== '100%'
            ? 'width:' + card.frontImageWidth + ';'
            : 'width:100%;';
          imgHtml =
            '<img src="' + card.frontImage + '" class="flip-card-img" alt="" ' +
                'style="' + w + 'height:auto;object-fit:contain;display:block;' +
                'max-width:100%;margin:0 auto 4px;">';
        }
        cardsHtml +=
          '<div class="flip-card-item" tabindex="0" role="button" ' +
              'aria-label="Front: ' + esc(card.front) + '" ' +
              'data-card-id="' + esc(card.id) + '" ' +
              'data-front="' + esc(card.front) + '" ' +
              'data-back="' + esc(card.back) + '">' +
            '<div class="flip-card-inner">' +
              '<div class="flip-card-front">' +
                imgHtml +
                '<div class="flip-card-front-text">' + esc(card.front) + '</div>' +
                (card.frontBody ? '<div class="flip-card-front-body">' + card.frontBody + '</div>' : '') +
              '</div>' +
              '<div class="flip-card-back">' +
                '<div class="flip-card-back-text">' + esc(card.back) + '</div>' +
                (card.backBody ? '<div class="flip-card-back-body">' + card.backBody + '</div>' : '') +
              '</div>' +
            '</div>' +
          '</div>';
      });

      container.innerHTML =
        '<div class="flip-cards-bar">' +
          '<span class="flip-cards-bar-label">🃏 Flip Cards</span>' +
          '<button class="flip-cards-edit-btn" type="button">✎ Edit</button>' +
        '</div>' +
        '<div class="flip-cards-grid" style="--flip-cols:' + cols + '">' +
          cardsHtml +
        '</div>';

      container.querySelectorAll('.flip-card-item').forEach(function (cardEl) {
        cardEl.addEventListener('click', function (e) {
          e.stopPropagation();
          cardEl.classList.toggle('is-flipped');
          cardEl.setAttribute('aria-label',
            (cardEl.classList.contains('is-flipped') ? 'Back: ' : 'Front: ') +
            (cardEl.classList.contains('is-flipped') ? (cardEl.dataset.back || '') : (cardEl.dataset.front || ''))
          );
        });
        cardEl.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            cardEl.click();
          }
        });
      });

      container.querySelector('.flip-cards-edit-btn').addEventListener('click', function (e) {
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
      const cols    = data.columns || 3;

      const onClickHandler =
        '(function(el){' +
          'el.classList.toggle("is-flipped");' +
          'el.setAttribute("aria-label",' +
            'el.classList.contains("is-flipped")' +
            '?"Back: "+el.dataset.back' +
            ':"Front: "+el.dataset.front);' +
        '})(this)';

      const onKeyHandler =
        'if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();this.click()}';

      const frontFaceStyle =
        'position:absolute;inset:0;' +
        'backface-visibility:hidden;-webkit-backface-visibility:hidden;' +
        'border-radius:' + radius + ';' +
        'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'padding:16px;overflow-y:auto;text-align:center;' +
        'background:' + primary + ';color:#fff;';

      const backFaceStyle =
        'position:absolute;inset:0;' +
        'backface-visibility:hidden;-webkit-backface-visibility:hidden;' +
        'border-radius:' + radius + ';' +
        'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'padding:16px;overflow-y:auto;text-align:center;' +
        'background:' + surface + ';color:' + text + ';' +
        'border:1px solid ' + border + ';' +
        'transform:rotateY(180deg);';

      let cardsHtml = '';
      data.cards.forEach(function (card) {
        let imgHtml = '';
        if (card.frontImage) {
          const w = card.frontImageWidth && card.frontImageWidth !== '100%'
            ? card.frontImageWidth
            : '100%';
          imgHtml =
            '<img src="' + card.frontImage + '" ' +
                'style="width:' + w + ';max-width:100%;max-height:80px;' +
                'object-fit:contain;margin-bottom:8px;display:block;" alt="">';
        }

        cardsHtml +=
          '<div class="hce-fc-card" ' +
              'tabindex="0" role="button" ' +
              'aria-label="Front: ' + esc(card.front) + '" ' +
              'data-front="' + esc(card.front) + '" ' +
              'data-back="' + esc(card.back) + '" ' +
              'onclick="' + esc(onClickHandler) + '" ' +
              'onkeydown="' + onKeyHandler + '" ' +
              'style="perspective:1000px;height:200px;cursor:pointer;border-radius:' + radius + ';">' +
            '<div class="hce-fc-inner" ' +
                'style="position:relative;width:100%;height:100%;' +
                  'transform-style:preserve-3d;transition:transform 0.5s ease;">' +
              '<div style="' + frontFaceStyle + '">' +
                imgHtml +
                '<div style="font-family:' + font + ';font-size:15px;font-weight:600;line-height:1.4;">' +
                  esc(card.front) +
                '</div>' +
                (card.frontBody
                  ? '<div style="font-family:' + font + ';font-size:13px;line-height:1.5;margin-top:6px;">' +
                      window.HCESanitize.rich(card.frontBody) + '</div>'
                  : '') +
              '</div>' +
              '<div style="' + backFaceStyle + '">' +
                '<div style="font-family:' + font + ';font-size:14px;font-weight:600;line-height:1.4;">' +
                  esc(card.back) +
                '</div>' +
                (card.backBody
                  ? '<div style="font-family:' + font + ';font-size:13px;line-height:1.5;margin-top:6px;">' +
                      window.HCESanitize.rich(card.backBody) + '</div>'
                  : '') +
              '</div>' +
            '</div>' +
          '</div>';
      });

      container.innerHTML =
        '<style>' +
          '.hce-fc-card.is-flipped .hce-fc-inner{transform:rotateY(180deg);}' +
          '@media(prefers-reduced-motion:reduce){.hce-fc-inner{transition:none !important;}}' +
        '</style>' +
        '<div style="' +
          'display:grid;' +
          'grid-template-columns:repeat(' + cols + ',1fr);' +
          'gap:16px;margin:8px 0;' +
        '">' +
          cardsHtml +
        '</div>';
    }

    renderExportNoJS(container, data, ctx) {
      const uid = (ctx && ctx.uid) || ('fc' + Math.random().toString(36).slice(2, 7));
      const root    = getComputedStyle(document.documentElement);
      const primary = root.getPropertyValue('--color-primary').trim()        || '#2563eb';
      const border  = root.getPropertyValue('--color-border').trim()         || '#e2e8f0';
      const surface = root.getPropertyValue('--color-surface').trim()        || '#f8fafc';
      const text    = root.getPropertyValue('--color-text').trim()           || '#1e293b';
      const font    = root.getPropertyValue('--font-family-body').trim()     || 'Georgia, serif';
      const radius  = root.getPropertyValue('--widget-border-radius').trim() || '0.5rem';
      const cols    = data.columns || 3;

      // Visually hide the checkbox but keep it keyboard-focusable so native
      // Space/Enter toggle the flip. NEVER display:none / visibility:hidden.
      const toggleStyle =
        'position:absolute;width:1px;height:1px;opacity:0;' +
        'margin:0;padding:0;border:0;pointer-events:none;';

      const frontFaceStyle =
        'position:absolute;inset:0;' +
        'backface-visibility:hidden;-webkit-backface-visibility:hidden;' +
        'border-radius:' + radius + ';' +
        'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'padding:16px;overflow-y:auto;text-align:center;' +
        'background:' + primary + ';color:#fff;';

      const backFaceStyle =
        'position:absolute;inset:0;' +
        'backface-visibility:hidden;-webkit-backface-visibility:hidden;' +
        'border-radius:' + radius + ';' +
        'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'padding:16px;overflow-y:auto;text-align:center;' +
        'background:' + surface + ';color:' + text + ';' +
        'border:1px solid ' + border + ';' +
        'transform:rotateY(180deg);';

      let cardsHtml = '';
      data.cards.forEach(function (card, i) {
        const cbId = uid + '-c' + i;

        let imgHtml = '';
        if (card.frontImage) {
          const w = card.frontImageWidth && card.frontImageWidth !== '100%'
            ? card.frontImageWidth
            : '100%';
          imgHtml =
            '<img src="' + card.frontImage + '" ' +
                'style="width:' + w + ';max-width:100%;max-height:80px;' +
                'object-fit:contain;margin-bottom:8px;display:block;" alt="">';
        }

        cardsHtml +=
          '<div class="hce-fc-card" ' +
              'style="perspective:1000px;height:200px;cursor:pointer;border-radius:' + radius + ';">' +
            '<input type="checkbox" class="cx-flip-toggle" id="' + cbId + '" ' +
                'aria-label="Flip card: ' + esc(card.front) + '" ' +
                'style="' + toggleStyle + '">' +
            '<label class="hce-fc-label" for="' + cbId + '" ' +
                'style="position:absolute;inset:0;z-index:2;cursor:pointer;' +
                  'border-radius:' + radius + ';">' +
            '</label>' +
            '<div class="hce-fc-inner" ' +
                'style="position:relative;width:100%;height:100%;' +
                  'transform-style:preserve-3d;transition:transform 0.5s ease;">' +
              '<div style="' + frontFaceStyle + '">' +
                imgHtml +
                '<div style="font-family:' + font + ';font-size:15px;font-weight:600;line-height:1.4;">' +
                  esc(card.front) +
                '</div>' +
                (card.frontBody
                  ? '<div style="font-family:' + font + ';font-size:13px;line-height:1.5;margin-top:6px;">' +
                      window.HCESanitize.rich(card.frontBody) + '</div>'
                  : '') +
              '</div>' +
              '<div style="' + backFaceStyle + '">' +
                '<div style="font-family:' + font + ';font-size:14px;font-weight:600;line-height:1.4;">' +
                  esc(card.back) +
                '</div>' +
                (card.backBody
                  ? '<div style="font-family:' + font + ';font-size:13px;line-height:1.5;margin-top:6px;">' +
                      window.HCESanitize.rich(card.backBody) + '</div>'
                  : '') +
              '</div>' +
            '</div>' +
          '</div>';
      });

      const styleBlock =
        '<style>' +
          // Sticky click-to-flip: checked checkbox rotates its sibling inner face.
          '#' + uid + ' .hce-fc-card:has(.cx-flip-toggle:checked) .hce-fc-inner{transform:rotateY(180deg);}' +
          // Keyboard focus ring on the visible label when the hidden checkbox is focused.
          '#' + uid + ' .cx-flip-toggle:focus-visible + .hce-fc-label{outline:2px solid ' + primary + ';outline-offset:2px;}' +
          // Once flipped, the back face should sit above the label so its content scrolls/reads,
          // while the label still covers the card for the next toggle.
          '#' + uid + ' .hce-fc-card{position:relative;}' +
          '@media(prefers-reduced-motion:reduce){#' + uid + ' .hce-fc-inner{transition:none !important;}}' +
        '</style>';

      container.innerHTML =
        '<div id="' + uid + '">' +
          styleBlock +
          '<div style="' +
            'display:grid;' +
            'grid-template-columns:repeat(' + cols + ',1fr);' +
            'gap:16px;margin:8px 0;' +
          '">' +
            cardsHtml +
          '</div>' +
        '</div>';
    }

    edit(data) {
      this._openEditModal(data);
    }

    _openEditModal(data) {
      const self    = this;
      const working = JSON.parse(JSON.stringify(data));
      let selectedIdx = 0;

      // Track the active ImageUploadField so it can be flushed before card
      // switches and on modal close.
      let currentImgField      = null;
      let currentImgFieldSlice = -1;
      let currentFrontRichField = null;
      let currentBackRichField  = null;
      let currentRichCardIdx    = -1;

      function saveCurrentRichFields() {
        if (currentRichCardIdx >= 0 && currentRichCardIdx < working.cards.length) {
          const c = working.cards[currentRichCardIdx];
          if (currentFrontRichField) c.frontBody = currentFrontRichField.getHtml();
          if (currentBackRichField)  c.backBody  = currentBackRichField.getHtml();
        }
        if (currentFrontRichField) { currentFrontRichField.destroy(); currentFrontRichField = null; }
        if (currentBackRichField)  { currentBackRichField.destroy();  currentBackRichField  = null; }
        currentRichCardIdx = -1;
      }

      function saveCurrentImgField() {
        if (!currentImgField || currentImgFieldSlice < 0) return;
        const card = working.cards[currentImgFieldSlice];
        if (card) {
          const v = currentImgField.getValue();
          card.frontImage      = v.src   || null;
          card.frontImageWidth = v.width || '100%';
        }
        currentImgField.destroy();
        currentImgField      = null;
        currentImgFieldSlice = -1;
      }

      const overlay = document.createElement('div');
      overlay.className = 'widget-modal-overlay';

      const dialog = document.createElement('div');
      dialog.className = 'widget-modal';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-labelledby', 'fc-edit-title');
      dialog.style.width = '600px';

      const header = document.createElement('div');
      header.className = 'widget-modal-header';
      const titleEl = document.createElement('span');
      titleEl.id = 'fc-edit-title';
      titleEl.textContent = 'Edit Flip Cards';
      const closeX = document.createElement('button');
      closeX.className = 'widget-modal-close';
      closeX.type = 'button';
      closeX.setAttribute('aria-label', 'Close');
      closeX.innerHTML = '&times;';
      header.appendChild(titleEl);
      header.appendChild(closeX);

      // flex:1 + min-height:0 is load-bearing: it lets the body shrink inside
      // the dialog's max-height so the footer is never pushed out.
      const body = document.createElement('div');
      body.style.cssText = 'display:flex;flex:1;min-height:0;overflow:hidden;';

      const leftCol = document.createElement('div');
      leftCol.style.cssText =
        'width:160px;flex-shrink:0;border-right:1px solid var(--color-border);' +
        'display:flex;flex-direction:column;';

      const cardListEl = document.createElement('div');
      cardListEl.style.cssText = 'flex:1;overflow-y:auto;';

      const addCardBtn = document.createElement('button');
      addCardBtn.type = 'button';
      addCardBtn.textContent = '+ Add Card';
      addCardBtn.style.cssText =
        'padding:8px 10px;font-size:12px;font-family:var(--font-family-ui);' +
        'border:none;border-top:1px solid var(--color-border);' +
        'background:transparent;cursor:pointer;color:var(--color-primary);text-align:left;';

      const colsWrap = document.createElement('div');
      colsWrap.style.cssText =
        'padding:8px 10px;border-top:1px solid var(--color-border);font-size:12px;' +
        'font-family:var(--font-family-ui);';
      const colsLabel = document.createElement('label');
      colsLabel.style.cssText = 'display:block;color:var(--color-text-muted);margin-bottom:4px;';
      colsLabel.textContent = 'Columns';
      const colsSelect = document.createElement('select');
      colsSelect.className = 'widget-modal-input';
      colsSelect.style.cssText = 'font-size:12px;padding:3px 6px;';
      [2, 3, 4].forEach(function (n) {
        const opt = document.createElement('option');
        opt.value = n;
        opt.textContent = n + ' columns';
        opt.selected = (working.columns || 3) === n;
        colsSelect.appendChild(opt);
      });
      colsSelect.addEventListener('change', function () {
        working.columns = parseInt(colsSelect.value, 10);
      });
      colsWrap.appendChild(colsLabel);
      colsWrap.appendChild(colsSelect);

      leftCol.appendChild(cardListEl);
      leftCol.appendChild(addCardBtn);
      leftCol.appendChild(colsWrap);

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

      function makeReorderBtn(symbol, isSelected) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = symbol;
        btn.style.cssText =
          'background:none;border:none;cursor:pointer;font-size:9px;padding:0 1px;line-height:1;' +
          'color:' + (isSelected ? 'rgba(255,255,255,0.75)' : 'var(--color-text-muted)') + ';';
        return btn;
      }

      function renderCardList() {
        cardListEl.innerHTML = '';
        working.cards.forEach(function (card, idx) {
          const isSelected = idx === selectedIdx;
          const item = document.createElement('div');
          item.style.cssText =
            'display:flex;align-items:center;padding:7px 10px;cursor:pointer;' +
            'font-size:12px;font-family:var(--font-family-ui);gap:2px;' +
            (isSelected ? 'background:var(--color-primary);color:#fff;' : 'color:var(--color-text);');

          const labelSpan = document.createElement('span');
          labelSpan.style.cssText =
            'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
          labelSpan.textContent = card.front || 'Card ' + (idx + 1);

          const upBtn   = makeReorderBtn('▲', isSelected);
          const downBtn = makeReorderBtn('▼', isSelected);

          upBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (idx === 0) return;
            working.cards.splice(idx - 1, 0, working.cards.splice(idx, 1)[0]);
            selectedIdx = idx - 1;
            renderCardList();
            renderRight();
          });
          downBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (idx === working.cards.length - 1) return;
            working.cards.splice(idx + 1, 0, working.cards.splice(idx, 1)[0]);
            selectedIdx = idx + 1;
            renderCardList();
            renderRight();
          });

          item.appendChild(labelSpan);
          item.appendChild(upBtn);
          item.appendChild(downBtn);

          if (working.cards.length > 2) {
            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.textContent = '✕';
            delBtn.style.cssText =
              'background:none;border:none;cursor:pointer;font-size:10px;padding:0 2px;' +
              'color:' + (isSelected ? 'rgba(255,255,255,0.75)' : 'var(--color-text-muted)') + ';';
            delBtn.addEventListener('click', function (e) {
              e.stopPropagation();
              working.cards.splice(idx, 1);
              if (selectedIdx >= working.cards.length) selectedIdx = working.cards.length - 1;
              renderCardList();
              renderRight();
            });
            item.appendChild(delBtn);
          }

          item.addEventListener('click', function () {
            selectedIdx = idx;
            renderCardList();
            renderRight();
          });
          cardListEl.appendChild(item);
        });

        addCardBtn.disabled = working.cards.length >= 12;
        addCardBtn.style.opacity = working.cards.length >= 12 ? '0.4' : '1';
      }

      function renderRight() {
        saveCurrentImgField();
        saveCurrentRichFields();
        rightCol.innerHTML = '';
        const card = working.cards[selectedIdx];
        if (!card) return;

        currentImgFieldSlice = selectedIdx;
        currentRichCardIdx   = selectedIdx;

        // ── Front heading ─────────────────────────────────────────────────────
        const frontWrap = document.createElement('div');
        frontWrap.className = 'widget-modal-field';
        const frontLabel = document.createElement('label');
        frontLabel.className = 'widget-modal-label';
        frontLabel.textContent = 'Front heading';
        const frontInput = document.createElement('input');
        frontInput.className = 'widget-modal-input';
        frontInput.type = 'text';
        frontInput.value = card.front;
        frontInput.addEventListener('input', function () {
          working.cards[selectedIdx].front = frontInput.value;
          renderCardList();
        });
        frontWrap.appendChild(frontLabel);
        frontWrap.appendChild(frontInput);

        // ── Front body (rich) ─────────────────────────────────────────────────
        const frontBodyWrap = document.createElement('div');
        frontBodyWrap.className = 'widget-modal-field';
        const frontBodyLabel = document.createElement('label');
        frontBodyLabel.className = 'widget-modal-label';
        frontBodyLabel.textContent = 'Front body (optional)';
        const frontMount = document.createElement('div');
        currentFrontRichField = new RichTextField(frontMount, card.frontBody || '');
        frontBodyWrap.appendChild(frontBodyLabel);
        frontBodyWrap.appendChild(frontMount);

        // ── Front image (ImageUploadField) ────────────────────────────────────
        const imgWrap = document.createElement('div');
        imgWrap.className = 'widget-modal-field';
        const imgLabel = document.createElement('label');
        imgLabel.className = 'widget-modal-label';
        imgLabel.textContent = 'Front image (optional)';
        imgWrap.appendChild(imgLabel);
        const imgMount = document.createElement('div');
        imgWrap.appendChild(imgMount);

        currentImgField = new ImageUploadField(imgMount, {
          src:   card.frontImage      || '',
          width: card.frontImageWidth || '100%',
        }, function (value) {
          const i = selectedIdx;
          if (!working.cards[i]) return;
          working.cards[i].frontImage      = value.src   || null;
          working.cards[i].frontImageWidth = value.width || '100%';
        });

        // ── Back heading ──────────────────────────────────────────────────────
        const backWrap = document.createElement('div');
        backWrap.className = 'widget-modal-field';
        const backLabel = document.createElement('label');
        backLabel.className = 'widget-modal-label';
        backLabel.textContent = 'Back heading';
        const backInput = document.createElement('input');
        backInput.className = 'widget-modal-input';
        backInput.type = 'text';
        backInput.value = card.back;
        backInput.addEventListener('input', function () {
          working.cards[selectedIdx].back = backInput.value;
        });
        backWrap.appendChild(backLabel);
        backWrap.appendChild(backInput);

        // ── Back body (rich) ──────────────────────────────────────────────────
        const backBodyWrap = document.createElement('div');
        backBodyWrap.className = 'widget-modal-field';
        const backBodyLabel = document.createElement('label');
        backBodyLabel.className = 'widget-modal-label';
        backBodyLabel.textContent = 'Back body (optional)';
        const backMount = document.createElement('div');
        currentBackRichField = new RichTextField(backMount, card.backBody || '');
        backBodyWrap.appendChild(backBodyLabel);
        backBodyWrap.appendChild(backMount);

        rightCol.appendChild(frontWrap);
        rightCol.appendChild(frontBodyWrap);
        rightCol.appendChild(imgWrap);
        rightCol.appendChild(backWrap);
        rightCol.appendChild(backBodyWrap);

        requestAnimationFrame(function () { frontInput.focus(); });
      }

      addCardBtn.addEventListener('click', function () {
        if (working.cards.length >= 12) return;
        working.cards.push({
          id:             'card-' + Date.now(),
          front:          '',
          frontBody:      '',
          back:           '',
          backBody:       '',
          frontImage:     null,
          frontImageWidth: '100%',
        });
        selectedIdx = working.cards.length - 1;
        renderCardList();
        renderRight();
      });

      function close(save) {
        saveCurrentImgField();
        saveCurrentRichFields();
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

      renderCardList();
      renderRight();
    }
  }

  WidgetRegistry.register(FlipCardsBlot);
})();
