# Lab 13 — Финальный проект (Capstone)

**Сложность**: ★★★★
**Время**: ~3-4 часа

---

## Цель

Собрать все освоенные техники в одном комплексном проекте: построить workflow, готовый к рабочему применению, для всестороннего анализа и улучшения кодовой базы.

---

## Задание

Создай `capstone.js` — workflow, который:

1. **Исследует** кодовую базу (multi-modal sweep)
2. **Анализирует** находки (structured output + adversarial verify)
3. **Приоритизирует** исправления (judge panel)
4. **Предлагает** план рефакторинга (budget-aware)
5. **Мониторит** прогресс (loop-until-dry для накопления)

---

## Требования

### Обязательные техники (все должны быть использованы):
- [x] `meta` блок с ≥4 phases
- [x] `pipeline()` для многостадийной обработки
- [x] `parallel()` где нужен барьер (с обоснованием в комментарии)
- [x] `schema` валидация для ≥3 типов данных
- [x] Adversarial verification (≥3 скептика для критических находок)
- [x] Completeness critic после основного анализа
- [x] Budget-aware масштабирование (`budget.total`)
- [x] `log()` для значимых событий прогресса
- [x] `.filter(Boolean)` после всех `parallel()` вызовов

### Рекомендованные техники:
- [ ] Loop-until-dry для накопления
- [ ] Dedup через `Set` с нормализацией
- [ ] Staged depth (`shallow/medium/deep`)
- [ ] Judge panel для выбора лучшего подхода

---

## Архитектура capstone workflow

```
Phase 1: SCOUT (multi-modal sweep)
├── Агент: file-structure (читает дерево файлов)
├── Агент: pattern-scan (ищет паттерны)
├── Агент: dependency-map (анализирует зависимости)
└── Агент: recent-changes (git log анализ)

Phase 2: FIND (loop-until-dry)
├── Раунд 1: parallel(security-finder, perf-finder, logic-finder, style-finder)
├── Раунд 2: parallel(same finders + "что ещё?")
└── ... до 2 пустых раундов

Phase 3: VERIFY (adversarial + structured)
└── pipeline(findings, finding => parallel(3 skeptics))
    → confirmed = findings where <2 refuted

Phase 4: PRIORITIZE (judge panel + budget-aware)
├── Если budget.total > 200k: полная приоритизация (judge panel)
└── Если budget.total <= 200k: быстрая сортировка по severity

Phase 5: PLAN (completeness critic + synthesis)
├── Completeness critic на всю работу
├── Fill high-priority gaps
└── Финальный план действий
```

---

## Стартовый код

Открой [starter.js](starter.js) — там скелет с TODO-метками.

---

## Критерии оценки

### Минимум:
- Workflow запускается без ошибок
- Все обязательные техники использованы
- Логика корректна (нет бесконечных циклов, null-проверки есть)

### Хорошо:
- + Budget-aware масштабирование работает с разными +Nk директивами
- + Loop-until-dry корректно останавливается
- + Результат содержательный и структурированный

### Отлично:
- + Всё хорошо + оптимальный выбор pipeline vs parallel
- + Worktree изоляция для мутирующих агентов
- + Completeness critic находит реальные пробелы
- + Workflow можно resume (нет Date.now() / Math.random())

---

## Советы

### Начни с малого:
1. Напиши Phase 1 и запусти
2. Добавь Phase 2, снова запусти
3. Итеративно наращивай сложность

### Частые ошибки:
- Забыть `export const meta` в начале
- Использовать TypeScript аннотации (нельзя!)
- Не защищать `while(budget.total && ...)`
- Dedup по `confirmed` вместо `seen`
- Worktree для агентов, которые только читают (дорого и бессмысленно)

### Отладка:
- Используй много `log()` — они показываются в реальном времени
- Начни с маленьким числом агентов, потом масштабируй
- `/workflows` для мониторинга прогресса

---

## Бонус задания (★★★★★)

**1. Resume support**: убедись что workflow работает с `resumeFromRunId`. Не используй `Date.now()`.

**2. Nested workflow**: вынеси adversarial verify в отдельный файл `verify.js` и вызывай через `workflow({ scriptPath })`.

**3. Multi-model**: используй `claude-haiku-4-5-20251001` для быстрых читающих агентов, `claude-opus-4-8` для критических решений. Сравни стоимость.

**4. Full observability**: все `agent()` вызовы с `label`. Финальный вывод содержит статистику: сколько агентов, сколько токенов, сколько подтверждённых находок.

---

## После завершения

1. Покажи capstone.js другу (или Claude) — сможет ли он объяснить что делает каждый блок?
2. Запусти с разными `+Nk` директивами (50k, 200k, 500k) — проверь масштабирование
3. Попробуй прервать и resume через `resumeFromRunId`

**Тренажер пройден — теперь это твоя база.**
