import { describe, expect, it } from 'vitest'
import { cleanPages } from '../src/services/textCleaner.js'
import { createChunks } from '../src/services/chunker.js'
import { deduplicateArticles } from '../src/services/newsFetcher.js'
import { summarySchema } from '../src/services/summaryService.js'
import { explanationSchema } from '../src/services/explainService.js'

describe('text processing', () => {
  it('cleans repeated headers, page numbers, whitespace, and hyphenated breaks', () => {
    const pages = cleanPages([
      { pageNumber: 1, text: 'COURT HEADER\nThe agree-\nment applies.\n1' },
      { pageNumber: 2, text: 'COURT HEADER\nThe agree-\nment continues.\n2' },
    ])
    expect(pages[0].text).toBe('The agreement applies.')
    expect(pages[1].text).toBe('The agreement continues.')
  })

  it('creates overlapping chunks with page numbers', async () => {
    const chunks = await createChunks([{ pageNumber: 7, text: 'word '.repeat(450) }])
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks.every((chunk) => chunk.pageNumber === 7)).toBe(true)
    expect(chunks[0].text.slice(-30)).toContain(chunks[1].text.slice(0, 30).trim())
  })
})

describe('news and structured output validation', () => {
  it('deduplicates URLs and normalized titles', () => {
    const articles = deduplicateArticles([
      { url: 'https://example.com/a', normalizedTitle: 'same story', title: 'Same story' },
      { url: 'https://example.com/b', normalizedTitle: 'same story', title: 'Same story!' },
      { url: 'https://example.com/a', normalizedTitle: 'another', title: 'Another' },
    ])
    expect(articles).toHaveLength(1)
  })

  it('accepts valid summary and explain outputs and rejects invalid output', () => {
    expect(() => summarySchema.parse({
      caseBackground: 'Background',
      legalIssues: ['Issue'],
      arguments: { petitioner: 'Not stated in the document', respondent: 'Not stated in the document' },
      courtReasoning: 'Reasoning',
      judgment: 'Judgment',
      keyTakeaways: ['Takeaway'],
      documentType: 'judgment',
    })).not.toThrow()
    expect(() => explanationSchema.parse({
      whatHappened: 'Event',
      whyItMatters: 'Impact',
      affectedParties: ['Party'],
      relevantLaws: [],
      simpleExplanation: 'Plain explanation',
      glossary: [{ term: 'injunction', meaning: 'A court order' }],
    })).not.toThrow()
    expect(() => summarySchema.parse({ documentType: 'invalid' })).toThrow()
    expect(() => explanationSchema.parse({ whatHappened: 4 })).toThrow()
  })
})
