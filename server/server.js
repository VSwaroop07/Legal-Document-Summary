import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

const app = express()
const port = process.env.PORT || 5000

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())
app.use(morgan('dev'))

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } })
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
