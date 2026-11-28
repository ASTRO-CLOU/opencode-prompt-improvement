import { Plugin } from "@opencode/plugin/gui"
import { RefineRpc } from "./contract.ts"
import { toGuiToastOptions } from "./gui-toast.ts"

export default Plugin.define({
  setup(context) {
    const refine = context.client.rpc(RefineRpc)
    return refine.events.on("notice", (event) => {
      context.toast.show(toGuiToastOptions(event.data as Readonly<Record<string, unknown>>))
    })
  },
})
