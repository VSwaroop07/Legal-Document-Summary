import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">404</p>
      <h1 className="mt-3 text-3xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-3 text-slate-500">The page you requested does not exist.</p>
      <Link to="/dashboard" className="mt-6 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white outline-none transition hover:bg-slate-700 focus-visible:ring-4 focus-visible:ring-teal-200">
        Back to dashboard
      </Link>
    </main>
  )
}

export default NotFound
