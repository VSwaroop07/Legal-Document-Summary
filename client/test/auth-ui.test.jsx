import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Login from '../src/pages/Login.jsx'
import ProtectedRoute from '../src/components/ProtectedRoute.jsx'

const login = vi.fn()
const authState = { user: null, isLoading: false, login }

vi.mock('../src/context/useAuth.js', () => ({
  useAuth: () => authState,
}))

describe('login form', () => {
  beforeEach(() => {
    authState.user = null
    login.mockReset()
  })
  it('shows validation errors and submits valid credentials', async () => {
    render(<MemoryRouter><Login /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    login.mockResolvedValueOnce({ id: 'user-1' })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(login).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    }))
  })

  it('shows server errors', async () => {
    login.mockRejectedValueOnce(new Error('Invalid email or password'))
    render(<MemoryRouter><Login /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument()
  })
})

describe('ProtectedRoute', () => {
  it('redirects logged-out users to login', async () => {
    authState.user = null
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}><Route path="/dashboard" element={<p>Dashboard</p>} /></Route>
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByText('Login page')).toBeInTheDocument()
  })

  it('renders the protected outlet for authenticated users', () => {
    authState.user = { id: 'user-1' }
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}><Route path="/dashboard" element={<p>Dashboard</p>} /></Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    authState.user = null
  })
})
