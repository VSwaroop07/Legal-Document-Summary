import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { explain } from '../controllers/explainController.js'
import { aiUsageLimit } from '../middleware/aiUsageLimit.js'

const router = Router()

router.post('/', authenticate, aiUsageLimit, asyncHandler(explain))

export default router
