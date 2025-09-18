import { createClient } from "@supabase/supabase-js"

// Cliente de Supabase
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export interface PlaceVerificationData {
  id: string
  place_name: string
  destination: string
  place_id?: string
  official_url?: string
  formatted_address?: string
  coordinates?: { lat: number; lng: number }
  rating?: number
  price_level?: number
  business_status?: string
  place_types?: string[]
  verified_at: string
}

export interface ItineraryPlaceData {
  id: string
  itinerary_id?: string
  place_verification_id: string
  html_position?: number
  context_text?: string
}

/**
 * Busca una verificación existente de un lugar
 */
export async function findExistingPlaceVerification(
  placeName: string,
  destination: string,
): Promise<PlaceVerificationData | null> {
  try {
    const { data, error } = await supabase
      .from("place_verifications")
      .select("*")
      .eq("place_name", placeName)
      .eq("destination", destination)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No se encontró el registro
        return null
      }
      console.error("Error buscando verificación existente:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error en findExistingPlaceVerification:", error)
    return null
  }
}

/**
 * Guarda una nueva verificación de lugar
 */
export async function savePlaceVerification(
  placeName: string,
  destination: string,
  verificationResult: any, // Resultado de Google Places API
): Promise<PlaceVerificationData | null> {
  try {
    // Preparar datos para insertar - EXPANDIDO con más campos
    const placeData = {
      place_name: placeName,
      destination: destination,
      place_id: verificationResult.placeId || null,
      official_url: verificationResult.placeDetails?.url || null,
      formatted_address: verificationResult.address || null,
      coordinates: verificationResult.location || null,
      rating: verificationResult.placeDetails?.rating || null,
      price_level: verificationResult.placeDetails?.price_level || null,
      business_status: verificationResult.placeDetails?.business_status || null,
      place_types: verificationResult.placeDetails?.types || null,
      // NUEVOS CAMPOS AÑADIDOS
      phone_number:
        verificationResult.placeDetails?.formatted_phone_number ||
        verificationResult.placeDetails?.international_phone_number ||
        null,
      website: verificationResult.placeDetails?.website || null,
      user_ratings_total: verificationResult.placeDetails?.user_ratings_total || null,
      opening_hours: verificationResult.placeDetails?.opening_hours?.weekday_text
        ? verificationResult.placeDetails.opening_hours.weekday_text.join("; ")
        : null,
      open_now: verificationResult.placeDetails?.opening_hours?.open_now || null,
    }

    console.log(`💾 Guardando verificación de lugar: ${placeName} en ${destination}`)

    const { data, error } = await supabase.from("place_verifications").insert(placeData).select().single()

    if (error) {
      console.error("Error guardando verificación de lugar:", error)
      return null
    }

    console.log(`✅ Verificación guardada con ID: ${data.id}`)
    return data
  } catch (error) {
    console.error("Error en savePlaceVerification:", error)
    return null
  }
}

/**
 * Actualiza una verificación existente de lugar
 */
export async function updatePlaceVerification(
  verificationId: string,
  verificationResult: any, // Resultado actualizado de Google Places API
): Promise<PlaceVerificationData | null> {
  try {
    // Preparar datos actualizados - EXPANDIDO con más campos
    const updatedData = {
      place_id: verificationResult.placeId || null,
      official_url: verificationResult.placeDetails?.url || null,
      formatted_address: verificationResult.address || null,
      coordinates: verificationResult.location || null,
      rating: verificationResult.placeDetails?.rating || null,
      price_level: verificationResult.placeDetails?.price_level || null,
      business_status: verificationResult.placeDetails?.business_status || null,
      place_types: verificationResult.placeDetails?.types || null,
      // NUEVOS CAMPOS AÑADIDOS
      phone_number:
        verificationResult.placeDetails?.formatted_phone_number ||
        verificationResult.placeDetails?.international_phone_number ||
        null,
      website: verificationResult.placeDetails?.website || null,
      user_ratings_total: verificationResult.placeDetails?.user_ratings_total || null,
      opening_hours: verificationResult.placeDetails?.opening_hours?.weekday_text
        ? verificationResult.placeDetails.opening_hours.weekday_text.join("; ")
        : null,
      open_now: verificationResult.placeDetails?.opening_hours?.open_now || null,
      verified_at: new Date().toISOString(), // Actualizar timestamp
    }

    console.log(`🔄 Actualizando verificación de lugar con ID: ${verificationId}`)

    const { data, error } = await supabase
      .from("place_verifications")
      .update(updatedData)
      .eq("id", verificationId)
      .select()
      .single()

    if (error) {
      console.error("Error actualizando verificación de lugar:", error)
      return null
    }

    console.log(`✅ Verificación actualizada con ID: ${data.id}`)
    return data
  } catch (error) {
    console.error("Error en updatePlaceVerification:", error)
    return null
  }
}

/**
 * Obtiene o crea una verificación de lugar (actualiza si tiene más de 3 meses)
 */
export async function getOrCreatePlaceVerification(
  placeName: string,
  destination: string,
  verificationResult?: any,
): Promise<PlaceVerificationData | null> {
  try {
    // Primero buscar si ya existe
    const existingVerification = await findExistingPlaceVerification(placeName, destination)

    if (existingVerification) {
      // Verificar si los datos tienen más de 3 meses
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      const verifiedAt = new Date(existingVerification.verified_at)

      if (verifiedAt < threeMonthsAgo) {
        console.log(
          `🔄 Datos antiguos (${Math.floor((Date.now() - verifiedAt.getTime()) / (1000 * 60 * 60 * 24))} días) - Actualizando: ${placeName}`,
        )

        // Si tenemos datos de verificación nuevos, actualizar
        if (verificationResult) {
          return await updatePlaceVerification(existingVerification.id, verificationResult)
        } else {
          // Si no tenemos datos nuevos, devolver los existentes pero marcar para actualización futura
          console.log(`⚠️ Datos antiguos pero sin nuevos datos de verificación para: ${placeName}`)
          return existingVerification
        }
      } else {
        console.log(
          `♻️ Reutilizando verificación reciente (${Math.floor((Date.now() - verifiedAt.getTime()) / (1000 * 60 * 60 * 24))} días) para: ${placeName}`,
        )
        return existingVerification
      }
    }

    // Si no existe y tenemos datos de verificación, crear nueva
    if (verificationResult) {
      return await savePlaceVerification(placeName, destination, verificationResult)
    }

    return null
  } catch (error) {
    console.error("Error en getOrCreatePlaceVerification:", error)
    return null
  }
}

/**
 * Asocia lugares verificados con un itinerario
 */
export async function linkPlacesToItinerary(itineraryId: string, placeVerificationIds: string[]): Promise<boolean> {
  try {
    const itineraryPlaces = placeVerificationIds.map((placeId, index) => ({
      itinerary_id: itineraryId,
      place_verification_id: placeId,
      html_position: index,
    }))

    const { error } = await supabase.from("itinerary_places").insert(itineraryPlaces)

    if (error) {
      console.error("Error asociando lugares con itinerario:", error)
      return false
    }

    console.log(`✅ ${placeVerificationIds.length} lugares asociados al itinerario ${itineraryId}`)
    return true
  } catch (error) {
    console.error("Error en linkPlacesToItinerary:", error)
    return false
  }
}

/**
 * Obtiene todas las verificaciones de lugares para un itinerario
 */
export async function getPlaceVerificationsForItinerary(itineraryId: string): Promise<PlaceVerificationData[]> {
  try {
    const { data, error } = await supabase
      .from("itinerary_places")
      .select(
        `
        place_verification_id,
        html_position,
        place_verifications (*)
      `,
      )
      .eq("itinerary_id", itineraryId)
      .order("html_position")

    if (error) {
      console.error("Error obteniendo verificaciones para itinerario:", error)
      return []
    }

    return data.map((item: any) => item.place_verifications).filter(Boolean)
  } catch (error) {
    console.error("Error en getPlaceVerificationsForItinerary:", error)
    return []
  }
}

/**
 * Obtiene verificaciones por IDs
 */
export async function getPlaceVerificationsByIds(ids: string[]): Promise<PlaceVerificationData[]> {
  try {
    if (ids.length === 0) return []

    const { data, error } = await supabase.from("place_verifications").select("*").in("id", ids)

    if (error) {
      console.error("Error obteniendo verificaciones por IDs:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error en getPlaceVerificationsByIds:", error)
    return []
  }
}

/**
 * Limpia verificaciones antiguas (función de mantenimiento)
 */
export async function cleanupOldVerifications(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc("cleanup_old_place_verifications")

    if (error) {
      console.error("Error limpiando verificaciones antiguas:", error)
      return 0
    }

    return data || 0
  } catch (error) {
    console.error("Error en cleanupOldVerifications:", error)
    return 0
  }
}
