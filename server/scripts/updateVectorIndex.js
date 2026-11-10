import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

async function updateIndex() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB.')
  const collection = mongoose.connection.collection('chunks')

  const newDefinition = {
    fields: [
      {
        type: 'vector',
        path: 'embedding',
        numDimensions: 768,
        similarity: 'cosine',
      },
      {
        type: 'filter',
        path: 'user',
      },
      {
        type: 'filter',
        path: 'document',
      },
    ],
  }

  try {
    console.log('Calling collection.updateSearchIndex("chunk_vector_index", newDefinition)...')
    await collection.updateSearchIndex('chunk_vector_index', newDefinition)
    console.log('Successfully updated search index definition to 768 dimensions!')
  } catch (err) {
    console.error('Failed to update search index:', err.message)
    console.log('Trying drop and create if update is not supported...')
    try {
      await collection.dropSearchIndex('chunk_vector_index')
      console.log('Dropped old index.')
      await collection.createSearchIndex({
        name: 'chunk_vector_index',
        type: 'vectorSearch',
        definition: newDefinition,
      })
      console.log('Created new search index with 768 dimensions!')
    } catch (e2) {
      console.error('Drop and create failed:', e2.message)
    }
  }

  await mongoose.disconnect()
}

updateIndex().catch(console.error)

