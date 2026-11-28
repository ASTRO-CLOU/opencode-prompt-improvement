# opencode-prompt-improvement

[![CI](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml/badge.svg)](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/ASTRO-CLOU/opencode-prompt-improvement)](https://github.com/ASTRO-CLOU/opencode-prompt-improvement/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenCode V2](https://img.shields.io/badge/OpenCode-V2-7C3AED)](https://opencode.ai)

[English](README.md) | [Русский](README.ru.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [Italiano](README.it.md) | [中文](README.zh.md) | [日本語](README.ja.md) | 한국어 | [العربية](README.ar.md) | [हिन्दी](README.hi.md)

프롬프트를 **전송하는 순간** 개선하는 OpenCode V2 플러그인입니다. 짧은 문장을 입력하면 모델은 더 깔끔하고 구조화된 버전을 받습니다. 개선된 텍스트는 세션 기록에 저장되어 실제로 무엇이 전송됐는지 확인할 수 있습니다.

사실·요구사항·예시·제목을 지어내지 않습니다. 기본적으로 **모델 토큰을 전혀 사용하지 않습니다**. 원하면 별도의 저렴한 모델로 마지막 다듬기를 할 수 있지만, 세션의 주 모델은 개선에 쓰이지 않습니다.

## 데모

```text
입력:
  "로그인 버그 고쳐도 테스트 추가하고 api 확인"

모델이 받는 내용:
  - 로그인 버그 고치기
  - 테스트 추가
  - api 확인
```

## 기능

- 실시간 프롬프트 훅: 모델에 도달하기 전에 개선.
- 기본은 안전: 모델 호출 없는 결정론적 정리.
- 명시적으로 선택한 모델에서만 선택적 LLM 다듬기.
- 새로운 사실, 요구사항, 단계, 예시, 제목, 번역 없음.
- 코드, URL, 경로, 숫자, 식별자, `@멘션` 보존.
- 명령어, 너무 짧은 프롬프트, 코드 위주, 이미 구조화된 프롬프트는 건너뜀.
- 현재／최근 세션 컨텍스트는 용어 참고용으로만 사용.
- TUI 상태 배지와 diff·기록·통계 패널.
- 슬래시 명령, 영구 설정, 로컬 캐시.
- 빠름: 안전 모드 즉시, LLM 모드 3.5초 제한 및 캐시.

## 설치

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement
```

버전 고정:

```sh
opencode plugin add github:ASTRO-CLOU/opencode-prompt-improvement#v1.0.7
```

또는 `opencode.json(c)`에 추가:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:ASTRO-CLOU/opencode-prompt-improvement"]
}
```

적용되지 않으면 `/reload`를 실행하세요.

## 모드

| 모드 | 동작 | 토큰 |
| --- | --- | --- |
| `auto` (기본) | 안전한 정리, 모델 선택 시에만 LLM | 모델 없으면 0 |
| `safe` | 결정론적 정리만 | 0 |
| `llm` | 모델 필요, 실패 시 safe로 폴백 | 선택 모델 소량 |

`/refine-model provider/id`로 모델을 선택합니다. 모델이 없으면 `auto`와 `llm`도 0 토큰입니다.

`context`는 기본적으로 `off`입니다. `session`은 현재 세션의 최근 사용자 메시지, `recent`는 같은 프로젝트의 최근 세션까지 사용합니다. 컨텍스트는 잘려 있으며 사실을 추가하지 않습니다.

## 명령어

| 명령어 | 설명 |
| --- | --- |
| `/refine` | 상태 및 패널 |
| `/refine-on`, `/refine-off` | 켜기/끄기 |
| `/refine-status` | 현재 설정 |
| `/refine-mode <auto\|safe\|llm>` | 모드 변경 |
| `/refine-model [provider/id\|off]` | 모델 선택/해제 |
| `/refine-models [filter]` | 모델 목록 |
| `/refine-context <off\|session\|recent>` | 컨텍스트 범위 |
| `/improve <text>` | Restructure with the selected model when available, otherwise apply deterministic improvement, and send the result |
| `/refine-preview <text>` | 전송 없이 미리보기 |
| `/refine-last` | 최근 개선 |
| `/refine-history` | 기록 |
| `/refine-stats` | 카운터 및 토큰 추정 |
| `/refine-reset` | 설정과 기록 초기화 |
| `/refine-help` | 명령어 목록 |

명령 응답은 알림이며 에이전트를 시작하지 않습니다.

## TUI

입력창 하단에 `✦ refine on · auto · none` 배지가 표시됩니다. 패널에는 Status, Last diff, History, Stats 네 탭이 있습니다.

키: `1`–`4` 탭, `j`/`k` 스크롤, `r` 새로고침, `m` 모델 선택, `t` 전환, `Esc` 닫기.

## 안전성

- 원래 단어는 모두 남아야 합니다. LLM은 기능어만 추가할 수 있습니다.
- 모든 앵커(코드, URL, 경로, 숫자, 식별자, 멘션)가 일치해야 합니다.
- 기본 길이 증가 상한은 25%입니다.
- 오류·시간 초과·잘못된 응답 시 safe, 그다음 원문으로 폴백합니다.
- 멘션과 오프셋이 있는 프롬프트는 첨부 파일 보호를 위해 건너뜁니다.
- 훅은 `try/catch`로 감싸져 있어 플러그인 오류가 전송을 막지 않습니다.

자세 내용: [docs/SAFETY.md](docs/SAFETY.md).

## 설정

```json
{
  "enabled": true, "mode": "auto", "model": null, "context": "off",
  "maxGrowth": 0.25, "timeoutMs": 3500, "minLength": 12, "maxLength": 8000,
  "skipStructured": true, "historyEnabled": true, "historyLimit": 50,
  "showToast": true, "locale": "en"
}
```

전체 옵션: [docs/CONFIGURATION.md](docs/CONFIGURATION.md).

## 개인정보

개선은 로컬에서 이루어집니다. 안전 모드는 아무것도 전송하지 않습니다. 모델을 선택하면 프롬프트 텍스트와 선택적으로 잘린 컨텍스트만 OpenCode를 통해 제공자에게 전달됩니다.

## 문제 해결

- **배지/명령어가 없습니다:** `/reload` 후 `opencode plugin list`.
- **변화가 없습니다:** 너무 짧은 프롬프트, 명령어, 코드 위주, 이미 구조화된 경우는 정상입니다.
- **LLM이 실행되지 않습니다:** `/refine-model`로 모델을 선택하세요.

## 개발

```sh
npm install
npm run check
npm pack --dry-run
```

아키텍처: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 라이선스

MIT © 2026 ASTRO-CLOU. [LICENSE](LICENSE) 참조.
