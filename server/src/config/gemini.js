import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { env } from './env.js'

export function createGeminiChatModel(options = {}) {
  return new ChatGoogleGenerativeAI({
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_CHAT_MODEL,
    temperature: options.temperature ?? 0,
    maxRetries: options.maxRetries ?? 2,
    ...options,
  })
}

export function createGeminiEmbeddings(options = {}) {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_EMBEDDING_MODEL,
    outputDimensionality: 768,
    ...options,
  })

  // Prevent @langchain/google-genai from silently swallowing batchEmbedContents errors into empty arrays: [ [] ]
  if (typeof embeddings._embedDocumentsContent === 'function') {
    embeddings._embedDocumentsContent = async function (documents) {
      const batchSize = this.maxBatchSize || 100
      const chunks = []
      for (let i = 0; i < documents.length; i += batchSize) {
        chunks.push(documents.slice(i, i + batchSize))
      }

      const batchEmbedRequests = chunks.map((chunk) => ({
        requests: chunk.map((doc) => this._convertToContent(doc)),
      }))

      const results = await Promise.allSettled(
        batchEmbedRequests.map((req) => this.client.batchEmbedContents(req)),
      )

      const firstRejection = results.find((r) => r.status === 'rejected')
      if (firstRejection) {
        throw firstRejection.reason
      }

      return results.flatMap((res) => res.value.embeddings.map((e) => e.values || []))
    }
  }

  return embeddings
}

