// Lab 05: Структурированный вывод — Starter Script
//
// Задача: создать workflow для анализа кода с типизированными данными
//
// Эталонное решение для этой лабы намеренно не предоставлено.

export const meta = {
  name: 'code-analysis-typed',
  description: 'Типизированный анализ кода через schema-валидацию',
  phases: [
    { title: 'Analyze', detail: 'Структурированный анализ' },
    { title: 'Report', detail: 'Генерация типизированного отчёта' },
  ],
}

const CODE_SNIPPET = args || `
function processUser(data) {
  var user = data.user
  if (user.age > 18) {
    db.query("SELECT * FROM orders WHERE user_id = " + user.id)
    return user
  }
}
`

// ============================================================
// ЗАДАНИЕ 1: Спроектируй schema для находок кода
//
// Schema должна содержать:
//   - findings: массив объектов с полями:
//     * line: number
//     * type: enum ['bug', 'security', 'style', 'performance']
//     * description: string
//     * severity: enum ['low', 'medium', 'high', 'critical']
//     * suggestion: string (как исправить)
//   - summary: string
//   - overallScore: number (1-10, где 10 = идеальный код)
// ============================================================

const CODE_ANALYSIS_SCHEMA = {
  // TODO: реализуй schema
}

// ============================================================
// ЗАДАНИЕ 2: Анализ кода через schema-валидацию
// ============================================================

phase('Analyze')
log('Анализируем код...')

// TODO: запустить агента с CODE_ANALYSIS_SCHEMA
// const analysis = await agent(
//   `Проанализируй этот код и найди все проблемы:\n\n${CODE_SNIPPET}`,
//   { schema: CODE_ANALYSIS_SCHEMA, label: 'code-analyzer' }
// )

// Теперь у тебя типизированные данные:
// analysis.findings — массив объектов
// analysis.overallScore — число
// analysis.summary — строка

// ============================================================
// ЗАДАНИЕ 3: Параллельная верификация находок
//
// Для каждой critical/high находки — запустить отдельного агента-верификатора
// Верификатор должен вернуть: { isReal: boolean, reasoning: string }
// ============================================================

const VERDICT_SCHEMA = {
  // TODO: schema для вердикта
  // isReal: boolean
  // reasoning: string
  // confidence: number (0-1)
}

// TODO: отфильтровать critical/high находки
// const criticalFindings = analysis?.findings?.filter(...)

// TODO: параллельно верифицировать каждую
// const verdicts = await parallel(
//   criticalFindings.map(finding => () => agent(
//     `Верифицируй: является ли это реальной проблемой?
//      Тип: ${finding.type}, описание: ${finding.description}
//      Код: ${CODE_SNIPPET}
//      Попытайся ОПРОВЕРГНУТЬ — это реальная проблема только если нельзя опровергнуть.`,
//     { schema: VERDICT_SCHEMA, label: `verify:${finding.type}:${finding.line}` }
//   ))
// )

// ============================================================
// ЗАДАНИЕ 4: Финальный типизированный отчёт
// ============================================================

phase('Report')

const REPORT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    executiveSummary: { type: 'string' },
    confirmedIssues: { type: 'number' },
    topPriority: { type: 'string' },
    recommendedActions: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 5
    }
  },
  required: ['title', 'executiveSummary', 'confirmedIssues', 'recommendedActions']
}

// TODO: сгенерировать финальный отчёт на основе анализа и вердиктов
// const report = await agent(...)

// return { analysis, verdicts: verdicts?.filter(Boolean), report }
