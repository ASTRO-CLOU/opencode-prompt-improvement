import type { NormalizeResult } from "./types.ts"

const ZERO_WIDTH = /[\uFEFF\u200B\u200C\u200D\u2060\u2061\u2062\u2063\u2064\u180E]/u
const EXOTIC_SPACE = /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/u
const FENCE = /`{3,}|~{3,}/y

interface PhaseA {
  text: string
  offsets: number[]
  codeFlags: boolean[]
}

function computeTrailingSpaces(input: string): boolean[] {
  const trailing = new Array<boolean>(input.length).fill(false)
  let start = 0

  while (start < input.length) {
    let end = start
    while (end < input.length && input[end] !== "\n" && input[end] !== "\r") end++
    let last = end - 1
    while (last >= start && (input[last] === " " || input[last] === "\t")) {
      trailing[last] = true
      last--
    }
    start = end + 1
  }

  return trailing
}

function phaseA(input: string): PhaseA {
  const output: string[] = []
  const offsets = new Array<number>(input.length + 1)
  const codeFlags = new Array<boolean>(input.length)
  const trailing = computeTrailingSpaces(input)
  let atLineStart = true
  let lineHasContent = false
  let codeFence = false

  const push = (value: string, position: number): void => {
    offsets[position] = output.length
    output.push(value)
  }

  for (let index = 0; index < input.length; index++) {
    const char = input[index]

    if (char === "\r") {
      codeFlags[index] = codeFence
      offsets[index] = output.length
      if (index + 1 < input.length && input[index + 1] === "\n") continue
      output.push("\n")
      atLineStart = true
      lineHasContent = false
      continue
    }

    if (char === "\n") {
      codeFlags[index] = codeFence
      push("\n", index)
      atLineStart = true
      lineHasContent = false
      continue
    }

    if (atLineStart) {
      FENCE.lastIndex = index
      if (FENCE.test(input)) codeFence = !codeFence
      atLineStart = false
    }

    codeFlags[index] = codeFence

    if (codeFence) {
      push(char, index)
      lineHasContent = true
      continue
    }

    if (ZERO_WIDTH.test(char)) {
      offsets[index] = output.length
      continue
    }

    if (EXOTIC_SPACE.test(char)) {
      push(" ", index)
      lineHasContent = true
      continue
    }

    if ((char === " " || char === "\t") && trailing[index]) {
      offsets[index] = output.length
      continue
    }

    if (char === " " || char === "\t") {
      let end = index
      while (end < input.length && (input[end] === " " || input[end] === "\t") && !trailing[end]) {
        end++
      }
      if (lineHasContent && end - index >= 2) {
        const target = output.length
        output.push(" ")
        for (let position = index; position < end; position++) offsets[position] = target
        index = end - 1
        continue
      }
    }

    push(char, index)
    if (char !== " " && char !== "\t") lineHasContent = true
  }

  offsets[input.length] = output.length
  return { text: output.join(""), offsets, codeFlags }
}

function phaseB(text: string, codeFlags: boolean[]): NormalizeResult {
  const output: string[] = []
  const offsets = new Array<number>(text.length + 1)
  let index = 0
  let hasContent = false

  while (index < text.length) {
    if (text[index] === "\n") {
      let end = index
      while (end < text.length && text[end] === "\n") end++

      const protectedRun = codeFlags[index] === true
      const keep = protectedRun
        ? end - index
        : hasContent && end < text.length
          ? Math.min(end - index, 2)
          : 0

      const start = output.length
      for (let position = 0; position < keep; position++) output.push("\n")
      for (let position = index; position < index + keep; position++) {
        offsets[position] = start + (position - index)
      }
      for (let position = index + keep; position < end; position++) offsets[position] = output.length
      if (keep > 0) hasContent = true
      index = end
      continue
    }

    offsets[index] = output.length
    output.push(text[index])
    hasContent = true
    index++
  }

  offsets[text.length] = output.length
  return { text: output.join(""), offsets }
}

export function normalizeText(input: string): NormalizeResult {
  const first = phaseA(input)
  const second = phaseB(first.text, first.codeFlags)
  const offsets = new Array<number>(input.length + 1)

  for (let index = 0; index <= input.length; index++) {
    offsets[index] = second.offsets[first.offsets[index]]
  }

  return { text: second.text, offsets }
}
