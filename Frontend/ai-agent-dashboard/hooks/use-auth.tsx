"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  name: string
  email: string
  avatar: string
  connectedPlatforms: string[]
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (provider: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      try {
        // Prefer server session if present
        const res = await fetch("/api/auth/me", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          if (!cancelled && data?.user?.id) {
            setUser(data.user)
            localStorage.setItem("user", JSON.stringify(data.user))
            setIsLoading(false)
            return
          }
        }
      } catch {}
      // Fallback to localStorage (demo mode)
      const savedUser = localStorage.getItem("user")
      if (!cancelled && savedUser) {
        setUser(JSON.parse(savedUser))
      }
      if (!cancelled) setIsLoading(false)
    }
    bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const signIn = async (provider: string) => {
    // Mock user data - in real app this would come from OAuth
    const mockUser: User = {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      avatar: "/diverse-user-avatars.png",
      connectedPlatforms: [provider],
    }

    setUser(mockUser)
    localStorage.setItem("user", JSON.stringify(mockUser))
    router.push("/dashboard")
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem("user")
    router.push("/")
  }

  return <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
