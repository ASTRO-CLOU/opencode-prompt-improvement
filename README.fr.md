# opencode-prompt-improvement

[![CI](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml/badge.svg)](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/ASTRO-CLOU/opencode-prompt-improvement)](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenCode V2](https://img.shields.io/badge/OpenCode-V2-7C3AED)](https://opencode.ai)

[English](README.md) | [Русский](README.ru.md) | [Español](README.es.md) | Français | [Deutsch](README.de.md) | [Português](README.pt.md) | [Italiano](README.it.md) | [中文](README.zh.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [हिन्दी](README.hi.md)

Plugin OpenCode V2 qui améliore un prompt **au moment de l'envoi**. Vous écrivez un message court ; le modèle reçoit une version plus propre et mieux structurée. Le texte amélioré est enregistré dans l'historique de la session : vous voyez exactement ce qui a été envoyé.

Le plugin n'invente aucun fait, exigence, exemple ou titre. Par défaut, il **ne consomme aucun token de modèle**. Vous pouvez éventuellement choisir un modèle peu coûteux pour une dernière passe ; le modèle principal de la session n'est jamais utilisé.

## Démo

```text
Vous écrivez :
  "corrige le bug de login ajoute aussi des tests et vérifie l'api"

Le modèle reçoit :
  - corrige le bug de login
  - ajoute des tests
  - vérifie l'api
```

## Fonctionnalités

- Hook de prompt en temps réel : amélioration avant d'atteindre le modèle.
- Sûr par défaut : nettoyage déterministe sans appel de modèle.
- Polissage LLM optionnel, uniquement avec un modèle choisi explicitement.
- Aucun nouveau fait, exigence, étape, exemple, titre ou traduction.
- Préservation du code, des URL, chemins, nombres, identifiants et `@mentions`.
- Ignore les commandes, prompts très courts, très techniques ou déjà structurés.
- Contexte de la session courante ou récente uniquement comme référence terminologique.
- Badge TUI et panneau avec diff, historique et statistiques.
- Commandes slash, réglages persistants et cache local.
- Rapide : mode sûr instantané, mode LLM avec délai de 3,5 s et cache.

## Installation

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement
```

Épingler une version :

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement#v1.0.7
```

Ou dans `opencode.json(c)` :

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"]
}
```

Si rien ne change, lancez `/reload`.

## Modes

| Mode | Comportement | Tokens |
| --- | --- | --- |
| `auto` (défaut) | Nettoyage sûr ; LLM seulement si un modèle est choisi | 0 sans modèle |
| `safe` | Nettoyage déterministe uniquement | 0 |
| `llm` | Nécessite un modèle ; repli vers safe en cas d'échec | Peu, modèle choisi |

Choisissez avec `/refine-model fournisseur/id`. Sans modèle, même `auto` et `llm` dépensent 0 token.

`context` vaut `off` par défaut. `session` utilise les derniers messages de la session ; `recent` ajoute les sessions récentes du projet. Le contexte est tronqué et ne fournit jamais de nouveaux faits.

## Commandes

| Commande | Description |
| --- | --- |
| `/refine` | Statut et panneau |
| `/refine-on`, `/refine-off` | Activer/désactiver |
| `/refine-status` | Réglages actuels |
| `/refine-mode <auto\|safe\|llm>` | Changer de mode |
| `/refine-model [provider/id\|off]` | Choisir ou effacer le modèle |
| `/refine-models [filter]` | Liste des modèles |
| `/refine-context <off\|session\|recent>` | Portée du contexte |
| `/improve <text>` | Restructure with the selected model when available, otherwise apply deterministic improvement, and send the result |
| `/refine-preview <text>` | Aperçu sans envoi |
| `/refine-last` | Dernière amélioration |
| `/refine-history` | Historique |
| `/refine-stats` | Compteurs et tokens estimés |
| `/refine-reset` | Réinitialiser réglages et historique |
| `/refine-help` | Liste des commandes |

Les réponses sont des notifications ; elles ne démarrent pas d'agent.

## TUI

Badge : `✦ refine on · auto · none`. Le panneau a quatre onglets : Status, Last diff, History, Stats.

Touches : `1`–`4` onglets, `j`/`k` défilement, `r` rafraîchir, `m` choisir un modèle, `t` basculer, `Esc` fermer.

## Sécurité

- Tous les mots d'origine doivent rester ; le LLM ne peut ajouter que des mots-outils.
- Toutes les ancre (code, URL, chemins, nombres, identifiants, mentions) doivent correspondre.
- Croissance limitée à 25 % par défaut.
- Toute erreur, expiration ou réponse invalide → repli vers safe, puis vers l'original.
- Les prompts avec mentions et offsets sont ignorés pour préserver les pièces jointes.
- Le hook est protégé par `try/catch` : une erreur du plugin ne bloque jamais l'envoi.

Voir [docs/SAFETY.md](docs/SAFETY.md).

## Configuration

```json
{
  "enabled": true, "mode": "auto", "model": null, "context": "off",
  "maxGrowth": 0.25, "timeoutMs": 3500, "minLength": 12, "maxLength": 8000,
  "skipStructured": true, "historyEnabled": true, "historyLimit": 50,
  "showToast": true, "locale": "en"
}
```

Toutes les options : [docs/CONFIGURATION.md](docs/CONFIGURATION.md).

## Confidentialité

L'amélioration est locale. Le mode sûr n'envoie rien. Avec un modèle choisi, seul le texte et un contexte éventuellement tronqué sont transmis au fournisseur via OpenCode.

## Dépannage

- **Pas de badge ni de commandes :** `/reload` puis `opencode plugin list`.
- **Rien ne change :** prompt court, commande, code ou déjà structuré — c'est voulu.
- **LLM ne démarre pas :** choisissez un modèle avec `/refine-model`.

## Développement

```sh
npm install
npm run check
npm pack --dry-run
```

Architecture : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Licence

MIT © 2026 ASTRO-CLOU. Voir [LICENSE](LICENSE).
