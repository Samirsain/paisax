"use client"

import { createContext, useContext, useEffect, useState } from "react"

export interface AuthUser {
  id: string
  name: string
  phone: string
  inviteCode: string
}

/** Generates a deterministic avatar URL from the user's phone number using local avatars. */
export function avatarOf(user: AuthUser) {
  const lastChar = user.phone ? user.phone.charCodeAt(user.phone.length - 1) : 0
  const n = (lastChar % 4) + 1
  return `/avatar/${n}.png`
}

interface AuthCtx {
  user: AuthUser | null
  ready: boolean
  signup: (name: string, phone: string, password: string, inviteCode?: string) => Promise<string | null>
  login: (phone: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(false)

  // Restore session from server cookie on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(({ user }) => setUser(user ?? null))
      .catch(() => setUser(null))
      .finally(() => setReady(true))
  }, [])

  async function signup(name: string, phone: string, password: string, inviteCode?: string): Promise<string | null> {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, password, inviteCode }),
    })
    const data = await res.json()
    if (!res.ok) return data.error ?? "Signup failed"
    setUser(data)
    return null
  }

  async function login(phone: string, password: string): Promise<string | null> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    })
    const data = await res.json()
    if (!res.ok) return data.error ?? "Login failed"
    setUser(data)
    return null
  }

  async function logout(): Promise<void> {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
  }

  return <Ctx.Provider value={{ user, ready, signup, login, logout }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useAuth must be inside AuthProvider")
  return ctx
}
