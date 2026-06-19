# Lab 01 — Мастерство CLI

**Сложность**: ★☆☆
**Время**: ~45 минут

---

## Цель

Настроить окружение для этого курса и выработать мышечную память на ключевые инструменты CLI: settings.json, CLAUDE.md, slash-команды, permissions.

---

## Задание 1: Создай CLAUDE.md для курса

Запусти Claude Code в папке `ClaudeCodeManual/` и попроси создать `CLAUDE.md`:

```
Создай CLAUDE.md для этого проекта. Включи:
- что все .js файлы в labs/, project/, solutions/ — это Workflow-скрипты, не Node.js модули
- запрет на запуск их через node
- что язык проекта — русский
- что при изменении web/content.js нужно повысить ?v=N в web/index.html
```

**Проверь результат**: открой созданный файл. Убедись, что в нём нет общих шаблонных фраз — только конкретные правила для этого проекта.

**Критерий**: CLAUDE.md существует, содержит запрет `node` для Workflow-скриптов, упоминает кэш-бастер.

---

## Задание 2: Настрой permissions для курса

Создай `.claude/settings.json` (или отредактируй существующий) с разрешениями, которые нужны для работы с курсом:

```json
{
  "permissions": {
    "allow": [
      "Read(**)",
      "Write(labs/**)",
      "Write(project/**)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)"
    ],
    "deny": [
      "Bash(node *)",
      "Bash(rm -rf *)"
    ]
  }
}
```

Затем проверь, что запрет работает. Скажи Claude:
```
Запусти labs/02-workflow-fundamentals/starter.js через node
```

**Ожидаемый результат**: Claude откажется или попросит подтверждения, потому что `Bash(node *)` в deny-списке.

---

## Задание 3: Практика slash-команд

Выполни каждое из следующих в Claude Code и запиши, что увидел:

**3.1** — Узнай сколько токенов уже потрачено:
```
/cost
```

**3.2** — Проверь, какие файлы памяти активны:
```
/memory
```

**3.3** — Используй compact перед длинной работой:
```
/compact
```
Обрати внимание: Claude Code сжимает историю и сообщает, что сохранено.

**3.4** — Сбрось контекст полностью:
```
/clear
```

**Критерий**: понимаешь разницу между `/compact` (сжать, сохранить суть) и `/clear` (сбросить всё).

---

## Задание 4: Non-interactive режим для анализа файла

Workflow-скрипты можно "проверять" через non-interactive режим Claude Code. Попробуй:

```bash
cat labs/02-workflow-fundamentals/starter.js | claude -p "Найди нарушения правил Workflow-скриптов: используется ли Date.now(), Math.random(), или node-специфичные import? Ответь кратко."
```

Это полезно для быстрой проверки скриптов без открытия полного интерфейса.

**Критерий**: получил осмысленный ответ от Claude через pipe.

---

## Задание 5★ (бонус): Хук для курса

Создай в `.claude/settings.json` хук, который при каждом изменении `web/content.js` напоминает поднять версию кэша:

```json
{
  "hooks": {
    "PostToolCall": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "if echo \"$CLAUDE_TOOL_INPUT\" | grep -q 'web/content.js'; then echo 'НАПОМИНАНИЕ: подними ?v=N в web/index.html'; fi"
          }
        ]
      }
    ]
  }
}
```

---

## Справочник

### Режимы запуска

```bash
claude                         # интерактивный (REPL)
claude -p "вопрос"             # одиночный промпт
cat file.js | claude -p "..."  # pipe (stdin)
claude --continue              # продолжить последнюю сессию
```

### Иерархия settings.json

```
~/.claude/settings.json        ← глобальный (все проекты)
.claude/settings.json          ← проектный (перекрывает глобальный)
.claude/settings.local.json    ← локальный (в .gitignore)
```

### Иерархия CLAUDE.md

```
~/CLAUDE.md                    ← глобальный
[parent]/CLAUDE.md             ← промежуточные
./CLAUDE.md                    ← текущий проект (самый специфичный)
```

---

## Критерии успеха

- [ ] CLAUDE.md существует и содержит конкретные правила курса (не шаблон)
- [ ] `.claude/settings.json` настроен, `node *` в deny
- [ ] Проверил, что deny работает
- [ ] Попробовал `/compact`, `/cost`, `/memory`
- [ ] Выполнил pipe-команду с анализом файла
- [ ] Понимаешь разницу `/compact` vs `/clear`

---

## Следующий шаг

→ [Lab 02: Основы Workflow](../02-workflow-fundamentals/lab.md)
