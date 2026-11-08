import app from './src/app.js'
import { connectDatabase } from './src/config/db.js'
import { env } from './src/config/env.js'

await connectDatabase()

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`)
})
