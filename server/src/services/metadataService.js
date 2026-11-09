const CASE_NUMBER_PATTERNS = [
  /\b(?:case|appeal)\s*(?:no\.?|number)\s*[:#-]?\s*([A-Z0-9][A-Z0-9./()-]*(?:\s+(?:of|\/)\s+\d{4})?)/i,
  /\b[A-Z][A-Z.]*\s+No\.\s*[:#-]?\s*([A-Z0-9][A-Z0-9./()-]*(?:\s+(?:of|\/)\s+\d{4})?)/i,
]
const YEAR_PATTERN = /\b((?:19|20)\d{2})\b/

export function extractMetadata(pages) {
  const fullText = pages.map((page) => page.text).join('\n')
  const lines = fullText.split(/\n/).map((line) => line.trim()).filter(Boolean)
  const title = lines.find((line) => line.length > 3) || null
  const caseMatch = CASE_NUMBER_PATTERNS.map((pattern) => fullText.match(pattern)).find(Boolean)
  const courtName = lines.find((line) => /\b(court|tribunal)\b/i.test(line)) || null
  const yearMatch = fullText.match(YEAR_PATTERN)

  return {
    pageCount: pages.length,
    title,
    caseNumber: caseMatch?.[1]?.trim() || null,
    courtName,
    year: yearMatch ? Number(yearMatch[1]) : null,
  }
}
