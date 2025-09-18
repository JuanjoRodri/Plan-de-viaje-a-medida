import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"
import type { JsonItinerary } from "@/types/enhanced-database"

export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      id,
      title,
      destination,
      days,
      nights,
      travelers,
      hotel,
      arrival_time,
      departure_time,
      budget_type,
      html_content,
      weather_data,
      budget_details,
      json_content,
      is_history,
      auto_saved,
      is_favorite,
      start_date,
      end_date,
      board_type,
      generation_params,
    }: Partial<JsonItinerary & { html_content?: string }> = body

    if (!json_content && (!title || !destination || !days || !travelers)) {
      return NextResponse.json(
        { error: "Faltan datos requeridos (json_content o detalles básicos) para guardar el itinerario" },
        { status: 400 },
      )
    }

    const supabase = createServerSupabaseClient()

    const dbData = {
      user_id: user.id,
      title: json_content?.title || title,
      destination: json_content?.destination?.name || destination,
      days: json_content?.daysCount || days,
      nights: json_content?.daysCount ? json_content.daysCount - 1 : nights,
      travelers: json_content?.travelers || travelers,
      hotel: json_content?.preferences?.hotel?.name || hotel,
      arrival_time: json_content?.dailyPlans?.[0]?.activities?.[0]?.startTime || arrival_time || "N/A",
      departure_time:
        json_content?.dailyPlans?.[json_content.dailyPlans.length - 1]?.activities?.[
          json_content.dailyPlans[json_content.dailyPlans.length - 1].activities.length - 1
        ]?.endTime ||
        departure_time ||
        "N/A",
      budget_type: json_content?.budget?.type || budget_type,
      html_content: html_content,
      weather_data: json_content?.weatherData || weather_data,
      budget_details: json_content?.budget
        ? {
            total_estimated: json_content.budget.estimatedTotal,
            currency: json_content.budget.currency,
            breakdown: json_content.budget.breakdown,
          }
        : budget_details,
      json_content: json_content,
      is_history: is_history !== undefined ? is_history : false,
      auto_saved: auto_saved !== undefined ? auto_saved : false,
      is_favorite: is_favorite !== undefined ? is_favorite : true,
      start_date: json_content?.startDate || start_date,
      end_date: json_content?.endDate || end_date,
      board_type: json_content?.preferences?.boardType || board_type,
      generation_params: json_content?.generationParams || generation_params,
      last_viewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    let savedItinerary
    let error
    let message
    let isNewItinerary = false

    if (id) {
      console.log(`Attempting to update itinerary with ID: ${id}`)
      const { data, error: updateError } = await supabase
        .from("itineraries")
        .update(dbData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single()
      savedItinerary = data
      error = updateError
      message = "Itinerario actualizado correctamente"
      if (updateError) console.error("Error al actualizar itinerario (API POST):", updateError)
    } else {
      const newId = json_content?.id || require("uuid").v4()
      console.log(`Attempting to insert new itinerary with ID: ${newId}`)
      const { data, error: insertError } = await supabase
        .from("itineraries")
        .insert([{ ...dbData, id: newId, created_at: new Date().toISOString() }])
        .select()
        .single()
      savedItinerary = data
      error = insertError
      message = "Itinerario creado y guardado correctamente"
      isNewItinerary = true
      if (insertError) console.error("Error al insertar itinerario (API POST):", insertError)
    }

    if (error) {
      return NextResponse.json({ error: `Error al guardar el itinerario: ${error.message}` }, { status: 500 })
    }

    // Incrementar el contador de itinerarios creados si es un nuevo itinerario
    if (isNewItinerary) {
      try {
        await supabase.rpc("increment_metric", {
          metric_name_param: "total_itineraries_created",
          increment_value: 1,
        })
        console.log("✅ Contador de itinerarios incrementado correctamente")
      } catch (metricError) {
        console.error("❌ Error al incrementar contador de itinerarios:", metricError)
        // No fallamos la operación principal si esto falla
      }
    }

    return NextResponse.json({
      message,
      itinerary: savedItinerary,
    })
  } catch (error: any) {
    console.error("Error catastrófico en API POST /api/itineraries:", error)
    return NextResponse.json({ error: `Error en el servidor: ${error.message}` }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    const supabase = createServerSupabaseClient()
    let query = supabase.from("itineraries").select("*, json_content", { count: "exact" }).eq("user_id", user.id)

    // Modificamos esta parte para mostrar todos los itinerarios en historial
    if (type === "saved" || type === "favorite") {
      // Itinerarios guardados explícitamente como favoritos
      query = query.eq("is_favorite", true)
    } else if (type === "history") {
      // Historial: TODOS los itinerarios del usuario, ordenados por fecha
      // No filtramos por is_favorite, mostramos todos
      // La diferenciación visual se hará en el frontend
    } else {
      // Si no se especifica tipo, se devuelven todos los itinerarios del usuario
    }

    query = query
      .order("last_viewed_at", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: itineraries, error, count } = await query

    if (error) {
      console.error("Error al obtener itinerarios (API GET):", error)
      return NextResponse.json({ error: "Error al obtener los itinerarios" }, { status: 500 })
    }

    const totalItems = count || 0
    const hasMore = offset + (itineraries?.length || 0) < totalItems

    return NextResponse.json({
      itineraries,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        hasNextPage: hasMore,
      },
      hasMore,
    })
  } catch (error: any) {
    console.error("Error al obtener itinerarios (API GET):", error)
    return NextResponse.json({ error: `Error en el servidor: ${error.message}` }, { status: 500 })
  }
}
