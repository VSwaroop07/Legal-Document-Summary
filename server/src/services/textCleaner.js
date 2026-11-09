const PAGE_NUMBER_PATTERN = /^(?:page\s*)?\d+(?:\s*(?:of|\/)\s*\d+)?$/i

function normalisePageText(text) {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/(\w)-\n(\w)/g, '$1$2')
    .trim()
}

function meaningfulLines(text) {
  return text.split('\n').map((line) => line.trim()).filter(Boolean)
}

export function cleanPages(pages) {
  const normalisedPages = pages.map((page) => ({
    ...page,
    text: normalisePageText(page.text),
  }))
  const lineCounts = new Map()

  for (const page of normalisedPages) {
    const lines = meaningfulLines(page.text)
    const candidates = [lines[0], lines.at(-1)].filter(Boolean)
    for (const line of candidates) {
      lineCounts.set(line, (lineCounts.get(line) || 0) + 1)
    }
  }

  const repeatedLines = new Set(
    [...lineCounts.entries()]
      .filter(([, count]) => count > 1 && count >= Math.ceil(normalisedPages.length / 2))
      .map(([line]) => line),
  )

  return normalisedPages.map((page) => {
    const paragraphs = page.text
      .split(/\n\s*\n/)
      .map((paragraph) => meaningfulLines(paragraph)
        .filter((line) => !PAGE_NUMBER_PATTERN.test(line) && !repeatedLines.has(line))
        .join('\n'))
      .filter(Boolean)

    return { ...page, text: paragraphs.join('\n\n') }
  })
}
