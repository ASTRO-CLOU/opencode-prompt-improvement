import type { NoticeVariant } from "./contract.ts"

export { RefineRpc } from "./contract.ts"
export type { NoticeVariant }

export interface ToastOptions {
  title: string
  message: string
  variant: NoticeVariant
  duration: number
  sessionID?: string
}

const VARIANTS: readonly string[] = ["info", "success", "warning", "error"]
const PERSISTENT_DURATION_MS = 86_400_000

export function toToastOptions(data: Readonly<Record<string, unknown>>): ToastOptions {
  const message = typeof data.text === "string" ? data.text : ""
  const variant = VARIANTS.includes(data.variant as string)
    ? (data.variant as NoticeVariant)
    : "info"
  const sessionID = typeof data.sessionID === "string" ? data.sessionID : undefined
  const persistent = data.persistent === true

  return {
    title: "Prompt improvement",
    message,
    variant,
    duration: persistent ? PERSISTENT_DURATION_MS : 6000,
    ...(sessionID === undefined ? {} : { sessionID }),
  }
}
