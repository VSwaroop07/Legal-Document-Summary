import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

export async function authenticate(req, res, next) {
  try {
    const authorization = req.get('Authorization')
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required')
    }

    const token = authorization.slice(7).trim()
    if (!token) {
      throw new ApiError(401, 'Authentication required')
    }

    const payload = jwt.verify(token, env.JWT_SECRET)
    if (typeof payload !== 'object' || !payload.userId) {
      throw new ApiError(401, 'Invalid authentication token')
    }

    const user = await User.findById(payload.userId)
    if (!user) {
      throw new ApiError(401, 'Invalid authentication token')
    }

    req.user = user
    return next()
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error)
    }

    return next(new ApiError(401, 'Invalid authentication token'))
  }
}
