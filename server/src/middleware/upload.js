import multer from 'multer'
import { ApiError } from '../utils/ApiError.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (file.mimetype !== 'application/pdf') {
      return callback(new ApiError(400, 'Only PDF files are supported'))
    }
    return callback(null, true)
  },
})

export const uploadPdf = upload.single('file')
