import assert from "node:assert/strict"
import test from "node:test"
import { resolveOptions } from "../src/options.ts"
import { refinePrompt } from "../src/refine.ts"
import type { GenerateTextFn } from "../src/types.ts"

const defaults = resolveOptions(undefined)
const llmOptions = resolveOptions({ mode: "llm", model: { providerID: "provider", id: "cheap" } })

test("returns nothing when the prompt is already clean", async () => {
  assert.equal(await refinePrompt("a clean prompt", defaults), undefined)
})

test("skips commands, star prefixes and structured prompts", async () => {
  assert.equal(await refinePrompt("/review   this", defaults), undefined)
  assert.equal(await refinePrompt("*continue   here", defaults), undefined)
  assert.equal(await refinePrompt("a  b  c\n- one\n- two\n- three", defaults), undefined)
})

test("cleans a messy prompt deterministically", async () => {
  const result = await refinePrompt("hello\u200B world   again", defaults)
  assert.equal(result?.text, "hello world again")
})

test("llm mode uses the configured model and keeps anchors", async () => {
  let received: unknown
  const generate: GenerateTextFn = async (input) => {
    received = input
    return { text: "I want to fix src/a.ts, please." }
  }

  const result = await refinePrompt("i want to fix src/a.ts please", llmOptions, generate)
  assert.equal(result?.text, "I want to fix src/a.ts, please.")
  assert.deepEqual((received as { model: unknown }).model, { providerID: "provider", id: "cheap" })
})

test("rejects llm output that replaces an anchor", async () => {
  const generate: GenerateTextFn = async () => ({ text: "i want to fix src/b.ts please" })
  assert.equal(await refinePrompt("i want to fix src/a.ts please", llmOptions, generate), undefined)
})

test("rejects llm output that invents a new file", async () => {
  const generate: GenerateTextFn = async () => ({ text: "i want to fix src/a.ts, add src/b.ts" })
  assert.equal(await refinePrompt("i want to fix src/a.ts please", llmOptions, generate), undefined)
})

test("skips llm when the prompt has mentions", async () => {
  let called = false
  const generate: GenerateTextFn = async () => {
    called = true
    return { text: "something else" }
  }

  const result = await refinePrompt("hello\u200B world   @a.ts", llmOptions, generate, false)
  assert.equal(called, false)
  assert.equal(result?.text, "hello world @a.ts")
})

test("falls back to deterministic cleanup when generation fails", async () => {
  const generate: GenerateTextFn = async () => {
    throw new Error("provider unavailable")
  }

  const result = await refinePrompt("hello\u200B world   again", llmOptions, generate)
  assert.equal(result?.text, "hello world again")
})
