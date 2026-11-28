import assert from "node:assert/strict"
import test from "node:test"
import { normalizeText } from "../src/normalize.ts"

test("normalizes line endings, zero-width characters and exotic spaces", () => {
  const result = normalizeText("hello\u200B world\u00A0!\r\nsecond  line   ")
  assert.equal(result.text, "hello world !\nsecond line")
})

test("collapses extra blank lines and trims the edges", () => {
  assert.equal(normalizeText("\n\nfirst\n\n\n\nsecond\n\n").text, "first\n\nsecond")
})

test("preserves indentation but collapses repeated inner spaces", () => {
  assert.equal(normalizeText("    indented    text").text, "    indented text")
})

test("leaves fenced code blocks unchanged", () => {
  const input = "before\n```js\n\n\nconst x = 1   \n```\nafter"
  assert.equal(normalizeText(input).text, input)
})

test("offsets still point at mentions after rewriting", () => {
  const input = "check @a.ts   now"
  const result = normalizeText(input)
  const start = input.indexOf("@a.ts")
  const end = start + "@a.ts".length

  assert.equal(result.text, "check @a.ts now")
  assert.equal(result.text.slice(result.offsets[start], result.offsets[end]), "@a.ts")
})
