import { anchorsPreserved, noNewAnchors } from "./anchors.ts"
import { refineWithModel } from "./llm.ts"
import { normalizeText } from "./normalize.ts"
import type { GenerateTextFn, Refinement, RefineOptions } from "./types.ts"

function hasStructuredLines(text: string): boolean {
  let count = 0

  for (const line of text.split("\n")) {
    if (/^[ \t]*(?:[-+*]|\d+\.)[ \t]/.test(line) || /^#{1,6}[ \t]/.test(line)) count++
    if (count >= 3) return true
  }

  return false
}

export function shouldSkip(text: string, options: RefineOptions, force = false): boolean {
  if (text.length === 0 || text.trim().length === 0) return true
  if (force) return false
  if (options.skipCommands && /^\/[A-Za-z][\w-]*(?:[ \t]|$)/.test(text.trimStart())) return true
  if (text.trimStart().startsWith("*")) return true
  if (options.skipDetailed) {
    if (text.length > options.detailedThreshold) return true
    if (hasStructuredLines(text)) return true
  }
  return false
}

function isAcceptable(original: string, candidate: string, options: RefineOptions): boolean {
  if (candidate.length === 0) return false
  if (candidate.length > original.length * (1 + options.maxGrowth)) return false
  return anchorsPreserved(original, candidate)
}

function identityOffsets(length: number): number[] {
  return Array.from({ length: length + 1 }, (_, index) => index)
}

export async function refinePrompt(
  text: string,
  options: RefineOptions,
  generate?: GenerateTextFn,
  allowLlm = true,
  onError?: (error: unknown) => Promise<void> | void,
  force = false,
): Promise<Refinement | undefined> {
  if (shouldSkip(text, options, force)) return undefined

  const deterministic = normalizeText(text)
  let candidate = deterministic.text

  if (options.mode === "llm" && allowLlm && options.model && generate) {
    try {
      const generated = await refineWithModel(generate, text, options.model, options.llmTimeoutMs)
      if (generated !== undefined) {
        const polished = normalizeText(generated).text
        const keepsContent = polished.length >= text.length * 0.9
        if (keepsContent && isAcceptable(text, polished, options) && noNewAnchors(text, polished)) {
          candidate = polished
        }
      }
    } catch (error) {
      await onError?.(error)
      candidate = deterministic.text
    }
  }

  if (candidate === text) return undefined

  if (!isAcceptable(text, candidate, options)) {
    if (candidate === deterministic.text) return undefined
    if (deterministic.text === text || !isAcceptable(text, deterministic.text, options)) {
      return undefined
    }
    return deterministic
  }

  if (candidate !== deterministic.text) {
    return { text: candidate, offsets: identityOffsets(text.length) }
  }

  return deterministic
}
