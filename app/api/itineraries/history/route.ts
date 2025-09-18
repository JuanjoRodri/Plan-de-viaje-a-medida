import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    const supabase = createServerSupabaseClient()

    // Obtener todos los itinerarios del usuario (no solo los marcados como historial)
    // y ordenarlos por fecha de creación descendente para mostrar los más recientes
    const {
      data: historyItineraries,
      error,
      count,
    } = await supabase
      .from("itineraries")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error al obtener historial:", error)
      return NextResponse.json({ error: "Error al obtener el historial" }, { status: 500 })
    }

    const totalItems = count || 0
    const hasMore = offset + limit < totalItems

    return NextResponse.json({
      itineraries: historyItineraries,
      pagination: {
        page,
        limit,
        total: totalItems,
        hasMore,
      },
      hasMore, // Para compatibilidad con el frontend
    })
  } catch (error) {
    console.error("Error al obtener historial:", error)
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { itinerary, title } = body

    if (!itinerary) {
      return NextResponse.json({ error: "Itinerario requerido" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Guardar el itinerario en el historial
    const { data, error } = await supabase
      .from("itineraries")
      .insert({
        user_id: user.id,
        title: title || "Itinerario sin título",
        content: itinerary,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error al guardar en historial:", error)
      return NextResponse.json({ error: "Error al guardar el itinerario" }, { status: 500 })
    }

    return NextResponse.json({ success: true, itinerary: data })
  } catch (error) {
    console.error("Error al guardar en historial:", error)
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Eliminar todos los itinerarios del usuario (excepto los favoritos si los hay)
    const { error } = await supabase.from("itineraries").delete().eq("user_id", user.id).neq("is_favorite", true) // No eliminar favoritos si existen

    if (error) {
      console.error("Error al limpiar historial:", error)
      return NextResponse.json({ error: "Error al limpiar el historial" }, { status: 500 })
    }

    return NextResponse.json({ message: "Historial limpiado correctamente" })
  } catch (error) {
    console.error("Error al limpiar historial:", error)
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
  }
}
