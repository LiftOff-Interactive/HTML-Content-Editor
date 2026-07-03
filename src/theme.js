(function () {
  'use strict';

  const DEFAULT_THEME = {
    '--color-primary':        '#2563eb',
    '--color-secondary':      '#64748b',
    '--color-accent':         '#f59e0b',
    '--color-background':     '#ffffff',
    '--color-surface':        '#f8fafc',
    '--color-text':           '#1e293b',
    '--color-text-muted':     '#64748b',
    '--color-border':         '#e2e8f0',
    '--font-family-body':     "Georgia, 'Times New Roman', serif",
    '--font-family-heading':  'Inter, system-ui, sans-serif',
    '--font-size-base':       '1rem',
    '--line-height-base':     '1.6',
    '--content-max-width':    '860px',
    '--section-padding':      '2rem',
    '--widget-border-radius': '0.5rem',
    '--widget-shadow':        '0 1px 3px rgba(0,0,0,0.1)',

    // F4 opt-in document controls. Default '' means "emit nothing extra" — the
    // export stays byte-identical to the Stage 8 baseline (docs/baselines) and
    // the editor preview falls back to the base look. Presets may set them.
    '--opt-heading-color':    '',
    '--opt-link-color':       '',
    '--opt-paragraph-margin': '',
    '--opt-heading-margin':   '',
  };

  // Presets merge over DEFAULT_THEME so any key a preset omits (including the
  // opt-in keys) resets to default rather than lingering from a prior preset.
  function preset(overrides) {
    return Object.assign({}, DEFAULT_THEME, overrides);
  }

  const PRESETS = {
    neutral: preset({}),
    bold: preset({
      '--color-primary':        '#7c3aed',
      '--color-secondary':      '#db2777',
      '--color-accent':         '#f97316',
      '--color-surface':        '#faf5ff',
      '--color-text':           '#111827',
      '--color-text-muted':     '#6b7280',
      '--color-border':         '#e9d5ff',
      '--font-family-body':     'Inter, system-ui, sans-serif',
      '--section-padding':      '2.5rem',
      '--widget-border-radius': '0.75rem',
      '--widget-shadow':        '0 4px 6px rgba(0,0,0,0.07)',
      '--opt-link-color':       '#7c3aed',
    }),
    soft: preset({
      '--color-primary':        '#0891b2',
      '--color-secondary':      '#059669',
      '--color-accent':         '#d97706',
      '--color-background':     '#fffbf0',
      '--color-surface':        '#fff7ed',
      '--color-text':           '#292524',
      '--color-text-muted':     '#78716c',
      '--color-border':         '#e7e5e4',
      '--font-family-heading':  "Georgia, 'Times New Roman', serif",
      '--font-size-base':       '1.0625rem',
      '--line-height-base':     '1.7',
      '--content-max-width':    '780px',
      '--widget-border-radius': '1rem',
      '--widget-shadow':        '0 2px 8px rgba(0,0,0,0.06)',
    }),
    // ── F4 professional document presets ──────────────────────────────────
    editorial: preset({
      '--color-primary':        '#b91c1c',
      '--color-accent':         '#b91c1c',
      '--color-text':           '#1a1a1a',
      '--color-text-muted':     '#57534e',
      '--color-border':         '#e7e5e4',
      '--font-family-body':     "'Georgia', 'Times New Roman', serif",
      '--font-family-heading':  "'Georgia', 'Times New Roman', serif",
      '--font-size-base':       '1.125rem',
      '--line-height-base':     '1.75',
      '--content-max-width':    '720px',
      '--widget-border-radius': '0.25rem',
      '--opt-heading-color':    '#111111',
      '--opt-heading-margin':   '2.2em 0 0.5em',
      '--opt-paragraph-margin': '1em',
      '--opt-link-color':       '#b91c1c',
    }),
    technical: preset({
      '--color-primary':        '#0369a1',
      '--color-accent':         '#0ea5e9',
      '--color-text':           '#0f172a',
      '--color-text-muted':     '#475569',
      '--color-border':         '#cbd5e1',
      '--font-family-body':     "system-ui, -apple-system, 'Segoe UI', sans-serif",
      '--font-family-heading':  "system-ui, -apple-system, 'Segoe UI', sans-serif",
      '--font-size-base':       '1rem',
      '--line-height-base':     '1.6',
      '--content-max-width':    '820px',
      '--widget-border-radius': '0.375rem',
      '--opt-link-color':       '#0369a1',
      '--opt-heading-margin':   '1.8em 0 0.5em',
    }),
    academic: preset({
      '--color-primary':        '#334155',
      '--color-accent':         '#7c2d12',
      '--color-text':           '#1c1917',
      '--color-text-muted':     '#57534e',
      '--color-border':         '#d6d3d1',
      '--font-family-body':     "'Times New Roman', Times, serif",
      '--font-family-heading':  "'Times New Roman', Times, serif",
      '--font-size-base':       '1.0625rem',
      '--line-height-base':     '1.8',
      '--content-max-width':    '680px',
      '--widget-border-radius': '0.25rem',
      '--opt-heading-margin':   '2em 0 0.6em',
      '--opt-paragraph-margin': '0.9em',
    }),
    corporate: preset({
      '--color-primary':        '#1d4ed8',
      '--color-secondary':      '#475569',
      '--color-accent':         '#0891b2',
      '--color-surface':        '#f1f5f9',
      '--color-text':           '#1e293b',
      '--color-text-muted':     '#64748b',
      '--color-border':         '#e2e8f0',
      '--font-family-body':     "'Segoe UI', system-ui, sans-serif",
      '--font-family-heading':  "'Segoe UI', system-ui, sans-serif",
      '--font-size-base':       '1rem',
      '--line-height-base':     '1.65',
      '--content-max-width':    '900px',
      '--widget-border-radius': '0.5rem',
      '--widget-shadow':        '0 2px 8px rgba(15,23,42,0.08)',
      '--opt-link-color':       '#1d4ed8',
      '--opt-heading-color':    '#0f172a',
    }),
  };

  const root = document.documentElement;

  function setVar(name, value) {
    root.style.setProperty(name, value);
  }

  function getVar(name) {
    return getComputedStyle(root).getPropertyValue(name).trim();
  }

  function applyTheme(theme) {
    Object.keys(theme).forEach(function (key) { setVar(key, theme[key]); });
  }

  function getCurrentTheme() {
    return Object.keys(DEFAULT_THEME).reduce(function (acc, name) {
      acc[name] = getVar(name);
      return acc;
    }, {});
  }

  function serialize() {
    return JSON.stringify(getCurrentTheme());
  }

  function deserialize(json) {
    // Merge over DEFAULT_THEME so any key the saved file omits — notably the F4
    // opt-in keys, absent from every pre-F4 project — RESETS to its default
    // instead of leaking a value a prior preset left on :root (which would
    // append opt CSS to the export and break the §3 byte-identical contract
    // on the load path). Keys the file does set win over defaults.
    const theme = Object.assign({}, DEFAULT_THEME, JSON.parse(json));
    applyTheme(theme);
    syncPanel(theme);
  }

  // Push theme values back into the panel's form controls.
  function syncPanel(theme) {
    const panel = document.getElementById('theme-panel');
    if (!panel) return;
    panel.querySelectorAll('[data-var]').forEach(function (el) {
      const val = theme[el.dataset.var];
      if (val !== undefined) el.value = val.trim();
    });
    // Optional-color rows: checkbox + color picker representing a var whose ''
    // value means "unset" (a native color input can't hold '').
    panel.querySelectorAll('[data-opt-color]').forEach(function (row) {
      const name    = row.dataset.optColor;
      const enable  = row.querySelector('.optcolor-enable');
      const picker  = row.querySelector('.optcolor-value');
      const val     = (theme[name] || '').trim();
      const on      = !!val;
      enable.checked = on;
      picker.disabled = !on;
      if (on) picker.value = val;
    });
  }

  function bindEvents() {
    const panel = document.getElementById('theme-panel');
    if (!panel) return;

    // Live update on any control change
    panel.addEventListener('input', function (e) {
      const el = e.target;
      if (el.dataset.var) setVar(el.dataset.var, el.value);

      // Optional-color picker moved — only writes while its row is enabled.
      if (el.classList.contains('optcolor-value')) {
        const row = el.closest('[data-opt-color]');
        if (row && !el.disabled) setVar(row.dataset.optColor, el.value);
      }
    });

    // Optional-color enable toggles
    panel.addEventListener('change', function (e) {
      const el = e.target;
      if (!el.classList.contains('optcolor-enable')) return;
      const row = el.closest('[data-opt-color]');
      if (!row) return;
      const picker = row.querySelector('.optcolor-value');
      picker.disabled = !el.checked;
      setVar(row.dataset.optColor, el.checked ? picker.value : '');
    });

    // Preset and reset buttons
    panel.addEventListener('click', function (e) {
      const presetBtn = e.target.closest('[data-preset]');
      if (presetBtn) {
        const preset = PRESETS[presetBtn.dataset.preset];
        if (preset) { applyTheme(preset); syncPanel(preset); }
        return;
      }
      if (e.target.id === 'reset-theme') {
        applyTheme(DEFAULT_THEME);
        syncPanel(DEFAULT_THEME);
      }
    });
  }

  function init() {
    applyTheme(DEFAULT_THEME);
    syncPanel(DEFAULT_THEME);
    bindEvents();
  }

  window.ThemePanel = {
    init: init,
    serialize: serialize,
    deserialize: deserialize,
    getCurrentTheme: getCurrentTheme,
    applyTheme: applyTheme,
    DEFAULT_THEME: DEFAULT_THEME,
  };

  init();
})();
