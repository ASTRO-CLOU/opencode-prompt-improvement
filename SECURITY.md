# Security Policy

## Supported versions

Only the latest release receives fixes.

## Reporting a vulnerability

Please report security issues privately via GitHub's **Security → Report a vulnerability** form for this repository. Include:

- affected version,
- reproduction steps,
- potential impact,
- suggested fix, if any.

Do not open a public issue for an unpatched vulnerability.

## Scope notes

- The plugin stores settings, history and stats through OpenCode's plugin storage; it does not write secrets to disk.
- LLM mode sends prompt text (and optionally truncated user-message context) to the provider you select. No other data leaves the machine.
- Attachments and mentions cause refinement to be skipped, so file contents are never rewritten.
- Provider credentials remain in OpenCode's own credential store.

## Response expectations

We aim to acknowledge reports within seven days and to ship a fix or mitigation within 30 days for confirmed issues.
