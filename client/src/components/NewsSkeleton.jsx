function NewsSkeleton({ compact = false }) {
  return (
    <div className={`animate-pulse rounded-xl border border-slate-200 bg-white p-5 ${compact ? 'p-4' : ''}`}>
      <div className="flex justify-between gap-4">
        <div className="h-3 w-24 rounded bg-slate-200" />
        <div className="h-3 w-16 rounded bg-slate-200" />
      </div>
      <div className="mt-5 h-5 w-20 rounded-full bg-slate-200" />
      <div className="mt-5 h-5 w-4/5 rounded bg-slate-200" />
      <div className="mt-3 h-4 w-full rounded bg-slate-100" />
      <div className="mt-2 h-4 w-3/4 rounded bg-slate-100" />
      <div className="mt-6 h-4 w-24 rounded bg-slate-200" />
    </div>
  )
}

export default NewsSkeleton
