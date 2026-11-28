import { Plugin } from "@opencode/plugin"
import { createPromptBudget } from "./src/budget.ts"
import { createToggle, FORCE_PROMPT_PREFIX } from "./src/control.ts"
import {
  findModel,
  formatModelList,
  listAvailableModels,
  parseModelArgument,
  type AvailableModel,
} from "./src/model.ts"
import { remapMentions, type MentionCarrier } from "./src/mentions.ts"
import {
  OPTION_KEYS,
  parseOptionInput,
  resolveOptions,
  type OptionKey,
} from "./src/options.ts"
import { refinePrompt } from "./src/refine.ts"
import { LLM_PROMPT_PREFIX } from "./src/llm.ts"
import { RefineRpc, type NoticeVariant } from "./src/contract.ts"
import { createSettings } from "./src/settings.ts"
import type { GenerateTextFn, Mention, ModelRef, RefineOptions } from "./src/types.ts"

function applyMentions(
  attachments: MentionCarrier[],
  mapped: (Mention | undefined)[] | undefined,
): void {
  if (mapped === undefined) return

  for (let index = 0; index < attachments.length; index++) {
    const mention = mapped[index]
    if (mention !== undefined && attachments[index] !== undefined) {
      attachments[index].mention = mention
    }
  }
}

function extractGeneratedText(result: unknown): string | undefined {
  if (typeof result === "string") return result
  if (typeof result !== "object" || result === null) return undefined
  const record = result as { text?: unknown; data?: { text?: unknown } }
  if (typeof record.text === "string") return record.text
  if (typeof record.data === "object" && record.data !== null && typeof record.data.text === "string") {
    return record.data.text
  }
  return undefined
}

async function withSignal<T>(work: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (signal === undefined) return await work
  if (signal.aborted) throw signal.reason ?? new Error("LLM request aborted")
  return await new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener("abort", onAbort)
      reject(signal.reason ?? new Error("LLM request aborted"))
    }
    signal.addEventListener("abort", onAbort, { once: true })
    work.then(
      (value) => {
        signal.removeEventListener("abort", onAbort)
        resolve(value)
      },
      (error: unknown) => {
        signal.removeEventListener("abort", onAbort)
        reject(error)
      },
    )
  })
}

export default Plugin.define({
  id: "opencode-prompt-improvement",

  async setup(ctx) {
    const options = resolveOptions(ctx.options)
    const toggle = createToggle(ctx.storage)
    const settings = createSettings(ctx.storage)
    const createSession = ctx.session.create as unknown as
      | ((input: { model: ModelRef; title: string }) => Promise<{ id: string }>)
      | undefined
    const generateInSession = ctx.session.generate as unknown as
      | ((input: { sessionID: string; prompt: string }) => Promise<{ text: string }>)
      | undefined
    const removeSession = ctx.session.remove as unknown as
      | ((input: { sessionID: string }) => Promise<void> | void)
      | undefined
    const promptInSession = ctx.session.prompt as unknown as
      | ((input: { sessionID: string; text: string; delivery?: "steer" | "queue" }) => Promise<unknown>)
      | undefined
    const generateText = (
      ctx.experimental as
        | { generate?: { text?: (input: { prompt: string; model: ModelRef | null }) => Promise<unknown> } }
        | undefined
    )?.generate?.text

    const budget = createPromptBudget(ctx.storage)
    const runGeneration = async (
      input: { model: ModelRef; prompt: string },
      requestOptions?: { signal?: AbortSignal },
    ): Promise<unknown> => {
      if (generateText !== undefined) {
        try {
          const result = await withSignal(
            Promise.resolve(generateText({ prompt: input.prompt, model: input.model })),
            requestOptions?.signal,
          )
          if (extractGeneratedText(result) !== undefined) return result
        } catch (error) {
          if (requestOptions?.signal?.aborted) throw error
        }
      }

      if (createSession === undefined || generateInSession === undefined || removeSession === undefined) {
        throw new Error("Generation is unavailable")
      }
      const session = await createSession({ model: input.model, title: "Prompt improvement" })
      const work = generateInSession({ sessionID: session.id, prompt: input.prompt })
      let removed = false
      const remove = () => {
        if (removed) return
        removed = true
        void Promise.resolve(removeSession({ sessionID: session.id })).catch(() => {})
      }
      void work.then(remove, remove)
      return await withSignal(work, requestOptions?.signal)
    }

    const generate: GenerateTextFn | undefined =
      createSession === undefined || generateInSession === undefined || removeSession === undefined
        ? undefined
        : async (input, requestOptions) => {
            const decision = await budget.prepare(input.prompt, input.model)
            if (decision.kind === "cache") return { text: decision.text }
            if (decision.kind === "skip") throw new Error(`LLM skipped: ${decision.reason}`)

            try {
              const result = await runGeneration(input, requestOptions)
              const text = extractGeneratedText(result)
              if (text !== undefined) await budget.recordSuccess(input.prompt, input.model, text)
              return result
            } catch (error) {
              await budget.recordFailure(error)
              throw error
            }
          }
    const effectiveOptions = () => settings.effectiveOptions(options)
    const rpc = await ctx.rpc.register(RefineRpc, {})

    await ctx.session.hook("prompt", async (event) => {
      const forced = event.prompt.text.startsWith(FORCE_PROMPT_PREFIX)
      const original = forced
        ? event.prompt.text.slice(FORCE_PROMPT_PREFIX.length)
        : event.prompt.text

      if (!forced && (await toggle.isEnabled()) === false) return
      if (original.startsWith(LLM_PROMPT_PREFIX)) return
      const files = event.prompt.files ?? []
      const agents = event.prompt.agents ?? []
      const skills = event.prompt.skills ?? []
      const attachments: MentionCarrier[] = [...files, ...agents, ...skills]
      const hasMentions = attachments.some((attachment) => attachment.mention !== undefined)

      const refinement = await refinePrompt(
        original,
        await effectiveOptions(),
        generate,
        !hasMentions,
        (error) => reportLlmError(event.sessionID, error),
        forced,
      )
      if (refinement === undefined || refinement.text === original) return

      const mappedFiles = remapMentions(files, refinement)
      const mappedAgents = remapMentions(agents, refinement)
      const mappedSkills = remapMentions(skills, refinement)
      if (!mappedFiles || !mappedAgents || !mappedSkills) return

      applyMentions(files, mappedFiles)
      applyMentions(agents, mappedAgents)
      applyMentions(skills, mappedSkills)
      event.prompt.text = refinement.text
      event.metadata = { ...event.metadata, displayText: refinement.text }
    })

    const notify = async (
      sessionID: string,
      text: string,
      variant: NoticeVariant = "info",
      persistent = false,
    ) => {
      await rpc.events.emit("notice", { text, variant, sessionID, persistent })
    }

    const reportedLlmErrors = new Set<string>()
    const reportLlmError = async (sessionID: string, error: unknown) => {
      const record = error as { message?: unknown; _tag?: unknown }
      const message =
        typeof record.message === "string" && record.message.length > 0
          ? record.message
          : typeof record._tag === "string"
            ? record._tag
            : "unknown error"
      if (message.startsWith("LLM skipped:")) return
      const key = `${sessionID}:${message}`
      if (reportedLlmErrors.has(key)) return
      reportedLlmErrors.add(key)
      await notify(
        sessionID,
        `LLM pass failed: ${message}. Using deterministic cleanup.`,
        "warning",
      )
    }

    const switchTo = async (sessionID: string, enabled: boolean) => {
      await toggle.setEnabled(enabled)
      await notify(
        sessionID,
        enabled
          ? "Prompt improvement is on."
          : "Prompt improvement is off. Prompts are sent exactly as typed.",
        enabled ? "success" : "warning",
      )
    }

    const reportStatus = async (sessionID: string) => {
      const enabled = await toggle.isEnabled()
      const effective = await effectiveOptions()
      const model = await describeModel(sessionID, effective.model)
      const budgetStatus = await budget.status()
      await notify(
        sessionID,
        `Prompt improvement is ${enabled ? "on" : "off"}. Mode: ${effective.mode}. Model: ${model}. LLM: ${budgetStatus.summary}.`,
      )
    }

    const reportModelStatus = async (sessionID: string) => {
      const effective = await effectiveOptions()
      const model = await describeModel(sessionID, effective.model)
      await notify(sessionID, `Mode: ${effective.mode}. Model: ${model}.`)
    }

    const reportConfig = async (sessionID: string) => {
      const effective: RefineOptions = await effectiveOptions()
      const model = await describeModel(sessionID, effective.model)
      const values = [
        `mode=${effective.mode}`,
        `model=${model}`,
        `maxGrowth=${effective.maxGrowth}`,
        `skipCommands=${effective.skipCommands}`,
        `skipDetailed=${effective.skipDetailed}`,
        `detailedThreshold=${effective.detailedThreshold}`,
        `llmTimeoutMs=${effective.llmTimeoutMs}`,
      ]
      await notify(sessionID, values.join("; "), "info", true)
    }

    const changeConfig = async (sessionID: string, argument: string) => {
      const parts = argument.split(/\s+/).filter((part) => part.length > 0)
      if (parts.length === 0) {
        await reportConfig(sessionID)
        return
      }

      const keyword = parts[0].toLowerCase()
      if (keyword === "reset") {
        await settings.clear()
        await notify(sessionID, "All runtime settings reset. Plugin options are used again.")
        await reportConfig(sessionID)
        return
      }

      if (!OPTION_KEYS.includes(keyword as OptionKey)) {
        await notify(sessionID, `Unknown setting: ${keyword}.`, "warning")
        return
      }

      const key = keyword as OptionKey
      const rawValue = parts.slice(1).join(" ")
      if (rawValue.length === 0 || ["clear", "off", "none"].includes(rawValue.toLowerCase())) {
        await settings.clearOption(key)
        await notify(sessionID, `${key} reset to its default or global value.`)
        await reportConfig(sessionID)
        return
      }

      if (key === "model") {
        const models = await loadModels(sessionID)
        if (models === undefined) return
        const model = parseModelArgument(rawValue, models)
        if (model === undefined) {
          await notify(sessionID, "Model not found. Use /imp-models to list models.", "warning")
          return
        }
        await settings.setOption("model", model)
      } else {
        const value = parseOptionInput(key, rawValue)
        if (value === undefined || !(await settings.setOption(key, value))) {
          await notify(sessionID, `Invalid value for ${key}.`, "warning")
          return
        }
      }

      await reportConfig(sessionID)
    }

    const loadModels = async (sessionID: string): Promise<AvailableModel[] | undefined> => {
      try {
        return await listAvailableModels(ctx.model)
      } catch {
        await notify(sessionID, "Could not load the model list.", "error")
        return undefined
      }
    }

    const describeModel = async (sessionID: string, model?: ModelRef): Promise<string> => {
      if (model === undefined) return "not set"
      const label = `${model.providerID}/${model.id}${
        model.variant === undefined ? "" : `#${model.variant}`
      }`
      const models = await loadModels(sessionID)
      if (models === undefined) return `${label} (availability unknown)`
      return findModel(models, model) === undefined ? `${label} (unavailable)` : label
    }

    const setModel = async (sessionID: string, argument: string) => {
      const models = await loadModels(sessionID)
      if (models === undefined) return

      const model = parseModelArgument(argument, models)
      if (model === undefined) {
        await notify(
          sessionID,
          "Model or variant not found. Use /imp-models to list models.",
          "warning",
        )
        return
      }

      await settings.setModel(model)
      await settings.setMode("llm")
      await toggle.setEnabled(true)
      const label = `${model.providerID}/${model.id}${
        model.variant === undefined ? "" : `#${model.variant}`
      }`
      await notify(sessionID, `Prompt improvement now uses ${label}.`)
    }

    await ctx.command.transform((editor) => {
      editor.add({
        name: "imp-status",
        description: "Show improvement state, mode and model",
        execute: ({ sessionID }) => reportStatus(sessionID),
      })
      editor.add({
        name: "imp-on",
        description: "Enable prompt improvement",
        execute: ({ sessionID }) => switchTo(sessionID, true),
      })
      editor.add({
        name: "imp-off",
        description: "Send prompts exactly as typed, without improvement",
        execute: ({ sessionID }) => switchTo(sessionID, false),
      })
      editor.add({
        name: "imp-models",
        description: "List available models, optionally filtered",
        execute: async ({ sessionID, prompt }) => {
          const filter = (prompt.text ?? "").trim()
          const models = await loadModels(sessionID)
          if (models === undefined) return
          await notify(sessionID, formatModelList(models, filter), "info", true)
        },
      })
      editor.add({
        name: "imp-model",
        description: "Set the model used for prompt improvement",
        execute: async ({ sessionID, prompt }) => {
          const argument = (prompt.text ?? "").trim()
          const keyword = argument.toLowerCase()
          if (argument.length === 0 || keyword === "status") return reportModelStatus(sessionID)
          if (keyword === "off") {
            await settings.setMode("deterministic")
            await notify(sessionID, "LLM pass is off. Deterministic cleanup only.")
            return
          }
          if (keyword === "clear") {
            await settings.clear()
            await notify(sessionID, "Model settings cleared. Plugin options are used again.")
            return
          }
          await setModel(sessionID, argument)
        },
      })
      editor.add({
        name: "imp-force",
        description: "Improve one prompt now, even when improvement is off",
        execute: async ({ sessionID, prompt }) => {
          const text = (prompt.text ?? "").trim()
          if (text.length === 0) {
            await notify(sessionID, "Usage: /imp-force <prompt>", "warning")
            return
          }
          if (promptInSession === undefined) {
            await notify(sessionID, "Forced improvement is unavailable in this host.", "error")
            return
          }
          await promptInSession({
            sessionID,
            text: `${FORCE_PROMPT_PREFIX}${text}`,
            delivery: "steer",
          })
        },
      })
      editor.add({
        name: "imp-config",
        description: "Show or change refinement settings at runtime",
        execute: async ({ sessionID, prompt }) => {
          await changeConfig(sessionID, (prompt.text ?? "").trim())
        },
      })
    })
  },
})
