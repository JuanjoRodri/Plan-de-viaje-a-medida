import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const itineraryData = await request.json()

    const supabase = createServerSupabaseClient()

    // Primero, marcar todos los itinerarios actuales como no actuales
    await supabase.from("itineraries").update({ is_current: false }).eq("user_id", user.id).eq("is_current", true)

    // Crear o actualizar el itinerario actual
    const { data: currentItinerary, error } = await supabase
      .from("itineraries")
      .upsert([
        {
          user_id: user.id,
          title: `${itineraryData.destination} - ${new Date().toLocaleDateString()}`,
          destination: itineraryData.destination,
          days: Number.parseInt(itineraryData.days),
          nights: Number.parseInt(itineraryData.nights || "0"),
          travelers: Number.parseInt(itineraryData.travelers),
          hotel: itineraryData.hotel,
          arrival_time: itineraryData.arrivalTime,
          departure_time: itineraryData.departureTime,
          budget_type: itineraryData.budget,
          board_type: itineraryData.boardType,
          html_content: itineraryData.html,
          weather_data: itineraryData.weatherData,
          generation_params: {
            destination: itineraryData.destination,
            days: Number.parseInt(itineraryData.days),
            travelers: Number.parseInt(itineraryData.travelers),
            budget_type: itineraryData.budget,
            timestamp: new Date().toISOString(),
          },
          is_current: true,
          is_history: false,
          auto_saved: true,
          last_viewed_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error al guardar itinerario actual:", error)
      return NextResponse.json({ error: "Error al guardar el itinerario actual" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Itinerario actual guardado correctamente",
      itinerary: currentItinerary,
    })
  } catch (error) {
    console.error("Error al guardar itinerario actual:", error)
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Obtener el itinerario actual del usuario
    const { data: currentItinerary, error } = await supabase
      .from("itineraries")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_current", true)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error al obtener itinerario actual:", error)
      return NextResponse.json({ error: "Error al obtener el itinerario actual" }, { status: 500 })
    }

    return NextResponse.json({ currentItinerary: currentItinerary || null })
  } catch (error) {
    console.error("Error al obtener itinerario actual:", error)
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 })
  }
}
