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
    placeholder: 'Start writing your content…',
    modules: {
      toolbar: toolbarOptions,
    },
  });

  // Keep the Quill delta in sync when a widget's data changes after an edit.
  // The blot fires 'widget-updated' on the DOM node; we replace it in-place.
  document.getElementById('editor').addEventListener('widget-updated', function (e) {
    const blot = e.detail.blot;
    const newData = e.detail.data;
    const index = quill.getIndex(blot);
    quill.deleteText(index, 1, Quill.sources.SILENT);
    quill.insertEmbed(index, blot.constructor.blotName, newData, Quill.sources.SILENT);
  });

  // Expose globally so future modules (save, export, widgets) can access the editor
  window.contentEditor = { quill };
})();
