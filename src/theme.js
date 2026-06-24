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
    '--widget-border-radius': '0.75rem',
    '--widget-shadow':        '0 12px 30px rgba(0,0,0,0.08)',
    '--widget-shadow-ring':   '0 0 0 1px rgba(0,0,0,0.04)',
  };

  const PRESETS = {
    neutral: Object.assign({}, DEFAULT_THEME),
    bold: {
      '--color-primary':        '#7c3aed',
      '--color-secondary':      '#db2777',
      '--color-accent':         '#f97316',
      '--color-background':     '#ffffff',
      '--color-surface':        '#faf5ff',
      '--color-text':           '#111827',
      '--color-text-muted':     '#6b7280',
      '--color-border':         '#e9d5ff',
      '--font-family-body':     'Inter, system-ui, sans-serif',
      '--font-family-heading':  'Inter, system-ui, sans-serif',
      '--font-size-base':       '1rem',
      '--line-height-base':     '1.6',
      '--content-max-width':    '860px',
      '--section-padding':      '2.5rem',
      '--widget-border-radius': '0.75rem',
      '--widget-shadow':        '0 4px 6px rgba(0,0,0,0.07)',
    },
    soft: {
      '--color-primary':        '#0891b2',
      '--color-secondary':      '#059669',
      '--color-accent':         '#d97706',
      '--color-background':     '#fffbf0',
      '--color-surface':        '#fff7ed',
      '--color-text':           '#292524',
      '--color-text-muted':     '#78716c',
      '--color-border':         '#e7e5e4',
      '--font-family-body':     "Georgia, 'Times New Roman', serif",
      '--font-family-heading':  "Georgia, 'Times New Roman', serif",
      '--font-size-base':       '1.0625rem',
      '--line-height-base':     '1.7',
      '--content-max-width':    '780px',
      '--section-padding':      '2rem',
      '--widget-border-radius': '1rem',
      '--widget-shadow':        '0 2px 8px rgba(0,0,0,0.06)',
    },
    // Light soft-depth editorial: generous radii, layered low-opacity shadow,
    // indigo primary, faint-tinted surface. Built from DEFAULT_THEME so every
    // serialized key is covered (applyTheme only sets keys present in the object).
    showcase: Object.assign({}, DEFAULT_THEME, {
      '--color-primary':        '#4f46e5',
      '--color-secondary':      '#6366f1',
      '--color-accent':         '#ec4899',
      '--color-surface':        '#f5f6ff',
      '--color-text':           '#1e1b35',
      '--color-text-muted':     '#6b7090',
      '--color-border':         '#e4e4f5',
      '--section-padding':      '2.5rem',
      '--widget-border-radius': '1.125rem',
      '--widget-shadow':        '0 12px 30px rgba(0,0,0,0.08)',
      '--widget-shadow-ring':   '0 0 0 1px rgba(79,70,229,0.06)',
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
    const theme = JSON.parse(json);
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
  }

  function bindEvents() {
    const panel = document.getElementById('theme-panel');
    if (!panel) return;

    // Live update on any control change — a manual tweak makes the theme custom,
    // so clear any active-preset highlight.
    panel.addEventListener('input', function (e) {
      const el = e.target;
      if (el.dataset.var) { setVar(el.dataset.var, el.value); markActivePreset(null); }
    });

    // Preset and reset buttons
    panel.addEventListener('click', function (e) {
      const presetBtn = e.target.closest('[data-preset]');
      if (presetBtn) {
        const preset = PRESETS[presetBtn.dataset.preset];
        if (preset) { applyTheme(preset); syncPanel(preset); markActivePreset(presetBtn.dataset.preset); }
        return;
      }
      if (e.target.id === 'reset-theme') {
        applyTheme(DEFAULT_THEME);
        syncPanel(DEFAULT_THEME);
        markActivePreset(null);
      }
    });
  }

  // Highlight the chosen preset button; clear all when reset/custom-edited.
  function markActivePreset(name) {
    const panel = document.getElementById('theme-panel');
    if (!panel) return;
    panel.querySelectorAll('[data-preset]').forEach(function (btn) {
      btn.classList.toggle('is-active', !!name && btn.dataset.preset === name);
    });
  }

  function init() {
    applyTheme(DEFAULT_THEME);
    syncPanel(DEFAULT_THEME);
    bindEvents();
    markActivePreset('neutral');
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
