import assert from "node:assert/strict"
import test from "node:test"
import { DEFAULT_OPTIONS, resolveOptions } from "../src/options.ts"

test("uses safe defaults for missing or malformed options", () => {
  const options = resolveOptions("wrong type")
  assert.equal(options.mode, DEFAULT_OPTIONS.mode)
  assert.equal(options.model, undefined)
  assert.equal(options.maxGrowth, DEFAULT_OPTIONS.maxGrowth)
  assert.equal(options.skipCommands, DEFAULT_OPTIONS.skipCommands)
  assert.equal(options.skipDetailed, DEFAULT_OPTIONS.skipDetailed)
  assert.equal(options.llmTimeoutMs, 20000)
})

test("reads llm options and clamps numeric values", () => {
  const options = resolveOptions({
    mode: "llm",
    model: { providerID: "provider", id: "cheap-model" },
    maxGrowth: 5,
    llmTimeoutMs: -1,
  })

  assert.equal(options.mode, "llm")
  assert.deepEqual(options.model, { providerID: "provider", id: "cheap-model" })
  assert.equal(options.maxGrowth, 1)
  assert.equal(options.llmTimeoutMs, 100)
})

test("keeps a model variant from options", () => {
  const options = resolveOptions({
    mode: "llm",
    model: { providerID: "provider", id: "cheap-model", variant: "high" },
  })

  assert.deepEqual(options.model, { providerID: "provider", id: "cheap-model", variant: "high" })
})

test("ignores incomplete model definitions", () => {
  const options = resolveOptions({ mode: "llm", model: { id: "cheap-model" } })
  assert.equal(options.model, undefined)
})
