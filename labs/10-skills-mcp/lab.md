# Lab 10 — Скиллы и MCP

**Сложность**: ★★★
**Время**: ~60 минут

---

## Цель

Разобраться, как работают Skills (slash-команды), научиться пользоваться ToolSearch для deferred tools и подключать MCP серверы.

---

## Часть 1: Skills (Slash-команды)

### Что такое Skills?

Skills — переиспользуемые инструкции, которые вызываются через `/skill-name`. Хранятся как markdown-файлы в директории плагинов.

```
~/.claude/plugins/[plugin-name]/skills/[skill-name]/SKILL.md
```

### Как вызываются Skills:

1. Пользователь пишет `/skill-name arg1 arg2`
2. Harness находит skill файл
3. Содержимое инжектируется как `<command-message>` в контекст
4. Claude следует инструкциям skill файла

### Структура skill файла:

```markdown
# Skill: code-review

Ты сейчас выполняешь code review. Следуй этим инструкциям:

## Когда вызывать
Когда пользователь просит review diff или PR.

## Процедура
1. Прочитай изменения: `git diff HEAD~1`
2. Проверь по измерениям: correctness, security, performance, readability
3. Для каждой проблемы: `path:line: 🔴 CRITICAL: описание. Исправление.`
4. Не комментируй форматирование если оно не меняет смысл

## Формат вывода
path:line: <emoji> <severity>: <проблема>. <исправление>.
```

### Встроенные skills в этом тренажере:

Посмотри какие skills доступны:
```
/help
```
Ищи раздел "available skills" в system-reminder.

---

## Часть 2: ToolSearch — Deferred Tools

### Проблема отложенных инструментов

Некоторые инструменты откладываются (deferred) для экономии контекста. Их схемы не загружены — прямой вызов сломается с `InputValidationError`.

Список отложенных инструментов появляется в `<system-reminder>`:
```
The following deferred tools are now available via ToolSearch:
CronCreate, CronDelete, CronList, WebFetch, WebSearch...
```

### Как использовать deferred tools:

**Шаг 1**: Загрузить схему через ToolSearch:
```
Попроси Claude: "Загрузи схему инструмента WebSearch"
```
Или Claude сам вызывает ToolSearch когда нужен конкретный инструмент.

**Форматы запроса ToolSearch**:
```
"select:WebSearch,WebFetch"    — конкретные инструменты
"web search"                   — поиск по ключевым словам
"+slack send"                  — обязательно "slack" в имени
```

### Пример использования:

```
Пользователь: "Поищи последние новости о Claude 4"

Claude → ToolSearch("select:WebSearch")  → получает schema
Claude → WebSearch("Claude 4 latest news")  → результаты
Claude → отвечает на основе результатов
```

---

## Часть 3: MCP (Model Context Protocol) Серверы

### Что такое MCP?

MCP — протокол для подключения внешних сервисов к Claude. Каждый MCP-сервер предоставляет набор инструментов.

### Как настроить MCP сервер:

```json
// ~/.claude/settings.json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/path/to/mcp-server.js"],
      "env": {
        "API_KEY": "your-key"
      }
    }
  }
}
```

### Встроенные MCP серверы (пример):

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/allowed/path"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "ghp_..." }
    }
  }
}
```

### Как MCP инструменты появляются в контексте:

MCP инструменты появляются как deferred tools в `<system-reminder>` с префиксом `mcp__`:
```
mcp__claude_ai_Gmail__authenticate
mcp__claude_ai_Google_Calendar__authenticate
```

Загружаются через ToolSearch как обычные deferred tools.

---

## Практические задания

### Задание 10.1: Изучи доступные skills
```
Задай Claude: "Список всех доступных skills с описанием"
```
Или изучи system-reminder в начале сессии.

### Задание 10.2: Вызови skill
```
/code-review
```
или
```
/deep-research "Лучшие практики работы с async/await в JavaScript"
```

### Задание 10.3: Используй deferred tool
```
Попроси Claude: "Поищи последние обновления Claude Code API"
```
Наблюдай: Claude должен вызвать ToolSearch перед WebSearch.

### Задание 10.4: Изучи MCP настройки
Посмотри текущие MCP серверы:
```
/config
# или
cat ~/.claude/settings.json
```

### Задание 10.5 (со звёздочкой)*: Создай простой skill
Создай файл `~/.claude/plugins/myskills/skills/summarize/SKILL.md` с инструкцией для суммаризации текста. Протестируй через `/myskills:summarize`.

---

## Критерии успеха Lab 10

- [x] Вызвал минимум 2 встроенных skill
- [x] Понимаешь разницу между loaded tools и deferred tools
- [x] Знаешь как ToolSearch загружает схемы
- [x] Понимаешь как MCP серверы добавляют инструменты

---

## Следующий шаг

→ [Lab 11: Управление бюджетом токенов](../11-budget-management/lab.md)
