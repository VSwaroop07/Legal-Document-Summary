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
  if (status === 429) return 'The AI service is busy. Please try again later.'
  if (status === 408 || error?.code === 'ETIMEDOUT' || error?.code === 'ECONNABORTED') return 'The AI service timed out. Please try again.'
  return 'The AI service is temporarily unavailable. Please try again.'
}

export async function invokeAi(operation, callback) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await callback()
    } catch (error) {
      if (attempt === 0 && isRetryable(error)) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        continue
      }
      logger.error('AI request failed', { operation, status: error?.status || error?.statusCode })
      throw new ApiError(502, friendlyMessage(error))
    }
  }
  throw new ApiError(502, 'The AI service is temporarily unavailable. Please try again.')
}
