import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { title } = await request.json()

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json({ error: "El título no puede estar vacío" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Actualizar el título del itinerario
    const { data, error } = await supabase
      .from("itineraries")
      .update({
        title,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("user_id", user.id) // Asegurar que solo el dueño puede modificar
      .select()
      .single()

    if (error) {
      console.error("Error updating itinerary title:", error)
      return NextResponse.json({ error: "Error al actualizar el título" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Itinerario no encontrado" }, { status: 404 })
    }

    // También actualizar el título en json_content si existe
    if (data.json_content && typeof data.json_content === "object") {
      const updatedJsonContent = {
        ...data.json_content,
        title,
      }

      const { error: jsonUpdateError } = await supabase
        .from("itineraries")
        .update({ json_content: updatedJsonContent })
        .eq("id", params.id)
        .eq("user_id", user.id)

      if (jsonUpdateError) {
        console.error("Error updating json_content title:", jsonUpdateError)
      }
    }

    return NextResponse.json({
      message: "Título actualizado correctamente",
      itinerary: data,
    })
  } catch (error: any) {
    console.error("Error updating title:", error)
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
  }
}
