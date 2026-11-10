import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { env } from './env.js'

export function createGeminiChatModel(options = {}) {
  return new ChatGoogleGenerativeAI({
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_CHAT_MODEL,
    temperature: options.temperature ?? 0,
    maxRetries: 0,
    ...options,
  })
}

export function createGeminiEmbeddings(options = {}) {
  return new GoogleGenerativeAIEmbeddings({
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_EMBEDDING_MODEL,
    ...options,
  })
}

