function formatDate(value) {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString()
}

import Button from './Button'

function NewsCard({ article, compact = false, onExplain }) {
  return (
    <article className={`flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${compact ? 'p-4' : ''}`}>
      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
        <span className="truncate font-medium">{article.source}</span>
        <time dateTime={article.publishedAt || undefined}>{formatDate(article.publishedAt)}</time>
      </div>
      <div className="mt-4">
        <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
          {article.category || 'Other'}
        </span>
      </div>
      <h2 className={`mt-4 font-bold leading-6 text-slate-900 ${compact ? 'text-base' : 'text-lg'}`}>{article.title}</h2>
      <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{article.aiSummary || 'No AI summary is available for this article.'}</p>
      <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-slate-400">AI-generated summary</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a href={article.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-teal-700 hover:text-teal-800">
          Read original <span className="ml-1" aria-hidden="true">↗</span>
        </a>
        {onExplain ? <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => onExplain(article)}>Explain with AI</Button> : null}
      </div>
    </article>
  )
}

export default NewsCard
