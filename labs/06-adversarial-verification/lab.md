# Lab 06 — Состязательная верификация

**Сложность**: ★★★
**Время**: ~90 минут

---

## Цель

Освоить состязательную верификацию: реализовать паттерны adversarial verify, judge panel и perspective-diverse verify. Понять, чем N разных призм лучше N одинаковых скептиков.

---

## Концепция: Проблема "правдоподобных но неверных" находок

Без верификации агенты нередко возвращают hallucinated находки — звучат убедительно, но неверны. Состязательная верификация решает это прямолинейно: другие агенты пытаются ОПРОВЕРГНУТЬ каждую находку.

```
Агент А нашёл: "SQL injection в строке 42"
    ↓
3 независимых скептика пытаются ОПРОВЕРГНУТЬ
    ↓
Если ≥2 из 3 опровергли → отбросить (false positive)
Если ≤1 из 3 опровергли → подтвердить (real issue)
```

---

## Паттерн 1: Adversarial Verify (N идентичных скептиков)

Подходит, когда находка может быть ложно-положительной одним конкретным способом.

```javascript
export const meta = {
  name: 'adversarial-verify',
  description: 'Состязательная верификация с 3 скептиками',
  phases: [
    { title: 'Find', detail: 'Поиск проблем' },
    { title: 'Verify', detail: 'Состязательная верификация' },
  ],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    refuted: { type: 'boolean', description: 'true если нашёл причину отбросить' },
    reason: { type: 'string' }
  },
  required: ['refuted', 'reason']
}

phase('Find')
const findings = await agent('Найди потенциальные баги', {
  schema: {
    type: 'object',
    properties: {
      bugs: { type: 'array', items: { type: 'string' } }
    },
    required: ['bugs']
  }
})

phase('Verify')
const verified = await parallel(
  findings.bugs.map(bug => () =>
    // Для каждого бага: 3 независимых скептика
    parallel(Array.from({ length: 3 }, () => () =>
      agent(
        `Попытайся ОПРОВЕРГНУТЬ что это баг: "${bug}". 
         По умолчанию считай refuted=true если сомневаешься.
         Ищи: false alarm, already handled, not applicable here.`,
        { schema: VERDICT_SCHEMA }
      )
    )).then(votes => {
      const refuteCount = votes.filter(Boolean).filter(v => v.refuted).length
      return { bug, survives: refuteCount < 2 }  // нужно <2 опровержений для выживания
    })
  )
)

const real = verified.filter(Boolean).filter(v => v.survives).map(v => v.bug)
log(`Confirmed: ${real.length} из ${findings.bugs.length}`)
return real
```

---

## Паттерн 2: Perspective-Diverse Verify (N разных призм)

Подходит, когда находка может оказаться ложной по РАЗНЫМ причинам — и тогда это лучше, чем N одинаковых скептиков.

```javascript
const LENSES = ['correctness', 'security', 'reproducibility']

const judged = await parallel(
  findings.map(f => () =>
    parallel(LENSES.map(lens => () =>
      agent(
        `Суди "${f.description}" через призму "${lens}". Реальная проблема?`,
        { schema: VERDICT_SCHEMA, label: `judge:${lens}` }
      )
    )).then(votes => ({
      finding: f,
      real: votes.filter(Boolean).filter(v => !v.refuted).length >= 2
    }))
  )
)
```

**Когда diverse лучше identical скептиков**:
- Баг может быть неправильным, невоспроизводимым или уже исправленным
- Три одинаковых скептика могут ошибиться одинаково (correlated errors)
- Три разные призмы ловят разные failure modes

---

## Паттерн 3: Judge Panel (поиск лучшего решения)

```javascript
export const meta = {
  name: 'judge-panel',
  description: 'Генерация N подходов и выбор лучшего',
  phases: [
    { title: 'Generate', detail: 'N независимых решений' },
    { title: 'Judge', detail: 'Выбор лучшего' },
    { title: 'Synthesize', detail: 'Синтез из лучших частей' },
  ],
}

const APPROACHES = [
  'MVP-first: минимальная рабочая версия',
  'Risk-first: сначала самые опасные части',
  'User-first: приоритет пользовательского опыта',
]

phase('Generate')
const candidates = await parallel(
  APPROACHES.map(approach => () => agent(
    `Разработай решение для "${args}" используя подход: ${approach}`,
    { label: `generate:${approach.split(':')[0]}`, phase: 'Generate' }
  ))
)

phase('Judge')
const SCORE_SCHEMA = {
  type: 'object',
  properties: {
    winner: { type: 'number', minimum: 0, maximum: 2, description: 'Индекс лучшего решения' },
    scores: { type: 'array', items: { type: 'number' }, description: 'Оценки 1-10 для каждого' },
    bestIdeasFromLosers: { type: 'array', items: { type: 'string' } }
  },
  required: ['winner', 'scores', 'bestIdeasFromLosers']
}

const judgment = await agent(
  `Оцени эти 3 решения:\n${candidates.map((c, i) => `${i}: ${c}`).join('\n\n')}`,
  { schema: SCORE_SCHEMA }
)

phase('Synthesize')
const winner = candidates[judgment.winner]
const synthesis = await agent(
  `Улучши лучшее решение (${judgment.winner}), добавив лучшие идеи из других:
   Решение: ${winner}
   Идеи к добавлению: ${judgment.bestIdeasFromLosers.join(', ')}`
)

return { synthesis, scores: judgment.scores }
```

---

## Задание

Открой [starter.js](starter.js). Реализуй полный adversarial verification pipeline для code review.

---

## Подсказки

**Q: Сколько скептиков нужно?**
A: 3 — стандарт. Менее 3 — слабая верификация. Более 5 — дорого без доп. выгоды.

**Q: Порог голосования — сколько опровержений нужно?**
A: Зависит от задачи. Для безопасности: 1 опровержение = отбросить (высокая строгость). Для обычного code review: 2/3 = хорошо.

**Q: Почему `refuted=true` по умолчанию в промпте?**
A: Даём скептику "benefit of the doubt" — он должен АКТИВНО доказать что проблема реальна, а не просто промолчать.

---

## Критерии успеха Lab 06

- [x] Реализовал adversarial verify с голосованием
- [x] Понимаешь разницу identical vs diverse скептики
- [x] Знаешь когда judge panel лучше чем итерация
- [x] Понимаешь зачем `refuted=true` по умолчанию в промпте скептика

---

## Следующий шаг

→ [Lab 07: Продвинутые паттерны](../07-advanced-patterns/lab.md)
