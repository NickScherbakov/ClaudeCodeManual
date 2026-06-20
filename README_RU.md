# Claude Code: Продвинутые техники

**Первый русскоязычный курс по многоагентной оркестрации в Claude Code (Opus 4.8)**

[![GitHub Pages](https://img.shields.io/badge/Тренажёр-онлайн-brightgreen)](https://nickscherbakov.github.io/ClaudeCodeManual/)
[![License: CC0](https://img.shields.io/badge/License-CC0-blue.svg)](https://creativecommons.org/publicdomain/zero/1.0/)
[![Stars](https://img.shields.io/github/stars/NickScherbakov/ClaudeCodeManual?style=social)](https://github.com/NickScherbakov/ClaudeCodeManual)

---

## Проблема

Один промпт не справляется с реальными задачами:
- Аудит кодовой базы из 200 файлов — слишком большой для одного контекста
- Проверка результатов независимым агентом — нужен второй вызов
- Поиск уязвимостей, который не остановится, пока не найдёт всё — нужен цикл

Claude Code решает это через **Workflow tool** — встроенный оркестратор многоагентных систем. Но официальная документация не показывает, как его проектировать. Этот курс показывает.

---

## 🎯 Что вы получите

**[→ Открыть интерактивный тренажёр](https://nickscherbakov.github.io/ClaudeCodeManual/)**

*Интерактивный тренажёр открывается прямо в браузере. Прогресс сохраняется в localStorage. Мастер в Главе 0 генерирует стартовый workflow под вашу конкретную задачу.*

15 глав + 14 практических лабораторий, которые ведут от вопроса «что такое Workflow?» до работающей многоагентной системы, способной:

- обрабатывать задачи, слишком большие для одного промпта
- верифицировать результаты через адверсариального агента-скептика
- продолжаться с точки остановки без потери результатов
- распределять работу по 10+ агентам параллельно
- управлять токенным бюджетом и предотвращать перерасход

---

## Методология: от цели назад

Большинство курсов по AI начинают с инструмента. Этот курс начинает с **конечного состояния** — что должно существовать, когда работа закончена?

```
Цель (конечное состояние)
  → Декомпозиция (задачи как вход→выход)
    → Процессы (как задачи связаны во времени)
      → Ресурсы (агенты, схемы, бюджет)
```

Это не теория. Интерактивный мастер в Главе 0 проводит вас через эти четыре узла и генерирует заготовку кода для вашей конкретной задачи.

---

## Структура курса

### 🌐 Веб-тренажёр (`web/`)
Одностраничное приложение без фреймворков. Открывается прямо в браузере. Прогресс сохраняется в localStorage.

| # | Глава | Что изучается |
|---|-------|--------------|
| ★ | Введение | Как устроен тренажёр, сквозной пример |
| 0 | Четыре узла | Цель → Декомпозиция → Процессы → Ресурсы |
| 1 | CLI-мастерство | Режимы, slash-команды, `/memory`, хуки |
| 2 | Первый агент | `agent()`, `phase()`, `log()`, схемы |
| 3 | Параллелизм | `parallel()` vs `pipeline()` — когда что |
| 4 | Динамические циклы | `loop-until-dry`, бюджетные петли |
| 5 | Схемы | JSON Schema, `enum`, `required`, retry |
| 6 | Адверсариальная верификация | Скептики, голосование большинства |
| 7 | Полнота | Completeness critic, multi-modal sweep |
| 8 | Хуки | Pre/post-tool хуки, автоматизация |
| 9 | Память | Файловая система памяти, типы записей |
| 10 | Skills и MCP | Создание и вызов скилов, MCP-серверы |
| 11 | Бюджет | `budget.total`, `remaining()`, масштабирование |
| 12 | Worktree | Изоляция параллельных изменений |
| 13 | Итог | Сквозная система: от концепции до отчёта |

### 🧪 Лабораторки (`labs/`)
14 практических заданий. Каждое: задача → starter-шаблон → критерии успеха.

```bash
# Как запустить лаб:
# 1. Прочитайте labs/02-workflow-fundamentals/lab.md
# 2. Напишите решение в starter.js
# 3. Скажите Claude:
Запусти labs/02-workflow-fundamentals/starter.js как workflow +50k
```

### 💡 Примеры из жизни (`project/`, `examples/`)

| Файл | Что делает |
|------|-----------|
| `examples/quick-demo.js` | Быстрый старт: параллельный поиск + адверсариальная верификация за 30 секунд |
| `examples/code-review.js` | Code review: 4 сканера → дедупликация → 3 скептика на каждую находку |
| `project/system.js` | Полный аудит кода: анализ → верификация → отчёт |
| `project/infolimp-audit.js` | Аудит информационных потоков |
| `examples/publisher-manual/` | Workflow для создания издательского мануала |

### 📋 Шпаргалки (`cheatsheets/`)
- `workflow-api.md` — все функции с сигнатурами
- `patterns-reference.md` — готовые паттерны (pipeline, loop-until-dry, adversarial)
- `subagent-types.md` — типы агентов и когда что использовать

---

## Быстрый старт

### 1. Откройте тренажёр в браузере

**→ [nickscherbakov.github.io/ClaudeCodeManual](https://nickscherbakov.github.io/ClaudeCodeManual/)**

Или клонируйте и откройте `web/index.html` локально — никакого сборщика не нужно.

### 2. Запустите пример workflow

```bash
git clone https://github.com/NickScherbakov/ClaudeCodeManual.git
cd ClaudeCodeManual
```

В Claude Code:
```
Запусти project/system.js как workflow +100k
```

### 3. Пройдите лабы по порядку

`labs/00-setup` → `labs/01-cli-mastery` → `labs/02-workflow-fundamentals` → ...

---

## Ключевые паттерны

```javascript
// Pipeline — по умолчанию для многошагового анализа
const results = await pipeline(
  files,
  file => agent(`Проанализируй ${file}`, { schema: ANALYSIS }),
  analysis => agent(`Верифицируй: ${analysis.findings}`, { schema: VERDICT })
)

// Parallel с барьером — только когда нужны ВСЕ результаты сразу
const allFindings = await parallel(DIMENSIONS.map(d => () =>
  agent(d.prompt, { schema: FINDINGS })
))
const deduped = dedupe(allFindings.filter(Boolean).flat())

// Loop-until-dry — пока не иссякнут новые находки
const seen = new Set()
let dry = 0
while (dry < 2) {
  const fresh = findings.filter(f => !seen.has(key(f)))
  if (!fresh.length) { dry++; continue }
  dry = 0
  fresh.forEach(f => seen.add(key(f)))
}

// Budget-aware loop
while (budget.total && budget.remaining() > 50_000) {
  const batch = await agent('Найди ещё', { schema: BUGS })
  bugs.push(...batch.items)
}
```

---

## Важные правила Workflow-скриптов

Все `.js` в `project/`, `labs/`, `solutions/` — это **скрипты для Workflow tool**, не Node.js модули. Запускать через `node` нельзя — только через Claude Code.

```javascript
export const meta = {
  name: 'my-workflow',       // обязателен
  description: 'Что делает', // обязателен
  phases: [
    { title: 'Анализ' },     // title MUST совпадать с phase('Анализ')
    { title: 'Верификация' }
  ]
}

// Недоступно в workflow-скриптах (ломает resume):
// Date.now(), Math.random(), new Date()
```

---

## Упомянуто в

Курс ожидает включения в следующие подборки:

| Список | Звёзды | Ссылка |
|--------|--------|--------|
| hesreallyhim/awesome-claude-code | 47k | Issue #2081 |
| ComposioHQ/awesome-claude-skills | 65k | PR #1125 |
| aishwaryanr/awesome-generative-ai-guide | 27k | PR #161 |
| caramaschiHG/awesome-ai-agents-2026 | 1.1k | PR #363 |
| rohitg00/awesome-claude-code-toolkit | 2.1k | PR #572 |
| jqueryscript/awesome-claude-code | 430 | PR #423 |

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=NickScherbakov/ClaudeCodeManual&type=Date)](https://star-history.com/#NickScherbakov/ClaudeCodeManual&Date)

---

## Участие в проекте

Этот курс — живой документ. Если вы:
- нашли ошибку в тексте — откройте Issue
- хотите добавить главу или лаб — PR приветствуется
- используете Workflow для своего проекта — расскажите в Discussions

**[→ Обсуждения](https://github.com/NickScherbakov/ClaudeCodeManual/discussions)** · **[→ Открыть Issue](https://github.com/NickScherbakov/ClaudeCodeManual/issues)**

---

## 🇬🇧 English version

See [README.md](README.md) for the English version.

---

**Лицензия:** CC0 — используйте как хотите, в том числе в коммерческих целях.
