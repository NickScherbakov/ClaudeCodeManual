# Участие в проекте / Contributing

*English below.*

## По-русски

Курс живой — любые улучшения приветствуются.

### Что принимается

| Тип вклада | Куда |
|-----------|------|
| Ошибка в тексте главы или лаба | Issue или PR в `web/content.js` / `labs/` |
| Новый пример Workflow-скрипта | PR в `examples/` |
| Перевод на другой язык | Обсудите в Discussions сначала |
| Исправление в шпаргалках | PR в `cheatsheets/` |
| Ошибка в `app.js` / `styles.css` | PR с описанием симптома |

### Правила для Workflow-скриптов

Файлы в `examples/` и `labs/` — это **скрипты для Workflow tool**, не Node.js модули. При добавлении нового примера:

1. Файл должен начинаться с `export const meta = { name, description, phases }` — чистый литерал, без переменных.
2. Каждый `phase()` в теле должен совпадать с заголовком в `meta.phases`.
3. `parallel()` возвращает `null` при ошибке агента — всегда `.filter(Boolean)`.
4. `Date.now()`, `Math.random()`, `new Date()` без аргументов недоступны (ломают resume).
5. Бюджетные циклы: `while (budget.total && budget.remaining() > N)` — не `while (budget.remaining() > N)`.

Подробно: [`cheatsheets/workflow-api.md`](cheatsheets/workflow-api.md)

### Правки в веб-тренажёре

Весь текст глав живёт в `web/content.js` (массив `CHAPTERS`). После правки:
- Увеличьте `v=N` в `web/index.html` для `content.js?v=N` — иначе браузер отдаёт кэш.
- Не трогайте `web/app.js` без нужды — там роутинг и рендеринг.

### Процесс

1. Fork → ветка → PR
2. Опишите проблему, которую решает PR (не "что сделано", а "зачем")
3. Если PR меняет текст на русском — убедитесь, что тон совпадает с соседними главами

---

## In English

### What's welcome

- Typos and factual errors in chapters or labs → PR
- New runnable Workflow script examples → PR in `examples/`
- Bug in `app.js` or `styles.css` → PR with description of the symptom
- Translation to another language → open a Discussion first

### Workflow script rules

See [`cheatsheets/workflow-api.md`](cheatsheets/workflow-api.md) for the full reference. Key rules:
- `meta` must be a pure literal
- Always `.filter(Boolean)` after `parallel()`
- No `Date.now()` / `Math.random()` — they break workflow resume
- Budget loops must guard on `budget.total`

### Process

1. Fork → branch → PR
2. Describe the problem the PR solves, not just what it changes
3. Keep Russian content in Russian — this is a Russian-language course

---

**Questions?** Open a [Discussion](https://github.com/NickScherbakov/ClaudeCodeManual/discussions).
