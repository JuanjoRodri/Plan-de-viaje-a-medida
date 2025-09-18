import { getPlaceVerificationsByIds, type PlaceVerificationData } from "./place-verification-database-service"
import type { JsonItinerary, JsonActivityLocation } from "@/types/enhanced-database"
import { getPlaceDetailsByPlaceId, searchPlaceByName } from "./google-places-service"

export interface EnrichmentProgress {
  total: number
  processed: number
  verified: number
  failed: number
  currentPlace: string
  completed: boolean
}

export interface EnrichmentResult {
  success: boolean
  enrichedHtml: string
  verifiedPlaces: PlaceVerificationData[]
  stats: EnrichmentProgress
  errors?: string[]
}

export interface JsonEnrichmentResult {
  success: boolean
  enrichedItinerary: JsonItinerary
  verifiedPlacesData: PlaceVerificationData[] // Podríamos mantener esto para estadísticas o referencias
  stats: EnrichmentProgress
  errors?: string[]
}

/**
 * Extrae IDs de lugares del HTML
 */
function extractPlaceIdsFromHTML(html: string): string[] {
  console.log("🔍 HTML RECIBIDO PARA EXTRACCIÓN:")
  console.log("=".repeat(50))
  console.log(html.substring(0, 2000)) // Primeros 2000 caracteres
  console.log("=".repeat(50))

  // Buscar spans con data-place-id
  const spanRegex = /<span data-place-id="([^"]+)"/g
  const spanMatches = [...html.matchAll(spanRegex)]
  console.log(`📍 Spans con data-place-id encontrados: ${spanMatches.length}`)

  // Buscar enlaces con data-place-id
  const linkRegex = /<a[^>]+data-place-id="([^"]+)"/g
  const linkMatches = [...html.matchAll(linkRegex)]
  console.log(`🔗 Enlaces con data-place-id encontrados: ${linkMatches.length}`)

  // Buscar cualquier data-place-id
  const anyRegex = /data-place-id="([^"]+)"/g
  const anyMatches = [...html.matchAll(anyRegex)]
  console.log(`🎯 Cualquier data-place-id encontrado: ${anyMatches.length}`)

  if (anyMatches.length > 0) {
    console.log("📋 IDs encontrados:")
    anyMatches.forEach((match, index) => {
      console.log(`  ${index + 1}. ${match[1]}`)
    })
  }

  // Buscar marcadores [PLACE] que no se procesaron
  const placeRegex = /\[PLACE\]/g
  const placeMatches = [...html.matchAll(placeRegex)]
  console.log(`⚠️ Marcadores [PLACE] sin procesar: ${placeMatches.length}`)

  return anyMatches.map((match) => match[1])
}

/**
 * Enriquece un itinerario usando datos de la base de datos
 */
export async function enrichItinerary(
  html: string,
  destination: string,
  destinationCoords?: { lat: number; lng: number },
): Promise<EnrichmentResult> {
  console.log(`🚀 Iniciando enriquecimiento de itinerario para: ${destination}`)

  const startTime = new Date().toISOString()
  const errors: string[] = []

  try {
    // Extraer IDs de lugares del HTML
    const placeIds = extractPlaceIdsFromHTML(html)
    console.log(`📍 IDs de lugares extraídos del HTML: ${placeIds.length}`, placeIds)

    if (placeIds.length === 0) {
      console.log("❌ NO SE ENCONTRARON IDs DE LUGARES - VERIFICAR PROCESO DE GENERACIÓN")
      return {
        success: true,
        enrichedHtml: html,
        verifiedPlaces: [],
        stats: {
          total: 0,
          processed: 0,
          currentPlace: "No hay lugares para procesar",
          completed: true,
        },
      }
    }

    // Obtener datos de verificación de la base de datos
    console.log(`🔍 Obteniendo datos de verificación de la base de datos...`)
    const verifiedPlaces = await getPlaceVerificationsByIds(placeIds)
    console.log(`✅ Obtenidos ${verifiedPlaces.length} lugares verificados de la BD`)

    let enrichedHtml = html
    let processedCount = 0

    // Enriquecer cada lugar con su URL oficial
    for (const place of verifiedPlaces) {
      try {
        console.log(`🔄 Enriqueciendo lugar: ${place.place_name}`)

        // Si el lugar tiene URL oficial, usarla; si no, generar una
        const officialUrl =
          place.official_url ||
          (place.place_id
            ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.place_name + " " + destination)}`)

        // Buscar y reemplazar cualquier href que esté cerca del data-place-id
        const patterns = [
          // Patrón 1: span + enlace
          new RegExp(
            `(<span data-place-id="${place.id}"[^>]*></span>\\s*<a href=")[^"]*(" target="_blank"[^>]*>)`,
            "g",
          ),
          // Patrón 2: enlace con data-place-id
          new RegExp(`(<a[^>]+data-place-id="${place.id}"[^>]+href=")[^"]*("[^>]*>)`, "g"),
          // Patrón 3: cualquier enlace después del ID
          new RegExp(`(data-place-id="${place.id}"[^>]*>[^<]*<a href=")[^"]*("[^>]*>)`, "g"),
        ]

        let replaced = false
        for (const pattern of patterns) {
          if (pattern.test(enrichedHtml)) {
            enrichedHtml = enrichedHtml.replace(pattern, `$1${officialUrl}$2`)
            replaced = true
            console.log(`✅ Lugar enriquecido con patrón: ${place.place_name} -> ${officialUrl}`)
            break
          }
        }

        if (!replaced) {
          console.log(`⚠️ No se pudo enriquecer: ${place.place_name} (patrón no encontrado)`)
        }

        processedCount++
      } catch (error) {
        console.error(`❌ Error enriqueciendo lugar ${place.place_name}:`, error)
        errors.push(`Error enriqueciendo ${place.place_name}: ${error}`)
      }
    }

    const endTime = new Date().toISOString()
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime()

    const stats: EnrichmentProgress = {
      total: placeIds.length,
      processed: processedCount,
      verified: 0,
      failed: 0,
      currentPlace: "¡Completado!",
      completed: true,
    }

    console.log(`✅ Enriquecimiento completado en ${duration}ms:`, stats)

    return {
      success: true,
      enrichedHtml,
      verifiedPlaces,
      stats,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error) {
    console.error("❌ Error durante el enriquecimiento:", error)

    const stats: EnrichmentProgress = {
      total: 0,
      processed: 0,
      verified: 0,
      failed: 0,
      currentPlace: "Error",
      completed: true,
    }

    return {
      success: false,
      enrichedHtml: html,
      verifiedPlaces: [],
      stats,
      errors: [`Error general: ${error}`],
    }
  }
}

/**
 * Enriquece un JsonItinerary con URLs de Google Maps y verifica lugares.
 * Actualiza el objeto JsonItinerary directamente (o devuelve una copia modificada).
 */
export async function enrichJsonItinerary(
  itinerary: JsonItinerary,
  destinationName: string, // Nombre del destino general para contexto
  destinationCoords?: { lat: number; lng: number },
): Promise<JsonEnrichmentResult> {
  console.log(`🚀 Iniciando enriquecimiento JSON para: ${itinerary.title}`)
  const startTime = Date.now()
  const errors: string[] = []
  const verifiedPlacesData: PlaceVerificationData[] = []

  let totalActivitiesToProcess = 0
  itinerary.dailyPlans.forEach((day) => (totalActivitiesToProcess += day.activities.length))
  if (itinerary.preferences?.hotel?.name) {
    totalActivitiesToProcess++ // Contar el hotel
  }

  const stats: EnrichmentProgress = {
    total: totalActivitiesToProcess,
    processed: 0,
    verified: 0,
    failed: 0,
    currentPlace: "Iniciando...",
    completed: false,
  }

  const updateStats = (placeName: string, wasVerified: boolean) => {
    stats.processed++
    if (wasVerified) stats.verified++
    else stats.failed++
    stats.currentPlace = placeName
  }

  // Helper para enriquecer una ubicación (actividad o hotel)
  const enrichLocation = async (
    location: JsonActivityLocation | undefined,
    contextName: string,
  ): Promise<JsonActivityLocation | undefined> => {
    if (!location || !location.name) return location

    let placeDetails = null
    let verificationData: PlaceVerificationData | null = null

    stats.currentPlace = `Procesando: ${location.name}`
    console.log(`🔄 Procesando lugar: ${location.name}`)

    try {
      if (location.googlePlaceId) {
        console.log(`🔍 Buscando por Google Place ID: ${location.googlePlaceId}`)
        placeDetails = await getPlaceDetailsByPlaceId(location.googlePlaceId)
      }

      if (!placeDetails && location.name) {
        console.log(`🔍 Buscando por nombre: ${location.name} en ${destinationName}`)
        const searchResults = await searchPlaceByName(location.name, destinationCoords, destinationName)
        if (searchResults && searchResults.length > 0) {
          // Aquí se podría aplicar una lógica más sofisticada para elegir el mejor resultado
          // Por ahora, tomamos el primero que tenga place_id
          const bestMatch = searchResults.find((r) => r.place_id)
          if (bestMatch?.place_id) {
            console.log(`🏅 Mejor coincidencia encontrada: ${bestMatch.name} (${bestMatch.place_id})`)
            placeDetails = await getPlaceDetailsByPlaceId(bestMatch.place_id)
          } else {
            console.log(`⚠️ No se encontró un buen match con place_id para ${location.name}`)
          }
        }
      }

      if (placeDetails) {
        location.googlePlaceId = placeDetails.place_id
        location.address = placeDetails.formatted_address
        location.coordinates = { lat: placeDetails.geometry.location.lat, lng: placeDetails.geometry.location.lng }
        location.mapsUrl = placeDetails.url || `https://www.google.com/maps/place/?q=place_id:${placeDetails.place_id}`
        location.website = placeDetails.website
        location.phoneNumber = placeDetails.international_phone_number
        location.rating = placeDetails.rating
        location.userRatingsTotal = placeDetails.user_ratings_total

        // Añadir horarios de apertura si están disponibles
        if (placeDetails.opening_hours?.weekday_text) {
          location.openingHours = placeDetails.opening_hours.weekday_text.join("; ")
        } else if (placeDetails.opening_hours?.periods) {
          // Formato alternativo si no hay weekday_text
          location.openingHours = "Ver horarios en Google Maps"
        }

        location.verified = true
        console.log(`✅ Lugar verificado y enriquecido: ${location.name}`)

        // Guardar datos de verificación (opcional, pero puede ser útil)
        verificationData = {
          id: location.googlePlaceId || location.name, // Usar place_id si está disponible
          place_id: location.googlePlaceId,
          place_name: location.name,
          address: location.address,
          latitude: location.coordinates.lat,
          longitude: location.coordinates.lng,
          official_url: location.mapsUrl,
          similarity_score: 1, // Asumimos alta similaridad si se encontró
          source: "google-enrichment",
          created_at: new Date().toISOString(),
        }
        verifiedPlacesData.push(verificationData)
        updateStats(location.name, true)
      } else {
        console.log(`⚠️ No se pudo verificar/enriquecer: ${location.name}`)
        location.verified = false
        // Generar un enlace de búsqueda genérico si no se encuentra
        location.mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name + " " + destinationName)}`
        updateStats(location.name, false)
        errors.push(`No se pudo verificar/enriquecer: ${location.name}`)
      }
    } catch (error: any) {
      console.error(`❌ Error enriqueciendo lugar ${location.name}:`, error)
      errors.push(`Error enriqueciendo ${location.name}: ${error.message || error}`)
      location.verified = false
      location.mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name + " " + destinationName)}`
      updateStats(location.name, false)
    }
    return location
  }

  // Enriquecer hotel si existe
  if (itinerary.preferences?.hotel) {
    itinerary.preferences.hotel =
      (await enrichLocation(itinerary.preferences.hotel, "Hotel")) || itinerary.preferences.hotel
  }

  // Enriquecer actividades
  for (const dayPlan of itinerary.dailyPlans) {
    for (const activity of dayPlan.activities) {
      if (activity.location) {
        activity.location = (await enrichLocation(activity.location, activity.title)) || activity.location
      } else {
        // Si no hay location object pero sí un nombre de lugar en el título o descripción,
        // se podría intentar crear un location object y enriquecerlo.
        // Por ahora, solo procesamos si existe activity.location.
        stats.processed++ // Contar como procesada aunque no tenga ubicación para enriquecer
        stats.currentPlace = activity.title
      }
    }
  }

  stats.completed = true
  stats.currentPlace = "¡Completado!"
  const duration = Date.now() - startTime
  console.log(`✅ Enriquecimiento JSON completado en ${duration}ms:`, stats)

  return {
    success: errors.length === 0,
    enrichedItinerary: itinerary, // Devuelve el itinerario modificado
    verifiedPlacesData,
    stats,
    errors: errors.length > 0 ? errors : undefined,
  }
}
