# Help — Human To-Do List

These are tasks only you (the human) can complete. Claude cannot create accounts, accept terms, or access external services on your behalf.

---

## How to open the editor (always do this first)

**Do not open `index.html` by double-clicking it.** Chrome blocks certain Quill internals when running from `file://`, which causes a console error on load.

Instead, serve it over localhost. Pick whichever you have:

**Option A — VS Code Live Server (easiest)**
1. Install the "Live Server" extension in VS Code (search "Live Server" by Ritwick Dey)
2. Right-click `index.html` in the Explorer panel → **Open with Live Server**
3. Chrome opens automatically at `http://127.0.0.1:5500`

**Option B — Python (if you have Python 3)**
1. Open a terminal in the project folder
2. Run: `python -m http.server 8080`
3. Open `http://localhost:8080` in Chrome

**Option C — Node (no install)**
1. Open a terminal in the project folder
2. Run: `npx serve .`
3. Open the URL it prints (usually `http://localhost:3000`)

---

## Stage 3 — Tier 1 Widgets, Feature 2: Tabs

### [x] Test the Tabs widget

**What**: Verify that the Tabs widget inserts correctly, tab switching works in the editor, the edit modal is functional, and the exported HTML is self-contained and interactive.

**Checklist:**

**Insert**
- [x] Type `/tabs` in the editor — palette shows Tabs widget; press Enter — a 3-tab widget inserts (Tab 1 / Tab 2 / Tab 3)
- [x] Insert via the toolbar dropdown as well

**Tab switching in the editor**
- [x] Click "Tab 2" in the tab bar — the panel switches to Tab 2 content; "Tab 2" label gets the primary colour underline
- [x] Click "Tab 1" — switches back
- [x] Clicking the tab bar does NOT open the edit modal

**Edit modal**
- [x] Click the content area (below the tabs) — the Edit Tabs modal opens
- [x] Left column lists all 3 tabs; clicking a tab name selects it and shows its label + content on the right
- [x] Change the label of Tab 1 — the left column updates in real time
- [x] Add a tab — list grows; new tab is selected automatically
- [x] Delete a tab (only visible when 3+ tabs present) — list shrinks; selected index adjusts
- [x] Reorder with ▲▼ buttons — tab moves up/down in the list
- [x] Cannot delete below 2 tabs (✕ button disappears at 2 tabs)
- [x] Cannot add above 8 tabs (+ Add Tab button grays out at 8)
- [x] Click **Save** — widget re-renders with updated tabs and content
- [x] Click **Cancel** (or Escape, or backdrop) — no changes

**No console errors**
- [x] No red errors in DevTools throughout

---

## Stage 3 — Tier 1 Widgets, Feature 1: Callout

### [x] Test the Callout widget — DONE

---

## Stage 2 — Widget System, Feature 3: Toolbar Dropdown

### [x] Test the toolbar widget dropdown — DONE

**What**: Verify that the Insert Widget icon button in the app header opens a dropdown, widgets insert correctly, and the dropdown closes as expected.

**Checklist:**
- [x] A small grid-plus icon button appears on the right side of the app header (before the "unsaved" status)
- [x] Hovering the button shows a border; clicking it lights up with the primary colour (active state) and opens the dropdown
- [x] The dropdown lists all registered widgets (Callout) with icon, name, and description
- [x] Clicking a widget in the dropdown inserts it at the current cursor position in the editor
- [x] Clicking anywhere outside the dropdown closes it without inserting
- [x] Pressing `Escape` closes the dropdown and returns focus to the button
- [x] The dropdown is scrollable (ready for when more widgets are registered)
- [x] No console errors throughout

---

## Stage 2 — Widget System, Feature 2: Slash Command

### [x] Test the slash command palette — DONE

**What**: Verify that typing `/` in the editor opens the widget palette, filtering works, keyboard nav works, and inserting a widget removes the trigger text.

**Checklist:**
- [x] Type `/` anywhere in the editor — palette appears near the cursor showing all registered widgets
- [x] Type `/cal` — list filters to just Callout
- [x] Press `↑`/`↓` — selection highlight moves through the list
- [x] Press `Enter` — widget inserts, the `/` and any query text are removed
- [x] Press `Escape` — palette closes, nothing inserted
- [x] Click a list item with the mouse — widget inserts
- [x] No console errors throughout

---

## Stage 2 — Widget System, Feature 1: Blot Base Class

### [x] Test the widget registry and Callout blot — DONE

**What**: Verify that the base class, registry, and CalloutBlot stub all work end-to-end in the browser. There's no insert UI yet (that's Feature 2) so you'll insert the widget manually from the DevTools console.

**How**:
1. Serve via localhost (see "How to open the editor" above — do not double-click)
2. Open DevTools with **F12** — keep the Console tab open throughout
3. Check for errors on load — the Console should be clean (no red)

**Checklist:**

**Registry loads**
- [x] In the Console, type `WidgetRegistry.getAll()` and press Enter — you should see an array containing `CalloutBlot`
- [x] Type `WidgetRegistry.get('callout')` — should return the `CalloutBlot` class, not `null`

**Insert a Callout widget**
- [x] Click in the editor to place your cursor, then run this in the Console:
  ```js
  contentEditor.quill.insertEmbed(0, 'callout', { _v: 1, type: 'info', title: 'Test note', body: 'Hello world' })
  ```
- [x] A callout block should appear at the top of the editor — blue left border, info icon (ℹ️), bold title "Test note", grey body text "Hello world"
- [x] The block has a dashed-border placeholder feel and highlights with a blue outline when you hover over it

**Click to edit**
- [x] Click the callout block — a modal dialog opens with three fields: Type (dropdown), Title (text), Body (textarea)
- [x] Change all three fields and click **Save** — the callout re-renders immediately with the new content and correct icon
- [x] Open again and click **Cancel** (or press Escape, or click the backdrop) — nothing changes

**Delta stays in sync**
- [x] After editing, run `contentEditor.quill.getContents()` in the Console — find the callout op in the delta; its `insert` value should match what you just typed, not the original data

**Corner radius reflects theme**
- [x] Change **Corners** in the theme sidebar to "Full" — the callout's rounded corners should update immediately (it uses `--widget-border-radius`)

**No console errors**
- [x] Throughout all of the above, the DevTools Console should have zero red errors

---

## Stage 1 — Theme Panel

### [x] Test the theme panel in your browser — DONE
_(Live preview was removed. Presets, color pickers, typography, layout controls, and reset all verified working.)_

---

## Stage 1 — Editor Shell

### [x] Test the editor shell in your browser — DONE

---

## Before Stage 1

### [x] GitHub Account
**What**: A GitHub account to host the repository and publish via GitHub Pages.
**Why**: The project's v1 release target is a public GitHub repo with GitHub Pages hosting.
**Link**: https://github.com/signup
**Blocks**: Stage 6 (release), but set up early so you can push code from day one.

### [x] Git Installed Locally
**What**: Git must be installed on your machine.
**Why**: Version control for the project.
**Link**: https://git-scm.com/downloads
**Blocks**: All stages (needed to commit and push).
**Check**: Run `git --version` in your terminal. If it prints a version, you're good.

### [x] GitHub CLI (Optional but Recommended)
**What**: The `gh` CLI tool for creating repos and managing GitHub from the terminal.
**Why**: Makes repo creation and GitHub Pages setup faster.
**Link**: https://cli.github.com/
**Blocks**: Nothing — Claude can give you manual steps if you skip this.
**Check**: Run `gh --version` to confirm.

---

## Before Stage 6 (Release)

### [x] Create GitHub Repository
**What**: Create a public GitHub repository named `html-content-editor` (or your preferred name).
**Why**: This is where the project lives publicly and where GitHub Pages is enabled.
**How (with gh CLI)**:
```
gh repo create html-content-editor --public --source=. --remote=origin --push
```
**How (manual)**:
1. Go to https://github.com/new
2. Set name, make it Public, do not initialize with README (we have one)
3. Copy the remote URL and run: `git remote add origin <url>` then `git push -u origin main`
**Blocks**: Public release + GitHub Pages.

### [ ] Enable GitHub Pages
**What**: Turn on GitHub Pages for the repository so the editor is accessible at `https://<username>.github.io/html-content-editor/`.
**Why**: This is the hosted version of the editor (the other delivery method is opening `index.html` locally).
**How**:
1. Go to your repo on GitHub → Settings → Pages
2. Set Source to "Deploy from a branch"
3. Select branch: `main`, folder: `/ (root)`
4. Save — Pages will be live within a minute or two
**Blocks**: Public release.

---

## Nice to Have (No Hard Deadline)

### [ ] Custom Domain (Optional)
**What**: A custom domain like `htmlcontenteditor.com` pointed at GitHub Pages.
**Why**: More professional for a public tool.
**Cost**: ~$10–15/year via Namecheap, Cloudflare, etc.
**Blocks**: Nothing in v1 — GitHub Pages URL works fine.

### [ ] Open Graph / Social Preview Image
**What**: A 1200×630px preview image for the GitHub repo and social sharing.
**Why**: Makes the project look polished when shared on LinkedIn, Twitter, etc.
**How**: Create in Figma, Canva, or any image tool. Add to repo root as `og-image.png` and reference in `README.md`.
**Blocks**: Nothing functional.

---

## Status Key
- `[ ]` — Not done yet
- `[x]` — Complete
