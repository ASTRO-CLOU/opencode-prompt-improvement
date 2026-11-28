# opencode-prompt-improvement

[![CI](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml/badge.svg)](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/ASTRO-CLOU/opencode-prompt-improvement)](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenCode V2](https://img.shields.io/badge/OpenCode-V2-7C3AED)](https://opencode.ai)

[English](README.md) | [Русский](README.ru.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [Italiano](README.it.md) | [中文](README.zh.md) | 日本語 | [한국어](README.ko.md) | [العربية](README.ar.md) | [हिन्दी](README.hi.md)

プロンプトを**送信した瞬間**に改善する OpenCode V2 プラグインです。短い文章を入力すると、モデルにはより整理された版が届きます。改善後のテキストはセッション履歴に保存されるため、実際に送信された内容を確認できます。

事実・要件・例・見出しを捏造しません。デフォルトでは**モデルのトークンを一切消費しません**。必要なら別の安価なモデルで最終調整できますが、セッションのメインモデルは改善に使われません。

## デモ

```text
入力:
  "ログインのバグを直す テストも追加 apiも確認"

モデルが受け取る:
  - ログインのバグを直す
  - テストを追加
  - apiを確認
```

## 特徴

- リアルタイムのプロンプトフック：モデル到達前に改善。
- デフォルトは安全：モデル呼び出しなしの決定的な整形。
- LLM 調整は明示的に選んだモデルがある場合のみ。
- 新しい事実、要件、手順、例、見出し、翻訳を追加しません。
- コード、URL、パス、数値、識別子、`@メンション` を保持。
- コマンド、極端に短いプロンプト、コード中心、既に構造化されたものはスキップ。
- 現在／ recent セッションのコンテキストは用語参照のみに利用。
- TUI のステータスバッジと diff・履歴・統計パネル。
- スラッシュコマンド、永続設定、ローカルキャッシュ。
- 高速：安全モードは即時、LLM モードは 3.5 秒タイムアウトとキャッシュ付き。

## インストール

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement
```

バージョン固定：

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement#v1.0.7
```

または `opencode.json(c)` に追加：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"]
}
```

反映されない場合は `/reload` を実行してください。

## モード

| モード | 動作 | トークン |
| --- | --- | --- |
| `auto`（既定） | 安全な整形。モデル選択時のみ LLM | モデルなしで 0 |
| `safe` | 決定的な整形のみ | 0 |
| `llm` | モデル必須。失敗時は safe にフォールバック | 選択モデルのみ少量 |

`/refine-model provider/id` でモデルを選択します。モデルがなければ `auto` も `llm` も 0 トークンです。

`context` は既定で `off`。`session` は現在セッションの直近ユーザーメッセージ、`recent` は同プロジェクトの直近セッションも使います。切り詰められ、事実は追加されません。

## コマンド

| コマンド | 説明 |
| --- | --- |
| `/refine` | ステータスとパネル |
| `/refine-on`, `/refine-off` | 有効／無効 |
| `/refine-status` | 現在の設定 |
| `/refine-mode <auto\|safe\|llm>` | モード変更 |
| `/refine-model [provider/id\|off]` | モデルの選択／解除 |
| `/refine-models [filter]` | モデル一覧 |
| `/refine-context <off\|session\|recent>` | コンテキスト範囲 |
| `/improve <text>` | Restructure with the selected model when available, otherwise apply deterministic improvement, and send the result |
| `/refine-preview <text>` | 送信せずにプレビュー |
| `/refine-last` | 直近の改善 |
| `/refine-history` | 履歴 |
| `/refine-stats` | カウンタとトークン推定 |
| `/refine-reset` | 設定と履歴をリセット |
| `/refine-help` | コマンド一覧 |

コマンドの返信は通知のみで、エージェントは起動しません。

## TUI

入力欄フッターに `✦ refine on · auto · none` を表示。パネルには Status、Last diff、History、Stats の 4 タブがあります。

キー：`1`–`4` タブ、`j`/`k` スクロール、`r` 更新、`m` モデル選択、`t` 切り替え、`Esc` 閉じる。

## 安全性

- 元の単語はすべて残ります。LLM が追加できるのは機能語のみです。
- すべてのアンカー（コード、URL、パス、数値、識別子、メンション）が一致する必要があります。
- 既定の長さ増加は 25% まで。
- エラー・タイムアウト・不正出力時は safe、さらに原文へフォールバック。
- メンションとオフセットを含むプロンプトは添付物保護のためスキップ。
- フックは `try/catch` で覆われ、プラグインエラーで送信は止まりません。

詳細：[docs/SAFETY.md](docs/SAFETY.md)。

## 設定

```json
{
  "enabled": true, "mode": "auto", "model": null, "context": "off",
  "maxGrowth": 0.25, "timeoutMs": 3500, "minLength": 12, "maxLength": 8000,
  "skipStructured": true, "historyEnabled": true, "historyLimit": 50,
  "showToast": true, "locale": "en"
}
```

全項目：[docs/CONFIGURATION.md](docs/CONFIGURATION.md)。

## プライバシー

改善はローカルで行われます。安全モードでは何も送信しません。モデル選択時も、送られるのはプロンプト本文と任意の切り詰めコンテキストのみです。

## トラブルシューティング

- **バッジやコマンドが出ない：** `/reload` 後 `opencode plugin list`。
- **何も変わらない：** 短すぎる、コマンド、コード中心、既に構造化済みなどは仕様です。
- **LLM が動かない：** `/refine-model` でモデルを選んでください。

## 開発

```sh
npm install
npm run check
npm pack --dry-run
```

アーキテクチャ：[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

## ライセンス

MIT © 2026 ASTRO-CLOU。[LICENSE](LICENSE) を参照。
