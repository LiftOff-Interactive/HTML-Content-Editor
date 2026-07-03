/**
 * HCEDocState — document-level state that isn't part of the Quill delta:
 *   title          — explicit document name (F5; '' = fall back to first H1)
 *   documentStyles — CSS captured from an imported HTML file (F3), re-emitted
 *                    by the export pipeline so imported documents keep their look.
 * Persisted in the v3 save payload; reset by New/Clear.
 */
(function () {
  'use strict';

  var _title = '';
  var _documentStyles = '';

  function notify() {
    document.dispatchEvent(new CustomEvent('hce-docstate-changed'));
  }

  window.HCEDocState = {
    getTitle: function () { return _title; },
    setTitle: function (t) { _title = String(t || ''); notify(); },
    getDocumentStyles: function () { return _documentStyles; },
    setDocumentStyles: function (css) { _documentStyles = String(css || ''); },
    reset: function () { _title = ''; _documentStyles = ''; notify(); },
  };
})();
