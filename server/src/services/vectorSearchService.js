import mongoose from 'mongoose'
import Chunk from '../models/Chunk.js'
import { embedQuery } from './embeddingService.js'

export async function searchChunks({ userId, documentId, query, k = 5 }) {
  const queryVector = await embedQuery(query)
  const userObjectId = new mongoose.Types.ObjectId(userId)
  const documentObjectId = new mongoose.Types.ObjectId(documentId)

  return Chunk.aggregate([
    {
      $vectorSearch: {
        index: 'chunk_vector_index',
        path: 'embedding',
        queryVector,
        numCandidates: Math.max(k * 10, 50),
        limit: k,
        filter: {
          $and: [
            { user: { $eq: userObjectId } },
            { document: { $eq: documentObjectId } },
          ],
        },
      },
    },
    {
      $project: {
        _id: 0,
        text: 1,
        pageNumber: 1,
        chunkIndex: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ])
}
