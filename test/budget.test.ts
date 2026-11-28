import assert from "node:assert/strict"
import test from "node:test"
import { createPromptBudget } from "../src/budget.ts"

function createStorage(initial?: unknown): { storage: { get(key: string): Promise<unknown>; set(key: string, value: unknown): Promise<void> }; values: Map<string, unknown> } {
  const values = new Map<string, unknown>()
  if (initial !== undefined) values.set("opencode-prompt-improvement.budget", initial)
  return {
    values,
    storage: {
      get: async (key) => values.get(key),
      set: async (key, value) => void values.set(key, value),
    },
  }
}

const model = { providerID: "test", id: "cheap" }

test("successful rewrites are cached for identical prompts", async () => {
  const { storage } = createStorage()
  const budget = createPromptBudget(storage)

  const first = await budget.prepare("same prompt", model)
  assert.equal(first.kind, "run")
  await budget.recordSuccess("same prompt", model, "Better prompt")

  const second = await budget.prepare("same prompt", model)
  assert.deepEqual(second, { kind: "cache", text: "Better prompt" })
})

test("a different variant does not reuse the cached rewrite", async () => {
  const { storage } = createStorage()
  const budget = createPromptBudget(storage)
  await budget.prepare("same prompt", model)
  await budget.recordSuccess("same prompt", model, "Better prompt")

  const decision = await budget.prepare("same prompt", { ...model, variant: "none" })
  assert.equal(decision.kind, "run")
})

test("free usage errors start a cooldown", async () => {
  const { storage } = createStorage()
  const budget = createPromptBudget(storage)
  await budget.prepare("first", model)

  await budget.recordFailure(
    new Error("Free usage limit reached. subscribe to OpenCode Go"),
  )

  const decision = await budget.prepare("second", model)
  assert.equal(decision.kind, "skip")
  assert.match(decision.reason, /^cooldown/)
})

test("unknown errors do not start a cooldown", async () => {
  const { storage } = createStorage()
  const budget = createPromptBudget(storage)
  await budget.prepare("first", model)

  await budget.recordFailure(new Error("Model not found"))

  assert.equal((await budget.prepare("second", model)).kind, "run")
})

test("status reports cache and cooldown", async () => {
  const { storage } = createStorage({
    cache: { abc: { text: "Better", createdAt: 1 } },
    cooldownUntil: Date.now() + 3_600_000,
  })
  const budget = createPromptBudget(storage)

  const status = await budget.status()
  assert.match(status.summary, /cache 1/)
  assert.match(status.summary, /paused \d+m/)
})
