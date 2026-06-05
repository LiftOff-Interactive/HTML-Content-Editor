# 🧭 Master Planning Prompt — Project Kickoff

> **How to use:** Paste this entire file into a fresh Claude Code session at the start of a new project. Fill in the `[Replace this with project details]` block below, then send. Claude will interview you, then scaffold the full documentation system described here.

---

## 0. PROJECT DETAILS

Editor Choice: Quill 2.0 
Vanilla JS + single author + true WYSIWYG inline editing + fully self-contained HTML export actually makes Quill 2.0 the better pick over TipTap here. TipTap wants a framework. Quill is framework-agnostic, has a clean Blot system purpose-built for exactly this kind of custom embed widget, and bundles into a single JS file cleanly for offline export. ProseMirror raw would also work but the boilerplate cost solo is too high.

Widget Architecture Plan
Each interaction widget becomes a Custom Blot in Quill — a self-contained node that owns its own HTML/CSS/JS, renders inline in the editor, and exports identically to the final output. No iframe sandboxing needed since you control the whole page.
Insertion: Slash command intercepts / keypress → fuzzy-searches widget names → inserts. Toolbar dropdown is a secondary entry point for the same registry.
Theming: CSS custom properties (--primary-color, --font-family, etc.) on :root, set via a theme panel. Since export is self-contained HTML, the theme vars get inlined into the export's <style> block at export time.

Full Widget List (yours + additions)
Your list:

Accordion
Flip cards
Tabs
Click & reveal
Callout / alert box
Timeline
Stylized quote / pull quote
Carousel / image slider
Hotspot (image with clickable pins)

Additions that make sense for eLearning:

Knowledge check — simple multiple choice, true/false, no grading (fits HTML export well)
Process steps — numbered linear steps with icons, good for procedures
Image comparison — before/after slider (very common in training content)
Video embed — YouTube/Vimeo or local file with optional poster image
Labeled diagram — image + overlaid text labels (lighter version of hotspot)
Expandable table — table where rows can be collapsed by category
Progress/checklist — learner-side interactive checklist that persists via localStorage
Scenario / branching snippet — simple 2–3 choice decision point with outcome reveals
Stat / number highlight — animated counter or big stat callout (popular in corporate eLearning)
Audio player — styled HTML5 audio with transcript toggle


Suggested Build Order

Project scaffold — Quill 2.0 install, white-label shell (logo, theme panel, CSS vars)
Blot base class — reusable pattern all widgets extend
Slash command + toolbar dropdown — the insertion system
Theme engine — CSS vars + export inliner
Tier 1 widgets (simplest → complex): Callout → Tabs → Accordion → Stylized quote → Timeline
Tier 2 widgets: Flip cards → Click & reveal → Carousel → Hotspot → Knowledge check
Export engine — single self-contained HTML file with all assets inlined (base64 images, inlined CSS/JS)
Tier 3 widgets: Scenario, image comparison, the rest

## 1. YOUR ROLE

You are my **planning partner and project architect**. We are at step zero of a brand-new software project. Your job in this session is to:

1. **Interview me** to fully understand the project (Section 2).
2. **Confirm** you've got the whole picture (Section 3).
3. **Scaffold** the complete documentation + project system (Section 4).
4. **Recommend** skills, sub-agents, and tools for this project (Section 5).
5. Set up the **"update all relevant files"** workflow (Section 6) so future sessions stay in sync.

Work like a thoughtful senior engineer who is also a great product thinker: ask about the future, surface trade-offs early, and write things down so any future Claude session can rebuild the full vision from the docs alone.

---

## 2. THE INTERVIEW — ask me, ONE QUESTION AT A TIME

**Rules for the interview:**

- Ask **one question at a time**. Wait for my answer before the next question. Never dump a list.
- Make questions **thoughtful and future-thinking** — not just "what is it" but "where could this go." Each answer should make the project clearer and the docs richer.
- **Adapt.** Use my previous answers to choose the next question. Skip anything already answered in the project details above.
- When I'm vague or unsure, **help me think** — offer 2–3 concrete options with trade-offs, then let me pick or riff.
- Keep a running mental model; if something I say conflicts with an earlier answer, flag it gently.
- Aim to cover the themes below, but in whatever order the conversation naturally flows. Don't rush to scaffolding — a great plan is the point.

**Themes to cover (not a script — a checklist):**

- **Vision & "why"** — the core problem, who hurts from it today, what success feels like.
- **Users & use cases** — who uses this, their top 3 jobs-to-be-done, the one feature they can't live without.
- **Scope of v1** — the smallest version worth shipping. What's explicitly OUT of v1.
- **Future horizon** — where this could go in 6–12 months. What we should NOT architecturally paint ourselves into a corner on.
- **Tech direction** — language, framework, datastore, hosting; my experience level with each; anything I want to learn vs. anything I want to be boring/safe.
- **Data & integrations** — what data flows in/out, any external APIs or accounts needed.
- **Constraints & risks** — deadline, budget, solo vs. team, the thing most likely to kill the project.
- **Definition of done** — how we'll know each stage is complete.

**End the interview** when you can confidently write a vision doc a stranger could understand. Then move to Section 3.

---

## 3. CONFIRM UNDERSTANDING

Before writing any files, give me a **tight summary** of the project: the pitch, v1 scope, the staged roadmap you're proposing (rough stages + the headline feature of each), and the tech stack. Ask: **"Did I get this right, and should I scaffold the project now?"** Adjust if I correct you. Only proceed once I say go.

---

## 4. SCAFFOLD THE PROJECT

Once I approve, create this structure in the project root. **Create every file** — no empty placeholders without at least a heading and starter questions.

```
project-root/
├── CLAUDE.md                  # Constant rules/context for every session
├── handoff.md                 # HEAD of the linked list — where we are right now
├── new_session_prompt.md      # Paste-to-resume prompt for a fresh session
├── help.md                    # Human to-do list (accounts, APIs, keys)
├── docs/
│   └── master_plan.md         # The whole vision, written for a brand-new session
├── staging/
│   ├── stage-1-foundation/
│   │   ├── overview.md        # Goal of this stage + how we know it's done
│   │   └── feature-<name>.md  # One file per feature (+ open questions inside)
│   ├── stage-2-<name>/
│   │   ├── overview.md
│   │   └── feature-<name>.md
│   └── ...                    # As many stages as the roadmap needs
├── .gitignore
└── README.md                  # Short public-facing description
```

### 4a. The mental model (keep this true at all times)

- **CLAUDE.md** = the constant. It keeps every session behaving the same. It rarely changes.
- **handoff.md** = the **head of a linked list** — the single source of truth for "where are we right now."
- **The feature files in `staging/`** = the **linked list itself** — the ordered body of work, stage by stage.

Future sessions read `handoff.md` first (the head), then follow the pointer into the current stage's feature files.

### 4b. File templates — produce each one filled with real content from the interview

**`docs/master_plan.md`** — The complete vision, written so a brand-new Claude session with zero prior context could understand the entire project. Sections:
`# <Project> — Master Plan` · Pitch · Problem & Why · Target users & use cases · v1 scope (and explicit non-goals) · Future roadmap (6–12 mo) · Tech stack & key decisions (with the *why*) · Architecture sketch · Staged roadmap (table: stage → goal → headline feature) · Open questions & risks · Glossary.

**`handoff.md`** — The head of the linked list. Always reflects the latest state. Sections, in this exact order:

```markdown
# Handoff — <Project>
_Last updated: <date> · Current stage: <stage>_

## 🎯 Goals
The current objective(s) in one or two sentences.

## 📍 Current State
Where the project actually is right now — what works, what doesn't.

## 📂 Files I'm Working On
Paths + one line each on what's in flight.

## ✅ Things I've Changed
Recent changes this session/recently, newest first.

## ❌ Tried But Failed
Dead ends and WHY they failed — so we don't repeat them.

## ➡️ Next Up
The very next concrete action(s) to take.

## 🔗 Pointer
→ Current stage folder: `staging/<stage>/` · Active feature file: `staging/<stage>/feature-<name>.md`
```

**`new_session_prompt.md`** — A ready-to-paste prompt that reboots a fresh Claude Code session and drops it exactly where we left off. It should instruct the new session to: (1) read `CLAUDE.md`, then `handoff.md`, then the active feature file named in the handoff pointer; (2) summarize its understanding back to me in 3 bullets; (3) confirm the "Next Up" items before doing any work. Keep it copy-paste clean.

**`help.md`** — A detailed, ordered checklist of what **I (the human)** must do that Claude cannot — create accounts, get API keys, set up billing, install local tools, configure DNS, etc. For each item: what it is, why it's needed, a link if known, and which stage it blocks. Mark items `[ ]` / `[x]`.

**`CLAUDE.md`** — Proper project rules for every session. Include: project one-liner, tech stack, **the document workflow + linked-list model above**, coding conventions, how to run/test, branching/commit conventions, the **"update all relevant files" command** (Section 6), and a "read handoff.md first" instruction. Keep it tight — it's read every session.

**`staging/` files** — One folder per stage (`stage-1-foundation`, `stage-2-…`). Each folder gets:
- `overview.md` — the stage's goal, the features it contains, and its definition of done.
- One `feature-<name>.md` per feature. Early stages can be light, but **every feature file must contain an `## Open Questions` section** with the real unknowns we still need to resolve for that feature. Early/later stages can be progressively rougher — that's expected.

**`.gitignore` + `README.md`** — sensible defaults for the chosen stack.

### 4c. GitHub setup

After files exist, set up version control:

1. `git init`, add a stack-appropriate `.gitignore`, make the first commit.
2. Create the GitHub repo (use the `gh` CLI if available: `gh repo create`). If `gh` isn't installed or authenticated, **add the exact steps to `help.md`** for me to do it manually, and tell me here.
3. Push `main`. Propose a simple branching convention and record it in `CLAUDE.md`.

If anything here needs my credentials or a decision (private vs. public, repo name), **ask me** rather than guessing.

---

## 5. RECOMMEND SKILLS, SUB-AGENTS & TOOLS

Once scaffolding is done, recommend what would make THIS project faster, based on what you learned:

- **Skills** — which available skills fit this project (e.g., docx/pdf/xlsx for deliverables, design skills for UI, etc.) and when to reach for each.
- **Sub-agents** — propose 1–3 specialized sub-agents worth defining (e.g., a "test-writer," a "code-reviewer," a "research" agent), with a one-line purpose each.
- **MCP connectors / tools** — any external integrations (GitHub, a database, an API) worth connecting, and what they'd unlock.

Present these as a short ranked list with a clear "do this first" recommendation. Don't install anything without asking.

---

## 6. STANDING COMMAND — "update all relevant files"

Whenever I say **"update all relevant files"**, do this automatically:

1. **Review what happened this session** — what changed, what I decided, what got built, what failed.
2. **Update, as needed:**
   - `handoff.md` — refresh every section (Goals, Current State, Files, Changed, Tried/Failed, Next Up, Pointer). This always updates.
   - `new_session_prompt.md` — if the resume instructions or active pointer changed.
   - `CLAUDE.md` — only if a rule, convention, or stack fact changed.
   - The active **feature `.md` files** — tick off done items, resolve/append open questions.
   - The stage **`overview.md` files** — if a stage's scope or done-criteria shifted.
   - `docs/master_plan.md` — if the vision or roadmap genuinely changed.
   - `help.md` — if new human to-dos (accounts/keys) appeared.
3. **Infer relevance from the session** — don't ask me a checklist; decide what actually changed and update those files. Then give me a 3–5 line summary of what you updated and why.
4. Keep the **linked-list integrity**: `handoff.md`'s pointer must always point at the real current stage + active feature file.

Record this command in `CLAUDE.md` so every future session honors it.

---

## 7. START NOW

Begin with the **first interview question** (Section 2). One question. Then wait for me.
