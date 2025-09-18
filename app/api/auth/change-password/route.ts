import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json()

    // Validaciones básicas
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "La nueva contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    // Obtener usuario de la sesión
    const sessionCookie = cookies().get("session")?.value
    if (!sessionCookie) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie)
    const userId = session.id

    // Obtener usuario de la base de datos
    const supabase = createServerSupabaseClient()
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError || !user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 })
    }

    // Verificar que la nueva contraseña sea diferente
    const isSamePassword = await bcrypt.compare(newPassword, user.password)
    if (isSamePassword) {
      return NextResponse.json({ error: "La nueva contraseña debe ser diferente a la actual" }, { status: 400 })
    }

    // Hashear nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Actualizar contraseña en la base de datos
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password: hashedNewPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Error updating password:", updateError)
      return NextResponse.json({ error: "Error al actualizar la contraseña" }, { status: 500 })
    }

    return NextResponse.json({ message: "Contraseña cambiada exitosamente" })
  } catch (error) {
    console.error("Error in change-password:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
