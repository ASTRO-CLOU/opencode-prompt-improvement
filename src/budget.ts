import { createHash } from "node:crypto"
import type { ModelRef, StorageLike } from "./types.ts"

const STATE_KEY = "opencode-prompt-improvement.budget"
const COOLDOWN_MS = 6 * 60 * 60 * 1000
const CACHE_LIMIT = 100
const CACHE_VERSION = "v6"

interface CacheEntry {
  text: string
  createdAt: number
}

interface BudgetState {
  cache: Record<string, CacheEntry>
  cooldownUntil: number
}

export type BudgetDecision =
  | { kind: "run" }
  | { kind: "cache"; text: string }
  | { kind: "skip"; reason: string }

export interface BudgetStatus {
  summary: string
}

export interface PromptBudget {
  prepare(prompt: string, model: ModelRef): Promise<BudgetDecision>
  recordSuccess(prompt: string, model: ModelRef, text: string): Promise<void>
  recordFailure(error: unknown): Promise<void>
  status(): Promise<BudgetStatus>
  reset(): Promise<void>
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}

function emptyState(): BudgetState {
  return { cache: {}, cooldownUntil: 0 }
}

function parseState(value: unknown): BudgetState {
  const record = asRecord(value)
  const cache: Record<string, CacheEntry> = {}
  const storedCache = asRecord(record.cache)

  for (const [key, entry] of Object.entries(storedCache)) {
    const item = asRecord(entry)
    if (typeof item.text !== "string") continue
    cache[key] = {
      text: item.text,
      createdAt: typeof item.createdAt === "number" ? item.createdAt : 0,
    }
  }

  const cooldownUntil = record.cooldownUntil

  return {
    cache,
    cooldownUntil: typeof cooldownUntil === "number" ? cooldownUntil : 0,
  }
}

function cacheKey(prompt: string, model: ModelRef): string {
  const modelId = `${model.providerID}/${model.id}${
    model.variant === undefined ? "" : `#${model.variant}`
  }`
  return createHash("sha256")
    .update(CACHE_VERSION)
    .update("\u0000")
    .update(prompt)
    .update("\u0000")
    .update(modelId)
    .digest("hex")
    .slice(0, 32)
}

function quotaReason(error: unknown): boolean {
  const record = error as { message?: unknown; _tag?: unknown; reason?: unknown }
  const parts = [record.message, record._tag, record.reason].filter(
    (part): part is string => typeof part === "string",
  )
  const text = parts.join(" ").toLowerCase()
  return (
    text.includes("free usage limit") ||
    text.includes("rate_limit") ||
    text.includes("ratelimit") ||
    text.includes("quota") ||
    text.includes("too many requests")
  )
}

export function createPromptBudget(storage: StorageLike): PromptBudget {
  const read = async (): Promise<BudgetState> => parseState(await storage.get(STATE_KEY))
  const write = async (state: BudgetState): Promise<void> => {
    await storage.set(STATE_KEY, state)
  }

  return {
    async prepare(prompt, model) {
      const state = await read()
      const key = cacheKey(prompt, model)
      const cached = state.cache[key]
      if (cached !== undefined) return { kind: "cache", text: cached.text }

      const now = Date.now()
      if (state.cooldownUntil > now) {
        const minutes = Math.ceil((state.cooldownUntil - now) / 60_000)
        return { kind: "skip", reason: `cooldown (${String(minutes)}m left)` }
      }

      return { kind: "run" }
    },

    async recordSuccess(prompt, model, text) {
      const state = await read()
      state.cache[cacheKey(prompt, model)] = { text, createdAt: Date.now() }
      const keys = Object.keys(state.cache)
      if (keys.length > CACHE_LIMIT) {
        const ordered = keys.sort(
          (left, right) => (state.cache[left]?.createdAt ?? 0) - (state.cache[right]?.createdAt ?? 0),
        )
        for (const key of ordered.slice(0, keys.length - CACHE_LIMIT)) delete state.cache[key]
      }
      await write(state)
    },

    async recordFailure(error) {
      if (!quotaReason(error)) return
      const state = await read()
      state.cooldownUntil = Math.max(state.cooldownUntil, Date.now() + COOLDOWN_MS)
      await write(state)
    },

    async status() {
      const state = await read()
      const now = Date.now()
      const parts = [`cache ${String(Object.keys(state.cache).length)}`]
      if (state.cooldownUntil > now) {
        const minutes = Math.ceil((state.cooldownUntil - now) / 60_000)
        parts.push(`paused ${String(minutes)}m`)
      }
      return { summary: parts.join("; ") }
    },

    async reset() {
      await write(emptyState())
    },
  }
}
