// Lab 03: Решение — pipeline() vs parallel()

export const meta = {
  name: 'pipeline-vs-parallel-lab',
  description: 'Сравнение pipeline и parallel паттернов',
  phases: [
    { title: 'Pipeline Approach', detail: 'Explain → Simplify через pipeline (нет барьера)' },
    { title: 'Parallel Approach', detail: 'Все Explain → барьер → все Simplify' },
    { title: 'Compare', detail: 'Анализ результатов и времени' },
  ],
}

const CONCEPTS = [
  'Machine Learning',
  'Blockchain',
  'Quantum Computing',
  'WebAssembly',
]

// ============================================================
// ВАРИАНТ А: pipeline — НЕТ барьера
// "ML simplify" запускается пока "Blockchain explain" ещё идёт
// Время = самая медленная цепочка одного item
// ============================================================

phase('Pipeline Approach')
log('pipeline(): каждый концепт explain→simplify независимо...')

const pipelineResults = await pipeline(
  CONCEPTS,
  // Стадия 1: explain
  concept => agent(
    `Объясни "${concept}" одним абзацем для начинающего разработчика`,
    { label: `explain:${concept}`, phase: 'Pipeline Approach' }
  ),
  // Стадия 2: simplify — получает (explanation, originalConcept)
  (explanation, concept) => agent(
    `Упрости до одного предложения для 5-летнего ребёнка:
     "${explanation}"`,
    { label: `simplify:${concept}`, phase: 'Pipeline Approach' }
  )
)

// ============================================================
// ВАРИАНТ Б: parallel + барьер
// Сначала ВСЕ explain, потом ВСЕ simplify
// Время = сумма (самый медленный explain) + (самый медленный simplify)
// Барьер НУЖЕН если simplify зависит от cross-item контекста
// ============================================================

phase('Parallel Approach')
log('parallel(): сначала все explain, потом все simplify...')

// Барьер 1: все explain
const explanations = await parallel(
  CONCEPTS.map(concept => () => agent(
    `Объясни "${concept}" одним абзацем для начинающего разработчика`,
    { label: `explain-p:${concept}`, phase: 'Parallel Approach' }
  ))
)

// Между этими двумя parallel — точка синхронизации (барьер)
// Здесь могла бы быть cross-item операция: dedup, compare, cross-reference

// Барьер 2: все simplify
const simplified = await parallel(
  explanations.filter(Boolean).map((exp, i) => () => agent(
    `Упрости до одного предложения для 5-летнего ребёнка:
     "${exp}"`,
    { label: `simplify-p:${CONCEPTS[i]}`, phase: 'Parallel Approach' }
  ))
)

// ============================================================
// СРАВНЕНИЕ
// ============================================================

phase('Compare')

const comparison = await agent(
  `Сравни два подхода к параллельной обработке:

   PIPELINE РЕЗУЛЬТАТЫ (нет барьера):
   ${pipelineResults.filter(Boolean).map((r, i) => `${CONCEPTS[i]}: ${r}`).join('\n')}

   PARALLEL РЕЗУЛЬТАТЫ (с барьером):
   ${simplified.filter(Boolean).map((r, i) => `${CONCEPTS[i]}: ${r}`).join('\n')}

   Ответь:
   1. В каком случае pipeline() финишировал быстрее и почему?
   2. Когда parallel() + барьер был бы ЕДИНСТВЕННЫМ правильным выбором?
   3. Что нужно изменить чтобы simplify-стадия требовала барьер?`,
  { label: 'comparator' }
)

/*
 * КЛЮЧЕВЫЕ ИНСАЙТЫ:
 *
 * pipeline() быстрее потому что:
 * - "ML simplify" начинается как только "ML explain" закончился
 * - Не нужно ждать "Blockchain explain" и т.д.
 * - Общее время = max(каждой цепочки), а не sum(самых медленных стадий)
 *
 * parallel() + барьер нужен когда:
 * - simplify-агент должен сравнить между собой все explanations
 * - Нужна дедупликация всех результатов сразу
 * - Промпт ссылается на "другие объяснения" → cross-item dependency
 */

return {
  pipelineResults: pipelineResults.filter(Boolean),
  parallelResults: simplified.filter(Boolean),
  comparison,
  concepts: CONCEPTS
}
