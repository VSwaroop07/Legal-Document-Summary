function Spinner({ label = 'Loading' }) {
  return (
    <div className="flex items-center justify-center gap-3 text-sm text-slate-500" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
      <span>{label}</span>
    </div>
  )
}

export default Spinner
