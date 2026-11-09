import { useEffect, useMemo, useState } from 'react'
import client from '../api/client'
import { AuthContext } from './AuthContext'

const TOKEN_KEY = 'legal_summarizer_token'

function getErrorMessage(error) {
  return error.response?.data?.message || 'Something went wrong. Please try again.'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function restoreSession() {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const response = await client.get('/auth/me')
        setUser(response.data.data.user)
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [token])

  async function authenticate(endpoint, credentials) {
    try {
      const response = await client.post(endpoint, credentials)
      const { token: nextToken, user: nextUser } = response.data.data
      localStorage.setItem(TOKEN_KEY, nextToken)
      setToken(nextToken)
      setUser(nextUser)
      return nextUser
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  }

  async function login(credentials) {
    return authenticate('/auth/login', credentials)
  }

  async function register(credentials) {
    return authenticate('/auth/register', credentials)
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, token, login, register, logout, isLoading }),
    [user, token, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
