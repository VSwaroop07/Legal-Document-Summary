import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().int().positive(),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().min(1),
  CLIENT_URL: z.string().url(),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_CHAT_MODEL: z.string().min(1),
  OPENAI_EMBEDDING_MODEL: z.string().min(1),
  NEWS_API_KEY: z.string().min(1),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  const missing = result.error.issues.map((issue) => issue.path.join('.')).join(', ')
  throw new Error(`Environment validation failed. Missing or invalid variables: ${missing}`)
}

export const env = result.data
