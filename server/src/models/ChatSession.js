import mongoose from 'mongoose'

const sourceSchema = new mongoose.Schema(
  {
    chunkIndex: { type: Number, required: true },
    pageNumber: { type: Number },
    snippet: { type: String, required: true },
  },
  { _id: false },
)

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    sources: { type: [sourceSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
)

const chatSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true },
)

chatSessionSchema.index({ user: 1, document: 1 })

export default mongoose.model('ChatSession', chatSessionSchema)
