(function () {
  'use strict';

  const toolbarOptions = [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ align: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['image'],
    ['clean'],
  ];

  const quill = new Quill('#editor', {
    theme: 'snow',
    placeholder: 'Start writing, or press / to insert a widget',
    modules: {
      toolbar: toolbarOptions,
    },
  });

  // Override Quill's default image toolbar handler to insert ResizableImageBlot.
  quill.getModule('toolbar').addHandler('image', function () {
    openImagePicker().then(function (base64) {
      if (!base64) return;
      const range = quill.getSelection(true);
      quill.insertEmbed(
        range.index,
        'resizable-image',
        { src: base64, width: 480, alt: '' },
        Quill.sources.USER
      );
      quill.setSelection(range.index + 1, Quill.sources.SILENT);
    });
  });

  // Drag-and-drop image files into the editor.
  const editorEl = document.getElementById('editor');

  // Use capture:true so our handlers fire before Quill's clipboard module,
  // preventing Quill from also inserting a plain <img> alongside our blot.
  editorEl.addEventListener('dragover', function (e) {
    if (e.dataTransfer && e.dataTransfer.types &&
        Array.from(e.dataTransfer.types).indexOf('Files') !== -1) {
      e.preventDefault();
    }
  }, true);

  editorEl.addEventListener('drop', function (e) {
    const files = e.dataTransfer && e.dataTransfer.files;
    if (!files || !files.length) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;
    e.preventDefault();
    e.stopPropagation();

    const reader = new FileReader();
    reader.onload = function (ev) {
      const range = quill.getSelection() || { index: Math.max(0, quill.getLength() - 1) };
      quill.insertEmbed(
        range.index,
        'resizable-image',
        { src: ev.target.result, width: 480, alt: '' },
        Quill.sources.USER
      );
      quill.setSelection(range.index + 1, Quill.sources.SILENT);
    };
    reader.readAsDataURL(file);
  }, true);

  // Open the edit modal when the user clicks any widget blot.
  // Uses event delegation so it works for both newly inserted and loaded blots,
  // regardless of when attach() fired relative to Quill's reconcile pass.
  editorEl.addEventListener('click', function (e) {
    const widgetNode = e.target.closest('[data-widget-type]');
    if (!widgetNode) return;
    const blot = Quill.find(widgetNode);
    if (blot && typeof blot.edit === 'function') {
      blot.edit(blot.constructor.value(widgetNode));
    }
  });

  // Keep the Quill delta in sync when a widget's data changes after an edit.
  // ResizableImageBlot also fires this event on resize completion.
  editorEl.addEventListener('widget-updated', function (e) {
    const blot    = e.detail.blot;
    const newData = e.detail.data;
    const index   = quill.getIndex(blot);
    quill.deleteText(index, 1, Quill.sources.SILENT);
    quill.insertEmbed(index, blot.constructor.blotName, newData, Quill.sources.SILENT);
  });

  // Parse the delta for the first H1 text — used for the browser tab title and
  // as the default filename in save and export.
  function getDocumentTitle(delta) {
    const ops = (delta && delta.ops) || [];
    let lineBuffer = '';
    for (const op of ops) {
      if (typeof op.insert !== 'string') { lineBuffer = ''; continue; }
      const parts = op.insert.split('\n');
      for (let i = 0; i < parts.length; i++) {
        lineBuffer += parts[i];
        if (i < parts.length - 1) {
          if (op.attributes && op.attributes.header === 1 && lineBuffer) {
            return lineBuffer;
          }
          lineBuffer = '';
        }
      }
    }
    return '';
  }

  function updateTabTitle() {
    const t = window.contentEditor.getDocumentTitle();
    document.title = t ? t + ' — Content Editor' : 'Content Editor';
  }

  quill.on('text-change', function (delta, oldDelta, source) {
    if (source === Quill.sources.USER) updateTabTitle();
  });

  window.contentEditor = {
    quill,
    // Explicit document name (F5) wins; empty falls back to the first H1.
    getDocumentTitle: function () {
      var explicit = window.HCEDocState && window.HCEDocState.getTitle();
      return explicit || getDocumentTitle(quill.getContents());
    },
  };

  // ── Utilities ─────────────────────────────────────────────────────────────

  function openImagePicker() {
    return new Promise(function (resolve) {
      const input = document.createElement('input');
      input.type   = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      document.body.appendChild(input);
      input.addEventListener('change', function () {
        const file = input.files[0];
        if (input.parentNode) input.parentNode.removeChild(input);
        if (!file) { resolve(null); return; }
        const reader = new FileReader();
        reader.onload  = function (ev) { resolve(ev.target.result); };
        reader.onerror = function ()   { resolve(null); };
        reader.readAsDataURL(file);
      });
      input.click();
    });
  }
})();
