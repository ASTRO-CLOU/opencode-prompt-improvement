# opencode-prompt-improvement

[![CI](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml/badge.svg)](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/ASTRO-CLOU/opencode-prompt-improvement)](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenCode V2](https://img.shields.io/badge/OpenCode-V2-7C3AED)](https://opencode.ai)

[English](README.md) | [Русский](README.ru.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | Português | [Italiano](README.it.md) | [中文](README.zh.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [हिन्दी](README.hi.md)

Plugin do OpenCode V2 que melhora o prompt **no momento do envio**. Você escreve uma mensagem curta; o modelo recebe uma versão mais limpa e estruturada. O texto melhorado é salvo no histórico da sessão, então você vê exatamente o que foi enviado.

O plugin não inventa fatos, requisitos, exemplos nem títulos. Por padrão, **não gasta tokens de modelo**. Opcionalmente, escolha um modelo barato separado para um acabamento final; o modelo principal da sessão nunca é usado.

## Demo

```text
Você escreve:
  "corrigir bug de login também adicionar testes e verificar a api"

O modelo recebe:
  - corrigir bug de login
  - adicionar testes
  - verificar a api
```

## Recursos

- Hook de prompt em tempo real: melhoria antes de chegar ao modelo.
- Seguro por padrão: limpeza determinística sem chamadas de modelo.
- Polimento LLM opcional apenas com modelo escolhido explicitamente.
- Sem novos fatos, requisitos, etapas, exemplos, títulos ou traduções.
- Preserva código, URLs, caminhos, números, identificadores e `@menções`.
- Ignora comandos, prompts curtos, com muito código ou já estruturados.
- Contexto da sessão atual ou recentes apenas como referência de termos.
- Badge na TUI e painel com diff, histórico e estatísticas.
- Comandos slash, configurações persistentes e cache local.
- Rápido: modo seguro instantâneo; modo LLM com timeout de 3,5 s e cache.

## Instalação

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement
```

Fixar uma versão:

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement#v1.0.7
```

Ou em `opencode.json(c)`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"]
}
```

Se não aplicar, execute `/reload`.

## Modos

| Modo | Comportamento | Tokens |
| --- | --- | --- |
| `auto` (padrão) | Limpeza segura; LLM só se houver modelo | 0 sem modelo |
| `safe` | Apenas limpeza determinística | 0 |
| `llm` | Requer modelo; volta a safe se falhar | Poucos, do modelo escolhido |

Escolha com `/refine-model provedor/id`. Sem modelo, até `auto` e `llm` gastam 0 tokens.

`context` é `off` por padrão. `session` usa as últimas mensagens da sessão; `recent` inclui sessões recentes do projeto. O contexto é limitado e nunca adiciona fatos.

## Comandos

| Comando | Descrição |
| --- | --- |
| `/refine` | Status e painel |
| `/refine-on`, `/refine-off` | Ativar/desativar |
| `/refine-status` | Configurações atuais |
| `/refine-mode <auto\|safe\|llm>` | Mudar modo |
| `/refine-model [provider/id\|off]` | Escolher/remover modelo |
| `/refine-models [filter]` | Listar modelos |
| `/refine-context <off\|session\|recent>` | Escopo do contexto |
| `/improve <text>` | Restructure with the selected model when available, otherwise apply deterministic improvement, and send the result |
| `/refine-preview <text>` | Prévia sem enviar |
| `/refine-last` | Última melhoria |
| `/refine-history` | Histórico |
| `/refine-stats` | Contadores e tokens estimados |
| `/refine-reset` | Redefinir configurações e histórico |
| `/refine-help` | Lista de comandos |

As respostas são notificações; não iniciam um agente.

## TUI

Badge: `✦ refine on · auto · none`. O painel tem quatro abas: Status, Last diff, History, Stats.

Teclas: `1`–`4` abas, `j`/`k` rolar, `r` atualizar, `m` escolher modelo, `t` alternar, `Esc` fechar.

## Segurança

- Todas as palavras originais devem permanecer; o LLM só pode adicionar palavras funcionais.
- Todas as âncoras (código, URLs, caminhos, números, identificadores, menções) devem coincidir.
- Crescimento limitado a 25% por padrão.
- Qualquer erro, timeout ou resposta inválida → volta a safe e depois ao original.
- Prompts com menções e offsets são ignorados para proteger anexos.
- O hook usa `try/catch`: um erro do plugin nunca bloqueia o envio.

Ver [docs/SAFETY.md](docs/SAFETY.md).

## Configuração

```json
{
  "enabled": true, "mode": "auto", "model": null, "context": "off",
  "maxGrowth": 0.25, "timeoutMs": 3500, "minLength": 12, "maxLength": 8000,
  "skipStructured": true, "historyEnabled": true, "historyLimit": 50,
  "showToast": true, "locale": "en"
}
```

Todas as opções: [docs/CONFIGURATION.md](docs/CONFIGURATION.md).

## Privacidade

A melhoria é local. O modo seguro não envia nada. Com um modelo escolhido, apenas o texto e um contexto opcional truncado vão ao provedor via OpenCode.

## Solução de problemas

- **Sem badge ou comandos:** `/reload` e `opencode plugin list`.
- **Nada muda:** prompt curto, comando, com código ou já estruturado — é intencional.
- **LLM não inicia:** escolha um modelo com `/refine-model`.

## Desenvolvimento

```sh
npm install
npm run check
npm pack --dry-run
```

Arquitetura: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Licença

MIT © 2026 ASTRO-CLOU. Ver [LICENSE](LICENSE).
