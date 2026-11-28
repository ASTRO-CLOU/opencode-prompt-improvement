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

一个在提示词发送给模型之前对其进行改进的 OpenCode 插件。你写一句话，对话里收到的是更干净、更结构化的版本。模型和界面看到的都是改写后的文本。

**兼容性：** OpenCode V2，已在 2.3.2+ 与插件 API 2.4.2 上测试。仅从源码构建需要 Node.js 22.18+。无遥测；确定性模式不需要账号。

## 要求

- OpenCode V2（2.3.2 或更新）。
- 仅从源码构建时需要 Node.js 22.18+。
- 可选：用于 LLM 阶段的模型（本地 llama.cpp/Ollama 或任意 OpenCode 提供商）。

## 安装

从 GitHub 安装：

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement
```

```jsonc title="opencode.jsonc"
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"]
}
```

安装后在 OpenCode 中执行 `/reload`。要固定版本请使用 `github:ASTRO-CLOU/opencode-prompt-improvement#v0.0.1`。

## 命令

所有命令都通过通知反馈，不会启动代理。

| 命令 | 说明 |
| --- | --- |
| `/imp-status` | 显示状态、模式、模型和配额 |
| `/imp-on` / `/imp-off` | 开启或关闭改进 |
| `/imp-models [filter]` | 列出此插件可用的模型 |
| `/imp-model [provider/id#variant]` | 选择模型和变体；`status` 显示当前模型 |
| `/imp-model off` | 保留清理，关闭模型调用 |
| `/imp-force <prompt>` | 只改进一次提示词，即使改进已关闭 |
| `/imp-config [键 值]` | 查看或修改运行时设置 |

`/imp-config` 显示当前值、修改单个设置，或用 `reset` 清除所有覆盖。将值设为 `clear` 可删除单个覆盖。键名：`mode`、`model`、`maxGrowth`、`skipCommands`、`skipDetailed`、`detailedThreshold`、`llmTimeoutMs`。

`/imp-force` 会用内部标记把文本重新送入 prompt 钩子。它忽略开关和跳过规则，但保留全部安全检查。标记不会进入模型或对话记录。

## 配置

命令按会话保存设置。插件选项也可以全局设置：

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

| 选项 | 默认值 | 含义 |
| --- | --- | --- |
| `mode` | `deterministic` | `deterministic`（不调用模型）或 `llm`（改写并带回退） |
| `model` | none | `llm` 必需：`{ providerID, id, variant? }` |
| `maxGrowth` | `0.4` | 输出长度最大增长，0–1 |
| `skipCommands` | `true` | 跳过以 `/` 开头的提示词 |
| `skipDetailed` | `true` | 跳过过长或已结构化的提示词 |
| `detailedThreshold` | `2000` | 判定为过长的字符数 |
| `llmTimeoutMs` | `20000` | 模型调用超时时间（毫秒） |

## 工作原理

- 一个 `prompt` 钩子在接收时运行，同时更新 `text` 和 `metadata.displayText`，对话中显示的就是模型收到的内容。

- 确定性清理会移除不可见字符、重复空格和空行，保留代码、提及和锚点。

- `llm` 模式先调用 `ctx.experimental.generate.text`：只发送你的文本和指令，不带 OpenCode 系统提示词。临时会话作为回退。

- 内部指令要求用随语言变化的标题写成三行：俄语输入使用 `Кто: / Задача: / Важно:`，其他语言使用 `Who: / Task: / Important:`；Qwen3 还会加 `/no_think`。带 `@提及` 的提示词跳过 LLM 阶段。

## 安全

- 所有路径、URL、数字、标识符、反引号片段和 `@提及` 都必须保留，新增的一律拒绝。

- 输出最多只能比输入长 40%。

- 代码块绝不改动；行内代码发生变化会拒绝整次修改。

- 丢失原文超过 10% 的改写会被拒绝。

- 默认跳过空提示词、`/命令`、`*` 前缀和超过 2000 字符的文本。提及偏移量会重新映射，否则提示词保持原样。

## 配额保护

成功的改写会被缓存：相同提示词和模型直接复用结果，不再发起请求。

免费额度或频率限制错误会启动 6 小时暂停；暂停期间只运行确定性清理。

`/imp-model off` 保留清理但不调用模型；`/imp-off` 完全关闭插件。

## 本地模型

本地模型不会消耗账号额度。llama.cpp 可精确控制上下文和显存；Ollama 只需一条命令。

### llama.cpp（16K 上下文）

安装程序，下载 `Qwen3-8B-Q4_K_M`（约 5 GB），启动 OpenAI 兼容服务。Hugging Face 断线时使用 ModelScope。

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

把服务写入 OpenCode 全局配置，并保留已有的 `plugins` 条目：

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

执行 `/reload`，然后在插件中选择模型：

```text
/imp-model llamacpp/qwen3-8b
```

### Ollama

安装 [Ollama](https://ollama.com)，启动并拉取模型。OpenCode 会自动在 `http://127.0.0.1:11434` 发现它。

```sh
ollama serve
ollama pull qwen3:8b
```

```text
/imp-model ollama/qwen3:8b
```

| 选项 | 适合 | 取舍 |
| --- | --- | --- |
| llama.cpp | 显式 16K 上下文与显存调优 | 一条服务命令加一条配置 |
| Ollama | 安装最快、自动发现 | 底层选项较少 |

8 GB 显卡上使用 8K–16K 上下文足够；128K 需要更多显存。

## 故障排除

| 现象 | 处理 |
| --- | --- |
| `opencode plugin list` 中没有插件 | 重新安装并检查 GitHub 访问；私有分支使用带认证的 URL。 |
| 命令有效但没有通知 | 把插件写入全局配置并执行 `/reload`。 |
| `llm` 模式没有任何变化 | 检查 `/imp-model status`；用 `/imp-models` 和 `/imp-model 提供商/id#变体` 换模型。移除 `@提及`。 |
| `/imp-models` 中没有本地模型 | 保持 `llama-server.exe` 运行在 8080 端口或 `ollama serve` 运行，然后 `/reload`。 |
| 对话里仍显示原文 | 执行 `/reload`，让服务端加载当前代码。 |

日志：`~/.local/share/opencode/log/opencode.log`。复现时可设置 `OPENCODE_LOG_LEVEL=DEBUG`。

## 开发

```sh
git clone https://github.com/ASTRO-CLOU/opencode-prompt-improvement.git
cd opencode-prompt-improvement
npm install
npm run check
```

`npm run check` 会运行测试、类型检查和 GUI 构建。测试需要 Node 22.18+，并通过 `node --test` 直接运行 TypeScript。

## 许可证

MIT。详见 [LICENSE](LICENSE)。
