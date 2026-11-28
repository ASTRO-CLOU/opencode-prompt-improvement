import type { ModelRef } from "./types.ts"

export interface AvailableModel {
  providerID: string
  id: string
  name: string
  lookupIDs: string[]
  variants: string[]
}

export interface ModelLister {
  list(): Promise<unknown> | unknown
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}

function extractList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  const record = asRecord(value)
  if (Array.isArray(record.data)) return record.data
  if (Array.isArray(record.models)) return record.models
  return []
}

export function normalizeModels(value: unknown): AvailableModel[] {
  return extractList(value).flatMap((entry) => {
    const record = asRecord(entry)
    const providerID = readString(record.providerID)
    if (providerID === undefined) return []

    const modelID = readString(record.modelID) ?? readString(record.id)
    if (modelID === undefined) return []

    const fallbackID = readString(record.id) ?? modelID
    const storedLookupIDs = Array.isArray(record.lookupIDs)
      ? record.lookupIDs.filter((item): item is string => typeof item === "string" && item.length > 0)
      : []

    const storedVariants = Array.isArray(record.variants)
      ? record.variants.flatMap((variant) => {
          const variantID =
            typeof variant === "string" ? readString(variant) : readString(asRecord(variant).id)
          return variantID === undefined ? [] : [variantID]
        })
      : []

    return [
      {
        providerID,
        id: modelID,
        name: readString(record.name) ?? "",
        lookupIDs: unique(storedLookupIDs.length > 0 ? storedLookupIDs : [fallbackID, modelID]),
        variants: unique(storedVariants),
      },
    ]
  })
}

export async function listAvailableModels(lister: ModelLister): Promise<AvailableModel[]> {
  return normalizeModels(await lister.list())
}

export function findModel(
  models: readonly AvailableModel[],
  model: ModelRef,
): AvailableModel | undefined {
  const provider = model.providerID.toLowerCase()
  const id = model.id.toLowerCase()
  return models.find(
    (entry) =>
      entry.providerID.toLowerCase() === provider &&
      (entry.id.toLowerCase() === id ||
        entry.lookupIDs.some((candidate) => candidate.toLowerCase() === id)),
  )
}

function resolveModel(
  provider: string | undefined,
  modelPart: string,
  models: readonly AvailableModel[],
): AvailableModel | undefined {
  if (provider !== undefined && modelPart.length > 0) {
    return models.find(
      (model) =>
        model.providerID.toLowerCase() === provider.toLowerCase() &&
        model.lookupIDs.some((id) => id.toLowerCase() === modelPart.toLowerCase()),
    )
  }

  const needle = modelPart.toLowerCase()
  const matches = models.filter((model) =>
    model.lookupIDs.some((id) => id.toLowerCase() === needle),
  )
  return matches.length === 1 ? matches[0] : undefined
}

function buildModelRef(model: AvailableModel, variant?: string): ModelRef {
  return variant === undefined
    ? { providerID: model.providerID, id: model.id }
    : { providerID: model.providerID, id: model.id, variant }
}

export function parseModelArgument(
  argument: string,
  models: readonly AvailableModel[],
): ModelRef | undefined {
  const text = argument.trim()
  if (text.length === 0) return undefined

  const slash = text.indexOf("/")
  const whitespace = text.search(/\s/u)
  let provider: string | undefined
  let modelPart = text

  if (slash > 0) {
    provider = text.slice(0, slash).trim()
    modelPart = text.slice(slash + 1).trim()
  } else if (whitespace > 0) {
    provider = text.slice(0, whitespace).trim()
    modelPart = text.slice(whitespace).trim()
  }
  if (modelPart.length === 0) return undefined

  let requestedVariant: string | undefined
  const hash = modelPart.lastIndexOf("#")
  if (hash > 0 && hash < modelPart.length - 1) {
    requestedVariant = modelPart.slice(hash + 1).trim()
    modelPart = modelPart.slice(0, hash).trim()
  }
  if (modelPart.length === 0) return undefined

  let match = resolveModel(provider, modelPart, models)

  if (match === undefined && requestedVariant === undefined) {
    const dash = modelPart.lastIndexOf("-")
    if (dash > 0) {
      const suffix = modelPart.slice(dash + 1)
      const base = modelPart.slice(0, dash).trim()
      const candidate = resolveModel(provider, base, models)
      const variant = candidate?.variants.find(
        (item) => item.toLowerCase() === suffix.toLowerCase(),
      )
      if (candidate !== undefined && variant !== undefined) {
        requestedVariant = variant
        modelPart = base
        match = candidate
      }
    }
  }

  if (match === undefined) return undefined

  if (requestedVariant !== undefined) {
    const wanted = requestedVariant.toLowerCase()
    const variant = match.variants.find((item) => item.toLowerCase() === wanted)
    return variant === undefined ? undefined : buildModelRef(match, variant)
  }

  return buildModelRef(match)
}

export function formatModelList(
  models: readonly AvailableModel[],
  filter?: string,
  limit = 8,
): string {
  const needle = filter?.trim().toLowerCase() ?? ""
  const filtered = models.filter((model) =>
    needle.length === 0 ||
    [model.providerID, model.id, model.name, ...model.lookupIDs].some((value) =>
      value.toLowerCase().includes(needle),
    ),
  )
  const shown = filtered.slice(0, limit)

  if (shown.length === 0) return "No models found."

  const items = shown
    .map((model, index) => `${index + 1} ${model.providerID}/${model.id}`)
    .join(" · ")

  const lines = [
    `Models 1-${shown.length} of ${filtered.length}`,
    items,
    "Use /imp-model provider/model#variant",
  ]

  if (filtered.length > shown.length) lines.push("More: /imp-models <filter>")

  return lines.join("\n")
}
