import { describe, expect, it, vi, beforeEach } from 'vitest'

let mockEmbedDocuments = vi.fn()

vi.mock('@langchain/google-genai', () => {
  return {
    GoogleGenerativeAIEmbeddings: class {
      constructor() {
        this.embedDocuments = (...args) => mockEmbedDocuments(...args)
        this.embedQuery = vi.fn().mockResolvedValue(new Array(768).fill(0.1))
      }
    },
    ChatGoogleGenerativeAI: class {
      withStructuredOutput() {
        return {
          invoke: vi.fn(),
        }
      }
    },
  }
})

describe('embeddingService retry and error handling flow (Gemini)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('successfully returns 768-dim vectors on a normal embedding request', async () => {
    const vectorSample = new Array(768).fill(0.05)
    mockEmbedDocuments.mockResolvedValueOnce([vectorSample, vectorSample])
    const { embedTexts } = await import('../src/services/embeddingService.js')

    const vectors = await embedTexts(['Chunk 1 text', 'Chunk 2 text'])
    expect(vectors).toEqual([vectorSample, vectorSample])
    expect(vectors[0]).toHaveLength(768)
    expect(mockEmbedDocuments).toHaveBeenCalledTimes(1)
  })

  it('retries on simulated Gemini 429 / RESOURCE_EXHAUSTED and succeeds on subsequent attempt', async () => {
    const rateLimitError = new Error('Resource has been exhausted (e.g. check quota)')
    rateLimitError.status = 429

    const vectorSample = new Array(768).fill(0.05)
    mockEmbedDocuments
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce([vectorSample])

    const { embedTexts } = await import('../src/services/embeddingService.js')
    const vectors = await embedTexts(['Chunk needing retry'])

    expect(vectors).toEqual([vectorSample])
    expect(mockEmbedDocuments).toHaveBeenCalledTimes(2)
  })

  it('exhausts retries on persistent 429 and throws ApiError(429) with friendly message', async () => {
    const rateLimitError = new Error('RESOURCE_EXHAUSTED: rate limit exceeded')
    rateLimitError.status = 429

    mockEmbedDocuments.mockRejectedValue(rateLimitError)

    const { embedTexts } = await import('../src/services/embeddingService.js')

    await expect(embedTexts(['Will fail'])).rejects.toMatchObject({
      statusCode: 429,
      status: 429,
      message: 'The AI service is currently busy due to request limits. Please wait a moment and try again.',
    })
  })

  it('does NOT retry permanent errors such as 400 API_KEY_INVALID', async () => {
    const authError = new Error('API_KEY_INVALID: API key not valid. Please pass a valid API key.')
    authError.status = 400

    mockEmbedDocuments.mockRejectedValue(authError)

    const { embedTexts } = await import('../src/services/embeddingService.js')

    await expect(embedTexts(['Auth fail'])).rejects.toMatchObject({
      statusCode: 502,
      message: 'The AI service is not configured correctly.',
    })

    expect(mockEmbedDocuments).toHaveBeenCalledTimes(1)
  })
})

