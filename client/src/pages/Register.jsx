import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import Input from '../components/Input'
import { useAuth } from '../context/useAuth'

function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
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
    if (!form.name.trim()) nextErrors.name = 'Name is required.'
    if (!form.email.trim()) nextErrors.email = 'Email is required.'
    if (form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.'
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    setServerError('')
    try {
      await register({ name: form.name, email: form.email, password: form.password })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setServerError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <Link to="/" className="text-sm font-bold tracking-tight text-slate-900">Legal<span className="text-teal-700">Summarizer</span></Link>
        <h1 className="mt-10 text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
        <p className="mt-2 text-sm text-slate-500">Build a clearer understanding of legal information.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {serverError ? <Alert>{serverError}</Alert> : null}
          <Input id="name" name="name" label="Full name" placeholder="Your name" value={form.name} onChange={updateField} error={errors.name} />
          <Input id="email" name="email" type="email" label="Email address" placeholder="you@example.com" value={form.email} onChange={updateField} error={errors.email} />
          <Input id="password" name="password" type="password" label="Password" placeholder="At least 8 characters" value={form.password} onChange={updateField} error={errors.password} />
          <Input id="confirmPassword" name="confirmPassword" type="password" label="Confirm password" placeholder="Repeat your password" value={form.confirmPassword} onChange={updateField} error={errors.confirmPassword} />
          <Button type="submit" loading={isSubmitting} className="w-full">Create account</Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="font-semibold text-teal-700 hover:text-teal-800">Sign in</Link>
        </p>
      </section>
    </main>
  )
}

export default Register
