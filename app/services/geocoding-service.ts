/**
 * Servicio de geocodificación para obtener coordenadas precisas
 */

import { GOOGLE_MAPS_SERVER_API_KEY } from "../config"
import type { Coordinates } from "@/types/itinerary-json"

export interface GeocodingResult {
  coordinates: Coordinates
  formattedAddress: string
  placeId?: string
}

/**
 * Geocodifica una dirección o nombre de lugar para obtener sus coordenadas
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  console.log(`🌍 Geocodificando dirección: "${address}"`)

  if (!GOOGLE_MAPS_SERVER_API_KEY) {
    console.error("API key de Google Maps no configurada")
    return null
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_SERVER_API_KEY}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      console.warn(`No se encontraron resultados para: "${address}"`, data.status)
      return null
    }

    const result = data.results[0]
    const location = result.geometry.location

    console.log(`✅ Geocodificación exitosa para "${address}":`, {
      lat: location.lat,
      lng: location.lng,
      formattedAddress: result.formatted_address,
    })

    return {
      coordinates: {
        lat: location.lat,
        lng: location.lng,
      },
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
    }
  } catch (error) {
    console.error(`Error geocodificando "${address}":`, error)
    return null
  }
}

/**
 * Verifica si las coordenadas son válidas
 */
export function areValidCoordinates(coords: any): coords is Coordinates {
  return (
    coords &&
    typeof coords.lat === "number" &&
    !isNaN(coords.lat) &&
    coords.lat >= -90 &&
    coords.lat <= 90 &&
    typeof coords.lng === "number" &&
    !isNaN(coords.lng) &&
    coords.lng >= -180 &&
    coords.lng <= 180
  )
}

/**
 * Obtiene coordenadas para un lugar, intentando primero con las coordenadas existentes
 * y si no son válidas, geocodificando la dirección
 */
export async function ensureValidCoordinates(
  location: { name: string; address?: string; coordinates?: Coordinates },
  fallbackContext?: string,
): Promise<Coordinates | null> {
  // Si ya tiene coordenadas válidas, las usamos
  if (location.coordinates && areValidCoordinates(location.coordinates)) {
    return location.coordinates
  }

  // Si no tiene coordenadas válidas, intentamos geocodificar
  const searchQuery = location.address || location.name
  const contextQuery = fallbackContext ? `${searchQuery}, ${fallbackContext}` : searchQuery

  const result = await geocodeAddress(contextQuery)
  return result?.coordinates || null
}
