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

  // Expose globally so future modules (save, export, widgets) can access the editor
  window.contentEditor = { quill };
})();
