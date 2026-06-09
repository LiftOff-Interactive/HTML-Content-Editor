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

  // Register directly with Quill — not a palette widget, no WidgetRegistry entry.
  Quill.register('formats/resizable-image', ResizableImageBlot);

  // Expose for export.js to call renderExport without the registry.
  window.ResizableImageBlot = ResizableImageBlot;
})();
