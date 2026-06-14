# Claude Code Trainer — Opus 4.8

**Interactive course on advanced Claude Code techniques**

> A practical guide for developers and technical authors learning multi-agent orchestration in Copilot CLI.

## 🎯 About This Project

This is not an application — it's **teaching material + code examples**. The course covers:

- **Workflow tool** — orchestrating multiple agents for complex tasks
- **Multi-agent systems** — parallel execution, pipelines, dynamic loops
- **Structured outputs** — JSON Schema for reliable results
- **Verification and validation** — adversarial analysis, loop-until-dry patterns
- **Memory and budget management** — working efficiently with context

Material is organized around **four design nodes**:
1. **Goal** (end state) — what we're trying to achieve
2. **Decomposition** (tasks) — input→output transformations needed
3. **Processes** (relationships) — how tasks connect in time
4. **Resources** (solvers) — which agents/tools we need

## 📚 Project Structure

```
├── web/                          # Interactive trainer (SPA)
│   ├── index.html               # Main page
│   ├── app.js                   # Routing and state logic
│   ├── content.js               # All chapters and cheatsheets (15 chapters)
│   └── styles.css               # Styling
│
├── labs/                         # 14 hands-on laboratories
│   ├── 00-setup/                # Environment setup
│   ├── 01-cli-mastery/          # CLI basics
│   ├── 02-workflow-fundamentals/# Workflow essentials
│   ├── 03-pipeline-vs-parallel/ # Pipelines vs parallelism
│   ├── 04-dynamic-workflows/    # Dynamic workflows
│   ├── 05-structured-output/    # JSON Schema
│   ├── 06-adversarial-verify/   # Verification techniques
│   ├── 07-advanced-patterns/    # Advanced patterns
│   ├── 08-hooks-automation/     # Hooks and automation
│   ├── 09-memory-system/        # Memory system
│   ├── 10-skills-mcp/           # Skills and MCP
│   ├── 11-budget-management/    # Budget management
│   ├── 12-worktree-isolation/   # Isolated worktrees
│   └── 13-capstone/             # Final project
│
├── solutions/                    # Reference solutions (selective)
│   ├── 02-workflow-fundamentals.js
│   ├── 03-pipeline-vs-parallel.js
│   └── 06-adversarial-verification.js
│
├── project/                      # Real-world Workflow examples
│   ├── system.js               # Full-featured system
│   ├── infolimp-audit.js        # Information warfare audit
│   └── trainer-improve.js       # Trainer improvement workflow
│
├── examples/                     # Additional examples
│   └── publisher-manual/        # Example: publishing a manual
│
└── cheatsheets/                 # Quick references
    ├── workflow-api.md          # Workflow API
    ├── subagent-types.md        # Agent types
    └── patterns-reference.md    # Design patterns
```

## 🚀 Getting Started

### 1. Interactive Web Trainer
Visit: **https://nickscherbakov.github.io/ClaudeCodeManual/**

You'll find 15 interactive chapters with explanations, code examples, and comprehension checks.

### 2. Hands-on Labs
In the `labs/` folder — 14 practical exercises with increasing difficulty. Each contains:
- `lab.md` — task description and success criteria
- `starter.js` — code template (optional)

**How to work through a lab:**
```bash
# 1. Read lab.md
# 2. Write your solution in starter.js (or create a new file)
# 3. Run in Copilot:
Run labs/02-workflow-fundamentals/starter.js as workflow +50k
```

### 3. Code Examples
In `project/` and `solutions/` — ready-to-use Workflows you can:
- Run as-is
- Modify for your needs
- Use as a reference for patterns

## 📖 Working with .js Files

**All .js files are Workflow scripts**, not Node.js modules. They work **only inside Copilot Workflow tool**.

```javascript
// Example: project/system.js
export const meta = {
  phases: [
    { title: 'Analysis', description: 'Code review' },
    { title: 'Verification', description: 'Validate results' }
  ]
};

export default async function() {
  // Runs inside Workflow
  const results = await agent('claude-opus-4.8', {
    task: 'Find security vulnerabilities',
    schema: { /* JSON Schema */ }
  });
  
  return results;
}
```

**To run:**
```
Run project/system.js as workflow +100k
```

The `+100k` flag sets the token budget (optional).

## 🧠 Key Concepts

### Workflow API
- `agent()` — create an agent for a specific task
- `parallel()` — run multiple agents simultaneously
- `pipeline()` — execute tasks sequentially
- `phase()` — mark a stage in the UI
- `loop()` — dynamic loop with condition

### Four Design Nodes
1. **Goal** — "I want to find security vulnerabilities in my app"
2. **Decomposition** — tasks: parse code → static analysis → testing
3. **Processes** — parse first, then run analysis and tests in parallel
4. **Resources** — 3 agents (parser, analyst, tester)

### Patterns
- **Pipeline** — for sequential stages (data → process → verify)
- **Parallel** — when stages are independent
- **Loop-until-dry** — repeat analysis until no new findings
- **Adversarial verify** — a "skeptic" checks results for errors

## 📝 Quick References

Fast access to API and patterns:
- [Workflow API](cheatsheets/workflow-api.md) — all functions
- [Agent Types](cheatsheets/subagent-types.md) — explore, task, general-purpose, code-review, research
- [Patterns](cheatsheets/patterns-reference.md) — ready-made solutions

## 🎓 Recommended Learning Path

1. **Chapter 0** — four design nodes basics (web trainer)
2. **Lab 00** — setup (verify everything works)
3. **Chapters 1–3** — CLI, first agent, parallelism
4. **Labs 02–03** — practice pipelines and parallel execution
5. **Chapters 4–7** — dynamic workflows, schemas, verification
6. **Labs 04–07** — practice advanced techniques
7. **Chapters 8–12** — hooks, memory, skills, budget, worktrees
8. **Labs 08–13** — integrate everything, final project

## 🔧 Tech Stack

- **Copilot CLI** — primary tool (workflow system)
- **Vanilla JavaScript** — web UI (no frameworks)
- **Marked.js** — markdown to HTML
- **Prism.js** — syntax highlighting
- **JSON Schema** — structured outputs

## 📌 Important Notes

- `.js` files in `project/`, `solutions/`, `labs/` are **Workflow scripts**, not Node modules
- Run them in Claude Code: `Run <path>.js as workflow +<budget>`
- `meta.phases` must exactly match `phase()` calls in code
- `parallel()` returns `null` on error — always `.filter(Boolean)`
- Don't use `Date.now()` or `Math.random()` in Workflow (breaks resume)

## 🌍 Language Versions

- 🇷🇺 **Russian:** [README.md](README.md)
- 🇬🇧 **English:** [README_EN.md](README_EN.md) (this file)

## 📬 License

CC0 (Public Domain) — free to use for educational and commercial purposes.

---

**Author:** Copilot (GitHub)  
**Version:** 1.0 (Opus 4.8)

Happy learning! 🚀
