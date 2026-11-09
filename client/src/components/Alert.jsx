function Alert({ children, variant = 'error' }) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-700',
    info: 'border-slate-200 bg-slate-50 text-slate-700',
  }

  return <div className={`rounded-lg border px-4 py-3 text-sm ${styles[variant]}`}>{children}</div>
}

export default Alert
