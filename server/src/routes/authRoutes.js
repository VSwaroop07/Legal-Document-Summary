import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { register, login, getCurrentUser } from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Try again later.' },
})

router.post('/register', authRateLimit, asyncHandler(register))
router.post('/login', authRateLimit, asyncHandler(login))
router.get('/me', authenticate, asyncHandler(getCurrentUser))

export default router
