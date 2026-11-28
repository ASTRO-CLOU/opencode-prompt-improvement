# Contributing

Thanks for helping improve this project.

## Development

```sh
git clone https://github.com/ASTRO-CLOU/opencode-prompt-improvement.git
cd opencode-prompt-improvement
npm install
npm run check
```

Node 24 or newer is recommended. OpenCode 2.3.2 is the reference runtime. There is no build step: OpenCode loads the TypeScript/TSX sources directly.

## Ground rules

1. Never introduce new content into a refined prompt. This is the product's core promise.
2. Keep safe mode free of model calls and network access.
3. Any new transformation must be covered by a test that checks anchors and word multisets.
4. Prefer small, focused modules over large files.
5. Use clear English names; do not add debug prints or comments unless truly necessary.
6. Run `npm run check` before opening a pull request.

## Adding a transformation

- Implement it in `src/core/normalize.ts` (or a new module imported there).
- Protect code spans and anchors using the helpers in `src/core/text.ts`.
- Add unit tests in `test/normalize.test.ts`, including a fallback case.
- Update `docs/SAFETY.md` if the validation invariants change.

## Commit style

`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:` prefixes are preferred.

## Reporting bugs

Open an issue with the original prompt, the refined prompt, your mode/model settings and the OpenCode version. Please remove private data from examples.
