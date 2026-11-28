# opencode-prompt-improvement

[![CI](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml/badge.svg)](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/ASTRO-CLOU/opencode-prompt-improvement)](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenCode V2](https://img.shields.io/badge/OpenCode-V2-7C3AED)](https://opencode.ai)

[English](README.md) | [Русский](README.ru.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | Italiano | [中文](README.zh.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [हिन्दी](README.hi.md)

Plugin OpenCode V2 che migliora un prompt **al momento dell'invio**. Scrivi un messaggio breve; il modello riceve una versione più pulita e meglio strutturata. Il testo migliorato viene salvato nella cronologia della sessione, quindi vedi esattamente cosa è stato inviato.

Il plugin non inventa fatti, requisiti, esempi o intestazioni. Per impostazione predefinita **non consuma token del modello**. Puoi scegliere un modello economico separato per una rifinitura finale; il modello principale della sessione non viene mai usato.

## Demo

```text
Scrivi:
  "correggi bug login aggiungi anche test e controlla api"

Il modello riceve:
  - correggi bug login
  - aggiungi test
  - controlla api
```

## Funzionalità

- Hook del prompt in tempo reale: miglioramento prima di raggiungere il modello.
- Sicuro per impostazione predefinita: pulizia deterministica senza chiamate al modello.
- Rifinitura LLM opzionale solo con un modello scelto esplicitamente.
- Nessun nuovo fatto, requisito, passaggio, esempio, intestazione o traduzione.
- Conserva codice, URL, percorsi, numeri, identificatori e `@menzioni`.
- Salta comandi, prompt molto brevi, con molto codice o già strutturati.
- Contesto della sessione corrente o recenti solo come riferimento terminologico.
- Badge nella TUI e pannello con diff, cronologia e statistiche.
- Comandi slash, impostazioni persistenti e cache locale.
- Veloce: modalità sicura istantanea; modalità LLM con timeout di 3,5 s e cache.

## Installazione

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement
```

Fissa una versione:

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement#v1.0.7
```

Oppure in `opencode.json(c)`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"]
}
```

Se non si applica, esegui `/reload`.

## Modalità

| Modalità | Comportamento | Token |
| --- | --- | --- |
| `auto` (predefinita) | Pulizia sicura; LLM solo se è scelto un modello | 0 senza modello |
| `safe` | Solo pulizia deterministica | 0 |
| `llm` | Richiede un modello; ricade su safe in caso di errore | Pochi, del modello scelto |

Scegli con `/refine-model fornitore/id`. Senza modello, anche `auto` e `llm` spendono 0 token.

`context` è `off` per impostazione predefinita. `session` usa gli ultimi messaggi della sessione; `recent` aggiunge le sessioni recenti del progetto. Il contesto è limitato e non aggiunge mai fatti.

## Comandi

| Comando | Descrizione |
| --- | --- |
| `/refine` | Stato e pannello |
| `/refine-on`, `/refine-off` | Attiva/disattiva |
| `/refine-status` | Impostazioni attuali |
| `/refine-mode <auto\|safe\|llm>` | Cambia modalità |
| `/refine-model [provider/id\|off]` | Scegli/rimuovi modello |
| `/refine-models [filter]` | Elenca modelli |
| `/refine-context <off\|session\|recent>` | Ambito del contesto |
| `/improve <text>` | Restructure with the selected model when available, otherwise apply deterministic improvement, and send the result |
| `/refine-preview <text>` | Anteprima senza invio |
| `/refine-last` | Ultimo miglioramento |
| `/refine-history` | Cronologia |
| `/refine-stats` | Contatori e token stimati |
| `/refine-reset` | Reimposta impostazioni e cronologia |
| `/refine-help` | Elenco comandi |

Le risposte sono notifiche; non avviano un agente.

## TUI

Badge: `✦ refine on · auto · none`. Il pannello ha quattro schede: Status, Last diff, History, Stats.

Tasti: `1`–`4` schede, `j`/`k` scorrimento, `r` aggiorna, `m` scegli modello, `t` alterna, `Esc` chiude.

## Sicurezza

- Tutte le parole originali devono restare; l'LLM può aggiungere solo parole funzionali.
- Tutte le ancore (codice, URL, percorsi, numeri, identificatori, menzioni) devono corrispondere.
- Crescita limitata al 25% per impostazione predefinita.
- Qualsiasi errore, timeout o risposta non valida → ritorno a safe, poi all'originale.
- I prompt con menzioni e offset vengono saltati per proteggere gli allegati.
- L'hook è protetto da `try/catch`: un errore del plugin non blocca mai l'invio.

Vedi [docs/SAFETY.md](docs/SAFETY.md).

## Configurazione

```json
{
  "enabled": true, "mode": "auto", "model": null, "context": "off",
  "maxGrowth": 0.25, "timeoutMs": 3500, "minLength": 12, "maxLength": 8000,
  "skipStructured": true, "historyEnabled": true, "historyLimit": 50,
  "showToast": true, "locale": "en"
}
```

Tutte le opzioni: [docs/CONFIGURATION.md](docs/CONFIGURATION.md).

## Privacy

Il miglioramento è locale. La modalità sicura non invia nulla. Con un modello scelto, solo il testo e un contesto opzionale troncato vanno al provider tramite OpenCode.

## Risoluzione problemi

- **Nessun badge o comando:** `/reload` e `opencode plugin list`.
- **Nulla cambia:** prompt breve, comando, con codice o già strutturato — è intenzionale.
- **LLM non parte:** scegli un modello con `/refine-model`.

## Sviluppo

```sh
npm install
npm run check
npm pack --dry-run
```

Architettura: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Licenza

MIT © 2026 ASTRO-CLOU. Vedi [LICENSE](LICENSE).
