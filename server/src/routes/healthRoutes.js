import { Router } from 'express'
import { sendSuccess } from '../utils/sendSuccess.js'

const router = Router()

router.get('/', (req, res) => {
  sendSuccess(res, { status: 'ok' })
})

export default router
