import type { GenerateTextFn, ModelRef } from "./types.ts"

export const LLM_PROMPT_PREFIX = "You improve a user's prompt text into a clear, well-structured brief."

function buildLlmPrompt(text: string): string {
  const limit = Math.floor(text.length * 1.4)

  return `${LLM_PROMPT_PREFIX} Output exactly three lines and nothing else.

Use these exact headings for Russian input:
Кто:
Задача:
Важно:
For other languages use the local equivalents: Who:, Task:, Important:.

Rules:
- This is an improvement, not a summary. Keep every detail from the input: scope, adjectives, informal emphasis, tone and personal reminders. Never drop content to save characters.
- Line 1: after the heading, name who should act, using the role from the input. If the input names no role, write only "Ты" with no profession.
- Line 2: after the heading, state the concrete action and deliverable with the scope given in the input.
- Line 3: after the heading, keep all remaining details, requirements and intentions. Turn vague wording into a clear instruction using only words and ideas from the input.
- Reword only to make the instruction clearer. Remove greetings and repeated words. Keep the same language and the same tone.
- Add one short useful phrase that the request clearly implies: a result to aim for, a next step or what to check. Do not stop at only the user's own words. Never add more than one such phrase per line, and never invent facts.
- Never answer the question or do the task yourself. Only rewrite the request. Do not add background, examples or explanations.
- Do not invent facts, technologies, tools, files, numbers or named requirements. Short clarifying words about an idea already in the input are allowed.
- Preserve every path, identifier, number, URL, code fragment, backticked text and @mention exactly. Do not add new ones and do not remove any.
- Aim for a little longer than the input, with a few useful details added. Hard limit: ${limit} characters total. Never exceed it.
- No blank lines, no quotes, no markdown, no explanation, no reasoning.

Example:
User prompt: <<< привет ты крутой дизайнер сделай крутой лендинг чтобы всё было топ и придумай сам >>>
Improved:
Кто: Ты — крутой дизайнер
Задача: Сделай крутой лендинг с понятной структурой
Важно: Чтобы всё было топ, придумай сам и проверь результат

User prompt:
<<<
${text}
>>>
/no_think`
}

function unwrap(value: unknown): string | undefined {
  if (typeof value === "string") return value
  if (typeof value === "object" && value !== null) {
    const record = value as { text?: unknown; data?: { text?: unknown } }
    if (typeof record.text === "string") return record.text
    if (typeof record.data?.text === "string") return record.data.text
  }
  return undefined
}

export async function refineWithModel(
  generate: GenerateTextFn,
  text: string,
  model: ModelRef,
  timeoutMs: number,
): Promise<string | undefined> {
  const response = await generate(
    { model, prompt: buildLlmPrompt(text) },
    { signal: AbortSignal.timeout(timeoutMs) },
  )
  const generated = unwrap(response)
  if (generated === undefined) return undefined

  const trimmed = generated.trim()
  return trimmed.length > 0 ? trimmed : undefined
}
