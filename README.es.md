# opencode-prompt-improvement

[![CI](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml/badge.svg)](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/ASTRO-CLOU/opencode-prompt-improvement)](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenCode V2](https://img.shields.io/badge/OpenCode-V2-7C3AED)](https://opencode.ai)

[English](README.md) | [Русский](README.ru.md) | Español | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [Italiano](README.it.md) | [中文](README.zh.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [हिन्दी](README.hi.md)

Plugin de OpenCode V2 que mejora un prompt **en el momento de enviarlo**. Escribes un mensaje corto; el modelo recibe una versión más limpia y mejor estructurada. El texto mejorado se guarda en el historial de la sesión, así que ves exactamente qué se envió.

El plugin no inventa hechos, requisitos, ejemplos ni encabezados. Por defecto **no consume tokens del modelo**. Opcionalmente puedes elegir un modelo económico separado para un último pulido; el modelo principal de la sesión nunca se usa para mejorar.

## Demo

```text
Escribes:
  "arregla el bug de login también añade tests y revisa la api"

El modelo recibe:
  - arregla el bug de login
  - añade tests
  - revisa la api
```

## Características

- Hook de prompt en tiempo real: mejora antes de llegar al modelo.
- Seguro por defecto: limpieza determinista sin llamadas al modelo.
- Pulido LLM opcional solo con un modelo elegido explícitamente.
- Sin nuevos hechos, requisitos, pasos, ejemplos, encabezados ni traducciones.
- Conserva código, URLs, rutas, números, identificadores y `@menciones`.
- Omite comandos, prompts muy cortos, con mucho código o ya estructurados.
- Contexto de la sesión actual o recientes solo como referencia terminológica.
- Insignia en la TUI y panel con diff, historial y estadísticas.
- Comandos slash, ajustes persistentes y caché local.
- Rápido: modo seguro instantáneo; modo LLM con timeout de 3,5 s y caché.

## Instalación

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement
```

Fijar una versión:

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement#v1.0.7
```

O en `opencode.json(c)`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"]
}
```

Si no se aplica, ejecuta `/reload`.

## Modos

| Modo | Comportamiento | Tokens |
| --- | --- | --- |
| `auto` (por defecto) | Limpieza segura; LLM solo si hay modelo | 0 sin modelo |
| `safe` | Solo limpieza determinista | 0 |
| `llm` | Requiere modelo; recurre a safe si falla | Pocos, del modelo elegido |

Elige modelo con `/refine-model proveedor/id`. Sin modelo, incluso `auto` y `llm` gastan 0 tokens.

`context` es `off` por defecto. `session` usa los últimos mensajes de la sesión; `recent` añade sesiones recientes del mismo proyecto. Está limitado y nunca añade hechos.

## Comandos

| Comando | Descripción |
| --- | --- |
| `/refine` | Estado y panel |
| `/refine-on`, `/refine-off` | Activar/desactivar |
| `/refine-status` | Ajustes actuales |
| `/refine-mode <auto\|safe\|llm>` | Cambiar modo |
| `/refine-model [provider/id\|off]` | Elegir o quitar modelo |
| `/refine-models [filter]` | Listar modelos |
| `/refine-context <off\|session\|recent>` | Ámbito del contexto |
| `/improve <text>` | Restructure with the selected model when available, otherwise apply deterministic improvement, and send the result |
| `/refine-preview <text>` | Vista previa sin enviar |
| `/refine-last` | Última mejora |
| `/refine-history` | Historial |
| `/refine-stats` | Contadores y tokens estimados |
| `/refine-reset` | Reiniciar ajustes e historial |
| `/refine-help` | Lista de comandos |

Las respuestas son notificaciones; no inician un agente.

## TUI

Insignia: `✦ refine on · auto · none`. El panel tiene cuatro pestañas: Status, Last diff, History, Stats.

Teclas: `1`–`4` pestañas, `j`/`k` desplazarse, `r` actualizar, `m` elegir modelo, `t` activar/desactivar, `Esc` cerrar.

## Seguridad

- Todas las palabras originales deben permanecer; LLM solo puede añadir palabras funcionales.
- Todos los anclajes (código, URLs, rutas, números, identificadores, menciones) deben coincidir.
- Crecimiento máximo 25% por defecto.
- Cualquier error, timeout o respuesta inválida → safe y luego original.
- Los prompts con menciones y desplazamientos se omiten para no romper archivos adjuntos.
- El hook usa `try/catch`: un error del plugin nunca bloquea el envío.

Más en [docs/SAFETY.md](docs/SAFETY.md).

## Configuración

```json
{
  "enabled": true, "mode": "auto", "model": null, "context": "off",
  "maxGrowth": 0.25, "timeoutMs": 3500, "minLength": 12, "maxLength": 8000,
  "skipStructured": true, "historyEnabled": true, "historyLimit": 50,
  "showToast": true, "locale": "en"
}
```

Detalles: [docs/CONFIGURATION.md](docs/CONFIGURATION.md).

## Privacidad

La mejora es local. El modo seguro no envía nada. Con un modelo elegido, solo el texto y un contexto opcional truncado se envían al proveedor a través de OpenCode.

## Resolución de problemas

- **Sin insignia ni comandos:** `/reload` y `opencode plugin list`.
- **No cambia nada:** prompt corto, comando, con código o ya estructurado — es intencional.
- **LLM no se ejecuta:** elige modelo con `/refine-model`.

## Desarrollo

```sh
npm install
npm run check
npm pack --dry-run
```

Arquitectura: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Licencia

MIT © 2026 ASTRO-CLOU. Ver [LICENSE](LICENSE).
