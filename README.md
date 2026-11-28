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

An OpenCode plugin that rewrites your prompt before it reaches the model. You type a short message; the conversation receives a cleaner, structured version. Both the model and the UI show the rewritten text.

**Compatibility:** OpenCode V2, tested on 2.3.2+ with plugin API 2.4.2. Node.js 22.18+ for development. No telemetry, no account required for deterministic mode.

## Requirements

- OpenCode V2 (2.3.2 or newer).
- Node.js 22.18+ only if you build from source.
- Optional: a model for LLM refinement (local llama.cpp/Ollama or any provider available in OpenCode).

## Install

Install from GitHub:

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement
```

```jsonc title="opencode.jsonc"
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"]
}
```

Run `/reload` in OpenCode after installation. To pin a release, use `github:ASTRO-CLOU/opencode-prompt-improvement#v0.0.1`.

## Commands

All commands report through notifications and never start an agent.

| Command | Description |
| --- | --- |
| `/imp-status` | Show state, mode, model and quota status |
| `/imp-on` / `/imp-off` | Enable or disable improvement |
| `/imp-models [filter]` | List models available to this plugin |
| `/imp-model [provider/id#variant]` | Select a model and variant; `status` shows the current one |
| `/imp-model off` | Keep cleanup, disable model calls |
| `/imp-force <prompt>` | Improve one prompt once, even when improvement is off |

`/imp-force` re-sends your text through the prompt hook with an internal marker. It ignores the on/off switch and skip rules, but keeps every safety check. The marker never reaches the model or the transcript.

## Configuration

Settings are stored per session by the plugin commands. Plugin options can also be set globally:

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

| Option | Default | Meaning |
| --- | --- | --- |
| `mode` | `deterministic` | `deterministic` (no model calls) or `llm` (model rewrite with fallback) |
| `model` | none | Required for `llm`: `{ providerID, id, variant? }` |
| `maxGrowth` | `0.4` | Maximum output length growth, 0–1 |
| `skipCommands` | `true` | Skip prompts that start with `/` |
| `skipDetailed` | `true` | Skip long or already structured prompts |
| `detailedThreshold` | `2000` | Character count considered long |
| `llmTimeoutMs` | `20000` | Timeout for the optional model call, in milliseconds |

## How it works

- One `prompt` hook runs at admission and updates both `text` and `metadata.displayText`, so the conversation shows exactly what the model receives.

- Deterministic cleanup removes zero-width characters, collapses repeated spaces and blank lines, and preserves code, mentions and anchors.

- In `llm` mode the plugin calls `ctx.experimental.generate.text` first: only your text and the rewrite instruction, no OpenCode system prompt. A temporary session is used as fallback.

- The prompt asks for three lines (`Кто:` / `Задача:` / `Важно:`) and `/no_think` for Qwen3. Prompts with `@mentions` skip the LLM pass.

## Safety

- Every path, URL, number, identifier, backticked fragment and `@mention` must survive. New ones are rejected.

- Output may be at most 40% longer than the input.

- Fenced code is never touched; inline code changes reject the edit.

- A rewrite that drops more than 10% of the original text is rejected.

- Empty prompts, `/commands`, `*` prefixes and prompts over 2000 characters are skipped by default. Mention offsets are remapped or the prompt is left unchanged.

## Quota protection

Successful rewrites are cached: the same prompt and model reuse the result without a network call.

A free-limit or rate-limit error starts a 6-hour pause; only deterministic cleanup runs during the pause.

Use `/imp-model off` to keep cleanup without model calls, or `/imp-off` to disable the plugin.

## Local models

A local model keeps refinement off any account allowance. llama.cpp gives exact control over context and VRAM; Ollama is the one-command option.

### llama.cpp (16K context)

Install the binaries, download `Qwen3-8B-Q4_K_M` (~5 GB) and start the OpenAI-compatible server. ModelScope is used as a fallback when Hugging Face resets the connection.

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

Register the server in the global OpenCode config, keeping your existing `plugins` entry:

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

Run `/reload`, then select the model in this plugin:

```text
/imp-model llamacpp/qwen3-8b
```

### Ollama

Install [Ollama](https://ollama.com), start it and pull a model. OpenCode discovers it at `http://127.0.0.1:11434` automatically.

```sh
ollama serve
ollama pull qwen3:8b
```

```text
/imp-model ollama/qwen3:8b
```

| Option | Best for | Trade-off |
| --- | --- | --- |
| llama.cpp | explicit 16K context and VRAM tuning | one server command plus a config entry |
| Ollama | fastest setup and auto-discovery | fewer low-level knobs |

On an 8 GB card, 8K–16K context is enough for this plugin. A 128K context needs much more VRAM.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Plugin missing from `opencode plugin list` | Re-run install and check GitHub access; use an authenticated URL for a private fork. |
| Commands work, no toasts | Put the plugin in the global config and run `/reload`. |
| LLM mode changes nothing | Check `/imp-model status`; pick another model via `/imp-models` and `/imp-model provider/id#variant`. Remove `@mentions`. |
| Local model missing from `/imp-models` | Keep `llama-server.exe` on port 8080 or `ollama serve` running, then run `/reload`. |
| The transcript shows the original text | Run `/reload` so the server part picks up the current code. |

Logs: `~/.local/share/opencode/log/opencode.log`. For one reproduction use `OPENCODE_LOG_LEVEL=DEBUG`.

## Development

```sh
git clone https://github.com/ASTRO-CLOU/opencode-prompt-improvement.git
cd opencode-prompt-improvement
npm install
npm run check
```

`npm run check` runs tests, typecheck and the GUI build. Tests use Node 22.18+ and run TypeScript directly through `node --test`.

## License

MIT. See [LICENSE](LICENSE).
