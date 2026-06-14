// project/system.js — наша растущая система анализа кода
//
// Спроектирована ОТ ЦЕЛИ (методика 4 узлов, GUIDE.md Глава 0):
//   Узел 1 ЦЕЛЬ:     типизированный отчёт из проблем target/app.js (локация + severity)
//   Узел 2 ЗАДАЧИ:   A прочитать код → B итеративный поиск раундами до исчерпания
//   Узел 3 ПРОЦЕССЫ: A→B последовательно; B = цикл раундов; каждый раунд — 3 угла parallel()
//                    стоп: 2 пустых раунда подряд (loop-until-dry)
//   Узел 4 РЕСУРСЫ:  1 reader + N×3 угловых агента (N неизвестно заранее)
//
// Запуск: попроси Claude "Запусти project/system.js как workflow"

export const meta = {
  name: 'code-intelligence',
  description: 'Итеративный отчёт из проблем target/app.js (loop-until-dry, 3 угла, schema)',
  phases: [
    { title: 'Read',   detail: 'Узел 2/A — изучаем target/app.js' },
    { title: 'Find',   detail: 'Узел 2/B — раунды поиска до исчерпания' },
  ],
}

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title:    { type: 'string',  description: 'Краткая суть проблемы' },
          function: { type: 'string',  description: 'Имя функции' },
          line:     { type: 'integer', description: 'Номер строки в target/app.js' },
          severity: { enum: ['low', 'medium', 'high', 'critical'] },
          detail:   { type: 'string',  description: 'Объяснение и/или как чинить' },
        },
        required: ['title', 'function', 'severity'],
      },
    },
  },
  required: ['items'],
}

// ── Узел 2/A — читаем код (углы зависят от overview → стоит ПЕРЕД циклом) ──
phase('Read')
log('Читаю target/app.js...')

const overview = await agent(
  `Прочитай файл target/app.js. Дай сжатый обзор: какие функции есть,
   что каждая делает, как данные ходят между ними. Только факты, без оценок.`,
  { label: 'reader' }
)

// ── Узел 2/B — loop-until-dry ────────────────────────────────────────────────
phase('Find')

const ANGLES = [
  {
    key: 'security',
    prompt: `Ты ищешь ТОЛЬКО проблемы БЕЗОПАСНОСТИ: инъекции, RCE/eval, path traversal,
             хардкод секретов, слабая криптография, утечки данных в логи/ответы.
             Игнорируй стиль и логические баги.`,
  },
  {
    key: 'bugs',
    prompt: `Ты ищешь ТОЛЬКО логические БАГИ: off-by-one, неверные сравнения (== vs ===),
             необработанные undefined/null, неверные граничные условия, тихие сбои.
             Игнорируй безопасность и стиль.`,
  },
  {
    key: 'quality',
    prompt: `Ты ищешь ТОЛЬКО проблемы КАЧЕСТВА: устаревший синтаксис (var), N+1 запросы,
             мутация чужих объектов, плохая структура, производительность.
             Игнорируй безопасность и логические баги.`,
  },
]

// Правило 1: seen = Set ВСЕГО найденного когда-либо. Дедуп — против seen, не collected.
const seen = new Set()
const collected = []
let dry = 0
let round = 0

while (dry < 2) {
  round++
  log(`Раунд ${round}. Пустых подряд: ${dry}/2`)

  const results = await parallel(
    ANGLES.map(angle => () => agent(
      `${angle.prompt}

       Обзор кода target/app.js:
       ${overview}

       Прочитай target/app.js сам. Найди проблемы СВОЕГО УГЛА которые ещё не очевидны.
       Уже найденные проблемы (${collected.length} шт.) пропусти — ищи что-то новое.`,
      { label: `r${round}:${angle.key}`, phase: 'Find', schema: FINDINGS_SCHEMA }
    ))
  )

  // Собираем и нормализуем ключ дедупа
  const found = results
    .filter(Boolean)
    .flatMap((r, i) => (r.items || []).map(item => ({ ...item, angle: ANGLES[i].key })))

  const fresh = found.filter(item => {
    // Ключ: функция + строка + первые 40 символов title (нижний регистр)
    const key = `${item.function}:${item.line}:${String(item.title).toLowerCase().slice(0, 40)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  if (fresh.length === 0) {
    dry++
    log(`Раунд ${round}: ничего нового. dry = ${dry}/2`)
  } else {
    // Правило 2: dry сбрасывается при ЛЮБОЙ новой находке
    dry = 0
    collected.push(...fresh)
    log(`Раунд ${round}: +${fresh.length} новых. Итого: ${collected.length}`)
  }
}

// Подсчёт по severity (schema дала типы → программно)
const counts = { critical: 0, high: 0, medium: 0, low: 0 }
for (const f of collected) {
  if (counts[f.severity] !== undefined) counts[f.severity]++
}

log(`Итого: ${collected.length} проблем — critical:${counts.critical} high:${counts.high} medium:${counts.medium} low:${counts.low}`)

// Узел 1 — цель: итеративный типизированный отчёт существует
return { overview, findings: collected, counts, rounds: round }
