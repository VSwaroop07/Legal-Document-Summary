import axios from 'axios'
import Parser from 'rss-parser'
import { env } from '../config/env.js'
import { newsSources } from '../config/newsSources.js'
import { logger } from '../utils/logger.js'

const rssParser = new Parser()
const NEWS_AGE_MS = 7 * 24 * 60 * 60 * 1000

function stripHtml(value = '') {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function normaliseTitle(title) {
  return stripHtml(title).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

function isRecent(article) {
  if (!article.publishedAt) return true
  const timestamp = new Date(article.publishedAt).getTime()
  return Number.isNaN(timestamp) || Date.now() - timestamp <= NEWS_AGE_MS
}

function cleanArticle(article) {
  const title = stripHtml(article.title)
  const url = article.url?.trim()
  if (!title || !url) return null
  let parsedUrl
  try {
    parsedUrl = new URL(url)
  } catch {
    return null
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) return null

  const publishedAt = article.publishedAt ? new Date(article.publishedAt) : null
  const normalisedArticle = {
    title,
    url: parsedUrl.toString(),
    source: stripHtml(article.source) || 'Unknown source',
    publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
    content: stripHtml(article.content || title),
    normalizedTitle: normaliseTitle(title),
  }

  return isRecent(normalisedArticle) ? normalisedArticle : null
}

async function fetchNewsApi() {
  const response = await axios.get('https://newsapi.org/v2/everything', {
    params: { ...newsSources.newsApi, apiKey: env.NEWS_API_KEY },
    timeout: 15000,
  })

  return (response.data.articles || []).map((article) => cleanArticle({
    title: article.title,
    url: article.url,
    source: article.source?.name,
    publishedAt: article.publishedAt,
    content: article.content || article.description,
  })).filter(Boolean)
}

async function fetchRssFeed(feed) {
  const parsed = await rssParser.parseURL(feed.url)
  return (parsed.items || []).map((item) => cleanArticle({
    title: item.title,
    url: item.link || item.guid,
    source: feed.name || parsed.title,
    publishedAt: item.isoDate || item.pubDate,
    content: item.contentSnippet || item.content || item.summary,
  })).filter(Boolean)
}

export async function fetchNewsArticles() {
  const results = await Promise.allSettled([
    fetchNewsApi(),
    ...newsSources.rssFeeds.map((feed) => fetchRssFeed(feed)),
  ])
  const articles = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      articles.push(...result.value)
    } else {
      const source = index === 0 ? 'News API' : newsSources.rssFeeds[index - 1].name
      logger.error('News source failed', { source })
    }
  })

  const seenUrls = new Set()
  const seenTitles = new Set()
  return articles.filter((article) => {
    if (seenUrls.has(article.url) || seenTitles.has(article.normalizedTitle)) return false
    seenUrls.add(article.url)
    seenTitles.add(article.normalizedTitle)
    return true
  })
}
