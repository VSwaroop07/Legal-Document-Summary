import app from './src/app.js'
import { connectDatabase } from './src/config/db.js'
import { env } from './src/config/env.js'
import { startNewsJob } from './jobs/newsJob.js'
import { logger } from './src/utils/logger.js'

await connectDatabase()

app.listen(env.PORT, () => {
  logger.info('Server started', { port: env.PORT })
  startNewsJob()
})
