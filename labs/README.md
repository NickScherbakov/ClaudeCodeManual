# Практические лаборатории

14 лабораторий, которые ведут от «что такое Workflow?» до работающей многоагентной системы.

> Каждая лаборатория: задача → условия успеха → starter-шаблон → решение (для части лабов).

---

## Порядок прохождения

| № | Папка | Тема | Сложность |
|---|-------|------|-----------|
| 0 | `00-setup` | Настройка среды и первый вызов `agent()` | ★ |
| 1 | `01-cli-mastery` | Режимы CLI, slash-команды, хуки | ★ |
| 2 | `02-workflow-fundamentals` | Первый настоящий workflow: `meta`, `phase()`, `schema` | ★★ |
| 3 | `03-pipeline-vs-parallel` | Когда `pipeline()`, когда `parallel()` барьер | ★★ |
| 4 | `04-dynamic-workflows` | Loop-until-dry, бюджетные петли | ★★★ |
| 5 | `05-structured-output` | JSON Schema, `enum`, `required`, auto-retry | ★★ |
| 6 | `06-adversarial-verification` | Три скептика, голосование большинства | ★★★ |
| 7 | `07-advanced-patterns` | Completeness critic, multi-modal sweep | ★★★ |
| 8 | `08-hooks-automation` | Pre/post-tool хуки, Stop-хук | ★★ |
| 9 | `09-memory-system` | Типы памяти, структура файлов, `/remember` | ★★ |
| 10 | `10-skills-mcp` | Создание skills, MCP-серверы | ★★★ |
| 11 | `11-budget-management` | `budget.total`, `remaining()`, масштабирование флота | ★★★ |
| 12 | `12-worktree-isolation` | `isolation: 'worktree'`, параллельные изменения | ★★★ |
| 13 | `13-capstone` | Сквозная система: от концепции до отчёта | ★★★★ |

---

## Как запустить лаб

```bash
# 1. Прочитайте условие
# Откройте labs/02-workflow-fundamentals/lab.md

# 2. Напишите решение
# Редактируйте labs/02-workflow-fundamentals/starter.js

# 3. Запустите через Claude Code
Запусти labs/02-workflow-fundamentals/starter.js как workflow +50k
```

**Важно:** файлы `starter.js` — это **скрипты для Workflow tool**, не Node.js модули. `node starter.js` не сработает.

---

## Структура каждой лаборатории

```
labs/02-workflow-fundamentals/
  lab.md          # Условие, контекст, критерии успеха
  starter.js      # Шаблон с TODO — ваша отправная точка
```

Решения доступны только для лабораторий 02, 03, 06 в папке [`solutions/`](../solutions/). Остальные — намеренно без подсказок: задача не скопировать, а спроектировать.

---

## Соответствие главам тренажёра

Лаборатории и главы [интерактивного тренажёра](https://nickscherbakov.github.io/ClaudeCodeManual/) покрывают одну и ту же дугу в параллель. Читайте главу → выполняйте лаб → переходите к следующей.
