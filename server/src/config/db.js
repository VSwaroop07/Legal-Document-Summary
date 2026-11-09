import mongoose from 'mongoose'
import { env } from './env.js'
import { logger } from '../utils/logger.js'

export async function connectDatabase() {
  try {
    await mongoose.connect(env.MONGODB_URI)
    logger.info('MongoDB connected successfully')
  } catch (error) {
    logger.error('MongoDB connection failed', { errorName: error.name })
    process.exit(1)
  }
}
