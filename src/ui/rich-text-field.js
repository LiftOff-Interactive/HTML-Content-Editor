(function () {
  'use strict';

  /**
   * RichTextField — wraps a minimal Quill instance for use inside widget edit modals.
   *
   * Usage:
   *   const field = new RichTextField(mountEl, '<p>Initial <strong>HTML</strong></p>');
   *   field.getHtml()  → current innerHTML ('' for empty)
   *   field.focus()
   *   field.destroy()  ← must call when modal closes to avoid leaking Quill instances
   */
  class RichTextField {
    constructor(mountEl, initialHtml) {
      this._mount = mountEl;

      // Outer wrapper — scopes Snow theme overrides defined in main.css
      this._wrapper = document.createElement('div');
      this._wrapper.className = 'rtf-wrapper';
      mountEl.appendChild(this._wrapper);

      // Quill requires an inner element to attach to
      const editorEl = document.createElement('div');
      this._wrapper.appendChild(editorEl);

      this._quill = new Quill(editorEl, {
        theme: 'snow',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ size: ['small', false, 'large', 'huge'] }],
            [{ color: [] }],
            ['link'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ align: [] }],
            ['clean'],
          ],
        },
      });

      // Load initial HTML without triggering change events
      const html = initialHtml || '';
      if (html) {
        this._quill.clipboard.dangerouslyPasteHTML(html, Quill.sources.SILENT);
        // Move cursor to end
        const len = this._quill.getLength();
        this._quill.setSelection(len, 0, Quill.sources.SILENT);
      }
    }

    /**
     * Returns the current HTML content.
     * Returns '' for an empty editor (Quill emits '<p><br></p>' internally).
     */
    getHtml() {
      if (!this._quill) return '';
      const raw = this._quill.root.innerHTML;
      if (raw === '<p><br></p>' || raw === '') return '';
      return raw;
    }

    focus() {
      if (this._quill) this._quill.focus();
    }

    destroy() {
      if (!this._quill) return;
      // Detach DOM — Quill 2 has no formal destroy() but removing the element is safe
      if (this._wrapper && this._wrapper.parentNode) {
        this._wrapper.parentNode.removeChild(this._wrapper);
      }
      this._quill = null;
      this._wrapper = null;
      this._mount = null;
    }
  }

  window.RichTextField = RichTextField;
})();
