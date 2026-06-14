# Lab 04 — Динамические Workflow

**Сложность**: ★★☆
**Время**: ~75 минут

---

## Цель

Разобраться с динамическими workflow, освоить `/loop` с самостоятельным темпом и реализовать паттерны loop-until-dry и loop-until-budget.

---

## Концепция: Что делает workflow "динамическим"?

Обычный workflow: фиксированный набор агентов, предсказуемый объём работы.

Динамический использует `ScheduleWakeup` или `/loop`, чтобы:
- Продолжать работу между сессиями
- Самостоятельно управлять темпом
- Итеративно накапливать результаты (loop-until-dry)
- Масштабироваться к бюджету токенов

---

## ScheduleWakeup — пробудить себя позже

`ScheduleWakeup` — инструмент для планирования повторных вызовов. Используется через `/loop`:

```bash
# /loop без интервала = модель сама выбирает темп
/loop "Проверяй статус CI каждые 3 минуты"

# /loop с интервалом
/loop 5m "Мониторь деплой"
```

### Как работает self-pacing:

```
Пользователь: /loop "Мой промпт"
    ↓
Claude работает, вызывает ScheduleWakeup(delaySeconds=270, prompt="Мой промпт")
    ↓
Через 270 секунд: автоматический повтор с тем же промптом
    ↓
Claude работает снова, снова вызывает ScheduleWakeup...
    ↓
Продолжается пока Claude не перестаёт вызывать ScheduleWakeup
```

### Правила выбора delaySeconds:

| Ситуация | Задержка |
|----------|---------|
| Под 5 минут (60-270s) | Кэш тёплый. Для активного поллинга. |
| 5min+ (300s+) | Промах кэша. Для редких событий. |
| Простой, нет сигнала | 1200-1800s (20-30 мин) |
| **Никогда** | 300s — самый дорогой (промах кэша без амортизации) |

```javascript
// В обычном разговоре (не в workflow):
// Вызывается напрямую как инструмент
ScheduleWakeup({
  delaySeconds: 270,  // 4.5 минуты — кэш тёплый
  reason: 'поллинг CI статуса пока не завершится',
  prompt: '<<autonomous-loop-dynamic>>'  // сентинел для /loop без промпта
})
```

---

## Паттерн 1: Loop-Until-Dry

Продолжать находить пока нет K пустых раундов подряд.

```javascript
export const meta = {
  name: 'loop-until-dry',
  description: 'Накопление результатов до исчерпания',
  phases: [{ title: 'Find' }],
}

const FINDERS = ['angle-alpha', 'angle-beta', 'angle-gamma']
const seen = new Set()
const confirmed = []
let dry = 0

while (dry < 2) {  // 2 пустых раунда подряд = останавливаемся
  phase('Find')
  
  const found = (await parallel(
    FINDERS.map(f => () => agent(`Найди новые баги через призму "${f}"`, {
      label: `find:${f}`,
      phase: 'Find',
      schema: { type: 'object', properties: { bugs: { type: 'array', items: { type: 'string' }}}, required: ['bugs'] }
    }))
  )).filter(Boolean).flatMap(r => r.bugs)
  
  const fresh = found.filter(b => !seen.has(b))
  
  if (!fresh.length) {
    dry++
    log(`Раунд пустой. dry=${dry}/2`)
    continue
  }
  
  dry = 0  // сбросить счётчик при новых находках
  fresh.forEach(b => seen.add(b))
  confirmed.push(...fresh)
  log(`Найдено: ${fresh.length} новых. Всего: ${confirmed.length}`)
}

log(`Итого: ${confirmed.length} уникальных багов найдено`)
return confirmed
```

**Важно**: дедуп по `seen`, не по `confirmed`. Иначе отклонённые находки снова появятся в следующем раунде и цикл не сойдётся.

---

## Паттерн 2: Loop-Until-Budget

Глубина поиска масштабируется к директиве пользователя `+Nk`.

```javascript
export const meta = {
  name: 'budget-aware-finder',
  description: 'Поиск с масштабированием к бюджету',
  phases: [{ title: 'Find' }],
}

const bugs = []

// Обязательно: проверяй budget.total прежде чем входить в цикл
// Без директивы +Nk: budget.total = null, budget.remaining() = Infinity
// Цикл с Infinity remaining() дойдёт до лимита 1000 агентов!
while (budget.total && budget.remaining() > 50_000) {
  const result = await agent(
    'Найди ещё баги в кодовой базе',
    { schema: { type: 'object', properties: { bugs: { type: 'array', items: { type: 'string' }}}, required: ['bugs'] } }
  )
  bugs.push(...(result?.bugs || []))
  log(`${bugs.length} найдено, ${Math.round(budget.remaining() / 1000)}k токенов осталось`)
}

return bugs
```

---

## Паттерн 3: Workflow() — вложенные workflow

```javascript
export const meta = {
  name: 'parent-workflow',
  description: 'Оркестрирует дочерние workflow',
}

// Запустить сохранённый workflow по имени:
const research = await workflow('deep-research', { topic: 'quantum computing' })

// Запустить workflow по пути:
const analysis = await workflow({ scriptPath: 'solutions/06-adversarial-verification.js' }, research)

// Ограничения:
// - Только 1 уровень вложения (child не может вызвать workflow())
// - Дочерний workflow разделяет тот же бюджет
// - Дочерний workflow разделяет лимит конкурентности
```

---

## Задание

Открой [starter.js](starter.js). Реализуй loop-until-dry workflow для накопления фактов о теме.

---

## Подсказки

**Q: Workflow завис в цикле?**
A: Проверь условие выхода. Добавь `log()` чтобы видеть состояние. Используй TaskStop в Claude Code для остановки.

**Q: Как остановить /loop?**
A: Просто прерви — Claude перестаёт вызывать ScheduleWakeup. Или явно скажи "стоп".

**Q: Почему budget.total проверять, а не budget.remaining()?**
A: Потому что без +Nk директивы `remaining()` = Infinity → бесконечный цикл до упора в лимит 1000 агентов.

---

## Критерии успеха Lab 04

- [x] Реализовал loop-until-dry паттерн корректно
- [x] Понимаешь разницу между дедупом по seen и по confirmed
- [x] Знаешь правила выбора delaySeconds
- [x] Понимаешь зачем guard `budget.total` перед циклом

---

## Следующий шаг

→ [Lab 05: Структурированный вывод](../05-structured-output/lab.md)
