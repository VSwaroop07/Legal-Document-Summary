import { useEffect, useState } from 'react'

function ToastHost() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    function showToast(event) {
      setMessage(event.detail)
      window.setTimeout(() => setMessage(''), 4000)
    }
    window.addEventListener('app:error', showToast)
    return () => window.removeEventListener('app:error', showToast)
  }, [])

  if (!message) return null
  return (
    <div role="status" aria-live="polite" className="fixed right-4 top-4 z-[60] max-w-sm rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg">
      {message}
    </div>
  )
}

export default ToastHost
