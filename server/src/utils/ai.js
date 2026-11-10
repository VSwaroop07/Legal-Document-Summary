import { ApiError } from './ApiError.js'
import { env } from '../config/env.js'
import { logger } from './logger.js'

const retryableStatuses = new Set([408, 429, 500, 502, 503, 504])

function isRetryable(error) {
  const status = error?.status || error?.statusCode || error?.response?.status
  return retryableStatuses.has(status) || error?.code === 'ETIMEDOUT' || error?.code === 'ECONNABORTED'
}

function friendlyMessage(error) {
  const status = error?.status || error?.statusCode || error?.response?.status
  if (status === 401 || error?.code === 'invalid_api_key') return 'The AI service is not configured correctly.'
  if (status === 429 || error?.code === 'rate_limit_exceeded') {
    return 'The AI service is currently busy due to request limits. Please wait a moment and try again.'
  }
  if (status === 408 || error?.code === 'ETIMEDOUT' || error?.code === 'ECONNABORTED') return 'The AI service timed out. Please try again.'
  return 'The AI service is temporarily unavailable. Please try again.'
}

export async function invokeAi(operation, callback) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await callback()
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      if (attempt === 0 && isRetryable(error)) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        continue
      }

      const providerStatus = error?.status || error?.statusCode || error?.response?.status
      logger.error('AI request failed', { operation, status: providerStatus })

      const statusCode = providerStatus === 429 || error?.code === 'rate_limit_exceeded' ? 429 : 502
      throw new ApiError(statusCode, friendlyMessage(error), { cause: error })
    }
  }
  throw new ApiError(502, 'The AI service is temporarily unavailable. Please try again.')
}
