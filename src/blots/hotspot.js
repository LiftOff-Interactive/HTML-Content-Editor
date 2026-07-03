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

  class HotspotBlot extends BaseWidgetBlot {
    static blotName          = 'hotspot';
    static tagName           = 'div';
    static widgetName        = 'hotspot';
    static widgetLabel       = 'Hotspot';
    static widgetIcon        = '📍';
    static widgetDescription = 'Image with clickable pin markers and tooltips';
    static defaultData = {
      _v: 1,
      imageData: null,
      altText: '',
      pins: [],
    };

    attach() {
      super.attach();
      if (!this._uid) this._uid = 'hs' + (++_instanceCount);
    }

    renderEditor(container, data) {
      const self = this;

      let pinsHtml = '';
      data.pins.forEach(function (pin, idx) {
        const above = pin.y > 65;
        pinsHtml +=
          '<button class="hotspot-pin" type="button" ' +
              'style="left:' + pin.x + '%;top:' + pin.y + '%;" ' +
              'data-pin-id="' + esc(pin.id) + '" ' +
              'aria-label="Pin ' + (idx + 1) + ': ' + esc(pin.label) + '">' +
            (idx + 1) +
          '</button>' +
          '<div class="hotspot-tooltip' + (above ? ' hotspot-tooltip--above' : '') + '" ' +
              'data-tooltip-id="' + esc(pin.id) + '" ' +
              'style="left:' + pin.x + '%;top:' + pin.y + '%;" ' +
              'aria-hidden="true">' +
            '<strong class="hotspot-tooltip-label">' + esc(pin.label) + '</strong>' +
            (pin.content ? '<div class="hotspot-tooltip-content">' + pin.content + '</div>' : '') +
          '</div>';
      });

      const imgHtml = data.imageData
        ? '<div class="hotspot-image-wrap">' +
            '<img class="hotspot-image" src="' + data.imageData + '" alt="' + esc(data.altText) + '">' +
            pinsHtml +
          '</div>'
        : '<div class="hotspot-placeholder">' +
            '<span>📍 Click ✎ Edit to upload an image and add pins</span>' +
          '</div>';

      container.innerHTML =
        '<div class="hotspot-bar">' +
          '<span class="hotspot-bar-label">📍 Hotspot</span>' +
          '<button class="hotspot-edit-btn" type="button">✎ Edit</button>' +
        '</div>' +
        '<div class="hotspot-body">' + imgHtml + '</div>';

      container.querySelectorAll('.hotspot-pin').forEach(function (pinBtn) {
        pinBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          const pinId = pinBtn.dataset.pinId;
          const wasActive = pinBtn.classList.contains('is-active');

          container.querySelectorAll('.hotspot-pin').forEach(function (p) {
            p.classList.remove('is-active');
          });
          container.querySelectorAll('.hotspot-tooltip').forEach(function (t) {
            t.classList.remove('is-visible');
            t.setAttribute('aria-hidden', 'true');
          });

          if (!wasActive) {
            pinBtn.classList.add('is-active');
            const tooltip = container.querySelector('[data-tooltip-id="' + pinId + '"]');
            if (tooltip) {
              tooltip.classList.add('is-visible');
              tooltip.setAttribute('aria-hidden', 'false');
            }
          }
        });
        pinBtn.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pinBtn.click(); }
        });
      });

      container.querySelector('.hotspot-edit-btn').addEventListener('click', function (e) {
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

      // Index-based onclick — pairs pins[idx] with tips[idx] in DOM order
      const onClickHandler =
        '(function(btn){' +
          'var hs=btn.closest("[data-hs]");' +
          'var idx=parseInt(btn.dataset.pinIdx,10);' +
          'var open=btn.classList.contains("hce-hs-active");' +
          'var pins=hs.querySelectorAll(".hce-hs-pin");' +
          'var tips=hs.querySelectorAll(".hce-hs-tip");' +
          'pins.forEach(function(p){p.classList.remove("hce-hs-active");});' +
          'tips.forEach(function(t){t.classList.remove("hce-hs-vis");t.setAttribute("aria-hidden","true");});' +
          'if(!open&&tips[idx]){' +
            'btn.classList.add("hce-hs-active");' +
            'tips[idx].classList.add("hce-hs-vis");' +
            'tips[idx].setAttribute("aria-hidden","false");' +
          '}' +
        '})(this)';

      const onKeyHandler = 'if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();this.click();}';

      let pinsHtml = '';
      data.pins.forEach(function (pin, idx) {
        const above = pin.y > 65;

        const pinStyle =
          'position:absolute;' +
          'left:' + pin.x + '%;top:' + pin.y + '%;' +
          'transform:translate(-50%,-50%);' +
          'width:26px;height:26px;border-radius:50%;' +
          'background:' + primary + ';color:#fff;' +
          'border:2px solid #fff;' +
          'font-family:' + font + ';font-size:12px;font-weight:700;' +
          'cursor:pointer;z-index:2;' +
          'box-shadow:0 1px 4px rgba(0,0,0,0.3);';

        const tooltipStyle =
          'position:absolute;' +
          'left:' + pin.x + '%;top:' + pin.y + '%;' +
          'transform:translate(-50%,' + (above ? 'calc(-100% - 16px)' : '16px') + ');' +
          'background:' + surface + ';' +
          'border:1px solid ' + border + ';' +
          'border-radius:' + radius + ';' +
          'padding:8px 12px;' +
          'max-width:280px;min-width:120px;' +
          'box-shadow:0 2px 8px rgba(0,0,0,0.12);' +
          'z-index:10;font-family:' + font + ';' +
          'display:none;line-height:1.4;pointer-events:none;';

        pinsHtml +=
          '<button class="hce-hs-pin" type="button" ' +
              'data-pin-idx="' + idx + '" ' +
              'aria-label="Pin ' + (idx + 1) + ': ' + esc(pin.label) + '" ' +
              'onclick="' + esc(onClickHandler) + '" ' +
              'onkeydown="' + onKeyHandler + '" ' +
              'style="' + pinStyle + '">' +
            (idx + 1) +
          '</button>' +
          '<div class="hce-hs-tip" aria-hidden="true" style="' + tooltipStyle + '">' +
            '<strong style="display:block;font-size:13px;color:' + text + ';' +
              'margin-bottom:' + (pin.content ? '4px' : '0') + ';">' +
              esc(pin.label) +
            '</strong>' +
            (pin.content
              ? '<div style="margin:0;font-size:13px;line-height:1.5;color:' + text + ';">' +
                  window.HCESanitize.rich(pin.content) + '</div>'
              : '') +
          '</div>';
      });

      container.innerHTML =
        '<style>' +
          '.hce-hs-tip.hce-hs-vis{display:block !important;}' +
          '.hce-hs-pin.hce-hs-active{box-shadow:0 0 0 3px ' + primary + ',0 0 0 5px rgba(255,255,255,0.9) !important;}' +
          '.hce-hs-pin.hce-hs-active::after{animation:none !important;}' +
          '.hce-hs-pin::after{content:"";position:absolute;inset:-4px;border-radius:50%;' +
            'border:2px solid ' + primary + ';opacity:0;pointer-events:none;' +
            'animation:hce-hs-pulse 2s ease-in-out infinite;}' +
          '@keyframes hce-hs-pulse{0%{transform:scale(0.8);opacity:0.8;}100%{transform:scale(1.8);opacity:0;}}' +
          '@media(prefers-reduced-motion:reduce){.hce-hs-pin::after{animation:none;}}' +
        '</style>' +
        (data.imageData
          ? '<div data-hs style="position:relative;line-height:0;border-radius:' + radius + ';margin:8px 0;">' +
              '<img src="' + data.imageData + '" alt="' + esc(data.altText) + '" ' +
                  'style="width:100%;height:auto;display:block;border-radius:' + radius + ';">' +
              pinsHtml +
            '</div>'
          : '<div style="padding:24px;text-align:center;font-family:' + font + ';color:#999;font-style:italic;">' +
              'No image uploaded</div>');
    }

    renderExportNoJS(container, data, ctx) {
      const uid = (ctx && ctx.uid) || ('hs' + Math.random().toString(36).slice(2, 7));

      const root    = getComputedStyle(document.documentElement);
      const primary = root.getPropertyValue('--color-primary').trim()        || '#2563eb';
      const border  = root.getPropertyValue('--color-border').trim()         || '#e2e8f0';
      const surface = root.getPropertyValue('--color-surface').trim()        || '#f8fafc';
      const text    = root.getPropertyValue('--color-text').trim()           || '#1e293b';
      const font    = root.getPropertyValue('--font-family-body').trim()     || 'Georgia, serif';
      const radius  = root.getPropertyValue('--widget-border-radius').trim() || '0.5rem';

      // Visually hide the state radios but keep them keyboard-focusable
      // (NOT display:none — that would break Tab focus + Enter/Space toggle).
      const radioHide =
        'position:absolute;width:1px;height:1px;opacity:0;' +
        'margin:0;padding:0;border:0;pointer-events:none;';

      let radios = '';
      let pinsHtml = '';
      let rules = '';

      const pins = (data && data.pins) || [];
      pins.forEach(function (pin, idx) {
        const above = pin.y > 65;
        const rid = uid + '-p' + idx;
        const tid = uid + '-tip' + idx;

        radios +=
          '<input type="radio" class="hce-hs-radio" name="' + uid + '-hs" id="' + rid + '" ' +
              'style="' + radioHide + '" ' +
              'aria-label="Pin ' + (idx + 1) + ': ' + esc(pin.label) + '">';

        const pinStyle =
          'position:absolute;' +
          'left:' + pin.x + '%;top:' + pin.y + '%;' +
          'transform:translate(-50%,-50%);' +
          'width:26px;height:26px;border-radius:50%;' +
          'background:' + primary + ';color:#fff;' +
          'border:2px solid #fff;' +
          'font-family:' + font + ';font-size:12px;font-weight:700;' +
          'cursor:pointer;z-index:2;' +
          'display:flex;align-items:center;justify-content:center;' +
          'box-shadow:0 1px 4px rgba(0,0,0,0.3);';

        const tooltipStyle =
          'position:absolute;' +
          'left:' + pin.x + '%;top:' + pin.y + '%;' +
          'transform:translate(-50%,' + (above ? 'calc(-100% - 16px)' : '16px') + ');' +
          'background:' + surface + ';' +
          'border:1px solid ' + border + ';' +
          'border-radius:' + radius + ';' +
          'padding:8px 12px;' +
          'max-width:280px;min-width:120px;' +
          'box-shadow:0 2px 8px rgba(0,0,0,0.12);' +
          'z-index:10;font-family:' + font + ';' +
          'display:none;line-height:1.4;';

        pinsHtml +=
          '<label class="hce-hs-pin" for="' + rid + '" ' +
              'style="' + pinStyle + '">' +
            (idx + 1) +
          '</label>' +
          '<div class="hce-hs-tip" id="' + tid + '" style="' + tooltipStyle + '">' +
            '<label class="hce-hs-close" for="' + uid + '-none" ' +
                'style="position:absolute;top:4px;right:6px;cursor:pointer;' +
                'font-size:14px;line-height:1;color:' + text + ';opacity:0.55;">&times;</label>' +
            '<strong style="display:block;font-size:13px;color:' + text + ';' +
              'padding-right:14px;' +
              'margin-bottom:' + (pin.content ? '4px' : '0') + ';">' +
              esc(pin.label) +
            '</strong>' +
            (pin.content
              ? '<div style="margin:0;font-size:13px;line-height:1.5;color:' + text + ';">' +
                  window.HCESanitize.rich(pin.content) + '</div>'
              : '') +
          '</div>';

        // Scoped reveal of the matching tooltip + active ring on the checked pin.
        // !important: the tooltip carries an inline display:none and the pin an
        // inline box-shadow; inline beats a stylesheet selector, so the reveal
        // and active-ring overrides must be !important to take effect.
        rules +=
          '#' + uid + ':has(#' + rid + ':checked) #' + tid + '{display:block !important;}' +
          '#' + uid + ':has(#' + rid + ':checked) label[for="' + rid + '"]{' +
            'box-shadow:0 0 0 3px ' + primary + ',0 0 0 5px rgba(255,255,255,0.9) !important;}' +
          '#' + uid + ':has(#' + rid + ':checked) label[for="' + rid + '"]::after{animation:none;}';
      });

      // No-op reset radio: clicking a tooltip close label checks this, hiding all tips
      // while preserving single-open mutual exclusion.
      const noneRadio =
        '<input type="radio" class="hce-hs-radio" name="' + uid + '-hs" id="' + uid + '-none" ' +
            'checked style="' + radioHide + '" aria-label="Close tooltip">';

      const styleBlock =
        '<style>' +
          '#' + uid + ' .hce-hs-pin::after{content:"";position:absolute;inset:-4px;border-radius:50%;' +
            'border:2px solid ' + primary + ';opacity:0;pointer-events:none;' +
            'animation:hce-hs-pulse 2s ease-in-out infinite;}' +
          '@keyframes hce-hs-pulse{0%{transform:scale(0.8);opacity:0.8;}100%{transform:scale(1.8);opacity:0;}}' +
          '@media(prefers-reduced-motion:reduce){#' + uid + ' .hce-hs-pin::after{animation:none;}}' +
          rules +
        '</style>';

      const inner = data.imageData
        ? '<div style="position:relative;line-height:0;border-radius:' + radius + ';margin:8px 0;">' +
            '<img src="' + data.imageData + '" alt="' + esc(data.altText) + '" ' +
                'style="width:100%;height:auto;display:block;border-radius:' + radius + ';">' +
            pinsHtml +
          '</div>'
        : '<div style="padding:24px;text-align:center;font-family:' + font + ';color:#999;font-style:italic;">' +
            'No image uploaded</div>';

      container.innerHTML =
        '<div id="' + uid + '" style="position:relative;">' +
          styleBlock +
          noneRadio +
          radios +
          inner +
        '</div>';
    }

    edit(data) {
      this._openEditModal(data);
    }

    _openEditModal(data) {
      const self = this;
      const working = JSON.parse(JSON.stringify(data));
      let selectedPinIdx = working.pins.length > 0 ? 0 : -1;
      let currentRichField   = null;
      let currentRichPinIdx  = -1;

      function saveCurrentRichField() {
        if (currentRichField && currentRichPinIdx >= 0 && currentRichPinIdx < working.pins.length) {
          working.pins[currentRichPinIdx].content = currentRichField.getHtml();
        }
        if (currentRichField) { currentRichField.destroy(); currentRichField = null; }
        currentRichPinIdx = -1;
      }

      // --- Modal skeleton ---
      const overlay = document.createElement('div');
      overlay.className = 'widget-modal-overlay';

      const dialog = document.createElement('div');
      dialog.className = 'widget-modal';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-labelledby', 'hs-edit-title');
      dialog.style.width = '760px';

      const header = document.createElement('div');
      header.className = 'widget-modal-header';
      const titleEl = document.createElement('span');
      titleEl.id = 'hs-edit-title';
      titleEl.textContent = 'Edit Hotspot';
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
        'flex:1;min-width:0;border-right:1px solid var(--color-border);' +
        'display:flex;flex-direction:column;padding:16px;gap:10px;overflow:hidden;';

      const rightCol = document.createElement('div');
      rightCol.style.cssText =
        'width:240px;flex-shrink:0;display:flex;flex-direction:column;overflow:hidden;';

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

      // --- Left column: image controls + image area ---
      const imgControlsRow = document.createElement('div');
      imgControlsRow.style.cssText = 'display:flex;align-items:center;gap:6px;flex-shrink:0;';

      const imgFileInput = document.createElement('input');
      imgFileInput.type = 'file';
      imgFileInput.accept = 'image/*';
      imgFileInput.style.display = 'none';

      const uploadBtn = document.createElement('button');
      uploadBtn.type = 'button';
      uploadBtn.style.cssText =
        'font-size:12px;font-family:var(--font-family-ui);color:var(--color-primary);' +
        'background:none;border:1px solid var(--color-border);border-radius:4px;' +
        'cursor:pointer;padding:4px 10px;flex-shrink:0;white-space:nowrap;';
      uploadBtn.textContent = working.imageData ? '🔄 Replace' : '📷 Upload';

      const orSpan = document.createElement('span');
      orSpan.textContent = 'or';
      orSpan.style.cssText =
        'font-size:11px;color:var(--color-text-muted);font-family:var(--font-family-ui);flex-shrink:0;';

      const urlInput = document.createElement('input');
      urlInput.type        = 'url';
      urlInput.placeholder = 'Paste image URL…';
      urlInput.className   = 'widget-modal-input';
      urlInput.style.flex      = '1';
      urlInput.style.minWidth  = '0';
      urlInput.style.fontSize  = '12px';
      if (working.imageData && !working.imageData.startsWith('data:')) {
        urlInput.value = working.imageData;
      }

      imgControlsRow.appendChild(uploadBtn);
      imgControlsRow.appendChild(imgFileInput);
      imgControlsRow.appendChild(orSpan);
      imgControlsRow.appendChild(urlInput);

      const urlWarnEl = document.createElement('div');
      urlWarnEl.style.cssText =
        'display:none;padding:3px 8px;' +
        'background:#fffbeb;border:1px solid #d97706;border-radius:4px;' +
        'font-size:11px;font-family:var(--font-family-ui);color:#92400e;flex-shrink:0;';
      urlWarnEl.textContent = '⚠ URL images require internet connection in the exported file.';
      if (working.imageData && !working.imageData.startsWith('data:')) {
        urlWarnEl.style.display = 'block';
      }

      const altRow = document.createElement('div');
      altRow.style.cssText = 'display:flex;align-items:center;flex-shrink:0;';

      const altInput = document.createElement('input');
      altInput.type = 'text';
      altInput.className = 'widget-modal-input';
      altInput.placeholder = 'Alt text (accessibility)';
      altInput.value = working.altText || '';
      altInput.style.flex = '1';
      altInput.addEventListener('input', function () { working.altText = altInput.value; });
      altRow.appendChild(altInput);

      // imgArea scrolls so a tall image is fully reachable even when the dialog
      // is clamped by max-height. Pin markers live on imgWrap — a box that
      // shrink-wraps the image exactly — so their %-positions always agree with
      // the click coordinates measured against the image itself.
      const imgArea = document.createElement('div');
      imgArea.style.cssText =
        'flex:1;min-height:180px;background:var(--color-bg);overflow-y:auto;';

      const imgWrap = document.createElement('div');
      imgWrap.style.cssText = 'position:relative;width:100%;';

      const imgEl = document.createElement('img');
      imgEl.style.cssText = 'width:100%;height:auto;display:block;cursor:crosshair;user-select:none;';
      imgEl.draggable = false;
      imgEl.alt = '';
      imgWrap.appendChild(imgEl);

      const noImgPlaceholder = document.createElement('div');
      noImgPlaceholder.style.cssText =
        'width:100%;height:100%;min-height:180px;display:flex;align-items:center;' +
        'justify-content:center;background:var(--color-bg);' +
        'border:2px dashed var(--color-border);border-radius:6px;' +
        'color:var(--color-text-muted);font-family:var(--font-family-ui);font-size:13px;cursor:pointer;';
      noImgPlaceholder.textContent = '📷 Click to upload an image';
      noImgPlaceholder.addEventListener('click', function () { imgFileInput.click(); });

      if (working.imageData) {
        imgEl.src = working.imageData;
        imgArea.appendChild(imgWrap);
      } else {
        imgArea.appendChild(noImgPlaceholder);
      }

      const instrEl = document.createElement('p');
      instrEl.style.cssText =
        'font-size:11px;color:var(--color-text-muted);font-family:var(--font-family-ui);margin:0;flex-shrink:0;';
      instrEl.textContent = working.imageData
        ? 'Click on the image to place a new pin.'
        : 'Upload an image first, then click to place pins.';

      leftCol.appendChild(imgControlsRow);
      leftCol.appendChild(urlWarnEl);
      leftCol.appendChild(altRow);
      leftCol.appendChild(imgArea);
      leftCol.appendChild(instrEl);

      // --- Right column: pin list header + list + form ---
      const pinListHeader = document.createElement('div');
      pinListHeader.style.cssText =
        'padding:8px 12px;font-size:11px;font-weight:600;text-transform:uppercase;' +
        'letter-spacing:0.05em;color:var(--color-text-muted);font-family:var(--font-family-ui);' +
        'border-bottom:1px solid var(--color-border);flex-shrink:0;';
      pinListHeader.textContent = 'Pins';

      const pinListEl = document.createElement('div');
      pinListEl.style.cssText =
        'flex:1 1 0;overflow-y:auto;border-bottom:1px solid var(--color-border);min-height:72px;';

      // The pin form scrolls its own overflow when the dialog is height-clamped,
      // so the tooltip editor never gets clipped behind rightCol's hidden edge.
      const pinFormEl = document.createElement('div');
      pinFormEl.style.cssText =
        'padding:12px;display:flex;flex-direction:column;gap:10px;flex:0 1 auto;min-height:0;overflow-y:auto;';

      rightCol.appendChild(pinListHeader);
      rightCol.appendChild(pinListEl);
      rightCol.appendChild(pinFormEl);

      // --- Event handlers ---
      uploadBtn.addEventListener('click', function () { imgFileInput.click(); });

      imgFileInput.addEventListener('change', function () {
        const file = imgFileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (ev) {
          working.imageData = ev.target.result;
          imgEl.src = working.imageData;
          uploadBtn.textContent = '🔄 Replace';
          urlInput.value = '';
          urlWarnEl.style.display = 'none';
          instrEl.textContent = 'Click on the image to place a new pin.';
          if (imgArea.contains(noImgPlaceholder)) {
            imgArea.removeChild(noImgPlaceholder);
            imgArea.appendChild(imgWrap);
          }
          renderPins();
        };
        reader.readAsDataURL(file);
        imgFileInput.value = '';
      });

      urlInput.addEventListener('input', function () {
        const url = urlInput.value.trim();
        working.imageData = url || null;
        urlWarnEl.style.display = url ? 'block' : 'none';
        if (url) {
          imgEl.src = url;
          uploadBtn.textContent = '🔄 Replace';
          instrEl.textContent = 'Click on the image to place a new pin.';
          if (imgArea.contains(noImgPlaceholder)) {
            imgArea.removeChild(noImgPlaceholder);
            imgArea.appendChild(imgWrap);
          }
        } else {
          imgEl.src = '';
          uploadBtn.textContent = '📷 Upload';
          instrEl.textContent = 'Upload an image first, then click to place pins.';
          if (!imgArea.contains(noImgPlaceholder)) {
            if (imgArea.contains(imgWrap)) imgArea.removeChild(imgWrap);
            imgArea.appendChild(noImgPlaceholder);
          }
        }
        renderPins();
      });

      imgEl.addEventListener('click', function (e) {
        const rect = imgEl.getBoundingClientRect();
        const x = Math.round(((e.clientX - rect.left) / rect.width)  * 1000) / 10;
        const y = Math.round(((e.clientY - rect.top)  / rect.height) * 1000) / 10;
        working.pins.push({
          id: 'pin-' + Date.now(),
          x: Math.max(2, Math.min(98, x)),
          y: Math.max(2, Math.min(98, y)),
          label:   '',
          content: '',
        });
        selectedPinIdx = working.pins.length - 1;
        renderPins();
        renderPinList();
        renderPinForm();
        requestAnimationFrame(function () {
          const labelInput = pinFormEl.querySelector('.hs-label-input');
          if (labelInput) labelInput.focus();
        });
      });

      // --- Render functions ---
      function renderPins() {
        imgWrap.querySelectorAll('.hs-modal-pin').forEach(function (el) { el.remove(); });
        working.pins.forEach(function (pin, idx) {
          const marker = document.createElement('button');
          marker.type = 'button';
          marker.className = 'hs-modal-pin';
          marker.style.cssText =
            'position:absolute;' +
            'left:' + pin.x + '%;top:' + pin.y + '%;' +
            'transform:translate(-50%,-50%);' +
            'width:24px;height:24px;border-radius:50%;' +
            'background:var(--color-primary);color:#fff;' +
            'border:2px solid #fff;' +
            'font-size:11px;font-weight:700;font-family:var(--font-family-ui);' +
            'cursor:pointer;z-index:2;' +
            'box-shadow:0 1px 4px rgba(0,0,0,0.3);' +
            (idx === selectedPinIdx
              ? 'outline:2px solid var(--color-primary);outline-offset:3px;'
              : '');
          marker.textContent = idx + 1;
          marker.setAttribute('aria-label', 'Pin ' + (idx + 1) + (pin.label ? ': ' + pin.label : ''));
          marker.addEventListener('click', function (e) {
            e.stopPropagation();
            selectedPinIdx = idx;
            renderPins();
            renderPinList();
            renderPinForm();
          });
          imgWrap.appendChild(marker);
        });
      }

      function renderPinList() {
        pinListEl.innerHTML = '';
        if (working.pins.length === 0) {
          const emptyEl = document.createElement('div');
          emptyEl.style.cssText =
            'padding:12px;font-size:12px;color:var(--color-text-muted);' +
            'font-family:var(--font-family-ui);font-style:italic;';
          emptyEl.textContent = 'No pins yet. Click on the image to add one.';
          pinListEl.appendChild(emptyEl);
          return;
        }
        working.pins.forEach(function (pin, idx) {
          const isSelected = idx === selectedPinIdx;
          const row = document.createElement('div');
          row.style.cssText =
            'display:flex;align-items:center;padding:7px 10px;cursor:pointer;' +
            'font-size:12px;font-family:var(--font-family-ui);gap:6px;' +
            (isSelected ? 'background:var(--color-primary);color:#fff;' : 'color:var(--color-text);');

          const badge = document.createElement('span');
          badge.style.cssText =
            'width:18px;height:18px;border-radius:50%;flex-shrink:0;' +
            'display:flex;align-items:center;justify-content:center;' +
            'font-size:10px;font-weight:700;' +
            'background:' + (isSelected ? 'rgba(255,255,255,0.25)' : 'var(--color-border)') + ';';
          badge.textContent = idx + 1;

          const labelSpan = document.createElement('span');
          labelSpan.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
          labelSpan.textContent = pin.label || '(no label)';

          const delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.textContent = '✕';
          delBtn.style.cssText =
            'background:none;border:none;cursor:pointer;font-size:10px;padding:0 2px;' +
            'color:' + (isSelected ? 'rgba(255,255,255,0.75)' : 'var(--color-text-muted)') + ';';
          delBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            working.pins.splice(idx, 1);
            if (selectedPinIdx >= working.pins.length) selectedPinIdx = working.pins.length - 1;
            renderPins();
            renderPinList();
            renderPinForm();
          });

          row.appendChild(badge);
          row.appendChild(labelSpan);
          row.appendChild(delBtn);
          row.addEventListener('click', function () {
            selectedPinIdx = idx;
            renderPins();
            renderPinList();
            renderPinForm();
          });
          pinListEl.appendChild(row);
        });
      }

      function renderPinForm() {
        saveCurrentRichField();
        pinFormEl.innerHTML = '';
        if (selectedPinIdx < 0 || !working.pins[selectedPinIdx]) {
          const hint = document.createElement('p');
          hint.style.cssText =
            'font-size:12px;color:var(--color-text-muted);font-family:var(--font-family-ui);' +
            'font-style:italic;margin:0;';
          hint.textContent = 'Click a pin above or click the image to add one.';
          pinFormEl.appendChild(hint);
          return;
        }

        const pin = working.pins[selectedPinIdx];
        currentRichPinIdx = selectedPinIdx;

        const pinNumLbl = document.createElement('div');
        pinNumLbl.style.cssText =
          'font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;' +
          'color:var(--color-text-muted);font-family:var(--font-family-ui);';
        pinNumLbl.textContent = 'Pin ' + (selectedPinIdx + 1);

        const labelWrap = document.createElement('div');
        labelWrap.className = 'widget-modal-field';
        const labelLbl = document.createElement('label');
        labelLbl.className = 'widget-modal-label';
        labelLbl.textContent = 'Label';
        const labelInput = document.createElement('input');
        labelInput.className = 'widget-modal-input hs-label-input';
        labelInput.type = 'text';
        labelInput.value = pin.label;
        labelInput.placeholder = 'e.g. Left Ventricle';
        labelInput.addEventListener('input', function () {
          working.pins[selectedPinIdx].label = labelInput.value;
          renderPinList();
          renderPins();
        });
        labelWrap.appendChild(labelLbl);
        labelWrap.appendChild(labelInput);

        const contentWrap = document.createElement('div');
        contentWrap.className = 'widget-modal-field';
        const contentLbl = document.createElement('label');
        contentLbl.className = 'widget-modal-label';
        contentLbl.textContent = 'Tooltip content';
        const mount = document.createElement('div');
        currentRichField = new RichTextField(mount, pin.content || '');
        contentWrap.appendChild(contentLbl);
        contentWrap.appendChild(mount);

        pinFormEl.appendChild(pinNumLbl);
        pinFormEl.appendChild(labelWrap);
        pinFormEl.appendChild(contentWrap);
      }

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
      overlay.addEventListener('click',  function (e) { if (e.target === overlay) close(false); });
      document.addEventListener('keydown', onKey);

      renderPins();
      renderPinList();
      renderPinForm();
    }
  }

  WidgetRegistry.register(HotspotBlot);
})();
