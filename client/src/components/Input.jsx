function Input({ label, error, id, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        className={`min-h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-4 focus:ring-slate-100 ${error ? 'border-red-400' : 'border-slate-300'}`}
        {...props}
      />
      {error ? <p className="mt-1.5 text-sm text-red-600">{error}</p> : null}
    </div>
  )
}

export default Input
