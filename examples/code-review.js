// Многоизмерительный code review с адверсариальной верификацией.
//
// Запуск: "Запусти examples/code-review.js как workflow +80k"
// С аргументом: "Запусти examples/code-review.js как workflow +80k" и передай путь через args
// По умолчанию анализирует target/app.js — намеренно багованный учебный файл.
//
// Цель: существует отчёт о реальных проблемах кода, верифицированных
//       тремя независимыми агентами-скептиками.
// Декомпозиция:
//   Scan:   файл → список проблем по измерению (bugs/security/perf/quality)
//   Dedup:  все списки → уникальные проблемы по ключу file:line:description
//   Verify: каждая проблема → 3 скептика (по умолчанию refuted:true) → выжившие (≥2 голоса)
//   Report: выжившие → структурированный отчёт по severity
// Процессы: parallel(SCAN) → dedup → pipeline(VERIFY) → return(REPORT)
// Ресурсы:  4 агента-сканера, N×3 агентов-скептиков

export const meta = {
  name: 'code-review',
  description: 'Многоизмерительный code review: 4 сканера → dedup → 3 скептика на находку',
  phases: [
    { title: 'Scan', detail: '4 агента сканируют по разным измерениям параллельно' },
    { title: 'Verify', detail: '3 скептика независимо проверяют каждую находку' },
    { title: 'Report', detail: 'Итоговый отчёт по severity' },
  ],
}

const TARGET = args || 'target/app.js'

const SCAN_SCHEMA = {
  type: 'object',
  required: ['issues'],
  properties: {
    issues: {
      type: 'array',
      items: {
        type: 'object',
        required: ['file', 'line', 'severity', 'description', 'fix'],
        properties: {
          file:        { type: 'string' },
          line:        { type: 'string' },
          severity:    { enum: ['critical', 'major', 'minor'] },
          description: { type: 'string' },
          fix:         { type: 'string' },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['refuted', 'reason'],
  properties: {
    refuted: { type: 'boolean' },
    reason:  { type: 'string' },
  },
}

const DIMENSIONS = [
  {
    key: 'bugs',
    prompt: 'баги и логические ошибки: неверные условия, off-by-one, ' +
            'неправильная обработка ошибок, неинициализированные переменные',
  },
  {
    key: 'security',
    prompt: 'уязвимости безопасности: SQL injection, XSS, command injection, ' +
            'незащищённые входные данные, хардкод secrets, небезопасная десериализация',
  },
  {
    key: 'performance',
    prompt: 'проблемы производительности: синхронный ввод-вывод в горячем пути, ' +
            'N+1 запросы, утечки памяти, блокирующие операции в event loop',
  },
  {
    key: 'quality',
    prompt: 'качество кода: нарушения async/await (забытый await, смешанный стиль), ' +
            'небезопасные приведения типов, мёртвый код, нарушенные контракты функций',
  },
]

// Фаза 1 — четыре агента сканируют параллельно по разным измерениям.
// Барьер (parallel) здесь оправдан: дедупликация требует ВСЕ результаты сразу.
phase('Scan')
log(`Сканирую ${TARGET} по ${DIMENSIONS.length} измерениям...`)

const scans = await parallel(DIMENSIONS.map(d => () =>
  agent(
    `Проанализируй файл ${TARGET} на ${d.prompt}.\n\n` +
    `Требования:\n` +
    `- Сообщай только о реальных, конкретных проблемах\n` +
    `- Указывай точный номер строки (поле line)\n` +
    `- Не включай находки если не уверен\n` +
    `- Поле fix — конкретное исправление, не "проверь это"`,
    { label: `scan:${d.key}`, schema: SCAN_SCHEMA }
  )
))

const allIssues = scans.filter(Boolean).flatMap(r => r.issues)
log(`Найдено ${allIssues.length} потенциальных проблем — дедуплицирую...`)

// Дедупликация по составному ключу: location + первые 60 символов описания
const seenKeys = new Set()
const deduped = allIssues.filter(issue => {
  const key = `${issue.file}:${issue.line}:${issue.description.slice(0, 60)}`
  if (seenKeys.has(key)) return false
  seenKeys.add(key)
  return true
})

log(`После дедупликации: ${deduped.length} уникальных — запускаю верификацию`)

// Фаза 2 — три скептика независимо проверяют каждую находку.
// pipeline() здесь правильный выбор: каждая находка проходит верификацию независимо,
// нет необходимости ждать ВСЕХ находок перед началом следующей.
// Выживает находка если ≥2 из 3 скептиков НЕ опровергают.
phase('Verify')

const verified = await pipeline(
  deduped,

  async issue => {
    const votes = await parallel([
      () => agent(
        `Ты скептик-рецензент. Попытайся опровергнуть эту находку:\n` +
        `Файл: ${issue.file}, строка: ${issue.line}\n` +
        `Проблема: ${issue.description}\n` +
        `Исправление: ${issue.fix}\n\n` +
        `Опровергни (refuted: true) если строка не существует, описание неточное, ` +
        `это не настоящая проблема, или исправление неверное. ` +
        `При малейших сомнениях — refuted: true.`,
        { label: `skeptic:${issue.line}:A`, schema: VERDICT_SCHEMA }
      ),
      () => agent(
        `Ты строгий аудитор безопасности. Оцени эту находку:\n` +
        `Файл: ${issue.file}, строка: ${issue.line}\n` +
        `Проблема: ${issue.description}\n` +
        `Исправление: ${issue.fix}\n\n` +
        `Это реальная, эксплуатируемая проблема или ложная тревога? ` +
        `Может ли эта проблема быть намеренной или обрабатываться на другом уровне? ` +
        `При сомнениях — refuted: true.`,
        { label: `skeptic:${issue.line}:B`, schema: VERDICT_SCHEMA }
      ),
      () => agent(
        `Ты senior-разработчик с 10+ лет опыта. Проверь эту находку:\n` +
        `Файл: ${issue.file}, строка: ${issue.line}\n` +
        `Проблема: ${issue.description}\n` +
        `Исправление: ${issue.fix}\n\n` +
        `Возможные причины отклонить: ложная тревога, намеренная логика, ` +
        `обрабатывается выше по стеку, специфика фреймворка. ` +
        `Если хоть немного сомневаешься — refuted: true.`,
        { label: `skeptic:${issue.line}:C`, schema: VERDICT_SCHEMA }
      ),
    ])

    const validVotes = votes.filter(Boolean)
    const survivedCount = validVotes.filter(v => !v.refuted).length
    return { issue, survived: survivedCount, total: validVotes.length }
  },

  ({ issue, survived, total }) =>
    survived >= Math.ceil(total / 2) ? issue : null,
)

const confirmed = verified.filter(Boolean)
log(`Прошли верификацию: ${confirmed.length} из ${deduped.length}`)

// Фаза 3 — сводный отчёт
phase('Report')

const critical = confirmed.filter(i => i.severity === 'critical')
const major    = confirmed.filter(i => i.severity === 'major')
const minor    = confirmed.filter(i => i.severity === 'minor')

return {
  target: TARGET,
  summary: {
    scanned:  allIssues.length,
    unique:   deduped.length,
    verified: confirmed.length,
    critical: critical.length,
    major:    major.length,
    minor:    minor.length,
  },
  issues: { critical, major, minor },
}
