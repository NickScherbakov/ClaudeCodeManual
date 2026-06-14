# Lab 11 — Управление бюджетом токенов

**Сложность**: ★★★
**Время**: ~60 минут

---

## Цель

Разобраться с budget API в workflow, научиться строить динамически масштабируемые workflow и освоить паттерны экономии токенов.

---

## Концепция: Budget API

Budget API сообщает workflow, какой бюджет токенов задал пользователь директивой `+Nk`.

```
Пользователь: "Проанализируй кодовую базу +500k"
                                          ^^^^^ директива
```

### Объект `budget`:

```javascript
budget.total      // number|null — таргет из +Nk директивы; null если не задан
budget.spent()    // number — потраченные output-токены этого хода (shared pool)
budget.remaining()// number — max(0, total - spent()); Infinity если total=null
```

**Важно**: `budget.total = null`, если нет `+Nk` директивы. Без проверки `budget.total` перед циклом → `remaining() = Infinity` → бесконечный цикл до жёсткого лимита в 1000 агентов.

---

## Паттерны использования

### Паттерн 1: Масштабирование к бюджету

```javascript
// Адаптировать количество агентов к бюджету:
const FLEET_SIZE = budget.total 
  ? Math.floor(budget.total / 100_000)  // 100k токенов на агента
  : 5                                    // значение по умолчанию без директивы

log(`Запускаем ${FLEET_SIZE} агентов (бюджет: ${budget.total || 'без директивы'})`)

const finders = Array.from({ length: FLEET_SIZE }, (_, i) => () =>
  agent(`Найди баги (ракурс ${i + 1}/${FLEET_SIZE})`, { schema: BUGS_SCHEMA })
)
const results = await parallel(finders)
```

### Паттерн 2: Цикл до исчерпания бюджета

```javascript
const bugs = []

// Обязательно: проверка budget.total
while (budget.total && budget.remaining() > 50_000) {
  const result = await agent('Найди ещё баги', { schema: BUGS_SCHEMA })
  bugs.push(...(result?.bugs || []))
  
  const remainingK = Math.round(budget.remaining() / 1000)
  log(`${bugs.length} найдено, ${remainingK}k токенов осталось`)
}

if (!budget.total) {
  log('Нет директивы +Nk — запускаем один раунд')
  const result = await agent('Найди баги', { schema: BUGS_SCHEMA })
  bugs.push(...(result?.bugs || []))
}
```

### Паттерн 3: Ступенчатая глубина анализа

```javascript
// 3 уровня глубины в зависимости от бюджета:
const DEPTH = !budget.total ? 'deep'
  : budget.total < 100_000 ? 'shallow'
  : budget.total < 500_000 ? 'medium'
  : 'deep'

const STAGES = {
  shallow: ['syntax'],                              // 1 агент
  medium:  ['syntax', 'logic', 'security'],         // 3 агента
  deep:    ['syntax', 'logic', 'security', 'perf', 'arch', 'ux']  // 6 агентов
}

log(`Глубина анализа: ${DEPTH} (бюджет: ${budget.total || 'значение по умолчанию'})`)

const analyses = await parallel(
  STAGES[DEPTH].map(stage => () => agent(
    `Анализируй ${stage} аспект: ${args}`,
    { label: `analyze:${stage}` }
  ))
)
```

---

## Отслеживание прогресса

```javascript
// Логировать использование на каждом шаге:
async function trackedAgent(prompt, opts) {
  const before = budget.spent()
  const result = await agent(prompt, opts)
  const used = budget.spent() - before
  log(`Агент "${opts.label}": ~${Math.round(used / 1000)}k токенов`)
  return result
}
```

---

## Стратегии экономии токенов

### 1. Постепенно раскрывать контекст
```javascript
// Не давать агенту весь код сразу
// Сначала: высокоуровневый анализ
const overview = await agent(`Опиши архитектуру: ${fileList}`)

// Только для важных файлов: детальный анализ
const important = extractImportantFiles(overview)
const detailed = await parallel(
  important.map(f => () => agent(`Детально проанализируй: ${readFile(f)}`))
)
```

### 2. Ранний выход
```javascript
// Если нет находок на ранней стадии → пропустить дорогую верификацию
const quickScan = await agent('Быстрый скан: есть ли очевидные проблемы?', {
  schema: { type: 'object', properties: { hasIssues: { type: 'boolean' }, count: { type: 'number' } }, required: ['hasIssues', 'count'] }
})

if (!quickScan.hasIssues) {
  log('Очевидных проблем нет — пропускаем глубокий анализ')
  return { clean: true }
}

// Только если нашли проблемы — запускаем дорогой анализ
const deepAnalysis = await agent('Глубокий анализ...', { schema: DETAILED_SCHEMA })
```

### 3. Сжатие контекста между агентами
```javascript
// Вместо передачи полного текста → суммаризировать
const fullText = readLargeFile()  // 50k символов

const summary = await agent(
  `Суммируй для дальнейшего анализа (максимум 500 слов): ${fullText}`
)

// Использовать summary, не fullText
const analysis = await agent(`Проанализируй: ${summary}`)
```

---

## Задание

Открой [starter.js](starter.js). Реализуй budget-aware workflow с динамическим масштабированием.

---

## Критерии успеха Lab 11

- [x] Реализовал динамическое масштабирование через budget.total
- [x] Добавил guard `budget.total &&` перед while-loop
- [x] Понимаешь почему Infinity remaining() опасен
- [x] Знаешь минимум 2 стратегии экономии токенов

---

## Следующий шаг

→ [Lab 12: Изоляция в Worktree](../12-worktree-isolation/lab.md)
