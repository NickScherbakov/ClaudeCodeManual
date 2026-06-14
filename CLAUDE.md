# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A bilingual (Russian-language content) **training course for advanced Claude Code techniques on Opus 4.8**, centered on the **Workflow tool** (multi-agent orchestration). It is not an application — it is teaching material plus runnable example Workflow scripts. There is no build system, no `package.json`, no test runner, no linter, and it is not a git repo. Do not invent build/test commands.

The audience is Russian-speaking learners who may not be programmers and are learning Claude Code through practical authoring and publishing work: a technical author receives a publisher commission, creates the publisher's GitHub repository, and develops a practical guide to advanced Claude Code techniques for textbook authors. Prose favors plain-language framing over jargon. **All user-facing content is Russian — keep it Russian** when editing chapters, labs, or comments. Match the existing calm, problem-first tone (see the memory note on explanation style: lead with the real-world problem, not the tool capability).

## The two delivery surfaces

1. **`web/`** — a self-contained browser trainer (single-page app, no bundler).
   - `index.html` loads `content.js` then `app.js` from disk and pulls `marked` + `prismjs` from CDN. Both local scripts are cache-busted with `?v=N` query strings — **bump that `v` in `index.html` when you change `content.js` or `app.js`**, or the browser serves stale cached copies.
   - `content.js` is the **single source of truth for all chapter prose** (the `CHAPTERS` array) and the cheatsheet panel (`CHEATSHEETS`). The header comment says "ported from GUIDE.md" but no GUIDE.md exists — edit chapters directly in `content.js`. Each chapter is `{ id, num, title, summary, body (markdown), widget?, quiz? }`.
   - `app.js` is routing/state/rendering. State (progress, the Chapter-0 concept wizard, theme) persists in `localStorage` under `cc-trainer-state-v1`. Two interactive widgets are mounted by id from chapter `body`: `conceptWizard` (Глава 0) and `parallelAnimator` (Глава 2). Adding a widget means: reference its `<div id="...">` in the markdown `body`, set `widget:` on the chapter, and add a `mount...` branch in `renderChapter`.
   - To preview: open `web/index.html` directly, or serve the folder over any static server. No build step.

2. **`labs/`** — 14 hands-on labs (`00-setup` … `13-capstone`), each a `lab.md` (Russian, with difficulty stars + success criteria) and sometimes a `starter.js`. `solutions/` holds reference solutions for a subset of labs (02, 03, 06 only — others are intentionally omitted). `cheatsheets/` are standalone quick-reference markdown.

The web chapters and the labs cover the **same 12-chapter arc in parallel** (CLI → first agent → parallel → pipeline → dynamic loops → schema → adversarial verify → completeness → hooks → memory → skills/MCP → budget → worktree). Keep them conceptually in sync when changing one.

## Critical: the `.js` files are Workflow scripts, not Node programs

Every `.js` under `project/`, `solutions/`, `examples/`, and `labs/*/starter.js` is a **script for the Claude Code Workflow tool**, not a standalone Node module. **Never run them with `node`.** They run only inside a Workflow invocation, where these globals are injected (no imports): `agent()`, `parallel()`, `pipeline()`, `phase()`, `log()`, `budget`, `args`, `workflow()`. They are plain JS (not TypeScript), and `Date.now()` / `Math.random()` / argless `new Date()` are unavailable by design (they break workflow resume).

A user runs one by telling Claude, e.g. `Запусти project/system.js как workflow +100k` — Claude reads the file and passes its contents to the Workflow tool. The `+Nk` suffix sets the token budget exposed as `budget.total`.

When writing or reviewing these scripts, the course's own rules are the house style — enforce them:
- `export const meta` must be a **pure literal** (no variables/calls) — required for resume; `meta.phases[].title` must match the `phase('...')` strings used in the body.
- `parallel()` returns `null` (never throws) for a failed agent → **always `.filter(Boolean)`** before use.
- `pipeline()` is the default for multi-stage work; reserve a `parallel()` barrier between stages only when stage N genuinely needs *all* of stage N-1 (dedup, early-exit, cross-item comparison).
- `loop-until-dry`: dedup new findings against a persistent `seen` Set, **not** against the accumulated/confirmed results — comparing against results makes verifier-rejected items reappear forever.
- Adversarial verify defaults skeptics to `refuted=true` on doubt; survival is a majority vote.
- Budget loops must guard on `budget.total` (`while (... && (!budget.total || budget.remaining() > N))`) because `remaining()` is `Infinity` when no budget was set.
- `schema` (JSON Schema) on `agent()` forces structured output with auto-retry on mismatch; prefer strict `enum`/`required` over free strings.

`target/app.js` is a deliberately flawed file used as the analysis subject by `project/system.js` and several labs — its bugs/vulnerabilities are intentional teaching fixtures, not defects to fix.

## The pedagogical spine: goal-first ("4 nodes")

The whole course is organized around designing a system **from the goal backward**, and the user holds this strongly (see memory): **Goal (to-be end state) → Decomposition (tasks as input→output) → Processes (how tasks relate in time) → Resources (solvers: agents/schemas) — resources LAST**. Reject input-first framing ("what data do I have?"). Chapter 0's interactive wizard (`mountConceptWizard` in `app.js`) walks the user through these four nodes and emits a concept prompt they hand back to Claude to scaffold `project/system.js`. New example workflows (see the header comments in `project/system.js`, `project/infolimp-audit.js`, `examples/publisher-manual/publisher-manual-workflow.js`) document themselves against these four nodes — follow that convention.
