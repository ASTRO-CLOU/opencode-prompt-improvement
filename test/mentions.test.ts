import assert from "node:assert/strict"
import test from "node:test"
import { remapMentions } from "../src/mentions.ts"
import { normalizeText } from "../src/normalize.ts"

test("remaps an attachment mention after normalization", () => {
  const original = "check @a.ts   now"
  const refinement = normalizeText(original)
  const mapped = remapMentions([{ mention: { start: 6, end: 11, text: "@a.ts" } }], refinement)

  assert.deepEqual(mapped, [{ start: 6, end: 11, text: "@a.ts" }])
})

test("refuses to continue when a mention no longer matches", () => {
  const refinement = normalizeText("check @a.ts   now")
  const mapped = remapMentions([{ mention: { start: 6, end: 11, text: "@b.ts" } }], refinement)
  assert.equal(mapped, undefined)
})
