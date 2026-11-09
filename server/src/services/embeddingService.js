import { OpenAIEmbeddings } from '@langchain/openai'
import { env } from '../config/env.js'
import { invokeAi } from '../utils/ai.js'

const BATCH_SIZE = 50
const MAX_RETRIES = 3

const embeddings = new OpenAIEmbeddings({
  apiKey: env.OPENAI_API_KEY,
  model: env.OPENAI_EMBEDDING_MODEL,
  timeout: env.OPENAI_TIMEOUT_MS,
})

function isRateLimitError(error) {
  return error?.status === 429
    || error?.statusCode === 429
    || error?.response?.status === 429
    || error?.code === 'rate_limit_exceeded'
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function embedBatchWithRetry(texts) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await invokeAi('document embeddings', () => embeddings.embedDocuments(texts))
    } catch (error) {
      if (!isRateLimitError(error) || attempt === MAX_RETRIES) {
        throw error
      }

      await wait(2 ** attempt * 1000)
    }
  }

  throw new Error('Embedding request failed after retries')
}

export async function embedTexts(texts) {
  const vectors = []

  for (let index = 0; index < texts.length; index += BATCH_SIZE) {
    const batch = texts.slice(index, index + BATCH_SIZE)
    const batchVectors = await embedBatchWithRetry(batch)
    vectors.push(...batchVectors)
  }

  return vectors
}

export async function embedQuery(query) {
  return invokeAi('query embedding', () => embeddings.embedQuery(query))
}
