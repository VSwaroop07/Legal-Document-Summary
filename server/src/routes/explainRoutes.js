import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { explain } from '../controllers/explainController.js'

const router = Router()

router.post('/', authenticate, asyncHandler(explain))

export default router
