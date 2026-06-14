# Типы субагентов — Справочник

## Стандартный агент (по умолчанию)

```javascript
await agent('Промпт')
// Полный Claude с доступом ко всем инструментам сессии
// Инструменты: Read, Write, Edit, Bash, Glob, Grep, Agent, Workflow...
```

---

## Специализированные типы (agentType)

### `Explore` — быстрый поиск кода

```javascript
await agent('Найди где определена функция processPayment', {
  agentType: 'Explore',
  label: 'find-processPayment'
})
// Возможности: Glob, Grep, Read, Bash (кроме Edit/Write)
// Возвращает таблицу file:line
// Output ~60% меньше токенов чем стандартный агент
// Используй для: "где находится X", "что вызывает Y", "список всех Z"
// НЕ использовать для: code review, анализа, исправлений
```

### `cavecrew-investigator`

```javascript
await agent('Найди все места где используется AuthMiddleware', {
  agentType: 'caveman:cavecrew-investigator'
})
// Read-only локатор кода
// Сжатый вывод (caveman формат) — экономия контекста главного треда
// Отказывается предлагать исправления
```

### `cavecrew-builder`

```javascript
await agent('Замени все console.log на logger.debug в src/utils.js', {
  agentType: 'caveman:cavecrew-builder'
})
// Хирургическое редактирование 1-2 файлов
// Отклоняет задачи на 3+ файла
// Возвращает caveman diff receipt
```

### `cavecrew-reviewer`

```javascript
await agent('Сделай code review этого diff', {
  agentType: 'caveman:cavecrew-reviewer'
})
// Ревью diff/branch/файлов
// Одна строка на находку с severity тегом
// Формат: path:line: <emoji> <severity>: <проблема>. <исправление>.
```

---

## Таблица выбора типа агента

| Задача | Тип | Почему |
|--------|-----|--------|
| Найди где определена функция X | `Explore` | Быстро, экономит токены |
| Что вызывает функцию Y? | `Explore` | Read-only поиск |
| Исправь опечатку в одном файле | `cavecrew-builder` | 1 файл = cavecrew |
| Code review PR | `cavecrew-reviewer` | Compressed findings |
| Рефакторинг с изменением логики | стандартный | Нужна полная мощь |
| Исследование темы + написание отчёта | стандартный | Многошаговая задача |
| Анализ данных + структурированный вывод | стандартный | Нужны все инструменты |

---

## Когда agentType экономит токены

`Explore` и `cavecrew-investigator` возвращают сжатый вывод. Если нужно сделать 20 поисковых запросов — по одному агенту на каждый — используй Explore: главный контекст получит ~60% меньше токенов.

```javascript
// Вместо:
const files = await parallel(
  queries.map(q => () => agent(`Найди файлы для: ${q}`))  // полный агент = много токенов
)

// Используй:
const files = await parallel(
  queries.map(q => () => agent(`Найди файлы для: ${q}`, { agentType: 'Explore' }))
)
```

---

## Совмещение agentType и schema

```javascript
// agentType совместим со schema:
const result = await agent('Найди все API endpoints', {
  agentType: 'Explore',
  schema: {
    type: 'object',
    properties: {
      endpoints: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            method: { enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
            file: { type: 'string' },
            line: { type: 'number' }
          },
          required: ['path', 'method', 'file']
        }
      }
    },
    required: ['endpoints']
  }
})
// Explore агент с StructuredOutput инструкцией добавленной автоматически
```

---

## Изоляция worktree (не тип агента, но смежно)

```javascript
// isolation: 'worktree' — не тип агента, а опция для любого типа
await agent('Переименуй все переменные', {
  isolation: 'worktree'  // агент работает в отдельном git worktree
})
// Нужно ТОЛЬКО когда агент мутирует файлы параллельно с другими агентами
// Стоимость: ~200-500ms + диск
// Возвращает { path, branch } если были изменения
```
