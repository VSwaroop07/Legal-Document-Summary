import { Outlet } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:py-12">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default AppLayout
