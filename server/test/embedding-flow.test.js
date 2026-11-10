import { describe, expect, it, vi, beforeEach } from 'vitest'

let mockEmbedDocuments = vi.fn()

vi.mock('@langchain/openai', () => {
  return {
    OpenAIEmbeddings: class {
      constructor() {
        this.embedDocuments = (...args) => mockEmbedDocuments(...args)
        this.embedQuery = vi.fn().mockResolvedValue([0.1, 0.2])
      }
    },
    ChatOpenAI: class {
      withStructuredOutput() {
        return {
          invoke: vi.fn(),
        }
      }
    },
  }
})

describe('embeddingService retry and error handling flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('successfully returns vectors on a normal embedding request', async () => {
    mockEmbedDocuments.mockResolvedValueOnce([[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]])
    const { embedTexts } = await import('../src/services/embeddingService.js')

    const vectors = await embedTexts(['Chunk 1 text', 'Chunk 2 text'])
    expect(vectors).toEqual([[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]])
    expect(mockEmbedDocuments).toHaveBeenCalledTimes(1)
  })

  it('retries on simulated OpenAI 429 and succeeds on subsequent attempt', async () => {
    const rateLimitError = new Error('Rate limit reached')
    rateLimitError.status = 429

    // Fail first call with 429, succeed second call with vectors
    mockEmbedDocuments
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce([[0.7, 0.8, 0.9]])

    const { embedTexts } = await import('../src/services/embeddingService.js')
    const vectors = await embedTexts(['Chunk needing retry'])

    expect(vectors).toEqual([[0.7, 0.8, 0.9]])
    expect(mockEmbedDocuments).toHaveBeenCalledTimes(2)
  })

  it('exhausts retries on persistent 429 and throws ApiError(429) with friendly message', async () => {
    const rateLimitError = new Error('Rate limit reached')
    rateLimitError.status = 429

    // Always reject with 429
    mockEmbedDocuments.mockRejectedValue(rateLimitError)

    const { embedTexts } = await import('../src/services/embeddingService.js')

    await expect(embedTexts(['Will fail'])).rejects.toMatchObject({
      statusCode: 429,
      status: 429,
      message: 'The AI service is currently busy due to request limits. Please wait a moment and try again.',
    })
  })

  it('does NOT retry permanent errors such as 401 invalid API key', async () => {
    const authError = new Error('Incorrect API key provided')
    authError.status = 401
    authError.code = 'invalid_api_key'

    mockEmbedDocuments.mockRejectedValue(authError)

    const { embedTexts } = await import('../src/services/embeddingService.js')

    await expect(embedTexts(['Auth fail'])).rejects.toMatchObject({
      statusCode: 502,
      message: 'The AI service is not configured correctly.',
    })

    // Permanent errors should not be retried multiple times
    expect(mockEmbedDocuments).toHaveBeenCalledTimes(1)
  })
})

