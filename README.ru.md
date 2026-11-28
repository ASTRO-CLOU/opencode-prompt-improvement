<p align="center">
  <img src="assets/banner.png" alt="opencode-prompt-improvement" width="100%">
</p>

<div align="center">

[![CI](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml/badge.svg)](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenCode V2](https://img.shields.io/badge/OpenCode-V2-7C3AED)](https://opencode.ai)
[![Version](https://img.shields.io/badge/version-0.0.1-emerald.svg)](package.json)

[English](README.md) | [Русский](README.ru.md) | [العربية](README.ar.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Français](README.fr.md) | [हिन्दी](README.hi.md) | [Italiano](README.it.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Português](README.pt.md) | [中文](README.zh.md)

</div>

Плагин OpenCode, который улучшает промпт до отправки модели. Вы пишете короткую мысль — в переписку попадает более чистая структурированная версия. И модель, и интерфейс видят именно переписанный текст.

**Совместимость:** OpenCode V2, проверено на 2.3.2+ с plugin API 2.4.2. Node.js 22.18+ для сборки из исходников. Без телеметрии; детерминированный режим не требует аккаунта.

## Требования

- OpenCode V2 (2.3.2 или новее).
- Node.js 22.18+ — только при сборке из исходников.
- Необязательно: модель для LLM-прохода (локальная llama.cpp/Ollama или любой провайдер OpenCode).

## Установка

Установка из GitHub:

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement
```

```jsonc title="opencode.jsonc"
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"]
}
```

После установки выполните `/reload`. Чтобы зафиксировать версию: `github:ASTRO-CLOU/opencode-prompt-improvement#v0.0.1`.

## Команды

Все команды отвечают уведомлениями и не запускают агента.

| Команда | Описание |
| --- | --- |
| `/imp-status` | Состояние, режим, модель и квота |
| `/imp-on` / `/imp-off` | Включить или выключить улучшение |
| `/imp-models [filter]` | Список моделей для плагина |
| `/imp-model [provider/id#variant]` | Выбрать модель и вариант; `status` показывает текущую |
| `/imp-model off` | Оставить очистку, отключить вызовы модели |
| `/imp-force <prompt>` | Улучшить один промпт, даже если улучшение выключено |
| `/imp-config [ключ значение]` | Показать или изменить настройки во время работы |

`/imp-config` показывает текущие значения, меняет одну настройку или сбрасывает все переопределения командой `reset`. Значение `clear` удаляет одно переопределение. Ключи: `mode`, `model`, `maxGrowth`, `skipCommands`, `skipDetailed`, `detailedThreshold`, `llmTimeoutMs`.

`/imp-force` отправляет ваш текст через хук повторно со служебной меткой. Команда игнорирует переключатель и правила пропуска, но сохраняет все проверки безопасности. Метка не попадает ни в модель, ни в переписку.

## Настройки

Команды сохраняют настройки для сессии. Параметры плагина можно задать и глобально:

```jsonc title="opencode.jsonc"
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"],
  "plugin": {
    "opencode-prompt-improvement": {
      "mode": "llm",
      "model": { "providerID": "llamacpp", "id": "qwen3-8b", "variant": "none" },
      "maxGrowth": 0.4,
      "skipCommands": true,
      "skipDetailed": true,
      "detailedThreshold": 2000,
      "llmTimeoutMs": 20000
    }
  }
}
```

| Параметр | По умолчанию | Смысл |
| --- | --- | --- |
| `mode` | `deterministic` | `deterministic` (без вызовов модели) или `llm` (переписывание с откатом) |
| `model` | none | Обязательно для `llm`: `{ providerID, id, variant? }` |
| `maxGrowth` | `0.4` | Максимальный рост длины ответа, 0–1 |
| `skipCommands` | `true` | Пропускать промпты, начинающиеся с `/` |
| `skipDetailed` | `true` | Пропускать длинные или уже структурированные промпты |
| `detailedThreshold` | `2000` | Число символов, считающееся длинным промптом |
| `llmTimeoutMs` | `20000` | Таймаут вызова модели в миллисекундах |

## Как это работает

- Один хук `prompt` срабатывает при приёме и обновляет и `text`, и `metadata.displayText` — в переписке видно то, что получит модель.

- Детерминированная очистка убирает невидимые символы, лишние пробелы и пустые строки, сохраняя код, упоминания и якоря.

- В режиме `llm` сначала вызывается `ctx.experimental.generate.text`: только ваш текст и инструкция, без системного промпта OpenCode. Временная сессия используется как запасной путь.

- Инструкция просит три строки с заголовками на языке промпта: для русского — `Кто: / Задача: / Важно:`, для других языков — `Who: / Task: / Important:`; для Qwen3 добавляется `/no_think`. Промпты с `@упоминаниями` LLM не трогает.

## Безопасность

- Все пути, URL, числа, идентификаторы, фрагменты в backticks и `@упоминания` должны сохраниться. Новые запрещены.

- Ответ может быть не более чем на 40% длиннее исходника.

- Блоки кода не трогаются; изменение inline-кода отклоняет правку.

- Правка, теряющая более 10% исходного текста, отклоняется.

- По умолчанию пропускаются пустые промпты, `/команды`, префикс `*` и тексты длиннее 2000 символов. Смещения упоминаний пересчитываются, иначе промпт остаётся без изменений.

## Защита квоты

Успешные правки кэшируются: одинаковый промпт и модель не требуют повторного запроса.

Ошибка лимита или частоты запросов включает паузу на 6 часов; в паузе работает только детерминированная очистка.

`/imp-model off` оставляет очистку без вызовов модели, `/imp-off` выключает плагин полностью.

## Локальные модели

Локальная модель не расходует квоту аккаунта. llama.cpp даёт точный контроль контекста и VRAM; Ollama запускается одной командой.

### llama.cpp (контекст 16K)

Установите бинарники, скачайте `Qwen3-8B-Q4_K_M` (~5 ГБ) и запустите сервер с OpenAI-совместимым API. Если Hugging Face сбрасывает соединение, используется ModelScope.

```powershell
winget install --id ggml.llamacpp --exact
```

```powershell
New-Item -ItemType Directory -Force "$env:LOCALAPPDATA\opencode\llama\models" | Out-Null
curl.exe -L -o "$env:LOCALAPPDATA\opencode\llama\models\Qwen3-8B-Q4_K_M.gguf" `
  "https://www.modelscope.cn/api/v1/models/unsloth/Qwen3-8B-GGUF/repo?Revision=master&FilePath=Qwen3-8B-Q4_K_M.gguf"
```

```powershell
& "$env:LOCALAPPDATA\opencode\llama\bin\llama-server.exe" `
  -m "$env:LOCALAPPDATA\opencode\llama\models\Qwen3-8B-Q4_K_M.gguf" `
  -c 16384 -ctk q8_0 -ctv q8_0 -fa on -ngl 99 `
  --port 8080 -a qwen3-8b
```

Добавьте сервер в глобальный конфиг OpenCode, сохранив существующий список `plugins`:

```jsonc title="opencode.jsonc"
{
  "$schema": "https://opencode.ai/config.json",
  "model": "llamacpp/qwen3-8b",
  "providers": {
    "llamacpp": {
      "name": "llama.cpp",
      "package": "@opencode/ai/providers/openai-compatible",
      "settings": { "baseURL": "http://127.0.0.1:8080/v1" },
      "models": {
        "qwen3-8b": {
          "name": "Qwen3 8B (llama.cpp)",
          "modelID": "qwen3-8b",
          "limit": { "context": 16384, "output": 4096 }
        }
      }
    }
  }
}
```

Выполните `/reload`, затем выберите модель в плагине:

```text
/imp-model llamacpp/qwen3-8b
```

### Ollama

Установите [Ollama](https://ollama.com), запустите её и загрузите модель. OpenCode найдёт её автоматически по адресу `http://127.0.0.1:11434`.

```sh
ollama serve
ollama pull qwen3:8b
```

```text
/imp-model ollama/qwen3:8b
```

| Параметр | Лучше для | Компромисс |
| --- | --- | --- |
| llama.cpp | точный контроль контекста 16K и VRAM | одна команда сервера плюс запись в конфиге |
| Ollama | самая быстрая установка и автопоиск | меньше низкоуровневых настроек |

На карте на 8 ГБ хватает контекста 8K–16K. Для 128K нужно гораздо больше VRAM.

## Решение проблем

| Симптом | Что делать |
| --- | --- |
| Плагина нет в `opencode plugin list` | Повторите установку и проверьте доступ к GitHub; для приватного форка используйте URL с авторизацией. |
| Команды работают, но уведомлений нет | Добавьте плагин в глобальный конфиг и выполните `/reload`. |
| Режим `llm` ничего не меняет | Проверьте `/imp-model status`; выберите другую модель через `/imp-models` и `/imp-model provider/id#variant`. Уберите `@упоминания`. |
| Локальной модели нет в `/imp-models` | Держите `llama-server.exe` на порту 8080 или запущенным `ollama serve`, затем `/reload`. |
| В переписке исходный текст | Выполните `/reload`, чтобы серверная часть подхватила текущий код. |

Логи: `~/.local/share/opencode/log/opencode.log`. Для одного воспроизведения используйте `OPENCODE_LOG_LEVEL=DEBUG`.

## Разработка

```sh
git clone https://github.com/ASTRO-CLOU/opencode-prompt-improvement.git
cd opencode-prompt-improvement
npm install
npm run check
```

`npm run check` запускает тесты, проверку типов и сборку GUI. Тесты требуют Node 22.18+ и запускают TypeScript напрямую через `node --test`.

## Лицензия

MIT. См. [LICENSE](LICENSE).
