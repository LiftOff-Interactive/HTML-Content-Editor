/**
 * HCEAutosave (Stage 11 F2) — localStorage draft so closing the tab never
 * loses work.
 *
 * - Debounced snapshot of the full v3 save payload on content / widget /
 *   theme / title changes, plus a 30s catch-all interval.
 * - On boot, an existing non-empty draft offers Restore / Discard.
 * - beforeunload flushes synchronously; the "leave site?" warning only fires
 *   when that flush FAILED (quota / storage unavailable) — if the draft is
 *   safely persisted, nagging the user adds nothing.
 * - Disabled when running inside an iframe: the verification suites mount
 *   index.html in iframes and their synthetic edits must never clobber the
 *   user's real draft. `enableForTest()` opts back in for the autosave suite.
 */
(function () {
  'use strict';

  var KEY = 'hce.autosave.v1';
  var DEBOUNCE_MS = 2000;

  var _timer = null;
  var _lastWritten = '';   // payload JSON last persisted (skip no-op writes)
  var _writeFailedWarned = false;
  var _enabled = window.self === window.top;
  var _bound = false;      // bindSources must be idempotent: init()'s deferred
                           // timer and enableForTest() can otherwise both run
                           // it, double-registering every listener + interval

  function storageAvailable() {
    try {
      var probe = '__hce_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return true;
    } catch (e) {
      return false;
    }
  }

  function showToast(msg) {
    var toast = document.createElement('div');
    toast.style.cssText =
      'position:fixed;bottom:20px;right:20px;z-index:9999;' +
      'background:#1e293b;color:#fff;padding:12px 16px;' +
      'border-radius:6px;font-size:13px;' +
      'font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;' +
      'box-shadow:0 4px 12px rgba(0,0,0,0.2);max-width:300px;line-height:1.4;';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 6000);
  }

  // ── Snapshot ──────────────────────────────────────────────────────────────

  function buildPayload() {
    var quill = window.contentEditor && window.contentEditor.quill;
    if (!quill) return null;
    return {
      version: 3,
      title: window.HCEDocState ? window.HCEDocState.getTitle() : '',
      documentStyles: window.HCEDocState ? window.HCEDocState.getDocumentStyles() : '',
      content: quill.getContents(),
      theme: window.ThemePanel ? window.ThemePanel.getCurrentTheme() : {},
    };
  }

  function payloadIsEmpty(payload) {
    if (!payload || !payload.content || !Array.isArray(payload.content.ops)) return true;
    var ops = payload.content.ops;
    var contentEmpty = ops.length === 0 ||
      (ops.length === 1 && ops[0].insert === '\n' && !ops[0].attributes);
    return contentEmpty && !payload.title && !payload.documentStyles;
  }

  // Returns true when the draft is safely persisted (or there was nothing to
  // persist), false when the write failed.
  function snapshotNow() {
    if (!_enabled) return true;
    var payload = buildPayload();
    if (!payload) return true;
    // Compare the payload alone — the stored record carries a savedAt
    // timestamp that would defeat the no-op check on every tick.
    var payloadJson = JSON.stringify(payload);
    if (payloadJson === _lastWritten) return true;
    try {
      localStorage.setItem(KEY,
        '{"savedAt":' + JSON.stringify(new Date().toISOString()) + ',"payload":' + payloadJson + '}');
      _lastWritten = payloadJson;
      _writeFailedWarned = false; // recovered — a future failure must warn again
      return true;
    } catch (e) {
      // Quota exceeded (image-heavy document) or storage unavailable.
      if (!_writeFailedWarned) {
        _writeFailedWarned = true;
        showToast('Autosave is unavailable for this document (too large for browser ' +
          'storage). Use Save to download your work — closing the tab will lose changes.');
      }
      return false;
    }
  }

  function scheduleSnapshot() {
    if (!_enabled) return;
    if (_timer) clearTimeout(_timer);
    _timer = setTimeout(function () {
      _timer = null;
      snapshotNow();
    }, DEBOUNCE_MS);
  }

  // ── Draft access ──────────────────────────────────────────────────────────

  function getDraft() {
    var raw;
    try { raw = localStorage.getItem(KEY); } catch (e) { return null; }
    if (!raw) return null;
    try {
      var record = JSON.parse(raw);
      if (!record || !record.payload || record.payload.version !== 3) return null;
      return record;
    } catch (e) {
      return null;
    }
  }

  function clearDraft() {
    try { localStorage.removeItem(KEY); } catch (e) { /* nothing to lose */ }
    _lastWritten = '';
  }

  function restoreDraft() {
    var record = getDraft();
    if (!record || !window.HCESaveLoad) return false;
    window.HCESaveLoad.applyPayload(record.payload);
    return true;
  }

  // ── Restore bar ───────────────────────────────────────────────────────────

  function formatWhen(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    var today = new Date();
    var sameDay = d.toDateString() === today.toDateString();
    var time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return sameDay ? 'today at ' + time : d.toLocaleDateString() + ' ' + time;
  }

  function offerRestore(record) {
    var bar = document.createElement('div');
    bar.className = 'hce-restore-bar';
    bar.setAttribute('role', 'status');
    bar.style.cssText =
      'position:fixed;top:64px;left:50%;transform:translateX(-50%);z-index:9998;' +
      'display:flex;align-items:center;gap:12px;' +
      'background:#1e293b;color:#fff;padding:10px 16px;border-radius:8px;' +
      'font-size:13px;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;' +
      'box-shadow:0 4px 16px rgba(0,0,0,0.25);max-width:min(560px,92vw);line-height:1.4;';

    var label = document.createElement('span');
    var when = formatWhen(record.savedAt);
    var draftTitle = (record.payload.title || '').trim();
    label.textContent = 'Unsaved draft' + (draftTitle ? ' "' + draftTitle + '"' : '') +
      (when ? ' from ' + when : '') + ' found.';

    function btn(text, primary) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.style.cssText =
        'border:none;border-radius:6px;padding:6px 12px;font-size:13px;cursor:pointer;' +
        'font-family:inherit;font-weight:600;' +
        (primary ? 'background:#2563eb;color:#fff;' : 'background:transparent;color:#cbd5e1;');
      return b;
    }

    var restoreBtn = btn('Restore', true);
    restoreBtn.className = 'hce-restore-btn';
    var discardBtn = btn('Discard', false);
    discardBtn.className = 'hce-discard-btn';

    function dismiss() {
      if (bar.parentNode) bar.parentNode.removeChild(bar);
    }
    restoreBtn.addEventListener('click', function () {
      restoreDraft();
      dismiss();
    });
    discardBtn.addEventListener('click', function () {
      clearDraft();
      dismiss();
    });

    bar.appendChild(label);
    bar.appendChild(restoreBtn);
    bar.appendChild(discardBtn);
    document.body.appendChild(bar);
  }

  // ── Wiring ────────────────────────────────────────────────────────────────

  function bindSources() {
    if (_bound) return;
    _bound = true;
    var quill = window.contentEditor && window.contentEditor.quill;
    if (quill) quill.on('text-change', scheduleSnapshot);

    var editorEl = document.getElementById('editor');
    if (editorEl) editorEl.addEventListener('widget-updated', scheduleSnapshot);

    // Title changes and New/Clear resets.
    document.addEventListener('hce-docstate-changed', scheduleSnapshot);

    // Theme panel: color inputs fire 'input'; selects/checkboxes 'change';
    // preset/reset buttons only 'click'.
    var panel = document.getElementById('theme-panel');
    if (panel) {
      panel.addEventListener('input', scheduleSnapshot);
      panel.addEventListener('change', scheduleSnapshot);
      panel.addEventListener('click', scheduleSnapshot);
    }

    // Catch-all for silent programmatic changes no event covers.
    setInterval(snapshotNow, 30000);

    window.addEventListener('beforeunload', function (e) {
      if (_timer) { clearTimeout(_timer); _timer = null; }
      var persisted = snapshotNow();
      if (!persisted) {
        // Only warn when the draft could NOT be saved — otherwise leaving is safe.
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  function init() {
    if (!_enabled) return;
    if (!storageAvailable()) {
      _enabled = false;
      return;
    }
    // Wait for the editor to exist (script order guarantees it, but modules
    // built at DOMContentLoaded may still be wiring up).
    var record = getDraft();
    if (record && !payloadIsEmpty(record.payload)) offerRestore(record);
    bindSources();
  }

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(init, 250);
  });

  window.HCEAutosave = {
    KEY: KEY,
    snapshotNow: snapshotNow,
    getDraft: getDraft,
    clearDraft: clearDraft,
    restoreDraft: restoreDraft,
    payloadIsEmpty: payloadIsEmpty,
    enableForTest: function () {
      // Test-scoped key: suites share the real origin's localStorage, and an
      // aborted run must never leave a stray draft that surfaces as a false
      // "Unsaved draft found" bar in the developer's real editor.
      KEY = 'hce.autosave.v1.test';
      window.HCEAutosave.KEY = KEY;
      _enabled = true;
      _lastWritten = '';
      bindSources();
    },
  };
})();
