// Сквозной пример курса: руководство для издательства.
//
// Запуск: "Запусти examples/publisher-manual/publisher-manual-workflow.js как workflow +150k"
//
// Цель: существует пакет сдачи для издательства: концепция книги, структура,
// проверки качества, план GitHub-репозитория и следующие действия до рукописи.

export const meta = {
  name: 'publisher-manual-workflow',
  description: 'От оффера издательства до плана готовой книги о Claude Code',
  phases: [
    { title: 'Read', detail: 'Прочитать материалы заказа' },
    { title: 'Define', detail: 'Сформулировать идеальный результат книги' },
    { title: 'Design', detail: 'Собрать структуру и проверки' },
    { title: 'Review', detail: 'Проверить полноту с разных ролей' },
    { title: 'Package', detail: 'Собрать пакет сдачи для издательства' },
  ],
}

const REQUIREMENTS_SCHEMA = {
  type: 'object',
  properties: {
    requirements: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          source: { type: 'string' },
          requirement: { type: 'string' },
          type: { enum: ['editorial', 'methodical', 'technical', 'repository', 'deliverable'] },
          acceptance: { type: 'string' },
        },
        required: ['source', 'requirement', 'type', 'acceptance'],
      },
    },
  },
  required: ['requirements'],
}

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    notes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          role: { enum: ['editor', 'methodologist', 'technical_reviewer'] },
          concern: { type: 'string' },
          fix: { type: 'string' },
          priority: { enum: ['low', 'medium', 'high'] },
        },
        required: ['role', 'concern', 'fix', 'priority'],
      },
    },
  },
  required: ['notes'],
}

const GAPS_SCHEMA = {
  type: 'object',
  properties: {
    gaps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          missing: { type: 'string' },
          whyItMatters: { type: 'string' },
          proposedAction: { type: 'string' },
        },
        required: ['missing', 'whyItMatters', 'proposedAction'],
      },
    },
  },
  required: ['gaps'],
}

phase('Read')
log('Читаю материалы заказа издательства...')

const extracted = await agent(
  `Прочитай examples/publisher-manual/source-materials.md.

   Вытащи требования издательства, методиста и технического рецензента.
   Для каждого требования укажи источник, тип и критерий приёмки.
   Не придумывай требований, которых нет в материалах.`,
  { label: 'extract-requirements', schema: REQUIREMENTS_SCHEMA }
)

const requirements = extracted?.requirements || []
log(`Найдено требований: ${requirements.length}`)

phase('Define')

const outcome = await agent(
  `На основе требований сформулируй идеальный результат проекта.

   Требования:
   ${JSON.stringify(requirements, null, 2)}

   Нужно описать, какая книга и какие файлы репозитория должны существовать
   к моменту сдачи издательству. Пиши как критерии готовности, а не как процесс.`,
  { label: 'define-outcome' }
)

phase('Design')

const structure = await agent(
  `Спроектируй структуру практического руководства.

   Идеальный результат:
   ${outcome}

   Требования:
   ${JSON.stringify(requirements, null, 2)}

   Верни:
   1. Оглавление книги.
   2. Сквозной сюжет от оффера до готовой книги.
   3. Какие файлы должны появляться в репозитории.
   4. Какие практические задания нужны ученику.
   5. Какие квизы проверяют реальное понимание.`,
  { label: 'design-book' }
)

phase('Review')

const roles = [
  {
    role: 'editor',
    prompt: 'Проверь структуру как выпускающий редактор: ясность сюжета, результат для читателя, отсутствие рекламной интонации.',
  },
  {
    role: 'methodologist',
    prompt: 'Проверь структуру как методист: есть ли цель, действие, ошибка, квиз и критерий понимания в каждой главе.',
  },
  {
    role: 'technical_reviewer',
    prompt: 'Проверь структуру как технический рецензент: верно ли объяснены Claude Code, CLI/Desktop, слеш-команды и работа в GitHub-репозитории.',
  },
]

const reviewResults = (await parallel(
  roles.map(role => () => agent(
    `${role.prompt}

     Идеальный результат:
     ${outcome}

     Структура:
     ${structure}

     Дай замечания и исправления.`,
    { label: `review:${role.role}`, phase: 'Review', schema: REVIEW_SCHEMA }
  ))
)).filter(Boolean)

const gaps = await agent(
  `Проверь полноту проекта.

   Требования:
   ${JSON.stringify(requirements, null, 2)}

   Идеальный результат:
   ${outcome}

   Структура:
   ${structure}

   Замечания ролей:
   ${JSON.stringify(reviewResults, null, 2)}

   Найди, чего не хватает, чтобы книга действительно прошла путь
   от оффера издательства до готовой рукописи.`,
  { label: 'completeness-gaps', phase: 'Review', schema: GAPS_SCHEMA }
)

phase('Package')

const packagePlan = await agent(
  `Собери пакет сдачи для издательства.

   Требования:
   ${JSON.stringify(requirements, null, 2)}

   Идеальный результат:
   ${outcome}

   Структура:
   ${structure}

   Замечания:
   ${JSON.stringify(reviewResults, null, 2)}

   Пробелы:
   ${JSON.stringify(gaps?.gaps || [], null, 2)}

   Формат:
   1. Краткая концепция книги.
   2. Путь главного героя: оффер -> репозиторий -> главы -> проверки -> рукопись.
   3. Структура GitHub-репозитория edu-press/claude-code-textbook-guide.
   4. План глав.
   5. Контрольный список перед сдачей.
   6. Следующие действия автора в Claude Code.`,
  { label: 'delivery-package' }
)

return {
  source: 'examples/publisher-manual/source-materials.md',
  repository: 'edu-press/claude-code-textbook-guide',
  requirementCount: requirements.length,
  requirements,
  outcome,
  structure,
  reviewResults,
  gaps: gaps?.gaps || [],
  packagePlan,
}
