# opencode-prompt-improvement

[![CI](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml/badge.svg)](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/ASTRO-CLOU/opencode-prompt-improvement)](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenCode V2](https://img.shields.io/badge/OpenCode-V2-7C3AED)](https://opencode.ai)

[English](README.md) | [Русский](README.ru.md) | [Español](README.es.md) | [Français](README.fr.md) | Deutsch | [Português](README.pt.md) | [Italiano](README.it.md) | [中文](README.zh.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [हिन्दी](README.hi.md)

OpenCode-V2-Plugin, der einen Prompt **beim Senden** verbessert. Sie schreiben eine kurze Nachricht; das Modell erhält eine sauberere, besser strukturierte Version. Der verbesserte Text wird im Sitzungsverlauf gespeichert, sodass Sie genau sehen, was gesendet wurde.

Der Plugin erfindet keine Fakten, Anforderungen, Beispiele oder Überschriften. Standardmäßig **verbraucht er keine Modell-Tokens**. Optional können Sie ein günstiges Extramodell für einen letzten Feinschliff wählen; das Hauptmodell der Sitzung wird nie verwendet.

## Demo

```text
Sie schreiben:
  "login-bug beheben auch tests hinzufügen und api prüfen"

Das Modell erhält:
  - login-bug beheben
  - tests hinzufügen
  - api prüfen
```

## Funktionen

- Echtzeit-Prompt-Hook: Verbesserung vor dem Erreichen des Modells.
- Sicherer Standard: deterministische Bereinigung ohne Modellaufrufe.
- Optionales LLM-Finschliff nur mit explizit gewähltem Modell.
- Keine neuen Fakten, Anforderungen, Schritte, Beispiele, Überschriften oder Übersetzungen.
- Erhaltung von Code, URLs, Pfaden, Zahlen, Bezeichnern und `@Erwähnungen`.
- Überspringt Befehle, sehr kurze, code-lastige oder bereits strukturierte Prompts.
- Kontext der aktuellen oder letzten Sitzungen nur als Begriffsreferenz.
- TUI-Indikator und Panel mit Diff, Verlauf und Statistik.
- Slash-Befehle, dauerhafte Einstellungen und lokaler Cache.
- Schnell: sicherer Modus sofort, LLM-Modus mit 3,5-s-Timeout und Cache.

## Installation

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement
```

An ein Release binden:

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement#v1.0.7
```

Oder in `opencode.json(c)`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"]
}
```

Falls nichts übernommen wird: `/reload`.

## Modi

| Modus | Verhalten | Tokens |
| --- | --- | --- |
| `auto` (Standard) | Sichere Bereinigung; LLM nur mit Modell | 0 ohne Modell |
| `safe` | Nur deterministische Bereinigung | 0 |
| `llm` | Benötigt Modell, bei Fehler Rückfall auf safe | Wenig, gewähltes Modell |

Modell wählen: `/refine-model anbieter/id`. Ohne Modell geben auch `auto` und `llm` 0 Tokens aus.

`context` ist standardmäßig `off`. `session` nutzt letzte Nachrichten der Sitzung, `recent` zusätzlich letzte Sitzungen des Projekts. Der Kontext ist begrenzt und liefert nie neue Fakten.

## Befehle

| Befehl | Beschreibung |
| --- | --- |
| `/refine` | Status und Panel |
| `/refine-on`, `/refine-off` | Aktivieren/deaktivieren |
| `/refine-status` | Aktuelle Einstellungen |
| `/refine-mode <auto\|safe\|llm>` | Modus wechseln |
| `/refine-model [provider/id\|off]` | Modell wählen/entfernen |
| `/refine-models [filter]` | Modelle auflisten |
| `/refine-context <off\|session\|recent>` | Kontextumfang |
| `/improve <text>` | Restructure with the selected model when available, otherwise apply deterministic improvement, and send the result |
| `/refine-preview <text>` | Vorschau ohne Senden |
| `/refine-last` | Letzte Verbesserung |
| `/refine-history` | Verlauf |
| `/refine-stats` | Zähler und Token-Schätzung |
| `/refine-reset` | Einstellungen und Verlauf zurücksetzen |
| `/refine-help` | Befehlsliste |

Antworten sind Benachrichtigungen und starten keinen Agenten.

## TUI

Indikator: `✦ refine on · auto · none`. Das Panel hat vier Tabs: Status, Last diff, History, Stats.

Tasten: `1`–`4` Tabs, `j`/`k` scrollen, `r` aktualisieren, `m` Modell wählen, `t` umschalten, `Esc` schließen.

## Sicherheit

- Alle ursprünglichen Wörter müssen bleiben; LLM darf nur Funktionswörter ergänzen.
- Alle Anker (Code, URLs, Pfade, Zahlen, Bezeichner, Erwähnungen) müssen übereinstimmen.
- Wachstum standardmäßig auf 25 % begrenzt.
- Jeder Fehler, Timeout oder ungültige Output → Rückfall auf safe, dann auf Original.
- Prompts mit Erwähnungen und Offsets werden übersprungen, um Anhänge zu schützen.
- Der Hook ist in `try/catch` gekapselt: ein Plugin-Fehler blockiert nie das Senden.

Siehe [docs/SAFETY.md](docs/SAFETY.md).

## Konfiguration

```json
{
  "enabled": true, "mode": "auto", "model": null, "context": "off",
  "maxGrowth": 0.25, "timeoutMs": 3500, "minLength": 12, "maxLength": 8000,
  "skipStructured": true, "historyEnabled": true, "historyLimit": 50,
  "showToast": true, "locale": "en"
}
```

Alle Optionen: [docs/CONFIGURATION.md](docs/CONFIGURATION.md).

## Privatsphäre

Die Verbesserung läuft lokal. Der sichere Modus sendet nichts. Mit gewähltem Modell werden nur Text und optional gekürzter Kontext über OpenCode an den Anbieter gesendet.

## Fehlerbehebung

- **Kein Indikator/Befehle:** `/reload`, dann `opencode plugin list`.
- **Nichts ändert sich:** kurzer Prompt, Befehl, code-lastig oder schon strukturiert — beabsichtigt.
- **LLM startet nicht:** Modell mit `/refine-model` wählen.

## Entwicklung

```sh
npm install
npm run check
npm pack --dry-run
```

Architektur: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Lizenz

MIT © 2026 ASTRO-CLOU. Siehe [LICENSE](LICENSE).
