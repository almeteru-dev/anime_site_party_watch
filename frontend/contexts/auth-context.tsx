'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  username: string
  email: string
  role: string
  avatar_url?: string
}

interface AuthContextType {
  user: User | null
  login: (user: User, rememberMe: boolean) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const savedSession = sessionStorage.getItem('user')
    const savedLocal = localStorage.getItem('user')
    const savedUser = savedSession || savedLocal
    const persistTo: 'session' | 'local' | null = savedSession ? 'session' : savedLocal ? 'local' : null

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        sessionStorage.removeItem('user')
        localStorage.removeItem('user')
      }
    }

    ;(async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'include', cache: 'no-store' })
        if (res.status === 401) {
          window.dispatchEvent(new CustomEvent('auth:force-logout', { detail: { error_code: 'REVOKED' } }))
          return
        }
        if (!res.ok) return

        const data = (await res.json()) as any
        const nextUser = data?.user || data
        if (nextUser && typeof nextUser === 'object') {
          setUser(nextUser)
          const encoded = JSON.stringify(nextUser)
          if (persistTo === 'local') {
            localStorage.setItem('user', encoded)
            sessionStorage.removeItem('user')
          } else if (persistTo === 'session') {
            sessionStorage.setItem('user', encoded)
            localStorage.removeItem('user')
          }
        }
      } catch {
        ;
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as { error_code?: string; ban_reason?: string } | undefined
      if (detail?.error_code === 'BANNED') {
        const reason = detail?.ban_reason ? ` Reason: ${detail.ban_reason}` : ''
        sessionStorage.setItem('force_logout_message', `You have been banned.${reason}`)
      } else if (detail?.error_code === 'NOT_VERIFIED') {
        sessionStorage.setItem('force_logout_message', 'Your account is not verified.')
      } else if (detail?.error_code === 'REVOKED') {
        sessionStorage.setItem('force_logout_message', 'Your session is no longer valid. Please sign in again.')
      }

      try {
        void fetch('/api/logout', { method: 'POST', credentials: 'include' })
      } catch {
        ;
      }

      setUser(null)
      localStorage.removeItem('user')
      sessionStorage.removeItem('user')

      router.push('/login')
    }

    window.addEventListener('auth:force-logout', handler)
    return () => window.removeEventListener('auth:force-logout', handler)
  }, [router])

  const login = (newUser: User, rememberMe: boolean) => {
    setUser(newUser)

	if (rememberMe) {
		localStorage.setItem('user', JSON.stringify(newUser))
		sessionStorage.removeItem('user')
	} else {
		sessionStorage.setItem('user', JSON.stringify(newUser))
		localStorage.removeItem('user')
	}

	window.location.assign('/')
  }

  const logout = () => {
    try {
      void fetch('/api/logout', { method: 'POST', credentials: 'include' })
    } catch {
      ;
    }

    setUser(null)
    localStorage.removeItem('user')
	sessionStorage.removeItem('user')

    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
