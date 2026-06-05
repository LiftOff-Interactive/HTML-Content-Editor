# Feature — Theme Panel

## What It Is
A UI panel that lets the user set CSS custom properties (colors, fonts, spacing) that apply to the document live in the editor — and get inlined into the exported HTML at export time.

## What It Includes
- Theme panel UI (color pickers, font selectors, spacing controls)
- `theme.js` — reads/writes CSS vars to `:root`, handles panel open/close
- A default theme (sensible neutral defaults)
- Optionally: 2–3 preset themes the user can click to apply

## Acceptance Criteria
- [ ] Theme panel is accessible from the main UI (button in header or sidebar toggle)
- [ ] Changing primary color updates the document immediately (no page reload)
- [ ] Changing font family updates text in the editor immediately
- [ ] All changes write to CSS custom properties on `:root` — not to inline styles on elements
- [ ] The current theme state can be serialized to JSON (for saving in the project file)
- [ ] The theme state can be restored from JSON (for loading a project)
- [ ] A "Reset to default" button restores the default theme

## CSS Variables to Expose in the Panel
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
  --font-family-body: 'Inter', system-ui, sans-serif;
  --font-family-heading: 'Inter', system-ui, sans-serif;
  --font-size-base: 1rem;
  --line-height-base: 1.6;

  /* Spacing */
  --space-unit: 1rem;
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
  theme.js           — panel logic, CSS var read/write, preset loading
  styles/
    theme-defaults.css  — the default :root definitions above
```

## Implementation Notes
- `document.documentElement.style.setProperty('--color-primary', value)` is how you write a CSS var at runtime
- `getComputedStyle(document.documentElement).getPropertyValue('--color-primary')` is how you read it
- Use native `<input type="color">` for color pickers — no library needed
- For font family, use a `<select>` with a curated list of ~8–10 web-safe and Google Fonts options. Loading Google Fonts is fine in the editor; at export time, either inline the font data or fall back to the system stack.
- Theme state serializes as a flat object: `{ "--color-primary": "#2563eb", "--font-family-body": "Inter", ... }`

## Open Questions
- [ ] Should fonts be embedded (base64 WOFF2) in the export, or fall back to system fonts? Embedding adds file size; system fonts lose the design intent. A practical middle ground: embed only if the user chose a non-system font.
- [ ] How many preset themes for v1? Zero (user sets everything) vs. 3–5 presets (faster for most users). Suggest: 3 presets (Neutral, Bold, Soft) so the panel doesn't feel empty.
- [ ] Should the theme panel live in a persistent left sidebar or a slide-out drawer? Sidebar takes permanent space but is always accessible. Drawer keeps the editor wider. Given content-first authoring, drawer is probably better.
- [ ] Do we want a "live preview" thumbnail in the theme panel showing how the colors apply to a mini sample? Nice to have, not essential for v1.
