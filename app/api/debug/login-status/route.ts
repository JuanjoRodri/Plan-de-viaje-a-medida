import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("🔍 DIAGNÓSTICO LOGIN - Iniciando...")

    // 1. Verificar variables de entorno
    const checks = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
    }

    console.log("🔍 Variables de entorno:", checks)

    // 2. Probar conexión a Supabase
    let supabaseConnection = false
    let supabaseError = null
    try {
      const supabase = createServerSupabaseClient()
      const { data, error } = await supabase.from("users").select("count").limit(1)
      supabaseConnection = !error
      if (error) supabaseError = error.message
      console.log("🔍 Conexión Supabase:", supabaseConnection, error?.message)
    } catch (err) {
      supabaseError = err instanceof Error ? err.message : "Error desconocido"
      console.log("🔍 Error conexión Supabase:", supabaseError)
    }

    // 3. Verificar tabla users
    let usersTableExists = false
    let usersCount = 0
    try {
      const supabase = createServerSupabaseClient()
      const { data, error } = await supabase.from("users").select("count", { count: "exact" })
      usersTableExists = !error
      usersCount = data?.length || 0
      console.log("🔍 Tabla users:", usersTableExists, "Count:", usersCount)
    } catch (err) {
      console.log("🔍 Error tabla users:", err)
    }

    return NextResponse.json({
      status: "debug",
      timestamp: new Date().toISOString(),
      environment: {
        ...checks,
      },
      supabase: {
        connection: supabaseConnection,
        error: supabaseError,
        usersTableExists,
        usersCount,
      },
      recommendations: [
        !checks.supabaseUrl && "❌ Falta NEXT_PUBLIC_SUPABASE_URL",
        !checks.supabaseAnonKey && "❌ Falta NEXT_PUBLIC_SUPABASE_ANON_KEY",
        !checks.supabaseServiceKey && "❌ Falta SUPABASE_SERVICE_ROLE_KEY",
        !supabaseConnection && "❌ No se puede conectar a Supabase",
        !usersTableExists && "❌ Tabla 'users' no existe",
        usersCount === 0 && "⚠️ No hay usuarios en la tabla",
      ].filter(Boolean),
    })
  } catch (error) {
    console.error("🔍 Error en diagnóstico:", error)
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Error desconocido",
    })
  }
}
