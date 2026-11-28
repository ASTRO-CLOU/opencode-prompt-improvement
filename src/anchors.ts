function collect(pattern: RegExp, text: string, output: string[]): void {
  for (const match of text.matchAll(pattern)) {
    if (match[0].length > 0) output.push(match[0])
  }
}

export function extractAnchors(text: string): string[] {
  const anchors: string[] = []

  collect(/```[\s\S]*?```/g, text, anchors)
  collect(/`[^`\n]*`/g, text, anchors)
  for (const match of text.matchAll(/https?:\/\/[^\s<>"'`]+/giu)) {
    const url = match[0].replace(/[,.;:!?\]})]+$/u, "")
    if (url.length > 0) anchors.push(url)
  }
  collect(/(?:\.{1,2}\/)?(?:[\w@.-]+\/)+[\w@.-]+/g, text, anchors)
  collect(/\b[\w-]+\.[A-Za-z0-9]{1,10}\b/g, text, anchors)
  collect(/\d+(?:[.,]\d+)*/g, text, anchors)
  collect(/@[\w./@-]+/g, text, anchors)

  return [...new Set(anchors)]
}

export function anchorsPreserved(original: string, refined: string): boolean {
  return extractAnchors(original).every((anchor) => refined.includes(anchor))
}

export function noNewAnchors(original: string, refined: string): boolean {
  const allowed = new Set(extractAnchors(original))
  return extractAnchors(refined).every((anchor) => allowed.has(anchor))
}
