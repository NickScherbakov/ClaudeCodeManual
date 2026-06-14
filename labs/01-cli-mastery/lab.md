# Lab 01 — Мастерство CLI

**Сложность**: ★☆☆
**Время**: ~45 минут

---

## Цель

Разобраться с ключевыми командами Claude Code, системой permissions и конфигурацией через settings.json и CLAUDE.md.

---

## 1. Основные режимы запуска

### Интерактивный режим (REPL)
```bash
claude
# или
claude --model claude-opus-4-8
```

### Одиночный промпт (non-interactive)
```bash
claude -p "Объясни pipeline() в двух предложениях"
claude --print "Объясни pipeline() в двух предложениях"
```

### Pipe режим (stdin)
```bash
cat myfile.js | claude -p "Найди баги в этом коде"
echo "review this" | claude --print
```

### Продолжение сессии
```bash
claude --continue          # продолжить последнюю сессию
claude --resume SESSION_ID # продолжить конкретную сессию
```

---

## 2. Ключевые slash-команды

| Команда | Действие |
|---------|---------|
| `/help` | Список всех команд |
| `/config` | Настройки (модель, тема, язык) |
| `/clear` | Очистить контекст разговора |
| `/compact` | Компактизировать историю (освободить контекст) |
| `/model` | Быстрая смена модели |
| `/status` | Состояние сессии |
| `/cost` | Использование токенов этой сессии |
| `/review` | Запустить code review текущего diff |
| `/memory` | Просмотр активных memory файлов |
| `/init` | Инициализировать CLAUDE.md |
| `/bug` | Сообщить о баге |

---

## 3. Система Permissions

Claude Code запрашивает разрешения, чтобы не делать ничего нежелательного без твоего ведома.

### Уровни разрешений:
```json
// .claude/settings.json
{
  "permissions": {
    "allow": [
      "Bash(git *)",           // разрешить все git команды
      "Bash(npm run *)",        // разрешить npm scripts
      "Read(**)",               // разрешить чтение всего
      "Write(src/**)",          // разрешить запись в src/
      "Edit(*.md)"              // разрешить редактирование .md файлов
    ],
    "deny": [
      "Bash(rm -rf *)",         // запретить опасное удаление
      "Bash(git push --force *)" // запретить force push
    ]
  }
}
```

### Режимы подтверждения:
- По умолчанию: Claude спрашивает разрешение на каждое новое действие
- `--dangerously-skip-permissions`: пропустить ВСЕ проверки (только для CI/trusted env)
- Добавь действие в `allow` чтобы оно выполнялось без подтверждения

---

## 4. settings.json — полный контроль

### Глобальные vs Проектные настройки:
```
~/.claude/settings.json       ← глобальные (для всех проектов)
.claude/settings.json         ← проектные (перекрывают глобальные)
.claude/settings.local.json   ← локальные (в .gitignore, для личных настроек)
```

### Ключевые поля:
```json
{
  "model": "claude-opus-4-8",
  "theme": "dark",
  "language": "ru",
  "autoCompact": true,
  "autoCompactThreshold": 0.8,
  "permissions": {
    "allow": [],
    "deny": []
  },
  "hooks": {
    "UserPromptSubmit": [...],
    "Stop": [...],
    "PreToolCall": [...],
    "PostToolCall": [...]
  },
  "env": {
    "MY_VAR": "value"
  }
}
```

---

## 5. CLAUDE.md — память проекта

CLAUDE.md читается автоматически при запуске — используй его для:

```markdown
# My Project

## Важные команды
- `npm test` — запустить тесты
- `npm run build` — сборка

## Соглашения
- Все функции асинхронные
- Тесты в /tests/ с суффиксом .test.ts

## Запрещено
- Никогда не использовать `var`, только `const`/`let`
- Не модифицировать /dist/ напрямую
```

**Иерархия CLAUDE.md**:
```
~/CLAUDE.md                    ← глобальный (для всех проектов)
~/projects/CLAUDE.md           ← для всей папки projects/
~/projects/myapp/CLAUDE.md     ← для конкретного проекта
~/projects/myapp/src/CLAUDE.md ← для поддиректории src/
```

---

## Задания

### Задание 1.1: Изучи свои настройки
```
Попроси Claude: "Покажи мне текущий settings.json и объясни каждое поле"
```

### Задание 1.2: Добавь разрешение
Добавь в `.claude/settings.json` этого проекта разрешение на запуск PowerShell без подтверждения:
```json
{
  "permissions": {
    "allow": ["Bash(powershell *)", "PowerShell(*)"]
  }
}
```

### Задание 1.3: Тест mode auto
```bash
# Запусти с флагом non-interactive и проверь вывод:
claude -p "Список файлов в текущей директории" --allowedTools "Bash(ls *)"
```

### Задание 1.4: Изучи /cost
После нескольких запросов выполни:
```
/cost
```
Обрати внимание на количество input/output токенов и стоимость.

---

## Концепция: Как Claude Code читает контекст

При запуске Claude Code строит контекст в таком порядке:
```
1. System prompt (встроенный)
2. ~/.claude/CLAUDE.md (глобальный)
3. [parent dirs]/CLAUDE.md (все промежуточные)
4. ./CLAUDE.md (текущий проект)
5. ./subdir/CLAUDE.md (если работаем в поддиректории)
6. Содержимое текущей сессии
```

Специфичные инструкции в CLAUDE.md проекта перекрывают глобальные.

---

## Критерии успеха Lab 01

- [x] Знаешь разницу между `-p`, `--continue`, `--resume`
- [x] Понимаешь иерархию settings.json (global → project → local)
- [x] Умеешь добавлять разрешения в allow/deny
- [x] Знаешь ключевые slash-команды
- [x] Понимаешь как CLAUDE.md влияет на поведение Claude

---

## Задания со звёздочкой *

**1.5**: Создай персональный `~/.claude/CLAUDE.md` с твоими предпочтениями (язык ответов, стиль, запрещённые паттерны).

**1.6**: Настрой хук UserPromptSubmit, который добавляет к каждому промпту префикс с текущим временем. (Подсказка: смотри Lab 08)

---

## Следующий шаг

→ [Lab 02: Основы Workflow](../02-workflow-fundamentals/lab.md)
