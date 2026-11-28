import assert from "node:assert/strict"
import { test } from "node:test"
import { toGuiToastOptions } from "../src/gui-toast.ts"

test("notice maps text, variant and duration", () => {
  assert.deepEqual(toGuiToastOptions({ text: "Done", variant: "success" }), {
    title: "Prompt improvement",
    description: "Done",
    variant: "success",
    duration: 6000,
  })
})

test("notice maps info and warning to default toast", () => {
  assert.equal(toGuiToastOptions({ text: "Info", variant: "info" }).variant, "default")
  assert.equal(toGuiToastOptions({ text: "Warn", variant: "warning" }).variant, "default")
})

test("notice maps error to error toast", () => {
  assert.equal(toGuiToastOptions({ text: "Failed", variant: "error" }).variant, "error")
})

test("persistent notices stay until dismissed", () => {
  assert.deepEqual(toGuiToastOptions({ text: "Models", persistent: true }), {
    title: "Prompt improvement",
    description: "Models",
    variant: "default",
    duration: 6000,
    persistent: true,
  })
})

test("notice handles missing and invalid fields", () => {
  assert.deepEqual(toGuiToastOptions({}), {
    title: "Prompt improvement",
    description: "",
    variant: "default",
    duration: 6000,
  })
  assert.equal(toGuiToastOptions({ text: 1, variant: "unknown" }).variant, "default")
})
