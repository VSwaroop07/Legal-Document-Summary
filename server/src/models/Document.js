import mongoose from 'mongoose'

const documentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    originalName: { type: String, required: true },
    pageCount: { type: Number, min: 0 },
    status: { type: String, enum: ['processing', 'ready', 'failed'], default: 'processing' },
    errorMessage: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    summary: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
)

export default mongoose.model('Document', documentSchema)
