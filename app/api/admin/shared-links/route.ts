import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth" // Usaremos getSession para verificar el rol

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const session = getSession() // Obtener la sesión del usuario que hace la solicitud

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Obtener todos los itinerarios compartidos y la información del usuario propietario
    // y el título del itinerario original
    const { data: sharedLinks, error } = await supabase
      .from("shared_itineraries")
      .select(`
        id,
        title,
        reference_note,
        created_at,
        expires_at,
        view_count,
        is_active,
        user_id,
        users (
          email
        ),
        itineraries (
          title
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error al obtener enlaces compartidos para admin:", error)
      return NextResponse.json(
        { error: "Error al obtener enlaces compartidos", details: error.message },
        { status: 500 },
      )
    }

    // Mapear los datos para un formato más plano y amigable
    const formattedLinks = sharedLinks.map((link) => ({
      ...link,
      user_email: link.users?.email || null,
      itinerary_title: link.itineraries?.title || null,
      users: undefined, // Eliminar el objeto anidado users
      itineraries: undefined, // Eliminar el objeto anidado itineraries
    }))

    return NextResponse.json({ sharedLinks: formattedLinks || [] })
  } catch (error) {
    console.error("Error inesperado en API admin/shared-links:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
