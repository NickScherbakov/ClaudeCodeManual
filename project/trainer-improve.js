// project/trainer-improve.js — агентная система улучшения тренажёра Claude Code.
//
// Спроектирована ОТ ЦЕЛИ (методика 4 узлов, Глава 0):
//   Узел 1 ЦЕЛЬ:     существует выверенный список улучшений тренажёра (web/ + labs/),
//                    каждое — с локацией, проблемой, конкретной правкой и обоснованием
//                    через педагогический/языковой/технический принцип.
//   Узел 2 ЗАДАЧИ:   A ревью по 4 измерениям → B дедуп → C состязательная проверка
//                    разными призмами → D критик полноты → E синтез.
//   Узел 3 ПРОЦЕССЫ: A parallel (барьер нужен — дедуп требует все находки сразу)
//                    → B код → C parallel по находкам (3 призмы) → D agent → E код.
//   Узел 4 РЕСУРСЫ:  4 ревьюера со схемой + 3 призмы-скептика на находку + 1 критик.
//
// Запуск: "Запусти project/trainer-improve.js как workflow"

export const meta = {
  name: 'trainer-improve',
  description: 'Аудит и улучшение тренажёра Claude Code: методика, педагогика, академический русский, функциональность',
  phases: [
    { title: 'Review',     detail: '4 измерения: методика | педагогика | язык | функциональность' },
    { title: 'Verify',     detail: 'Состязательная проверка каждой находки тремя призмами' },
    { title: 'Complete',   detail: 'Критик полноты: какой класс проблем пропущен' },
  ],
}

// ── Схемы ────────────────────────────────────────────────────────────────────
const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          dimension:   { enum: ['methodology', 'pedagogy', 'language', 'functionality'] },
          severity:    { enum: ['low', 'medium', 'high'] },
          file:        { type: 'string', description: 'Путь к файлу, напр. web/content.js' },
          location:    { type: 'string', description: 'Якорь: id главы, заголовок или короткая цитата' },
          issue:       { type: 'string', description: 'Что именно не так' },
          proposedFix: { type: 'string', description: 'Конкретная правка. Для текста — точные «было → стало».' },
          rationale:   { type: 'string', description: 'Почему лучше: какой педагогический/языковой/технический принцип' },
        },
        required: ['dimension', 'severity', 'file', 'location', 'issue', 'proposedFix', 'rationale'],
      },
    },
  },
  required: ['findings'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    refuted: { type: 'boolean', description: 'true, если находка ложная ИЛИ правка ухудшает/искажает смысл' },
    reason:  { type: 'string' },
  },
  required: ['refuted', 'reason'],
}

const GAPS_SCHEMA = {
  type: 'object',
  properties: {
    gaps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          aspect:   { type: 'string', description: 'Класс проблем, который не проверяли' },
          reason:   { type: 'string' },
          priority: { enum: ['low', 'medium', 'high'] },
        },
        required: ['aspect', 'reason', 'priority'],
      },
    },
  },
  required: ['gaps'],
}

// ── Общий контекст для ревьюеров ─────────────────────────────────────────────
const SCOPE = `
Тренажёр Claude Code (продвинутые техники, Opus 4.8). Аудитория — НЕ программисты,
решающие личные/деловые задачи. Язык контента — русский.

Файлы под ревью (прочитай нужные сам):
- web/content.js — ГЛАВНЫЙ учебный текст: массив CHAPTERS (15 глав: intro, ch0..ch12, capstone),
  у каждой главы body (markdown), часть с quiz и widget. Также массив CHEATSHEETS.
- web/app.js, web/index.html — SPA тренажёра (рендер, навигация, виджеты conceptWizard и parallelAnimator, localStorage).
- labs/00..13/lab.md — лабораторные задания (та же 12-главная дуга, что и в web).

Сквозная методика курса — «от цели» (4 узла): Цель (конечное состояние) →
Декомпозиция (задачи вход→выход) → Процессы (связь во времени) → Ресурсы (решатели). Ресурсы — последними.

Возвращай ТОЛЬКО реальные, конкретные находки с применимой правкой. Не выдумывай проблемы ради объёма.
Не предлагай переписать то, что и так корректно и понятно. Не трогай код примеров, имена функций, термины API.`

// ── Узел 2/A — ревью по 4 измерениям (барьер: дальше дедуп всех находок) ──────
phase('Review')
log('Запускаю 4 ревьюера: методика, педагогика, язык, функциональность...')

const REVIEWERS = [
  {
    key: 'methodology',
    prompt: `Ты — рецензент ТЕХНИЧЕСКОЙ КОРРЕКТНОСТИ и МЕТОДИКИ.
${SCOPE}

Проверь ТОЛЬКО:
1. Технические утверждения о Workflow API — верны ли они? Эталон:
   - parallel() не бросает исключение, возвращает null на месте сбоя → нужен .filter(Boolean).
   - pipeline() — поток без барьера; барьер parallel оправдан только при перекрёстной зависимости (дедуп, ранний выход).
   - meta — чистый литерал (для resume); phases.title совпадают с phase('...').
   - schema → авто-повтор при несовпадении; budget.total=null → remaining()=Infinity (нужен guard budget.total).
   - adversarial verify: refuted=true по умолчанию; seen, а не collected, для дедупа в loop-until-dry.
   - worktree: ~200-500мс + диск, только при параллельных мутациях файлов.
2. Методику «от цели» (4 узла) — изложена ли последовательно и без противоречий; не путается ли порядок узлов; не предлагается ли где-то input-first.
3. Любые фактически неверные или вводящие в заблуждение формулировки.

Игнорируй стиль языка и педагогику — это другие рецензенты. Дай находки по схеме.`,
  },
  {
    key: 'pedagogy',
    prompt: `Ты — рецензент ПЕДАГОГИКИ (лучшие практики обучения).
${SCOPE}

Оценивай по признанным принципам:
- Когнитивная нагрузка (Sweller): нет ли перегруза в одной главе; уместно ли постепенное раскрытие.
- Worked examples и concrete-before-abstract (Mayer): идёт ли конкретный пример прежде абстракции.
- Problem-first: каждая глава должна открываться реальной проблемой, потом решение.
- Retrieval practice: качество мини-квизов — проверяют ли понимание, а не память; не подсказывают ли дистракторы.
- Scaffolding и прогрессия сложности между главами; явные учебные цели.
- Формирующая обратная связь (объяснения «почему» в квизах).
- Перенос на свою задачу (Глава 0, сквозной пример).

Находи: пропущенный пример, абстракцию без опоры, неясный переход, слабый квиз, отсутствие резюме,
скачок сложности, цель без проверки усвоения. Для каждой — конкретная правка. Игнорируй технику и язык.`,
  },
  {
    key: 'language',
    prompt: `Ты — рецензент РУССКОГО ЯЗЫКА по нормам академического/научно-учебного стиля
(ориентир — качественная русская учебная проза и справочники по стилистике, напр. Розенталь).
${SCOPE}

Проверь прозу глав (не код!) на соответствие академическому образцу:
- Канцелярит и отглагольные нагромождения («является», «осуществляется», «производится обработка»).
- Кальки с английского в прозе («против» как vs, «в конце дня»), смешение латиницы там, где есть русский термин.
- Точность и однозначность формулировок; отсутствие воды и штампов («важно отметить», «по сути»).
- Единство терминологии; согласование; читаемость длинных предложений.
- Регистр: строгий, но ясный; обращение на «ты» сохраняется (так в курсе).
НЕ трогай: код, имена функций/файлов, доменные термины (workflow, pipeline, schema, worktree),
осознанные повторы-«рёбра» (одинаковые подзаголовки глав). Для каждой находки — точные «было → стало».`,
  },
  {
    key: 'functionality',
    prompt: `Ты — рецензент ФУНКЦИОНАЛЬНОСТИ и ПОНЯТНОСТИ интерфейса тренажёра.
${SCOPE}

Прочитай web/app.js, web/index.html, web/content.js (как связаны виджеты).
Проверь:
- Корректность рендера и навигации (главы, прогресс, cheatsheets, hashchange).
- Виджеты: conceptWizard (мастер Главы 0) и parallelAnimator — работают ли логически, нет ли багов.
- Соответствие данных и кода: каждая глава с widget имеет монтирование; quiz рендерится корректно.
- Понятность UX: подписи кнопок, обратная связь, доступность; ничего не вводит в заблуждение.
- Несоответствия (напр. прогресс «N / 15», а глав другое число; битые якоря).
Дай находки с конкретной правкой кода/разметки. Игнорируй стиль прозы и педагогику.`,
  },
]

const reviewResults = await parallel(
  REVIEWERS.map(r => () => agent(r.prompt, {
    label: `review:${r.key}`,
    phase: 'Review',
    schema: FINDINGS_SCHEMA,
  }))
)

// Барьер оправдан: дедуп требует ВСЕ находки одновременно.
const allFindings = reviewResults
  .filter(Boolean)
  .flatMap(r => r.findings || [])

const seen = new Set()
const deduped = allFindings.filter(f => {
  const key = `${f.file}:${f.dimension}:${String(f.location).toLowerCase().slice(0, 50)}:${String(f.issue).toLowerCase().slice(0, 60)}`
  if (seen.has(key)) return false
  seen.add(key)
  return true
})

log(`Находок: ${allFindings.length} всего, ${deduped.length} уникальных.`)

// Ограничиваем верификацию: high+medium всегда, low — только если их немного.
// Без тихого усечения — логируем, что отложили.
const order = { high: 0, medium: 1, low: 2 }
const sortedF = [...deduped].sort((a, b) => order[a.severity] - order[b.severity])
const CAP = 30
const toVerify = sortedF.slice(0, CAP)
if (sortedF.length > CAP) {
  log(`ВНИМАНИЕ: к верификации взято ${CAP} из ${sortedF.length} (по severity). Отложено: ${sortedF.length - CAP}.`)
}

// ── Узел 2/C — состязательная проверка: 3 разные призмы на находку ────────────
phase('Verify')
log(`Верифицирую ${toVerify.length} находок (3 призмы каждая)...`)

const LENSES = [
  { key: 'accuracy',  ask: 'Точна ли находка по сути? Не ложная ли проблема? Технически/фактически верна?' },
  { key: 'pedagogy',  ask: 'Действительно ли правка улучшает обучение по признанным педагогическим принципам, а не вкусовщина?' },
  { key: 'meaning',   ask: 'Сохраняет ли правка исходный смысл и не вводит ли стилистических/языковых ошибок? Соответствует ли академическому русскому?' },
]

const verified = await pipeline(
  toVerify,
  finding =>
    parallel(LENSES.map(lens => () =>
      agent(
        `Ты — независимый скептик, призма «${lens.key}». Твоя задача — ОПРОВЕРГНУТЬ предложенное улучшение.
         ${lens.ask}

         Файл: ${finding.file}
         Локация: ${finding.location}
         Измерение: ${finding.dimension} | severity: ${finding.severity}
         Проблема: ${finding.issue}
         Предложенная правка: ${finding.proposedFix}
         Обоснование автора: ${finding.rationale}

         При необходимости прочитай файл, чтобы проверить контекст.
         По умолчанию refuted=true, если есть обоснованное сомнение. Опровергай конкретно.`,
        { schema: VERDICT_SCHEMA, label: `verify:${finding.dimension}:${lens.key}`, phase: 'Verify' }
      )
    )).then(votes => {
      const valid = votes.filter(Boolean)
      const notRefuted = valid.filter(v => !v.refuted).length
      // Выживает, если большинство призм НЕ опровергли (>=2 из 3).
      return { ...finding, survives: notRefuted >= 2, notRefuted, votes: valid.length, lensReasons: valid.map(v => v.reason) }
    })
)

const confirmed = verified.filter(Boolean).filter(f => f.survives)
log(`Подтверждено: ${confirmed.length} из ${toVerify.length}.`)

// ── Узел 2/D — критик полноты ────────────────────────────────────────────────
phase('Complete')
const critique = await agent(
  `Мы проверили тренажёр по измерениям: methodology, pedagogy, language, functionality.
   Подтверждено ${confirmed.length} улучшений.
   Краткий список подтверждённого:
   ${confirmed.map((f, i) => `${i + 1}. [${f.dimension}/${f.severity}] ${f.file} — ${f.issue}`).join('\n')}

   Какой ЦЕЛЫЙ КЛАСС проблем тренажёра мы могли не проверить вовсе?
   Думай о: доступность (a11y), мобильная вёрстка, согласованность web↔labs, мотивация и удержание,
   проверка предзнаний, обработка ошибок в виджетах, ясность учебных целей. Только реальные пробелы.`,
  { schema: GAPS_SCHEMA, label: 'completeness-critic', phase: 'Complete' }
)

// Подсчёт по измерениям и severity
const byDim = {}
const bySev = { high: 0, medium: 0, low: 0 }
for (const f of confirmed) {
  byDim[f.dimension] = (byDim[f.dimension] || 0) + 1
  if (bySev[f.severity] !== undefined) bySev[f.severity]++
}

log(`Итог: ${confirmed.length} улучшений — high:${bySev.high} medium:${bySev.medium} low:${bySev.low}. Пробелов от критика: ${critique.gaps.length}.`)

// Узел 1 — цель: существует выверенный список улучшений с правками и обоснованием.
return {
  summary: { total: deduped.length, verified: toVerify.length, confirmed: confirmed.length, byDimension: byDim, bySeverity: bySev },
  improvements: confirmed.map(f => ({
    dimension: f.dimension, severity: f.severity, file: f.file, location: f.location,
    issue: f.issue, proposedFix: f.proposedFix, rationale: f.rationale, lensReasons: f.lensReasons,
  })),
  gaps: critique.gaps,
}
