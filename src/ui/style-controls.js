/**
 * HCEStyleControls (Stage 11 F4) — shared per-widget style-override plumbing.
 *
 * Widget data gains optional flat keys (styleAccent, styleBg — '' or absent
 * means "inherit the theme"). Everything here is opt-in: with no overrides
 * set, every widget renders and exports byte-identically to before (§3).
 *
 *   resolve(data, key)            → trimmed override value or ''
 *   applyEditorVars(container, data)
 *       Scopes --color-primary / --color-surface overrides onto the widget's
 *       own container so main.css preview rules pick them up locally.
 *   buildRows(working, specs)     → DOM section for the custom two-column
 *       modals (tabs, accordion, timeline). Mutates `working` live.
 *   modalFields(specs)            → field descriptors for WidgetModal.open
 *       (callout, quote) — a divider plus one optcolor row per spec.
 */
(function () {
  'use strict';

  // Override values are interpolated into style="…" attributes and scoped
  // <style> blocks in BOTH export modes, and they arrive from loaded project
  // JSON — not just from our color pickers. Unlike theme vars (which the
  // browser's CSSOM validates in setProperty before getComputedStyle ever
  // reads them back), these bypass CSSOM — so allowlist safe color syntax
  // here, at the single chokepoint every widget reads through. Anything else
  // (quotes, semicolons, url(), expression()…) resolves to '' = inherit.
  var SAFE_COLOR = /^(#[0-9a-fA-F]{3,8}|[a-zA-Z][a-zA-Z-]{0,29}|(?:rgb|rgba|hsl|hsla)\(\s*[0-9.,%\s\/-]{1,40}\))$/;

  function resolve(data, key) {
    var v = (data && typeof data[key] === 'string') ? data[key].trim() : '';
    return SAFE_COLOR.test(v) ? v : '';
  }

  function applyEditorVars(container, data) {
    var accent = resolve(data, 'styleAccent');
    var bg     = resolve(data, 'styleBg');
    if (accent) container.style.setProperty('--color-primary', accent);
    else        container.style.removeProperty('--color-primary');
    if (bg) container.style.setProperty('--color-surface', bg);
    else    container.style.removeProperty('--color-surface');
  }

  // One checkbox+picker row. `working[key]` is '' while disabled.
  function buildRow(working, spec) {
    var row = document.createElement('label');
    row.style.cssText =
      'display:flex;align-items:center;gap:6px;padding:4px 10px;' +
      'font-size:12px;font-family:var(--font-family-ui);cursor:pointer;';

    var enable = document.createElement('input');
    enable.type = 'checkbox';
    enable.className = 'hce-style-enable';
    enable.dataset.styleKey = spec.key;

    var picker = document.createElement('input');
    picker.type = 'color';
    picker.className = 'hce-style-value';
    picker.style.cssText = 'width:28px;height:20px;padding:0;border:1px solid var(--color-border);cursor:pointer;';

    var text = document.createElement('span');
    text.textContent = spec.label;
    text.style.cssText = 'flex:1;color:var(--color-text);';

    var current = resolve(working, spec.key);
    enable.checked  = !!current;
    picker.disabled = !current;
    picker.value    = current || spec.fallback || '#2563eb';

    enable.addEventListener('change', function () {
      picker.disabled = !enable.checked;
      working[spec.key] = enable.checked ? picker.value : '';
    });
    picker.addEventListener('input', function () {
      if (!picker.disabled) working[spec.key] = picker.value;
    });

    row.appendChild(enable);
    row.appendChild(text);
    row.appendChild(picker);
    return row;
  }

  function buildRows(working, specs) {
    var wrap = document.createElement('div');
    wrap.className = 'hce-style-controls';
    wrap.style.cssText = 'border-top:1px solid var(--color-border);padding:6px 0;';

    var caption = document.createElement('div');
    caption.textContent = 'Style';
    caption.style.cssText =
      'padding:2px 10px 4px;font-size:10px;font-weight:700;letter-spacing:0.06em;' +
      'text-transform:uppercase;color:var(--color-text-muted);' +
      'font-family:var(--font-family-ui);';
    wrap.appendChild(caption);

    specs.forEach(function (spec) { wrap.appendChild(buildRow(working, spec)); });
    return wrap;
  }

  function modalFields(specs) {
    var fields = [{ type: 'divider', label: 'Style' }];
    specs.forEach(function (spec) {
      fields.push({ key: spec.key, label: spec.label, type: 'optcolor', fallback: spec.fallback });
    });
    return fields;
  }

  window.HCEStyleControls = {
    resolve: resolve,
    applyEditorVars: applyEditorVars,
    buildRows: buildRows,
    modalFields: modalFields,
  };
})();
