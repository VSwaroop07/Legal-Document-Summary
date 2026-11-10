import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ApiError } from '../src/utils/ApiError.js'
import { isRateLimitError } from '../src/services/embeddingService.js'
import { errorHandler } from '../src/middleware/errorHandler.js'

describe('ApiError and error classification', () => {
  it('correctly sets statusCode, status, and preserves nested cause', () => {
    const originalError = new Error('Rate limited by provider')
    originalError.status = 429
    const apiError = new ApiError(429, 'Busy', { cause: originalError })

    expect(apiError.statusCode).toBe(429)
    expect(apiError.status).toBe(429)
    expect(apiError.cause).toBe(originalError)
  })

  it('isRateLimitError identifies raw 429 errors', () => {
    expect(isRateLimitError({ status: 429 })).toBe(true)
    expect(isRateLimitError({ statusCode: 429 })).toBe(true)
    expect(isRateLimitError({ response: { status: 429 } })).toBe(true)
    expect(isRateLimitError({ code: 'rate_limit_exceeded' })).toBe(true)
  })

  it('isRateLimitError identifies wrapped 429 errors with nested causes', () => {
    const wrappedError = new ApiError(429, 'Busy', {
      cause: { status: 429, message: 'Provider rate limit' },
    })
    expect(isRateLimitError(wrappedError)).toBe(true)

    const wrappedBy502With429Cause = new ApiError(502, 'Busy', {
      cause: { status: 429 },
    })
    expect(isRateLimitError(wrappedBy502With429Cause)).toBe(true)
  })

  it('isRateLimitError rejects non-rate-limit errors like 401, 400, 500', () => {
    expect(isRateLimitError({ status: 401, code: 'invalid_api_key' })).toBe(false)
    expect(isRateLimitError({ status: 400 })).toBe(false)
    expect(isRateLimitError({ status: 500 })).toBe(false)
    expect(isRateLimitError(null)).toBe(false)
  })
})

describe('Central error handler (errorHandler middleware)', () => {
  it('returns HTTP 429 with friendly message for genuine rate-limit errors', () => {
    const error = new ApiError(429, 'The AI service is currently busy due to request limits. Please wait a moment and try again.')
    let capturedStatus
    let capturedJson
    const res = {
      status(code) {
        capturedStatus = code
        return this
      },
      json(body) {
        capturedJson = body
        return this
      },
    }

    errorHandler(error, {}, res, () => {})
    expect(capturedStatus).toBe(429)
    expect(capturedJson).toEqual({
      success: false,
      message: 'The AI service is currently busy due to request limits. Please wait a moment and try again.',
    })
  })

  it('returns HTTP 429 when error.cause contains status 429', () => {
    const originalError = new Error('Upstream limit')
    originalError.status = 429
    const error = new ApiError(502, 'Failed', { cause: originalError })

    let capturedStatus
    let capturedJson
    const res = {
      status(code) {
        capturedStatus = code
        return this
      },
      json(body) {
        capturedJson = body
        return this
      },
    }

    errorHandler(error, {}, res, () => {})
    expect(capturedStatus).toBe(429)
    expect(capturedJson.success).toBe(false)
    expect(capturedJson.message).toBe('The AI service is currently busy due to request limits. Please wait a moment and try again.')
  })

  it('masks sensitive internal 500 errors with safe generic message', () => {
    const internalError = new Error('Database password was incorrect or leaked internal detail')
    internalError.statusCode = 500

    let capturedStatus
    let capturedJson
    const res = {
      status(code) {
        capturedStatus = code
        return this
      },
      json(body) {
        capturedJson = body
        return this
      },
    }

    errorHandler(internalError, {}, res, () => {})
    expect(capturedStatus).toBe(500)
    expect(capturedJson).toEqual({
      success: false,
      message: 'Internal server error',
    })
    expect(capturedJson.message).not.toContain('Database password')
  })
})

