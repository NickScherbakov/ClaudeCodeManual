// Lab 06: Состязательная верификация — Starter Script
//
// Задача: построить полный pipeline для проверки утверждений с adversarial verify
//
// Решение: /solutions/06-adversarial-verification.js

export const meta = {
  name: 'adversarial-code-review',
  description: 'Code review с состязательной верификацией находок',
  phases: [
    { title: 'Find', detail: 'Многоугловой поиск проблем' },
    { title: 'Verify', detail: 'Adversarial верификация' },
    { title: 'Report', detail: 'Финальный отчёт подтверждённых проблем' },
  ],
}

// Код для анализа (передай свой через args)
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

// Схемы данных
const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          line: { type: 'number' },
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
// ЗАДАНИЕ 1: Многоугловой поиск
//
// Запусти 3 агентов параллельно, каждый ищет через другой угол:
// - security: SQL injection, XSS, hardcoded secrets, auth bypass
// - bugs: logical errors, null handling, type coercion, async issues
// - performance: N+1 queries, memory leaks, blocking calls
// ============================================================

const SEARCH_ANGLES = [
  { name: 'security', focus: 'уязвимости безопасности: SQL injection, XSS, auth bypass' },
  { name: 'bugs', focus: 'логические ошибки, null handling, type coercion, async проблемы' },
  { name: 'performance', focus: 'проблемы производительности и масштабируемости' },
]

phase('Find')
log('Запускаем многоугловой поиск проблем...')

// TODO: запустить 3 агента параллельно через pipeline или parallel
// Каждый агент ищет проблемы через свой угол в CODE
// Использует FINDINGS_SCHEMA

// const allFindings = await parallel(
//   SEARCH_ANGLES.map(angle => () => agent(...))
// )

// TODO: объединить и дедуплицировать находки
// const combined = allFindings.filter(Boolean).flatMap(r => r.findings)
// Дедупликация по title (toLowerCase)
// const seen = new Set()
// const deduped = combined.filter(f => {
//   const key = f.title.toLowerCase()
//   if (seen.has(key)) return false
//   seen.add(key)
//   return true
// })

log(`Найдено: 0 уникальных проблем`)  // обнови с реальным числом

// ============================================================
// ЗАДАНИЕ 2: Adversarial верификация
//
// Для каждой найденной проблемы:
// - Запустить 3 независимых скептика
// - Каждый скептик пытается ОПРОВЕРГНУТЬ находку
// - Проблема выживает если <2 скептиков опровергли
//
// Для critical/high: 3 скептика
// Для medium/low: 1 скептик (экономия токенов)
// ============================================================

phase('Verify')
log('Верифицируем находки...')

// TODO: реализовать adversarial verify
// Подсказка: используй pipeline для обработки каждой находки
// Внутри стадии verify: используй parallel для N скептиков

// const verified = await pipeline(
//   deduped,
//   finding => {
//     const numSkeptics = (finding.severity === 'critical' || finding.severity === 'high') ? 3 : 1
//     return parallel(
//       Array.from({ length: numSkeptics }, () => () =>
//         agent(
//           `Попытайся опровергнуть: "${finding.title}". ${finding.description}
//            Код: ${CODE}
//            Опровергни если: false alarm, already handled, not applicable.
//            По умолчанию refuted=true если сомневаешься.`,
//           { schema: VERDICT_SCHEMA, label: `skeptic:${finding.category}` }
//         )
//       )
//     ).then(votes => {
//       const refuteCount = votes.filter(Boolean).filter(v => v.refuted).length
//       return { ...finding, survives: refuteCount < Math.ceil(numSkeptics / 2) }
//     })
//   }
// )

// const confirmed = verified?.filter(Boolean).filter(f => f.survives) || []
// log(`Подтверждено: ${confirmed.length} из ${deduped.length}`)

// ============================================================
// ЗАДАНИЕ 3: Финальный отчёт
// ============================================================

phase('Report')

// TODO: сгенерировать отчёт с confirmed находками
// Отсортировать по severity (critical → high → medium → low)
// Добавить рекомендации по исправлению

// return { confirmed, total: deduped.length, confirmationRate: confirmed.length / deduped.length }
