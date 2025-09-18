import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  try {
    console.log("API: Recibida solicitud a /api/shared-itineraries")
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    console.log("API: userId recibido:", userId)

    if (!userId) {
      console.log("API: No se proporcionó userId")
      return NextResponse.json({ error: "Se requiere el ID del usuario" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Verificar si la tabla shared_itineraries existe
    const { data: tableExists, error: tableCheckError } = await supabase
      .from("shared_itineraries")
      .select("id")
      .limit(1)

    if (tableCheckError) {
      console.error("API: Error al verificar la tabla shared_itineraries:", tableCheckError)
      return NextResponse.json(
        { error: "Error al verificar la tabla de itinerarios compartidos", details: tableCheckError.message },
        { status: 500 },
      )
    }

    // Obtener itinerarios compartidos del usuario
    const { data: sharedItineraries, error } = await supabase
      .from("shared_itineraries")
      .select("id, title, created_at, expires_at, view_count, is_active")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("API: Error al obtener itinerarios compartidos:", error)
      return NextResponse.json(
        { error: "Error al obtener itinerarios compartidos", details: error.message },
        { status: 500 },
      )
    }

    console.log(`API: Se encontraron ${sharedItineraries?.length || 0} itinerarios compartidos`)
    return NextResponse.json({ sharedItineraries: sharedItineraries || [] })
  } catch (error) {
    console.error("API: Error inesperado:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
