export class ApiError extends Error {
  constructor(statusCode, message, options = {}) {
    super(message, options?.cause ? { cause: options.cause } : undefined)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.status = statusCode
    if (options?.cause) {
      this.cause = options.cause
    }
    if (options?.retryAfter !== undefined) {
      this.retryAfter = options.retryAfter
    }
  }
}
