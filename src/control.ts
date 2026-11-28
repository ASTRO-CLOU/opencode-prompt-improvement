import type { StorageLike } from "./types.ts"

const STATE_KEY = "opencode-prompt-improvement.enabled"

export const FORCE_PROMPT_PREFIX = "[imp-force] "

export interface RefineToggle {
  isEnabled(): Promise<boolean>
  setEnabled(enabled: boolean): Promise<void>
}

export function createToggle(storage: StorageLike): RefineToggle {
  return {
    async isEnabled() {
      return (await storage.get(STATE_KEY)) !== false
    },
    async setEnabled(enabled) {
      await storage.set(STATE_KEY, enabled)
    },
  }
}
