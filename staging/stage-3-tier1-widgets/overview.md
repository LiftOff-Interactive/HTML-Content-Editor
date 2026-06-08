# Stage 3 — Tier 1 Widgets

## Goal
Build the five simplest-to-medium complexity widgets. These establish the pattern and prove the blot system works end-to-end, including in the export. Each widget must render correctly both in the editor and in an exported HTML file.

## Widgets in This Stage (in build order)
1. `feature-callout.md` — Alert/notice box — DONE ✓ (human verified)
2. `feature-tabs.md` — Tabbed content panels — DONE ✓ (human verified)
3. `feature-accordion.md` — Expandable/collapsible sections — DONE ✓ (human verified)
4. `feature-quote.md` — Stylized pull quote / blockquote — DONE ✓ (human verified)
5. `feature-timeline.md` — Linear sequence of events/steps — DONE ✓ (human verified)

## Definition of Done
- [x] All 5 widgets insert via slash command and toolbar dropdown
- [x] All 5 widgets render correctly in the editor
- [x] All 5 widgets have an edit UI (modal with form fields) that updates the widget on save
- [ ] All 5 widgets render correctly in an exported HTML file opened in a browser with no network connection — **pending full export engine (Stage 4)**
- [x] All 5 widgets respect the active theme's CSS custom properties (colors, fonts)
- [ ] Widget data survives a save/load cycle (export to JSON, import from JSON, widget looks the same) — **pending Stage 4**

## Notes
- Build Callout first — it's the simplest and proves the full pipeline
- Do not move to Stage 4 until all 5 widgets pass the export test in incognito mode with network disabled
- Each widget gets its own file in `src/blots/`
