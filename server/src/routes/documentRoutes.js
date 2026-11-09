import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authenticate } from '../middleware/auth.js'
import { uploadPdf } from '../middleware/upload.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { aiUsageLimit } from '../middleware/aiUsageLimit.js'
import {
  deleteDocument,
  getDocument,
  listDocuments,
  searchDocument,
  summarizeDocument,
  chatWithDocument,
  getChatHistory,
  clearChatHistory,
  uploadDocument,
} from '../controllers/documentController.js'

const router = Router()
const chatRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many questions. Try again later.' },
})

router.use(authenticate)
router.post('/', aiUsageLimit, uploadPdf, asyncHandler(uploadDocument))
router.get('/', asyncHandler(listDocuments))
router.get('/:id/search', asyncHandler(searchDocument))
router.post('/:id/summarize', aiUsageLimit, chatRateLimit, asyncHandler(summarizeDocument))
router.post('/:id/chat', aiUsageLimit, chatRateLimit, asyncHandler(chatWithDocument))
router.get('/:id/chat', asyncHandler(getChatHistory))
router.delete('/:id/chat', asyncHandler(clearChatHistory))
router.get('/:id', asyncHandler(getDocument))
router.delete('/:id', asyncHandler(deleteDocument))

export default router
