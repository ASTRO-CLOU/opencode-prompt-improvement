# opencode-prompt-improvement

> Чистит промпт перед отправкой модели. Без новых требований и без вызовов модели по умолчанию.

[![CI](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml/badge.svg)](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenCode V2](https://img.shields.io/badge/OpenCode-V2-black)](https://opencode.ai/docs/)
[![version](https://img.shields.io/badge/version-0.0.1-black)](package.json)

[English](README.md) · [Русский](README.ru.md)

## Зачем

- Убирает мусор: повторяющиеся пробелы, пробелы в конце строк, сломанные пустые строки, невидимые символы.
- Сохраняет смысл: не добавляет требования, файлы, шаги и тесты.
- Бесплатно по умолчанию: детерминированная очистка не вызывает модель.
- Необязательный LLM-проход: переписывает текст в короткий план из трёх частей.
- Безопасно: пути, URL, числа, фрагменты кода и `@упоминания` проверяются до применения правки.
- Работает в терминале и приложении; в приложении показывает тосты.

```text
Было:   please   fix  this



        and run tests
Стало:  please fix this

        and run tests
```

## Установка

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement
```

Одна команда для приложения и CLI. Плагин добавляется в глобальный конфиг и подхватывается в следующей сессии. Для тостов в приложении плагин должен быть в глобальном конфиге: конфиг проекта запускает серверную часть, но уведомлений не покажет.

Ручной конфиг (`~/.config/opencode/opencode.json(c)`):

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"]
}
```

Без тега берётся ветка по умолчанию. Чтобы зафиксировать релиз, добавьте тег: `github:ASTRO-CLOU/opencode-prompt-improvement#v0.0.1` (когда тег будет создан). Проверить установку: `opencode plugin list`.

Нужны OpenCode V2 и Node 22.18+.

## Команды

| Команда | Действие |
| --- | --- |
| `/imp-status` | Включение, режим, модель и её доступность. |
| `/imp-on`, `/imp-off` | Включить или выключить улучшение. При выключенном промпты идут как есть. |
| `/imp-models [фильтр]` | Компактный список до 8 ID моделей; фильтр сужает выбор. Не исчезает до закрытия. |
| `/imp-model provider/id#variant` | Сохранить модель, включить LLM-проход и очистку. |
| `/imp-model status` | То же, что `/imp-status`, с доступностью модели. |
| `/imp-model off` | Вернуться к детерминированной очистке. |
| `/imp-model clear` | Забыть сохранённую модель и снова взять настройки из конфига. |

Ответы показываются тостами и не запускают агента. Остальные тосты исчезают через 6 секунд. Состояние включения сохраняется после перезапуска.

Быстрый старт:

```text
/imp-status
/imp-models hy4
/imp-model opencode/hy4-flash-free#none
```

`#none` отключает размышление и обычно работает быстрее штатного варианта. Неизвестные модели и варианты отклоняются.

## Конфигурация

Параметры задаются внутри записи плагина в `opencode.json(c)`. `/imp-model` перекрывает сохранённую модель до `/imp-model clear`.

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    {
      "package": "github:ASTRO-CLOU/opencode-prompt-improvement",
      "options": {
        "mode": "llm",
        "model": { "providerID": "your-provider", "id": "your-model", "variant": "none" }
      }
    }
  ]
}
```

| Параметр | По умолчанию | Значение |
| --- | --- | --- |
| `mode` | `deterministic` | `deterministic` или `llm`. |
| `model` | нет | Нужен для `llm`: `{ "providerID": "...", "id": "...", "variant": "none" }`; вариант необязателен. |
| `maxGrowth` | `0.4` | Максимальный рост длины, 0–1. |
| `skipCommands` | `true` | Не трогать промпты, начинающиеся с `/`. |
| `skipDetailed` | `true` | Не трогать длинные и структурированные промпты. |
| `detailedThreshold` | `2000` | Сколько символов считать длинным промптом. |
| `llmTimeoutMs` | `20000` | Таймаут дополнительного вызова модели. |

## Как это устроено

- Серверная часть регистрирует хук `prompt`. Он срабатывает один раз при приёме промпта и обновляет и `text`, и `displayText`, поэтому в переписке виден переписанный текст.
- TUI и GUI только слушают RPC-уведомления и показывают тосты. Промпты они не меняют.
- LLM-проход сначала вызывает `ctx.experimental.generate.text`. Этот одноразовый запрос отправляет только инструкцию переписывания, без системного промпта OpenCode — важно для локальной модели с контекстом 16K. Если он не сработал, плагин пробует временную сессию (`ctx.session.create` → `generate` → `remove`). Используется выбранная модель, а не модель чата; сессия не появляется как чат. При ошибке причина показывается один раз и включается детерминированная очистка.
- Внутренний промпт просит ровно три строки с фиксированными заголовками `Кто:` / `Задача:` / `Важно:` и добавляет `/no_think` для моделей семейства Qwen3. Он сформулирован как улучшение, а не как краткое изложение: каждая деталь, прилагательное и личная оговорка из вашего текста должны сохраниться, а приветствия и повторы убираются. Пример в самом промпте показывает нужный формат, а жёсткий лимит символов совпадает с ограничением роста 40%. Промпт просит добавить одну короткую полезную деталь — результат, следующий шаг или что проверить, — не выдумывая факты, технологии и файлы. Плагин также отклоняет любой вариант, который короче исходника более чем на 10%, поэтому плохой ответ модели не может ухудшить ваш промпт. Отправляется только введённый текст, без истории чата. Промпты с `@упоминаниями` пропускают LLM-проход.

## Безопасность

- Все пути, URL, числа, фрагменты в backtick и `@упоминания` из оригинала должны остаться; новые запрещены.
- Результат не длиннее оригинала более чем на 40%.
- Блоки кода в тройных backtick не меняются; правка inline-кода отклоняет всю замену.
- Полностью пропускаются: пустые промпты, `/команды` (если включено), `*`, промпты длиннее 2000 символов и с 3+ пунктами списка или заголовками.
- Смещения упоминаний пересчитываются; если упоминание не сопоставляется точно, промпт уходит без изменений.
- Детерминированный режим не делает сетевых вызовов. Телеметрии нет.

## Защита лимита

LLM-проход необязателен и ограничен, чтобы не расходовать бесплатный лимит:

- Успешные переписывания кэшируются. Тот же промпт и модель повторно используются без сетевого вызова.
- Лимит бесплатного use или rate limit включает паузу на 6 часов. Во время паузы работает только детерминированная очистка.
- Чтобы полностью отключить вызовы модели: `/imp-model off` (очистка остаётся) или `/imp-off` (плагин выключается).

## Локальные модели

Локальная модель уводит LLM-проход от лимита OpenCode. Есть два хороших варианта: llama.cpp даёт точный контроль над контекстом и VRAM, Ollama запускается одной командой.

### llama.cpp (рекомендуется здесь, контекст 16K)

Установите через winget, затем перезапустите терминал:

```powershell
winget install --id ggml.llamacpp --exact
```

Если загрузка через winget встала, возьмите официальный готовый zip:

```powershell
$zip = "$env:TEMP\llama-bin.zip"
curl.exe -L -o $zip "https://github.com/ggml-org/llama.cpp/releases/download/b12823/llama-b12823-bin-win-vulkan-x64.zip"
$dest = "$env:LOCALAPPDATA\opencode\llama\bin"
Expand-Archive $zip $dest -Force
```

Скачайте GGUF в квантовании Q4. `Qwen3-8B-Q4_K_M` весит около 5 ГБ и помещается на карту с 8 ГБ при контексте 16K:

```powershell
New-Item -ItemType Directory -Force "$env:LOCALAPPDATA\opencode\llama\models" | Out-Null
curl.exe -L -o "$env:LOCALAPPDATA\opencode\llama\models\Qwen3-8B-Q4_K_M.gguf" `
  "https://huggingface.co/unsloth/Qwen3-8B-GGUF/resolve/main/Qwen3-8B-Q4_K_M.gguf"
```

Если Hugging Face сбрасывает соединение, возьмите тот же файл с ModelScope:

```powershell
curl.exe -L -C - -o "$env:LOCALAPPDATA\opencode\llama\models\Qwen3-8B-Q4_K_M.gguf" `
  "https://www.modelscope.cn/api/v1/models/unsloth/Qwen3-8B-GGUF/repo?Revision=master&FilePath=Qwen3-8B-Q4_K_M.gguf"
```

Запустите OpenAI-совместимый сервер. `-c 16384` задаёт контекст 16K, KV-кэш `q8_0` экономит VRAM:

```powershell
& "$env:LOCALAPPDATA\opencode\llama\bin\llama-server.exe" `
  -m "$env:LOCALAPPDATA\opencode\llama\models\Qwen3-8B-Q4_K_M.gguf" `
  -c 16384 -ctk q8_0 -ctv q8_0 -fa on -ngl 99 `
  --port 8080 -a qwen3-8b
```

Добавьте сервер в глобальный конфиг OpenCode. Существующую запись `plugins` оставьте:

```jsonc title="opencode.jsonc"
{
  "$schema": "https://opencode.ai/config.json",
  "model": "llamacpp/qwen3-8b",
  "providers": {
    "llamacpp": {
      "name": "llama.cpp",
      "package": "@opencode/ai/providers/openai-compatible",
      "settings": {
        "baseURL": "http://127.0.0.1:8080/v1",
      },
      "models": {
        "qwen3-8b": {
          "name": "Qwen3 8B (llama.cpp)",
          "modelID": "qwen3-8b",
          "limit": { "context": 16384, "output": 4096 },
        },
      },
    },
  },
}
```

Выполните `/reload`, затем выберите модель в плагине:

```text
/imp-model llamacpp/qwen3-8b
```

Держите окно сервера открытым во время работы. Для автозапуска сохраните команду `llama-server.exe` в `.cmd`-файле в папке Startup. Если winget добавил бинарник в PATH, можно писать просто `llama-server.exe`.

### Ollama (проще)

Установите [Ollama](https://ollama.com), запустите её и загрузите модель:

```sh
ollama serve
ollama pull qwen3:8b
```

OpenCode сам находит её по адресу `http://127.0.0.1:11434` — без аккаунта и API-ключа:

```text
/imp-model ollama/qwen3:8b
```

| Вариант | Когда лучше | Компромисс |
| --- | --- | --- |
| llama.cpp | нужен явный контекст 16K и настройка VRAM | одна команда сервера и запись в конфиге |
| Ollama | самая быстрая установка и автопоиск модели | меньше низкоуровневых настроек |

На карте с 8 ГБ контекста 8K–16K этому плагину достаточно. Полный контекст 128K требует гораздо больше VRAM.

## Если что-то не работает

| Симптом | Что делать |
| --- | --- |
| Плагина нет в `opencode plugin list` | Повторите установку, проверьте доступ к GitHub. Для приватного форка нужен Git URL с доступом. |
| Команды работают, тостов нет | GUI-часть не загружена. Добавьте плагин в глобальный конфиг и выполните `/reload`. |
| LLM-режим ничего не меняет | Проверьте `/imp-model status`. Если `(unavailable)`, выберите другую модель через `/imp-models` и `/imp-model provider/id#variant`. Уберите `@упоминания`. При медленном варианте используйте `none`. |
| Тост `Free usage limit reached` | Лимит аккаунта исчерпан. `/imp-status` покажет остаток паузы. Дождитесь сброса, подключите платный провайдер или выполните `/imp-model off`, чтобы оставить только очистку. |
| Локальной модели нет в `/imp-models` | Для llama.cpp держите `llama-server.exe` запущенным на порту 8080 и выполните `/reload`. Для Ollama запустите `ollama serve` и `/reload`. |
| Лишние пробелы остались | Промпт длиннее 2000 символов, содержит 3+ пункта списка/заголовка или inline-код, который изменился бы. |
| В переписке виден исходник | Выполните `/reload`, чтобы серверная часть подхватила актуальный код. |

Логи: `~/.local/share/opencode/log/opencode.log`. Для одного воспроизведения используйте `OPENCODE_LOG_LEVEL=DEBUG`.

## Разработка

```sh
git clone https://github.com/ASTRO-CLOU/opencode-prompt-improvement.git
cd opencode-prompt-improvement
npm install
npm run check
```

`npm run check` запускает тесты, проверку типов и сборку GUI. Тестам нужен Node 22.18+; TypeScript запускается напрямую через `node --test`.

Чтобы проверить локальную копию, укажите её путь в `plugins`, например `"./opencode-prompt-improvement"`, и запускайте OpenCode из родительской папки.

## Лицензия

MIT. См. [LICENSE](LICENSE).
