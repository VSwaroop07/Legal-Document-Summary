import mongoose from 'mongoose'

const chunkSchema = new mongoose.Schema(
  {
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, required: true },
    chunkIndex: { type: Number, required: true, min: 0 },
    pageNumber: { type: Number, min: 1 },
    embedding: { type: [Number], default: [] },
  },
  { timestamps: true },
)

chunkSchema.index({ user: 1, document: 1 })

export default mongoose.model('Chunk', chunkSchema)
