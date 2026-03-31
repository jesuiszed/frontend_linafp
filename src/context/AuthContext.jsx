import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

import {
  AUTH_STORAGE_EVENT,
  clearAuthTokens,
  getStoredAccessToken,
  setAuthTokens,
} from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredAccessToken())

  const syncTokenFromStorage = useCallback(() => {
    setToken(getStoredAccessToken())
  }, [])

  const login = useCallback((accessToken, refreshToken) => {
    setAuthTokens(accessToken, refreshToken)
    setToken(accessToken || null)
  }, [])

  const logout = useCallback(() => {
    clearAuthTokens()
    setToken(null)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const onStorage = (event) => {
      if (!event || !event.key || event.key === 'gfs_admin_token' || event.key === 'gfs_admin_refresh_token') {
        syncTokenFromStorage()
      }
    }

    const onAuthChanged = () => {
      syncTokenFromStorage()
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener(AUTH_STORAGE_EVENT, onAuthChanged)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(AUTH_STORAGE_EVENT, onAuthChanged)
    }
  }, [syncTokenFromStorage])

  return (
    <AuthContext.Provider value={{ token, isAdmin: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
