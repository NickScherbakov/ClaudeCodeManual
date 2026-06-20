# Шпаргалки

Три быстрых справочника для работы с Workflow tool. Подходят для распечатки и держать рядом во время работы.

---

## [`workflow-api.md`](workflow-api.md) — Полный справочник API

Все глобальные функции с сигнатурами, правилами и примерами:

- `agent()` — параметры, `schema`, `model`, `isolation`, `agentType`
- `pipeline()` vs `parallel()` — когда каждый
- `phase()`, `log()`, `budget`, `args`, `workflow()`
- Правила `meta` — почему чистый литерал, как совпадают `phase()` и `meta.phases`
- Ограничения скриптов — `Date.now()`, `Math.random()` недоступны и почему
- Resume — как возобновить прерванный workflow

## [`patterns-reference.md`](patterns-reference.md) — Готовые паттерны

9 паттернов с кодом и объяснением когда применять:

1. **Adversarial verify** — 3 скептика, каждый по умолчанию `refuted: true`, выживают ≥2 голоса
2. **Perspective-diverse verify** — разные линзы (correctness / security / perf) вместо одинаковых скептиков
3. **Judge panel** — N независимых попыток, жюри выбирает победителя
4. **Multi-modal sweep** — параллельные агенты ищут каждый своим способом
5. **Completeness critic** — спрашивает, какую категорию не смотрели вообще
6. **Loop-until-dry** — деду по `seen` Set, счётчик dry-раундов, не против accumulated
7. **Loop-until-budget** — `while (budget.total && budget.remaining() > N)`
8. **Dynamic scaling** — `Math.floor(budget.total / 100_000)` агентов
9. **Pipeline** — стадии без барьера, каждый элемент движется независимо

## [`subagent-types.md`](subagent-types.md) — Типы агентов

Встроенные типы субагентов (`agentType`), когда каждый даёт лучший результат, и как комбинировать с `schema`.

---

Подробная документация в тренажёре: **[nickscherbakov.github.io/ClaudeCodeManual](https://nickscherbakov.github.io/ClaudeCodeManual/)**
