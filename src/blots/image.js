(function () {
  'use strict';

  const BlockEmbed = Quill.import('blots/block/embed');

  class ResizableImageBlot extends BlockEmbed {
    static blotName = 'resizable-image';
    static tagName  = 'div';

    static create(value) {
      const node = super.create();
      node.setAttribute('contenteditable', 'false');
      node.classList.add('hce-image-wrapper');

      const img = document.createElement('img');
      img.src            = value.src   || '';
      img.alt            = value.alt   || '';
      img.style.width    = Number(value.width || 480) + 'px';
      img.style.height   = 'auto';
      img.style.display  = 'block';
      img.style.maxWidth = '100%';
      img.draggable      = false;

      const handle = document.createElement('div');
      handle.className = 'hce-image-resize-handle';
      handle.setAttribute('aria-hidden', 'true');

      // Keep the outer wrapper exactly as wide as the image so the
      // resize handle always appears at the image's bottom-right corner.
      node.style.width = img.style.width;

      node.appendChild(img);
      node.appendChild(handle);
      _attachResize(node, img);

      return node;
    }

    static value(node) {
      const img = node.querySelector('img');
      if (!img) return { src: '', width: 480, alt: '' };
      const w = parseInt(img.style.width, 10);
      return {
        src:   img.getAttribute('src') || '',
        width: isNaN(w) ? 480 : w,
        alt:   img.getAttribute('alt') || '',
      };
    }
  }

  function _attachResize(wrapper, img) {
    const handle = wrapper.querySelector('.hce-image-resize-handle');
    if (!handle) return;

    handle.addEventListener('mousedown', function (e) {
      e.preventDefault();
      e.stopPropagation();

      const startX     = e.clientX;
      const startWidth = img.offsetWidth || parseInt(img.style.width, 10) || 480;

      wrapper.classList.add('is-resizing');

      function onMove(ev) {
        const w = Math.max(60, startWidth + (ev.clientX - startX)) + 'px';
        img.style.width     = w;
        wrapper.style.width = w;
      }

      function onUp() {
        wrapper.classList.remove('is-resizing');
        // Suppress the click that lands right after a drag-resize so it
        // doesn't also open the edit modal.
        wrapper._hceResizedAt = Date.now();
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);

        // Sync the Quill delta via the same widget-updated event that editor.js
        // already handles for all other blots.
        const blotInstance = Quill.find(wrapper);
        if (blotInstance) {
          wrapper.dispatchEvent(new CustomEvent('widget-updated', {
            bubbles: true,
            detail: { blot: blotInstance, data: ResizableImageBlot.value(wrapper) },
          }));
        }
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  // Click-to-edit (Stage 11 F3): alt text is required for WCAG 1.1.1, and this
  // modal is the only way to set it on a plain inserted image. Called from
  // editor.js's delegated click handler.
  ResizableImageBlot.openEditModal = function (wrapper) {
    if (wrapper._hceResizedAt && Date.now() - wrapper._hceResizedAt < 400) return;
    var current = ResizableImageBlot.value(wrapper);
    WidgetModal.open({
      title: 'Edit Image',
      fields: [
        { key: 'alt',   label: 'Alt text (describes the image for screen readers — leave empty only if decorative)', type: 'text' },
        { key: 'width', label: 'Width (px)', type: 'text' },
      ],
      data: { alt: current.alt, width: String(current.width) },
    }).then(function (result) {
      if (!result) return;
      var width = parseInt(result.width, 10);
      var newData = {
        src: current.src,
        alt: String(result.alt || ''),
        width: isNaN(width) ? current.width : Math.max(60, width),
      };
      var blot = Quill.find(wrapper);
      if (!blot) return;
      wrapper.dispatchEvent(new CustomEvent('widget-updated', {
        bubbles: true,
        detail: { blot: blot, data: newData },
      }));
    });
  };

  // Register directly with Quill — not a palette widget, no WidgetRegistry entry.
  Quill.register('formats/resizable-image', ResizableImageBlot);

  // Expose for export.js to call renderExport without the registry.
  window.ResizableImageBlot = ResizableImageBlot;
})();
