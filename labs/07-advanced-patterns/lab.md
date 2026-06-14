# Lab 07 — Продвинутые паттерны Multi-Agent

**Сложность**: ★★★
**Время**: ~90 минут

---

## Цель

Разобраться с паттернами multi-modal sweep, completeness critic и loop-until-dry с dedup. Научиться комбинировать их для всестороннего анализа.

---

## Паттерн 1: Multi-Modal Sweep

Каждый агент ищет РАЗНЫМ способом. Слепота к тому, что находят другие — намеренная особенность, не дефект.

```javascript
// Четыре агента ищут одно и то же, но РАЗНЫМИ методами:
const MODALITIES = [
  {
    key: 'by-container',
    prompt: 'Сканируй код по модулям/классам/файлам'
  },
  {
    key: 'by-pattern',
    prompt: 'Ищи паттерны: повторяющийся код, анти-паттерны, code smells'
  },
  {
    key: 'by-data-flow',
    prompt: 'Проследи поток данных от входа до выхода'
  },
  {
    key: 'by-time',
    prompt: 'Анализируй недавно изменённые файлы и их зависимости'
  },
]

const allFindings = await parallel(
  MODALITIES.map(m => () => agent(
    `${m.prompt} в этом коде: ${code}`,
    { schema: FINDINGS_SCHEMA, label: `sweep:${m.key}` }
  ))
)
```

**Почему разные методы > один мощный агент**:
- Один агент имеет blind spots
- Разные методы находят разные классы проблем
- Нет correlation bias

---

## Паттерн 2: Completeness Critic

После основного анализа дополнительный агент проверяет, что могло остаться незамеченным.

```javascript
phase('MainAnalysis')
const findings = await parallel(
  DIMENSIONS.map(d => () => agent(d.prompt, { schema: FINDINGS_SCHEMA }))
)
const allFound = findings.filter(Boolean).flatMap(f => f.findings)

phase('CompletenessCheck')
const CRITIC_SCHEMA = {
  type: 'object',
  properties: {
    gaps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          missingModality: { type: 'string', description: 'Что не было проверено' },
          reason: { type: 'string' },
          priority: { enum: ['low', 'medium', 'high'] }
        },
        required: ['missingModality', 'reason', 'priority']
      }
    }
  },
  required: ['gaps']
}

const critique = await agent(
  `Мы проверили: ${DIMENSIONS.map(d => d.key).join(', ')}.
   Нашли: ${allFound.length} проблем.
   Что мы НЕ проверили? Что могло быть пропущено? Какие дополнительные проверки нужны?`,
  { schema: CRITIC_SCHEMA, label: 'completeness-critic' }
)

// Высокоприоритетные gaps → дополнительные поиски
const highPriorityGaps = critique.gaps.filter(g => g.priority === 'high')
if (highPriorityGaps.length) {
  const additional = await parallel(
    highPriorityGaps.map(gap => () => agent(
      `Проверь: ${gap.missingModality}. ${gap.reason}`,
      { schema: FINDINGS_SCHEMA, label: `fill-gap:${gap.missingModality.slice(0, 20)}` }
    ))
  )
  allFound.push(...additional.filter(Boolean).flatMap(r => r.findings))
}
```

---

## Паттерн 3: Exhaustive Discovery (комбинация паттернов)

Loop-until-dry + multi-modal sweep + completeness critic + adversarial verify:

```javascript
export const meta = {
  name: 'exhaustive-analysis',
  description: 'Максимально полный анализ: sweep + loop + critic + verify',
  phases: [
    { title: 'Discover' },
    { title: 'Verify' },
    { title: 'Complete' },
  ],
}

const FINDERS = [
  { key: 'syntax', prompt: 'Найди синтаксические и структурные проблемы' },
  { key: 'logic', prompt: 'Найди логические ошибки и edge cases' },
  { key: 'security', prompt: 'Найди уязвимости безопасности' },
  { key: 'perf', prompt: 'Найди проблемы производительности' },
]

const seen = new Set()
const confirmed = []
let dry = 0
let rounds = 0

// Loop-until-dry (выход после 2 пустых раундов)
while (dry < 2) {
  rounds++
  phase('Discover')
  
  // Multi-modal sweep каждый раунд
  const found = (await parallel(
    FINDERS.map(f => () => agent(
      `${f.prompt} в коде: ${args}
       Не повторяй уже известные проблемы.
       Известные: ${Array.from(seen).slice(-10).join(', ')}`,
      { schema: FINDINGS_SCHEMA, label: `find:${f.key}`, phase: 'Discover' }
    ))
  )).filter(Boolean).flatMap(r => r.findings)
  
  // Нормализация + dedup против seen (НЕ confirmed)
  const fresh = found.filter(f => {
    const key = `${f.category}:${f.title}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  
  if (!fresh.length) { dry++; log(`Раунд пустой (${dry}/2)`); continue }
  dry = 0
  log(`Новых находок: ${fresh.length}. Всего уникальных: ${seen.size}`)
  
  // Adversarial verify для новых находок
  phase('Verify')
  const verified = await parallel(
    fresh.map(f => () =>
      parallel(Array.from({ length: 3 }, () => () =>
        agent(`Опровергни: "${f.title}". refuted=true по умолчанию.`, { schema: VERDICT_SCHEMA })
      )).then(votes => ({
        ...f,
        survives: votes.filter(Boolean).filter(v => v.refuted).length < 2
      }))
    )
  )
  
  confirmed.push(...verified.filter(Boolean).filter(v => v.survives))
}

// Completeness critic в конце
phase('Complete')
const critic = await agent(
  `Мы использовали ${FINDERS.length} искателей в ${rounds} раундах.
   Нашли ${confirmed.length} подтверждённых проблем.
   Что ещё мы могли пропустить?`,
  { schema: CRITIC_SCHEMA }
)

log(`Итого: ${confirmed.length} подтверждённых. Пропуски: ${critic.gaps.length}`)
return { confirmed, gaps: critic.gaps }
```

---

## Паттерн 4: Tournament Bracket

Для выбора лучшего из N кандидатов методом попарного сравнения:

```javascript
// Не реализован в starter — задание со звёздочкой
// Структура:
// Round 1: [A vs B] [C vs D] [E vs F] [G vs H]
// Round 2: [Winner1 vs Winner2] [Winner3 vs Winner4]
// Final:   [Winner5 vs Winner6]

async function tournament(candidates, judgePrompt) {
  let round = candidates
  while (round.length > 1) {
    const pairs = []
    for (let i = 0; i < round.length; i += 2) {
      if (i + 1 < round.length) pairs.push([round[i], round[i + 1]])
      else pairs.push([round[i]])  // проходит дальше без пары
    }
    const winners = await parallel(
      pairs.map(pair => () => {
        if (pair.length === 1) return pair[0]  // без пары → автоматически в следующий раунд
        return agent(
          `${judgePrompt}\nОпция А: ${pair[0]}\nОпция Б: ${pair[1]}\nОтветь: A или B`,
        ).then(verdict => verdict.includes('A') ? pair[0] : pair[1])
      })
    )
    round = winners.filter(Boolean)
    log(`Раунд завершён. Осталось: ${round.length}`)
  }
  return round[0]
}
```

---

## Задание

Открой [starter.js](starter.js). Реализуй exhaustive analysis с multi-modal sweep + completeness critic.

---

## Критерии успеха Lab 07

- [x] Реализовал multi-modal sweep с ≥3 модальностями
- [x] Добавил completeness critic после основного анализа
- [x] Понимаешь почему dedup против `seen`, а не `confirmed`
- [x] Можешь объяснить когда использовать loop-until-dry vs фиксированное число раундов

---

## Следующий шаг

→ [Lab 08: Хуки и автоматизация](../08-hooks-automation/lab.md)
