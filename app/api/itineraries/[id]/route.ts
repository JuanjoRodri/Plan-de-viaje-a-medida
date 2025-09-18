import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Obtener el itinerario
    const { data: itinerary, error } = await supabase.from("itineraries").select("*").eq("id", params.id).single()

    if (error) {
      console.error("Error al obtener itinerario:", error)
      return NextResponse.json({ error: "Error al obtener el itinerario" }, { status: 500 })
    }

    // Verificar que el itinerario pertenezca al usuario
    if (itinerary.user_id !== user.id) {
      return NextResponse.json({ error: "No tienes permiso para ver este itinerario" }, { status: 403 })
    }

    return NextResponse.json({ itinerary })
  } catch (error) {
    console.error("Error al obtener itinerario:", error)
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { title, destination, days, travelers, budget_type, html_content } = await request.json()

    const supabase = createServerSupabaseClient()

    // Verificar que el itinerario exista y pertenezca al usuario
    const { data: existingItinerary, error: fetchError } = await supabase
      .from("itineraries")
      .select("user_id")
      .eq("id", params.id)
      .single()

    if (fetchError) {
      console.error("Error al verificar itinerario:", fetchError)
      return NextResponse.json({ error: "Error al verificar el itinerario" }, { status: 500 })
    }

    if (!existingItinerary) {
      return NextResponse.json({ error: "Itinerario no encontrado" }, { status: 404 })
    }

    if (existingItinerary.user_id !== user.id) {
      return NextResponse.json({ error: "No tienes permiso para editar este itinerario" }, { status: 403 })
    }

    // Actualizar el itinerario
    const { data: updatedItinerary, error } = await supabase
      .from("itineraries")
      .update({
        title,
        destination,
        days,
        travelers,
        budget_type,
        html_content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error al actualizar itinerario:", error)
      return NextResponse.json({ error: "Error al actualizar el itinerario" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Itinerario actualizado correctamente",
      itinerary: updatedItinerary,
    })
  } catch (error) {
    console.error("Error al actualizar itinerario:", error)
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Verificar que el itinerario exista y pertenezca al usuario
    const { data: existingItinerary, error: fetchError } = await supabase
      .from("itineraries")
      .select("user_id")
      .eq("id", params.id)
      .single()

    if (fetchError) {
      console.error("Error al verificar itinerario:", fetchError)
      return NextResponse.json({ error: "Error al verificar el itinerario" }, { status: 500 })
    }

    if (!existingItinerary) {
      return NextResponse.json({ error: "Itinerario no encontrado" }, { status: 404 })
    }

    if (existingItinerary.user_id !== user.id) {
      return NextResponse.json({ error: "No tienes permiso para eliminar este itinerario" }, { status: 403 })
    }

    // Eliminar el itinerario
    const { error } = await supabase.from("itineraries").delete().eq("id", params.id)

    if (error) {
      console.error("Error al eliminar itinerario:", error)
      return NextResponse.json({ error: "Error al eliminar el itinerario" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Itinerario eliminado correctamente",
    })
  } catch (error) {
    console.error("Error al eliminar itinerario:", error)
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
  }
}
