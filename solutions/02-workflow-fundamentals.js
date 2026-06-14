// Lab 02: Решение — Основы Workflow
// Смотри только после попытки!

export const meta = {
  name: 'topic-researcher',
  description: 'Исследует тему и создаёт краткий структурированный отчёт',
  phases: [
    { title: 'Research', detail: 'Сбор информации по теме' },
    { title: 'Summarize', detail: 'Суммаризация и синтез' },
    { title: 'Evaluate', detail: 'Оценка качества резюме' },
  ],
}

const topic = args || 'Искусственный интеллект'

phase('Research')
log(`Исследуем тему: "${topic}"`)

const research = await agent(
  `Исследуй тему "${topic}". Предоставь:
   1. Краткое определение (2-3 предложения)
   2. 5 ключевых фактов
   3. Текущее состояние (2024-2025)
   4. Основные применения (3-5 пунктов)`,
  { label: 'researcher', phase: 'Research' }
)

phase('Summarize')
log('Суммаризируем результаты...')

const summary = await agent(
  `На основе следующего исследования создай краткое резюме на 100-150 слов.
   Резюме должно быть понятно человеку без специального образования.

   Исследование:
   ${research}`,
  { label: 'summarizer', phase: 'Summarize' }
)

// Задание со звёздочкой: оценка качества
phase('Evaluate')
log('Оцениваем качество...')

const evaluation = await agent(
  `Оцени качество этого резюме по шкале 1-10.
   Критерии: точность, ясность, полнота, краткость.
   Объясни оценку в 2-3 предложениях.

   Резюме:
   ${summary}`,
  { label: 'evaluator', phase: 'Evaluate' }
)

log('Готово!')

return {
  topic,
  research,
  summary,
  evaluation
}
