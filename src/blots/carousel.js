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

  class CarouselBlot extends BaseWidgetBlot {
    static blotName          = 'carousel';
    static tagName           = 'div';
    static widgetName        = 'carousel';
    static widgetLabel       = 'Carousel';
    static widgetIcon        = '🎠';
    static widgetDescription = 'Image or content slider with prev/next navigation';
    static defaultData       = {
      _v: 1,
      slides: [
        { id: 'slide-1', imageData: null, imageWidth: '100%', altText: '', caption: '', textContent: '<p>Slide 1 — click ✎ Edit to add an image or write content.</p>' },
        { id: 'slide-2', imageData: null, imageWidth: '100%', altText: '', caption: '', textContent: '<p>Slide 2 — click ✎ Edit to add an image or write content.</p>' },
      ],
      autoplay:   false,
      showDots:   true,
      showArrows: true,
      navStyle:   'buttons',
    };

    attach() {
      super.attach();
      if (!this._uid) this._uid = 'car' + (++_instanceCount);
      if (this._currentSlide === undefined) this._currentSlide = 0;
    }

    renderEditor(container, data) {
      const self   = this;
      const slides = data.slides || [];
      const count  = slides.length;
      if (count === 0) return;

      const idx  = Math.max(0, Math.min(self._currentSlide || 0, count - 1));
      self._currentSlide = idx;
      const slide = slides[idx];

      let mediaHtml;
      if (slide.imageData) {
        const imgW = slide.imageWidth && slide.imageWidth !== '100%'
          ? 'width:' + slide.imageWidth + ';max-width:100%;height:auto;display:block;margin:auto;'
          : 'width:100%;height:auto;display:block;';
        mediaHtml =
          '<img class="carousel-slide-img" src="' + slide.imageData +
              '" alt="' + esc(slide.altText) + '" style="' + imgW + '">';
      } else {
        const txt = slide.textContent || '';
        mediaHtml =
          '<div class="carousel-slide-text">' +
            (txt || '<p class="carousel-placeholder">Upload an image or add text content via ✎ Edit.</p>') +
          '</div>';
      }

      const captionHtml = (slide.imageData && slide.caption)
        ? '<div class="carousel-caption">' + esc(slide.caption) + '</div>'
        : '';

      let dotsHtml = '';
      if (data.showDots && count > 1) {
        let inner = '';
        for (let i = 0; i < count; i++) {
          inner +=
            '<button class="carousel-dot' + (i === idx ? ' is-active' : '') + '" ' +
                'type="button" data-idx="' + i + '" ' +
                'aria-label="Slide ' + (i + 1) + '" ' +
                'aria-current="' + (i === idx) + '"></button>';
        }
        dotsHtml = '<div class="carousel-dots">' + inner + '</div>';
      }

      const showArrows = data.showArrows && count > 1;

      container.innerHTML =
        '<div class="carousel-bar">' +
          '<span class="carousel-bar-label">🎠 Carousel (' + (idx + 1) + ' / ' + count + ')</span>' +
          '<button class="carousel-edit-btn" type="button">✎ Edit</button>' +
        '</div>' +
        '<div class="carousel-viewport">' +
          (showArrows
            ? '<button class="carousel-arrow carousel-arrow--prev" type="button" aria-label="Previous slide">&#8249;</button>'
            : '') +
          '<div class="carousel-media">' + mediaHtml + '</div>' +
          (showArrows
            ? '<button class="carousel-arrow carousel-arrow--next" type="button" aria-label="Next slide">&#8250;</button>'
            : '') +
        '</div>' +
        captionHtml +
        dotsHtml;

      if (showArrows) {
        container.querySelector('.carousel-arrow--prev').addEventListener('click', function (e) {
          e.stopPropagation();
          self._currentSlide = (idx - 1 + count) % count;
          self.renderEditor(container, self.constructor.value(self.domNode));
        });
        container.querySelector('.carousel-arrow--next').addEventListener('click', function (e) {
          e.stopPropagation();
          self._currentSlide = (idx + 1) % count;
          self.renderEditor(container, self.constructor.value(self.domNode));
        });
      }

      container.querySelectorAll('.carousel-dot').forEach(function (dot) {
        dot.addEventListener('click', function (e) {
          e.stopPropagation();
          self._currentSlide = parseInt(dot.dataset.idx, 10);
          self.renderEditor(container, self.constructor.value(self.domNode));
        });
      });

      container.querySelector('.carousel-edit-btn').addEventListener('click', function (e) {
        e.stopPropagation();
        self.edit(self.constructor.value(self.domNode));
      });
    }

    renderExport(container, data, ctx) {
      // Author-selected navigation style (F6, item 9): 'snap' emits the
      // CSS-only scroll-snap carousel (the SharePoint renderer) in BOTH export
      // modes. Default 'buttons' keeps the existing JS arrows/dots behavior
      // byte-for-byte unchanged (§3).
      if (data.navStyle === 'snap' && typeof this.renderExportNoJS === 'function') {
        return this.renderExportNoJS(container, data, ctx);
      }
      const root    = getComputedStyle(document.documentElement);
      const primary = root.getPropertyValue('--color-primary').trim()        || '#2563eb';
      const border  = root.getPropertyValue('--color-border').trim()         || '#e2e8f0';
      const surface = root.getPropertyValue('--color-surface').trim()        || '#f8fafc';
      const text    = root.getPropertyValue('--color-text').trim()           || '#1e293b';
      const muted   = root.getPropertyValue('--color-text-muted').trim()     || '#64748b';
      const font    = root.getPropertyValue('--font-family-body').trim()     || 'Georgia, serif';
      const radius  = root.getPropertyValue('--widget-border-radius').trim() || '0.5rem';

      const uid    = this._uid || ('car' + (++_instanceCount));
      const slides = data.slides || [];
      const count  = slides.length;
      if (count === 0) { container.innerHTML = ''; return; }

      const showArrows = data.showArrows && count > 1;
      const showDots   = data.showDots   && count > 1;

      let slidesHtml = '';
      slides.forEach(function (slide) {
        let mediaHtml;
        if (slide.imageData) {
          const expW = slide.imageWidth && slide.imageWidth !== '100%'
            ? 'width:' + slide.imageWidth + ';max-width:100%;height:auto;object-fit:contain;display:block;margin:auto;'
            : 'width:100%;height:auto;object-fit:contain;display:block;';
          mediaHtml =
            '<img src="' + slide.imageData + '" alt="' + esc(slide.altText) + '" ' +
                'style="' + expW + '">';
        } else {
          const txt = slide.textContent || '';
          mediaHtml =
            '<div style="width:100%;height:100%;display:flex;align-items:center;' +
                'justify-content:center;padding:24px;font-family:' + font + ';' +
                'color:' + text + ';line-height:1.6;overflow-y:auto;text-align:center;">' +
              (txt || '<em style="color:' + muted + ';">No content</em>') +
            '</div>';
        }

        const captionHtml = (slide.imageData && slide.caption)
          ? '<div style="padding:8px 12px;font-family:' + font + ';font-size:13px;' +
              'color:' + muted + ';text-align:center;border-top:1px solid ' + border + ';' +
              'background:' + surface + ';">' + esc(slide.caption) + '</div>'
          : '';

        slidesHtml +=
          '<div class="hce-car-slide" style="min-width:100%;flex-shrink:0;display:flex;flex-direction:column;">' +
            '<div style="aspect-ratio:16/9;overflow:hidden;background:' + surface + ';">' +
              mediaHtml +
            '</div>' +
            captionHtml +
          '</div>';
      });

      const arrowBase =
        'position:absolute;top:50%;transform:translateY(-50%);' +
        'background:' + primary + ';color:#fff;border:none;border-radius:50%;' +
        'width:36px;height:36px;font-size:24px;line-height:1;cursor:pointer;' +
        'display:flex;align-items:center;justify-content:center;z-index:2;opacity:0.85;';

      const prevArrow = showArrows
        ? '<button class="hce-car-prev" aria-label="Previous slide" style="' + arrowBase + 'left:8px;">&#8249;</button>'
        : '';
      const nextArrow = showArrows
        ? '<button class="hce-car-next" aria-label="Next slide" style="' + arrowBase + 'right:8px;">&#8250;</button>'
        : '';

      let dotsHtml = '';
      if (showDots) {
        let inner = '';
        for (let i = 0; i < count; i++) {
          inner +=
            '<button class="hce-car-dot' + (i === 0 ? ' hce-car-dot--active' : '') + '" ' +
                'aria-label="Slide ' + (i + 1) + '" aria-current="' + (i === 0) + '" ' +
                'style="width:8px;height:8px;border-radius:50%;border:none;cursor:pointer;padding:0;' +
                'background:' + (i === 0 ? primary : border) + ';transition:background 0.2s;"></button>';
        }
        dotsHtml =
          '<div style="display:flex;justify-content:center;gap:6px;padding:10px 0 6px;background:' + surface + ';">' +
            inner +
          '</div>';
      }

      const script =
        '(function(){' +
          'var root=document.querySelector(\'[data-carousel="' + uid + '"]\');' +
          'if(!root)return;' +
          'var track=root.querySelector(".hce-car-track");' +
          'var dots=root.querySelectorAll(".hce-car-dot");' +
          'var total=' + count + ';' +
          'var current=0;' +
          'var cp="' + primary + '";' +
          'var ci="' + border + '";' +
          'function goto(n){' +
            'current=((n%total)+total)%total;' +
            'track.style.transform="translateX(-"+(current*100)+"%)";' +
            'dots.forEach(function(d,i){' +
              'd.style.background=i===current?cp:ci;' +
              'd.setAttribute("aria-current",String(i===current));' +
            '});' +
          '}' +
          'var prev=root.querySelector(".hce-car-prev");' +
          'var next=root.querySelector(".hce-car-next");' +
          'if(prev)prev.addEventListener("click",function(e){e.stopPropagation();goto(current-1);});' +
          'if(next)next.addEventListener("click",function(e){e.stopPropagation();goto(current+1);});' +
          'dots.forEach(function(d,i){d.addEventListener("click",function(e){e.stopPropagation();goto(i);});});' +
          (data.autoplay ? 'setInterval(function(){goto(current+1);},3000);' : '') +
        '})();';

      container.innerHTML =
        '<style>' +
          '@media(prefers-reduced-motion:reduce){.hce-car-track{transition:none !important;}}' +
        '</style>' +
        '<div data-carousel="' + uid + '" ' +
            'style="border:1px solid ' + border + ';border-radius:' + radius + ';overflow:hidden;margin:8px 0;">' +
          '<div style="position:relative;overflow:hidden;">' +
            '<div class="hce-car-track" ' +
                'style="display:flex;transition:transform 0.4s ease;will-change:transform;">' +
              slidesHtml +
            '</div>' +
            prevArrow +
            nextArrow +
          '</div>' +
          dotsHtml +
        '</div>' +
        '<' + 'script>' + script + '</' + 'script>';
    }

    renderExportNoJS(container, data, ctx) {
      const root    = getComputedStyle(document.documentElement);
      const primary = root.getPropertyValue('--color-primary').trim()        || '#2563eb';
      const border  = root.getPropertyValue('--color-border').trim()         || '#e2e8f0';
      const surface = root.getPropertyValue('--color-surface').trim()        || '#f8fafc';
      const text    = root.getPropertyValue('--color-text').trim()           || '#1e293b';
      const muted   = root.getPropertyValue('--color-text-muted').trim()     || '#64748b';
      const font    = root.getPropertyValue('--font-family-body').trim()     || 'Georgia, serif';
      const radius  = root.getPropertyValue('--widget-border-radius').trim() || '0.5rem';

      const uid    = (ctx && ctx.uid) || ('car' + Math.random().toString(36).slice(2, 7));
      const slides = data.slides || [];
      const count  = slides.length;
      if (count === 0) { container.innerHTML = ''; return; }

      const showArrows = data.showArrows && count > 1;
      const showDots   = data.showDots   && count > 1;

      const arrowBase =
        'position:absolute;top:50%;transform:translateY(-50%);' +
        'background:' + primary + ';color:#fff;border:none;border-radius:50%;' +
        'width:36px;height:36px;font-size:24px;line-height:1;cursor:pointer;' +
        'display:flex;align-items:center;justify-content:center;z-index:2;opacity:0.85;' +
        'text-decoration:none;box-sizing:border-box;';

      let slidesHtml = '';
      slides.forEach(function (slide, i) {
        const sid = uid + '-s' + i;

        let mediaHtml;
        if (slide.imageData) {
          const expW = slide.imageWidth && slide.imageWidth !== '100%'
            ? 'width:' + slide.imageWidth + ';max-width:100%;height:auto;object-fit:contain;display:block;margin:auto;'
            : 'width:100%;height:auto;object-fit:contain;display:block;';
          mediaHtml =
            '<img src="' + slide.imageData + '" alt="' + esc(slide.altText) + '" ' +
                'style="' + expW + '">';
        } else {
          const txt = slide.textContent || '';
          mediaHtml =
            '<div style="width:100%;height:100%;display:flex;align-items:center;' +
                'justify-content:center;padding:24px;font-family:' + font + ';' +
                'color:' + text + ';line-height:1.6;overflow-y:auto;text-align:center;">' +
              (txt || '<em style="color:' + muted + ';">No content</em>') +
            '</div>';
        }

        const captionHtml = (slide.imageData && slide.caption)
          ? '<div style="padding:8px 12px;font-family:' + font + ';font-size:13px;' +
              'color:' + muted + ';text-align:center;border-top:1px solid ' + border + ';' +
              'background:' + surface + ';">' + esc(slide.caption) + '</div>'
          : '';

        // Arrows are clamped anchors: first slide's prev points to itself,
        // last slide's next points to itself (bounded — no infinite loop).
        const prevTarget = uid + '-s' + (i > 0 ? i - 1 : i);
        const nextTarget = uid + '-s' + (i < count - 1 ? i + 1 : i);
        const prevArrow = showArrows
          ? '<a class="hce-car-prev" href="#' + prevTarget + '" aria-label="Previous slide" style="' + arrowBase + 'left:8px;">&#8249;</a>'
          : '';
        const nextArrow = showArrows
          ? '<a class="hce-car-next" href="#' + nextTarget + '" aria-label="Next slide" style="' + arrowBase + 'right:8px;">&#8250;</a>'
          : '';

        slidesHtml +=
          '<div class="hce-car-slide" id="' + sid + '" ' +
              'style="position:relative;min-width:100%;flex-shrink:0;scroll-snap-align:start;display:flex;flex-direction:column;">' +
            '<div style="aspect-ratio:16/9;overflow:hidden;background:' + surface + ';">' +
              mediaHtml +
            '</div>' +
            captionHtml +
            prevArrow +
            nextArrow +
          '</div>';
      });

      let dotsHtml = '';
      let dotRules = '';
      if (showDots) {
        let inner = '';
        for (let i = 0; i < count; i++) {
          const sid = uid + '-s' + i;
          inner +=
            '<a class="hce-car-dot" href="#' + sid + '" ' +
                'aria-label="Slide ' + (i + 1) + '" ' +
                'style="width:8px;height:8px;border-radius:50%;border:none;cursor:pointer;padding:0;' +
                'background:' + border + ';transition:background 0.2s;"></a>';
          // Active-dot highlight via :target (scoped under #uid). !important so it
          // beats the inline default background on the dot anchor.
          dotRules +=
            '#' + uid + ' .hce-car-scroll:has(#' + sid + ':target) ~ .hce-car-dots a[href="#' + sid + '"]' +
              '{background:' + primary + ' !important;}';
        }
        // Default active = first dot when no slide in THIS carousel is targeted.
        dotRules +=
          '#' + uid + ':not(:has(:target)) .hce-car-dots a[href="#' + uid + '-s0"]{background:' + primary + ' !important;}';
        dotsHtml =
          '<div class="hce-car-dots" ' +
              'style="display:flex;justify-content:center;gap:6px;padding:10px 0 6px;background:' + surface + ';">' +
            inner +
          '</div>';
      }

      const styleBlock =
        '<style>' +
          '#' + uid + ' .hce-car-scroll{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;' +
            'scroll-behavior:smooth;-webkit-overflow-scrolling:touch;}' +
          '#' + uid + ' .hce-car-scroll::-webkit-scrollbar{display:none;}' +
          '#' + uid + ' .hce-car-scroll{scrollbar-width:none;}' +
          dotRules +
          '@media(prefers-reduced-motion:reduce){#' + uid + ' .hce-car-scroll{scroll-behavior:auto;}}' +
        '</style>';

      container.innerHTML =
        '<div id="' + uid + '" data-carousel="' + uid + '" ' +
            'style="border:1px solid ' + border + ';border-radius:' + radius + ';overflow:hidden;margin:8px 0;">' +
          styleBlock +
          '<div class="hce-car-scroll">' +
            slidesHtml +
          '</div>' +
          dotsHtml +
        '</div>';
    }

    edit(data) {
      this._openEditModal(data);
    }

    _openEditModal(data) {
      const self    = this;
      const working = JSON.parse(JSON.stringify(data));
      let selectedIdx = 0;

      // Track the active ImageUploadField so it can be flushed before slide
      // switches and on modal close.
      let currentImgField      = null;
      let currentImgFieldSlice = -1;
      let currentRichField     = null;
      let currentRichFieldIdx  = -1;

      function saveCurrentRichField() {
        if (currentRichField && currentRichFieldIdx >= 0 && currentRichFieldIdx < working.slides.length) {
          working.slides[currentRichFieldIdx].textContent = currentRichField.getHtml();
        }
        if (currentRichField) { currentRichField.destroy(); currentRichField = null; }
        currentRichFieldIdx = -1;
      }

      function saveCurrentImgField() {
        if (!currentImgField || currentImgFieldSlice < 0) return;
        const slide = working.slides[currentImgFieldSlice];
        if (slide) {
          const v = currentImgField.getValue();
          slide.imageData  = v.src;
          slide.imageWidth = v.width;
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
      dialog.setAttribute('aria-labelledby', 'car-edit-title');
      dialog.style.width = '640px';

      const header = document.createElement('div');
      header.className = 'widget-modal-header';
      const titleEl = document.createElement('span');
      titleEl.id = 'car-edit-title';
      titleEl.textContent = 'Edit Carousel';
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
        'width:170px;flex-shrink:0;border-right:1px solid var(--color-border);display:flex;flex-direction:column;';

      const slideListEl = document.createElement('div');
      slideListEl.style.cssText = 'flex:1;overflow-y:auto;';

      const addSlideBtn = document.createElement('button');
      addSlideBtn.type = 'button';
      addSlideBtn.textContent = '+ Add Slide';
      addSlideBtn.style.cssText =
        'padding:8px 10px;font-size:12px;font-family:var(--font-family-ui);' +
        'border:none;border-top:1px solid var(--color-border);' +
        'background:transparent;cursor:pointer;color:var(--color-primary);text-align:left;';

      const settingsWrap = document.createElement('div');
      settingsWrap.style.cssText =
        'padding:10px;border-top:1px solid var(--color-border);' +
        'font-size:12px;font-family:var(--font-family-ui);display:flex;flex-direction:column;gap:6px;';

      function makeToggle(label, key) {
        const row = document.createElement('label');
        row.style.cssText = 'display:flex;align-items:center;gap:6px;cursor:pointer;color:var(--color-text);';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = working[key];
        cb.addEventListener('change', function () { working[key] = cb.checked; });
        row.appendChild(cb);
        row.appendChild(document.createTextNode(label));
        return row;
      }
      settingsWrap.appendChild(makeToggle('Show arrows', 'showArrows'));
      settingsWrap.appendChild(makeToggle('Show dots',   'showDots'));
      settingsWrap.appendChild(makeToggle('Autoplay',    'autoplay'));

      // Navigation style (F6): JS buttons/dots vs pure CSS scroll-snap.
      const navLabel = document.createElement('div');
      navLabel.textContent = 'Navigation in exports';
      navLabel.style.cssText = 'margin-top:4px;color:var(--color-text-muted);';
      const navSelect = document.createElement('select');
      navSelect.className = 'widget-modal-input';
      [{ v: 'buttons', l: 'Buttons & dots (JavaScript)' },
       { v: 'snap',    l: 'Swipe / scroll-snap (no JavaScript)' }].forEach(function (opt) {
        const o = document.createElement('option');
        o.value = opt.v;
        o.textContent = opt.l;
        if ((working.navStyle || 'buttons') === opt.v) o.selected = true;
        navSelect.appendChild(o);
      });
      navSelect.addEventListener('change', function () { working.navStyle = navSelect.value; });
      settingsWrap.appendChild(navLabel);
      settingsWrap.appendChild(navSelect);

      leftCol.appendChild(slideListEl);
      leftCol.appendChild(addSlideBtn);
      leftCol.appendChild(settingsWrap);

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

      function makeReorderBtn(symbol, isSel) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = symbol;
        btn.style.cssText =
          'background:none;border:none;cursor:pointer;font-size:9px;padding:0 1px;line-height:1;' +
          'color:' + (isSel ? 'rgba(255,255,255,0.75)' : 'var(--color-text-muted)') + ';';
        return btn;
      }

      function renderSlideList() {
        slideListEl.innerHTML = '';
        working.slides.forEach(function (slide, idx) {
          const isSel = idx === selectedIdx;
          const row = document.createElement('div');
          row.style.cssText =
            'display:flex;align-items:center;padding:7px 10px;cursor:pointer;gap:2px;' +
            'font-size:12px;font-family:var(--font-family-ui);' +
            (isSel ? 'background:var(--color-primary);color:#fff;' : 'color:var(--color-text);');

          const label = document.createElement('span');
          label.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
          label.textContent = 'Slide ' + (idx + 1) + (slide.imageData ? ' 🖼' : '');

          const upBtn   = makeReorderBtn('▲', isSel);
          const downBtn = makeReorderBtn('▼', isSel);

          upBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (idx === 0) return;
            working.slides.splice(idx - 1, 0, working.slides.splice(idx, 1)[0]);
            selectedIdx = idx - 1;
            renderSlideList();
            renderRight();
          });
          downBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (idx === working.slides.length - 1) return;
            working.slides.splice(idx + 1, 0, working.slides.splice(idx, 1)[0]);
            selectedIdx = idx + 1;
            renderSlideList();
            renderRight();
          });

          row.appendChild(label);
          row.appendChild(upBtn);
          row.appendChild(downBtn);

          if (working.slides.length > 2) {
            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.textContent = '✕';
            delBtn.style.cssText =
              'background:none;border:none;cursor:pointer;font-size:10px;padding:0 2px;' +
              'color:' + (isSel ? 'rgba(255,255,255,0.75)' : 'var(--color-text-muted)') + ';';
            delBtn.addEventListener('click', function (e) {
              e.stopPropagation();
              working.slides.splice(idx, 1);
              if (selectedIdx >= working.slides.length) selectedIdx = working.slides.length - 1;
              renderSlideList();
              renderRight();
            });
            row.appendChild(delBtn);
          }

          row.addEventListener('click', function () {
            selectedIdx = idx;
            renderSlideList();
            renderRight();
          });
          slideListEl.appendChild(row);
        });

        addSlideBtn.disabled = working.slides.length >= 12;
        addSlideBtn.style.opacity = working.slides.length >= 12 ? '0.4' : '1';
      }

      function renderRight() {
        saveCurrentImgField();
        saveCurrentRichField();
        rightCol.innerHTML = '';
        const slide = working.slides[selectedIdx];
        if (!slide) return;

        currentImgFieldSlice = selectedIdx;
        currentRichFieldIdx  = selectedIdx;

        // ── Image field (ImageUploadField) ────────────────────────────────
        const imgSection = document.createElement('div');
        imgSection.className = 'widget-modal-field';
        const imgLabel = document.createElement('label');
        imgLabel.className = 'widget-modal-label';
        imgLabel.textContent = 'Image (optional)';
        imgSection.appendChild(imgLabel);
        const imgMount = document.createElement('div');
        imgSection.appendChild(imgMount);

        currentImgField = new ImageUploadField(imgMount, {
          src:   slide.imageData  || '',
          width: slide.imageWidth || '100%',
        }, function (value) {
          const i = selectedIdx;
          if (!working.slides[i]) return;
          working.slides[i].imageData  = value.src;
          working.slides[i].imageWidth = value.width;
          renderSlideList();
          updateImageFields();
        });

        // ── Alt text ──────────────────────────────────────────────────────
        const altWrap = document.createElement('div');
        altWrap.className = 'widget-modal-field';
        const altLabel = document.createElement('label');
        altLabel.className = 'widget-modal-label';
        altLabel.textContent = 'Alt text';
        const altInput = document.createElement('input');
        altInput.className = 'widget-modal-input';
        altInput.type = 'text';
        altInput.value = slide.altText || '';
        altInput.placeholder = 'Describe the image for screen readers';
        altInput.addEventListener('input', function () {
          working.slides[selectedIdx].altText = altInput.value;
        });
        altWrap.appendChild(altLabel);
        altWrap.appendChild(altInput);

        // ── Caption ───────────────────────────────────────────────────────
        const captionWrap = document.createElement('div');
        captionWrap.className = 'widget-modal-field';
        const captionLabel = document.createElement('label');
        captionLabel.className = 'widget-modal-label';
        captionLabel.textContent = 'Caption (optional)';
        const captionInput = document.createElement('input');
        captionInput.className = 'widget-modal-input';
        captionInput.type = 'text';
        captionInput.value = slide.caption || '';
        captionInput.placeholder = 'Shown below the image';
        captionInput.addEventListener('input', function () {
          working.slides[selectedIdx].caption = captionInput.value;
        });
        captionWrap.appendChild(captionLabel);
        captionWrap.appendChild(captionInput);

        // ── Text content ──────────────────────────────────────────────────
        const textWrap = document.createElement('div');
        textWrap.className = 'widget-modal-field';
        textWrap.style.flex = '1';

        const textLabelRow = document.createElement('div');
        textLabelRow.style.cssText = 'display:flex;align-items:center;gap:8px;';
        const textLabel = document.createElement('label');
        textLabel.className = 'widget-modal-label';
        textLabel.textContent = 'Text content';
        const textHint = document.createElement('span');
        textHint.style.cssText =
          'font-size:10px;color:var(--color-text-muted);font-family:var(--font-family-ui);white-space:nowrap;';
        textHint.textContent = 'shown when no image';
        textLabelRow.appendChild(textLabel);
        textLabelRow.appendChild(textHint);

        const textMount = document.createElement('div');
        currentRichField = new RichTextField(textMount, slide.textContent || '');

        textWrap.appendChild(textLabelRow);
        textWrap.appendChild(textMount);

        function updateImageFields() {
          const hasImg = !!working.slides[selectedIdx].imageData;
          altWrap.style.display     = hasImg ? '' : 'none';
          captionWrap.style.display = hasImg ? '' : 'none';
        }

        rightCol.appendChild(imgSection);
        rightCol.appendChild(altWrap);
        rightCol.appendChild(captionWrap);
        rightCol.appendChild(textWrap);

        updateImageFields();
      }

      addSlideBtn.addEventListener('click', function () {
        if (working.slides.length >= 12) return;
        working.slides.push({
          id:          'slide-' + Date.now(),
          imageData:   null,
          imageWidth:  '100%',
          altText:     '',
          caption:     '',
          textContent: '',
        });
        selectedIdx = working.slides.length - 1;
        renderSlideList();
        renderRight();
      });

      function close(save) {
        saveCurrentImgField();
        saveCurrentRichField();
        document.removeEventListener('keydown', onKey);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (!save) return;
        self._currentSlide = Math.min(self._currentSlide || 0, working.slides.length - 1);
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

      renderSlideList();
      renderRight();
    }
  }

  WidgetRegistry.register(CarouselBlot);
})();
