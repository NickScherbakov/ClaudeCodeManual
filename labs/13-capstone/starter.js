// Lab 13: Capstone — Комплексный workflow
//
// Задача: всесторонний анализ кодовой базы со всеми изученными техниками
//
// Запуск: "Запусти labs/13-capstone/starter.js как workflow +200k"

// ============================================================
// TODO: мета блок
// Требования:
// - name: 'codebase-analysis-capstone'
// - description: описание что делает workflow
// - phases: минимум 4 фазы (Scout, Find, Verify, Plan)
// ============================================================

// export const meta = { ... }

// ============================================================
// КОНФИГУРАЦИЯ
// ============================================================

const target = args?.target || args || 'JavaScript/TypeScript codebase'
const MAX_FINDINGS_PER_ROUND = 20

// ============================================================
// СХЕМЫ ДАННЫХ — определи все нужные schema здесь
// ============================================================

// TODO: FINDING_SCHEMA — структурированная находка
// { title, category (enum), severity (enum), description, file?, line? }

// TODO: VERDICT_SCHEMA — вердикт скептика
// { refuted, reason, confidence (0-1) }

// TODO: PRIORITY_SCHEMA — приоритизированный план
// { priority (1-5), action, estimatedEffort (enum), reasoning }

// TODO: GAPS_SCHEMA — пробелы от completeness critic
// { gaps: [{ aspect, why_important, priority (enum) }] }

// ============================================================
// PHASE 1: SCOUT — multi-modal sweep кодовой базы
// Цель: получить высокоуровневое понимание структуры
// Используй: parallel(), НЕ нужен worktree (агенты только читают!)
// ============================================================

// phase('Scout')
// log('Начинаем разведку кодовой базы...')

// const SCOUT_MODALITIES = [
//   { key: 'structure', prompt: 'Опиши файловую структуру и архитектуру проекта' },
//   { key: 'patterns', prompt: 'Найди повторяющиеся паттерны и анти-паттерны' },
//   { key: 'dependencies', prompt: 'Проанализируй зависимости и их актуальность' },
//   { key: 'complexity', prompt: 'Найди самые сложные/запутанные части кода' },
// ]

// TODO: запустить scout агентов параллельно
// Сохрани контекст для Phase 2

// ============================================================
// PHASE 2: FIND — loop-until-dry поиск проблем
// Цель: исчерпывающий поиск всех проблем
// Используй: loop-until-dry, parallel, dedup через Set
// ============================================================

// phase('Find')
// const seen = new Set()
// const allFindings = []
// let dry = 0

// const FIND_ANGLES = [
//   { key: 'security', prompt: 'SQL injection, XSS, hardcoded secrets, auth bypass' },
//   { key: 'bugs', prompt: 'logic errors, null handling, async issues, race conditions' },
//   { key: 'performance', prompt: 'N+1 queries, memory leaks, blocking operations' },
//   { key: 'maintainability', prompt: 'dead code, duplications, poor abstractions' },
// ]

// TODO: реализовать loop-until-dry
// - каждый раунд: parallel по FIND_ANGLES
// - dedup по нормализованному ключу (title+category)
// - останавливаться после 2 пустых раундов
// - budget-aware: проверяй budget.remaining() в условии цикла

// ============================================================
// PHASE 3: VERIFY — adversarial verification
// Цель: отсеять false positives
// Используй: pipeline, parallel(3 скептика), voting
// Детали:
// - critical/high: 3 скептика, выживает если <2 опровергли
// - medium/low: 1 скептик (экономия токенов)
// ============================================================

// phase('Verify')
// log(`Верифицируем ${allFindings.length} находок...`)

// TODO: реализовать adversarial verify через pipeline
// Подсказка: pipeline(allFindings, finding => parallel(skeptics))

// ============================================================
// PHASE 4: PRIORITIZE — judge panel (budget-aware)
// Цель: структурированный план действий
// Детали:
// - budget > 200k: полная judge panel (3 эксперта)
// - budget <= 200k или null: быстрая сортировка
// ============================================================

// phase('Prioritize')

// TODO: budget-aware приоритизация

// ============================================================
// PHASE 5: PLAN — completeness critic + финальный план
// Цель: убедиться что ничего не пропустили
// ============================================================

// phase('Plan')

// TODO: completeness critic
// TODO: fill high-priority gaps
// TODO: синтезировать финальный план действий

// ============================================================
// ФИНАЛЬНЫЙ ВЫВОД
// ============================================================

// return {
//   target,
//   stats: {
//     foundTotal: allFindings.length,
//     confirmed: confirmed.length,
//     confirmationRate: (confirmed.length / allFindings.length).toFixed(2),
//     tokensSpent: budget.spent(),
//     budgetUsed: budget.total ? (budget.spent() / budget.total).toFixed(2) : 'N/A',
//   },
//   confirmedFindings: confirmed,
//   actionPlan,
//   gaps: critique?.gaps || [],
// }
