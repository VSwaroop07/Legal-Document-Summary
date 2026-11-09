function Button({ children, type = 'button', variant = 'primary', loading = false, className = '', ...props }) {
  const styles = {
    primary: 'bg-slate-900 text-white hover:bg-slate-700 focus:ring-slate-400',
    secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-300',
  }

  return (
    <button
      type={type}
      disabled={loading || props.disabled}
      className={`inline-flex min-h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
      {...props}
    >
      {loading ? <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" /> : null}
      {children}
    </button>
  )
}

export default Button
