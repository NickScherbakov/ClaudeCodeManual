# Lab 03 — pipeline() vs parallel()

**Сложность**: ★★☆
**Время**: ~75 минут

---

## Цель

Разобраться в разнице между `pipeline()` и `parallel()`, написать workflow с обоими подходами и сравнить время выполнения.

---

## Концепция: Барьер vs Поток

### parallel() — БАРЬЕР

```
parallel([task1, task2, task3])

timeline:
  task1: [====] done → ждёт остальных
  task2: [========] done → ждёт остальных
  task3: [===] done → ждёт остальных
               ^ БАРЬЕР — все ждут самого медленного
  результат: [r1, r2, r3]
```

Время = время самой медленной задачи. Но ВСЕ результаты доступны одновременно.

### pipeline() — ПОТОК

```
pipeline([item1, item2, item3], stage1, stage2, stage3)

timeline:
  item1: [stage1][stage2][stage3]
  item2:    [stage1][stage2][stage3]
  item3:       [stage1][stage2][stage3]
              ^ НЕТ барьера между стадиями
```

item1 уже на stage3, пока item2 ещё на stage1. Время определяет самая медленная цепочка одного item, а не сумма всех.

---

## Когда что использовать

### Используй parallel() ТОЛЬКО если:
1. Стадия N нужна cross-item контекст из ВСЕЙ стадии N-1
2. Нужен early-exit: "0 багов → пропустить верификацию"
3. Промпт стадии N ссылается на "другие находки"

### Используй pipeline() ПО УМОЛЧАНИЮ:
- Трансформации (map/filter/flatten) — делай внутри стадии, не барьером
- "Стадии концептуально разные" — НЕ причина для барьера
- Чисто для "чистоты кода" — НЕ причина для барьера

### Как распознать лишний барьер
```javascript
// ПЛОХО — ненужный барьер:
const a = await parallel(items.map(i => () => agent(findBugs(i))))
const b = a.flat()                    // flatten не требует барьера!
const c = await parallel(b.map(f => () => agent(verify(f))))

// ХОРОШО — flatten внутри стадии pipeline:
const results = await pipeline(
  items,
  i => agent(findBugs(i), {schema: BUG_SCHEMA}),
  (bugs, item) => parallel(bugs.findings.map(f => () => agent(verify(f))))
)
```

---

## Пример: параллельный поиск по измерениям

```javascript
export const meta = {
  name: 'multi-dimension-search',
  description: 'Поиск по нескольким измерениям с верификацией',
  phases: [
    { title: 'Find', detail: 'Параллельный поиск' },
    { title: 'Verify', detail: 'Верификация находок' },
  ],
}

const DIMENSIONS = [
  { key: 'performance', prompt: 'Найди проблемы производительности в этом коде' },
  { key: 'security', prompt: 'Найди уязвимости безопасности в этом коде' },
  { key: 'logic', prompt: 'Найди логические ошибки в этом коде' },
]

const CODE = args || '// paste your code here'

// pipeline: Find и Verify выполняются для каждого измерения независимо
// security verification начинается пока performance ещё ищет — нет барьера!
const results = await pipeline(
  DIMENSIONS,
  // Стадия 1: поиск
  d => agent(
    `${d.prompt}:\n\n${CODE}`,
    { label: `find:${d.key}`, phase: 'Find' }
  ),
  // Стадия 2: верификация (начинается как только стадия 1 завершена для этого item)
  (findings, originalDimension) => agent(
    `Верифицируй эти находки для "${originalDimension.key}". 
     Отсев ложных срабатываний: ${findings}`,
    { label: `verify:${originalDimension.key}`, phase: 'Verify' }
  )
)

return { results: results.filter(Boolean) }
```

### Когда нужен барьер (правильный parallel):
```javascript
// Нам нужно дедуплицировать ПОСЛЕ всех поисков:
const allFindings = await parallel(
  DIMENSIONS.map(d => () => agent(d.prompt, { schema: FINDINGS_SCHEMA }))
)
// ^ барьер НУЖЕН: dedup требует ВСЕ находки одновременно
const deduped = deduplicateByFileAndLine(allFindings.filter(Boolean).flatMap(r => r.findings))
const verified = await parallel(deduped.map(f => () => agent(verify(f))))
```

---

## Задание

Открой [starter.js](starter.js). Там два варианта реализации — один использует pipeline, другой parallel. Реализуй оба и сравни время выполнения.

### Ключевой вопрос для размышления:
Почему в варианте с pipeline результат приходит быстрее, хотя работы столько же?

---

## Важные детали API

### pipeline() — сигнатура колбэка:
```javascript
pipeline(items, stage1, stage2, stage3)

// Колбэк получает: (prevResult, originalItem, index)
await pipeline(
  items,
  item => agent(analyze(item)),                    // stage1: только item
  (analysis, item) => agent(verify(analysis, item)), // stage2: result + originalItem
  (verified, item, idx) => agent(format(idx))      // stage3: result + item + index
)
```

### parallel() — принимает массив thunk-функций:
```javascript
// ПРАВИЛЬНО — thunks (функции без аргументов):
await parallel(items.map(item => () => agent(process(item))))
//                              ^^^ стрелочная функция-обёртка!

// НЕПРАВИЛЬНО — прямые promises:
await parallel(items.map(item => agent(process(item)))) // запустится сразу, не конкурентно
```

---

## Критерии успеха Lab 03

- [x] Реализовал оба варианта (pipeline и parallel) в starter.js
- [x] Наблюдал разницу во времени выполнения
- [x] Можешь объяснить словами: когда pipeline быстрее и почему
- [x] Умеешь распознавать лишний барьер

---

## Следующий шаг

→ [Lab 04: Динамические Workflow](../04-dynamic-workflows/lab.md)
