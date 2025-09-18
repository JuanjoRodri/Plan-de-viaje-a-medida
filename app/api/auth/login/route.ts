import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    console.log("🔐 LOGIN API - Iniciando proceso de login")

    const { email, password } = await request.json()
    console.log("🔐 LOGIN API - Email recibido:", email)

    if (!email || !password) {
      console.log("❌ LOGIN API - Email o contraseña faltantes")
      return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 })
    }

    // Verificar variables de entorno
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("❌ LOGIN API - NEXT_PUBLIC_SUPABASE_URL no configurada")
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 })
    }

    // Conectar a Supabase usando la función helper
    console.log("🔐 LOGIN API - Conectando a Supabase...")
    const supabase = createServerSupabaseClient()

    // Buscar usuario (incluyendo password_changed)
    console.log("🔐 LOGIN API - Buscando usuario en base de datos...")
    const { data: users, error: searchError } = await supabase.from("users").select("*").eq("email", email).limit(1)

    if (searchError) {
      console.error("❌ LOGIN API - Error al buscar usuario:", searchError)
      return NextResponse.json(
        {
          error: "Error del servidor al buscar usuario",
          details: searchError.message,
        },
        { status: 500 },
      )
    }

    if (!users || users.length === 0) {
      console.log("❌ LOGIN API - Usuario no encontrado:", email)
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 })
    }

    const user = users[0]
    console.log("✅ LOGIN API - Usuario encontrado:", user.email)

    // Verificar contraseña
    console.log("🔐 LOGIN API - Verificando contraseña...")
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      console.log("❌ LOGIN API - Contraseña incorrecta")
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 })
    }

    console.log("✅ LOGIN API - Contraseña válida")

    // Verificar si necesita cambiar contraseña
    if (!user.password_changed) {
      console.log("🔄 LOGIN API - Usuario necesita cambiar contraseña")

      const response = NextResponse.json({
        success: true,
        requirePasswordChange: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        redirectTo: "/change-password-required",
      })

      // NO establecer ninguna cookie, solo responder con los datos
      return response
    }

    // Datos de sesión normal
    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || "user",
    }

    console.log("🔐 LOGIN API - Creando sesión para:", sessionData.email)

    // Crear respuesta
    const response = NextResponse.json({
      success: true,
      user: sessionData,
      redirectTo: "/",
    })

    // Establecer cookie
    response.cookies.set({
      name: "session",
      value: JSON.stringify(sessionData),
      path: "/",
      maxAge: 60 * 60 * 24, // 24 horas
      httpOnly: false,
      secure: false, // false para desarrollo local
      sameSite: "lax",
    })

    console.log("✅ LOGIN API - Cookie establecida correctamente")
    console.log("✅ LOGIN API - Login completado exitosamente")

    return response
  } catch (error) {
    console.error("❌ LOGIN API - Error crítico:", error)
    return NextResponse.json(
      {
        error: "Error del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
