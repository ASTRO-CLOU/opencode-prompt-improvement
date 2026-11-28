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

Un plugin OpenCode qui améliore votre prompt avant qu'il n'atteigne le modèle. Vous écrivez un message court ; la conversation reçoit une version plus propre et structurée. Le modèle et l'interface affichent exactement le texte réécrit.

**Compatibilité :** OpenCode V2, testé sur 2.3.2+ avec l'API plugin 2.4.2. Node.js 22.18+ uniquement pour compiler depuis les sources. Aucune télémétrie ; le mode déterministe ne nécessite pas de compte.

## Prérequis

- OpenCode V2 (2.3.2 ou supérieur).
- Node.js 22.18+ uniquement si vous compilez depuis les sources.
- Facultatif : un modèle pour la phase LLM (llama.cpp/Ollama local ou tout fournisseur OpenCode).

## Installation

Installer depuis GitHub :

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement
```

```jsonc title="opencode.jsonc"
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"]
}
```

Exécutez `/reload` dans OpenCode après l'installation. Pour épingler une version : `github:ASTRO-CLOU/opencode-prompt-improvement#v0.0.1`.

## Commandes

Toutes les commandes répondent par des notifications et ne lancent jamais d'agent.

| Commande | Description |
| --- | --- |
| `/imp-status` | Afficher l'état, le mode, le modèle et le quota |
| `/imp-on` / `/imp-off` | Activer ou désactiver l'amélioration |
| `/imp-models [filter]` | Lister les modèles disponibles pour ce plugin |
| `/imp-model [provider/id#variant]` | Choisir un modèle et une variante ; `status` affiche l'actuel |
| `/imp-model off` | Garder le nettoyage, désactiver les appels au modèle |
| `/imp-force <prompt>` | Améliorer un prompt une fois, même si l'amélioration est désactivée |

`/imp-force` renvoie votre texte dans le hook avec un marqueur interne. Il ignore l'interrupteur et les règles d'omission, mais conserve toutes les vérifications de sécurité. Le marqueur n'atteint jamais le modèle ni l'historique.

## Configuration

Les commandes enregistrent les réglages par session. Les options peuvent aussi être définies globalement :

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

| Option | Valeur par défaut | Signification |
| --- | --- | --- |
| `mode` | `deterministic` | `deterministic` (aucun appel modèle) ou `llm` (réécriture avec repli) |
| `model` | none | Obligatoire pour `llm` : `{ providerID, id, variant? }` |
| `maxGrowth` | `0.4` | Croissance maximale de la longueur, 0–1 |
| `skipCommands` | `true` | Ignorer les prompts commençant par `/` |
| `skipDetailed` | `true` | Ignorer les prompts longs ou déjà structurés |
| `detailedThreshold` | `2000` | Nombre de caractères considéré comme long |
| `llmTimeoutMs` | `20000` | Délai d'attente de l'appel au modèle, en millisecondes |

## Fonctionnement

- Un hook `prompt` s'exécute à l'admission et met à jour `text` et `metadata.displayText` ; la conversation affiche exactement ce que reçoit le modèle.

- Le nettoyage déterministe supprime les caractères invisibles, les espaces et lignes vides répétés, et préserve le code, les mentions et les ancres.

- En mode `llm`, `ctx.experimental.generate.text` est appelé en premier : seulement votre texte et l'instruction, sans le prompt système d'OpenCode. Une session temporaire sert de repli.

- L'instruction demande trois lignes (`Кто:` / `Задача:` / `Важно:`) et `/no_think` pour Qwen3. Les prompts avec `@mentions` ignorent la phase LLM.

## Sécurité

- Tous les chemins, URL, nombres, identifiants, fragments entre backticks et `@mentions` doivent survivre. Les nouveaux sont rejetés.

- La sortie peut être au maximum 40 % plus longue que l'entrée.

- Les blocs de code ne sont jamais touchés ; modifier du code en ligne rejette la modification.

- Une réécriture qui perd plus de 10 % du texte d'origine est rejetée.

- Par défaut, les prompts vides, les `/commandes`, le préfixe `*` et les textes de plus de 2000 caractères sont ignorés. Les décalages des mentions sont recalculés, sinon le prompt reste inchangé.

## Protection du quota

Les réécritures réussies sont mises en cache : le même prompt et le même modèle réutilisent le résultat sans nouvel appel.

Une erreur de limite ou de débit déclenche une pause de 6 heures ; pendant cette pause, seul le nettoyage déterministe s'exécute.

`/imp-model off` garde le nettoyage sans appels au modèle ; `/imp-off` désactive complètement le plugin.

## Modèles locaux

Un modèle local évite de consommer le quota du compte. llama.cpp offre un contrôle précis du contexte et de la VRAM ; Ollama se lance en une commande.

### llama.cpp (contexte 16K)

Installez les binaires, téléchargez `Qwen3-8B-Q4_K_M` (~5 Go) et démarrez le serveur compatible OpenAI. Si Hugging Face coupe la connexion, ModelScope est utilisé.

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

Enregistrez le serveur dans la configuration globale d'OpenCode, en conservant votre entrée `plugins` :

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

Exécutez `/reload`, puis choisissez le modèle dans ce plugin :

```text
/imp-model llamacpp/qwen3-8b
```

### Ollama

Installez [Ollama](https://ollama.com), démarrez-la et téléchargez un modèle. OpenCode la détecte automatiquement sur `http://127.0.0.1:11434`.

```sh
ollama serve
ollama pull qwen3:8b
```

```text
/imp-model ollama/qwen3:8b
```

| Option | Idéal pour | Compromis |
| --- | --- | --- |
| llama.cpp | contexte 16K et réglage VRAM explicites | une commande de serveur plus une entrée de configuration |
| Ollama | installation la plus rapide et détection automatique | moins de réglages bas niveau |

Sur une carte 8 Go, un contexte 8K–16K suffit. 128K demande beaucoup plus de VRAM.

## Dépannage

| Symptôme | Solution |
| --- | --- |
| Plugin absent de `opencode plugin list` | Réinstallez et vérifiez l'accès GitHub ; pour un fork privé, utilisez une URL authentifiée. |
| Les commandes marchent, pas de notifications | Mettez le plugin dans la configuration globale et exécutez `/reload`. |
| Le mode `llm` ne change rien | Vérifiez `/imp-model status` ; choisissez un autre modèle avec `/imp-models` et `/imp-model fournisseur/id#variante`. Retirez les `@mentions`. |
| Modèle local absent de `/imp-models` | Gardez `llama-server.exe` sur le port 8080 ou `ollama serve` actif, puis `/reload`. |
| La conversation affiche le texte d'origine | Exécutez `/reload` pour que la partie serveur prenne le code actuel. |

Journaux : `~/.local/share/opencode/log/opencode.log`. Pour une reproduction : `OPENCODE_LOG_LEVEL=DEBUG`.

## Développement

```sh
git clone https://github.com/ASTRO-CLOU/opencode-prompt-improvement.git
cd opencode-prompt-improvement
npm install
npm run check
```

`npm run check` lance les tests, la vérification de types et la compilation de l'interface. Les tests nécessitent Node 22.18+ et exécutent TypeScript directement via `node --test`.

## Licence

MIT. Voir [LICENSE](LICENSE).
