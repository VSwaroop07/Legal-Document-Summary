import multer from 'multer'
import { z } from 'zod'
import { logger } from '../utils/logger.js'

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error)
  }

  let statusCode = error.statusCode || 500
  let message = error.message || 'Internal server error'

  if (error instanceof multer.MulterError) {
    statusCode = 400
    message = `Upload error: ${error.message}`
  } else if (error instanceof z.ZodError) {
    statusCode = 400
    message = error.issues.map((issue) => issue.message).join(', ')
  } else if (error.name === 'ValidationError') {
    statusCode = 400
    message = Object.values(error.errors).map((item) => item.message).join(', ')
  } else if (error.name === 'CastError') {
    statusCode = 400
    message = 'Invalid request parameter'
  } else if (error.code === 11000) {
    statusCode = 409
    message = 'A record with the same unique value already exists'
  }

  if (statusCode >= 500) {
    logger.error('Request failed', { statusCode, errorName: error.name })
    message = 'Internal server error'
  }

  return res.status(statusCode).json({ success: false, message })
}
