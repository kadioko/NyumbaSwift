import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { auth as authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('nyumbaswift_token'))
  const [loading, setLoading] = useState(true)

  const saveAuth = useCallback((data) => {
    localStorage.setItem('nyumbaswift_token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('nyumbaswift_token')
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    authApi.me()
      .then(setUser)
      .catch(() => logout())
      .finally(() => setLoading(false))
  }, [token, logout])

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
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
