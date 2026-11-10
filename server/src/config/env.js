import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().min(1),
  CLIENT_URL: z.string().url(),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_CHAT_MODEL: z.string().min(1).default('gemini-1.5-flash'),
  GEMINI_EMBEDDING_MODEL: z.string().min(1).default('text-embedding-004'),
  NEWS_API_KEY: z.string().min(1),
  NEWS_JOB_ENABLED: z.preprocess(
    (value) => value === undefined ? false : value,
    z.union([z.boolean(), z.enum(['true', 'false']).transform((value) => value === 'true')]),
  ),
  GEMINI_DAILY_CALL_LIMIT: z.coerce.number().int().positive().default(20),
  GEMINI_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  const missing = result.error.issues.map((issue) => issue.path.join('.')).join(', ')
  throw new Error(`Environment validation failed. Missing or invalid variables: ${missing}`)
}

export const env = result.data
