/**
 * CodeView — whole-document WYSIWYG ⇄ HTML source toggle (F2).
 *
 * Enter: serializes the current delta via HCEDeltaHtml.deltaToCode and shows
 * it in a monospace textarea (the visual editor is hidden, header actions that
 * read the stale delta are disabled). Exit via:
 *   - "Apply & return" — parses the textarea; on success the delta replaces
 *     the document; on failure the reasons are listed and the code view stays
 *     open with the user's text intact (never lose content).
 *   - "Discard changes" — returns to the visual view without applying.
 * If the current document contains formatting the code view can't represent,
 * entering is refused with the reasons and nothing changes.
 */
(function () {
  'use strict';

  var isOpen = false;
  var panel = null;
  var textarea = null;
  var errorEl = null;
  var toggleBtn = null;
  var discardBtn = null;
  var openedWithCode = null; // serialization shown when the view opened — the "clean" state

  // Header controls that act on the (stale) delta while code view is open.
  var DISABLE_SELECTORS = ['#save-btn', '#load-btn', '#export-btn', '#export-sharepoint-btn', '.toolbar-widget-btn'];

  function showToast(msg) {
    var toast = document.createElement('div');
    toast.style.cssText =
      'position:fixed;bottom:20px;right:20px;z-index:9999;' +
      'background:#1e293b;color:#fff;padding:12px 16px;' +
      'border-radius:6px;font-size:13px;' +
      'font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;' +
      'box-shadow:0 4px 12px rgba(0,0,0,0.2);max-width:340px;line-height:1.4;';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 6000);
  }

  // Save/restore rather than force on/off, so a button some other feature
  // disabled (e.g. an in-flight export) isn't spuriously re-enabled on close.
  function setActionsDisabled(disabled) {
    DISABLE_SELECTORS.forEach(function (sel) {
      var el = document.querySelector(sel);
      if (!el) return;
      if (disabled) {
        el.dataset.cvWasDisabled = el.disabled ? '1' : '';
        el.disabled = true;
        el.classList.add('is-disabled-by-code-view');
        el.setAttribute('title', 'Return to the visual view first');
      } else {
        el.disabled = el.dataset.cvWasDisabled === '1';
        delete el.dataset.cvWasDisabled;
        el.classList.remove('is-disabled-by-code-view');
        el.removeAttribute('title');
      }
    });
  }

  function showErrors(reasons) {
    errorEl.innerHTML = '';
    var title = document.createElement('strong');
    title.textContent = 'Cannot apply — fix these and try again (your text is untouched):';
    errorEl.appendChild(title);
    var list = document.createElement('ul');
    reasons.forEach(function (r) {
      var li = document.createElement('li');
      li.textContent = r;
      list.appendChild(li);
    });
    errorEl.appendChild(list);
    errorEl.style.display = 'block';
  }

  function buildPanel() {
    panel = document.createElement('div');
    panel.id = 'code-view';

    var bar = document.createElement('div');
    bar.className = 'code-view-bar';

    var hint = document.createElement('span');
    hint.className = 'code-view-hint';
    hint.textContent = 'HTML source — widgets are the <script type="application/hce-widget"> JSON blocks.';

    discardBtn = document.createElement('button');
    discardBtn.type = 'button';
    discardBtn.className = 'header-btn header-btn--ghost';
    discardBtn.id = 'code-view-discard';
    discardBtn.textContent = 'Discard changes';
    discardBtn.addEventListener('click', function () {
      if (textarea.value !== openedWithCode &&
          !window.confirm('Discard your code edits and return to the visual view?')) {
        return;
      }
      close();
    });

    bar.appendChild(hint);
    bar.appendChild(discardBtn);

    errorEl = document.createElement('div');
    errorEl.className = 'code-view-error';
    errorEl.setAttribute('role', 'alert');
    errorEl.style.display = 'none';

    textarea = document.createElement('textarea');
    textarea.id = 'code-editor';
    textarea.spellcheck = false;
    textarea.setAttribute('aria-label', 'Document HTML source');

    panel.appendChild(bar);
    panel.appendChild(errorEl);
    panel.appendChild(textarea);
    return panel;
  }

  function open() {
    // Re-entry guard: a second open() while the view is showing would reset
    // the textarea to the stale serialization, destroying in-progress edits.
    if (isOpen) return;
    var quill = window.contentEditor && window.contentEditor.quill;
    if (!quill || !toggleBtn) return;

    var code;
    try {
      code = window.HCEDeltaHtml.deltaToCode(quill.getContents());
    } catch (err) {
      showToast('Code view unavailable: ' + (err.reasons ? err.reasons.join('; ') : err.message));
      return;
    }

    if (!panel) {
      buildPanel();
      document.getElementById('editor-area').appendChild(panel);
    }
    textarea.value = code;
    openedWithCode = code;
    errorEl.style.display = 'none';

    document.getElementById('editor-wrap').style.display = 'none';
    panel.style.display = 'flex';
    setActionsDisabled(true);
    toggleBtn.textContent = 'Apply & return';
    toggleBtn.classList.add('header-btn--accent');
    isOpen = true;
    textarea.focus();
  }

  function apply() {
    var quill = window.contentEditor.quill;
    var delta;
    try {
      delta = window.HCEDeltaHtml.codeToDelta(textarea.value);
    } catch (err) {
      showErrors(err.reasons || [err.message]);
      return;
    }
    quill.setContents(delta, Quill.sources.USER);
    close();
  }

  function close() {
    panel.style.display = 'none';
    document.getElementById('editor-wrap').style.display = '';
    setActionsDisabled(false);
    toggleBtn.textContent = '</> Code';
    toggleBtn.classList.remove('header-btn--accent');
    isOpen = false;
  }

  function buildToggleButton() {
    toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'header-btn';
    toggleBtn.id = 'code-view-btn';
    toggleBtn.textContent = '</> Code';
    toggleBtn.setAttribute('title', 'Edit the document as HTML source');
    toggleBtn.addEventListener('click', function () {
      if (isOpen) apply();
      else open();
    });

    var headerActions = document.querySelector('.header-actions');
    var anchor = document.getElementById('save-btn');
    if (headerActions) {
      headerActions.insertBefore(toggleBtn, anchor ? anchor.parentElement : headerActions.firstChild);
    }
  }

  document.addEventListener('DOMContentLoaded', buildToggleButton);

  // Code edits live only in the textarea until applied — warn before the page
  // unloads while unapplied edits exist.
  window.addEventListener('beforeunload', function (e) {
    if (isOpen && textarea && textarea.value !== openedWithCode) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  window.HCECodeView = {
    open: open,
    apply: apply,
    isOpen: function () { return isOpen; },
  };
})();
