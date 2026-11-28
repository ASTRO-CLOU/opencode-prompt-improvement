# opencode-prompt-improvement

[![CI](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml/badge.svg)](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/ASTRO-CLOU/opencode-prompt-improvement)](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenCode V2](https://img.shields.io/badge/OpenCode-V2-7C3AED)](https://opencode.ai)

[English](README.md) | [Русский](README.ru.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [Italiano](README.it.md) | 中文 | [日本語](README.ja.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [हिन्दी](README.hi.md)

OpenCode V2 插件，在**发送提示词的瞬间**对其进行改进。你输入简短语句，模型收到更清晰、更结构化的版本。改进后的文本会保存到会话记录中，因此你可以看到实际发送了什么。

插件绝不会编造事实、需求、示例或标题。默认**不消耗模型 token**。你可以选择单独的廉价模型做最后润色；会话主模型从不用于改进。

## 演示

```text
你输入：
  "修复登录 bug 也加测试 并检查 api"

模型收到：
  - 修复登录 bug
  - 加测试
  - 检查 api
```

TUI 会显示 `refine · auto · 1ms · +8 chars`，会话记录中可见改进后的提示词。

## 功能

- 实时提示词钩子：在到达模型前改进。
- 默认安全：确定性清理，不调用模型。
- 可选 LLM 润色，仅使用你显式选择的模型。
- 不新增事实、需求、步骤、示例、标题或翻译。
- 保留代码、URL、路径、数字、标识符和 `@提及`。
- 跳过命令、过短、代码过多或已结构化的提示词。
- 当前会话或近期会话上下文仅作术语参考，绝不作为新事实来源。
- TUI 状态栏标识和面板，包含 diff、历史与统计。
- 完整斜杠命令、持久设置和本地缓存。
- 快速：安全模式即时完成；LLM 模式 3.5 秒超时并缓存。

## 安装

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement
```

固定版本：

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement#v1.0.7
```

或写入 `opencode.json(c)`：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"]
}
```

未生效时执行 `/reload`。

## 模式

| 模式 | 行为 | Token |
| --- | --- | --- |
| `auto`（默认） | 安全清理；仅在选择模型时启用 LLM | 无模型时为 0 |
| `safe` | 仅确定性清理 | 0 |
| `llm` | 需要模型，失败回退 safe | 少量，所选模型 |

用 `/refine-model provider/id` 选择模型。没有模型时，即使 `auto` 和 `llm` 也消耗 0 token。

`context` 默认为 `off`。`session` 使用当前会话最近的用户消息；`recent` 加入同项目近期会话。上下文有长度上限，且不会添加事实。

## 命令

| 命令 | 说明 |
| --- | --- |
| `/refine` | 状态、打开面板 |
| `/refine-on`, `/refine-off` | 启用/禁用 |
| `/refine-status` | 当前设置 |
| `/refine-mode <auto\|safe\|llm>` | 切换模式 |
| `/refine-model [provider/id\|off]` | 选择/清除模型 |
| `/refine-models [filter]` | 列出模型 |
| `/refine-context <off\|session\|recent>` | 上下文范围 |
| `/improve <text>` | Restructure with the selected model when available, otherwise apply deterministic improvement, and send the result |
| `/refine-preview <text>` | 发送前预览 |
| `/refine-last` | 上次改进 |
| `/refine-history` | 历史 |
| `/refine-stats` | 计数与 token 估算 |
| `/refine-reset` | 重置设置与历史 |
| `/refine-help` | 命令列表 |

命令回复只是通知，不会启动 agent。

## TUI

输入框页脚标识：`✦ refine on · auto · none`。面板有四个标签：Status、Last diff、History、Stats。

面板按键：`1`–`4` 切换标签，`j`/`k` 滚动，`r` 刷新，`m` 选择模型，`t` 开关，`Esc` 关闭。

## 安全性

- 原文所有词必须保留；LLM 只能添加少量功能词。
- 所有锚点（代码、URL、路径、数字、标识符、提及）必须完全一致。
- 默认长度增长上限 25%。
- 任何错误、超时或无效输出 → 回退 safe，再回退原文。
- 带提及和偏移的提示词会被跳过，以免破坏附件。
- 钩子使用 `try/catch`：插件错误不会阻塞发送。

详见 [docs/SAFETY.md](docs/SAFETY.md)。

## 配置

```json
{
  "enabled": true, "mode": "auto", "model": null, "context": "off",
  "maxGrowth": 0.25, "timeoutMs": 3500, "minLength": 12, "maxLength": 8000,
  "skipStructured": true, "historyEnabled": true, "historyLimit": 50,
  "showToast": true, "locale": "en"
}
```

全部选项：[docs/CONFIGURATION.md](docs/CONFIGURATION.md)。

## 隐私

改进在本地进行。安全模式不发送任何内容。选择模型后，仅提示词文本和可选的截断上下文通过 OpenCode 发送给提供商。

## 故障排查

- **无标识或命令：** `/reload`，然后 `opencode plugin list`。
- **没有变化：** 提示词过短、是命令、代码过多或已结构化——这是预期行为。
- **LLM 不运行：** 用 `/refine-model` 选择模型。

## 开发

```sh
npm install
npm run check
npm pack --dry-run
```

架构：[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

## 许可证

MIT © 2026 ASTRO-CLOU。参见 [LICENSE](LICENSE)。
