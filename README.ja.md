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

モデルに届く前にプロンプトを改善する OpenCode プラグインです。短い文章を書くと、より整理された形で会話に渡されます。モデルと UI の両方が書き換え後のテキストを表示します。

**互換性：** OpenCode V2、2.3.2+ と plugin API 2.4.2 で動作確認。ソースからビルドする場合のみ Node.js 22.18+ が必要。テレメトリなし。決定論モードはアカウント不要です。

## 要件

- OpenCode V2（2.3.2 以降）。
- ソースからビルドする場合のみ Node.js 22.18+。
- 任意：LLM 用モデル（ローカル llama.cpp/Ollama または OpenCode のプロバイダー）。

## インストール

GitHub からインストール：

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement
```

```jsonc title="opencode.jsonc"
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"]
}
```

インストール後に `/reload` を実行してください。バージョン固定は `github:ASTRO-CLOU/opencode-prompt-improvement#v0.0.1` です。

## コマンド

すべてのコマンドは通知で応答し、エージェントを起動しません。

| コマンド | 説明 |
| --- | --- |
| `/imp-status` | 状態、モード、モデル、クォータを表示 |
| `/imp-on` / `/imp-off` | 改善を有効または無効にする |
| `/imp-models [filter]` | このプラグインで使えるモデルを一覧表示 |
| `/imp-model [provider/id#variant]` | モデルとバリアントを選択。`status` で現在値を表示 |
| `/imp-model off` | クリーンアップを残し、モデル呼び出しを無効化 |
| `/imp-force <prompt>` | 改善がオフでも、一度だけプロンプトを改善 |

`/imp-force` は内部マーカー付きでテキストを prompt フックに再送します。オン/オフとスキップ規則を無視しますが、安全チェックはすべて維持します。マーカーはモデルにも履歴にも送られません。

## 設定

コマンドはセッションごとに設定を保存します。プラグインオプションはグローバルにも設定できます：

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

| オプション | 既定値 | 意味 |
| --- | --- | --- |
| `mode` | `deterministic` | `deterministic`（モデル呼び出しなし）または `llm`（フォールバック付き書き換え） |
| `model` | none | `llm` に必須：`{ providerID, id, variant? }` |
| `maxGrowth` | `0.4` | 出力長の最大増加率、0–1 |
| `skipCommands` | `true` | `/` で始まるプロンプトをスキップ |
| `skipDetailed` | `true` | 長いまたは既に構造化されたプロンプトをスキップ |
| `detailedThreshold` | `2000` | 長いと判定する文字数 |
| `llmTimeoutMs` | `20000` | モデル呼び出しのタイムアウト（ミリ秒） |

## 仕組み

- 受付時に 1 つの `prompt` フックが動き、`text` と `metadata.displayText` を更新します。会話にはモデルが受け取る内容が表示されます。

- 決定論的クリーンアップは不可視文字、連続スペース、空行を除き、コード、メンション、アンカーを保持します。

- `llm` モードではまず `ctx.experimental.generate.text` を呼びます。送るのはテキストと指示のみで、OpenCode のシステムプロンプトは含みません。一時セッションがフォールバックです。

- 指示は 3 行（`Кто:` / `Задача:` / `Важно:`）と Qwen3 向けの `/no_think` を求めます。`@メンション` を含むプロンプトは LLM をスキップします。

## 安全性

- パス、URL、数値、識別子、バッククォート内の文字列、`@メンション` はすべて保持する必要があります。新規追加は拒否します。

- 出力は入力より最大 40% 長くできます。

- コードブロックは一切変更しません。インラインコードの変更は編集全体を拒否します。

- 元のテキストの 10% 以上を失う書き換えは拒否します。

- 既定では空のプロンプト、`/コマンド`、`*` で始まるもの、2000 文字超をスキップします。メンション位置は再計算され、不可能ならプロンプトは変更されません。

## クォータ保護

成功した書き換えはキャッシュされ、同じプロンプトとモデルなら再リクエストしません。

無料上限やレート制限のエラーで 6 時間の一時停止が始まり、その間は決定論的クリーンアップのみ動作します。

`/imp-model off` はモデル呼び出しなしでクリーンアップを維持し、`/imp-off` はプラグインを完全に無効化します。

## ローカルモデル

ローカルモデルならアカウントのクォータを使いません。llama.cpp はコンテキストと VRAM を細かく制御でき、Ollama は 1 コマンドで起動できます。

### llama.cpp（16K コンテキスト）

バイナリをインストールし、`Qwen3-8B-Q4_K_M`（約 5 GB）をダウンロードして OpenAI 互換サーバーを起動します。Hugging Face が切断した場合は ModelScope を使います。

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

既存の `plugins` エントリを残したまま、サーバーを OpenCode のグローバル設定に登録します：

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

`/reload` を実行し、このプラグインでモデルを選択します：

```text
/imp-model llamacpp/qwen3-8b
```

### Ollama

[Ollama](https://ollama.com) をインストールして起動し、モデルを取得します。OpenCode は `http://127.0.0.1:11434` を自動検出します。

```sh
ollama serve
ollama pull qwen3:8b
```

```text
/imp-model ollama/qwen3:8b
```

| オプション | 向いている用途 | トレードオフ |
| --- | --- | --- |
| llama.cpp | 明示的な 16K コンテキストと VRAM 調整 | サーバー起動コマンドと設定項目が 1 つ増える |
| Ollama | 最短の導入と自動検出 | 低レベル設定が少ない |

8 GB カードなら 8K–16K コンテキストで十分です。128K にははるかに大きな VRAM が必要です。

## トラブルシューティング

| 症状 | 対処 |
| --- | --- |
| `opencode plugin list` にプラグインが出ない | 再インストールし GitHub アクセスを確認します。プライベートフォークでは認証付き URL を使ってください。 |
| コマンドは動くが通知が出ない | プラグインをグローバル設定に入れ、`/reload` を実行します。 |
| `llm` モードで何も変わらない | `/imp-model status` を確認し、`/imp-models` と `/imp-model プロバイダー/id#バリアント` で別のモデルを選びます。`@メンション` を外します。 |
| `/imp-models` にローカルモデルが出ない | `llama-server.exe` をポート 8080 で、`ollama serve` を起動したままにして `/reload` します。 |
| 会話に元のテキストが表示される | `/reload` を実行し、サーバー側が現在のコードを読み込むようにします。 |

ログ：`~/.local/share/opencode/log/opencode.log`。再現時は `OPENCODE_LOG_LEVEL=DEBUG` を設定します。

## 開発

```sh
git clone https://github.com/ASTRO-CLOU/opencode-prompt-improvement.git
cd opencode-prompt-improvement
npm install
npm run check
```

`npm run check` はテスト、型チェック、GUI ビルドを実行します。テストには Node 22.18+ が必要で、`node --test` が TypeScript を直接実行します。

## ライセンス

MIT。[LICENSE](LICENSE) を参照してください。
