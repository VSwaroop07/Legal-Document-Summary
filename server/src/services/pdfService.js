import { PDFParse } from 'pdf-parse'
import { ApiError } from '../utils/ApiError.js'

const SCANNED_PDF_MESSAGE = 'This PDF looks scanned. Text-based PDFs only for now.'

export async function extractPdfPages(buffer) {
  const parser = new PDFParse({ data: buffer })

  try {
    const result = await parser.getText()
    const pages = result.pages.map((page) => ({
      pageNumber: page.num,
      text: page.text || '',
    }))
    const extractedCharacters = pages.reduce((total, page) => total + page.text.trim().length, 0)

    if (extractedCharacters < 30) {
      throw new ApiError(422, SCANNED_PDF_MESSAGE)
    }

    return pages
  } finally {
    await parser.destroy()
  }
}
