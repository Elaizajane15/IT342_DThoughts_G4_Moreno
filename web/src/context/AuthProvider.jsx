import { useMemo, useState } from 'react'
import { AuthContext } from './auth-context'
import { authApi } from '../utils/api'

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user')
    try {
      return u ? JSON.parse(u) : null
    } catch {
      return null
    }
  })

  const login = (t, u) => {
    setToken(t)
    setUser(u)
    localStorage.setItem('token', t)
    localStorage.setItem('user', JSON.stringify(u))
  }

  const logout = async () => {
    await authApi.logout()
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const value = useMemo(() => ({ user, token, login, logout }), [user, token])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

