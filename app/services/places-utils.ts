/**
 * Genera un enlace a Google Maps para un lugar basado en su nombre y ubicación
 */
export function generateGoogleMapsLink(placeName: string, destination: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName + " " + destination)}`
}

/**
 * Obtiene detalles mejorados de un lugar combinando información de Google Places
 */
export async function getEnhancedPlaceDetails(placeId: string) {
  try {
    const response = await fetch(`/api/places/details?placeId=${placeId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Error fetching place details: ${response.status}`)
    }

    const data = await response.json()
    return data.result
  } catch (error) {
    console.error("Error in getEnhancedPlaceDetails:", error)
    return null
  }
}
