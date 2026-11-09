import mongoose from 'mongoose'
import Document from '../models/Document.js'
import Chunk from '../models/Chunk.js'
import ChatSession from '../models/ChatSession.js'
import { extractPdfPages } from '../services/pdfService.js'
import { cleanPages } from '../services/textCleaner.js'
import { createChunks } from '../services/chunker.js'
import { extractMetadata } from '../services/metadataService.js'
import { embedTexts } from '../services/embeddingService.js'
import { searchChunks } from '../services/vectorSearchService.js'
import { summarizeDocument as generateSummary } from '../services/summaryService.js'
import { answerQuestion } from '../services/ragService.js'
import { z } from 'zod'
import { ApiError } from '../utils/ApiError.js'
import { sendSuccess } from '../utils/sendSuccess.js'
import { logger } from '../utils/logger.js'

export async function uploadDocument(req, res) {
  if (!req.file) {
    throw new ApiError(400, 'A PDF file is required')
  }

  const header = req.file.buffer.subarray(0, 4).toString('ascii')
  if (header !== '%PDF') {
    throw new ApiError(400, 'The uploaded file is not a valid PDF')
  }

  const document = await Document.create({
    user: req.user._id,
    title: req.file.originalname,
    originalName: req.file.originalname,
    status: 'processing',
  })

  try {
    const extractedPages = await extractPdfPages(req.file.buffer)
    const cleanedPages = cleanPages(extractedPages)
    const metadata = extractMetadata(extractedPages)
    const chunks = await createChunks(cleanedPages)

    if (!chunks.length) {
      throw new ApiError(422, 'No readable text was found in this PDF')
    }

    let vectors
    try {
      vectors = await embedTexts(chunks.map((chunk) => chunk.text))
    } catch (error) {
      logger.error('Document embedding failed', { documentId: document._id.toString() })
      throw new ApiError(502, 'Document embedding failed. Please try again.')
    }

    if (vectors.length !== chunks.length || vectors.some((vector) => !Array.isArray(vector) || vector.length === 0)) {
      throw new ApiError(502, 'Embedding failed: incomplete vectors were returned')
    }

    await Chunk.insertMany(chunks.map((chunk, index) => ({
      ...chunk,
      embedding: vectors[index],
      document: document._id,
      user: req.user._id,
    })))

    document.title = metadata.title || req.file.originalname
    document.pageCount = metadata.pageCount
    document.metadata = metadata
    document.status = 'ready'
    document.errorMessage = ''
    await document.save()

    return sendSuccess(res, document, 201)
  } catch (error) {
    await Chunk.deleteMany({ document: document._id, user: req.user._id })
    document.status = 'failed'
    document.errorMessage = error instanceof ApiError
      ? error.message
      : 'Document processing failed. Please try again.'
    await document.save()
    throw error
  }
}

export async function listDocuments(req, res) {
  const documents = await Document.find({ user: req.user._id }).sort({ createdAt: -1 })
  return sendSuccess(res, documents)
}

export async function getDocument(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(404, 'Document not found')
  }

  const document = await Document.findOne({ _id: req.params.id, user: req.user._id })
  if (!document) {
    throw new ApiError(404, 'Document not found')
  }

  return sendSuccess(res, document)
}

export async function deleteDocument(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(404, 'Document not found')
  }

  const document = await Document.findOne({ _id: req.params.id, user: req.user._id })
  if (!document) {
    throw new ApiError(404, 'Document not found')
  }

  await Promise.all([
    Chunk.deleteMany({ document: document._id, user: req.user._id }),
    ChatSession.deleteMany({ document: document._id, user: req.user._id }),
    document.deleteOne(),
  ])

  return sendSuccess(res, { message: 'Document deleted successfully' })
}

export async function searchDocument(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(404, 'Document not found')
  }

  const query = z.object({
    q: z.string().trim().min(1, 'Search query is required').max(300),
  }).parse(req.query).q

  const document = await Document.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).select('_id')

  if (!document) {
    return sendSuccess(res, [])
  }

  const matches = await searchChunks({
    userId: req.user._id,
    documentId: document._id,
    query,
  })

  return sendSuccess(res, matches)
}

export async function summarizeDocument(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(404, 'Document not found')
  }

  const document = await Document.findOne({
    _id: req.params.id,
    user: req.user._id,
  })

  if (!document) {
    throw new ApiError(404, 'Document not found')
  }

  const force = z.object({
    force: z.enum(['true', 'false']).default('false'),
  }).parse(req.query).force === 'true'
  const hasSavedSummary = document.summary
    && typeof document.summary === 'object'
    && Object.keys(document.summary).length > 0

  if (hasSavedSummary && !force) {
    return sendSuccess(res, document.summary)
  }

  const summary = await generateSummary(document._id, req.user._id)
  document.summary = summary
  await document.save()

  return sendSuccess(res, summary)
}

const chatQuestionSchema = z.object({
  question: z.string().trim().min(1, 'Question is required').max(500, 'Question must be 500 characters or fewer'),
})

async function findOwnedDocument(documentId, userId) {
  if (!mongoose.isValidObjectId(documentId)) {
    throw new ApiError(404, 'Document not found')
  }

  const document = await Document.findOne({ _id: documentId, user: userId }).select('_id')
  if (!document) {
    throw new ApiError(404, 'Document not found')
  }

  return document
}

export async function chatWithDocument(req, res) {
  const document = await findOwnedDocument(req.params.id, req.user._id)
  const { question } = chatQuestionSchema.parse(req.body)
  const chatSession = await ChatSession.findOne({
    document: document._id,
    user: req.user._id,
  })
  const history = chatSession?.messages || []
  const result = await answerQuestion({
    userId: req.user._id,
    documentId: document._id,
    question,
    history,
  })

  const session = chatSession || new ChatSession({
    document: document._id,
    user: req.user._id,
    messages: [],
  })
  session.messages.push({ role: 'user', content: question, sources: [] })
  session.messages.push({ role: 'assistant', content: result.answer, sources: result.sources })
  await session.save()

  return sendSuccess(res, result)
}

export async function getChatHistory(req, res) {
  const document = await findOwnedDocument(req.params.id, req.user._id)
  const chatSession = await ChatSession.findOne({
    document: document._id,
    user: req.user._id,
  }).select('messages')

  return sendSuccess(res, chatSession?.messages || [])
}

export async function clearChatHistory(req, res) {
  const document = await findOwnedDocument(req.params.id, req.user._id)
  await ChatSession.updateOne(
    { document: document._id, user: req.user._id },
    { $set: { messages: [] } },
  )

  return sendSuccess(res, { message: 'Chat history cleared successfully' })
}
