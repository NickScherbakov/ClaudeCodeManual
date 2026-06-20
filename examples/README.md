# Примеры Workflow-скриптов

Готовые к запуску скрипты для [Workflow tool](https://github.com/NickScherbakov/ClaudeCodeManual) в Claude Code.

> **Важно:** эти файлы — не Node.js модули. Запускать только через Claude Code, не через `node`.

---

## Быстрый старт

Клонируйте репозиторий и скажите Claude Code:

```
Запусти examples/quick-demo.js как workflow +30k
```

Через 30 секунд вы увидите три агента, ищущих параллельно, и скептика, верифицирующего каждую находку.

---

## Примеры

### `quick-demo.js` — демо за 30 секунд

**Что показывает:** параллельный поиск (три агента с разных углов) → адверсариальная верификация каждой находки.

**Паттерны:** `parallel()`, `pipeline()`, `schema`, `phase()`, `log()`

**Запуск:**
```
Запусти examples/quick-demo.js как workflow +30k
```

По умолчанию исследует тему "многоагентная оркестрация". Передайте свою тему через args:
```
Запусти examples/quick-demo.js как workflow +30k, args: "ваша тема здесь"
```

---

### `code-review.js` — code review с тройной верификацией

**Что показывает:** полный pipeline code review — от четырёх параллельных сканеров до трёх скептиков на каждую находку.

**Паттерны:** `parallel()` с барьером (dedup требует все результаты), `pipeline()` для верификации, schema-forced output, majority vote

**Запуск:**
```
Запусти examples/code-review.js как workflow +80k
```

По умолчанию анализирует `target/app.js` — намеренно багованный учебный файл. Для своего файла:
```
Запусти examples/code-review.js как workflow +80k, args: "путь/к/файлу.js"
```

**Измерения анализа:** баги и логические ошибки · уязвимости безопасности · проблемы производительности · качество кода

**Отчёт:** находки разбиты по severity (critical / major / minor), только верифицированные.

---

### `publisher-manual/` — создание книжного мануала

**Что показывает:** полный goal-first workflow: от оффера издательства до пакета сдачи книги.

**Паттерны:** многофазный дизайн, parallel review с разных ролей (редактор / технический рецензент / педагог), structured synthesis

**Запуск:**
```
Запусти examples/publisher-manual/publisher-manual-workflow.js как workflow +150k
```

---

## Как устроены скрипты

Каждый скрипт начинается с блока `meta`:

```javascript
export const meta = {
  name: 'my-workflow',
  description: 'Что делает',
  phases: [
    { title: 'Find' },   // заголовок ДОЛЖЕН совпадать с phase('Find')
    { title: 'Verify' },
  ],
}
```

Затем тело скрипта на plain JavaScript с глобальными функциями `agent()`, `parallel()`, `pipeline()`, `phase()`, `log()`, `budget`, `args`.

Подробный справочник: [`cheatsheets/workflow-api.md`](../cheatsheets/workflow-api.md)
