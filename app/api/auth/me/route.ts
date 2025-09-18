import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerSupabaseClient } from "@/lib/supabase"
import { SimpleItineraryCounter } from "@/app/services/simple-itinerary-counter"

export async function GET() {
  const sessionCookie = cookies().get("session")?.value

  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  try {
    const session = JSON.parse(sessionCookie)

    // Obtener información completa del usuario desde la base de datos
    const supabase = createServerSupabaseClient()

    // Consultar información del usuario
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, name, role, created_at")
      .eq("id", session.id)
      .single()

    if (userError) {
      console.error("Error fetching user data:", userError)
      // Devolver un estado por defecto si el usuario no se encuentra pero la sesión existe
      return NextResponse.json({
        authenticated: true,
        user: {
          id: session.id,
          email: session.email,
          name: session.name,
          role: session.role,
          monthly_itinerary_limit: 50, // valor por defecto
          monthly_itineraries_used: 0,
          remaining_itineraries: 50,
        },
      })
    }

    // Usar el servicio refactorizado para obtener el estado actual
    const userStatus = await SimpleItineraryCounter.getUserStatus(userData.id)

    return NextResponse.json({
      authenticated: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        // El límite para la navbar debe ser el total disponible
        monthly_itinerary_limit: userStatus.totalAvailable,
        monthly_itineraries_used: userStatus.used,
        // Los restantes se calculan sobre el total disponible
        remaining_itineraries: userStatus.totalAvailable - userStatus.used,
        created_at: userData.created_at,
      },
    })
  } catch (error) {
    console.error("Error in /api/auth/me:", error)
    // En caso de error, invalidar la sesión para el cliente
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}
