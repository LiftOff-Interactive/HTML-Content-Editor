# HTML Content Editor

A free, self-hosted WYSIWYG authoring tool for instructional designers. Build rich interactive eLearning content in your browser and export a single, fully self-contained HTML file that works anywhere.

> **Status**: In development — v1 coming soon.

## What It Does

- Write content in a clean WYSIWYG editor (powered by Quill 2.0)
- Insert interactive widgets via slash command (`/`) or the toolbar
- Set colors, fonts, and spacing via the theme panel
- Save your project as a JSON file, reload it anytime
- Export a single `.html` file with everything inlined — no external dependencies

## Widgets

| Widget | Description |
|---|---|
| Callout | Alert/notice box (info, warning, success, danger) |
| Tabs | Tabbed content panels |
| Accordion | Expandable/collapsible sections |
| Stylized Quote | Pull quote or highlighted quotation |
| Timeline | Linear sequence of steps or events |
| Flip Cards | Cards that flip to reveal a back face |
| Click & Reveal | Content hidden behind a click trigger |
| Carousel | Image/content slider |
| Hotspot | Image with clickable pin markers |
| Knowledge Check | Simple multiple choice self-assessment |

## How to Use

1. Download or clone this repository
2. Open `index.html` in your browser (no server needed)
3. Write your content, insert widgets with `/`
4. Adjust colors and fonts in the theme panel
5. Click **Export HTML** to download your self-contained page

## Deploy Anywhere

The exported HTML file works:
- Hosted on any web server or CDN
- Embedded in SharePoint or Confluence via `<iframe>`
- Sent as an email attachment
- Dropped into any course portal that accepts raw HTML

No subscription. No lock-in. Your file, your content.

## License

MIT
