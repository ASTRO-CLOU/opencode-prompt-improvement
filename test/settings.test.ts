import assert from "node:assert/strict"
import test from "node:test"
import { createSettings } from "../src/settings.ts"
import { DEFAULT_OPTIONS } from "../src/options.ts"

function createStorage() {
  const values = new Map<string, unknown>()
  return {
    values,
    async get(key: string) {
      return values.get(key)
    },
    async set(key: string, value: unknown) {
      values.set(key, value)
    },
  }
}

test("uses base options when no settings are stored", async () => {
  const storage = createStorage()
  const settings = createSettings(storage)

  assert.deepEqual(await settings.effectiveOptions(DEFAULT_OPTIONS), DEFAULT_OPTIONS)
})

test("stored mode and model override the base options", async () => {
  const storage = createStorage()
  const settings = createSettings(storage)
  const model = { providerID: "anthropic", id: "claude-haiku-4-5" }

  await settings.setMode("llm")
  await settings.setModel(model)

  const effective = await settings.effectiveOptions(DEFAULT_OPTIONS)
  assert.equal(effective.mode, "llm")
  assert.deepEqual(effective.model, model)
  assert.equal(effective.maxGrowth, DEFAULT_OPTIONS.maxGrowth)
})

test("stored model variant survives a round trip", async () => {
  const storage = createStorage()
  const settings = createSettings(storage)
  const model = { providerID: "openai", id: "gpt-4o-mini", variant: "none" }

  await settings.setModel(model)

  assert.deepEqual((await settings.effectiveOptions(DEFAULT_OPTIONS)).model, model)
})

test("clear removes the stored overrides", async () => {
  const storage = createStorage()
  const settings = createSettings(storage)

  await settings.setMode("llm")
  await settings.setModel({ providerID: "openai", id: "gpt-4o-mini" })
  await settings.clear()

  assert.deepEqual(await settings.effectiveOptions(DEFAULT_OPTIONS), DEFAULT_OPTIONS)
})

test("off mode keeps the model but disables the llm pass", async () => {
  const storage = createStorage()
  const settings = createSettings(storage)
  const model = { providerID: "openai", id: "gpt-4o-mini" }

  await settings.setModel(model)
  await settings.setMode("deterministic")

  const effective = await settings.effectiveOptions(DEFAULT_OPTIONS)
  assert.equal(effective.mode, "deterministic")
  assert.deepEqual(effective.model, model)
})

test("malformed stored settings are ignored", async () => {
  const storage = createStorage()
  storage.values.set("opencode-prompt-improvement.settings", { mode: "magic", model: { id: 5 } })
  const settings = createSettings(storage)

  assert.deepEqual(await settings.effectiveOptions(DEFAULT_OPTIONS), DEFAULT_OPTIONS)
})
