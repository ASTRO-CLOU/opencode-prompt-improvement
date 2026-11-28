export interface ModelRef {
  providerID: string
  id: string
  variant?: string
}

export type RefineMode = "deterministic" | "llm"

export interface RefineOptions {
  mode: RefineMode
  model?: ModelRef
  maxGrowth: number
  skipCommands: boolean
  skipDetailed: boolean
  detailedThreshold: number
  llmTimeoutMs: number
}

export interface Mention {
  start: number
  end: number
  text: string
}

export interface Refinement {
  text: string
  offsets: readonly number[]
}

export interface NormalizeResult {
  text: string
  offsets: number[]
}

export interface GenerateTextFn {
  (
    input: { model: ModelRef; prompt: string },
    options?: { signal?: AbortSignal },
  ): Promise<unknown>
}

export interface StorageLike {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown): Promise<void>
  remove?(key: string): Promise<void>
}
