import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { listCategories, listNews, refreshNews } from '../controllers/newsController.js'

const router = Router()
const refreshRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many refresh requests. Try again later.' },
})

router.use(authenticate)
router.get('/', asyncHandler(listNews))
router.get('/categories', asyncHandler(listCategories))
router.post('/refresh', refreshRateLimit, asyncHandler(refreshNews))

export default router
