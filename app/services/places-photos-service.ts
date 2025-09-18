import { createClient } from "@supabase/supabase-js"
import type { PlacePhoto, PlacePhotosResponse } from "@/types/enhanced-database"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const CACHE_DURATION_DAYS = 30
const MAX_PHOTOS = 5

interface GooglePlacePhoto {
  photo_reference: string
  width: number
  height: number
}

interface GooglePlaceDetailsResponse {
  result?: {
    photos?: GooglePlacePhoto[]
  }
  status: string
}

/**
 * Verifica si las fotos en cache han expirado (más de 30 días)
 */
function isPhotoCacheExpired(createdAt: string): boolean {
  const cacheDate = new Date(createdAt)
  const now = new Date()
  const diffInDays = (now.getTime() - cacheDate.getTime()) / (1000 * 60 * 60 * 24)
  return diffInDays > CACHE_DURATION_DAYS
}

/**
 * Obtiene fotos de un lugar desde Google Places API
 */
async function fetchPhotosFromGoogle(googlePlaceId: string): Promise<GooglePlacePhoto[]> {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    throw new Error("Google Places API key not configured")
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${googlePlaceId}&fields=photos&key=${process.env.GOOGLE_PLACES_API_KEY}`

  try {
    const response = await fetch(url)
    const data: GooglePlaceDetailsResponse = await response.json()

    if (data.status !== "OK" || !data.result?.photos) {
      console.warn(`No photos found for place ${googlePlaceId}:`, data.status)
      return []
    }

    // Limitar a MAX_PHOTOS fotos
    return data.result.photos.slice(0, MAX_PHOTOS)
  } catch (error) {
    console.error("Error fetching photos from Google:", error)
    throw new Error("Failed to fetch photos from Google Places")
  }
}

/**
 * Convierte photo_reference a URL completa
 */
function getPhotoUrl(photoReference: string, maxWidth = 400): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${process.env.GOOGLE_PLACES_API_KEY}`
}

/**
 * Guarda fotos en la base de datos
 */
async function savePhotosToDatabase(
  placeId: string,
  googlePlaceId: string,
  googlePhotos: GooglePlacePhoto[],
): Promise<PlacePhoto[]> {
  const photosToInsert = googlePhotos.map((photo) => ({
    place_id: placeId,
    google_place_id: googlePlaceId,
    photo_reference: photo.photo_reference,
    photo_url: getPhotoUrl(photo.photo_reference),
    width: photo.width,
    height: photo.height,
  }))

  const { data, error } = await supabase.from("place_photos").insert(photosToInsert).select()

  if (error) {
    console.error("Error saving photos to database:", error)
    throw new Error("Failed to save photos to database")
  }

  return data || []
}

/**
 * Elimina fotos expiradas de la base de datos
 */
async function deleteExpiredPhotos(placeId: string): Promise<void> {
  const { error } = await supabase.from("place_photos").delete().eq("place_id", placeId)

  if (error) {
    console.error("Error deleting expired photos:", error)
    // No lanzamos error aquí, solo logueamos
  }
}

/**
 * Obtiene fotos desde cache o las busca en Google Places
 */
export async function getPlacePhotos(placeId: string, googlePlaceId?: string): Promise<PlacePhotosResponse> {
  try {
    // 1. Intentar obtener fotos desde cache
    const { data: cachedPhotos, error: cacheError } = await supabase
      .from("place_photos")
      .select("*")
      .eq("place_id", placeId)
      .order("created_at", { ascending: false })

    if (cacheError) {
      console.error("Error fetching cached photos:", cacheError)
    }

    // 2. Verificar si tenemos fotos en cache y si no han expirado
    if (cachedPhotos && cachedPhotos.length > 0) {
      const oldestPhoto = cachedPhotos[cachedPhotos.length - 1]

      if (!isPhotoCacheExpired(oldestPhoto.created_at)) {
        // Cache válido, devolver fotos cacheadas
        return {
          success: true,
          photos: cachedPhotos,
          cached: true,
        }
      } else {
        // Cache expirado, eliminar fotos antiguas
        console.log(`Cache expired for place ${placeId}, refreshing photos`)
        await deleteExpiredPhotos(placeId)
      }
    }

    // 3. No hay cache válido, buscar en Google Places
    if (!googlePlaceId) {
      return {
        success: false,
        photos: [],
        cached: false,
        error: "No Google Place ID provided",
      }
    }

    const googlePhotos = await fetchPhotosFromGoogle(googlePlaceId)

    if (googlePhotos.length === 0) {
      return {
        success: true,
        photos: [],
        cached: false,
      }
    }

    // 4. Guardar nuevas fotos en cache
    const savedPhotos = await savePhotosToDatabase(placeId, googlePlaceId, googlePhotos)

    return {
      success: true,
      photos: savedPhotos,
      cached: false,
    }
  } catch (error) {
    console.error("Error in getPlacePhotos:", error)
    return {
      success: false,
      photos: [],
      cached: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Limpia fotos expiradas de toda la base de datos (para uso en cron jobs)
 */
export async function cleanupExpiredPhotos(): Promise<{ deleted: number }> {
  const expirationDate = new Date()
  expirationDate.setDate(expirationDate.getDate() - CACHE_DURATION_DAYS)

  const { data, error } = await supabase
    .from("place_photos")
    .delete()
    .lt("created_at", expirationDate.toISOString())
    .select("id")

  if (error) {
    console.error("Error cleaning up expired photos:", error)
    throw new Error("Failed to cleanup expired photos")
  }

  return { deleted: data?.length || 0 }
}
