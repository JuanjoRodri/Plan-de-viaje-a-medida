import { type NextRequest, NextResponse } from "next/server"
import { searchPlaces, getPlaceDetails } from "@/app/services/google-places-service"
import { LOCATION_VERIFICATION } from "@/app/config"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query")
    const type = searchParams.get("type")
    const locationPlaceId = searchParams.get("location")
    const limitParam = searchParams.get("limit")

    if (!query) {
      return NextResponse.json({ error: "Se requiere un parámetro de búsqueda (query)" }, { status: 400 })
    }

    // Parsear el límite, por defecto sin límite para mantener compatibilidad
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined
    const validLimit = limit && !isNaN(limit) && limit > 0 ? Math.min(limit, 20) : undefined // Máximo 20

    console.log(
      `🔍 [API Places Search] Query: "${query}", Type: ${type || "any"}, Limit: ${validLimit || "sin límite"}`,
    )

    let locationBias: { lat: number; lng: number; radius?: number } | undefined = undefined

    // Si se proporciona un placeId para la ubicación, obtenemos sus coordenadas para centrar la búsqueda
    if (locationPlaceId && locationPlaceId.startsWith("Ch")) {
      // Heurística para un Google Place ID
      console.log(`📍 Obteniendo coordenadas para el placeId de ubicación: ${locationPlaceId}`)
      const details = await getPlaceDetails(locationPlaceId)
      if (details?.geometry?.location) {
        locationBias = {
          lat: details.geometry.location.lat,
          lng: details.geometry.location.lng,
          radius: LOCATION_VERIFICATION.DEFAULT_SEARCH_RADIUS,
        }
        console.log(`  -> Coordenadas obtenidas para sesgo de ubicación: ${locationBias.lat}, ${locationBias.lng}`)
      } else {
        console.warn(`  -> No se pudieron obtener coordenadas para el placeId: ${locationPlaceId}`)
      }
    }

    // AQUÍ ESTÁ EL FIX: Pasar el validLimit como 5º parámetro
    const results = await searchPlaces(query, undefined, type || undefined, locationBias, validLimit)

    console.log(`✅ [API Places Search] Devolviendo ${results.length} resultados`)

    return NextResponse.json({
      results: results || [],
      total: results.length,
      limit: validLimit,
    })
  } catch (error) {
    console.error("Error en la ruta de búsqueda de lugares:", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ error: `Error interno del servidor: ${errorMessage}` }, { status: 500 })
  }
}
