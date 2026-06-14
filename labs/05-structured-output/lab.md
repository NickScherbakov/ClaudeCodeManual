# Lab 05 — Структурированный вывод

**Сложность**: ★★☆
**Время**: ~60 минут

---

## Цель

Освоить schema-валидацию в workflow, понять как StructuredOutput даёт типобезопасность без TypeScript и научиться проектировать схемы под разные задачи.

---

## Концепция: Зачем структурированный вывод?

Без schema агент возвращает строку — нужен парсинг, и всё это хрупко.

Со schema агент вызывает инструмент `StructuredOutput` и возвращает валидированный объект со структурой, которой можно доверять.

```javascript
// Без schema — хрупко:
const text = await agent('Найди 3 бага. Ответь в формате JSON.')
const bugs = JSON.parse(text)  // может сломаться если агент добавит markdown блок

// Со schema — гарантировано:
const result = await agent('Найди 3 бага', {
  schema: {
    type: 'object',
    properties: {
      bugs: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            file: { type: 'string' },
            line: { type: 'number' },
            description: { type: 'string' },
            severity: { enum: ['low', 'medium', 'high', 'critical'] }
          },
          required: ['file', 'line', 'description', 'severity']
        }
      }
    },
    required: ['bugs']
  }
})
// result.bugs — массив, гарантированно. Каждый элемент имеет file, line, description, severity.
```

---

## Как работает валидация

1. Claude получает промпт и инструкцию вызвать `StructuredOutput`
2. Заполняет поля согласно schema
3. Если структура не совпадает — автоматическая повторная попытка
4. `agent()` возвращает готовый валидированный объект

### Если `agent()` вернул null:

Пользователь пропустил агента. Всегда фильтруй:

```javascript
const results = await parallel(items.map(i => () => agent(i, { schema: SCHEMA })))
const valid = results.filter(Boolean)  // убрать null
```

---

## Проектирование схем

### Простой объект:
```javascript
const SUMMARY_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Краткий заголовок 5-7 слов' },
    summary: { type: 'string', description: 'Краткое резюме 2-3 предложения' },
    score: { type: 'number', minimum: 1, maximum: 10 }
  },
  required: ['title', 'summary', 'score']
}
```

### Массив с ограничениями:
```javascript
const KEYWORDS_SCHEMA = {
  type: 'object',
  properties: {
    keywords: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 10,
      description: 'Ключевые слова, только существительные'
    }
  },
  required: ['keywords']
}
```

### Enum для категорий:
```javascript
const CLASSIFICATION_SCHEMA = {
  type: 'object',
  properties: {
    category: {
      enum: ['bug', 'feature', 'refactor', 'docs', 'security'],
      description: 'Категория изменения'
    },
    priority: {
      enum: ['low', 'medium', 'high', 'critical']
    },
    isBreakingChange: { type: 'boolean' }
  },
  required: ['category', 'priority', 'isBreakingChange']
}
```

### Вложенные объекты:
```javascript
const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          location: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              line: { type: 'number' }
            },
            required: ['file', 'line']
          },
          verdict: {
            type: 'object',
            properties: {
              isReal: { type: 'boolean' },
              confidence: { type: 'number', minimum: 0, maximum: 1 }
            },
            required: ['isReal', 'confidence']
          }
        },
        required: ['title', 'location', 'verdict']
      }
    }
  },
  required: ['findings']
}
```

---

## Пример: конвейер с типизированными данными

```javascript
export const meta = {
  name: 'typed-analysis-pipeline',
  description: 'Типизированный анализ через schema-валидацию',
  phases: [
    { title: 'Extract', detail: 'Извлечение структурированных данных' },
    { title: 'Classify', detail: 'Классификация по категориям' },
  ],
}

const TEXT_SCHEMA = {
  type: 'object',
  properties: {
    entities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { enum: ['person', 'organization', 'technology', 'concept'] },
          importance: { type: 'number', minimum: 1, maximum: 5 }
        },
        required: ['name', 'type', 'importance']
      }
    }
  },
  required: ['entities']
}

const input = args || 'Claude Code is a CLI tool by Anthropic that uses Claude AI'

phase('Extract')
const extracted = await agent(
  `Извлеки все сущности из текста: "${input}"`,
  { schema: TEXT_SCHEMA, label: 'extractor' }
)

// extracted.entities — гарантированно массив объектов
const important = extracted.entities.filter(e => e.importance >= 4)

phase('Classify')
const classified = await parallel(
  important.map(entity => () => agent(
    `Дай подробное описание "${entity.name}" (тип: ${entity.type})`,
    { label: `describe:${entity.name}`, phase: 'Classify' }
  ))
)

return { entities: important, descriptions: classified.filter(Boolean) }
```

---

## Задание

Открой [starter.js](starter.js). Спроектируй и реализуй схемы для анализа кода.

---

## Подсказки

**Q: Schema validation не работает, агент возвращает строку?**
A: Убедись что schema передаётся как второй аргумент в объекте `{ schema: ... }`.

**Q: Как дебажить schema ошибки?**
A: `agent()` автоматически повторит попытку. Если постоянно падает — упрости schema, убери лишние required поля.

**Q: Можно ли вложенные массивы в schema?**
A: Да, но чем глубже — тем выше шанс повторных попыток. Держи schema плоской там где можно.

---

## Критерии успеха Lab 05

- [x] Написал 3+ разных schema для разных задач
- [x] Workflow корректно использует типизированные данные между стадиями
- [x] Понимаешь зачем `.filter(Boolean)` после agent() с schema
- [x] Знаешь как проектировать enum, required, description поля

---

## Следующий шаг

→ [Lab 06: Состязательная верификация](../06-adversarial-verification/lab.md)
