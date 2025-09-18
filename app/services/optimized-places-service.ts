"use server"

import { GOOGLE_PLACES_API_KEY } from "../config"
import { calculateDistance } from "./google-places-service"

// Interfaces para los tipos de datos
export interface OptimizedPlace {
  place_id: string
  name: string
  formatted_address?: string
  rating?: number
  user_ratings_total?: number
  price_level?: number
  types?: string[]
  vicinity?: string
  location?: {
    lat: number
    lng: number
  }
  distance?: number
  photos?: {
    photo_reference: string
    height: number
    width: number
  }[]
  opening_hours?: {
    open_now?: boolean
  }
}

export interface OptimizedPlacesResult {
  restaurants: OptimizedPlace[]
  attractions: OptimizedPlace[]
  hotels: OptimizedPlace[]
  shopping: OptimizedPlace[]
  cafes: OptimizedPlace[]
  nightlife: OptimizedPlace[]
}

/**
 * Busca lugares optimizados en un destino según el nivel de presupuesto
 */
export async function findOptimizedPlaces(
  destination: string,
  budget: "bajo" | "medio" | "alto" | "personalizado",
  customBudget?: string,
  coordinates?: { lat: number; lng: number },
  radius = 5000, // Radio de búsqueda en metros (5km por defecto)
): Promise<OptimizedPlacesResult> {
  // Determinar nivel de precio según presupuesto
  let minPriceLevel = 0
  let maxPriceLevel = 4
  let optimalPriceLevel = 2 // Nivel óptimo para este presupuesto

  switch (budget) {
    case "bajo":
      minPriceLevel = 0
      maxPriceLevel = 1
      optimalPriceLevel = 1
      break
    case "medio":
      minPriceLevel = 1
      maxPriceLevel = 2
      optimalPriceLevel = 2
      break
    case "alto":
      minPriceLevel = 2
      maxPriceLevel = 4
      optimalPriceLevel = 3
      break
    case "personalizado":
      // Analizar el presupuesto personalizado para determinar el nivel
      if (customBudget) {
        const budgetValue = Number.parseInt(customBudget.replace(/[^0-9]/g, ""), 10)
        if (budgetValue <= 50) {
          minPriceLevel = 0
          maxPriceLevel = 1
          optimalPriceLevel = 1
        } else if (budgetValue <= 150) {
          minPriceLevel = 1
          maxPriceLevel = 2
          optimalPriceLevel = 2
        } else {
          minPriceLevel = 2
          maxPriceLevel = 4
          optimalPriceLevel = 3
        }
      }
      break
  }

  // Inicializar resultado
  const result: OptimizedPlacesResult = {
    restaurants: [],
    attractions: [],
    hotels: [],
    shopping: [],
    cafes: [],
    nightlife: [],
  }

  try {
    // Buscar restaurantes optimizados
    const restaurants = await searchOptimizedPlacesByType(
      destination,
      "restaurant",
      minPriceLevel,
      maxPriceLevel,
      optimalPriceLevel,
      coordinates,
      radius,
      budget,
    )
    result.restaurants = restaurants

    // Buscar cafés optimizados
    const cafes = await searchOptimizedPlacesByType(
      destination,
      "cafe",
      minPriceLevel,
      maxPriceLevel,
      optimalPriceLevel,
      coordinates,
      radius,
      budget,
    )
    result.cafes = cafes

    // Buscar vida nocturna optimizada
    const nightlife = await searchOptimizedPlacesByType(
      destination,
      "bar",
      minPriceLevel,
      maxPriceLevel,
      optimalPriceLevel,
      coordinates,
      radius,
      budget,
    )
    result.nightlife = nightlife

    // Buscar atracciones optimizadas
    const attractions = await searchOptimizedPlacesByType(
      destination,
      "tourist_attraction",
      minPriceLevel,
      maxPriceLevel,
      optimalPriceLevel,
      coordinates,
      radius,
      budget,
    )
    result.attractions = attractions

    // Buscar hoteles optimizados
    const hotels = await searchOptimizedPlacesByType(
      destination,
      "lodging",
      minPriceLevel,
      maxPriceLevel,
      optimalPriceLevel,
      coordinates,
      radius,
      budget,
    )
    result.hotels = hotels

    // Buscar tiendas optimizadas
    const shopping = await searchOptimizedPlacesByType(
      destination,
      "shopping_mall",
      minPriceLevel,
      maxPriceLevel,
      optimalPriceLevel,
      coordinates,
      radius,
      budget,
    )
    result.shopping = shopping

    return result
  } catch (error) {
    console.error("Error buscando lugares optimizados:", error)
    return {
      restaurants: [],
      attractions: [],
      hotels: [],
      shopping: [],
      cafes: [],
      nightlife: [],
    }
  }
}

/**
 * Busca lugares optimizados por tipo
 */
async function searchOptimizedPlacesByType(
  destination: string,
  type: string,
  minPriceLevel: number,
  maxPriceLevel: number,
  optimalPriceLevel: number,
  coordinates?: { lat: number; lng: number },
  radius = 5000,
  budget?: string,
): Promise<OptimizedPlace[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.error("API key de Google Places no configurada")
    return []
  }

  try {
    // Construir la URL de la API
    let apiUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      `mejores ${
        type === "restaurant"
          ? "restaurantes"
          : type === "cafe"
            ? "cafeterías"
            : type === "bar"
              ? "bares"
              : type === "tourist_attraction"
                ? "atracciones turísticas"
                : type === "lodging"
                  ? "hoteles"
                  : "tiendas"
      } ${budget === "bajo" ? "económicos" : budget === "medio" ? "precio medio" : "exclusivos"} en ${destination}`,
    )}&type=${type}&key=${GOOGLE_PLACES_API_KEY}`

    // Añadir coordenadas y radio si están disponibles
    if (coordinates) {
      apiUrl += `&location=${coordinates.lat},${coordinates.lng}&radius=${radius}`
    }

    // Realizar la solicitud a la API
    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (data.status === "ZERO_RESULTS") {
      console.log(`No se encontraron resultados para ${type} en ${destination}`)
      return []
    }

    if (data.status !== "OK") {
      console.error("Error en la API de Google Places:", data.status, data.error_message)
      return []
    }

    // Filtrar por nivel de precio y ordenar por calificación
    let results = data.results || []

    // Filtrar lugares cerrados permanentemente
    results = results.filter((place: any) => {
      // Verificar si el lugar está marcado como cerrado permanentemente
      if (place.permanently_closed === true || place.business_status === "CLOSED_PERMANENTLY") {
        console.log(`Lugar optimizado filtrado por estar cerrado permanentemente: ${place.name}`)
        return false
      }
      return true
    })

    // Filtrar por nivel de precio si corresponde
    if (minPriceLevel > 0 || maxPriceLevel < 4) {
      results = results.filter((place: any) => {
        // Si no tiene price_level, asumimos que es nivel 2 (moderado)
        const priceLevel = place.price_level !== undefined ? place.price_level : 2
        return priceLevel >= minPriceLevel && priceLevel <= maxPriceLevel
      })
    }

    // Calcular distancia si tenemos coordenadas
    if (coordinates) {
      results = results.map((place: any) => {
        if (place.geometry && place.geometry.location) {
          const distance = calculateDistance(
            coordinates.lat,
            coordinates.lng,
            place.geometry.location.lat,
            place.geometry.location.lng,
          )
          return { ...place, distance }
        }
        return place
      })
    }

    // Ordenar por una combinación de calificación, número de reseñas y cercanía al nivel de precio óptimo
    results.sort((a: any, b: any) => {
      // Primero, calcular qué tan cerca está cada lugar del nivel de precio óptimo
      const aPriceLevel = a.price_level !== undefined ? a.price_level : 2
      const bPriceLevel = b.price_level !== undefined ? b.price_level : 2

      const aPriceDiff = Math.abs(aPriceLevel - optimalPriceLevel)
      const bPriceDiff = Math.abs(bPriceLevel - optimalPriceLevel)

      // Si hay una diferencia significativa en la cercanía al precio óptimo
      if (aPriceDiff !== bPriceDiff) {
        return aPriceDiff - bPriceDiff // El más cercano al óptimo va primero
      }

      // Si tienen el mismo nivel de precio o la misma distancia al óptimo, ordenar por calificación
      const aRating = a.rating || 0
      const bRating = b.rating || 0

      if (Math.abs(aRating - bRating) > 0.5) {
        // Si hay una diferencia significativa en la calificación
        return bRating - aRating // Mayor calificación primero
      }

      // Si las calificaciones son similares, considerar el número de reseñas
      const aReviews = a.user_ratings_total || 0
      const bReviews = b.user_ratings_total || 0

      // Dar prioridad a lugares con más reseñas
      return bReviews - aReviews
    })

    // Limitar a los 10 mejores resultados
    const topResults = results.slice(0, 10)

    // Mapear a nuestro formato
    return topResults.map((place: any) => ({
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      price_level: place.price_level,
      types: place.types,
      vicinity: place.vicinity,
      location: place.geometry?.location,
      distance: place.distance,
      photos: place.photos,
      opening_hours: place.opening_hours,
    }))
  } catch (error) {
    console.error(`Error buscando ${type} optimizados:`, error)
    return []
  }
}

/**
 * Obtiene los mejores lugares para un itinerario según presupuesto
 */
export async function getBestPlacesForItinerary(
  destination: string,
  budget: "bajo" | "medio" | "alto" | "personalizado",
  customBudget?: string,
  coordinates?: { lat: number; lng: number },
  radius = 5000,
): Promise<string> {
  try {
    const optimizedPlaces = await findOptimizedPlaces(destination, budget, customBudget, coordinates, radius)

    // Crear un texto con los mejores lugares para el prompt
    let placesText = "LUGARES RECOMENDADOS SEGÚN TU PRESUPUESTO:\n\n"

    // Añadir restaurantes
    if (optimizedPlaces.restaurants.length > 0) {
      placesText += "RESTAURANTES RECOMENDADOS:\n"
      optimizedPlaces.restaurants.forEach((restaurant, index) => {
        const priceLevel = restaurant.price_level !== undefined ? "€".repeat(restaurant.price_level) : "€€"

        placesText += `${index + 1}. "${restaurant.name}" - ${priceLevel} - Calificación: ${restaurant.rating?.toFixed(1) || "N/A"}/5`

        if (restaurant.distance) {
          placesText += ` - Distancia: ${restaurant.distance.toFixed(1)} km`
        }

        placesText += "\n"
      })
      placesText += "\n"
    }

    // Añadir cafés
    if (optimizedPlaces.cafes.length > 0) {
      placesText += "CAFETERÍAS RECOMENDADAS:\n"
      optimizedPlaces.cafes.forEach((cafe, index) => {
        const priceLevel = cafe.price_level !== undefined ? "€".repeat(cafe.price_level) : "€"

        placesText += `${index + 1}. "${cafe.name}" - ${priceLevel} - Calificación: ${cafe.rating?.toFixed(1) || "N/A"}/5`

        if (cafe.distance) {
          placesText += ` - Distancia: ${cafe.distance.toFixed(1)} km`
        }

        placesText += "\n"
      })
      placesText += "\n"
    }

    // Añadir vida nocturna
    if (optimizedPlaces.nightlife.length > 0) {
      placesText += "BARES Y VIDA NOCTURNA RECOMENDADOS:\n"
      optimizedPlaces.nightlife.forEach((bar, index) => {
        const priceLevel = bar.price_level !== undefined ? "€".repeat(bar.price_level) : "€€"

        placesText += `${index + 1}. "${bar.name}" - ${priceLevel} - Calificación: ${bar.rating?.toFixed(1) || "N/A"}/5`

        if (bar.distance) {
          placesText += ` - Distancia: ${bar.distance.toFixed(1)} km`
        }

        placesText += "\n"
      })
      placesText += "\n"
    }

    // Añadir atracciones
    if (optimizedPlaces.attractions.length > 0) {
      placesText += "ATRACCIONES RECOMENDADAS:\n"
      optimizedPlaces.attractions.forEach((attraction, index) => {
        placesText += `${index + 1}. "${attraction.name}" - Calificación: ${attraction.rating?.toFixed(1) || "N/A"}/5`

        if (attraction.distance) {
          placesText += ` - Distancia: ${attraction.distance.toFixed(1)} km`
        }

        placesText += "\n"
      })
      placesText += "\n"
    }

    // Añadir hoteles si no se ha seleccionado uno
    if (optimizedPlaces.hotels.length > 0) {
      placesText += "HOTELES RECOMENDADOS:\n"
      optimizedPlaces.hotels.forEach((hotel, index) => {
        const priceLevel = hotel.price_level !== undefined ? "€".repeat(hotel.price_level) : "€€"

        placesText += `${index + 1}. "${hotel.name}" - ${priceLevel} - Calificación: ${hotel.rating?.toFixed(1) || "N/A"}/5`

        if (hotel.distance) {
          placesText += ` - Distancia: ${hotel.distance.toFixed(1)} km`
        }

        placesText += "\n"
      })
      placesText += "\n"
    }

    // Añadir tiendas
    if (optimizedPlaces.shopping.length > 0) {
      placesText += "TIENDAS Y CENTROS COMERCIALES RECOMENDADOS:\n"
      optimizedPlaces.shopping.forEach((shop, index) => {
        const priceLevel = shop.price_level !== undefined ? "€".repeat(shop.price_level) : "€€"

        placesText += `${index + 1}. "${shop.name}" - ${priceLevel} - Calificación: ${shop.rating?.toFixed(1) || "N/A"}/5`

        if (shop.distance) {
          placesText += ` - Distancia: ${shop.distance.toFixed(1)} km`
        }

        placesText += "\n"
      })
    }

    return placesText
  } catch (error) {
    console.error("Error obteniendo los mejores lugares para el itinerario:", error)
    return ""
  }
}
