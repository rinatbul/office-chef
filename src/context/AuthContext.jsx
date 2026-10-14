import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { loginByName } from '../api/auth'

const STORAGE_KEY = 'office-chef-session'
const AuthContext = createContext(null)

const toSession = (employee) => ({
  id: employee.id,
  name: employee.name,
  paymentInfo: employee.paymentInfo || employee.cardHint || '',
})

const readSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.id || !parsed?.name) return null
    return {
      id: parsed.id,
      name: parsed.name,
      paymentInfo: parsed.paymentInfo || parsed.cardHint || '',
    }
  } catch {
    return null
  }
}

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient()
  const [user, setUser] = useState(() => {
    localStorage.removeItem('office-chef-user')
    return readSession()
  })

  const persistSession = useCallback((employee) => {
    const session = toSession(employee)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    setUser(session)
    return session
  }, [])

  const loginMutation = useMutation({
    mutationFn: loginByName,
    onSuccess: (employee) => {
      persistSession(employee)
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })

  const login = useCallback(
    async (payload) => {
      return loginMutation.mutateAsync(payload)
    },
    [loginMutation],
  )

  const updateSession = useCallback(
    (employee) => {
      persistSession(employee)
    },
    [persistSession],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
      updateSession,
      isLoggingIn: loginMutation.isPending,
      loginError: loginMutation.error,
    }),
    [
      user,
      login,
      logout,
      updateSession,
      loginMutation.isPending,
      loginMutation.error,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
