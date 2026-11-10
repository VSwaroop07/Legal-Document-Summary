import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

const usage = new Map()

export function aiUsageLimit(req, res, next) {
  const now = Date.now()
  const current = usage.get(req.user._id.toString())
  if (!current || now - current.startedAt >= 24 * 60 * 60 * 1000) {
    usage.set(req.user._id.toString(), { startedAt: now, count: 1 })
    return next()
  }

  if (current.count >= env.GEMINI_DAILY_CALL_LIMIT) {
    return next(new ApiError(429, 'Daily AI usage limit reached. Try again tomorrow.'))
  }

  current.count += 1
  return next()
}
