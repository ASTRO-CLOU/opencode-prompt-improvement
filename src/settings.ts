import { OPTION_KEYS, parseOptionValue, type OptionKey } from "./options.ts"
import type { RefineOptions, StorageLike } from "./types.ts"

const SETTINGS_KEY = "opencode-prompt-improvement.settings"

export type RuntimeSettings = Partial<RefineOptions>

export interface SettingsStore {
  read(): Promise<RuntimeSettings>
  clear(): Promise<void>
  setOption(key: OptionKey, value: unknown): Promise<boolean>
  clearOption(key: OptionKey): Promise<void>
  setMode(mode: RefineOptions["mode"]): Promise<void>
  setModel(model?: RefineOptions["model"]): Promise<void>
  effectiveOptions(base: RefineOptions): Promise<RefineOptions>
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}

export function parseSettings(value: unknown): RuntimeSettings {
  const record = asRecord(value)
  const settings: RuntimeSettings = {}

  for (const key of OPTION_KEYS) {
    if (!Object.keys(record).includes(key)) continue
    const parsed = parseOptionValue(key, record[key])
    if (parsed === undefined) continue
    ;(settings as Record<string, unknown>)[key] = parsed
  }

  return settings
}

export function mergeSettings(base: RefineOptions, stored: RuntimeSettings): RefineOptions {
  return { ...base, ...stored } as RefineOptions
}

export function createSettings(storage: StorageLike): SettingsStore {
  const read = async () => parseSettings(await storage.get(SETTINGS_KEY))

  const write = async (settings: RuntimeSettings) => {
    await storage.set(SETTINGS_KEY, settings)
  }

  const setOption = async (key: OptionKey, value: unknown): Promise<boolean> => {
    const parsed = parseOptionValue(key, value)
    if (parsed === undefined) return false
    await write({ ...(await read()), [key]: parsed })
    return true
  }

  const clearOption = async (key: OptionKey): Promise<void> => {
    const next = { ...(await read()) }
    delete next[key]
    await write(next)
  }

  return {
    read,
    async clear() {
      await write({})
    },
    setOption,
    clearOption,
    async setMode(mode) {
      await setOption("mode", mode)
    },
    async setModel(model) {
      if (model === undefined) {
        await clearOption("model")
        return
      }
      await setOption("model", model)
    },
    async effectiveOptions(base) {
      return mergeSettings(base, await read())
    },
  }
}
