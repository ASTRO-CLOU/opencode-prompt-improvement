import assert from "node:assert/strict"
import test from "node:test"
import {
  findModel,
  formatModelList,
  normalizeModels,
  parseModelArgument,
} from "../src/model.ts"

const models = normalizeModels([
  { providerID: "anthropic", id: "anthropic.claude-haiku-4-5", modelID: "claude-haiku-4-5", name: "Claude Haiku" },
  {
    providerID: "openai",
    id: "openai.gpt-4o-mini",
    modelID: "gpt-4o-mini",
    name: "GPT-4o mini",
    variants: [{ id: "none" }, { id: "high" }],
  },
])

test("normalizes model lists from several response shapes", () => {
  assert.equal(models.length, 2)
  assert.deepEqual(normalizeModels({ data: models }), models)
  assert.deepEqual(normalizeModels({ models }), models)
  assert.deepEqual(normalizeModels({ data: [{ providerID: "x" }] }), [])
  assert.deepEqual(normalizeModels(undefined), [])
})

test("parses provider and model with a slash", () => {
  assert.deepEqual(parseModelArgument("anthropic/claude-haiku-4-5", models), {
    providerID: "anthropic",
    id: "claude-haiku-4-5",
  })
})

test("parses a variant after a hash", () => {
  assert.deepEqual(parseModelArgument("openai/gpt-4o-mini#none", models), {
    providerID: "openai",
    id: "gpt-4o-mini",
    variant: "none",
  })
})

test("parses a variant from a model id suffix", () => {
  assert.deepEqual(parseModelArgument("openai/gpt-4o-mini-high", models), {
    providerID: "openai",
    id: "gpt-4o-mini",
    variant: "high",
  })
})

test("rejects a variant that the model does not offer", () => {
  assert.equal(parseModelArgument("openai/gpt-4o-mini#max", models), undefined)
  assert.equal(parseModelArgument("openai/gpt-4o-mini-max", models), undefined)
})

test("parses provider and model separated by a space", () => {
  assert.deepEqual(parseModelArgument("openai gpt-4o-mini", models), {
    providerID: "openai",
    id: "gpt-4o-mini",
  })
})

test("parses a unique model id without a provider", () => {
  assert.deepEqual(parseModelArgument("gpt-4o-mini", models), {
    providerID: "openai",
    id: "gpt-4o-mini",
  })
})

test("rejects an ambiguous model id and an empty argument", () => {
  const ambiguous = normalizeModels([
    { providerID: "one", id: "a", modelID: "shared", name: "A" },
    { providerID: "two", id: "b", modelID: "shared", name: "B" },
  ])
  assert.equal(parseModelArgument("shared", ambiguous), undefined)
  assert.equal(parseModelArgument("   ", models), undefined)
})

test("rejects an unknown provider/model pair", () => {
  assert.equal(parseModelArgument("missing/model", models), undefined)
})

test("finds a model by provider and id, ignoring the variant", () => {
  assert.deepEqual(findModel(models, { providerID: "anthropic", id: "claude-haiku-4-5" }), models[0])
  assert.deepEqual(
    findModel(models, { providerID: "openai", id: "gpt-4o-mini", variant: "none" }),
    models[1],
  )
  assert.equal(findModel(models, { providerID: "anthropic", id: "gone" }), undefined)
})

test("formats, filters and limits the model list", () => {
  const all = formatModelList(models)
  assert.match(all, /Models 1-2 of 2/)
  assert.match(all, /Use \/imp-model provider\/model#variant/)
  assert.match(all, /1 anthropic\/claude-haiku-4-5 · 2 openai\/gpt-4o-mini/)
  assert.doesNotMatch(all, /Claude Haiku/)
  assert.doesNotMatch(all, /variants:/)

  const filtered = formatModelList(models, "haiku")
  assert.match(filtered, /anthropic\/claude-haiku-4-5/)
  assert.doesNotMatch(filtered, /gpt-4o-mini/)

  const limited = formatModelList(models, undefined, 1)
  assert.match(limited, /More: \/imp-models <filter>/)
})

test("formats an empty model list", () => {
  assert.equal(formatModelList([]), "No models found.")
})
