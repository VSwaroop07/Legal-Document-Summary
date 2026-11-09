function StatusBadge({ status }) {
  const styles = {
    ready: 'bg-emerald-50 text-emerald-700',
    processing: 'bg-amber-50 text-amber-700',
    failed: 'bg-red-50 text-red-700',
  }

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {status || 'unknown'}
    </span>
  )
}

export default StatusBadge
