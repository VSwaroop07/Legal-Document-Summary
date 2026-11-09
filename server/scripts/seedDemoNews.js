import mongoose from 'mongoose'
import { env } from '../src/config/env.js'
import NewsArticle from '../src/models/NewsArticle.js'

const articles = [
  {
    title: 'Court clarifies procedural fairness in administrative decisions',
    normalizedTitle: 'court clarifies procedural fairness in administrative decisions',
    url: 'https://example.com/demo-procedural-fairness',
    source: 'Demo Legal Desk',
    publishedAt: new Date(),
    content: 'A court decision discusses notice, an opportunity to respond, and procedural fairness in administrative decisions.',
    category: 'Constitutional Law',
    aiSummary: 'The article describes a decision concerning notice and the opportunity to respond. It highlights procedural fairness in administrative proceedings.',
  },
  {
    title: 'Commercial court reviews obligations in a supply contract',
    normalizedTitle: 'commercial court reviews obligations in a supply contract',
    url: 'https://example.com/demo-supply-contract',
    source: 'Demo Legal Desk',
    publishedAt: new Date(Date.now() - 86400000),
    content: 'A commercial dispute considers delivery obligations, payment terms, and remedies under a supply contract.',
    category: 'Corporate Law',
    aiSummary: 'The article covers a commercial dispute about delivery and payment obligations. It also discusses contractual remedies.',
  },
  {
    title: 'Data protection guidance highlights responsible handling of personal data',
    normalizedTitle: 'data protection guidance highlights responsible handling of personal data',
    url: 'https://example.com/demo-data-protection',
    source: 'Demo Legal Desk',
    publishedAt: new Date(Date.now() - 2 * 86400000),
    content: 'New guidance explains responsible handling, security controls, and transparency when organizations process personal data.',
    category: 'Cyber Law',
    aiSummary: 'The guidance focuses on security and transparency when personal data is processed. It emphasizes responsible data-handling practices.',
  },
]

await mongoose.connect(env.MONGODB_URI)
await NewsArticle.bulkWrite(articles.map((article) => ({
  updateOne: { filter: { url: article.url }, update: { $set: article }, upsert: true },
})))
console.log(`Seeded ${articles.length} demo news articles`)
await mongoose.disconnect()
