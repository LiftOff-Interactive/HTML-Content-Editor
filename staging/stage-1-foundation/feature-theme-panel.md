# Feature — Theme Panel

## What It Is
A UI panel that lets the user set CSS custom properties (colors, fonts, spacing) that apply to the document live in the editor — and get inlined into the exported HTML at export time.

## What It Includes
- Live preview card — updates instantly as you change any setting (CSS custom properties cascade automatically)
- Three preset themes: Neutral, Bold, Soft
- Theme panel UI: color pickers, font selectors, layout controls
- `theme.js` — reads/writes CSS vars to `:root`, handles panel init and presets
- `theme-defaults.css` — the default `:root` definitions (single source of truth for the export engine)

## Acceptance Criteria
- [x] Theme panel is accessible from the main UI — persistent left sidebar
- [x] Changing primary color updates the document immediately (no page reload)
- [x] Changing font family updates text in the editor immediately
- [x] All changes write to CSS custom properties on `:root` — not to inline styles on elements
- [x] The current theme state can be serialized to JSON — `ThemePanel.serialize()`
- [x] The theme state can be restored from JSON — `ThemePanel.deserialize(json)`
- [x] A "Reset to default" button restores the default theme
- [x] Live preview thumbnail in the theme panel — shows heading, body text, link, and button using live theme vars
- [x] **HUMAN VERIFIED** — all of the above verified working in Chrome ✓ (2026-06-05)

## CSS Variables Exposed in the Panel
```css
:root {
  /* Colors */
  --color-primary: #2563eb;
  --color-secondary: #64748b;
  --color-accent: #f59e0b;
  --color-background: #ffffff;
  --color-surface: #f8fafc;
  --color-text: #1e293b;
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;

  /* Typography */
  --font-family-body: Georgia, 'Times New Roman', serif;
  --font-family-heading: Inter, system-ui, sans-serif;
  --font-size-base: 1rem;
  --line-height-base: 1.6;

  /* Layout */
  --content-max-width: 860px;
  --section-padding: 2rem;

  /* Widget defaults */
  --widget-border-radius: 0.5rem;
  --widget-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
```

## File Structure
```
src/
  theme.js              — panel logic, CSS var read/write, preset loading
  styles/
    theme-defaults.css  — the default :root definitions above
```

## Open Questions
- [x] Should fonts be embedded (base64 WOFF2) in the export? → Stage 4 decision: embed only if user chose a non-system font. Skip for now.
- [x] How many preset themes for v1? → 3 presets: Neutral, Bold, Soft
- [x] Drawer vs. persistent left sidebar? → Persistent sidebar (already built, content-first)
- [x] Live preview thumbnail? → Built for v1. Uses CSS custom properties so no JS update logic needed.
