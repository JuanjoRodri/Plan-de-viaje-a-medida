import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    console.log("🔄 CHANGE PASSWORD SIMPLE - Iniciando cambio de contraseña")

    const { newPassword, userId } = await request.json()
    console.log("🔄 CHANGE PASSWORD SIMPLE - Usuario ID:", userId)

    if (!newPassword || !userId) {
      console.log("❌ CHANGE PASSWORD SIMPLE - Datos faltantes")
      return NextResponse.json({ error: "Nueva contraseña y ID de usuario requeridos" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      console.log("❌ CHANGE PASSWORD SIMPLE - Contraseña muy corta")
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    // Conectar a Supabase
    console.log("🔄 CHANGE PASSWORD SIMPLE - Conectando a Supabase...")
    const supabase = createServerSupabaseClient()

    // Hash de la nueva contraseña
    console.log("🔄 CHANGE PASSWORD SIMPLE - Hasheando nueva contraseña...")
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Actualizar contraseña y marcar como cambiada
    console.log("🔄 CHANGE PASSWORD SIMPLE - Actualizando contraseña en base de datos...")
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        password: hashedPassword,
        password_changed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select("id, email, name, role")
      .single()

    if (updateError) {
      console.error("❌ CHANGE PASSWORD SIMPLE - Error al actualizar:", updateError)
      return NextResponse.json(
        {
          error: "Error al actualizar la contraseña",
          details: updateError.message,
        },
        { status: 500 },
      )
    }

    console.log("✅ CHANGE PASSWORD SIMPLE - Contraseña actualizada exitosamente")

    return NextResponse.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
      user: updatedUser,
    })
  } catch (error) {
    console.error("❌ CHANGE PASSWORD SIMPLE - Error crítico:", error)
    return NextResponse.json(
      {
        error: "Error del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
