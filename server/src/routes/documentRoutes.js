import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { uploadPdf } from '../middleware/upload.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
  deleteDocument,
  getDocument,
  listDocuments,
  searchDocument,
  summarizeDocument,
  uploadDocument,
} from '../controllers/documentController.js'

const router = Router()

router.use(authenticate)
router.post('/', uploadPdf, asyncHandler(uploadDocument))
router.get('/', asyncHandler(listDocuments))
router.get('/:id/search', asyncHandler(searchDocument))
router.post('/:id/summarize', asyncHandler(summarizeDocument))
router.get('/:id', asyncHandler(getDocument))
router.delete('/:id', asyncHandler(deleteDocument))

export default router
