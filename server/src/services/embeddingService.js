import { createGeminiEmbeddings } from '../config/gemini.js'
import { invokeAi } from '../utils/ai.js'
import { ApiError } from '../utils/ApiError.js'

export const EMBEDDING_DIMENSIONS = 768
const BATCH_SIZE = 50
const MAX_RETRIES = 3

const embeddings = createGeminiEmbeddings()

export function isRateLimitError(error) {
  if (!error) return false
  const status = error.statusCode || error.status || error.response?.status
  const causeStatus = error.cause?.statusCode || error.cause?.status || error.cause?.response?.status
  const code = error.code || error.error?.code || error.cause?.code || error.cause?.error?.code
  const message = String(error.message || error.cause?.message || '').toLowerCase()

  return (
    status === 429 ||
    causeStatus === 429 ||
    code === 'rate_limit_exceeded' ||
    message.includes('resource_exhausted') ||
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('too many requests')
  )
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function getRetryDelay(error, attempt) {
  const retryAfterHeader = error?.headers?.['retry-after']
    || error?.response?.headers?.['retry-after']
    || error?.cause?.headers?.['retry-after']
    || error?.cause?.response?.headers?.['retry-after']
    || error?.retryAfter
    || error?.cause?.retryAfter

  if (retryAfterHeader) {
    const seconds = Number(retryAfterHeader)
    if (!Number.isNaN(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, 15000)
    }
    const dateMs = Date.parse(retryAfterHeader)
    if (!Number.isNaN(dateMs)) {
      const diff = dateMs - Date.now()
      if (diff > 0) {
        return Math.min(diff, 15000)
      }
    }
  }

  return 2 ** attempt * 1000
}

async function embedBatchWithRetry(texts) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await invokeAi('document embeddings', () => embeddings.embedDocuments(texts))
    } catch (error) {
      if (!isRateLimitError(error) || attempt === MAX_RETRIES) {
        if (isRateLimitError(error)) {
          throw new ApiError(
            429,
            'The AI service is currently busy due to request limits. Please wait a moment and try again.',
            { cause: error },
          )
        }
        throw error
      }

      await wait(getRetryDelay(error, attempt))
    }
  }

  throw new ApiError(
    429,
    'The AI service is currently busy due to request limits. Please wait a moment and try again.',
  )
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
