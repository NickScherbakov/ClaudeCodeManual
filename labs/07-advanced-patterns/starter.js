// Lab 07: Продвинутые паттерны — Starter Script
//
// Задача: исчерпывающий анализ темы через multi-modal sweep + completeness critic
//
// Эталонное решение для этой лабы намеренно не предоставлено.

export const meta = {
  name: 'exhaustive-topic-analysis',
  description: 'Исчерпывающий анализ: multi-modal sweep + completeness critic',
  phases: [
    { title: 'Sweep', detail: 'Многомодальный поиск фактов/идей' },
    { title: 'CritiqueGaps', detail: 'Поиск пропущенных аспектов' },
    { title: 'FillGaps', detail: 'Заполнение пробелов' },
    { title: 'Synthesize', detail: 'Синтез итогового ответа' },
  ],
}

const topic = args || 'Преимущества и недостатки микросервисной архитектуры'

// 4 разные модальности поиска
const MODALITIES = [
  { key: 'technical', prompt: 'Технические аспекты, архитектурные решения, инструменты' },
  { key: 'organizational', prompt: 'Влияние на команды, процессы, организационные паттерны' },
  { key: 'operational', prompt: 'Операционные сложности, мониторинг, деплой, производительность' },
  { key: 'economic', prompt: 'Экономика: стоимость разработки, ROI, технический долг' },
]

const INSIGHT_SCHEMA = {
  type: 'object',
  properties: {
    insights: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          point: { type: 'string' },
          stance: { enum: ['advantage', 'disadvantage', 'tradeoff', 'consideration'] },
          importance: { type: 'number', minimum: 1, maximum: 5 }
        },
        required: ['point', 'stance', 'importance']
      }
    }
  },
  required: ['insights']
}

const GAPS_SCHEMA = {
  type: 'object',
  properties: {
    gaps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          aspect: { type: 'string', description: 'Что не было рассмотрено' },
          why_important: { type: 'string' },
          priority: { enum: ['low', 'medium', 'high'] }
        },
        required: ['aspect', 'why_important', 'priority']
      }
    }
  },
  required: ['gaps']
}

// ============================================================
// ЗАДАНИЕ 1: Multi-Modal Sweep
//
// Запусти все 4 модальности параллельно
// Используй INSIGHT_SCHEMA
// Собери и дедуплицируй все insights
// ============================================================

phase('Sweep')
log(`Анализируем тему: ${topic}`)

// TODO: запустить 4 агента параллельно
// const sweepResults = await parallel(...)

// TODO: объединить все insights
// Дедупликация по point.toLowerCase()
// const allInsights = ...

log(`Собрано insights: 0`)  // обнови

// ============================================================
// ЗАДАНИЕ 2: Completeness Critic
//
// Агент анализирует что было покрыто (4 модальности)
// и находит ПРОПУЩЕННЫЕ аспекты
// ============================================================

phase('CritiqueGaps')
log('Ищем пробелы в анализе...')

// TODO: запустить completeness critic
// Подсказка: расскажи агенту ЧТО было проверено и что нашли
// Пусть найдёт gap'ы через GAPS_SCHEMA

// const critique = await agent(...)

// ============================================================
// ЗАДАНИЕ 3: Заполнение пробелов
//
// Для high-priority gaps из шага 2:
// Запустить дополнительный агент для каждого
// ============================================================

phase('FillGaps')

// TODO: отфильтровать high-priority gaps
// TODO: запустить агентов для заполнения пробелов (parallel)
// TODO: добавить новые insights к allInsights

// ============================================================
// ЗАДАНИЕ 4: Синтез
//
// Финальный агент синтезирует структурированный ответ
// из всех собранных insights
// ============================================================

phase('Synthesize')
log('Синтезируем финальный анализ...')

// TODO: синтезировать итоговый анализ
// Используй allInsights для контекста
// Структурируй как: key advantages, key disadvantages, key tradeoffs

// return { topic, insightCount: allInsights.length, analysis: ... }

// ============================================================
// ЗАДАНИЕ 5 (со звёздочкой)*: Loop-Until-Dry
//
// Оберни Sweep + CritiqueGaps в loop-until-dry
// Останавливаться когда Completeness Critic находит 0 high-priority gaps
// ============================================================
