"use client"

import { useEffect, useState } from "react"
import type { User } from "@/lib/auth"

export interface UseUserResult {
  user: User | null
  loading: boolean
  error: string | null
}

/**
 * Client-side hook que obtiene el usuario autenticado llamando a `/api/auth/me`.
 */
export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" })
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        const data = await res.json()
        if (active) setUser(data?.user ?? null)
      } catch (err) {
        if (active) setError((err as Error).message)
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchUser()
    return () => {
      active = false
    }
  }, [])

  return { user, loading, error }
}
