import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    if (!id) {
      return NextResponse.json({ error: "Se requiere el ID del itinerario compartido" }, { status: 400 })
    }

    // Obtener userId de la cookie session (mismo patrón que usa tu app)
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get("session")?.value

    if (!sessionCookie) {
      console.log(`[RESET_NOTIF] No se encontró cookie session para ID ${id}`)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    let userId: string
    try {
      const session = JSON.parse(sessionCookie)
      userId = session.id
      if (!userId) {
        console.log(`[RESET_NOTIF] No se encontró userId en la cookie session para ID ${id}`)
        return NextResponse.json({ error: "No autorizado" }, { status: 401 })
      }
    } catch (parseError) {
      console.log(`[RESET_NOTIF] Error al parsear cookie session para ID ${id}:`, parseError)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log(`[RESET_NOTIF] Usuario autenticado via cookies: ${userId}`)

    const supabase = createServerSupabaseClient()

    // Verificar que el itinerario pertenece al usuario
    const { data: itinerary, error: fetchError } = await supabase
      .from("shared_itineraries")
      .select("user_id, notification_sent_at")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error(`[RESET_NOTIF] Error al verificar el itinerario ${id}:`, fetchError)
      return NextResponse.json({ error: "Error al verificar el itinerario" }, { status: 500 })
    }

    if (!itinerary || itinerary.user_id !== userId) {
      console.log(`[RESET_NOTIF] Intento no autorizado para ID ${id} por usuario ${userId}`)
      return NextResponse.json({ error: "No autorizado para resetear este itinerario" }, { status: 403 })
    }

    // --- VERIFICACIÓN AÑADIDA ---
    console.log(
      `[RESET_NOTIF] ID: ${id} - Valor actual de notification_sent_at ANTES del update:`,
      itinerary.notification_sent_at,
    )
    // --- FIN VERIFICACIÓN AÑADIDA ---

    // Actualizar notification_sent_at a NULL
    const { error: updateError } = await supabase
      .from("shared_itineraries")
      .update({ notification_sent_at: null })
      .eq("id", id)

    if (updateError) {
      console.error(`[RESET_NOTIF] Error al resetear la notificación para ID ${id}:`, updateError)
      return NextResponse.json({ error: "Error al resetear la notificación" }, { status: 500 })
    }

    // --- VERIFICACIÓN AÑADIDA ---
    // Volvemos a leer el valor para confirmar el cambio
    const { data: updatedItinerary, error: reFetchError } = await supabase
      .from("shared_itineraries")
      .select("notification_sent_at")
      .eq("id", id)
      .single()

    if (reFetchError) {
      console.error(`[RESET_NOTIF] Error al re-verificar notification_sent_at para ID ${id}:`, reFetchError)
    } else {
      console.log(
        `[RESET_NOTIF] ID: ${id} - Valor de notification_sent_at DESPUÉS del update:`,
        updatedItinerary?.notification_sent_at,
      )
    }
    // --- FIN VERIFICACIÓN AÑADIDA ---

    return NextResponse.json({ success: true, message: "Notificación reseteada correctamente" })
  } catch (error) {
    console.error("[RESET_NOTIF] Error inesperado al resetear notificación:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
