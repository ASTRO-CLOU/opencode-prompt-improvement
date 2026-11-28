import assert from "node:assert/strict"
import test from "node:test"
import { createToggle } from "../src/control.ts"

test("defaults to enabled and persists the disabled state", async () => {
  const values = new Map<string, boolean>()
  const storage = {
    async get(key: string) {
      return values.get(key)
    },
    async set(key: string, value: unknown) {
      values.set(key, value as boolean)
    },
  }

  const toggle = createToggle(storage)
  assert.equal(await toggle.isEnabled(), true)

  await toggle.setEnabled(false)
  assert.equal(await toggle.isEnabled(), false)

  await toggle.setEnabled(true)
  assert.equal(await toggle.isEnabled(), true)
})
