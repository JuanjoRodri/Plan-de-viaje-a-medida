/**
 * Servicio mejorado para verificación de lugares
 * Este servicio proporciona funciones avanzadas para verificar la existencia y exactitud de lugares turísticos
 */

import { geocodePlace, searchPlaces, verifyPlace as verifyPlaceFromGoogleService } from "./google-places-service"
import { LOCATION_VERIFICATION } from "../config"
import type { PlaceVerificationResult as GooglePlaceVerificationResult } from "./google-places-service" // Para tipado

// Interfaz para el resultado de verificación
export interface VerificationResult {
  isValid: boolean
  confidence: number
  suggestions?: string[]
  details?: {
    name?: string
    type?: string
    country?: string
    region?: string
  }
  exists?: boolean // De PlaceVerificationResult
  similarity?: number // De PlaceVerificationResult
  originalName?: string // De PlaceVerificationResult
  correctedName?: string // De PlaceVerificationResult
  placeId?: string // De PlaceVerificationResult
  address?: string // De PlaceVerificationResult
  placeDetails?: any // De PlaceVerificationResult
  location?: { lat: number; lng: number } // De PlaceVerificationResult
  distanceFromDestination?: number // De PlaceVerificationResult
  metadata?: {
    processingTimeMs: number
    cacheHit: boolean
  }
}

// Caché para almacenar resultados de verificación
const verificationCache = new Map<string, { result: VerificationResult; timestamp: number }>()
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000 // 24 horas

/**
 * Verifica si un destino turístico existe y proporciona sugerencias si es necesario
 * @param destinationName Nombre del destino a verificar
 * @returns Resultado de la verificación con sugerencias si es necesario
 */
export async function verifyDestination(destinationName: string): Promise<VerificationResult> {
  console.log(`Verificando destino: "${destinationName}"`)
  const startTime = Date.now()

  // Normalizar el texto de entrada
  const normalizedDestination = destinationName.trim()
  if (!normalizedDestination) {
    return {
      isValid: false,
      confidence: 0,
      suggestions: ["Por favor, introduce un destino"],
      metadata: {
        processingTimeMs: Date.now() - startTime,
        cacheHit: false,
      },
    }
  }

  // Verificar caché
  const cacheKey = `destination:${normalizedDestination.toLowerCase()}`
  const cachedResult = verificationCache.get(cacheKey)
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_EXPIRATION) {
    console.log(`Usando resultado en caché para: "${normalizedDestination}"`)
    return {
      ...cachedResult.result,
      metadata: {
        ...cachedResult.result.metadata,
        cacheHit: true,
      },
    }
  }

  try {
    // Geocodificar el destino para verificar si existe
    const geocodeResult = await geocodePlace(normalizedDestination)

    if (!geocodeResult) {
      // Si no se puede geocodificar, buscar sugerencias
      const suggestionsResult = await searchPlaces(
        `tourist destination ${normalizedDestination}`,
        undefined,
        "tourist_attraction",
      )

      const suggestions = suggestionsResult.slice(0, 5).map((place) => place.name)

      return {
        isValid: false,
        confidence: 0,
        suggestions,
        metadata: {
          processingTimeMs: Date.now() - startTime,
          cacheHit: false,
        },
      }
    }

    // Calcular confianza basada en la calidad del resultado de geocodificación
    const confidence = calculateDestinationConfidence(normalizedDestination, geocodeResult)

    // Determinar si es un destino turístico válido
    const isValidTouristDestination =
      confidence > LOCATION_VERIFICATION.CONFIDENCE_THRESHOLD &&
      (geocodeResult.locality || geocodeResult.administrativeArea || geocodeResult.country)

    let result: VerificationResult

    if (isValidTouristDestination) {
      // Construir nombre normalizado basado en los componentes disponibles
      let normalizedName = ""
      if (geocodeResult.locality) {
        normalizedName = geocodeResult.locality
        if (geocodeResult.country) {
          normalizedName += `, ${geocodeResult.country}`
        }
      } else if (geocodeResult.administrativeArea) {
        normalizedName = geocodeResult.administrativeArea
        if (geocodeResult.country) {
          normalizedName += `, ${geocodeResult.country}`
        }
      } else {
        normalizedName = geocodeResult.formattedAddress
      }

      result = {
        isValid: true,
        confidence,
        details: {
          name: normalizedName,
          type: "city",
          country: geocodeResult.country,
          region: geocodeResult.administrativeArea,
        },
        metadata: {
          processingTimeMs: Date.now() - startTime,
          cacheHit: false,
        },
      }
    } else {
      // Buscar sugerencias de destinos turísticos cercanos
      const suggestionsResult = await searchPlaces("tourist destination", undefined, "tourist_attraction", {
        lat: geocodeResult.lat,
        lng: geocodeResult.lng,
        radius: 50000, // 50km
      })

      const suggestions = suggestionsResult.slice(0, 5).map((place) => place.name)

      result = {
        isValid: false,
        confidence,
        suggestions,
        metadata: {
          processingTimeMs: Date.now() - startTime,
          cacheHit: false,
        },
      }
    }

    // Guardar en caché
    verificationCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    })

    return result
  } catch (error) {
    console.error("Error verificando destino:", error)
    return {
      isValid: false,
      confidence: 0,
      suggestions: ["Error al verificar el destino. Por favor, inténtalo de nuevo."],
      metadata: {
        processingTimeMs: Date.now() - startTime,
        cacheHit: false,
      },
    }
  }
}

/**
 * Verifica si un lugar específico existe en un destino
 * @param placeName Nombre del lugar a verificar
 * @param destinationName Nombre del destino donde buscar el lugar
 * @returns Resultado de la verificación con sugerencias si es necesario
 */
export async function verifyLocation(
  placeName: string,
  destinationName: string,
): Promise<GooglePlaceVerificationResult> {
  console.log(`Verificando lugar "${placeName}" en destino "${destinationName}"`)

  // Normalizar el texto de entrada
  const normalizedPlace = placeName.trim().toLowerCase()
  const normalizedDestination = destinationName.trim().toLowerCase()

  if (!normalizedPlace || !normalizedDestination) {
    return {
      exists: false,
      similarity: 0,
      originalName: placeName,
      correctedName: placeName,
      placeId: "",
      address: "",
      placeDetails: {},
      location: { lat: 0, lng: 0 },
      distanceFromDestination: 0,
      suggestions: ["Por favor, introduce un lugar y un destino"],
    }
  }

  try {
    // Verificar lugar usando la lógica de google-places-service
    const result = await verifyPlaceFromGoogleService(normalizedPlace, normalizedDestination)
    return result
  } catch (error) {
    console.error("Error verificando lugar:", error)
    return {
      exists: false,
      similarity: 0,
      originalName: placeName,
      correctedName: placeName,
      placeId: "",
      address: "",
      placeDetails: {},
      location: { lat: 0, lng: 0 },
      distanceFromDestination: 0,
      suggestions: ["Error al verificar el lugar. Por favor, inténtalo de nuevo."],
    }
  }
}

// Named export para compatibilidad
export const verifyPlace = verifyLocation

export async function getLocationSuggestions(query: string): Promise<string[]> {
  try {
    const response = await fetch(`/api/places/search?q=${encodeURIComponent(query)}`)

    if (response.ok) {
      const data = await response.json()
      return data.suggestions || []
    }

    return []
  } catch (error) {
    console.error("Error getting location suggestions:", error)
    return []
  }
}

export async function validateDestination(destination: string): Promise<boolean> {
  const result = await verifyLocation(destination, destination)
  return result.exists && result.similarity > 0.7
}

/**
 * Calcula la confianza de un destino basado en el resultado de geocodificación
 */
function calculateDestinationConfidence(input: string, geocodeResult: any): number {
  // Implementación básica - se puede mejorar con más heurísticas
  let confidence = 70 // Base confidence

  // Si encontramos una localidad exacta, aumentar confianza
  if (geocodeResult.locality) {
    confidence += 20
  }

  // Si la dirección formateada contiene el texto de entrada, aumentar confianza
  if (geocodeResult.formattedAddress.toLowerCase().includes(input.toLowerCase())) {
    confidence += 10
  }

  return Math.min(confidence, 100) // Cap at 100
}

/**
 * Calcula la confianza de coincidencia entre dos cadenas
 */
function calculateConfidence(input: string, match: string): number {
  const inputLower = input.toLowerCase()
  const matchLower = match.toLowerCase()

  // Coincidencia exacta
  if (inputLower === matchLower) {
    return 100
  }

  // Coincidencia parcial
  if (matchLower.includes(inputLower) || inputLower.includes(matchLower)) {
    const longerLength = Math.max(inputLower.length, matchLower.length)
    const shorterLength = Math.min(inputLower.length, matchLower.length)
    return Math.round((shorterLength / longerLength) * 100)
  }

  // Calcular distancia de Levenshtein
  const distance = levenshteinDistance(inputLower, matchLower)
  const maxLength = Math.max(inputLower.length, matchLower.length)
  const similarity = 1 - distance / maxLength

  return Math.round(similarity * 100)
}

/**
 * Calcula la distancia de Levenshtein entre dos cadenas
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix = []

  // Inicializar matriz
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  // Llenar matriz
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // sustitución
          Math.min(
            matrix[i][j - 1] + 1, // inserción
            matrix[i - 1][j] + 1, // eliminación
          ),
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

export function clearVerificationCache(): void {
  verificationCache.clear()
  console.log("Caché de verificación limpiada")
}

export function getVerificationCacheStats(): { size: number; hitRate: number } {
  let hits = 0
  let total = 0

  verificationCache.forEach((item) => {
    if (item.result.metadata?.cacheHit) {
      hits++
    }
    total++
  })

  return {
    size: verificationCache.size,
    hitRate: total > 0 ? hits / total : 0,
  }
}
