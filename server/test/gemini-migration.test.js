import { describe, expect, it, vi, beforeEach } from 'vitest'
import { summarySchema } from '../src/services/summaryService.js'
import { explanationSchema } from '../src/services/explainService.js'
import { categories } from '../src/services/newsAiService.js'
import { EMBEDDING_DIMENSIONS, isRateLimitError } from '../src/services/embeddingService.js'

let mockInvoke = vi.fn()
let mockEmbedDocuments = vi.fn()
let mockEmbedQuery = vi.fn()

vi.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: class {
    constructor(config) {
      this.model = config.model
      this.temperature = config.temperature
    }
    invoke(...args) {
      return mockInvoke(...args)
    }
    withStructuredOutput(schema) {
      return {
        invoke: vi.fn().mockImplementation(async () => {
          if (schema === summarySchema) {
            return {
              parsed: {
                caseBackground: 'Background facts.',
                legalIssues: ['Issue 1'],
                arguments: { petitioner: 'Petitioner points.', respondent: 'Respondent points.' },
                courtReasoning: 'Reasoning of the court.',
                judgment: 'Final judgment order.',
                keyTakeaways: ['Takeaway 1'],
                documentType: 'judgment',
              },
              raw: { usage_metadata: { input_tokens: 100, output_tokens: 50 } },
            }
          }
          if (schema === explanationSchema) {
            return {
              parsed: {
                whatHappened: 'Court ruled on the dispute.',
                whyItMatters: 'Clarifies legal obligations.',
                affectedParties: ['Party A', 'Party B'],
                relevantLaws: ['Companies Act 2013, Section 135'],
                simpleExplanation: 'The court decided in favor of Party A.',
                glossary: [{ term: 'Injunction', meaning: 'A judicial order restraining an act.' }],
              },
              raw: { usage_metadata: { input_tokens: 50, output_tokens: 30 } },
            }
          }
          // Default structured output (e.g. standalone question or news)
          return {
            parsed: {
              standaloneQuestion: 'What was the final order?',
              answer: 'The court dismissed the appeal as held in [1].',
              articles: [{ category: 'Constitutional Law', summary: 'Supreme court ruled on liberty.' }],
            },
            raw: { usage_metadata: { input_tokens: 40, output_tokens: 20 } },
          }
        }),
      }
    }
  },
  GoogleGenerativeAIEmbeddings: class {
    constructor(config) {
      this.model = config.model
    }
    embedDocuments(...args) {
      return mockEmbedDocuments(...args)
    }
    embedQuery(...args) {
      return mockEmbedQuery(...args)
    }
  },
}))

describe('Gemini Migration & Full Feature Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1 & 2. Gemini embedding model uses 768 dimensions', async () => {
    expect(EMBEDDING_DIMENSIONS).toBe(768)

    const sampleVectors = [new Array(768).fill(0.1), new Array(768).fill(0.2)]
    mockEmbedDocuments.mockResolvedValueOnce(sampleVectors)
    mockEmbedQuery.mockResolvedValueOnce(new Array(768).fill(0.3))

    const { embedTexts, embedQuery } = await import('../src/services/embeddingService.js')
    const textsResult = await embedTexts(['Text chunk 1', 'Text chunk 2'])
    const queryResult = await embedQuery('Search query')

    expect(textsResult[0]).toHaveLength(768)
    expect(queryResult).toHaveLength(768)
  })

  it('3 & 4. Rate-limit and quota exhaustion detection recognizes Gemini error types', () => {
    expect(isRateLimitError({ status: 429 })).toBe(true)
    expect(isRateLimitError(new Error('RESOURCE_EXHAUSTED'))).toBe(true)
    expect(isRateLimitError(new Error('Quota exceeded for quota metric'))).toBe(true)
    expect(isRateLimitError({ cause: { status: 429 } })).toBe(true)
    expect(isRateLimitError({ status: 400, message: 'API_KEY_INVALID' })).toBe(false)
  })

  it('5. Legal document summarization produces valid 6-part structured summary', async () => {
    const { summarizeDocument } = await import('../src/services/summaryService.js')

    // Mock Chunk.find to return test chunks
    const Chunk = (await import('../src/models/Chunk.js')).default
    vi.spyOn(Chunk, 'find').mockReturnValue({
      sort: () => ({
        select: () => ({
          lean: () => Promise.resolve([
            { text: 'Sample chunk 1 text', pageNumber: 1, chunkIndex: 0 },
            { text: 'Sample chunk 2 text', pageNumber: 1, chunkIndex: 1 },
          ]),
        }),
      }),
    })

    mockInvoke.mockResolvedValue({
      content: 'Partial notes from group 1: Parties, claims, and rulings.',
    })

    const summary = await summarizeDocument('64b8f0f1c2d3e4f5a6b7c8d9', '64b8f0f1c2d3e4f5a6b7c8d8')
    expect(summary).toMatchObject({
      caseBackground: 'Background facts.',
      legalIssues: ['Issue 1'],
      arguments: { petitioner: 'Petitioner points.', respondent: 'Respondent points.' },
      courtReasoning: 'Reasoning of the court.',
      judgment: 'Final judgment order.',
      keyTakeaways: ['Takeaway 1'],
      documentType: 'judgment',
    })
    expect(() => summarySchema.parse(summary)).not.toThrow()
  })

  it('6. RAG question answering returns context-grounded answers with citations', async () => {
    const { answerQuestion } = await import('../src/services/ragService.js')
    const vectorSearch = await import('../src/services/vectorSearchService.js')

    vi.spyOn(vectorSearch, 'searchChunks').mockResolvedValue([
      { text: 'The appeal was dismissed on merits.', pageNumber: 5, chunkIndex: 2, score: 0.92 },
    ])

    const result = await answerQuestion({
      userId: '64b8f0f1c2d3e4f5a6b7c8d8',
      documentId: '64b8f0f1c2d3e4f5a6b7c8d9',
      question: 'What was the final ruling?',
    })

    expect(result.answer).toContain('dismissed the appeal')
    expect(result.sources).toHaveLength(1)
    expect(result.sources[0]).toMatchObject({
      citation: 1,
      pageNumber: 5,
      chunkIndex: 2,
    })
  })

  it('7. Explain with AI returns grounded explanation and glossary', async () => {
    const { explainText } = await import('../src/services/explainService.js')

    const explanation = await explainText({
      type: 'document',
      text: 'The dispute was adjudicated under Section 135.',
    })

    expect(explanation.whatHappened).toBe('Court ruled on the dispute.')
    expect(explanation.relevantLaws).toEqual(['Companies Act 2013, Section 135'])
    expect(explanation.glossary).toEqual([{ term: 'Injunction', meaning: 'A judicial order restraining an act.' }])
    expect(() => explanationSchema.parse(explanation)).not.toThrow()
  })

  it('8. Legal news categorization classifies into valid domains', async () => {
    const { summarizeNewsArticles } = await import('../src/services/newsAiService.js')

    const newsResults = await summarizeNewsArticles([
      { title: 'Supreme Court hearing', content: 'Detailed constitutional review.' },
    ])

    expect(newsResults).toHaveLength(1)
    expect(categories).toContain(newsResults[0].category)
    expect(newsResults[0].category).toBe('Constitutional Law')
    expect(newsResults[0].summary).toBeTruthy()
  })
})

