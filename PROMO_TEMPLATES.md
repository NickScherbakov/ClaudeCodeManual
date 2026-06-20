# Шаблоны для продвижения курса

*Использовать после пуша и включения Discussions*

---

## Telegram — короткий пост (AI-каналы, 280 символов)

```
📚 Бесплатный русскоязычный курс по Claude Code Workflow

15 глав + 14 лабов. Интерактивный тренажёр в браузере.
Тема: многоагентная оркестрация — как заставить 10+ агентов работать параллельно, верифицировать результаты и не терять прогресс при падении.

→ https://nickscherbakov.github.io/ClaudeCodeManual/
→ https://github.com/NickScherbakov/ClaudeCodeManual

⭐ Звезда не обязательна, но помогает
```

---

## Telegram — развёрнутый пост (developer-чаты)

```
Собрал бесплатный курс по продвинутым техникам Claude Code — специально для русскоязычной аудитории.

**Что внутри:**
• Workflow tool: как организовать несколько агентов в повторяемый процесс
• pipeline() vs parallel() — когда что, с примерами
• loop-until-dry: поиск, который не останавливается, пока не иссякнет
• Адверсариальная верификация: агент-скептик проверяет результаты
• Управление бюджетом токенов

**Формат:**
• 15 интерактивных глав (тренажёр открывается в браузере, прогресс сохраняется)
• 14 практических лабораторий с нарастающей сложностью
• Реальные примеры workflow-скриптов

**Подход:** курс начинает не с инструмента, а с конечного состояния. "Что должно существовать, когда работа закончена?" — и только потом декомпозиция и агенты.

Тренажёр: https://nickscherbakov.github.io/ClaudeCodeManual/
GitHub: https://github.com/NickScherbakov/ClaudeCodeManual

Если полезно — звезда на GitHub очень поможет.
```

---

## Habr — заголовок и тэги

**Заголовок:** `Claude Code Workflow: как устроена многоагентная оркестрация и где люди чаще всего ошибаются`

**Тэги:** `claude`, `ai`, `workflow`, `многоагентность`, `llm`, `claude-code`, `tutorial`

**Черновик статьи:** `HABR_ARTICLE_DRAFT.md` в этом репозитории.

---

## Reddit r/ClaudeAI — English post

```
**I built a free Russian-language course on Claude Code's Workflow tool (15 chapters + 14 labs)**

Most Claude Code tutorials stop at "write a prompt." This course is about what comes next: the Workflow tool — Claude Code's built-in multi-agent orchestrator.

What you can do with it that a single prompt can't:
- Run 10+ agents in parallel across a 300-file codebase
- Verify each finding with an independent skeptic agent (adversarial verify)
- Resume from the exact point of failure without re-running completed work
- Scale analysis depth to your token budget

The course is designed for Russian-speaking learners, but the code examples and Workflow scripts are language-agnostic.

Interactive trainer (browser, no install): https://nickscherbakov.github.io/ClaudeCodeManual/
GitHub (source + labs + reference solutions): https://github.com/NickScherbakov/ClaudeCodeManual

A ⭐ on GitHub helps more people find it.
```

---

## GitHub Release Notes (v1.0)

```markdown
## Claude Code: Продвинутые техники — v1.0

Первый стабильный выпуск курса.

### Что включено
- 15 интерактивных глав в веб-тренажёре
- 14 практических лабораторий
- 3 эталонных решения для лабов 02, 03, 06
- Реальные Workflow-скрипты в `project/`
- Шпаргалки по Workflow API, паттернам, типам агентов

### Запуск
Откройте https://nickscherbakov.github.io/ClaudeCodeManual/ или клонируйте и откройте `web/index.html`.

### Требования
Claude Code с доступом к Opus 4.8. Workflow-скрипты запускаются только внутри Claude Code.
```

---

---

## Hacker News — Show HN (English, max impact)

*Постить в будни с 9:00 до 12:00 UTC. Заголовок строго "Show HN:", никакой рекламы.*

**Title:**
```
Show HN: Free course on Claude Code's Workflow tool – multi-agent orchestration, 15 chapters
```

**First comment (добавить сразу после публикации):**
```
I built this after struggling to find practical resources on Claude Code's Workflow tool beyond the official docs.

The Workflow tool lets you run dozens of agents in parallel, verify results adversarially, and resume from failure without re-running completed work. It's qualitatively different from a single prompt — but the patterns (pipeline vs parallel barrier, loop-until-dry, adversarial verify) aren't obvious.

The course is in Russian (aimed at Russian-speaking devs), but the code examples and runnable Workflow scripts are language-agnostic. You can clone and run `examples/quick-demo.js` as a workflow in Claude Code to see the parallel-search + adversarial-verify pattern in action in ~30 seconds.

Interactive trainer (browser, no install): https://nickscherbakov.github.io/ClaudeCodeManual/
GitHub: https://github.com/NickScherbakov/ClaudeCodeManual

Happy to answer questions about the Workflow tool patterns.
```

**URL to submit:** `https://github.com/NickScherbakov/ClaudeCodeManual`
**Submit at:** https://news.ycombinator.com/submit

---

## ProductHunt — Launch (English)

*Лучшее время: вторник/среда, 00:01 PT (08:01 UTC)*

**Name:** `Claude Code: Advanced Techniques Trainer`

**Tagline (60 chars max):**
```
Free multi-agent orchestration course for Claude Code
```

**Description:**
```
One prompt can't audit 300 files, verify each finding independently, and resume where it left off. Claude Code's Workflow tool can.

This free course teaches the Workflow tool from scratch — the patterns that aren't in the docs:

• pipeline() vs parallel() barrier — when each applies
• loop-until-dry — discovery that runs until findings are exhausted
• Adversarial verify — skeptic agents that default to "refuted"
• Budget-aware loops — scale depth to your token budget

Format: 15 interactive chapters + 14 hands-on labs. Opens in the browser, no install, progress saved in localStorage.

Runnable workflow scripts included — clone and tell Claude Code to run examples/quick-demo.js as workflow +30k to see parallel search + adversarial verify in action.

Content is in Russian (first comprehensive Russian-language resource on this topic), but all code examples and workflow scripts are language-agnostic.
```

**Links:**
- Website: `https://nickscherbakov.github.io/ClaudeCodeManual/`
- GitHub: `https://github.com/NickScherbakov/ClaudeCodeManual`

**Tags:** `Developer Tools`, `Artificial Intelligence`, `Education`, `Open Source`

---

## Twitter/X — тред (English)

```
1/ One prompt can't audit 300 files, verify each finding independently, and resume where it left off.

Claude Code's Workflow tool can. I built a free course on it.

🧵

2/ The Workflow tool is Claude Code's built-in multi-agent orchestrator. You write a JS script, pass it to Claude, and it fans out agents, manages concurrency, and resumes from failure.

It's not a prompt. It's a program where the workers are AI agents.

3/ Three patterns the docs don't explain well:

pipeline() = default. Stage A runs → feeds Stage B. Each item moves independently — no barrier.

parallel() barrier = only when Stage B genuinely needs ALL of Stage A. Most people overuse this.

4/ loop-until-dry: keep spawning finders until K consecutive rounds return nothing new.

Key mistake: dedup against a `seen` Set of ALL candidates, not just confirmed ones. Otherwise verifier-rejected items reappear every round and it never converges.

5/ Adversarial verify: skeptic agents default to refuted=true. Majority vote to survive.

This is the pattern that separates "found stuff" from "found stuff I trust."

6/ I put all of this into a free course:
• 15 interactive chapters
• 14 hands-on labs
• Runnable workflow scripts

Content is in Russian (first comprehensive RU resource on the topic), but all code is language-agnostic.

Try it: https://nickscherbakov.github.io/ClaudeCodeManual/
GitHub: https://github.com/NickScherbakov/ClaudeCodeManual

⭐ helps more people find it
```

---

## Dev.to — English article (shorter version of Habr article)

**Title:** `How Claude Code's Workflow tool works — and 3 patterns the docs don't explain`

**Tags:** `claudeai`, `ai`, `tooling`, `opensource`

**First paragraph:**
```
Most Claude Code tutorials stop at "write a better prompt." This one starts where that ends.

Claude Code has a built-in multi-agent orchestrator called the Workflow tool. You pass it a JavaScript script, and it fans out agents, manages concurrency, handles retries, and resumes from the exact point of failure. It's not a prompt — it's a program where the workers are AI agents.

Here are the three patterns that took me the longest to understand.
```
*(Then cover pipeline vs parallel barrier, loop-until-dry, adversarial verify — same structure as Habr article but in English)*

---

## Каналы для публикации (по приоритету)

1. **Hacker News Show HN** — шаблон выше. Пик трафика = сотни звёзд за 24ч
2. **ProductHunt** — шаблон выше. Нужен аккаунт с историей (не новый)
3. **Habr** — статья (HABR_ARTICLE_DRAFT.md готов, адаптировать под аккаунт)
4. **Twitter/X** — тред выше
5. **@claude_ai_ru** или аналогичные Telegram-каналы об AI
6. **@ai_machinelearning_big_data** (крупный RU AI-канал)
7. **Reddit r/ClaudeAI** — английская версия поста
8. **Dev.to** — английская статья (шаблон выше)
