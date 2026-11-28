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

Un plugin de OpenCode que mejora tu prompt antes de enviarlo al modelo. Escribes un mensaje corto; la conversación recibe una versión más limpia y estructurada. El modelo y la interfaz muestran exactamente el texto reescrito.

**Compatibilidad:** OpenCode V2, probado en 2.3.2+ con la API de plugins 2.4.2. Node.js 22.18+ solo para compilar desde el código. Sin telemetría; el modo determinista no requiere cuenta.

## Requisitos

- OpenCode V2 (2.3.2 o superior).
- Node.js 22.18+ solo si compilas desde el código.
- Opcional: un modelo para la fase LLM (llama.cpp/Ollama local o cualquier proveedor de OpenCode).

## Instalación

Instalar desde GitHub:

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement
```

```jsonc title="opencode.jsonc"
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"]
}
```

Ejecuta `/reload` en OpenCode tras la instalación. Para fijar una versión: `github:ASTRO-CLOU/opencode-prompt-improvement#v0.0.1`.

## Comandos

Todos los comandos responden con notificaciones y nunca inician un agente.

| Comando | Descripción |
| --- | --- |
| `/imp-status` | Mostrar estado, modo, modelo y cuota |
| `/imp-on` / `/imp-off` | Activar o desactivar la mejora |
| `/imp-models [filter]` | Listar modelos disponibles para este plugin |
| `/imp-model [provider/id#variant]` | Elegir modelo y variante; `status` muestra el actual |
| `/imp-model off` | Mantener la limpieza, desactivar llamadas al modelo |
| `/imp-force <prompt>` | Mejorar un prompt una vez, incluso con la mejora desactivada |

`/imp-force` reenvía tu texto por el hook con una marca interna. Ignora el interruptor y las reglas de omisión, pero mantiene todas las comprobaciones de seguridad. La marca nunca llega al modelo ni al historial.

## Configuración

Los comandos guardan la configuración por sesión. Las opciones también pueden fijarse globalmente:

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

| Opción | Valor por defecto | Significado |
| --- | --- | --- |
| `mode` | `deterministic` | `deterministic` (sin llamadas al modelo) o `llm` (reescritura con respaldo) |
| `model` | none | Obligatorio para `llm`: `{ providerID, id, variant? }` |
| `maxGrowth` | `0.4` | Crecimiento máximo de longitud, 0–1 |
| `skipCommands` | `true` | Omitir prompts que empiezan por `/` |
| `skipDetailed` | `true` | Omitir prompts largos o ya estructurados |
| `detailedThreshold` | `2000` | Número de caracteres considerado largo |
| `llmTimeoutMs` | `20000` | Tiempo de espera de la llamada al modelo, en milisegundos |

## Cómo funciona

- Un hook `prompt` actúa al admitir el texto y actualiza `text` y `metadata.displayText`; la conversación muestra lo que recibe el modelo.

- La limpieza determinista elimina caracteres invisibles, espacios y líneas en blanco repetidos, y conserva código, menciones y anclas.

- En modo `llm`, primero se llama a `ctx.experimental.generate.text`: solo tu texto y la instrucción, sin el prompt de sistema de OpenCode. Una sesión temporal es el respaldo.

- La instrucción pide tres líneas (`Кто:` / `Задача:` / `Важно:`) y `/no_think` para Qwen3. Los prompts con `@menciones` omiten la fase LLM.

## Seguridad

- Deben conservarse todas las rutas, URL, números, identificadores, fragmentos entre backticks y `@menciones`. Se rechazan los nuevos.

- La salida puede ser como máximo un 40 % más larga que la entrada.

- Los bloques de código nunca se tocan; cambiar código en línea rechaza la edición.

- Se rechaza una reescritura que pierda más del 10 % del texto original.

- Por defecto se omiten prompts vacíos, `/comandos`, el prefijo `*` y textos de más de 2000 caracteres. Los desplazamientos de menciones se recalculan o el prompt queda intacto.

## Protección de cuota

Las reescrituras correctas se almacenan en caché: el mismo prompt y modelo reutilizan el resultado sin nueva llamada.

Un error de límite o frecuencia activa una pausa de 6 horas; durante la pausa solo actúa la limpieza determinista.

`/imp-model off` conserva la limpieza sin llamadas al modelo; `/imp-off` desactiva el plugin por completo.

## Modelos locales

Un modelo local evita consumir la cuota de la cuenta. llama.cpp da control exacto del contexto y la VRAM; Ollama es la opción de un solo comando.

### llama.cpp (contexto 16K)

Instala los binarios, descarga `Qwen3-8B-Q4_K_M` (~5 GB) e inicia el servidor compatible con OpenAI. Si Hugging Face corta la conexión, se usa ModelScope.

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

Registra el servidor en la configuración global de OpenCode, conservando tu entrada `plugins`:

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

Ejecuta `/reload` y luego elige el modelo en este plugin:

```text
/imp-model llamacpp/qwen3-8b
```

### Ollama

Instala [Ollama](https://ollama.com), iníciala y descarga un modelo. OpenCode la detecta automáticamente en `http://127.0.0.1:11434`.

```sh
ollama serve
ollama pull qwen3:8b
```

```text
/imp-model ollama/qwen3:8b
```

| Opción | Ideal para | Compromiso |
| --- | --- | --- |
| llama.cpp | contexto 16K y ajuste de VRAM explícitos | un comando de servidor más una entrada de configuración |
| Ollama | configuración más rápida y detección automática | menos ajustes de bajo nivel |

En una tarjeta de 8 GB, un contexto de 8K–16K es suficiente. 128K necesita mucha más VRAM.

## Solución de problemas

| Síntoma | Solución |
| --- | --- |
| El plugin no aparece en `opencode plugin list` | Repite la instalación y revisa el acceso a GitHub; para un fork privado usa una URL autenticada. |
| Los comandos funcionan, pero no hay avisos | Pon el plugin en la configuración global y ejecuta `/reload`. |
| El modo `llm` no cambia nada | Revisa `/imp-model status`; elige otro modelo con `/imp-models` y `/imp-model proveedor/id#variante`. Quita las `@menciones`. |
| El modelo local no aparece en `/imp-models` | Mantén `llama-server.exe` en el puerto 8080 o `ollama serve` en ejecución, y haz `/reload`. |
| La conversación muestra el texto original | Ejecuta `/reload` para que la parte del servidor tome el código actual. |

Registros: `~/.local/share/opencode/log/opencode.log`. Para una reproducción usa `OPENCODE_LOG_LEVEL=DEBUG`.

## Desarrollo

```sh
git clone https://github.com/ASTRO-CLOU/opencode-prompt-improvement.git
cd opencode-prompt-improvement
npm install
npm run check
```

`npm run check` ejecuta pruebas, comprobación de tipos y la compilación de la GUI. Las pruebas requieren Node 22.18+ y ejecutan TypeScript directamente con `node --test`.

## Licencia

MIT. Consulta [LICENSE](LICENSE).
