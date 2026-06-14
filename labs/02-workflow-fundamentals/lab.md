# Lab 02 — Основы Workflow

**Сложность**: ★★☆
**Время**: ~60 минут

---

## Цель

Написать первый workflow-скрипт и освоить `meta`, `agent()`, `phase()`, `log()` на практике.

---

## Концепция: Что такое Workflow?

Workflow — детерминированная оркестрация субагентов. В отличие от обычного разговора с Claude, workflow:

- **Детерминированный**: поток контролируешь через JavaScript (if/for/while)
- **Масштабируемый**: десятки агентов параллельно
- **Возобновляемый**: если прервать, продолжится с закешированной точки
- **Структурированный**: вывод валидируется через schema

### Когда использовать Workflow (не обычный чат):
- Нужен fan-out: одна задача → много агентов
- Нужна независимая верификация без перекрёстного влияния
- Задача не влезает в один контекст
- Нужен детерминированный flow: loop, условия, накопление

---

## Анатомия Workflow-скрипта

```javascript
// 1. meta — ОБЯЗАТЕЛЬНО, ЧИСТЫЙ ЛИТЕРАЛ (никаких переменных!)
export const meta = {
  name: 'my-first-workflow',
  description: 'Описание для диалога разрешений',
  phases: [
    { title: 'Research', detail: 'Сбор информации' },
    { title: 'Analyze',  detail: 'Анализ данных' },
  ],
}

// 2. Тело скрипта — асинхронный контекст
phase('Research')                           // начать фазу (группировка в UI)
log('Начинаем исследование...')             // сообщение пользователю

const result = await agent(                 // spawned субагент
  'Найди 3 факта о черных дырах',          // промпт
  {
    label: 'black-holes-finder',            // метка в UI
    phase: 'Research',                      // явное назначение фазы
    model: 'claude-opus-4-8',              // опционально: override модели
  }
)
// result — строка с ответом субагента

phase('Analyze')
log(`Получено: ${result.length} символов`)

const summary = await agent(
  `Кратко суммируй: ${result}`,
  { label: 'summarizer', phase: 'Analyze' }
)

return { summary }                          // возвращается как результат workflow
```

---

## Ключевые правила meta

```javascript
// ПРАВИЛЬНО — чистый литерал:
export const meta = {
  name: 'my-workflow',
  description: 'What it does',
}

// НЕПРАВИЛЬНО — переменные:
const NAME = 'my-workflow'
export const meta = { name: NAME }  // НЕЛЬЗЯ: meta должен быть статическим литералом (resume/стабильная подпись)

// НЕПРАВИЛЬНО — template strings:
export const meta = {
  name: `workflow-${version}`,      // НЕЛЬЗЯ: meta должен быть статическим литералом (resume/стабильная подпись)
}

// НЕПРАВИЛЬНО — функции:
export const meta = {
  description: getDescription(),    // НЕЛЬЗЯ: meta должен быть статическим литералом (resume/стабильная подпись)
}
```

---

## Ключевые правила agent()

```javascript
// Без schema → возвращает строку:
const text = await agent('Что такое JavaScript?')
typeof text === 'string' // true

// Со schema → возвращает валидированный объект (или null если пользователь пропустил):
const obj = await agent('Найди 3 факта', {
  schema: {
    type: 'object',
    properties: {
      facts: { type: 'array', items: { type: 'string' } }
    },
    required: ['facts']
  }
})
// obj?.facts — массив строк, гарантировано типом

// ВАЖНО: agent() может вернуть null если пользователь пропустил агента
// Всегда фильтруй: results.filter(Boolean)
```

---

## Пример для изучения

```javascript
export const meta = {
  name: 'tech-explainer',
  description: 'Объясняет технические концепции на разных уровнях',
  phases: [
    { title: 'Draft', detail: 'Написать объяснение' },
    { title: 'Review', detail: 'Улучшить объяснение' },
  ],
}

const TOPIC = args || 'Что такое JWT-токен'

phase('Draft')
log(`Изучаем тему: ${TOPIC}`)

const draft = await agent(
  `Объясни "${TOPIC}" простыми словами для начинающего разработчика. 
   Включи аналогию из реальной жизни.`,
  { label: 'drafter', phase: 'Draft' }
)

phase('Review')
const improved = await agent(
  `Улучши это объяснение — сделай точнее и добавь код-пример:
   
   ${draft}`,
  { label: 'reviewer', phase: 'Review' }
)

return { topic: TOPIC, explanation: improved }
```

---

## Задание

Открой [starter.js](starter.js) и выполни задания в нём.

### Быстрый запуск:
```
Попроси Claude: "Запусти labs/02-workflow-fundamentals/starter.js как workflow"
```

---

## Подсказки

**Q: Как передать данные между агентами?**
A: Через переменные JavaScript. Результат `agent()` — строка, сохрани в `const`, используй в следующем промпте.

**Q: Зачем `phase()`?**
A: Для группировки в прогресс-дереве `/workflows`. Без phase() все агенты в одной группе.

**Q: Можно ли использовать `if/for/while`?**
A: Да! Это plain JavaScript. Workflow полностью поддерживает ветвление и циклы.

**Q: Что если агент вернул null?**
A: Пользователь пропустил агента. Обрабатывай: `if (!result) { log('пропущено'); return }`

---

## Критерии успеха Lab 02

- [x] Написал рабочий workflow-скрипт с meta, agent(), phase(), log()
- [x] Workflow успешно запустился без ошибок
- [x] Понимаешь почему meta должен быть чистым литералом
- [x] Знаешь разницу между agent() со schema и без

---

## Следующий шаг

→ [Lab 03: pipeline() vs parallel()](../03-pipeline-vs-parallel/lab.md)
