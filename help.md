# Help — Human To-Do List

These are tasks only you (the human) can complete. Claude cannot create accounts, accept terms, or access external services on your behalf.

---

## Stage 1 — Theme Panel (Current)

### [ ] Test the theme panel in your browser
**What**: Open `index.html` and verify the theme panel works end-to-end.
**How**:
1. Double-click `index.html` (or drag it into Chrome/Firefox)
2. The left sidebar should show a live preview card at the top, three preset buttons, and controls below

**Checklist — work through these in order:**

**Live preview**
- [ ] The preview card shows "Heading Text" in one font and body text below it in another, with a blue button
- [ ] The preview updates instantly as you change any setting (no reload needed)

**Preset buttons**
- [ ] Click **Bold** — preview shifts to purple, body font changes to Inter, the editor's primary color turns purple
- [ ] Click **Soft** — preview shifts to teal/amber, background warms to cream
- [ ] Click **Neutral** — everything returns to the default blue/grey/Georgia look

**Color pickers**
- [ ] Click the Primary color swatch, pick any color — the button in the preview, editor toolbar hover states, and heading links update immediately
- [ ] Click Background, pick a color — the editor writing area and the preview card background both change
- [ ] Click Text, pick a very light color — text in the editor and preview becomes hard to read (confirms the var is wired)

**Typography controls**
- [ ] Change **Body** font to "Courier New" — body text in the editor and preview switches to monospace immediately
- [ ] Change **Heading** font to "Georgia" — headings (`H1`, `H2`, `H3`) in the editor switch to serif
- [ ] Change **Line height** to "Loose (1.8)" — paragraph spacing in the editor visibly increases
- [ ] Change **Size** to "Large (18px)" — all text in the editor grows

**Layout controls**
- [ ] Change **Max width** to "Narrow (680px)" — the editor column visibly narrows on screen
- [ ] Change **Corners** to "Full" — note this for when widgets arrive; sharp/medium/full should all feel different

**Reset**
- [ ] After making several changes, click **Reset to default** — all controls and the preview should snap back to the Neutral defaults

**Editor still works**
- [ ] Type in the editor — it still accepts input normally
- [ ] Toolbar buttons (bold, italic, heading dropdown, bullet list) still work
- [ ] DevTools Console (F12) — no red errors

---

## Stage 1 — Editor Shell

### [x] Test the editor shell in your browser — DONE

---

## Before Stage 1

### [ ] GitHub Account
**What**: A GitHub account to host the repository and publish via GitHub Pages.
**Why**: The project's v1 release target is a public GitHub repo with GitHub Pages hosting.
**Link**: https://github.com/signup
**Blocks**: Stage 6 (release), but set up early so you can push code from day one.

### [ ] Git Installed Locally
**What**: Git must be installed on your machine.
**Why**: Version control for the project.
**Link**: https://git-scm.com/downloads
**Blocks**: All stages (needed to commit and push).
**Check**: Run `git --version` in your terminal. If it prints a version, you're good.

### [ ] GitHub CLI (Optional but Recommended)
**What**: The `gh` CLI tool for creating repos and managing GitHub from the terminal.
**Why**: Makes repo creation and GitHub Pages setup faster.
**Link**: https://cli.github.com/
**Blocks**: Nothing — Claude can give you manual steps if you skip this.
**Check**: Run `gh --version` to confirm.

---

## Before Stage 6 (Release)

### [ ] Create GitHub Repository
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
