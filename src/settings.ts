import type { ModelRef, RefineMode, RefineOptions, StorageLike } from "./types.ts"

const SETTINGS_KEY = "opencode-prompt-improvement.settings"

export interface RuntimeSettings {
  mode?: RefineMode
  model?: ModelRef
}

export interface SettingsStore {
  read(): Promise<RuntimeSettings>
  clear(): Promise<void>
  setMode(mode: RefineMode): Promise<void>
  setModel(model?: ModelRef): Promise<void>
  effectiveOptions(base: RefineOptions): Promise<RefineOptions>
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
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

export function parseSettings(value: unknown): RuntimeSettings {
  const record = asRecord(value)
  const settings: RuntimeSettings = {}

  if (record.mode === "llm" || record.mode === "deterministic") {
    settings.mode = record.mode
  }

  const model = readModel(record.model)
  if (model !== undefined) settings.model = model

  return settings
}

export function mergeSettings(base: RefineOptions, stored: RuntimeSettings): RefineOptions {
  const model = stored.model !== undefined ? stored.model : base.model
  return {
    ...base,
    ...(model !== undefined ? { model } : {}),
    mode: stored.mode ?? base.mode,
  }
}

export function createSettings(storage: StorageLike): SettingsStore {
  const read = async () => parseSettings(await storage.get(SETTINGS_KEY))

  const write = async (settings: RuntimeSettings) => {
    await storage.set(SETTINGS_KEY, settings)
  }

  return {
    read,
    async clear() {
      await write({})
    },
    async setMode(mode) {
      await write({ ...(await read()), mode })
    },
    async setModel(model) {
      await write({ ...(await read()), model })
    },
    async effectiveOptions(base) {
      return mergeSettings(base, await read())
    },
  }
}
