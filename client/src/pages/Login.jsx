import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import Input from '../components/Input'
import { useAuth } from '../context/useAuth'

function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
    setErrors({ ...errors, [event.target.name]: '' })
    setServerError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!form.email.trim()) nextErrors.email = 'Email is required.'
    if (!form.password) nextErrors.password = 'Password is required.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    setServerError('')
    try {
      await login(form)
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
    } catch (error) {
      setServerError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue to your legal workspace.">
      <form onSubmit={handleSubmit} className="space-y-5">
        {serverError ? <Alert>{serverError}</Alert> : null}
        <Input id="email" name="email" type="email" label="Email address" placeholder="you@example.com" value={form.email} onChange={updateField} error={errors.email} />
        <Input id="password" name="password" type="password" label="Password" placeholder="Enter your password" value={form.password} onChange={updateField} error={errors.password} />
        <Button type="submit" loading={isSubmitting} className="w-full">Sign in</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account? <Link to="/register" className="font-semibold text-teal-700 hover:text-teal-800">Create one</Link>
      </p>
    </AuthShell>
  )
}

function AuthShell({ title, subtitle, children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <Link to="/" className="text-sm font-bold tracking-tight text-slate-900">Legal<span className="text-teal-700">Summarizer</span></Link>
        <h1 className="mt-10 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </section>
    </main>
  )
}

export default Login
