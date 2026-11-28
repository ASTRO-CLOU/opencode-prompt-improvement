import assert from "node:assert/strict"
import test from "node:test"
import plugin from "../index.ts"
import { LLM_PROMPT_PREFIX } from "../src/llm.ts"
import type { Mention } from "../src/types.ts"

interface PromptFile {
  mention?: Mention
}

interface PromptEvent {
  prompt: {
    text: string
    files?: PromptFile[]
  }
  metadata?: Record<string, unknown>
  delivery: "steer"
}

interface CommandInput {
  sessionID: string
  prompt: { text?: string }
}

interface CommandDefinition {
  name: string
  execute(input: CommandInput): Promise<void> | void
}

interface Notice {
  text: string
  variant: string
  sessionID?: string
  persistent?: boolean
}

type SetupContext = Parameters<typeof plugin.setup>[0]

interface CreatedSession {
  id: string
  model: { providerID: string; id: string; variant?: string }
  title: string
  prompt?: string
  removed?: boolean
}

interface Harness {
  context: SetupContext
  storage: Map<string, unknown>
  commands: Map<string, CommandDefinition>
  notices: Notice[]
  createdSessions: CreatedSession[]
  oneShotCalls: { count: number; prompt?: string }
  setup(): Promise<void>
  prompt(text: string, files?: PromptFile[], metadata?: Record<string, unknown>): Promise<PromptEvent>
}

function createHarness(
  options: Record<string, unknown> = {},
  generated?: string | Error | Promise<string>,
  sessionApi = true,
  oneShot?: string | Error | Promise<string>,
): Harness {
  const storage = new Map<string, unknown>()
  const commands = new Map<string, CommandDefinition>()
  const notices: Notice[] = []
  const createdSessions: CreatedSession[] = []
  const oneShotCalls: { count: number; prompt?: string } = { count: 0 }
  let promptHook: ((event: PromptEvent) => Promise<void> | void) | undefined

  const context = {
    options,
    storage: {
      get: async (key: string) => storage.get(key),
      set: async (key: string, value: unknown) => void storage.set(key, value),
      remove: async (key: string) => void storage.delete(key),
    },
    session: {
      hook: async (name: string, handler: (event: PromptEvent) => Promise<void> | void) => {
        if (name === "prompt") promptHook = handler
        return { dispose: async () => {} }
      },
      ...(sessionApi
        ? {
            create: async (input: {
              model?: { providerID: string; id: string; variant?: string }
              title?: string
            }) => {
              const session: CreatedSession = {
                id: `ses_tmp_${createdSessions.length + 1}`,
                model: input.model ?? { providerID: "test", id: "cheap" },
                title: input.title ?? "",
              }
              createdSessions.push(session)
              return session
            },
            generate: async (input: { sessionID: string; prompt: string }) => {
              const session = createdSessions.find((item) => item.id === input.sessionID)
              if (session === undefined) throw new Error("session not found")
              session.prompt = input.prompt
              if (generated instanceof Error) throw generated
              return { text: (await generated) ?? "" }
            },
            remove: async (input: { sessionID: string }) => {
              const session = createdSessions.find((item) => item.id === input.sessionID)
              if (session !== undefined) session.removed = true
            },
          }
        : {}),
    },
    ...(oneShot !== undefined
      ? {
          experimental: {
            generate: {
              text: async (input: { prompt: string }) => {
                oneShotCalls.count += 1
                oneShotCalls.prompt = input.prompt
                if (oneShot instanceof Error) throw oneShot
                return { text: (await oneShot) ?? "" }
              },
            },
          },
        }
      : {}),
    command: {
      transform: async (
        callback: (editor: { add: (definition: CommandDefinition) => void }) => void,
      ) => {
        callback({ add: (definition) => void commands.set(definition.name, definition) })
        return { dispose: async () => {} }
      },
    },
    rpc: {
      register: async () => ({
        events: {
          emit: async (name: string, data: Notice) => {
            if (name === "notice") notices.push(data)
          },
        },
      }),
    },
    model: {
      list: async () => [
        {
          providerID: "test",
          id: "cheap",
          name: "Cheap",
          variants: [{ id: "none" }, { id: "high" }],
        },
      ],
    },
  } as unknown as SetupContext

  return {
    context,
    storage,
    commands,
    notices,
    createdSessions,
    oneShotCalls,
    async setup() {
      await plugin.setup(context)
    },
    async prompt(text, files = [], metadata = {}) {
      if (promptHook === undefined) throw new Error("prompt hook was not registered")
      const event = {
        prompt: { text, files },
        metadata: { ...metadata, displayText: text },
        delivery: "steer",
      } as PromptEvent
      await promptHook(event)
      return event
    },
  }
}

test("setup registers the prompt hook and every command", async () => {
  const harness = createHarness()
  await harness.setup()

  assert.deepEqual([...harness.commands.keys()], [
    "imp-status",
    "imp-on",
    "imp-off",
    "imp-models",
    "imp-model",
  ])
})

test("deterministic mode cleans the prompt before it is sent", async () => {
  const harness = createHarness()
  await harness.setup()

  const event = await harness.prompt("hello   world  \n\n\n\nnext")
  assert.equal(event.prompt.text, "hello world\n\nnext")
  assert.equal(event.metadata?.displayText, "hello world\n\nnext")
})

test("improvement keeps other prompt metadata", async () => {
  const harness = createHarness()
  await harness.setup()

  const event = await harness.prompt("hello   world", [], { source: "test" })
  assert.equal(event.prompt.text, "hello world")
  assert.deepEqual(event.metadata, { source: "test", displayText: "hello world" })
})

test("disabled improvement leaves the prompt untouched", async () => {
  const harness = createHarness()
  harness.storage.set("opencode-prompt-improvement.enabled", false)
  await harness.setup()

  const event = await harness.prompt("hello   world  ")
  assert.equal(event.prompt.text, "hello   world  ")
  assert.equal(event.metadata?.displayText, "hello   world  ")
})

test("mentions are remapped to the cleaned text", async () => {
  const harness = createHarness()
  await harness.setup()

  const files: PromptFile[] = [{ mention: { start: 10, end: 19, text: "@src/a.ts" } }]
  const event = await harness.prompt("look   at @src/a.ts please", files)

  assert.equal(event.prompt.text, "look at @src/a.ts please")
  assert.deepEqual(files[0]?.mention, { start: 8, end: 17, text: "@src/a.ts" })
})

test("llm mode applies a safe model rewrite", async () => {
  const harness = createHarness(
    { mode: "llm", model: { providerID: "test", id: "cheap" } },
    "Please fix the typo in this sentence.",
  )
  await harness.setup()

  const event = await harness.prompt("please fix teh typo in this sentence")
  assert.equal(event.prompt.text, "Please fix the typo in this sentence.")
  assert.equal(event.metadata?.displayText, "Please fix the typo in this sentence.")
  assert.equal(harness.createdSessions.length, 1)
  assert.deepEqual(harness.createdSessions[0]?.model, { providerID: "test", id: "cheap" })
  const servicePrompt = harness.createdSessions[0]?.prompt ?? ""
  assert.match(servicePrompt, /^You improve a user's prompt text into a clear, well-structured brief\./)
  assert.match(servicePrompt, /Output exactly three lines/)
  assert.match(servicePrompt, /This is an improvement, not a summary/)
  assert.match(servicePrompt, /Example:/)
  assert.match(servicePrompt, /Кто:/)
  assert.match(servicePrompt, /Задача:/)
  assert.match(servicePrompt, /Важно:/)
  assert.match(servicePrompt, /Hard limit: 50 characters total/)
  assert.match(servicePrompt, /\/no_think$/)
  assert.equal(harness.createdSessions[0]?.removed, true)
})

test("llm rewrite that drops details is rejected", async () => {
  const harness = createHarness(
    { mode: "llm", model: { providerID: "test", id: "cheap" } },
    "Кто: Разраб\nЗадача: Сделай сайт\nВажно: Топ",
  )
  await harness.setup()

  const original = "привет крутой программист сделай крутой сайт с разными прикольными мини-играми и рекламой"
  const event = await harness.prompt(original)
  assert.equal(event.prompt.text, original)
})

test("one-shot generation avoids a temporary session", async () => {
  const harness = createHarness(
    { mode: "llm", model: { providerID: "test", id: "cheap" } },
    undefined,
    true,
    "Please fix the typo in this sentence.",
  )
  await harness.setup()

  const event = await harness.prompt("please fix teh typo in this sentence")
  assert.equal(event.prompt.text, "Please fix the typo in this sentence.")
  assert.equal(harness.oneShotCalls.count, 1)
  assert.equal(harness.createdSessions.length, 0)
})

test("one-shot failure falls back to a temporary session", async () => {
  const harness = createHarness(
    { mode: "llm", model: { providerID: "test", id: "cheap" } },
    "Please fix the typo in this sentence.",
    true,
    new Error("one-shot unavailable"),
  )
  await harness.setup()

  const event = await harness.prompt("please fix teh typo in this sentence")
  assert.equal(event.prompt.text, "Please fix the typo in this sentence.")
  assert.equal(harness.oneShotCalls.count, 1)
  assert.equal(harness.createdSessions.length, 1)
})

test("llm output with a new path is rejected", async () => {
  const harness = createHarness(
    { mode: "llm", model: { providerID: "test", id: "cheap" } },
    "Rewrite src/other.ts and add tests.",
  )
  await harness.setup()

  const event = await harness.prompt("fix   src/a.ts")
  assert.equal(event.prompt.text, "fix src/a.ts")
})

test("missing session api falls back to deterministic cleanup", async () => {
  const harness = createHarness(
    { mode: "llm", model: { providerID: "test", id: "cheap" } },
    undefined,
    false,
  )
  await harness.setup()

  const event = await harness.prompt("fix   src/a.ts")
  assert.equal(event.prompt.text, "fix src/a.ts")
})

test("improvement prompts are not refined again", async () => {
  const harness = createHarness(
    { mode: "llm", model: { providerID: "test", id: "cheap" } },
    "Please fix the typo in this sentence.",
  )
  await harness.setup()

  const input = `${LLM_PROMPT_PREFIX} Return only the rewritten text.`
  const event = await harness.prompt(input)
  assert.equal(event.prompt.text, input)
  assert.equal(harness.createdSessions.length, 0)
})

test("llm errors are reported once and fall back", async () => {
  const harness = createHarness(
    { mode: "llm", model: { providerID: "test", id: "cheap" } },
    new Error("Model not found: test/cheap"),
  )
  await harness.setup()

  const first = await harness.prompt("fix   src/a.ts")
  const second = await harness.prompt("fix   src/b.ts")

  assert.equal(first.prompt.text, "fix src/a.ts")
  assert.equal(second.prompt.text, "fix src/b.ts")
  const errors = harness.notices.filter((notice) => notice.text.startsWith("LLM pass failed"))
  assert.equal(errors.length, 1)
  assert.match(errors[0]?.text ?? "", /Model not found: test\/cheap/)
})

test("llm timeout stops waiting and reports the failure", async () => {
  const harness = createHarness(
    { mode: "llm", model: { providerID: "test", id: "cheap" }, llmTimeoutMs: 100 },
    new Promise<string>(() => {}),
  )
  await harness.setup()

  const startedAt = Date.now()
  const event = await harness.prompt("hello world")
  const elapsed = Date.now() - startedAt

  assert.ok(elapsed < 1000, `hook waited ${String(elapsed)}ms`)
  assert.equal(event.prompt.text, "hello world")
  const errors = harness.notices.filter((notice) => notice.text.startsWith("LLM pass failed"))
  assert.equal(errors.length, 1)
  assert.match(errors[0]?.text ?? "", /aborted|timeout/i)
})

test("/imp-off disables improvement and reports it", async () => {
  const harness = createHarness()
  await harness.setup()

  await harness.commands.get("imp-off")?.execute({ sessionID: "ses_1", prompt: {} })

  assert.equal(harness.storage.get("opencode-prompt-improvement.enabled"), false)
  assert.equal(
    harness.notices.at(-1)?.text,
    "Prompt improvement is off. Prompts are sent exactly as typed.",
  )
})

test("/imp-models stays visible while other notices auto-dismiss", async () => {
  const harness = createHarness()
  await harness.setup()

  await harness.commands.get("imp-models")?.execute({ sessionID: "ses_1", prompt: {} })
  assert.equal(harness.notices.at(-1)?.persistent, true)

  await harness.commands.get("imp-off")?.execute({ sessionID: "ses_1", prompt: {} })
  assert.equal(harness.notices.at(-1)?.persistent, false)
})

test("status reports an unavailable model", async () => {
  const harness = createHarness()
  harness.storage.set("opencode-prompt-improvement.settings", {
    mode: "llm",
    model: { providerID: "test", id: "gone" },
  })
  await harness.setup()

  await harness.commands.get("imp-status")?.execute({ sessionID: "ses_1", prompt: {} })

  assert.match(harness.notices.at(-1)?.text ?? "", /test\/gone \(unavailable\)/)
})

test("imp-model rejects a model that is not in the list", async () => {
  const harness = createHarness()
  await harness.setup()

  await harness.commands.get("imp-model")?.execute({
    sessionID: "ses_1",
    prompt: { text: "test/gone" },
  })

  assert.equal(
    harness.notices.at(-1)?.text,
    "Model or variant not found. Use /imp-models to list models.",
  )
  assert.equal(harness.storage.get("opencode-prompt-improvement.settings"), undefined)
})

test("imp-model stores a variant and passes it to the temporary session", async () => {
  const harness = createHarness({}, "Rewritten prompt")
  await harness.setup()

  await harness.commands.get("imp-model")?.execute({
    sessionID: "ses_1",
    prompt: { text: "test/cheap#none" },
  })

  assert.match(harness.notices.at(-1)?.text ?? "", /test\/cheap#none/)
  const stored = harness.storage.get("opencode-prompt-improvement.settings") as {
    model?: { providerID: string; id: string; variant?: string }
  }
  assert.deepEqual(stored.model, { providerID: "test", id: "cheap", variant: "none" })

  await harness.prompt("please fix teh typo")
  assert.equal(harness.createdSessions[0]?.model.variant, "none")
})

test("status shows the selected variant", async () => {
  const harness = createHarness()
  harness.storage.set("opencode-prompt-improvement.settings", {
    mode: "llm",
    model: { providerID: "test", id: "cheap", variant: "high" },
  })
  await harness.setup()

  await harness.commands.get("imp-status")?.execute({ sessionID: "ses_1", prompt: {} })

  assert.match(harness.notices.at(-1)?.text ?? "", /test\/cheap#high/)
})

test("imp-model rejects an unknown variant", async () => {
  const harness = createHarness()
  await harness.setup()

  await harness.commands.get("imp-model")?.execute({
    sessionID: "ses_1",
    prompt: { text: "test/cheap#max" },
  })

  assert.equal(
    harness.notices.at(-1)?.text,
    "Model or variant not found. Use /imp-models to list models.",
  )
  assert.equal(harness.storage.get("opencode-prompt-improvement.settings"), undefined)
})

test("identical prompts reuse the cached rewrite", async () => {
  const harness = createHarness(
    { mode: "llm", model: { providerID: "test", id: "cheap" } },
    "Please fix the typo in this sentence.",
  )
  await harness.setup()

  const first = await harness.prompt("please fix teh typo in this sentence")
  const second = await harness.prompt("please fix teh typo in this sentence")

  assert.equal(first.prompt.text, "Please fix the typo in this sentence.")
  assert.equal(second.prompt.text, "Please fix the typo in this sentence.")
  assert.equal(harness.createdSessions.length, 1)
})

test("a free usage error pauses later LLM calls", async () => {
  const harness = createHarness(
    { mode: "llm", model: { providerID: "test", id: "cheap" } },
    new Error("Free usage limit reached"),
  )
  await harness.setup()

  const first = await harness.prompt("fix   src/a.ts")
  const second = await harness.prompt("fix   src/b.ts")

  assert.equal(first.prompt.text, "fix src/a.ts")
  assert.equal(second.prompt.text, "fix src/b.ts")
  assert.equal(harness.createdSessions.length, 1)

  await harness.commands.get("imp-status")?.execute({ sessionID: "ses_1", prompt: {} })
  assert.match(harness.notices.at(-1)?.text ?? "", /LLM: cache 0; paused \d+m/)
})

