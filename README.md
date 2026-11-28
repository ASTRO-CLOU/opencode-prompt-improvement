# opencode-prompt-improvement

> Clean prompts before they reach the model. No new requirements, no model calls by default.

[![CI](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml/badge.svg)](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenCode V2](https://img.shields.io/badge/OpenCode-V2-black)](https://opencode.ai/docs/)
[![version](https://img.shields.io/badge/version-0.0.1-black)](package.json)

[English](README.md) · [Русский](README.ru.md)

## Why

- Removes noise: repeated spaces, trailing whitespace, broken blank lines, invisible characters.
- Keeps meaning: no new requirements, files, steps or tests.
- Free by default: deterministic cleanup makes zero model calls.
- Optional LLM pass: rewrites the text into a short three-part brief.
- Safe: paths, URLs, numbers, code fragments and `@mentions` are checked before an edit is applied.
- Works in the terminal and desktop app; desktop shows toasts.

```text
Before:  please   fix  this



         and run tests
After:   please fix this

         and run tests
```

## Install

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement
```

One command for the desktop app and CLI. It adds the plugin to the global config; the next session picks it up. Desktop GUI notifications require the plugin in the global config — a project-only config runs the server part but shows no toasts.

Manual config (`~/.config/opencode/opencode.json(c)`):

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"]
}
```

Without a tag, the default branch is used. To pin a published release, append its tag: `github:ASTRO-CLOU/opencode-prompt-improvement#v0.0.1` (once that tag exists). Check the result with `opencode plugin list`.

Requires OpenCode V2 and Node 22.18+.

## Commands

| Command | Action |
| --- | --- |
| `/imp-status` | Show on/off state, mode, model and whether the model is available. |
| `/imp-on`, `/imp-off` | Enable or disable improvement. When off, prompts are sent as typed. |
| `/imp-models [filter]` | Compact list of up to 8 model IDs; filter narrows it. Stays open until closed. |
| `/imp-model provider/id#variant` | Save the model, switch to LLM mode and enable improvement. |
| `/imp-model status` | Same as `/imp-status`, with model availability. |
| `/imp-model off` | Return to deterministic cleanup. |
| `/imp-model clear` | Forget the saved model and use config values again. |

Replies are toasts and never start an agent. Other toasts disappear after 6 seconds. The on/off state survives restarts.

Quick start:

```text
/imp-status
/imp-models hy4
/imp-model opencode/hy4-flash-free#none
```

`#none` turns reasoning off and is usually much faster than the default variant. Unknown models and variants are rejected.

## Configuration

Options go under the plugin entry in `opencode.json(c)`. `/imp-model` overrides the saved model until `/imp-model clear`.

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

| Option | Default | Meaning |
| --- | --- | --- |
| `mode` | `deterministic` | `deterministic` or `llm`. |
| `model` | none | Required for `llm`: `{ "providerID": "...", "id": "...", "variant": "none" }`; variant optional. |
| `maxGrowth` | `0.4` | Maximum length growth, 0–1. |
| `skipCommands` | `true` | Skip prompts starting with `/`. |
| `skipDetailed` | `true` | Skip long or structured prompts. |
| `detailedThreshold` | `2000` | Character count considered long. |
| `llmTimeoutMs` | `20000` | Timeout for the optional model call. |

## How it works

- The server registers a `prompt` hook. It runs once at admission and updates both `text` and `displayText`, so the rewritten prompt is what you see in the conversation.
- TUI and GUI parts only listen for RPC notices and show toasts. They never change prompts.
- The LLM pass calls `ctx.experimental.generate.text` first. That one-shot call sends only the rewrite instruction, without OpenCode's system prompt — important for a local model with a 16K context. If it fails, the plugin falls back to a temporary session (`ctx.session.create` → `generate` → `remove`). It uses the selected model, not your session model, and never appears as a chat. On failure it shows the reason once and falls back to deterministic cleanup.
- The internal prompt asks for exactly three lines with fixed headings (`Кто:` / `Задача:` / `Важно:` for Russian) and adds `/no_think` for Qwen3-style models. It is written as an improvement, not a summary: every detail, adjective and personal reminder from your text must survive, while greetings and repetitions go away. A few-shot example shows the exact format, and a hard character limit matches the 40% growth cap. The prompt asks for one short useful detail — a result, a next step or what to check — without inventing facts, technologies or files. The plugin also rejects any rewrite that drops more than 10% of the original text, so bad model output cannot make your prompt worse. Only the text you typed is sent — no chat history. Prompts with `@mentions` skip the LLM pass.

## Safety

- Every path, URL, number, backticked fragment and `@mention` from the original must survive; new ones are forbidden.
- Result may be at most 40% longer.
- Fenced code blocks are never touched; a change to inline code rejects the whole edit.
- Skipped entirely: empty prompts, `/commands` (when enabled), `*`, prompts over 2000 characters, and prompts with 3+ list items or headings.
- Mention offsets are remapped; if a mention cannot be mapped exactly, the prompt is sent unchanged.
- Deterministic mode makes no network calls. No telemetry.

## Quota protection

The LLM pass is optional and is throttled so it cannot burn through a free allowance:

- Successful rewrites are cached. The same prompt and model reuse the cached text without a network call.
- A free usage limit or rate limit starts a 6-hour pause. During the pause only deterministic cleanup runs.
- To stop all model calls, use `/imp-model off` (keeps cleanup) or `/imp-off` (disables the plugin).

## Local models

A local model keeps the LLM pass off OpenCode's allowance. Two good ways to do it: llama.cpp gives explicit control over context and VRAM, Ollama is the one-command option.

### llama.cpp (recommended here, 16K context)

Install with winget, then restart your terminal:

```powershell
winget install --id ggml.llamacpp --exact
```

If the download stalls, use the official prebuilt zip:

```powershell
$zip = "$env:TEMP\llama-bin.zip"
curl.exe -L -o $zip "https://github.com/ggml-org/llama.cpp/releases/download/b12823/llama-b12823-bin-win-vulkan-x64.zip"
$dest = "$env:LOCALAPPDATA\opencode\llama\bin"
Expand-Archive $zip $dest -Force
```

Download a Q4 GGUF. `Qwen3-8B-Q4_K_M` is about 5 GB and fits an 8 GB card with a 16K context:

```powershell
New-Item -ItemType Directory -Force "$env:LOCALAPPDATA\opencode\llama\models" | Out-Null
curl.exe -L -o "$env:LOCALAPPDATA\opencode\llama\models\Qwen3-8B-Q4_K_M.gguf" `
  "https://huggingface.co/unsloth/Qwen3-8B-GGUF/resolve/main/Qwen3-8B-Q4_K_M.gguf"
```

If Hugging Face resets the connection, use the same file from ModelScope:

```powershell
curl.exe -L -C - -o "$env:LOCALAPPDATA\opencode\llama\models\Qwen3-8B-Q4_K_M.gguf" `
  "https://www.modelscope.cn/api/v1/models/unsloth/Qwen3-8B-GGUF/repo?Revision=master&FilePath=Qwen3-8B-Q4_K_M.gguf"
```

Start the OpenAI-compatible server. `-c 16384` is the 16K context; `q8_0` KV cache cuts VRAM use:

```powershell
& "$env:LOCALAPPDATA\opencode\llama\bin\llama-server.exe" `
  -m "$env:LOCALAPPDATA\opencode\llama\models\Qwen3-8B-Q4_K_M.gguf" `
  -c 16384 -ctk q8_0 -ctv q8_0 -fa on -ngl 99 `
  --port 8080 -a qwen3-8b
```

Add the server to the global OpenCode config. Keep your existing `plugins` entry:

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

Run `/reload`, then select the model in this plugin:

```text
/imp-model llamacpp/qwen3-8b
```

Keep the server window open while you work. For autostart, save the `llama-server.exe` command as a `.cmd` file in your shell's Startup folder. If winget put the binary in PATH, you can use `llama-server.exe` instead of the full path.

### Ollama (simpler)

Install [Ollama](https://ollama.com), start it, then pull a model:

```sh
ollama serve
ollama pull qwen3:8b
```

OpenCode discovers it at `http://127.0.0.1:11434` automatically — no account or API key:

```text
/imp-model ollama/qwen3:8b
```

| Option | Best for | Trade-off |
| --- | --- | --- |
| llama.cpp | explicit 16K context and VRAM tuning | one server command plus a config entry |
| Ollama | fastest setup and auto-discovery | fewer low-level knobs |

On an 8 GB card, 8K-16K context is plenty for this plugin. A full 128K context needs much more VRAM.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Plugin missing from `opencode plugin list` | Re-run install; check GitHub access. For a private fork use an authenticated Git URL. |
| Commands work, no toasts | GUI part is not loaded. Put the plugin in the global config, then run `/reload`. |
| LLM mode changes nothing | Check `/imp-model status`. If `(unavailable)`, pick another model via `/imp-models` and `/imp-model provider/id#variant`. Remove `@mentions`. Try variant `none` if the default is too slow. |
| `Free usage limit reached` toast | The account allowance is exhausted. `/imp-status` shows the remaining pause. Wait for the reset, switch to a paid provider, or run `/imp-model off` to keep cleanup without model calls. |
| Local model missing in `/imp-models` | For llama.cpp, keep `llama-server.exe` running on port 8080 and run `/reload`. For Ollama, run `ollama serve` and `/reload`. |
| Odd spacing remains | Prompt is over 2000 chars, has 3+ list items/headings, or inline code would change. |
| Conversation shows the original text | Run `/reload` so the server part picks up the current code. |

Logs: `~/.local/share/opencode/log/opencode.log`. For one reproduction use `OPENCODE_LOG_LEVEL=DEBUG`.

## Development

```sh
git clone https://github.com/ASTRO-CLOU/opencode-prompt-improvement.git
cd opencode-prompt-improvement
npm install
npm run check
```

`npm run check` runs tests, typecheck and the GUI build. Tests use Node 22.18+ and run TypeScript directly through `node --test`.

To try a local checkout, point `plugins` at its path, for example `"./opencode-prompt-improvement"`, and start OpenCode from the parent directory.

## License

MIT. See [LICENSE](LICENSE).
