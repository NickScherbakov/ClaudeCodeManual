# Паттерны Multi-Agent — Справочник рецептов

## 1. Adversarial Verify (N идентичных скептиков)

```javascript
// Когда: находка может быть ложной одним конкретным способом
// Порог: <2 из 3 опровержений → выживает

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    refuted: { type: 'boolean' },
    reason: { type: 'string' }
  },
  required: ['refuted', 'reason']
}

const verified = await parallel(
  findings.map(finding => () =>
    parallel(Array.from({ length: 3 }, () => () =>
      agent(
        `Попытайся ОПРОВЕРГНУТЬ: "${finding.description}".
         По умолчанию refuted=true если сомневаешься.`,
        { schema: VERDICT_SCHEMA }
      )
    )).then(votes => ({
      ...finding,
      survives: votes.filter(Boolean).filter(v => v.refuted).length < 2
    }))
  )
)
const confirmed = verified.filter(Boolean).filter(f => f.survives)
```

---

## 2. Perspective-Diverse Verify (N разных призм)

```javascript
// Когда: находка может провалиться по РАЗНЫМ причинам
// Лучше N идентичных когда нужно поймать разные failure modes

const LENSES = ['correctness', 'security', 'reproducibility']

const judged = await parallel(
  findings.map(f => () =>
    parallel(LENSES.map(lens => () =>
      agent(
        `Суди "${f.title}" через призму "${lens}". Реальная проблема?`,
        { schema: VERDICT_SCHEMA, label: `judge:${f.id}:${lens}` }
      )
    )).then(votes => ({
      finding: f,
      real: votes.filter(Boolean).filter(v => !v.refuted).length >= 2
    }))
  )
)
```

---

## 3. Judge Panel (выбор лучшего)

```javascript
// Когда: нужно выбрать лучшее из N независимых решений
// Польза: разные углы находят разные оптимумы

const APPROACHES = ['MVP-first', 'risk-first', 'user-first']

phase('Generate')
const candidates = await parallel(
  APPROACHES.map((approach, i) => () => agent(
    `Разработай решение с подходом ${approach}: ${problem}`,
    { label: `candidate-${i}` }
  ))
)

phase('Judge')
const SCORE_SCHEMA = {
  type: 'object',
  properties: {
    winner: { type: 'number', minimum: 0, maximum: 2 },
    scores: { type: 'array', items: { type: 'number' } },
    bestIdeasFromLosers: { type: 'array', items: { type: 'string' } }
  },
  required: ['winner', 'scores', 'bestIdeasFromLosers']
}
const judgment = await agent(
  `Оцени решения:\n${candidates.map((c, i) => `${i}: ${c}`).join('\n\n')}`,
  { schema: SCORE_SCHEMA }
)

phase('Synthesize')
const synthesis = await agent(
  `Улучши лучшее решение (${judgment.winner}), добавив: ${judgment.bestIdeasFromLosers.join(', ')}`
)
```

---

## 4. Multi-Modal Sweep

```javascript
// Когда: один агент имеет blind spots; нужно покрыть всё
// Каждая модальность ищет независимо (слепота к другим — фича)

const MODALITIES = [
  { key: 'by-container', prompt: 'сканируй по модулям/классам' },
  { key: 'by-pattern', prompt: 'ищи паттерны и анти-паттерны' },
  { key: 'by-data-flow', prompt: 'проследи поток данных' },
  { key: 'by-deps', prompt: 'анализируй зависимости' },
]

const allFindings = await parallel(
  MODALITIES.map(m => () => agent(
    `${m.prompt} в: ${context}`,
    { schema: FINDINGS_SCHEMA, label: `sweep:${m.key}` }
  ))
)
const combined = allFindings.filter(Boolean).flatMap(r => r.findings)
```

---

## 5. Completeness Critic

```javascript
// Когда: после основного анализа — проверить что не пропустили
// Результат: дополнительные поиски для high-priority gaps

const GAPS_SCHEMA = {
  type: 'object',
  properties: {
    gaps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          aspect: { type: 'string' },
          why_important: { type: 'string' },
          priority: { enum: ['low', 'medium', 'high'] }
        },
        required: ['aspect', 'why_important', 'priority']
      }
    }
  },
  required: ['gaps']
}

const critique = await agent(
  `Мы проверили: ${coveredAspects.join(', ')}.
   Нашли ${findings.length} проблем.
   Что мы могли пропустить? Какие аспекты не покрыты?`,
  { schema: GAPS_SCHEMA, label: 'completeness-critic' }
)

const highGaps = critique.gaps.filter(g => g.priority === 'high')
if (highGaps.length) {
  const additional = await parallel(
    highGaps.map(gap => () => agent(
      `Проверь пропущенное: ${gap.aspect}. ${gap.why_important}`,
      { schema: FINDINGS_SCHEMA, label: `fill:${gap.aspect.slice(0, 20)}` }
    ))
  )
  findings.push(...additional.filter(Boolean).flatMap(r => r.findings))
}
```

---

## 6. Loop-Until-Dry

```javascript
// Когда: неизвестный объём; нужно найти ВСЁ
// CRITICAL: dedup против `seen`, НЕ `confirmed`

const seen = new Set()
const confirmed = []
let dry = 0

while (dry < 2) {  // K пустых раундов = остановка
  const found = (await parallel(
    FINDERS.map(f => () => agent(f.prompt, { schema: FINDINGS_SCHEMA }))
  )).filter(Boolean).flatMap(r => r.findings)
  
  // Нормализованный ключ для dedup
  const fresh = found.filter(f => {
    const key = `${f.category}:${f.title}`.toLowerCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  
  if (!fresh.length) { dry++; log(`dry=${dry}/2`); continue }
  dry = 0  // сбросить!
  confirmed.push(...fresh)
  log(`Раунд: +${fresh.length} новых. Итого: ${confirmed.length}`)
}
```

---

## 7. Loop-Until-Budget

```javascript
// Когда: масштабировать глубину к +Nk директиве пользователя

const results = []

// ОБЯЗАТЕЛЬНО: guard на budget.total
while (budget.total && budget.remaining() > 50_000) {
  const r = await agent('Найди ещё', { schema: SCHEMA })
  results.push(...(r?.items || []))
  log(`${results.length} найдено. ${Math.round(budget.remaining() / 1000)}k осталось`)
}

// Без директивы +Nk: один раунд
if (!budget.total) {
  const r = await agent('Найди', { schema: SCHEMA })
  results.push(...(r?.items || []))
}
```

---

## 8. Dynamic Scaling

```javascript
// Когда: количество агентов должно зависеть от бюджета

const FLEET = budget.total
  ? Math.floor(budget.total / 100_000)  // 100k на агента
  : 5                                    // значение по умолчанию

const DEPTH = !budget.total ? 'shallow'
  : budget.total < 100_000 ? 'shallow'
  : budget.total < 500_000 ? 'medium'
  : 'deep'

const STAGES_BY_DEPTH = {
  shallow: ['overview'],
  medium: ['overview', 'details', 'risks'],
  deep: ['overview', 'details', 'risks', 'perf', 'security', 'arch']
}
```

---

## 9. Pipeline (многостадийная обработка)

```javascript
// По умолчанию для многостадийной работы
// НЕТ барьера: item A на stage 3 пока item B на stage 1

const results = await pipeline(
  items,
  // Stage 1
  item => agent(`Шаг 1: ${item}`, { label: `s1:${item}`, phase: 'Phase1' }),
  // Stage 2: получает (result, originalItem)
  (result, item) => agent(`Шаг 2: ${result}`, { label: `s2:${item}`, phase: 'Phase2' }),
  // Stage 3: получает (result, originalItem, index)
  (result, item, idx) => agent(`Шаг 3 #${idx}: ${result}`, { phase: 'Phase3' })
)
// results[i] = null если stage для item[i] бросил исключение
```

---

## Когда pipeline vs parallel

| Ситуация | Выбор | Почему |
|----------|-------|--------|
| Многостадийная обработка каждого item | `pipeline` | Нет барьера = быстрее |
| Нужны ВСЕ результаты для следующего шага | `parallel` | Барьер нужен |
| Dedup требует все находки | `parallel` | Нужны все одновременно |
| Cross-item сравнение | `parallel` | Нужен общий контекст |
| map/filter/flatten между стадиями | `pipeline` | Делать внутри стадии |

**Проверка**: если после `parallel` только `flatten/filter/map` → замени на `pipeline`.
