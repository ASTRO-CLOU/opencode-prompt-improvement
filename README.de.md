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

Ein OpenCode-Plugin, das deinen Prompt vor dem Senden an das Modell verbessert. Du schreibst eine kurze Nachricht; die Unterhaltung erhält eine sauberere, strukturierte Version. Modell und Oberfläche zeigen genau den umgeschriebenen Text.

**Kompatibilität:** OpenCode V2, getestet mit 2.3.2+ und Plugin-API 2.4.2. Node.js 22.18+ nur für den Build aus Quellen. Keine Telemetrie; der deterministische Modus braucht kein Konto.

## Voraussetzungen

- OpenCode V2 (2.3.2 oder neuer).
- Node.js 22.18+ nur für den Build aus Quellen.
- Optional: ein Modell für den LLM-Durchlauf (lokales llama.cpp/Ollama oder ein OpenCode-Provider).

## Installation

Installation über GitHub:

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement
```

```jsonc title="opencode.jsonc"
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"]
}
```

Danach `/reload` in OpenCode ausführen. Für eine feste Version: `github:ASTRO-CLOU/opencode-prompt-improvement#v0.0.1`.

## Befehle

Alle Befehle antworten über Benachrichtigungen und starten keinen Agenten.

| Befehl | Beschreibung |
| --- | --- |
| `/imp-status` | Zustand, Modus, Modell und Kontingent anzeigen |
| `/imp-on` / `/imp-off` | Verbesserung ein- oder ausschalten |
| `/imp-models [filter]` | Für das Plugin verfügbare Modelle auflisten |
| `/imp-model [provider/id#variant]` | Modell und Variante wählen; `status` zeigt das aktuelle |
| `/imp-model off` | Bereinigung behalten, Modellaufrufe deaktivieren |
| `/imp-force <prompt>` | Einen Prompt einmal verbessern, auch wenn die Verbesserung aus ist |

`/imp-force` schickt deinen Text mit einer internen Markierung erneut durch den Prompt-Hook. Der Schalter und die Überspringregeln werden ignoriert, alle Sicherheitsprüfungen bleiben. Die Markierung erreicht weder Modell noch Verlauf.

## Konfiguration

Die Befehle speichern Einstellungen pro Sitzung. Plugin-Optionen lassen sich auch global setzen:

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

| Option | Standard | Bedeutung |
| --- | --- | --- |
| `mode` | `deterministic` | `deterministic` (keine Modellaufrufe) oder `llm` (Umschreiben mit Fallback) |
| `model` | none | Für `llm` erforderlich: `{ providerID, id, variant? }` |
| `maxGrowth` | `0.4` | Maximales Längenwachstum, 0–1 |
| `skipCommands` | `true` | Prompts überspringen, die mit `/` beginnen |
| `skipDetailed` | `true` | Lange oder bereits strukturierte Prompts überspringen |
| `detailedThreshold` | `2000` | Zeichenanzahl, die als lang gilt |
| `llmTimeoutMs` | `20000` | Zeitüberschreitung des Modellaufrufs in Millisekunden |

## So funktioniert es

- Ein `prompt`-Hook läuft bei der Annahme und aktualisiert `text` und `metadata.displayText`; die Unterhaltung zeigt genau das, was das Modell erhält.

- Die deterministische Bereinigung entfernt unsichtbare Zeichen, doppelte Leerzeichen und Leerzeilen und erhält Code, Erwähnungen und Anker.

- Im Modus `llm` wird zuerst `ctx.experimental.generate.text` aufgerufen: nur dein Text und die Anweisung, ohne OpenCode-Systemprompt. Eine temporäre Sitzung ist der Fallback.

- Die Anweisung verlangt drei Zeilen (`Кто:` / `Задача:` / `Важно:`) und `/no_think` für Qwen3. Prompts mit `@Erwähnungen` überspringen den LLM-Durchlauf.

## Sicherheit

- Jeder Pfad, jede URL, Zahl, Kennung, Backtick-Folge und `@Erwähnung` muss erhalten bleiben. Neue werden abgelehnt.

- Die Ausgabe darf höchstens 40 % länger als die Eingabe sein.

- Codeblöcke bleiben unberührt; Änderungen an Inline-Code verwerfen die Bearbeitung.

- Ein Ergebnis, das mehr als 10 % des Originals verliert, wird abgelehnt.

- Standardmäßig werden leere Prompts, `/Befehle`, `*` und Texte über 2000 Zeichen übersprungen. Erwähnungs-Offsets werden neu zugeordnet, sonst bleibt der Prompt unverändert.

## Kontingentschutz

Erfolgreiche Umschreibungen werden zwischengespeichert: derselbe Prompt und dasselbe Modell brauchen keinen erneuten Aufruf.

Ein Limit- oder Ratenfehler startet eine 6-stündige Pause; in dieser Pause läuft nur die deterministische Bereinigung.

`/imp-model off` behält die Bereinigung ohne Modellaufrufe, `/imp-off` deaktiviert das Plugin vollständig.

## Lokale Modelle

Ein lokales Modell verbraucht kein Kontingent. llama.cpp gibt volle Kontrolle über Kontext und VRAM; Ollama ist die Ein-Befehl-Variante.

### llama.cpp (16K-Kontext)

Binaries installieren, `Qwen3-8B-Q4_K_M` (~5 GB) herunterladen und den OpenAI-kompatiblen Server starten. Wenn Hugging Face die Verbindung zurücksetzt, wird ModelScope verwendet.

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

Den Server in die globale OpenCode-Konfiguration eintragen und den vorhandenen `plugins`-Eintrag behalten:

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

`/reload` ausführen, dann das Modell im Plugin wählen:

```text
/imp-model llamacpp/qwen3-8b
```

### Ollama

[Ollama](https://ollama.com) installieren, starten und ein Modell laden. OpenCode erkennt sie automatisch unter `http://127.0.0.1:11434`.

```sh
ollama serve
ollama pull qwen3:8b
```

```text
/imp-model ollama/qwen3:8b
```

| Option | Gut für | Kompromiss |
| --- | --- | --- |
| llama.cpp | expliziter 16K-Kontext und VRAM-Tuning | ein Serverbefehl plus Konfigurationseintrag |
| Ollama | schnellste Einrichtung und Auto-Discovery | weniger Low-Level-Optionen |

Auf einer 8-GB-Karte reicht 8K–16K Kontext. 128K braucht deutlich mehr VRAM.

## Fehlerbehebung

| Symptom | Lösung |
| --- | --- |
| Plugin fehlt in `opencode plugin list` | Installation wiederholen und GitHub-Zugriff prüfen; für private Forks eine authentifizierte URL verwenden. |
| Befehle funktionieren, keine Toasts | Plugin in die globale Konfiguration eintragen und `/reload` ausführen. |
| LLM-Modus ändert nichts | `/imp-model status` prüfen; anderes Modell über `/imp-models` und `/imp-model provider/id#variant` wählen. `@Erwähnungen` entfernen. |
| Lokales Modell fehlt in `/imp-models` | `llama-server.exe` auf Port 8080 oder `ollama serve` laufen lassen, dann `/reload`. |
| Verlauf zeigt den Originaltext | `/reload` ausführen, damit der Serverteil den aktuellen Code übernimmt. |

Logs: `~/.local/share/opencode/log/opencode.log`. Für ein Repro `OPENCODE_LOG_LEVEL=DEBUG` setzen.

## Entwicklung

```sh
git clone https://github.com/ASTRO-CLOU/opencode-prompt-improvement.git
cd opencode-prompt-improvement
npm install
npm run check
```

`npm run check` führt Tests, Typprüfung und GUI-Build aus. Tests benötigen Node 22.18+ und führen TypeScript direkt über `node --test` aus.

## Lizenz

MIT. Siehe [LICENSE](LICENSE).
