(function () {
  'use strict';

  const toolbarOptions = [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean'],
  ];

  const quill = new Quill('#editor', {
    theme: 'snow',
    placeholder: 'Start writing, or press / to insert a widget',
    modules: {
      toolbar: toolbarOptions,
    },
  });

  // Keep the Quill delta in sync when a widget's data changes after an edit.
  document.getElementById('editor').addEventListener('widget-updated', function (e) {
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
    const h1 = getDocumentTitle(quill.getContents());
    document.title = h1 ? h1 + ' — Content Editor' : 'Content Editor';
  }

  quill.on('text-change', function (delta, oldDelta, source) {
    if (source === Quill.sources.USER) updateTabTitle();
  });

  window.contentEditor = {
    quill,
    getDocumentTitle: function () {
      return getDocumentTitle(quill.getContents());
    },
  };
})();
