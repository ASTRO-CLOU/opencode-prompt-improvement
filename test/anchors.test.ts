import assert from "node:assert/strict"
import test from "node:test"
import { anchorsPreserved, extractAnchors, noNewAnchors } from "../src/anchors.ts"

test("extracts paths, urls, backticked text, numbers and mentions", () => {
  const anchors = extractAnchors("see src/a.ts, https://example.com/x, `foo` and v2 @alice")
  assert.ok(anchors.includes("src/a.ts"))
  assert.ok(anchors.includes("https://example.com/x"))
  assert.ok(anchors.includes("`foo`"))
  assert.ok(anchors.includes("2"))
  assert.ok(anchors.includes("@alice"))
})

test("accepts a rewrite that keeps the anchors", () => {
  assert.equal(
    anchorsPreserved("fix src/a.ts and `foo` now", "Please fix src/a.ts and `foo` now."),
    true,
  )
})

test("rejects a rewrite that changes a path", () => {
  assert.equal(anchorsPreserved("fix src/a.ts now", "fix src/b.ts now"), false)
})

test("rejects a rewrite that invents a new path", () => {
  assert.equal(noNewAnchors("fix src/a.ts now", "fix src/a.ts and src/b.ts now"), false)
})
