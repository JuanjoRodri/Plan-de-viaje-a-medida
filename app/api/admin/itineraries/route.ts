import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"

export async function GET(request: Request) {
  // Verificar si el usuario es administrador
  const { props, redirect } = await requireAdmin()
  if (redirect) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const supabase = createServerSupabaseClient()

  try {
    // Obtener todos los itinerarios
    const { data: itineraries, error: itinerariesError } = await supabase
      .from("itineraries")
      .select("*")
      .order("created_at", { ascending: false })

    if (itinerariesError) throw itinerariesError

    // Obtener información de usuarios
    const { data: users, error: usersError } = await supabase.from("users").select("id, name, email")

    if (usersError) throw usersError

    // Crear un mapa de usuarios
    const userMap = users.reduce(
      (acc, user) => {
        acc[user.id] = user
        return acc
      },
      {} as Record<string, { name: string; email: string }>,
    )

    // Formatear los datos para incluir el nombre y email del usuario directamente
    const formattedItineraries = itineraries.map((itinerary) => ({
      ...itinerary,
      user_name: userMap[itinerary.user_id]?.name || null,
      user_email: userMap[itinerary.user_id]?.email || null,
    }))

    return NextResponse.json({
      message: "Admin itineraries endpoint working",
      itineraries: formattedItineraries,
    })
  } catch (error) {
    console.error("Error fetching itineraries:", error)
    return NextResponse.json({ error: "Error al obtener itinerarios" }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json({
    message: "POST method working",
  })
}
