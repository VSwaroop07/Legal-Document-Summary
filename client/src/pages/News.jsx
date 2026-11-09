import EmptyState from '../components/EmptyState'

function News() {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">Legal updates</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Legal news</h1>
      <div className="mt-8"><EmptyState title="News is being prepared" description="Curated legal updates and AI-assisted summaries will appear here." /></div>
    </div>
  )
}

export default News
