// Servicio para gestionar lugares en la base de datos local
// Integra Supabase con Google Places API para reducir costos y mejorar rendimiento

import { createServerSupabaseClient } from "@/lib/supabase"
import {
  searchPlaces as searchPlacesGoogle, // Renombrar para evitar conflicto
  type PlaceSearchResult,
  type PlaceDetails,
  type PlaceVerificationResult,
  getPlaceDetails as getPlaceDetailsGoogle, // Renombrar para evitar conflicto
} from "./google-places-service"

// Interfaces para la base de datos
export interface DatabasePlace {
  id: number
  place_id: string
  name: string
  formatted_address?: string
  destination_context?: string
  rating?: number
  user_ratings_total?: number
  price_level?: number
  types?: string[]
  latitude?: number
  longitude?: number
  sentiment_score?: number
  sentiment_summary?: string
  sentiment_keywords?: string[]
  search_count: number
  last_searched_at: string
  created_at: string
  updated_at: string
  website?: string
  phone?: string
  opening_hours?: any
  photos?: any
  business_status?: string
  maps_url?: string // <--- AÑADIDO: Para guardar la URL de Google Maps con CID
}

export interface PlaceSearchOptions {
  destination?: string
  location?: string // Coordenadas "lat,lng"
  type?: string
  locationBias?: { lat: number; lng: number; radius?: number }
  forceApiCall?: boolean
}

// Función para buscar lugares (primero en BD, luego en API)
export async function searchPlacesWithDatabase(
  query: string,
  options: PlaceSearchOptions = {},
): Promise<PlaceSearchResult[]> {
  const { destination, location, type, locationBias, forceApiCall = false } = options

  console.log(`🔍 Buscando: "${query}" | Destino: "${destination}" | Forzar API: ${forceApiCall}`)

  if (!forceApiCall) {
    const dbResults = await searchPlacesInDatabase(query, destination)
    if (dbResults.length > 0) {
      console.log(`🎯 ✅ USANDO BASE DE DATOS - Encontrados ${dbResults.length} lugares para "${query}"`)
      return convertDatabaseToSearchResults(dbResults)
    }
  }

  console.log(`🌐 ❌ NO ENCONTRADO EN BD - Llamando a Google Places API para "${query}"`)

  try {
    // Usar la función renombrada del servicio de Google
    const apiResults = await searchPlacesGoogle(query, location, type, locationBias)

    if (apiResults.length > 0) {
      await savePlacesToDatabase(apiResults, destination)
      console.log(`💾 ✅ GUARDADO EN BD - ${apiResults.length} lugares almacenados`)
    }
    return apiResults
  } catch (error) {
    console.error("Error en Google Places API (searchPlacesWithDatabase):", error)
    return []
  }
}

async function searchPlacesInDatabase(query: string, destination?: string): Promise<DatabasePlace[]> {
  try {
    const supabase = createServerSupabaseClient()
    const escapedQuery = query.replace(/[%_]/g, "\\$&")
    let dbQuery = supabase
      .from("places_database")
      .select("*")
      .order("search_count", { ascending: false })
      .order("rating", { ascending: false })
      .limit(20)

    if (destination) {
      dbQuery = dbQuery.eq("destination_context", destination)
    }
    dbQuery = dbQuery.ilike("name", `%${escapedQuery}%`)

    const { data, error } = await dbQuery
    if (error) {
      console.error("Error buscando en la base de datos:", error)
      return []
    }
    return data || []
  } catch (error) {
    console.error("Error en searchPlacesInDatabase:", error)
    return []
  }
}

async function savePlacesToDatabase(places: PlaceSearchResult[], destination?: string): Promise<void> {
  try {
    const supabase = createServerSupabaseClient()
    const placesToInsert = places.map((place) => ({
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address || place.vicinity,
      destination_context: destination,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      price_level: place.price_level,
      types: place.types,
      latitude: place.geometry?.location?.lat,
      longitude: place.geometry?.location?.lng,
      photos: place.photos ? JSON.stringify(place.photos) : null,
      maps_url: place.url, // <--- AÑADIDO: Guardar la URL de Google Maps
      business_status: place.business_status,
      // No guardamos permanently_closed directamente si business_status ya lo cubre
    }))

    const { error } = await supabase.from("places_database").upsert(placesToInsert, {
      onConflict: "place_id",
      ignoreDuplicates: false,
    })
    if (error) console.error("Error guardando lugares en la base de datos:", error)
  } catch (error) {
    console.error("Error en savePlacesToDatabase:", error)
  }
}

function convertDatabaseToSearchResults(dbPlaces: DatabasePlace[]): PlaceSearchResult[] {
  return dbPlaces.map((place) => ({
    place_id: place.place_id,
    name: place.name,
    formatted_address: place.formatted_address,
    types: place.types,
    rating: place.rating,
    user_ratings_total: place.user_ratings_total,
    price_level: place.price_level,
    vicinity: place.formatted_address,
    photos: place.photos ? JSON.parse(place.photos as string) : undefined,
    geometry:
      place.latitude && place.longitude ? { location: { lat: place.latitude, lng: place.longitude } } : undefined,
    url: place.maps_url, // <--- AÑADIDO: Convertir maps_url a url
    business_status: place.business_status,
    // No es necesario 'permanently_closed' aquí si 'business_status' es suficiente
  }))
}

async function incrementSearchCount(placeId: string): Promise<void> {
  try {
    const supabase = createServerSupabaseClient()
    const { data: currentPlace, error: selectError } = await supabase
      .from("places_database")
      .select("search_count")
      .eq("place_id", placeId)
      .single()
    if (selectError) {
      console.error("Error obteniendo contador actual:", selectError)
      return
    }
    const newCount = (currentPlace?.search_count || 0) + 1
    const { error: updateError } = await supabase
      .from("places_database")
      .update({ search_count: newCount, last_searched_at: new Date().toISOString() })
      .eq("place_id", placeId)
    if (updateError) console.error("Error incrementando contador de búsquedas:", updateError)
  } catch (error) {
    console.error("Error en incrementSearchCount:", error)
  }
}

// Actualizar para obtener 'maps_url' de la base de datos
export async function getPlaceDetailsWithDatabase(placeId: string, destination?: string): Promise<PlaceDetails | null> {
  const supabase = createServerSupabaseClient()
  // Primero, intentar obtener de la base de datos
  const { data: dbPlace, error: dbError } = await supabase
    .from("places_database")
    .select("*")
    .eq("place_id", placeId)
    .maybeSingle()

  if (dbError) {
    console.error(`Error fetching place ${placeId} from database:`, dbError)
  }

  if (dbPlace) {
    console.log(`🎯 ✅ USANDO BASE DE DATOS - Detalles encontrados para place_id: ${placeId}`)
    // Convertir el resultado de la BD a PlaceDetails
    // Asegurarse de que todos los campos necesarios para PlaceDetails estén aquí
    return {
      place_id: dbPlace.place_id,
      name: dbPlace.name,
      formatted_address: dbPlace.formatted_address || "",
      // Añadir otros campos según la definición de PlaceDetails y DatabasePlace
      rating: dbPlace.rating,
      user_ratings_total: dbPlace.user_ratings_total,
      price_level: dbPlace.price_level,
      url: dbPlace.maps_url, // Usar maps_url
      photos: dbPlace.photos ? JSON.parse(dbPlace.photos as string) : undefined,
      types: dbPlace.types,
      geometry:
        dbPlace.latitude && dbPlace.longitude
          ? { location: { lat: dbPlace.latitude, lng: dbPlace.longitude } }
          : undefined,
      website: dbPlace.website,
      formatted_phone_number: dbPlace.phone, // Asumiendo que 'phone' es formatted_phone_number
      business_status: dbPlace.business_status,
      // opening_hours y reviews necesitarían un manejo más complejo si se guardan como JSON
    }
  }

  // Si no está en la BD o falta información crucial, obtener de Google y guardar/actualizar
  console.log(`🌐 ❌ NO ENCONTRADO EN BD (o incompleto) - Llamando a Google Places API para detalles de: ${placeId}`)
  const googleDetails = await getPlaceDetailsGoogle(placeId) // Usar la función renombrada

  if (googleDetails) {
    // Guardar/Actualizar en la base de datos
    const placeToSave: Partial<DatabasePlace> = {
      place_id: googleDetails.place_id,
      name: googleDetails.name,
      formatted_address: googleDetails.formatted_address,
      rating: googleDetails.rating,
      user_ratings_total: googleDetails.user_ratings_total,
      price_level: googleDetails.price_level,
      types: googleDetails.types,
      latitude: googleDetails.geometry?.location?.lat,
      longitude: googleDetails.geometry?.location?.lng,
      maps_url: googleDetails.url, // Guardar la URL de Google
      website: googleDetails.website,
      phone: googleDetails.formatted_phone_number,
      opening_hours: googleDetails.opening_hours ? JSON.stringify(googleDetails.opening_hours) : null,
      photos: googleDetails.photos ? JSON.stringify(googleDetails.photos) : null,
      business_status: googleDetails.business_status,
      destination_context: destination, // Puede ser undefined si no se proporciona
      updated_at: new Date().toISOString(),
    }

    const { error: upsertError } = await supabase
      .from("places_database")
      .upsert(placeToSave, { onConflict: "place_id", ignoreDuplicates: false })

    if (upsertError) {
      console.error(`Error upserting place details ${placeId} to database:`, upsertError)
    } else {
      console.log(`💾 ✅ GUARDADO/ACTUALIZADO EN BD - Detalles para place_id: ${placeId}`)
    }
  }
  return googleDetails
}

export async function verifyPlaceWithDatabase(
  placeName: string,
  destinationName?: string,
  destinationCoords?: { lat: number; lng: number },
): Promise<PlaceVerificationResult> {
  // Esta función ya llama a google-places-service verifyPlace, que a su vez
  // llama a searchPlaces y getPlaceDetails, por lo que debería beneficiarse
  // de los cambios para obtener la 'url'.
  // No se necesitan cambios directos aquí si la lógica subyacente se actualizó.
  // Solo asegurarse que PlaceVerificationResult.placeDetails (si se usa)
  // refleje la 'url' obtenida.
  // La función verifyPlace en google-places-service ya fue actualizada para esto.
  console.log(`[DB Service] Verificando: ${placeName} en ${destinationName || "contexto global"}`)
  // Delegar a la función de verificación de google-places-service
  // que ya ha sido actualizada para obtener la URL.
  const verificationResult = await import("./google-places-service").then((module) =>
    module.verifyPlace(placeName, destinationName, destinationCoords),
  )

  // Si el lugar verificado existe y tenemos su placeId, podríamos querer
  // asegurar que esté en nuestra BD con la URL correcta.
  if (verificationResult.exists && verificationResult.placeId) {
    // Podríamos llamar a getPlaceDetailsWithDatabase para asegurar que la info (incluyendo maps_url)
    // esté actualizada en nuestra BD. Esto es opcional y depende de la estrategia de sincronización.
    // Por ahora, asumimos que el flujo de guardado principal (searchPlacesWithDatabase) se encarga.
    // Ejemplo: await getPlaceDetailsWithDatabase(verificationResult.placeId, destinationName);
  }

  return verificationResult
}
