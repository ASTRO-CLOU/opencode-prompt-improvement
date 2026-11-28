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

Un plugin OpenCode che migliora il prompt prima che raggiunga il modello. Scrivi un messaggio breve; la conversazione riceve una versione più pulita e strutturata. Modello e interfaccia mostrano esattamente il testo riscritto.

**Compatibilità:** OpenCode V2, testato su 2.3.2+ con API plugin 2.4.2. Node.js 22.18+ solo per la compilazione dai sorgenti. Nessuna telemetria; la modalità deterministica non richiede account.

## Requisiti

- OpenCode V2 (2.3.2 o successivo).
- Node.js 22.18+ solo se compili dai sorgenti.
- Facoltativo: un modello per la fase LLM (llama.cpp/Ollama locale o qualsiasi provider OpenCode).

## Installazione

Installa da GitHub:

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement
```

```jsonc title="opencode.jsonc"
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"]
}
```

Esegui `/reload` in OpenCode dopo l'installazione. Per fissare una versione: `github:ASTRO-CLOU/opencode-prompt-improvement#v0.0.1`.

## Comandi

Tutti i comandi rispondono con notifiche e non avviano mai un agente.

| Comando | Descrizione |
| --- | --- |
| `/imp-status` | Mostra stato, modalità, modello e quota |
| `/imp-on` / `/imp-off` | Attiva o disattiva il miglioramento |
| `/imp-models [filter]` | Elenca i modelli disponibili per questo plugin |
| `/imp-model [provider/id#variant]` | Scegli modello e variante; `status` mostra quello attuale |
| `/imp-model off` | Mantieni la pulizia, disattiva le chiamate al modello |
| `/imp-force <prompt>` | Migliora un prompt una volta, anche se il miglioramento è disattivato |
| `/imp-config [chiave valore]` | Mostra o modifica le impostazioni a runtime |

`/imp-config` mostra i valori correnti, modifica un'impostazione o azzera tutte le sovrascritture con `reset`. Usa `clear` come valore per rimuovere una singola sovrascrittura. Chiavi: `mode`, `model`, `maxGrowth`, `skipCommands`, `skipDetailed`, `detailedThreshold`, `llmTimeoutMs`.

`/imp-force` reinvia il testo attraverso l'hook con un marcatore interno. Ignora l'interruttore e le regole di salto, ma mantiene tutti i controlli di sicurezza. Il marcatore non raggiunge mai il modello né la cronologia.

## Configurazione

I comandi salvano le impostazioni per sessione. Le opzioni possono anche essere impostate globalmente:

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

| Opzione | Predefinito | Significato |
| --- | --- | --- |
| `mode` | `deterministic` | `deterministic` (nessuna chiamata al modello) o `llm` (riscrittura con fallback) |
| `model` | none | Obbligatorio per `llm`: `{ providerID, id, variant? }` |
| `maxGrowth` | `0.4` | Crescita massima della lunghezza, 0–1 |
| `skipCommands` | `true` | Salta i prompt che iniziano con `/` |
| `skipDetailed` | `true` | Salta prompt lunghi o già strutturati |
| `detailedThreshold` | `2000` | Numero di caratteri considerato lungo |
| `llmTimeoutMs` | `20000` | Timeout della chiamata al modello, in millisecondi |

## Come funziona

- Un hook `prompt` agisce all'ingresso e aggiorna `text` e `metadata.displayText`; la conversazione mostra esattamente ciò che riceve il modello.

- La pulizia deterministica rimuove caratteri invisibili, spazi e righe vuote ripetuti, preservando codice, menzioni e ancoraggi.

- In modalità `llm` viene chiamato prima `ctx.experimental.generate.text`: solo il tuo testo e l'istruzione, senza il prompt di sistema di OpenCode. Una sessione temporanea è il fallback.

- L'istruzione interna chiede tre righe con intestazioni localizzate: `Кто: / Задача: / Важно:` per input in russo, `Who: / Task: / Important:` per le altre lingue e `/no_think` per Qwen3. I prompt con `@menzioni` saltano la fase LLM.

## Sicurezza

- Ogni percorso, URL, numero, identificatore, frammento tra backtick e `@menzione` deve sopravvivere. I nuovi sono rifiutati.

- L'output può essere al massimo il 40% più lungo dell'input.

- I blocchi di codice non vengono toccati; modificare codice inline rifiuta la modifica.

- Una riscrittura che perde oltre il 10% del testo originale viene rifiutata.

- Per impostazione predefinita vengono saltati prompt vuoti, `/comandi`, prefisso `*` e testi oltre 2000 caratteri. Gli offset delle menzioni vengono ricalcolati, altrimenti il prompt resta invariato.

## Protezione della quota

Le riscritture riuscite sono memorizzate nella cache: stesso prompt e stesso modello riutilizzano il risultato senza nuova chiamata.

Un errore di limite o frequenza avvia una pausa di 6 ore; durante la pausa funziona solo la pulizia deterministica.

`/imp-model off` mantiene la pulizia senza chiamate al modello; `/imp-off` disattiva completamente il plugin.

## Modelli locali

Un modello locale non consuma la quota dell'account. llama.cpp offre controllo preciso su contesto e VRAM; Ollama è l'opzione con un solo comando.

### llama.cpp (contesto 16K)

Installa i binari, scarica `Qwen3-8B-Q4_K_M` (~5 GB) e avvia il server compatibile con OpenAI. Se Hugging Face interrompe la connessione, viene usato ModelScope.

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

Registra il server nella configurazione globale di OpenCode, mantenendo la voce `plugins` esistente:

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

Esegui `/reload`, poi scegli il modello in questo plugin:

```text
/imp-model llamacpp/qwen3-8b
```

### Ollama

Installa [Ollama](https://ollama.com), avviala e scarica un modello. OpenCode la rileva automaticamente su `http://127.0.0.1:11434`.

```sh
ollama serve
ollama pull qwen3:8b
```

```text
/imp-model ollama/qwen3:8b
```

| Opzione | Ideale per | Compromesso |
| --- | --- | --- |
| llama.cpp | contesto 16K e regolazione VRAM espliciti | un comando server più una voce di configurazione |
| Ollama | setup più rapido e rilevamento automatico | meno opzioni di basso livello |

Su una scheda da 8 GB, un contesto 8K–16K è sufficiente. 128K richiede molta più VRAM.

## Risoluzione problemi

| Sintomo | Soluzione |
| --- | --- |
| Plugin assente in `opencode plugin list` | Ripeti l'installazione e controlla l'accesso a GitHub; per un fork privato usa un URL autenticato. |
| I comandi funzionano, nessuna notifica | Metti il plugin nella configurazione globale ed esegui `/reload`. |
| La modalità `llm` non cambia nulla | Controlla `/imp-model status`; scegli un altro modello con `/imp-models` e `/imp-model provider/id#variante`. Rimuovi le `@menzioni`. |
| Modello locale assente in `/imp-models` | Lascia `llama-server.exe` sulla porta 8080 o `ollama serve` in esecuzione, poi `/reload`. |
| La conversazione mostra il testo originale | Esegui `/reload` affinché la parte server prenda il codice attuale. |

Log: `~/.local/share/opencode/log/opencode.log`. Per una riproduzione usa `OPENCODE_LOG_LEVEL=DEBUG`.

## Sviluppo

```sh
git clone https://github.com/ASTRO-CLOU/opencode-prompt-improvement.git
cd opencode-prompt-improvement
npm install
npm run check
```

`npm run check` esegue test, controllo dei tipi e build della GUI. I test richiedono Node 22.18+ ed eseguono TypeScript direttamente con `node --test`.

## Licenza

MIT. Vedi [LICENSE](LICENSE).
