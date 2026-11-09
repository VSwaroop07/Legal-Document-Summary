import NewsArticle from '../models/NewsArticle.js'
import { categories } from '../services/newsAiService.js'
import { runNewsJob } from '../../jobs/newsJob.js'
import { ApiError } from '../utils/ApiError.js'
import { sendSuccess } from '../utils/sendSuccess.js'

export async function listNews(req, res) {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1)
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50)
  const filter = {}
  if (req.query.category) filter.category = req.query.category
  const search = String(req.query.q || '').trim()
  if (search) filter.$text = { $search: search }

  const [articles, total] = await Promise.all([
    NewsArticle.find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    NewsArticle.countDocuments(filter),
  ])

  return sendSuccess(res, { articles, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
}

export async function listCategories(req, res) {
  const counts = await NewsArticle.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ])
  return sendSuccess(res, categories.map((category) => ({
    category,
    count: counts.find((item) => item._id === category)?.count || 0,
  })))
}

export async function refreshNews(req, res) {
  try {
    return sendSuccess(res, await runNewsJob())
  } catch (error) {
    throw new ApiError(502, `News refresh failed: ${error.message}`)
  }
}
