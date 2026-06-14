// Lab 06: Решение — Состязательная верификация

export const meta = {
  name: 'adversarial-code-review',
  description: 'Code review с состязательной верификацией находок',
  phases: [
    { title: 'Find', detail: 'Многоугловой поиск через 3 агента' },
    { title: 'Verify', detail: 'Adversarial верификация: 3 скептика для critical/high, 1 для остальных' },
    { title: 'Report', detail: 'Отчёт подтверждённых проблем' },
  ],
}

const CODE = args || `
async function getUserData(userId) {
  const query = "SELECT * FROM users WHERE id = " + userId;
  const result = await db.execute(query);
  if (result.length > 0) {
    const user = result[0];
    console.log("User found:", JSON.stringify(user));
    return user;
  }
  return null;
}

function calculateDiscount(price, userType) {
  if (userType == "admin") {
    return price * 0.5;
  } else if (userType == "premium") {
    return price * 0.8;
  }
  return price;
}
`

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          category: { enum: ['security', 'bug', 'performance', 'style'] },
          description: { type: 'string' },
          severity: { enum: ['low', 'medium', 'high', 'critical'] }
        },
        required: ['title', 'category', 'description', 'severity']
      }
    }
  },
  required: ['findings']
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    refuted: { type: 'boolean' },
    reason: { type: 'string' }
  },
  required: ['refuted', 'reason']
}

// ============================================================
// PHASE 1: Многоугловой поиск
// ============================================================

phase('Find')
log('Запускаем 3-угловой поиск...')

const ANGLES = [
  { name: 'security', focus: 'SQL injection, XSS, hardcoded secrets, auth bypass' },
  { name: 'bugs', focus: 'логические ошибки, null handling, type coercion' },
  { name: 'performance', focus: 'эффективность запросов, memory leaks, blocking' },
]

const searchResults = await parallel(
  ANGLES.map(angle => () => agent(
    `Найди проблемы в этом коде, фокус: ${angle.focus}

     \`\`\`javascript
     ${CODE}
     \`\`\``,
    { schema: FINDINGS_SCHEMA, label: `find:${angle.name}`, phase: 'Find' }
  ))
)

// Деdup по title
const seen = new Set()
const deduped = searchResults
  .filter(Boolean)
  .flatMap(r => r.findings)
  .filter(f => {
    const key = f.title.toLowerCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

log(`Найдено: ${deduped.length} уникальных проблем (из ${searchResults.filter(Boolean).flatMap(r => r.findings).length} всего)`)

// ============================================================
// PHASE 2: Adversarial верификация
// ============================================================

phase('Verify')
log('Верифицируем находки...')

const verified = await pipeline(
  deduped,
  finding => {
    // critical/high: 3 скептика; medium/low: 1 скептик
    const numSkeptics = (finding.severity === 'critical' || finding.severity === 'high') ? 3 : 1

    return parallel(
      Array.from({ length: numSkeptics }, () => () =>
        agent(
          `Попытайся ОПРОВЕРГНУТЬ что это реальная проблема:
           Проблема: "${finding.title}"
           Описание: ${finding.description}

           Код:
           \`\`\`javascript
           ${CODE}
           \`\`\`

           Ищи: false alarm, already handled, not applicable here, misunderstood context.
           По умолчанию refuted=true если есть малейшее сомнение.`,
          { schema: VERDICT_SCHEMA, label: `skeptic:${finding.category}:${finding.severity}`, phase: 'Verify' }
        )
      )
    ).then(votes => {
      const validVotes = votes.filter(Boolean)
      const refuteCount = validVotes.filter(v => v.refuted).length
      const majority = Math.ceil(numSkeptics / 2)
      return {
        ...finding,
        survives: refuteCount < majority,
        votes: validVotes.length,
        refuteCount
      }
    })
  }
)

const confirmed = verified.filter(Boolean).filter(f => f.survives)
log(`Подтверждено: ${confirmed.length} из ${deduped.length} (отсеяно: ${deduped.length - confirmed.length})`)

// ============================================================
// PHASE 3: Отчёт
// ============================================================

phase('Report')

// Сортировка по severity
const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
const sorted = [...confirmed].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

const report = await agent(
  `Создай краткий отчёт code review на основе подтверждённых проблем:

   ${sorted.map((f, i) => `${i + 1}. [${f.severity.toUpperCase()}] ${f.title}: ${f.description}`).join('\n')}

   Включи: краткое резюме (2-3 предложения), топ-3 приоритетных действия.`,
  { label: 'report-generator' }
)

return {
  summary: {
    total: deduped.length,
    confirmed: confirmed.length,
    confirmationRate: (confirmed.length / deduped.length * 100).toFixed(0) + '%',
    bySeverity: {
      critical: confirmed.filter(f => f.severity === 'critical').length,
      high: confirmed.filter(f => f.severity === 'high').length,
      medium: confirmed.filter(f => f.severity === 'medium').length,
      low: confirmed.filter(f => f.severity === 'low').length,
    }
  },
  confirmed: sorted,
  report
}
