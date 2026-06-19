# Шаблоны для продвижения курса

*Использовать после пуша и включения Discussions*

---

## Telegram — короткий пост (AI-каналы, 280 символов)

```
📚 Бесплатный русскоязычный курс по Claude Code Workflow

15 глав + 14 лабов. Интерактивный тренажёр в браузере.
Тема: многоагентная оркестрация — как заставить 10+ агентов работать параллельно, верифицировать результаты и не терять прогресс при падении.

→ https://nickscherbakov.github.io/ClaudeCodeManual/
→ https://github.com/NickScherbakov/ClaudeCodeManual

⭐ Звезда не обязательна, но помогает
```

---

## Telegram — развёрнутый пост (developer-чаты)

```
Собрал бесплатный курс по продвинутым техникам Claude Code — специально для русскоязычной аудитории.

**Что внутри:**
• Workflow tool: как организовать несколько агентов в повторяемый процесс
• pipeline() vs parallel() — когда что, с примерами
• loop-until-dry: поиск, который не останавливается, пока не иссякнет
• Адверсариальная верификация: агент-скептик проверяет результаты
• Управление бюджетом токенов

**Формат:**
• 15 интерактивных глав (тренажёр открывается в браузере, прогресс сохраняется)
• 14 практических лабораторий с нарастающей сложностью
• Реальные примеры workflow-скриптов

**Подход:** курс начинает не с инструмента, а с конечного состояния. "Что должно существовать, когда работа закончена?" — и только потом декомпозиция и агенты.

Тренажёр: https://nickscherbakov.github.io/ClaudeCodeManual/
GitHub: https://github.com/NickScherbakov/ClaudeCodeManual

Если полезно — звезда на GitHub очень поможет.
```

---

## Habr — заголовок и тэги

**Заголовок:** `Claude Code Workflow: как устроена многоагентная оркестрация и где люди чаще всего ошибаются`

**Тэги:** `claude`, `ai`, `workflow`, `многоагентность`, `llm`, `claude-code`, `tutorial`

**Черновик статьи:** `HABR_ARTICLE_DRAFT.md` в этом репозитории.

---

## Reddit r/ClaudeAI — English post

```
**I built a free Russian-language course on Claude Code's Workflow tool (15 chapters + 14 labs)**

Most Claude Code tutorials stop at "write a prompt." This course is about what comes next: the Workflow tool — Claude Code's built-in multi-agent orchestrator.

What you can do with it that a single prompt can't:
- Run 10+ agents in parallel across a 300-file codebase
- Verify each finding with an independent skeptic agent (adversarial verify)
- Resume from the exact point of failure without re-running completed work
- Scale analysis depth to your token budget

The course is designed for Russian-speaking learners, but the code examples and Workflow scripts are language-agnostic.

Interactive trainer (browser, no install): https://nickscherbakov.github.io/ClaudeCodeManual/
GitHub (source + labs + reference solutions): https://github.com/NickScherbakov/ClaudeCodeManual

A ⭐ on GitHub helps more people find it.
```

---

## GitHub Release Notes (v1.0)

```markdown
## Claude Code: Продвинутые техники — v1.0

Первый стабильный выпуск курса.

### Что включено
- 15 интерактивных глав в веб-тренажёре
- 14 практических лабораторий
- 3 эталонных решения для лабов 02, 03, 06
- Реальные Workflow-скрипты в `project/`
- Шпаргалки по Workflow API, паттернам, типам агентов

### Запуск
Откройте https://nickscherbakov.github.io/ClaudeCodeManual/ или клонируйте и откройте `web/index.html`.

### Требования
Claude Code с доступом к Opus 4.8. Workflow-скрипты запускаются только внутри Claude Code.
```

---

## Каналы для публикации (по приоритету)

1. **Habr** — статья (HABR_ARTICLE_DRAFT.md готов, адаптировать под аккаунт)
2. **@claude_ai_ru** или аналогичные Telegram-каналы об AI
3. **@ai_machinelearning_big_data** (крупный RU AI-канал)
4. **GitHub Discussions** — пост-анонс в своём же репозитории
5. **Reddit r/ClaudeAI** — английская версия поста
6. **Twitter/X** — тред с ключевыми идеями курса
