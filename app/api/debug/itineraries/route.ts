import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Obtener todos los itinerarios del usuario para debug
    const { data: itineraries, error } = await supabase
      .from("itineraries")
      .select("id, title, destination, created_at, is_history, is_favorite, is_current")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error al obtener itinerarios:", error)
      return NextResponse.json({ error: "Error al obtener itinerarios" }, { status: 500 })
    }

    return NextResponse.json({
      user_id: user.id,
      total_itineraries: itineraries?.length || 0,
      itineraries: itineraries || [],
    })
  } catch (error) {
    console.error("Error en debug de itinerarios:", error)
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
  }
}
