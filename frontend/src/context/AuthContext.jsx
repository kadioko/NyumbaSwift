import { createContext, useState, useEffect, useCallback } from 'react'
import { auth as authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('nyumbaswift_token'))
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('nyumbaswift_token')))
  const [authNotice, setAuthNotice] = useState('')

  const saveAuth = useCallback((data) => {
    localStorage.setItem('nyumbaswift_token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    setAuthNotice('')
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('nyumbaswift_token')
    setToken(null)
    setUser(null)
  }, [])

  const clearAuthNotice = useCallback(() => {
    setAuthNotice('')
  }, [])

  useEffect(() => {
    if (!token) {
      return
    }
    authApi.me()
      .then(setUser)
      .catch((err) => {
        if (err?.status === 401) {
          setAuthNotice('Your session expired. Please sign in again.')
        }
        logout()
      })
      .finally(() => setLoading(false))
  }, [token, logout])

  useEffect(() => {
    const handleAuthExpired = (event) => {
      setAuthNotice(event.detail?.message || 'Your session expired. Please sign in again.')
      logout()
      setLoading(false)
    }

    window.addEventListener('nyumbaswift:auth-expired', handleAuthExpired)
    return () => window.removeEventListener('nyumbaswift:auth-expired', handleAuthExpired)
  }, [logout])

  const login = async (body) => {
    const data = await authApi.login(body)
    saveAuth(data)
    return data
  }

  const register = async (body) => {
    const data = await authApi.register(body)
    saveAuth(data)
    return data
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser, authNotice, clearAuthNotice }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
