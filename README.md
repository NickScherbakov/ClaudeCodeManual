# Claude Code: Advanced Techniques

> One prompt can't audit 300 files, verify each finding independently, and resume where it left off. The **Workflow tool** built into Claude Code can — and this course shows exactly how.

**The first comprehensive Russian-language course on multi-agent orchestration with Claude Code (Opus 4.8)**

[![Live Trainer](https://img.shields.io/badge/Interactive_Trainer-online-brightgreen)](https://nickscherbakov.github.io/ClaudeCodeManual/)
[![License: CC0](https://img.shields.io/badge/License-CC0-blue.svg)](https://creativecommons.org/publicdomain/zero/1.0/)
[![Stars](https://img.shields.io/github/stars/NickScherbakov/ClaudeCodeManual?style=social)](https://github.com/NickScherbakov/ClaudeCodeManual)

> **Note:** Content is in Russian. See [README_RU.md](README_RU.md) for the full guide in Russian.

---

## What This Is

A hands-on training course for Claude Code's **Workflow tool** — the built-in multi-agent orchestrator that lets you:

- run 10+ agents in parallel across large codebases
- verify results adversarially with skeptic agents
- resume from the exact point of failure without re-running completed work
- manage token budgets and scale depth to available resources

The course is organized around **designing systems from the goal backward** — final state first, resources last. An interactive wizard in Chapter 0 walks you through the four design nodes and generates a starter workflow for your specific problem.

---

## **[→ Open the Interactive Trainer](https://nickscherbakov.github.io/ClaudeCodeManual/)**

15 chapters + 14 hands-on labs. No build step — opens directly in the browser.

*The Chapter 0 wizard generates a starter workflow for your specific task. Progress saved in localStorage.*

---

## Try it in 30 seconds

Clone the repo, then tell Claude Code:

```
Run examples/quick-demo.js as workflow +30k
```

You'll see three agents searching in parallel, then a skeptic agent verifying each finding independently. That's the core Workflow pattern — this course teaches you to build systems like this from scratch.

## Quick Start

```bash
git clone https://github.com/NickScherbakov/ClaudeCodeManual.git
```

Open `web/index.html` in your browser for the interactive 15-chapter trainer, or run the full codebase audit demo:

```
Run project/system.js as workflow +100k
```

---

## What You'll Learn

| Pattern | When to use |
|---------|-------------|
| `pipeline()` | Multi-stage analysis where each stage builds on the previous |
| `parallel()` barrier | Only when stage N genuinely needs ALL of stage N-1 |
| Loop-until-dry | Discovery tasks where you don't know how many findings exist |
| Adversarial verify | Independent skeptics that default to "refuted" — majority vote to survive |
| Budget-aware loops | Scale depth to the user's token budget directive |
| Schema-forced output | JSON Schema on `agent()` forces structured output with auto-retry |

---

## Repository Structure

```
web/            # Interactive SPA trainer (15 chapters, no build needed)
labs/           # 14 hands-on labs (00-setup → 13-capstone)
solutions/      # Reference solutions for labs 02, 03, 06
project/        # Real-world workflow examples (system audit, publisher manual)
cheatsheets/    # Quick-reference markdown (Workflow API, patterns, agent types)
target/         # Intentionally buggy file used as analysis subject in labs
```

---

## Key Rules for Workflow Scripts

All `.js` files under `project/`, `labs/`, `solutions/` are **Workflow tool scripts**, not Node.js modules. Run only inside Claude Code — never with `node`.

- `meta` must be a pure literal (no variables or function calls)
- `parallel()` returns `null` on failure — always `.filter(Boolean)`
- `pipeline()` is the default; use a `parallel()` barrier only when you need ALL prior results at once
- `Date.now()`, `Math.random()`, argless `new Date()` are unavailable (they break workflow resume)
- Budget loops must guard on `budget.total` — `remaining()` is `Infinity` when no budget is set

---

## Contributing

Found an error? Want to add a chapter, lab, or example? PRs welcome.

**[Discussions](https://github.com/NickScherbakov/ClaudeCodeManual/discussions)** · **[Issues](https://github.com/NickScherbakov/ClaudeCodeManual/issues)**

---

**License:** CC0 — use freely, including commercially.
