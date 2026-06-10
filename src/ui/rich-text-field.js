(function () {
  'use strict';

  const TOOLBAR = [
    ['bold', 'italic', 'underline', 'strike'],
    [{ size: ['small', false, 'large', 'huge'] }],
    [{ color: [] }],
    [{ align: [] }],
    ['link'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean'],
  ];

  class RichTextField {
    constructor(mountEl, initialHtml) {
      const container = document.createElement('div');
      mountEl.appendChild(container);
      this._quill = new Quill(container, {
        theme: 'snow',
        modules: { toolbar: TOOLBAR },
      });
      if (initialHtml) {
        this._quill.clipboard.dangerouslyPasteHTML(initialHtml);
      }
    }

    getHtml() {
      if (!this._quill) return '';
      const html = this._quill.root.innerHTML;
      // Quill's empty-state sentinel
      if (html === '<p><br></p>' || html === '') return '';
      return html;
    }

    focus() {
      if (this._quill) this._quill.focus();
    }

    destroy() {
      this._quill = null;
    }
  }

  window.RichTextField = RichTextField;
})();
