# Lab 08 — Хуки и автоматизация

**Сложность**: ★★★
**Время**: ~75 минут

---

## Цель

Разобраться с системой хуков Claude Code: настроить автоматические действия на разные события и понять, чем хуки отличаются от инструкций Claude.

---

## Концепция: Что такое хуки?

Хуки — shell-команды, которые harness выполняет автоматически в ответ на события. Не путай их с инструкциями Claude:

| | Хуки | Инструкции Claude |
|---|---|---|
| Выполняет | Harness (внешний процесс) | Claude (LLM) |
| Гарантия | Всегда выполняется | Может забыть |
| Мощность | Shell-команды, скрипты | Любые AI-действия |
| Применение | "Перед X делать Y" | "Когда A, делай B" |

**Правило**: если нужно "КАЖДЫЙ РАЗ при X" — хук. Если нужно "ИНОГДА при X" — инструкция.

---

## Типы хуков

### 1. UserPromptSubmit
Запускается **до** отправки промпта Claude. Может модифицировать промпт или добавлять контекст.

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "echo '[Context: $(date)]'"
          }
        ]
      }
    ]
  }
}
```

**Вывод хука инжектируется** в начало промпта как системный контекст.

### 2. Stop
Запускается когда Claude завершил ответ. Используется для проверки условий и постобработки.

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "node check-goal.js"
          }
        ]
      }
    ]
  }
}
```

### 3. PreToolCall
Запускается **перед** вызовом инструмента. Может **заблокировать** вызов (exit code ≠ 0).

```json
{
  "hooks": {
    "PreToolCall": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node validate-bash.js \"$CLAUDE_TOOL_INPUT\""
          }
        ]
      }
    ]
  }
}
```

### 4. PostToolCall
Запускается **после** вызова инструмента. Получает результат.

```json
{
  "hooks": {
    "PostToolCall": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node log-file-changes.js"
          }
        ]
      }
    ]
  }
}
```

---

## Структура конфигурации хуков

```json
// .claude/settings.json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "строка-regex",
        "hooks": [
          {
            "type": "command",
            "command": "shell-команда",
            "timeout": 10000
          }
        ]
      }
    ]
  }
}
```

- `matcher`: regex для фильтрации (по содержимому промпта или названию инструмента)
- `command`: shell-команда (PowerShell/bash)
- `timeout`: таймаут в мс (по умолчанию: 10000)

---

## Переменные окружения в хуках

Хуки получают контекст через env-переменные:

| Переменная | Описание |
|-----------|---------|
| `$CLAUDE_PROMPT` | Полный текст промпта пользователя |
| `$CLAUDE_TOOL_NAME` | Имя вызываемого инструмента |
| `$CLAUDE_TOOL_INPUT` | JSON входные данные инструмента |
| `$CLAUDE_TOOL_OUTPUT` | JSON выходные данные (PostToolCall) |
| `$CLAUDE_SESSION_ID` | ID текущей сессии |

---

## Практические примеры

### Пример 1: Добавить текущую дату к промпту
```json
{
  "UserPromptSubmit": [{
    "matcher": ".*",
    "hooks": [{
      "type": "command",
      "command": "echo \"Current date: $(date '+%Y-%m-%d %H:%M').\""
    }]
  }]
}
```

### Пример 2: Запретить rm -rf
```json
{
  "PreToolCall": [{
    "matcher": "Bash",
    "hooks": [{
      "type": "command",
      "command": "echo \"$CLAUDE_TOOL_INPUT\" | grep -q 'rm -rf' && exit 1 || exit 0"
    }]
  }]
}
```

### Пример 3: Логировать все изменения файлов
```json
{
  "PostToolCall": [{
    "matcher": "Write|Edit",
    "hooks": [{
      "type": "command",
      "command": "echo \"$(date): $CLAUDE_TOOL_NAME - $CLAUDE_TOOL_INPUT\" >> changes.log"
    }]
  }]
}
```

### Пример 4: /goal — Stop hook для проверки цели
```json
{
  "Stop": [{
    "matcher": ".*",
    "hooks": [{
      "type": "command",
      "command": "node .claude/check-goal.js"
    }]
  }]
}
```

---

## Задания

### Задание 8.1: Хук даты
Добавь в `.claude/settings.json` UserPromptSubmit хук, который добавляет текущую дату и время к каждому промпту. Проверь что Claude видит эту информацию.

### Задание 8.2: Защита от опасных команд
Создай PreToolCall хук для Bash, который блокирует выполнение если команда содержит `rm -rf`. Протестируй: попроси Claude выполнить `rm -rf /tmp/test`.

### Задание 8.3: Лог изменений
Создай PostToolCall хук, который логирует все вызовы Write/Edit в файл `changes.log` с временной меткой.

### Задание 8.4: Автоматический lint
Создай PostToolCall хук для инструмента Write, который запускает `echo "File written: $CLAUDE_TOOL_INPUT"` (симуляция lint).

---

## Шаблон settings.json для этого проекта

Создай `.claude/settings.json` в директории тренажера:

```json
{
  "model": "claude-opus-4-8",
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "echo \"[Training session. Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm')]\""
          }
        ]
      }
    ],
    "PostToolCall": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "echo \"File modified\" >> changes.log"
          }
        ]
      }
    ]
  }
}
```

---

## Критерии успеха Lab 08

- [x] Добавил минимум 2 разных хука в settings.json
- [x] Хуки реально срабатывают (проверил на практике)
- [x] Понимаешь разницу хуки vs инструкции Claude
- [x] Знаешь как PreToolCall может заблокировать действие

---

## Следующий шаг

→ [Lab 09: Система памяти](../09-memory-system/lab.md)
