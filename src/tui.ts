import { Plugin } from "@opencode/plugin/tui"
import { RefineRpc } from "./contract.ts"
import { toToastOptions } from "./rpc.ts"

export default Plugin.define({
  id: "opencode-prompt-improvement",

  setup(context) {
    const refine = context.client.rpc(RefineRpc)
    return refine.events.on("notice", (event) => {
      context.ui.toast.show(toToastOptions(event.data as Readonly<Record<string, unknown>>))
    })
  },
})
