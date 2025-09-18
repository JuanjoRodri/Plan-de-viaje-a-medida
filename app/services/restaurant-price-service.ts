import { GOOGLE_PLACES_API_KEY } from "../config"
import { estimateRestaurantPrice } from "./price-estimation-service"

// Interfaz para los detalles de precios de un restaurante
interface RestaurantPriceDetails {
  priceLevel?: number // Nivel de precio de Google (1-4)
  priceRange?: string // Rango de precios estimado (ej: "15€ - 30€")
  averagePrice?: number // Precio medio por persona (si está disponible)
  source: "google" | "estimation" // Fuente de la información
}

/**
 * Obtiene información detallada de precios para un restaurante
 * @param placeId ID del lugar en Google Places
 * @param placeName Nombre del restaurante
 * @param destination Destino (ciudad, país)
 * @param numPeople Número de personas
 * @returns Detalles de precios del restaurante
 */
export async function getRestaurantPriceDetails(
  placeId: string | undefined,
  placeName: string,
  destination: string,
  numPeople = 1,
): Promise<RestaurantPriceDetails> {
  // Si no tenemos placeId ni nombre, solo podemos hacer una estimación básica
  if (!placeId && !placeName) {
    return {
      priceRange: estimateRestaurantPrice(undefined, destination, numPeople),
      source: "estimation",
    }
  }

  try {
    // Intentamos obtener información detallada de Google Places
    if (placeId) {
      const details = await getGooglePlaceDetails(placeId)

      // Si tenemos nivel de precio de Google, lo usamos para la estimación
      if (details && details.price_level !== undefined) {
        return {
          priceLevel: details.price_level,
          priceRange: estimateRestaurantPrice(details.price_level, destination, numPeople),
          // Intentamos extraer el precio medio de las reseñas si está disponible
          averagePrice: extractAveragePriceFromReviews(details.reviews),
          source: "google",
        }
      }
    }

    // Si no tenemos placeId o no pudimos obtener el nivel de precio, hacemos una búsqueda en Google Places
    if (placeName) {
      try {
        const searchResults = await searchGooglePlaces(placeName, destination)
        if (searchResults && searchResults.length > 0) {
          const firstResult = searchResults[0]

          if (firstResult.price_level !== undefined) {
            return {
              priceLevel: firstResult.price_level,
              priceRange: estimateRestaurantPrice(firstResult.price_level, destination, numPeople),
              source: "google",
            }
          }
        }
      } catch (error) {
        console.warn("Error buscando en Google Places:", error)
      }
    }

    // Si todo lo demás falla, hacemos una estimación básica
    return {
      priceRange: estimateRestaurantPrice(undefined, destination, numPeople),
      source: "estimation",
    }
  } catch (error) {
    console.error("Error obteniendo detalles de precios del restaurante:", error)
    return {
      priceRange: estimateRestaurantPrice(undefined, destination, numPeople),
      source: "estimation",
    }
  }
}

/**
 * Busca lugares en Google Places
 * @param query Texto de búsqueda
 * @param location Ubicación (ciudad, país)
 * @returns Resultados de la búsqueda
 */
async function searchGooglePlaces(query: string, location: string): Promise<any[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.error("API key de Google Places no configurada")
    return []
  }

  try {
    // Primero intentamos geocodificar la ubicación para obtener coordenadas
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_PLACES_API_KEY}`
    const geocodeResponse = await fetch(geocodeUrl)
    const geocodeData = await geocodeResponse.json()

    if (geocodeData.status !== "OK" || !geocodeData.results || geocodeData.results.length === 0) {
      console.warn("No se pudo geocodificar la ubicación:", location)
      return []
    }

    const { lat, lng } = geocodeData.results[0].geometry.location

    // Ahora hacemos la búsqueda de lugares cercanos
    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=restaurant&keyword=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`

    const searchResponse = await fetch(searchUrl)
    const searchData = await searchResponse.json()

    if (searchData.status === "ZERO_RESULTS") {
      console.log("No se encontraron resultados en Google Places para:", query, "en", location)
      return []
    }

    if (searchData.status !== "OK" || !searchData.results) {
      console.warn("Error en la búsqueda de Google Places:", searchData.status)
      return []
    }

    return searchData.results
  } catch (error) {
    console.error("Error en la búsqueda de Google Places:", error)
    return []
  }
}

/**
 * Obtiene detalles de un lugar desde Google Places API
 * @param placeId ID del lugar en Google Places
 * @returns Detalles del lugar
 */
async function getGooglePlaceDetails(placeId: string): Promise<any> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.error("API key de Google Places no configurada")
    return null
  }

  try {
    // Construir la URL de la API
    const apiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,price_level,reviews,editorial_summary,formatted_address,rating,user_ratings_total,photos,website,formatted_phone_number&key=${GOOGLE_PLACES_API_KEY}`

    // Realizar la solicitud a la API
    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (data.status !== "OK") {
      console.error("Error en la API de Google Places:", data.status, data.error_message)
      return null
    }

    return data.result
  } catch (error) {
    console.error("Error obteniendo detalles del lugar:", error)
    return null
  }
}

/**
 * Extrae el precio medio de las reseñas de Google
 * @param reviews Reseñas de Google
 * @returns Precio medio por persona (si se encuentra)
 */
function extractAveragePriceFromReviews(reviews: any[] | undefined): number | undefined {
  if (!reviews || reviews.length === 0) {
    return undefined
  }

  // Patrones para buscar menciones de precios en las reseñas
  const pricePatterns = [
    /(\d+)[€$£]\s*(?:por persona|per person|pp|p\.p\.)/i,
    /(?:precio medio|average price|price)[:\s]*(\d+)[€$£]/i,
    /(?:gastamos|we spent|spent)[:\s]*(\d+)[€$£]/i,
    /(?:costó|it cost|costs)[:\s]*(\d+)[€$£]/i,
    /(\d+)[€$£]\s*(?:para comer|for lunch|for dinner)/i,
  ]

  // Buscar menciones de precios en las reseñas
  const prices: number[] = []

  for (const review of reviews) {
    if (!review.text) continue

    for (const pattern of pricePatterns) {
      const match = review.text.match(pattern)
      if (match && match[1]) {
        const price = Number.parseInt(match[1], 10)
        if (!isNaN(price) && price > 0 && price < 500) {
          // Filtrar precios absurdos
          prices.push(price)
        }
      }
    }
  }

  // Si encontramos al menos 2 precios, calculamos la media
  if (prices.length >= 2) {
    // Eliminar valores extremos (opcional)
    prices.sort((a, b) => a - b)
    const trimmedPrices = prices.length > 4 ? prices.slice(1, prices.length - 1) : prices // Eliminar el más alto y el más bajo si hay suficientes

    // Calcular la media
    const sum = trimmedPrices.reduce((acc, price) => acc + price, 0)
    return Math.round(sum / trimmedPrices.length)
  }

  return undefined
}

/**
 * Formatea el rango de precios para mostrar
 * @param priceDetails Detalles de precios
 * @returns Texto formateado con el rango de precios y la fuente
 */
export function formatPriceRange(priceDetails: RestaurantPriceDetails): string {
  let priceText = priceDetails.priceRange || "Precio no disponible"

  // Añadir información sobre la fuente
  if (priceDetails.source === "google" && priceDetails.averagePrice) {
    priceText += ` (precio medio: ${priceDetails.averagePrice}€ por persona)`
  }

  return priceText
}

/**
 * Genera un HTML con información de precios para mostrar en el itinerario
 * @param priceDetails Detalles de precios
 * @param numPeople Número de personas
 * @returns HTML con la información de precios
 */
export function generatePriceHTML(priceDetails: RestaurantPriceDetails, numPeople = 1): string {
  const priceText = formatPriceRange(priceDetails)

  let sourceIcon = ""
  let sourceClass = ""

  switch (priceDetails.source) {
    case "google":
      sourceIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"/><path d="m12 8 4 4-4 4"/><path d="m8 12h8"/></svg>`
      sourceClass = "google-source"
      break
    default:
      sourceIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`
      sourceClass = "estimation-source"
  }

  const sourceElement = `<span class="price-source" title="Fuente: ${priceDetails.source}">${sourceIcon}</span>`

  return `
  <div class="price-info ${sourceClass}">
    <span class="price-range">${priceText}</span>
    ${sourceElement}
  </div>
  `
}
