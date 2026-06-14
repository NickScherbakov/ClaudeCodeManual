// Lab 03: pipeline() vs parallel() — Starter Script
//
// Задача: реализовать анализ списка концепций двумя способами
// и сравнить подходы.
//
// Решение: /solutions/03-pipeline-vs-parallel.js

export const meta = {
  name: 'pipeline-vs-parallel-lab',
  description: 'Сравнение pipeline и parallel паттернов',
  phases: [
    { title: 'Pipeline Approach', detail: 'Анализ через pipeline' },
    { title: 'Parallel Approach', detail: 'Анализ через parallel с барьером' },
    { title: 'Compare', detail: 'Сравнение результатов' },
  ],
}

const CONCEPTS = [
  'Machine Learning',
  'Blockchain',
  'Quantum Computing',
  'WebAssembly',
]

// ============================================================
// ВАРИАНТ А: pipeline() подход
// Каждый концепт проходит explain → simplify независимо
// explain для "ML" запускается пока "Blockchain" ещё объясняется
// ============================================================

phase('Pipeline Approach')
log('Запускаем pipeline вариант...')

// TODO: реализуй через pipeline()
// Стадия 1: explain — объяснить концепт одним абзацем
// Стадия 2: simplify — упростить до одного предложения для 5-летнего
// Стадия 3 (со звёздочкой)*: rate — оценить полезность концепта 1-10

// const pipelineResults = await pipeline(
//   CONCEPTS,
//   concept => agent(...),
//   (explanation, concept) => agent(...),
// )

// ============================================================
// ВАРИАНТ Б: parallel() + барьер
// Сначала ВСЕ объяснения, потом ВСЕ упрощения
// Это имитирует случай когда нам нужны все объяснения сразу
// (например, для cross-reference между концептами)
// ============================================================

phase('Parallel Approach')
log('Запускаем parallel вариант...')

// TODO: реализуй через parallel() + барьер
// Сначала: parallel для всех explain
// Потом: parallel для всех simplify (используя результаты explain)
// Подсказка: parallel принимает массив thunks () => promise

// const explanations = await parallel(
//   CONCEPTS.map(concept => () => agent(...))
// )
// const simplified = await parallel(
//   explanations.filter(Boolean).map((exp, i) => () => agent(...))
// )

// ============================================================
// СРАВНЕНИЕ: Ответь на вопросы в комментарии
// ============================================================

phase('Compare')
log('Анализируем результаты...')

// TODO: попроси агента сравнить оба подхода
// const comparison = await agent(
//   `Сравни эти два набора результатов и объясни какой подход лучше и почему:
//   Pipeline: ${JSON.stringify(pipelineResults)}
//   Parallel: ${JSON.stringify(simplified)}`
// )

// return { pipelineResults, parallelResults: simplified, comparison }

// ============================================================
// ВОПРОСЫ ДЛЯ РАЗМЫШЛЕНИЯ (ответь в комментариях):
//
// 1. В каком случае pipeline() финишировал быстрее? Почему?
// 2. Когда parallel() + барьер был бы ПРАВИЛЬНЫМ выбором?
// 3. Что было бы если simplify агентам нужен был бы контекст
//    от ВСЕХ explain агентов одновременно?
// ============================================================
