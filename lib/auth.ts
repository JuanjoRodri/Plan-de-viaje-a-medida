import { cookies } from "next/headers"
import { createServerSupabaseClient } from "./supabase"
import { hasAdminAccess, hasGeneralAccess, type UserRole } from "./role-utils"

export interface User {
  id: string
  email: string
  name: string
  role: string
}

export function getSession() {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie?.value) {
      return null
    }

    return JSON.parse(sessionCookie.value)
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

export async function getUser(): Promise<User | null> {
  try {
    const session = getSession()
    if (!session) return null

    if (!session?.id) {
      console.log("No se encontró un ID de usuario en la cookie de sesión.")
      return null
    }

    const supabase = createServerSupabaseClient()
    const { data: userData, error } = await supabase.from("users").select("*").eq("id", session.id).single()

    if (error) {
      console.error("Error fetching user data:", error)
      return null
    }

    return userData
  } catch (error) {
    console.error("Error in getUser:", error)
    return null
  }
}

// Named export para compatibilidad
export const getAuthUser = getUser

export async function requireAuth() {
  const user = await getUser()

  if (!user) {
    return {
      redirect: true,
      props: null,
    }
  }

  return {
    redirect: false,
    props: { user },
  }
}

export async function requireAdmin() {
  const user = await getUser()

  if (!user) {
    return {
      redirect: true,
      props: null,
    }
  }

  if (!hasAdminAccess(user.role as UserRole)) {
    return {
      redirect: true,
      props: null,
    }
  }

  return {
    redirect: false,
    props: { user },
  }
}

export async function requireGeneralAccess() {
  const user = await getUser()

  if (!user) {
    return {
      redirect: true,
      props: null,
    }
  }

  if (!hasGeneralAccess(user.role as UserRole)) {
    return {
      redirect: true,
      props: null,
    }
  }

  return {
    redirect: false,
    props: { user },
  }
}

export async function getUserFromDatabase(userId: string) {
  const supabase = createServerSupabaseClient()
  try {
    const { data: user, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) throw error
    return user
  } catch (error) {
    console.error("Error fetching user from database:", error)
    return null
  }
}
