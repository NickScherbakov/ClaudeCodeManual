# Workflow API — Полный справочник

## Функции оркестрации

### `agent(prompt, opts?)`

```javascript
// Без schema → строка
const text = await agent('Промпт')

// Со schema → валидированный объект
const obj = await agent('Промпт', {
  schema: { type: 'object', properties: { ... }, required: [...] }
})

// Все опции:
await agent('Промпт', {
  label: 'display-name',        // метка в UI прогресса
  phase: 'PhaseName',           // явное назначение к фазе
  schema: { ... },              // JSON Schema для structured output
  model: 'claude-opus-4-8',     // override модели (по умолчанию: наследует)
  isolation: 'worktree',        // git worktree изоляция (дорого!)
  agentType: 'Explore',         // специализированный тип агента
})

// Возвращает null если пользователь пропустил агента
// Всегда: results.filter(Boolean)
```

### `pipeline(items, ...stages)`

```javascript
// НЕТ барьера между стадиями — item A на stage 3, item B на stage 1
// По умолчанию для многостадийной работы

// Сигнатура колбэка стадии: (prevResult, originalItem, index)
await pipeline(
  items,
  item => agent(analyze(item)),                        // stage 1
  (result, item) => agent(verify(result, item)),       // stage 2: + originalItem
  (result, item, idx) => agent(format(result, idx))   // stage 3: + index
)

// Стадия throw → item → null, пропустить остальные стадии
```

### `parallel(thunks)`

```javascript
// БАРЬЕР — ждёт ВСЕ thunks перед возвратом
// Ошибка в thunk → null (не throw)

// ТРЕБУЕТ массив thunk-функций () => Promise:
await parallel(items.map(item => () => agent(process(item))))
//                              ^^^ обязательная обёртка

// НЕ передавай прямые promises:
// await parallel(items.map(item => agent(process(item)))) // НЕПРАВИЛЬНО
```

### `phase(title)`

```javascript
// Группировка в прогресс-дереве /workflows
// Последующие agent() вызовы группируются под этим заголовком
phase('Research')
phase('Verify')
```

### `log(message)`

```javascript
// Сообщение пользователю в реальном времени
log('Обрабатываем файл 3/10...')
log(`Найдено: ${count} проблем`)
```

### `workflow(nameOrRef, args?)`

```javascript
// Запустить другой workflow как sub-step
const result = await workflow('saved-workflow-name', { topic: '...' })
const result = await workflow({ scriptPath: 'path/to/script.js' }, data)

// Ограничения:
// - Только 1 уровень вложения
// - Разделяет тот же бюджет и лимит конкурентности
// - Агенты дочернего показываются под "▸ name" группой
```

---

## Объект `budget`

```javascript
budget.total       // number | null — +Nk директива пользователя; null если нет
budget.spent()     // number — потраченные output-токены хода (shared pool)
budget.remaining() // number — max(0, total - spent()); Infinity если total=null

// ПАТТЕРН: динамическое масштабирование
const FLEET = budget.total ? Math.floor(budget.total / 100_000) : 5

// ПАТТЕРН: loop-until-budget
// Обязательно: guard на budget.total
while (budget.total && budget.remaining() > 50_000) {
  const result = await agent('...', { schema: SCHEMA })
  accumulate(result)
  log(`${Math.round(budget.remaining() / 1000)}k токенов осталось`)
}
```

---

## Объект `args`

```javascript
// Данные переданные в Workflow({ args: ... })
// Может быть любым JSON-совместимым значением
const topic = args?.topic || args || 'default'
```

---

## Правила meta блока

```javascript
// ОБЯЗАТЕЛЬНО первым в файле
// ЧИСТЫЙ ЛИТЕРАЛ — никаких переменных, функций, template strings

// ПРАВИЛЬНО:
export const meta = {
  name: 'my-workflow',           // snake-case или kebab-case
  description: 'Описание',       // одна строка, показывается в dialog
  phases: [
    { title: 'Find' },                          // минимум
    { title: 'Verify', detail: 'Верификация' }, // с деталью
    { title: 'Report', model: 'claude-opus-4-8' }, // с model override
  ],
}

// НЕПРАВИЛЬНО:
const NAME = 'my-workflow'
export const meta = { name: NAME }        // переменная!
export const meta = { name: `wf-${v}` }  // template string!
export const meta = { name: fn() }        // вызов функции!
```

---

## Ограничения скриптов

```javascript
// НЕДОСТУПНО (сломает resume):
Date.now()         // ЗАПРЕЩЕНО
new Date()         // ЗАПРЕЩЕНО
Math.random()      // ЗАПРЕЩЕНО

// Передавай через args или используй индексы:
args.timestamp     // timestamp из вызывающего кода
`angle-${index}`   // стабильный label через индекс

// Только plain JavaScript, НЕ TypeScript:
function foo(x: string) {}  // PARSE ERROR
interface Foo {}             // PARSE ERROR
const arr: string[] = []    // PARSE ERROR
```

---

## Лимиты

```
Макс. одновременных агентов: min(16, cpu_cores - 2)
Макс. всего агентов: 1000 (backstop)
worktree setup overhead: ~200-500ms + диск
workflow() вложение: только 1 уровень
```

---

## Resume workflow

```javascript
// Workflow инструмент запомнил runId при первом запуске
// Повторный запуск с resumeFromRunId:
Workflow({ scriptPath: '...', resumeFromRunId: 'wf_abc123' })
// Неизменённые agent() вызовы → мгновенные из кэша
// Изменённые или новые → запускаются заново
```
