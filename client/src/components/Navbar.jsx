import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import Button from './Button'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link to="/dashboard" className="text-base font-bold tracking-tight text-slate-900">
          Legal<span className="text-teal-700">Summarizer</span>
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6">
          <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
          <NavLink to="/news" className={linkClass}>News</NavLink>
          <span className="hidden text-sm text-slate-500 sm:inline">{user?.name}</span>
          <Button variant="secondary" onClick={handleLogout}>Logout</Button>
        </nav>
      </div>
    </header>
  )
}

export default Navbar
