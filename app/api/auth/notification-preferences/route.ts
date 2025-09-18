import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

export async function PATCH(request: Request) {
  try {
    // Obtener usuario de la sesión
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get("session")?.value

    if (!sessionCookie) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie)
    const userId = session?.id

    if (!userId) {
      return NextResponse.json({ error: "Usuario no válido" }, { status: 401 })
    }

    const { email_notifications_enabled, notification_hours_before } = await request.json()

    // Validar datos
    if (typeof email_notifications_enabled !== "boolean") {
      return NextResponse.json({ error: "email_notifications_enabled debe ser boolean" }, { status: 400 })
    }

    if (notification_hours_before && ![6, 12, 24, 48].includes(notification_hours_before)) {
      return NextResponse.json({ error: "notification_hours_before debe ser 6, 12, 24 o 48" }, { status: 400 })
    }

    // Actualizar preferencias en la base de datos
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({
        email_notifications_enabled,
        notification_hours_before: notification_hours_before || 12,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error actualizando preferencias:", error)
      return NextResponse.json({ error: "Error actualizando preferencias" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Preferencias actualizadas correctamente",
      user: updatedUser,
    })
  } catch (error) {
    console.error("Error en PATCH /api/auth/notification-preferences:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
