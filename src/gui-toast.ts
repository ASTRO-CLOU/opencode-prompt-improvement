import type { NoticeVariant } from "./contract.ts"

export interface GuiToastOptions {
  title: string
  description: string
  variant: "default" | "success" | "error"
  duration: number
  persistent?: boolean
}

const VARIANTS: Readonly<Record<NoticeVariant, "default" | "success" | "error">> = {
  info: "default",
  success: "success",
  warning: "default",
  error: "error",
}

const KNOWN: readonly string[] = ["info", "success", "warning", "error"]

export function toGuiToastOptions(data: Readonly<Record<string, unknown>>): GuiToastOptions {
  const description = typeof data.text === "string" ? data.text : ""
  const variant = KNOWN.includes(data.variant as string)
    ? (data.variant as NoticeVariant)
    : "info"
  const persistent = data.persistent === true

  return {
    title: "Prompt improvement",
    description,
    variant: VARIANTS[variant],
    duration: 6000,
    ...(persistent ? { persistent: true } : {}),
  }
}
