import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { env } from './config/env.js'
import healthRoutes from './routes/healthRoutes.js'
import authRoutes from './routes/authRoutes.js'
import documentRoutes from './routes/documentRoutes.js'
import newsRoutes from './routes/newsRoutes.js'
import explainRoutes from './routes/explainRoutes.js'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

app.set('trust proxy', 1)
app.use(helmet())
const allowedOrigins = new Set([
  env.CLIENT_URL,
  ...(env.NODE_ENV === 'development' ? ['http://localhost:5173', 'http://127.0.0.1:5173'] : []),
])
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true)
    return callback(new Error('Origin is not allowed by CORS'))
  },
}))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: false, limit: '1mb' }))
app.use(morgan('dev'))
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
)

app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/explain', explainRoutes)
app.use(notFound)
app.use(errorHandler)

export default app
