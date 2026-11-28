import type { Mention, Refinement } from "./types.ts"

export interface MentionCarrier {
  mention?: Mention
}

function remap(mention: Mention, refinement: Refinement): Mention | undefined {
  const start = refinement.offsets[mention.start]
  const end = refinement.offsets[mention.end]
  if (start === undefined || end === undefined || end < start) return undefined
  if (refinement.text.slice(start, end) !== mention.text) return undefined
  return { ...mention, start, end }
}

export function remapMentions(
  attachments: readonly (MentionCarrier | undefined)[],
  refinement: Refinement,
): (Mention | undefined)[] | undefined {
  const mapped: (Mention | undefined)[] = []

  for (const attachment of attachments) {
    if (!attachment?.mention) {
      mapped.push(undefined)
      continue
    }

    const result = remap(attachment.mention, refinement)
    if (result === undefined) return undefined
    mapped.push(result)
  }

  return mapped
}
