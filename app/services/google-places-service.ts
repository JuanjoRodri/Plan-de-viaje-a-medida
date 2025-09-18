// Servicio para interactuar con Google Places API
// Este servicio proporciona funciones para buscar lugares, obtener detalles y verificar lugares

/**
 * Servicio para interactuar con la API de Google Places
 */

import { GOOGLE_MAPS_SERVER_API_KEY, LOCATION_VERIFICATION, checkApiKeys } from "../config"

// Interfaces para los tipos de datos
export interface PlaceSearchResult {
  place_id: string
  name: string
  formatted_address?: string
  types?: string[]
  rating?: number
  user_ratings_total?: number
  price_level?: number
  vicinity?: string
  photos?: {
    photo_reference: string
    height: number
    width: number
  }[]
  geometry?: {
    location: {
      lat: number
      lng: number
    }
  }
  url?: string // <--- AÑADIDO: URL de Google Maps con posible CID
  business_status?: string // Añadido para filtrar lugares cerrados
  permanently_closed?: boolean // Añadido para filtrar lugares cerrados
}

export interface PlaceDetails {
  place_id: string
  name: string
  formatted_address: string
  formatted_phone_number?: string
  international_phone_number?: string
  website?: string
  rating?: number
  user_ratings_total?: number
  price_level?: number
  url?: string // URL de Google Maps
  photos?: {
    photo_reference: string
    height: number
    width: number
  }[]
  opening_hours?: {
    weekday_text: string[]
    open_now?: boolean
  }
  reviews?: {
    author_name: string
    rating: number
    text: string
    time: number
    profile_photo_url?: string
  }[]
  types?: string[]
  geometry?: {
    location: {
      lat: number
      lng: number
    }
  }
  permanently_closed?: boolean
  business_status?: string
}

export interface PlaceVerificationResult {
  exists: boolean
  similarity: number
  originalName: string
  correctedName?: string
  placeId?: string
  address?: string
  placeDetails?: PlaceDetails // Cambiado a PlaceDetails para tipado más estricto
  location?: {
    lat: number
    lng: number
  }
  distanceFromDestination?: number // Distancia en km desde el destino principal
  normalizedOriginalName?: string
  normalizedCorrectedName?: string
  suggestions?: string[]
}

export interface GeocodingResult {
  lat: number
  lng: number
  formattedAddress: string
  locality?: string
  administrativeArea?: string
  country?: string
}

// Lista de palabras clave comunes a ignorar/normalizar en nombres de lugares
const COMMON_PLACE_KEYWORDS = [
  "restaurante",
  "restaurant",
  "bar",
  "café",
  "cafeteria",
  "hotel",
  "hostal",
  "albergue",
  "museo",
  "museum",
  "teatro",
  "theatre",
  "cine",
  "cinema",
  "tienda",
  "shop",
  "store",
  "parque",
  "park",
  "plaza",
  "square",
  "calle",
  "street",
  "avenida",
  "avenue",
  "bulevar",
  "boulevard",
  "mercado",
  "market",
  "iglesia",
  "church",
  "catedral",
  "cathedral",
  "palacio",
  "palace",
  "castillo",
  "castle",
  "puente",
  "bridge",
  "estación",
  "station",
  "aeropuerto",
  "airport",
  "puerto",
  "port",
  "playa",
  "beach",
  "centro comercial",
  "shopping center",
  "shopping mall",
  "galería",
  "gallery",
  "biblioteca",
  "library",
]

function normalizePlaceName(name: string): string {
  if (!name) return ""
  let normalized = name.toLowerCase()
  for (const keyword of COMMON_PLACE_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi")
    normalized = normalized.replace(regex, "")
  }
  normalized = normalized.replace(/\s+/g, " ").trim()
  return normalized
}

export async function isApiKeyValid(): Promise<boolean> {
  console.log("🔍 Verificando API key...")
  console.log("🔑 GOOGLE_MAPS_SERVER_API_KEY disponible:", !!GOOGLE_MAPS_SERVER_API_KEY)
  console.log("🔑 Longitud de la clave:", GOOGLE_MAPS_SERVER_API_KEY?.length || 0)

  if (!GOOGLE_MAPS_SERVER_API_KEY) {
    console.error("❌ API key de Google Places no configurada")
    checkApiKeys() // Mostrar estado de todas las claves
    return false
  }

  // Si es la misma que la variable de entorno, asumimos que es válida
  if (
    process.env.GOOGLE_MAPS_SERVER_API_KEY === GOOGLE_MAPS_SERVER_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === GOOGLE_MAPS_SERVER_API_KEY
  ) {
    console.log("✅ API key configurada correctamente")
    return true
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=test&key=${GOOGLE_MAPS_SERVER_API_KEY}`,
      { headers: { Accept: "application/json" } },
    )
    if (!response.ok) {
      console.error(`❌ Error HTTP al verificar API key: ${response.status} ${response.statusText}`)
      return false
    }
    const data = await response.json()
    const isValid = data.status === "OK" || data.status === "ZERO_RESULTS"
    console.log(`${isValid ? "✅" : "❌"} Verificación de API key:`, data.status)
    return isValid
  } catch (error) {
    console.error("❌ Error verificando API key:", error)
    return false
  }
}

export async function geocodePlace(placeName: string): Promise<GeocodingResult | null> {
  if (!GOOGLE_MAPS_SERVER_API_KEY) {
    console.error("API key de Google Places no configurada")
    return null
  }
  try {
    const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      placeName,
    )}&key=${GOOGLE_MAPS_SERVER_API_KEY}`
    const response = await fetch(apiUrl, { headers: { Accept: "application/json" } })
    if (!response.ok) throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
    const data = await response.json()
    if (data.status === "ZERO_RESULTS") {
      console.log(`No se encontraron resultados de geocodificación para: ${placeName}`)
      return null
    }
    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      console.error("Error en la geocodificación:", data.status, data.error_message)
      return null
    }
    const result = data.results[0]
    const location = result.geometry.location
    const formattedAddress = result.formatted_address
    let locality = "",
      administrativeArea = "",
      country = ""
    for (const component of result.address_components) {
      if (component.types.includes("locality")) locality = component.long_name
      else if (component.types.includes("administrative_area_level_1")) administrativeArea = component.long_name
      else if (component.types.includes("country")) country = component.long_name
    }
    return { lat: location.lat, lng: location.lng, formattedAddress, locality, administrativeArea, country }
  } catch (error) {
    console.error("Error geocodificando lugar:", error)
    return null
  }
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10
}

export async function searchPlaces(
  query: string,
  location?: string,
  type?: string,
  locationBias?: { lat: number; lng: number; radius?: number },
  maxResults?: number, // NUEVO PARÁMETRO
): Promise<PlaceSearchResult[]> {
  console.log(
    `🌐 [Google Places] Buscando: "${query}"${type ? ` (Tipo: ${type})` : ""}${locationBias ? ` Cerca de: ${locationBias.lat.toFixed(5)},${locationBias.lng.toFixed(5)} (Radio: ${locationBias.radius || LOCATION_VERIFICATION.DEFAULT_SEARCH_RADIUS}m)` : ""}${maxResults ? ` (Límite: ${maxResults})` : ""}`,
  )

  console.log("🔑 Verificando API key antes de la búsqueda...")
  console.log("🔑 GOOGLE_MAPS_SERVER_API_KEY disponible:", !!GOOGLE_MAPS_SERVER_API_KEY)

  if (!GOOGLE_MAPS_SERVER_API_KEY) {
    console.error("❌ API key de Google Places no configurada")
    console.log("🔍 Estado de variables de entorno:")
    console.log("  - GOOGLE_MAPS_SERVER_API_KEY:", !!process.env.GOOGLE_MAPS_SERVER_API_KEY)
    console.log("  - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:", !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
    checkApiKeys()
    return []
  }

  try {
    let apiUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      query,
    )}&key=${GOOGLE_MAPS_SERVER_API_KEY}`

    if (type) apiUrl += `&type=${encodeURIComponent(type)}`
    if (locationBias) {
      const radius = locationBias.radius || LOCATION_VERIFICATION.DEFAULT_SEARCH_RADIUS
      apiUrl += `&location=${locationBias.lat},${locationBias.lng}&radius=${radius}`
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    let apiResponse
    try {
      apiResponse = await fetch(apiUrl, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      })
      clearTimeout(timeoutId)
      if (!apiResponse.ok) throw new Error(`Error HTTP: ${apiResponse.status} ${apiResponse.statusText}`)
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === "AbortError") {
        console.error(`  -> [Google Places] Timeout para: "${query}"`)
        throw new Error("La solicitud a la API de Google Places ha excedido el tiempo de espera")
      }
      throw error
    }

    const data = await apiResponse.json()

    if (data.status === "ZERO_RESULTS") {
      console.log(`  -> [Google Places] Cero resultados para: "${query}"`)
      return []
    }
    if (data.status !== "OK") {
      console.error(`  -> [Google Places] Error API: ${data.status} - ${data.error_message || "Sin mensaje"}`)
      if (data.status === "REQUEST_DENIED" && data.error_message?.includes("API key")) {
        console.error("  -> [Google Places] La API key es inválida o tiene restricciones.")
      }
      return []
    }

    let results: PlaceSearchResult[] = data.results || []
    console.log(`  -> [Google Places] Encontrados ${results.length} resultados iniciales para: "${query}"`)

    results = results.filter((place) => {
      if (place.permanently_closed === true || place.business_status === "CLOSED_PERMANENTLY") {
        console.log(`    -> [Google Places] Filtrado (cerrado permanentemente): ${place.name}`)
        return false
      }
      return true
    })
    console.log(`  -> [Google Places] ${results.length} resultados después de filtrar cerrados para: "${query}"`)

    // Aplicar límite antes del enriquecimiento si se especifica
    if (maxResults && maxResults > 0) {
      results = results.slice(0, maxResults)
      console.log(
        `  -> [Google Places] ✂️ Limitando a ${maxResults} resultados ANTES del enriquecimiento para: "${query}"`,
      )
    }

    const enrichedResults: PlaceSearchResult[] = []
    for (const place of results) {
      if (place.place_id) {
        try {
          const details = await getPlaceDetails(place.place_id)
          if (details && details.url) {
            enrichedResults.push({ ...place, url: details.url })
          } else {
            enrichedResults.push(place) // Añadir sin url si no se pudo obtener
          }
        } catch (detailError) {
          console.warn(
            `  -> [Google Places] Error obteniendo detalles para ${place.place_id} durante enriquecimiento:`,
            detailError,
          )
          enrichedResults.push(place) // Añadir sin url en caso de error
        }
      } else {
        enrichedResults.push(place) // Añadir si no hay place_id
      }
    }

    console.log(`  -> [Google Places] ${enrichedResults.length} resultados enriquecidos para: "${query}"`)
    return enrichedResults
  } catch (error) {
    console.error(`  -> [Google Places] Error buscando lugares para "${query}":`, error)
    throw error
  }
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  console.log(`🌐 [Google Places] Obteniendo detalles para place_id: ${placeId}`)
  if (!GOOGLE_MAPS_SERVER_API_KEY) {
    console.error("API key de Google Places no configurada")
    return null
  }
  try {
    const fields = [
      "place_id",
      "name",
      "formatted_address",
      "formatted_phone_number",
      "international_phone_number",
      "website",
      "rating",
      "user_ratings_total",
      "price_level",
      "url",
      "photos",
      "opening_hours",
      "reviews",
      "types",
      "geometry",
      "permanently_closed",
      "business_status",
    ].join(",")

    const apiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_MAPS_SERVER_API_KEY}`
    const response = await fetch(apiUrl, { headers: { Accept: "application/json" } })
    if (!response.ok) throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
    const data = await response.json()
    if (data.status !== "OK") {
      console.error("Error en la API de Google Places:", data.status, data.error_message)
      return null
    }
    console.log(`  -> [Google Places] Detalles obtenidos para: ${data.result.name}`)
    return data.result
  } catch (error) {
    console.error(`  -> [Google Places] Error obteniendo detalles para place_id ${placeId}:`, error)
    return null
  }
}

export async function verifyPlace(
  placeName: string,
  destinationName?: string,
  destinationCoords?: { lat: number; lng: number },
): Promise<PlaceVerificationResult> {
  console.log(
    `🕵️ [Verificación Google] Iniciando para: "${placeName}"${destinationName ? ` en "${destinationName}"` : ""}`,
  )
  if (!GOOGLE_MAPS_SERVER_API_KEY) {
    console.error("  -> API key de Google Places no configurada")
    return { exists: false, similarity: 0, originalName: placeName }
  }

  const isKeyValid = await isApiKeyValid()
  if (!isKeyValid) {
    console.error("  -> La API key de Google Places no es válida.")
    return { exists: false, similarity: 0, originalName: placeName }
  }

  try {
    let locationBias: { lat: number; lng: number; radius?: number } | undefined = undefined
    if (destinationCoords) {
      locationBias = { ...destinationCoords, radius: LOCATION_VERIFICATION.DEFAULT_SEARCH_RADIUS }
    } else if (destinationName) {
      const geocodeResult = await geocodePlace(destinationName)
      if (geocodeResult) {
        locationBias = {
          lat: geocodeResult.lat,
          lng: geocodeResult.lng,
          radius: LOCATION_VERIFICATION.DEFAULT_SEARCH_RADIUS,
        }
      }
    }

    let searchQuery = placeName
    if (destinationName && !placeName.toLowerCase().includes(destinationName.toLowerCase())) {
      searchQuery = `${placeName} ${destinationName}`
    }
    console.log(`  -> searchQuery construida para Google: "${searchQuery}"`)

    const searchResults = await searchPlaces(searchQuery, undefined, undefined, locationBias)

    if (!searchResults || searchResults.length === 0) {
      console.log(`  -> No se encontraron resultados en Google Places para: "${searchQuery}"`)
      return { exists: false, similarity: 0, originalName: placeName }
    }

    const firstResult = searchResults[0]
    console.log(`  -> Primer resultado de Google: "${firstResult.name}" (ID: ${firstResult.place_id})`)

    let placeDetailsFull: PlaceDetails | null = null
    if (firstResult.place_id) {
      placeDetailsFull = await getPlaceDetails(firstResult.place_id)
    }

    const placeToCompare = placeDetailsFull || firstResult

    const normalizedOriginalPlaceName = normalizePlaceName(placeName)
    const normalizedGoogleResultName = normalizePlaceName(placeToCompare.name)
    console.log(`  -> Nombre original normalizado: "${normalizedOriginalPlaceName}"`)
    console.log(`  -> Nombre de Google normalizado: "${normalizedGoogleResultName}"`)

    const similarity = calculateStringSimilarity(normalizedOriginalPlaceName, normalizedGoogleResultName)
    console.log(`  -> Similitud calculada (sobre normalizados): ${similarity.toFixed(3)}`)

    let distanceFromDestination: number | undefined = undefined
    if (locationBias && placeToCompare.geometry && placeToCompare.geometry.location) {
      distanceFromDestination = calculateDistance(
        locationBias.lat,
        locationBias.lng,
        placeToCompare.geometry.location.lat,
        placeToCompare.geometry.location.lng,
      )
      console.log(`  -> Distancia desde el destino calculada: ${distanceFromDestination} km`)
    }

    const placeExists =
      similarity >= LOCATION_VERIFICATION.SIMILARITY_THRESHOLD ||
      (distanceFromDestination !== undefined && distanceFromDestination <= LOCATION_VERIFICATION.MAX_DISTANCE_KM)
    console.log(
      `  -> ¿Lugar existe basado en umbral (${LOCATION_VERIFICATION.SIMILARITY_THRESHOLD}) o distancia?: ${placeExists}`,
    )

    let suggestions: string[] = []
    if (similarity < 0.5 && searchResults.length > 1) {
      suggestions = searchResults.slice(1, 4).map((result) => result.name)
    }

    const result: PlaceVerificationResult = {
      exists: placeExists,
      similarity,
      originalName: placeName,
      correctedName: placeToCompare.name,
      placeId: placeToCompare.place_id,
      address: placeToCompare.formatted_address || (placeToCompare as PlaceSearchResult).vicinity,
      placeDetails: placeDetailsFull ? placeDetailsFull : undefined,
      location: placeToCompare.geometry?.location,
      distanceFromDestination,
      normalizedOriginalName: normalizedOriginalPlaceName,
      normalizedCorrectedName: normalizedGoogleResultName,
      suggestions,
    }
    console.log(
      `  -> Resultado de verificación para "${placeName}": Existe=${result.exists}, ID=${result.placeId || "N/A"}, SimilitudFinal=${similarity.toFixed(3)}`,
    )
    return result
  } catch (error) {
    console.error(`  -> Error crítico verificando lugar "${placeName}":`, error)
    return { exists: false, similarity: 0, originalName: placeName }
  }
}

export async function getPhotoUrl(photoReference: string, maxWidth = 400): Promise<string | null> {
  if (!GOOGLE_MAPS_SERVER_API_KEY) {
    console.error("API key de Google Places no configurada")
    return null
  }
  try {
    const apiUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_MAPS_SERVER_API_KEY}`
    const response = await fetch(apiUrl, { redirect: "manual" })
    const photoUrl = response.headers.get("Location")
    if (!photoUrl) {
      console.error("No se pudo obtener la URL de la foto")
      return null
    }
    return photoUrl
  } catch (error) {
    console.error("Error al obtener URL de foto:", error)
    return null
  }
}

function calculateStringSimilarity(a: string, b: string): number {
  if (!a && !b) return 1
  if (!a || !b) return 0
  if (a.length === 0 && b.length > 0) return 0
  if (b.length === 0 && a.length > 0) return 0
  if (a.length === 0 && b.length === 0) return 1

  if (a.includes(b) || b.includes(a)) {
    const shorterLength = Math.min(a.length, b.length)
    const longerLength = Math.max(a.length, b.length)
    if (longerLength - shorterLength <= Math.floor(longerLength * 0.2)) {
      return 0.85 + 0.1 * (shorterLength / longerLength)
    }
    return 0.7 + 0.1 * (shorterLength / longerLength)
  }

  const aWords = a.split(" ").filter((word) => word.length > 1)
  const bWords = b.split(" ").filter((word) => word.length > 1)
  if (aWords.length > 0 && bWords.length > 0) {
    const sharedWords = aWords.filter((wordA) => bWords.some((wordB) => wordB.includes(wordA) || wordA.includes(wordB)))
    if (sharedWords.length > 0) {
      const minWords = Math.min(aWords.length, bWords.length)
      const maxWords = Math.max(aWords.length, bWords.length)
      const similarityBySharedWords = (sharedWords.length / minWords) * (minWords / maxWords) * 0.5 + 0.3
      if (similarityBySharedWords > 0.6) return similarityBySharedWords
    }
  }

  const matrix = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
      }
    }
  }
  const distance = matrix[b.length][a.length]
  const maxLength = Math.max(a.length, b.length)
  if (maxLength === 0) return 1
  return 1 - distance / maxLength
}

/**
 * Busca lugares alternativos cuando uno está cerrado permanentemente
 */
export async function findAlternativePlace(
  closedPlaceName: string,
  placeType: string,
  destination: string,
  coordinates?: { lat: number; lng: number },
  radius = 2000,
): Promise<PlaceSearchResult | null> {
  console.log(`🔄 [Alternativa] Buscando reemplazo para "${closedPlaceName}" (tipo: ${placeType})`)

  if (!GOOGLE_MAPS_SERVER_API_KEY) {
    console.error("❌ API key no disponible para búsqueda de alternativas")
    return null
  }

  try {
    // Construir query de búsqueda basada en el tipo
    let searchQuery = ""
    const typeMapping: Record<string, string> = {
      restaurant: "restaurante",
      food: "restaurante",
      cafe: "cafetería",
      bar: "bar",
      tourist_attraction: "atracción turística",
      museum: "museo",
      park: "parque",
      shopping_mall: "centro comercial",
      store: "tienda",
      lodging: "hotel",
    }

    searchQuery = typeMapping[placeType] || placeType
    searchQuery += ` ${destination}`

    // Buscar alternativas
    const alternatives = await searchPlaces(
      searchQuery,
      undefined,
      placeType,
      coordinates ? { ...coordinates, radius } : undefined,
      5, // Máximo 5 alternativas
    )

    if (alternatives.length === 0) {
      console.log(`  ❌ No se encontraron alternativas para "${closedPlaceName}"`)
      return null
    }

    // Filtrar el lugar original si aparece en los resultados
    const filteredAlternatives = alternatives.filter(
      (alt) =>
        !alt.name.toLowerCase().includes(closedPlaceName.toLowerCase()) &&
        !closedPlaceName.toLowerCase().includes(alt.name.toLowerCase()),
    )

    if (filteredAlternatives.length === 0) {
      console.log(`  ❌ Todas las alternativas eran el lugar original para "${closedPlaceName}"`)
      return null
    }

    const bestAlternative = filteredAlternatives[0]
    console.log(`  ✅ Alternativa encontrada: "${bestAlternative.name}" para "${closedPlaceName}"`)

    return bestAlternative
  } catch (error) {
    console.error(`❌ Error buscando alternativa para "${closedPlaceName}":`, error)
    return null
  }
}

/**
 * Verifica si un lugar está cerrado permanentemente
 */
export function isPlacePermanentlyClosed(place: PlaceDetails | PlaceSearchResult): boolean {
  return place.permanently_closed === true || place.business_status === "CLOSED_PERMANENTLY"
}

function levenshteinDistance(a: string, b: string): number {
  const matrix = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
      }
    }
  }
  return matrix[b.length][a.length]
}
