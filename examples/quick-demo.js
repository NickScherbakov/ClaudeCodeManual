export const meta = {
  name: 'quick-demo',
  description: 'Демо Workflow tool за 30 секунд: параллельный поиск + адверсариальная верификация',
  phases: [
    { title: 'Find', detail: '3 агента ищут параллельно' },
    { title: 'Verify', detail: 'скептик-агент проверяет каждую находку' },
  ],
}

// ДЕМО: три агента ищут одновременно → каждая находка проходит верификацию скептиком.
// Запустить: скажи Claude "Запусти examples/quick-demo.js как workflow +30k"

const TOPIC = args || 'многоагентная оркестрация в Claude Code'

const FINDING_SCHEMA = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['claim', 'evidence'],
        properties: {
          claim:    { type: 'string' },
          evidence: { type: 'string' },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['supported', 'reason'],
  properties: {
    supported: { type: 'boolean' },
    reason:    { type: 'string' },
  },
}

// Фаза 1 — три агента ищут с разных углов параллельно
phase('Find')
const searches = await parallel([
  () => agent(`Найди 2–3 конкретных факта о теме: "${TOPIC}". Фокус: практические применения.`,
              { label: 'finder:practical', schema: FINDING_SCHEMA }),
  () => agent(`Найди 2–3 конкретных факта о теме: "${TOPIC}". Фокус: ограничения и ошибки.`,
              { label: 'finder:limits',    schema: FINDING_SCHEMA }),
  () => agent(`Найди 2–3 конкретных факта о теме: "${TOPIC}". Фокус: неочевидные нюансы.`,
              { label: 'finder:nuances',  schema: FINDING_SCHEMA }),
])

const allFindings = searches
  .filter(Boolean)
  .flatMap(r => r.findings)

log(`Найдено ${allFindings.length} утверждений — запускаю верификацию`)

// Фаза 2 — скептик-агент проверяет каждое утверждение независимо
phase('Verify')
const verified = await pipeline(
  allFindings,
  finding => agent(
    `Ты скептик. Проверь это утверждение: "${finding.claim}"\n` +
    `Доказательство автора: "${finding.evidence}"\n` +
    `Если хоть немного сомневаешься — отклоняй (supported: false).`,
    { label: `verify:${finding.claim.slice(0, 30)}`, schema: VERDICT_SCHEMA }
  ),
  (verdict, finding) => verdict?.supported ? finding : null,
)

const confirmed = verified.filter(Boolean)

log(`Верифицировано: ${confirmed.length} из ${allFindings.length}`)

return {
  topic: TOPIC,
  total_found: allFindings.length,
  confirmed: confirmed.length,
  findings: confirmed,
}
