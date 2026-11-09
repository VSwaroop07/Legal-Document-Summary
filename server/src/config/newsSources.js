export const newsSources = {
  rssFeeds: [
    { name: 'Replaceable legal feed 1', url: 'https://example.com/legal-feed-1.xml' },
    { name: 'Replaceable legal feed 2', url: 'https://example.com/legal-feed-2.xml' },
    { name: 'Replaceable legal feed 3', url: 'https://example.com/legal-feed-3.xml' },
  ],
  newsApi: {
    query: 'law OR court OR legal OR judgment',
    language: 'en',
    pageSize: 50,
  },
}
