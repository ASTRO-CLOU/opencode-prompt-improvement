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
    async remove(key: string) {
      values.delete(key)
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

test("runtime option overrides are validated and persisted", async () => {
  const storage = createStorage()
  const settings = createSettings(storage)

  assert.equal(await settings.setOption("maxGrowth", 0.25), true)
  assert.equal(await settings.setOption("skipCommands", false), true)
  assert.equal(await settings.setOption("detailedThreshold", 500), true)
  assert.equal(await settings.setOption("llmTimeoutMs", 1500), true)

  const effective = await settings.effectiveOptions(DEFAULT_OPTIONS)
  assert.equal(effective.maxGrowth, 0.25)
  assert.equal(effective.skipCommands, false)
  assert.equal(effective.detailedThreshold, 500)
  assert.equal(effective.llmTimeoutMs, 1500)
})

test("invalid runtime option values are rejected", async () => {
  const storage = createStorage()
  const settings = createSettings(storage)

  assert.equal(await settings.setOption("mode", "magic"), false)
  assert.equal(await settings.setOption("skipDetailed", "yes"), false)
  assert.equal(await settings.setOption("llmTimeoutMs", "fast"), false)

  assert.deepEqual(await settings.effectiveOptions(DEFAULT_OPTIONS), DEFAULT_OPTIONS)
})

test("clearOption removes only the selected override", async () => {
  const storage = createStorage()
  const settings = createSettings(storage)

  await settings.setOption("maxGrowth", 0.2)
  await settings.setOption("skipCommands", false)
  await settings.clearOption("maxGrowth")

  const effective = await settings.effectiveOptions(DEFAULT_OPTIONS)
  assert.equal(effective.maxGrowth, DEFAULT_OPTIONS.maxGrowth)
  assert.equal(effective.skipCommands, false)
})

test("numeric runtime options are clamped to supported ranges", async () => {
  const storage = createStorage()
  const settings = createSettings(storage)

  await settings.setOption("maxGrowth", 5)
  await settings.setOption("detailedThreshold", -10)

  const effective = await settings.effectiveOptions(DEFAULT_OPTIONS)
  assert.equal(effective.maxGrowth, 1)
  assert.equal(effective.detailedThreshold, 0)
})
