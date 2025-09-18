import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { is_favorite } = await request.json()
    const supabase = createServerSupabaseClient()

    // Actualizar el estado de favorito del itinerario
    const { data, error } = await supabase
      .from("itineraries")
      .update({ is_favorite })
      .eq("id", params.id)
      .eq("user_id", user.id) // Asegurar que solo el dueño puede modificar
      .select()
      .single()

    if (error) {
      console.error("Error updating favorite status:", error)
      return NextResponse.json({ error: "Error al actualizar favorito" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Itinerario no encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Estado de favorito actualizado",
      itinerary: data,
    })
  } catch (error) {
    console.error("Error updating favorite:", error)
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
  }
}
