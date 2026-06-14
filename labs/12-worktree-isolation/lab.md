# Lab 12 — Изоляция в Worktree

**Сложность**: ★★★
**Время**: ~60 минут

---

## Цель

Разобраться, когда нужна worktree-изоляция, написать workflow с параллельными мутациями файлов и понять, когда это лишнее.

---

## Концепция: Зачем worktree?

**Проблема**: без изоляции два агента, изменяющие один файл одновременно, вызовут конфликты.

```
Без изоляции:
  Agent A: читает file.js → пишет version A
  Agent B: читает file.js → пишет version B  ← перезаписывает A!
  Результат: потеря изменений Agent A
```

**Решение**: каждый агент получает собственный git worktree (изолированную копию репозитория).

```
С изоляцией:
  Agent A: работает в /tmp/worktree-a/ → коммитит branch-a
  Agent B: работает в /tmp/worktree-b/ → коммитит branch-b
  Merge: объединить branch-a и branch-b
```

---

## Стоимость worktree

**Накладные расходы**: ~200-500ms на создание + дисковое пространство на каждого агента.

```javascript
// НЕ делай это для агентов, которые только читают:
const analysis = await agent('Проанализируй код (без изменений)', {
  isolation: 'worktree'  // ОШИБКА! Читать файлы можно без изоляции
})

// Делай это только когда агент МУТИРУЕТ файлы:
const refactored = await agent('Переименуй все переменные в snake_case', {
  isolation: 'worktree'  // ПРАВИЛЬНО: агент изменяет файлы
})
```

### Правило:
- Read-only агент → НЕТ изоляции
- Агент мутирует файлы В ПАРАЛЛЕЛИ с другими → изоляция
- Агент мутирует файлы ОДИН → НЕТ изоляции (не нужно)

---

## Жизненный цикл worktree-агента

1. Harness создаёт git worktree (новая ветка `agent-XXXX`)
2. Агент работает в изолированной копии
3. Если агент не сделал изменений → worktree удаляется автоматически
4. Если агент сделал изменения → `agent()` возвращает `{ path, branch }`

```javascript
// agent() с isolation возвращает:
// - строку/объект (финальный вывод агента) если нет изменений
// - объект { path: '/tmp/wt-xxx', branch: 'agent-abc123' } если есть изменения

const result = await agent(
  'Рефактори функцию X: используй early returns',
  { isolation: 'worktree', label: 'refactor-fn-x' }
)

// Проверяй был ли результат изменений:
if (result?.branch) {
  console.log(`Изменения на ветке: ${result.branch}`)
  // Дальше: merge, review, или cherry-pick
}
```

---

## Пример: параллельный рефакторинг модулей

```javascript
export const meta = {
  name: 'parallel-refactor',
  description: 'Параллельный рефакторинг изолированных модулей',
  phases: [
    { title: 'Plan', detail: 'Разделить файлы на независимые группы' },
    { title: 'Refactor', detail: 'Параллельный рефакторинг с изоляцией' },
    { title: 'Review', detail: 'Ревью изменений' },
  ],
}

const MODULES = [
  'src/auth/login.js',
  'src/auth/logout.js',
  'src/user/profile.js',
  'src/user/settings.js',
]

// ВАЖНО: модули должны быть НЕЗАВИСИМЫМИ (не импортировать друг друга)
// Иначе изменение в одном сломает другой

phase('Refactor')
const refactored = await parallel(
  MODULES.map(module => () => agent(
    `Рефактори ${module}: 
     1. Замени var на const/let
     2. Используй optional chaining (?.)
     3. Добавь error handling где его нет`,
    {
      isolation: 'worktree',      // каждый агент в своём worktree
      label: `refactor:${module.split('/').pop()}`,
      phase: 'Refactor'
    }
  ))
)

phase('Review')
const changedBranches = refactored
  .filter(Boolean)
  .filter(r => r?.branch)  // только те что реально изменили файлы

log(`Изменены ${changedBranches.length} из ${MODULES.length} модулей`)

// Ревью каждой ветки:
const reviews = await parallel(
  changedBranches.map(r => () => agent(
    `Проверь изменения на ветке ${r.branch}. Нет ли непреднамеренных изменений?`,
    { label: `review:${r.branch}` }
  ))
)

return { changedBranches, reviews: reviews.filter(Boolean) }
```

---

## Когда НЕ использовать worktree

```javascript
// ПЛОХО — изоляция для работы без изменений файлов:
const analysis = await parallel(
  files.map(f => () => agent(`Прочитай и проанализируй ${f}`, {
    isolation: 'worktree'  // каждый файл = 200-500ms overhead + диск!
  }))
)

// ХОРОШО — читать без изоляции:
const analysis = await parallel(
  files.map(f => () => agent(`Прочитай и проанализируй ${f}`))
  // нет isolation → нет overhead
)
```

---

## Ограничения worktree

- Требует git репозитория
- Агенты в разных worktrees не видят изменения друг друга
- После работы: нужно merge/cherry-pick результатов
- Не подходит для файлов с shared state (DB, конфиги с secrets)

---

## Задание

Открой [starter.js](starter.js). Реализуй параллельную миграцию независимых модулей с worktree изоляцией.

---

## Критерии успеха Lab 12

- [x] Написал workflow с `isolation: 'worktree'`
- [x] Знаешь как проверить результат агента (изменял ли файлы)
- [x] Понимаешь когда worktree нужен, а когда — нет
- [x] Знаешь стоимость worktree (~200-500ms + диск)

---

## Следующий шаг

→ [Lab 13: Финальный проект (Capstone)](../13-capstone/lab.md)
