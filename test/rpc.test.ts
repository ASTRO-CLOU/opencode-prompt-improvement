import assert from "node:assert/strict"
import test from "node:test"
import { RefineRpc, toToastOptions } from "../src/rpc.ts"

test("rpc definition exposes a single notice event", () => {
  assert.equal(RefineRpc.id, "opencode-prompt-improvement")
  assert.deepEqual(Object.keys(RefineRpc.events), ["notice"])

  const schema = RefineRpc.events.notice.schema as {
    properties?: Readonly<Record<string, unknown>>
    required?: readonly string[]
  }
  assert.ok(schema.properties?.text)
  assert.ok(schema.properties?.variant)
  assert.ok(schema.properties?.sessionID)
  assert.ok(schema.properties?.persistent)
  assert.deepEqual(schema.required, ["text"])
})

test("rpc definition exposes no callable methods", () => {
  assert.deepEqual(Object.keys(RefineRpc.methods), [])
})

test("toast options come from event data", () => {
  assert.deepEqual(
    toToastOptions({ text: "Refinement is on", variant: "success", sessionID: "ses_1" }),
    {
      title: "Prompt improvement",
      message: "Refinement is on",
      variant: "success",
      duration: 6000,
      sessionID: "ses_1",
    },
  )
})

test("toast options fall back for invalid event data", () => {
  assert.deepEqual(toToastOptions({ text: 42, variant: "bogus", sessionID: 7 }), {
    title: "Prompt improvement",
    message: "",
    variant: "info",
    duration: 6000,
  })
})

test("persistent notices get a long TUI duration", () => {
  assert.equal(
    toToastOptions({ text: "Models", persistent: true }).duration,
    86_400_000,
  )
})
