import cron from 'node-cron'
import NewsArticle from '../src/models/NewsArticle.js'
import { env } from '../src/config/env.js'
import { fetchNewsArticles } from '../src/services/newsFetcher.js'
import { summarizeNewsArticles } from '../src/services/newsAiService.js'
import { logger } from '../src/utils/logger.js'

const MAX_NEW_ARTICLES_PER_RUN = 20

export async function runNewsJob() {
  const fetchedArticles = await fetchNewsArticles()
  const fetchedUrls = fetchedArticles.map((article) => article.url)
  const fetchedTitles = fetchedArticles.map((article) => article.normalizedTitle)
  const existing = await NewsArticle.find({
    $or: [
      { url: { $in: fetchedUrls } },
      { normalizedTitle: { $in: fetchedTitles } },
    ],
  }).select('url normalizedTitle').lean()
  const existingUrls = new Set(existing.map((article) => article.url))
  const existingTitles = new Set(existing.map((article) => article.normalizedTitle))
  const newArticles = fetchedArticles
    .filter((article) => !existingUrls.has(article.url) && !existingTitles.has(article.normalizedTitle))
    .slice(0, MAX_NEW_ARTICLES_PER_RUN)

  if (!newArticles.length) {
    logger.info('News job found no new articles')
    return { fetched: fetchedArticles.length, saved: 0 }
  }

  const summaries = await summarizeNewsArticles(newArticles)
  await NewsArticle.insertMany(newArticles.map((article, index) => ({
    ...article,
    ...summaries[index],
  })), { ordered: false })

  logger.info('News job saved articles', { count: newArticles.length })
  return { fetched: fetchedArticles.length, saved: newArticles.length }
}

export function startNewsJob() {
  if (!env.NEWS_JOB_ENABLED) {
    logger.info('News job disabled')
    return null
  }

  runNewsJob().catch(() => logger.error('News initial run failed'))
  return cron.schedule('0 */3 * * *', () => {
    runNewsJob().catch(() => logger.error('News scheduled run failed'))
  })
}
