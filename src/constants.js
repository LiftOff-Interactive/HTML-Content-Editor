(function () {
  'use strict';
  // Single source of truth for the persisted save-format version.
  // Both save-load.js and html-roundtrip.js read this so the two can never drift
  // (R4). v3 introduces a discriminated union keyed on `kind` ('widgets'|'course').
  window.HCE_SAVE_VERSION = 3;
})();
