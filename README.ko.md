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

모델에 도달하기 전에 프롬프트를 개선하는 OpenCode 플러그인입니다. 짧은 문장을 쓰면 더 깔끔하고 구조화된 버전이 대화에 전달됩니다. 모델과 UI 모두 다시 써진 텍스트를 표시합니다.

**호환성:** OpenCode V2, 2.3.2+ 및 plugin API 2.4.2에서 테스트. 소스 빌드 시에만 Node.js 22.18+ 필요. 텔레메트리 없음. 결정론 모드는 계정이 필요 없습니다.

## 요구 사항

- OpenCode V2(2.3.2 이상).
- 소스에서 빌드할 때만 Node.js 22.18+.
- 선택: LLM 단계용 모델(로컬 llama.cpp/Ollama 또는 OpenCode 공급자).

## 설치

GitHub에서 설치:

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement
```

```jsonc title="opencode.jsonc"
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"]
}
```

설치 후 OpenCode에서 `/reload`를 실행하세요. 버전 고정은 `github:ASTRO-CLOU/opencode-prompt-improvement#v0.0.1`입니다.

## 명령

모든 명령은 알림으로 응답하며 에이전트를 시작하지 않습니다.

| 명령 | 설명 |
| --- | --- |
| `/imp-status` | 상태, 모드, 모델, 할당량 표시 |
| `/imp-on` / `/imp-off` | 개선 켜기 또는 끄기 |
| `/imp-models [filter]` | 이 플러그인에서 사용할 수 있는 모델 목록 |
| `/imp-model [provider/id#variant]` | 모델과 변형 선택. `status`는 현재 모델 표시 |
| `/imp-model off` | 정리는 유지하고 모델 호출 비활성화 |
| `/imp-force <prompt>` | 개선이 꺼져 있어도 프롬프트를 한 번 개선 |

`/imp-force`는 내부 표식과 함께 텍스트를 prompt 훅에 다시 보냅니다. 스위치와 건너뛰기 규칙을 무시하지만 모든 안전 검사는 유지합니다. 표식은 모델이나 대화 기록에 전달되지 않습니다.

## 설정

명령은 세션별로 설정을 저장합니다. 플러그인 옵션은 전역으로도 설정할 수 있습니다:

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

| 옵션 | 기본값 | 의미 |
| --- | --- | --- |
| `mode` | `deterministic` | `deterministic`(모델 호출 없음) 또는 `llm`(대체 기능이 있는 재작성) |
| `model` | none | `llm`에 필요: `{ providerID, id, variant? }` |
| `maxGrowth` | `0.4` | 출력 길이 최대 증가율, 0–1 |
| `skipCommands` | `true` | `/`로 시작하는 프롬프트 건너뛰기 |
| `skipDetailed` | `true` | 길거나 이미 구조화된 프롬프트 건너뛰기 |
| `detailedThreshold` | `2000` | 길다고 판단하는 문자 수 |
| `llmTimeoutMs` | `20000` | 모델 호출 제한 시간(밀리초) |

## 작동 방식

- 하나의 `prompt` 훅이 입력 시 실행되어 `text`와 `metadata.displayText`를 업데이트합니다. 대화에는 모델이 받는 내용이 표시됩니다.

- 결정론적 정리는 보이지 않는 문자, 반복 공백, 빈 줄을 제거하면서 코드, 멘션, 앵커를 보존합니다.

- `llm` 모드에서는 먼저 `ctx.experimental.generate.text`를 호출합니다. 텍스트와 지시만 보내며 OpenCode 시스템 프롬프트는 포함하지 않습니다. 임시 세션이 대체 경로입니다.

- 지시는 세 줄(`Кто:` / `Задача:` / `Важно:`)과 Qwen3용 `/no_think`를 요청합니다. `@멘션`이 있는 프롬프트는 LLM 단계를 건너뜁니다.

## 안전

- 모든 경로, URL, 숫자, 식별자, 백틱 조각, `@멘션`은 유지해야 합니다. 새 항목은 거부합니다.

- 출력은 입력보다 최대 40% 길 수 있습니다.

- 코드 블록은 절대 건드리지 않습니다. 인라인 코드가 바뀌면 편집 전체를 거부합니다.

- 원문의 10% 이상을 잃는 재작성은 거부합니다.

- 기본적으로 빈 프롬프트, `/명령`, `*` 접두사, 2000자 초과 텍스트를 건너뜁니다. 멘션 위치는 다시 계산되고, 불가능하면 프롬프트는 그대로입니다.

## 할당량 보호

성공한 재작성은 캐시되어 같은 프롬프트와 모델은 새 요청 없이 결과를 재사용합니다.

무료 한도 또는 요청 빈도 오류가 나면 6시간 일시정지하며 그동안은 결정론적 정리만 실행됩니다.

`/imp-model off`는 모델 호출 없이 정리를 유지하고, `/imp-off`는 플러그인을 완전히 비활성화합니다.

## 로컬 모델

로컬 모델은 계정 할당량을 쓰지 않습니다. llama.cpp는 컨텍스트와 VRAM을 정밀하게 제어하고, Ollama는 한 명령으로 시작합니다.

### llama.cpp(16K 컨텍스트)

바이너리를 설치하고 `Qwen3-8B-Q4_K_M`(약 5GB)을 받은 뒤 OpenAI 호환 서버를 시작합니다. Hugging Face 연결이 끊기면 ModelScope를 사용합니다.

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

기존 `plugins` 항목을 유지하면서 서버를 OpenCode 전역 설정에 등록합니다:

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

`/reload`를 실행한 뒤 이 플러그인에서 모델을 선택합니다:

```text
/imp-model llamacpp/qwen3-8b
```

### Ollama

[Ollama](https://ollama.com)를 설치하고 실행한 뒤 모델을 받습니다. OpenCode는 `http://127.0.0.1:11434`를 자동으로 찾습니다.

```sh
ollama serve
ollama pull qwen3:8b
```

```text
/imp-model ollama/qwen3:8b
```

| 옵션 | 적합한 용도 | 단점 |
| --- | --- | --- |
| llama.cpp | 명시적인 16K 컨텍스트와 VRAM 조정 | 서버 명령과 설정 항목이 하나 더 필요 |
| Ollama | 가장 빠른 설치와 자동 검색 | 저수준 설정이 적음 |

8GB 카드에서는 8K–16K 컨텍스트면 충분합니다. 128K는 훨씬 더 많은 VRAM이 필요합니다.

## 문제 해결

| 증상 | 해결 |
| --- | --- |
| `opencode plugin list`에 플러그인이 없습니다 | 다시 설치하고 GitHub 접근을 확인하세요. 비공개 포크라면 인증된 URL을 사용합니다. |
| 명령은 동작하는데 알림이 없습니다 | 플러그인을 전역 설정에 넣고 `/reload`를 실행하세요. |
| `llm` 모드가 아무 변화도 없다 | `/imp-model status`를 확인하고 `/imp-models`, `/imp-model 공급자/id#변형`으로 다른 모델을 선택하세요. `@멘션`을 제거하세요. |
| `/imp-models`에 로컬 모델이 없다 | `llama-server.exe`를 8080 포트에, `ollama serve`를 실행한 상태로 두고 `/reload` 하세요. |
| 대화에 원래 텍스트가 표시된다 | `/reload`를 실행해 서버 부분이 현재 코드를 읽도록 하세요. |

로그: `~/.local/share/opencode/log/opencode.log`. 재현 시 `OPENCODE_LOG_LEVEL=DEBUG`를 사용하세요.

## 개발

```sh
git clone https://github.com/ASTRO-CLOU/opencode-prompt-improvement.git
cd opencode-prompt-improvement
npm install
npm run check
```

`npm run check`는 테스트, 타입 검사, GUI 빌드를 실행합니다. 테스트에는 Node 22.18+가 필요하며 `node --test`로 TypeScript를 직접 실행합니다.

## 라이선스

MIT. [LICENSE](LICENSE)를 참조하세요.
