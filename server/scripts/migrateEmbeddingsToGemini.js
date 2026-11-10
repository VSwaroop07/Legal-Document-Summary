import mongoose from 'mongoose'
import { env } from '../src/config/env.js'
import Chunk from '../src/models/Chunk.js'
import { embedTexts, EMBEDDING_DIMENSIONS } from '../src/services/embeddingService.js'
import { logger } from '../src/utils/logger.js'

const BATCH_SIZE = 50

export async function migrateChunksToGemini({ forceAll = false } = {}) {
  logger.info('Starting embedding migration to Google Gemini (768 dimensions)...')

  if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    throw new Error('Valid GEMINI_API_KEY is required in environment variables to run embedding migration.')
  }

  await mongoose.connect(env.MONGODB_URI)
  logger.info('Connected to MongoDB database')

  const totalChunks = await Chunk.countDocuments()
  logger.info(`Total chunks in database: ${totalChunks}`)

  // Find chunks whose embedding dimension is not 768 (or all if forceAll)
  const chunksToMigrate = forceAll
    ? await Chunk.find({}).select('_id text chunkIndex pageNumber document user').lean()
    : await Chunk.find({
        $or: [
          { embedding: { $size: 1536 } }, // legacy OpenAI vectors
          { embedding: { $exists: false } },
          { embedding: { $size: 0 } },
        ],
      }).select('_id text chunkIndex pageNumber document user').lean()

  logger.info(`Found ${chunksToMigrate.length} chunks requiring migration to Gemini 768-dim embeddings`)

  if (chunksToMigrate.length === 0) {
    logger.info('All chunks are already migrated to Gemini embeddings (768 dimensions). No action needed.')
    await mongoose.disconnect()
    return { total: totalChunks, migrated: 0 }
  }

  let migratedCount = 0

  for (let index = 0; index < chunksToMigrate.length; index += BATCH_SIZE) {
    const batch = chunksToMigrate.slice(index, index + BATCH_SIZE)
    const texts = batch.map((c) => c.text)

    logger.info(`Generating Gemini embeddings for batch ${Math.floor(index / BATCH_SIZE) + 1} (${batch.length} chunks)...`)
    const vectors = await embedTexts(texts)

    if (vectors.length !== batch.length) {
      throw new Error(`Embedding count mismatch: expected ${batch.length}, received ${vectors.length}`)
    }

    const operations = batch.map((chunk, i) => ({
      updateOne: {
        filter: { _id: chunk._id },
        update: { $set: { embedding: vectors[i] } },
      },
    }))

    await Chunk.bulkWrite(operations)
    migratedCount += batch.length
    logger.info(`Migrated ${migratedCount} / ${chunksToMigrate.length} chunks`)
  }

  logger.info(`Migration complete! Successfully updated ${migratedCount} chunks to ${EMBEDDING_DIMENSIONS} dimensions.`)
  await mongoose.disconnect()
  return { total: totalChunks, migrated: migratedCount }
}

// Execute directly if run as a script
if (process.argv[1]?.endsWith('migrateEmbeddingsToGemini.js')) {
  const force = process.argv.includes('--force') || process.argv.includes('--all')
  migrateChunksToGemini({ forceAll: force })
    .then((res) => {
      console.log('Migration finished successfully:', res)
      process.exit(0)
    })
    .catch((err) => {
      console.error('Migration failed:', err)
      process.exit(1)
    })
}

