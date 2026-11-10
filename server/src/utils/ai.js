import { ApiError } from './ApiError.js'
import { env } from '../config/env.js'
import { logger } from './logger.js'

const retryableStatuses = new Set([408, 429, 500, 502, 503, 504])

function isRateLimitOrQuota(error) {
  const status = error?.status || error?.statusCode || error?.response?.status || error?.cause?.status
  const message = String(error?.message || '').toLowerCase()
  return (
    status === 429 ||
    error?.code === 'rate_limit_exceeded' ||
    message.includes('resource_exhausted') ||
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('too many requests')
  )
}

function isAuthenticationOrKeyError(error) {
  const status = error?.status || error?.statusCode || error?.response?.status
  const message = String(error?.message || '').toLowerCase()
  return (
    status === 401 ||
    status === 403 ||
    error?.code === 'invalid_api_key' ||
    message.includes('api_key_invalid') ||
    message.includes('api key not valid') ||
    message.includes('invalid api key')
  )
}

function isTimeoutError(error) {
  const status = error?.status || error?.statusCode
  const message = String(error?.message || '').toLowerCase()
  return (
    status === 408 ||
    status === 504 ||
    error?.code === 'ETIMEDOUT' ||
    error?.code === 'ECONNABORTED' ||
    message.includes('deadline_exceeded') ||
    message.includes('timed out')
  )
}

function isRetryable(error) {
  if (isAuthenticationOrKeyError(error)) return false
  const status = error?.status || error?.statusCode || error?.response?.status
  if (retryableStatuses.has(status)) return true
  if (isRateLimitOrQuota(error) || isTimeoutError(error)) return true
  const message = String(error?.message || '').toLowerCase()
  return message.includes('internal') || message.includes('unavailable')
}

function friendlyMessage(error) {
  if (isAuthenticationOrKeyError(error)) {
    return 'The AI service is not configured correctly.'
  }
  if (isRateLimitOrQuota(error)) {
    return 'The AI service is currently busy due to request limits. Please wait a moment and try again.'
  }
  if (isTimeoutError(error)) {
    return 'The AI service timed out. Please try again.'
  }
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

      const statusCode = isRateLimitOrQuota(error) ? 429 : 502
      throw new ApiError(statusCode, friendlyMessage(error), { cause: error })
    }
  }
  throw new ApiError(502, 'The AI service is temporarily unavailable. Please try again.')
}
