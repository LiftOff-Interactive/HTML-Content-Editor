(function () {
  'use strict';

  const IMAGE_WARN_BYTES = 1048576; // 1 MB

  /**
   * ImageUploadField — reusable compound image field for widget edit modals.
   *
   * Renders a file picker + URL input + live preview + resize handle into mountEl.
   *
   * @param {HTMLElement} mountEl       Container to render into.
   * @param {{ src: string, width: string }} initialValue
   * @param {function} [onChange]       Called with { src, width } on every change.
   */
  class ImageUploadField {
    constructor(mountEl, initialValue, onChange) {
      this._mount     = mountEl;
      this._onChange  = onChange  || null;
      this._destroyed = false;
      this._value     = {
        src:   (initialValue && initialValue.src)   || '',
        width: (initialValue && initialValue.width) || '100%',
      };
      this._resizeMove = null;
      this._resizeUp   = null;
      this._render();
    }

    getValue() {
      return { src: this._value.src, width: this._value.width };
    }

    destroy() {
      this._destroyed = true;
      if (this._resizeMove) document.removeEventListener('mousemove', this._resizeMove);
      if (this._resizeUp)   document.removeEventListener('mouseup',   this._resizeUp);
      this._resizeMove = null;
      this._resizeUp   = null;
    }

    _notify() {
      if (!this._destroyed && this._onChange) {
        this._onChange({ src: this._value.src, width: this._value.width });
      }
    }

    _render() {
      const self  = this;
      const mount = this._mount;
      mount.innerHTML = '';

      // ── File picker + URL row ─────────────────────────────────────────────
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:6px;';

      const fileBtn = document.createElement('button');
      fileBtn.type = 'button';
      fileBtn.style.cssText =
        'font-size:11px;font-family:var(--font-family-ui);color:var(--color-primary);' +
        'background:none;border:1px solid var(--color-border);border-radius:4px;' +
        'cursor:pointer;padding:3px 8px;white-space:nowrap;flex-shrink:0;';

      const fileInput = document.createElement('input');
      fileInput.type   = 'file';
      fileInput.accept = 'image/*';
      fileInput.style.display = 'none';

      const orSpan = document.createElement('span');
      orSpan.textContent = 'or';
      orSpan.style.cssText =
        'font-size:11px;color:var(--color-text-muted);' +
        'font-family:var(--font-family-ui);flex-shrink:0;';

      const urlInput = document.createElement('input');
      urlInput.type        = 'url';
      urlInput.placeholder = 'Paste image URL…';
      urlInput.className   = 'widget-modal-input';
      urlInput.style.flex  = '1';
      urlInput.style.minWidth  = '0';
      urlInput.style.fontSize  = '12px';

      row.appendChild(fileBtn);
      row.appendChild(fileInput);
      row.appendChild(orSpan);
      row.appendChild(urlInput);
      mount.appendChild(row);

      // ── Warning badges ────────────────────────────────────────────────────
      const urlWarn = document.createElement('div');
      urlWarn.style.cssText =
        'display:none;margin-top:4px;padding:4px 8px;' +
        'background:#fffbeb;border:1px solid #d97706;border-radius:4px;' +
        'font-size:11px;font-family:var(--font-family-ui);color:#92400e;';
      urlWarn.textContent = '⚠ URL images require an internet connection in the exported file.';
      mount.appendChild(urlWarn);

      const sizeWarn = document.createElement('div');
      sizeWarn.style.cssText =
        'display:none;margin-top:4px;padding:4px 8px;' +
        'background:#fef9c3;border:1px solid #ca8a04;border-radius:4px;' +
        'font-size:11px;font-family:var(--font-family-ui);color:#92400e;';
      mount.appendChild(sizeWarn);

      // ── Preview + resize handle ───────────────────────────────────────────
      const previewWrap = document.createElement('div');
      previewWrap.classList.add('hce-image-wrapper');
      previewWrap.style.cssText = 'display:none;margin-top:8px;max-width:100%;';

      const previewImg = document.createElement('img');
      previewImg.alt       = '';
      previewImg.draggable = false;
      previewImg.style.cssText =
        'display:block;max-width:100%;height:auto;' +
        'border:1px solid var(--color-border);border-radius:4px;';

      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'hce-image-resize-handle';
      resizeHandle.setAttribute('aria-hidden', 'true');

      previewWrap.appendChild(previewImg);
      previewWrap.appendChild(resizeHandle);
      mount.appendChild(previewWrap);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = '✕ Remove image';
      removeBtn.style.cssText =
        'display:none;margin-top:4px;font-size:11px;font-family:var(--font-family-ui);' +
        'color:var(--color-text-muted);background:none;border:none;cursor:pointer;padding:0;';
      mount.appendChild(removeBtn);

      // ── Sync DOM to current _value ────────────────────────────────────────
      function syncUI() {
        const hasSrc = !!self._value.src;
        const isUrl  = hasSrc && !self._value.src.startsWith('data:');

        fileBtn.textContent       = hasSrc ? '🔄 Replace' : '📷 Choose file';
        urlWarn.style.display     = isUrl  ? 'block' : 'none';
        previewWrap.style.display = hasSrc ? 'block' : 'none';
        removeBtn.style.display   = hasSrc ? 'block' : 'none';

        if (hasSrc) {
          previewImg.src = self._value.src;
          const w = self._value.width;
          const cssW = (w && w !== '100%') ? w : '100%';
          previewImg.style.width  = cssW;
          // Keep the wrapper exactly as wide as the image so the
          // resize handle sits at the image's bottom-right corner.
          previewWrap.style.width = cssW;
        }

        if (isUrl && !urlInput.value) {
          urlInput.value = self._value.src;
        } else if (!isUrl && urlInput.value && !hasSrc) {
          urlInput.value = '';
        }
      }

      syncUI();

      // ── File picker ───────────────────────────────────────────────────────
      fileBtn.addEventListener('click', function () { fileInput.click(); });

      fileInput.addEventListener('change', function () {
        if (self._destroyed) return;
        const file = fileInput.files[0];
        if (!file) return;
        if (file.size > IMAGE_WARN_BYTES) {
          sizeWarn.textContent =
            '⚠ This image is ' + (file.size / 1048576).toFixed(1) +
            ' MB. Large images increase export file size.';
          sizeWarn.style.display = 'block';
        } else {
          sizeWarn.style.display = 'none';
        }
        const reader = new FileReader();
        reader.onload = function (ev) {
          if (self._destroyed) return;
          self._value.src = ev.target.result;
          urlInput.value  = '';
          syncUI();
          self._notify();
        };
        reader.readAsDataURL(file);
        fileInput.value = '';
      });

      // ── URL input ─────────────────────────────────────────────────────────
      urlInput.addEventListener('input', function () {
        if (self._destroyed) return;
        self._value.src = urlInput.value.trim();
        sizeWarn.style.display = 'none';
        syncUI();
        self._notify();
      });

      // ── Remove button ─────────────────────────────────────────────────────
      removeBtn.addEventListener('click', function () {
        if (self._destroyed) return;
        self._value.src   = '';
        self._value.width = '100%';
        urlInput.value    = '';
        sizeWarn.style.display = 'none';
        syncUI();
        self._notify();
      });

      // ── Resize handle ─────────────────────────────────────────────────────
      resizeHandle.addEventListener('mousedown', function (e) {
        if (self._destroyed) return;
        e.preventDefault();
        e.stopPropagation();

        const startX     = e.clientX;
        const startWidth = previewImg.offsetWidth || 200;

        previewWrap.classList.add('is-resizing');

        self._resizeMove = function (ev) {
          const w = Math.max(60, startWidth + (ev.clientX - startX)) + 'px';
          previewImg.style.width  = w;
          previewWrap.style.width = w;
          self._value.width       = w;
        };

        self._resizeUp = function () {
          previewWrap.classList.remove('is-resizing');
          document.removeEventListener('mousemove', self._resizeMove);
          document.removeEventListener('mouseup',   self._resizeUp);
          self._resizeMove = null;
          self._resizeUp   = null;
        };

        document.addEventListener('mousemove', self._resizeMove);
        document.addEventListener('mouseup',   self._resizeUp);
      });
    }
  }

  window.ImageUploadField = ImageUploadField;
})();
