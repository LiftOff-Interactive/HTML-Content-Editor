(function () {
  'use strict';

  // ── Whole-document WYSIWYG ⇄ code (HTML source) toggle ──────────────────────
  //
  // A reversible "Source dialect" with two node classes:
  //   (a) EDITABLE content — exactly the vocabulary HCEExport.walkDelta emits
  //       (p, h1–h3, ul/ol/li, strong/em/u). Freely hand-editable.
  //   (b) OPAQUE widget placeholders — each embed becomes ONE element:
  //         <div class="hce-widget" data-widget-type="callout"
  //              data-widget-data="BASE64_JSON" contenteditable="false">…</div>
  //       data-widget-data is base64(UTF-8 JSON), so inner quotes / </script>
  //       can never break the surrounding HTML or the textarea.
  //
  // Serialize reuses the SAME export.js walker (HCEExport.walkDelta) so visual and
  // source can never drift on text formatting. Parse sanitizes (DOMPurify), then
  // runs Quill's clipboard with one matcher that rebuilds embeds from placeholders.
  // Any parse failure REFUSES the switch and keeps the user in source mode with
  // their text intact — content is never silently dropped.

  var state = 'visual';
  var pane, textarea, banner, toggleBtn;

  function quill() { return window.contentEditor && window.contentEditor.quill; }

  // ── UTF-8-safe base64 (handles emoji, non-Latin, </script>, quotes) ─────────
  function utf8ToB64(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function b64ToUtf8(b64) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function esc(s) { return window.HCEExport.esc(String(s)); }

  function widgetLabel(blotName) {
    if (blotName === 'resizable-image') return 'Image';
    var B = window.WidgetRegistry.get(blotName);
    return (B && B.widgetLabel) || blotName;
  }

  // ── Serialize: Visual → Source ──────────────────────────────────────────────
  function buildSourceHtml(delta) {
    return window.HCEExport.walkDelta(delta, function (blotName, data) {
      var b64 = utf8ToB64(JSON.stringify(data));
      return '<div class="hce-widget" data-widget-type="' + esc(blotName) + '" ' +
             'data-widget-data="' + b64 + '" contenteditable="false">' +
             esc(widgetLabel(blotName)) + ' · double-click in Visual mode to edit' +
             '</div>';
    });
  }

  // Decode + validate ONE placeholder node. Throws a tagged error on bad data so
  // the toggle aborts cleanly instead of silently dropping the embed.
  function decodeWidgetNode(node) {
    var type = node.getAttribute('data-widget-type');
    if (!type) throw new Error('a widget placeholder is missing its data-widget-type');
    if (type !== 'resizable-image' && !window.WidgetRegistry.get(type)) {
      throw new Error('unknown widget type "' + type + '"');
    }
    var b64 = node.getAttribute('data-widget-data') || '';
    var json;
    try { json = b64ToUtf8(b64); }
    catch (e) { throw new Error('corrupt widget data (base64) for "' + type + '"'); }
    var data;
    try { data = JSON.parse(json); }
    catch (e) { throw new Error('corrupt widget data (JSON) for "' + type + '"'); }
    return { type: type, data: data };
  }

  // DOMPurify config: keep the editable vocabulary + the opaque placeholder;
  // strip active content. on*/javascript: are stripped by DOMPurify by default;
  // data-* attributes are allowed by default.
  var SANITIZE_CFG = {
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'base', 'form'],
    ADD_ATTR: ['data-widget-type', 'data-widget-data', 'contenteditable'],
  };

  // ── Parse: Source → Visual (delta). Throws on ANY problem. ──────────────────
  function parseSourceToDelta(html) {
    var q = quill();
    var Delta = Quill.import('delta');
    if (!html || !html.trim()) return new Delta().insert('\n');

    var clean = window.DOMPurify.sanitize(html, SANITIZE_CFG);

    // Pre-validate every placeholder BEFORE convert so one bad embed aborts the
    // whole toggle (rather than the matcher silently yielding partial content).
    var tmp = document.createElement('div');
    tmp.innerHTML = clean;
    var nodes = tmp.querySelectorAll('[data-widget-type]');
    for (var i = 0; i < nodes.length; i++) decodeWidgetNode(nodes[i]);

    var delta = q.clipboard.convert({ html: clean });

    // Guarantee a trailing newline so setContents accepts the delta.
    var ops = delta.ops || [];
    var last = ops[ops.length - 1];
    if (!last || typeof last.insert !== 'string' || !/\n$/.test(last.insert)) {
      delta.insert('\n');
    }
    return delta;
  }

  // One clipboard matcher: placeholder div → embed op. Registered once at init.
  function registerMatcher() {
    var q = quill();
    if (!q) return;
    var Delta = Quill.import('delta');
    q.clipboard.addMatcher('div[data-widget-type]', function (node) {
      var w = decodeWidgetNode(node);
      var op = {};
      op[w.type] = w.data;
      return new Delta().insert(op);
    });
  }

  // ── Toggle UI / state machine ───────────────────────────────────────────────
  function setControlsDisabled(disabled) {
    ['export-btn', 'export-sharepoint-btn', 'save-btn', 'load-btn'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.disabled = disabled;
    });
    var openPalette = document.querySelector('.slash-palette.is-open');
    if (openPalette) openPalette.classList.remove('is-open');
  }

  function showBanner(msg) {
    banner.textContent = msg || '';
    banner.style.display = msg ? 'block' : 'none';
  }

  function enterSource() {
    var q = quill();
    if (!q) return;
    textarea.value = buildSourceHtml(q.getContents());
    showBanner('');
    document.getElementById('editor-wrap').style.display = 'none';
    pane.style.display = 'flex';
    setControlsDisabled(true);
    toggleBtn.textContent = 'Visual';
    toggleBtn.classList.add('is-active');
    state = 'source';
    textarea.focus();
  }

  function exitSource() {
    var q = quill();
    if (!q) return;
    var delta;
    try {
      delta = parseSourceToDelta(textarea.value);
    } catch (e) {
      showBanner('Can’t switch to Visual: ' + e.message + '. Fix the HTML (or revert your edits) and try again.');
      return; // stay in source mode; nothing is lost
    }
    q.setContents(delta, Quill.sources.USER);
    document.getElementById('editor-wrap').style.display = '';
    pane.style.display = 'none';
    setControlsDisabled(false);
    toggleBtn.textContent = '</> Edit HTML';
    toggleBtn.classList.remove('is-active');
    showBanner('');
    state = 'visual';
  }

  function toggle() {
    if (state === 'visual') enterSource();
    else exitSource();
  }

  function buildPane() {
    var area = document.getElementById('editor-area');
    if (!area) return;
    pane = document.createElement('div');
    pane.id = 'source-pane';
    pane.style.display = 'none';

    banner = document.createElement('div');
    banner.id = 'source-error';
    banner.setAttribute('role', 'alert');
    banner.style.display = 'none';

    textarea = document.createElement('textarea');
    textarea.id = 'source-textarea';
    textarea.spellcheck = false;
    textarea.setAttribute('aria-label', 'Document HTML source');

    pane.appendChild(banner);
    pane.appendChild(textarea);
    area.appendChild(pane);
  }

  function buildToggleButton() {
    var actions = document.querySelector('.header-actions');
    if (!actions) return;
    toggleBtn = document.createElement('button');
    toggleBtn.className = 'header-btn header-btn--ghost';
    toggleBtn.id = 'code-toggle-btn';
    toggleBtn.type = 'button';
    toggleBtn.textContent = '</> Edit HTML';
    toggleBtn.title = 'Toggle the whole-document HTML source view';
    toggleBtn.addEventListener('click', toggle);
    var anchor = document.getElementById('export-btn');
    if (anchor) actions.insertBefore(toggleBtn, anchor);
    else actions.appendChild(toggleBtn);
  }

  function init() {
    if (!quill()) return;
    registerMatcher();
    buildPane();
    buildToggleButton();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.SourceView = {
    toggle: toggle,
    enterSource: enterSource,
    exitSource: exitSource,
    buildSourceHtml: buildSourceHtml,
    parseSourceToDelta: parseSourceToDelta,
    decodeWidgetNode: decodeWidgetNode,
    getState: function () { return state; },
  };
})();
