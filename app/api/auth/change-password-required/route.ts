import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    console.log("🔄 CHANGE PASSWORD REQUIRED - Iniciando cambio obligatorio")

    const { newPassword } = await request.json()

    if (!newPassword) {
      return NextResponse.json({ error: "Nueva contraseña requerida" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    // Obtener sesión temporal
    const tempSessionCookie = cookies().get("temp_session")?.value
    if (!tempSessionCookie) {
      return NextResponse.json({ error: "Sesión temporal no válida" }, { status: 401 })
    }

    const tempSession = JSON.parse(tempSessionCookie)
    const userId = tempSession.id

    console.log("🔄 CHANGE PASSWORD REQUIRED - Usuario:", tempSession.email)

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Actualizar contraseña y marcar como cambiada
    const supabase = createServerSupabaseClient()
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password: hashedPassword,
        password_changed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      console.error("❌ Error updating password:", updateError)
      return NextResponse.json({ error: "Error al actualizar la contraseña" }, { status: 500 })
    }

    console.log("✅ CHANGE PASSWORD REQUIRED - Contraseña actualizada")

    // Crear sesión normal
    const sessionData = {
      id: tempSession.id,
      email: tempSession.email,
      name: tempSession.name,
      role: tempSession.role,
    }

    const response = NextResponse.json({
      success: true,
      message: "Contraseña cambiada exitosamente",
      redirectTo: "/",
    })

    // Eliminar sesión temporal
    response.cookies.delete("temp_session")

    // Establecer sesión normal
    response.cookies.set({
      name: "session",
      value: JSON.stringify(sessionData),
      path: "/",
      maxAge: 60 * 60 * 24, // 24 horas
      httpOnly: false,
      secure: false,
      sameSite: "lax",
    })

    console.log("✅ CHANGE PASSWORD REQUIRED - Sesión normal establecida")

    return response
  } catch (error) {
    console.error("❌ CHANGE PASSWORD REQUIRED - Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
