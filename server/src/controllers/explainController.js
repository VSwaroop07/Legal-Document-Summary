import mongoose from 'mongoose'
import { z } from 'zod'
import Document from '../models/Document.js'
import NewsArticle from '../models/NewsArticle.js'
import { searchChunks } from '../services/vectorSearchService.js'
import { explainText } from '../services/explainService.js'
import { ApiError } from '../utils/ApiError.js'
import { sendSuccess } from '../utils/sendSuccess.js'

const requestSchema = z.object({
  type: z.enum(['document', 'news']),
  id: z.string().min(1),
  selectedText: z.string().trim().max(5000).optional(),
})

function formatSelectedChunks(chunks) {
  return chunks.map((chunk, index) => (
    `[Selected context ${index + 1}, page ${chunk.pageNumber}, chunk ${chunk.chunkIndex}]\n${chunk.text}`
  )).join('\n\n')
}

export async function explain(req, res) {
  const input = requestSchema.parse(req.body)
  if (!mongoose.isValidObjectId(input.id)) {
    throw new ApiError(404, `${input.type === 'document' ? 'Document' : 'News article'} not found`)
  }

  let sourceText
  if (input.type === 'document') {
    const document = await Document.findOne({
      _id: input.id,
      user: req.user._id,
    }).select('summary')

    if (!document) throw new ApiError(404, 'Document not found')
    sourceText = `Saved document summary:\n${JSON.stringify(document.summary || {})}`

    if (input.selectedText) {
      const chunks = await searchChunks({
        userId: req.user._id,
        documentId: document._id,
        query: input.selectedText,
        k: 5,
      })
      sourceText += `\n\nSelected text:\n${input.selectedText}\n\nRelated document excerpts:\n${formatSelectedChunks(chunks)}`
    }
  } else {
    const article = await NewsArticle.findById(input.id).select('title content aiSummary')
    if (!article) throw new ApiError(404, 'News article not found')
    sourceText = `Title: ${article.title}\nArticle content:\n${article.content}\n\nStored AI summary:\n${article.aiSummary || 'Not stated in the document'}`
  }

  return sendSuccess(res, await explainText({ type: input.type, text: sourceText }))
}
