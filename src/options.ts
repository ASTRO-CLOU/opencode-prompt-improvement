import type { ModelRef, RefineOptions, RefineMode } from "./types.ts"

export const DEFAULT_OPTIONS: RefineOptions = {
  mode: "deterministic",
  maxGrowth: 0.4,
  skipCommands: true,
  skipDetailed: true,
  detailedThreshold: 2000,
  llmTimeoutMs: 20000,
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback
}

function readNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

function readModel(value: unknown): ModelRef | undefined {
  const record = asRecord(value)
  const providerID = record.providerID
  const id = record.id
  if (typeof providerID !== "string" || providerID.length === 0) return undefined
  if (typeof id !== "string" || id.length === 0) return undefined
  const variant = record.variant
  return typeof variant === "string" && variant.length > 0
    ? { providerID, id, variant }
    : { providerID, id }
}

export type OptionKey =
  | "mode"
  | "model"
  | "maxGrowth"
  | "skipCommands"
  | "skipDetailed"
  | "detailedThreshold"
  | "llmTimeoutMs"

export const OPTION_KEYS: readonly OptionKey[] = [
  "mode",
  "model",
  "maxGrowth",
  "skipCommands",
  "skipDetailed",
  "detailedThreshold",
  "llmTimeoutMs",
]

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function parseOptionValue(key: OptionKey, raw: unknown): unknown | undefined {
  switch (key) {
    case "mode":
      return raw === "llm" || raw === "deterministic" ? raw : undefined
    case "model":
      return readModel(raw)
    case "maxGrowth":
    case "detailedThreshold":
    case "llmTimeoutMs": {
      if (typeof raw !== "number" || !Number.isFinite(raw)) return undefined
      if (key === "maxGrowth") return clampNumber(raw, 0, 1)
      if (key === "detailedThreshold") return clampNumber(raw, 0, 100_000)
      return clampNumber(raw, 100, 60_000)
    }
    case "skipCommands":
    case "skipDetailed":
      return typeof raw === "boolean" ? raw : undefined
  }
}

export function parseOptionInput(key: OptionKey, raw: string): unknown | undefined {
  if (key === "skipCommands" || key === "skipDetailed") {
    if (raw === "true") return true
    if (raw === "false") return false
    return undefined
  }
  if (key === "mode" || key === "model") return parseOptionValue(key, raw)
  const value = Number(raw)
  if (raw.trim().length === 0 || !Number.isFinite(value)) return undefined
  return parseOptionValue(key, value)
}

export function resolveOptions(raw: unknown): RefineOptions {
  const input = asRecord(raw)
  const mode: RefineMode = input.mode === "llm" ? "llm" : "deterministic"

  return {
    mode,
    model: readModel(input.model),
    maxGrowth: readNumber(input.maxGrowth, DEFAULT_OPTIONS.maxGrowth, 0, 1),
    skipCommands: readBoolean(input.skipCommands, DEFAULT_OPTIONS.skipCommands),
    skipDetailed: readBoolean(input.skipDetailed, DEFAULT_OPTIONS.skipDetailed),
    detailedThreshold: readNumber(
      input.detailedThreshold,
      DEFAULT_OPTIONS.detailedThreshold,
      0,
      100_000,
    ),
    llmTimeoutMs: readNumber(input.llmTimeoutMs, DEFAULT_OPTIONS.llmTimeoutMs, 100, 60_000),
  }
}
