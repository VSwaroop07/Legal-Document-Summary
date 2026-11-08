import mongoose from 'mongoose'

const newsArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, unique: true, index: true },
    source: { type: String, required: true },
    publishedAt: { type: Date },
    content: { type: String, required: true },
    category: { type: String, required: true },
    aiSummary: { type: String, default: '' },
  },
  { timestamps: true },
)

newsArticleSchema.index({ category: 1, publishedAt: -1 })

export default mongoose.model('NewsArticle', newsArticleSchema)
