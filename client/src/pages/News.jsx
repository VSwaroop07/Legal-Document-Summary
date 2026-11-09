import { useEffect, useState } from 'react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import NewsCard from '../components/NewsCard'
import NewsSkeleton from '../components/NewsSkeleton'
import client from '../api/client'
import ExplainModal from '../components/ExplainModal'

function News() {
  const [articles, setArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [articleToExplain, setArticleToExplain] = useState(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await client.get('/news/categories')
        setCategories(response.data.data)
      } catch {
        setCategories([])
      }
    }
    loadCategories()
  }, [])

  useEffect(() => {
    async function loadArticles() {
      setIsLoading(true)
      setError('')
      try {
        const response = await client.get('/news', {
          params: { category: category || undefined, q: debouncedSearch || undefined, page, limit: 9 },
        })
        setArticles(response.data.data.articles)
        setPagination(response.data.data.pagination)
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load legal news.')
      } finally {
        setIsLoading(false)
      }
    }
    loadArticles()
  }, [category, debouncedSearch, page])

  async function refreshNews() {
    setIsRefreshing(true)
    setError('')
    try {
      await client.post('/news/refresh')
      setPage(1)
      const response = await client.get('/news', {
        params: { category: category || undefined, q: debouncedSearch || undefined, page: 1, limit: 9 },
      })
      setArticles(response.data.data.articles)
      setPagination(response.data.data.pagination)
      const categoriesResponse = await client.get('/news/categories')
      setCategories(categoriesResponse.data.data)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to refresh legal news.')
    } finally {
      setIsRefreshing(false)
    }
  }

  function chooseCategory(nextCategory) {
    setCategory(nextCategory)
    setPage(1)
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">Legal updates</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Latest legal news</h1>
          <p className="mt-3 text-slate-500">Stay informed with curated updates across legal domains.</p>
        </div>
        <Button onClick={refreshNews} loading={isRefreshing}>Refresh news</Button>
      </div>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
        <button type="button" onClick={() => chooseCategory('')} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${!category ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>
          All
        </button>
        {categories.map((item) => (
          <button key={item.category} type="button" onClick={() => chooseCategory(item.category)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${category === item.category ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>
            {item.category} <span className="ml-1 opacity-70">({item.count})</span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search legal news by title"
          className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
          aria-label="Search legal news"
        />
      </div>

      {error ? <div className="mt-6"><Alert>{error}</Alert></div> : null}
      {isLoading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => <NewsSkeleton key={index} />)}
        </div>
      ) : null}
      {!isLoading && !articles.length ? (
        <div className="mt-6"><EmptyState title="No news found" description="Try another category or search term, or refresh the news feed." /></div>
      ) : null}
      {!isLoading && articles.length ? (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => <NewsCard key={article._id || article.url} article={article} onExplain={setArticleToExplain} />)}
          </div>
          {pagination?.pages > 1 ? (
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
              <span className="text-sm text-slate-500">Page {page} of {pagination.pages}</span>
              <Button variant="secondary" disabled={page >= pagination.pages} onClick={() => setPage((current) => current + 1)}>Next</Button>
            </div>
          ) : null}
        </>
      ) : null}
      <p className="mt-10 text-center text-xs text-slate-400">AI-generated news summaries are for understanding only and are not legal advice.</p>
      {articleToExplain ? <ExplainModal request={{ type: 'news', id: articleToExplain._id }} onClose={() => setArticleToExplain(null)} /> : null}
    </div>
  )
}

export default News
