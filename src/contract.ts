import { Rpc } from "@opencode/plugin/rpc"

export type NoticeVariant = "info" | "success" | "warning" | "error"

export const RefineRpc = Rpc.define({
  id: "opencode-prompt-improvement",
  methods: {},
  events: {
    notice: {
      schema: {
        type: "object",
        properties: {
          text: { type: "string" },
          variant: { type: "string", enum: ["info", "success", "warning", "error"] },
          sessionID: { type: "string" },
          persistent: { type: "boolean" },
        },
        required: ["text"],
        additionalProperties: false,
      },
    },
  },
})
